import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  Menu,
  session,
  shell,
  ipcMain,
  nativeTheme,
  webContents as electronWebContents,
  type Session,
  type WebContents
} from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  BrowserShortcut,
  DownloadUpdate,
  OpenTextFileResult,
  PasswordRecord,
  PluginInfo,
  PrivacySettings,
  RuntimeSettings,
  SaveFileResult,
  SitePermissionInfo,
  ThemeMode,
  UpdateCheckResult
} from '../shared/types'
import { PluginManager } from './plugins/manager'
import { builtinPlugins } from './plugins/registry'
import {
  installExternalPlugin,
  loadExternalPlugins
} from './plugins/external'
import { translateTexts } from './translation'
import { passwordStore } from './passwords'

const NORMAL_PARTITION = 'persist:mingyue'
const PRIVATE_PARTITION = 'mingyue-private'
const APP_NAME = '明月浏览器'

// Keep app data at a stable ASCII path, independent of the localized title.
app.setName(APP_NAME)
app.setPath('userData', join(app.getPath('appData'), 'mingyue-browser'))

let mainWindow: BrowserWindow | null = null
let normalSession: Session | null = null
let privateSession: Session | null = null
let pluginManager: PluginManager | null = null
let doNotTrackEnabled = true
let downloadDirectoryOverride: string | null = null
let windowStateTimer: ReturnType<typeof setTimeout> | null = null
let clearingBeforeQuit = false
let closeGuardEnabled = false
let allowWindowClose = false

const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  doNotTrack: true,
  trackingProtection: 'standard',
  cookieBannerHandling: true,
  clearOnShutdown: 'none',
  httpsOnly: false,
  dohEnabled: false,
  proxyMode: 'system',
  proxyRules: '',
  autoplayPolicy: 'block',
  downloadAskLocation: false,
  downloadDirectory: '',
  downloadOpenWhenDone: false,
  downloadOpenExtensions: []
}

let runtimeSettings: RuntimeSettings = { ...DEFAULT_RUNTIME_SETTINGS }
let sitePermissions: SitePermissionInfo[] = []

interface WindowStateFile {
  x?: number
  y?: number
  width: number
  height: number
  maximized?: boolean
}

const downloadItems = new Map<string, Electron.DownloadItem>()
const downloadPrivacy = new Map<string, boolean>()

function getWindowStatePath(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

function getRuntimeSettingsPath(): string {
  return join(app.getPath('userData'), 'runtime-settings.json')
}

function getSitePermissionsPath(): string {
  return join(app.getPath('userData'), 'site-permissions.json')
}

function loadRuntimeSettings(): RuntimeSettings {
  try {
    const parsed = JSON.parse(
      readFileSync(getRuntimeSettingsPath(), 'utf8')
    ) as Partial<RuntimeSettings>
    return { ...DEFAULT_RUNTIME_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_RUNTIME_SETTINGS }
  }
}

function saveRuntimeSettings(next: RuntimeSettings): void {
  try {
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(getRuntimeSettingsPath(), JSON.stringify(next, null, 2), 'utf8')
  } catch {
    // Settings persistence is best effort.
  }
}

function loadSitePermissions(): SitePermissionInfo[] {
  try {
    const parsed = JSON.parse(
      readFileSync(getSitePermissionsPath(), 'utf8')
    ) as SitePermissionInfo[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSitePermissions(next: SitePermissionInfo[]): void {
  sitePermissions = next
  try {
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(
      getSitePermissionsPath(),
      JSON.stringify(next, null, 2),
      'utf8'
    )
  } catch {
    // Permission exceptions are best effort.
  }
}

async function applyProxySettings(): Promise<void> {
  const mode =
    runtimeSettings.proxyMode === 'manual'
      ? 'fixed_servers'
      : runtimeSettings.proxyMode === 'direct'
        ? 'direct'
        : 'system'
  const proxyRules =
    runtimeSettings.proxyMode === 'manual'
      ? runtimeSettings.proxyRules.trim()
      : undefined
  for (const targetSession of [normalSession, privateSession]) {
    if (!targetSession) continue
    try {
      await targetSession.setProxy(
        proxyRules ? { mode, proxyRules } : { mode }
      )
    } catch {
      // Invalid proxy rules leave the previous session configuration intact.
    }
  }
}

async function applyRuntimeSettings(next: RuntimeSettings): Promise<void> {
  runtimeSettings = { ...DEFAULT_RUNTIME_SETTINGS, ...next }
  doNotTrackEnabled = runtimeSettings.doNotTrack
  downloadDirectoryOverride = runtimeSettings.downloadDirectory || null
  saveRuntimeSettings(runtimeSettings)
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Autoplay policy is applied to new guest webviews through their attributes.
    mainWindow.webContents.send('runtime:settings-changed', runtimeSettings)
  }
  try {
    app.configureHostResolver({
      secureDnsMode: runtimeSettings.dohEnabled ? 'secure' : 'off',
      secureDnsServers: runtimeSettings.dohEnabled
        ? ['https://cloudflare-dns.com/dns-query']
        : []
    })
  } catch {
    // Older Electron versions may not expose runtime DNS configuration.
  }
  await applyProxySettings()
}

function trackRuntimeSettings(settings: RuntimeSettings): void {
  runtimeSettings = { ...DEFAULT_RUNTIME_SETTINGS, ...settings }
}

function loadWindowState(): WindowStateFile {
  try {
    const raw = readFileSync(getWindowStatePath(), 'utf8')
    const parsed = JSON.parse(raw) as WindowStateFile
    if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
      return parsed
    }
  } catch {
    // First launch, or the state file is no longer readable.
  }
  return { width: 1440, height: 900 }
}

function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const maximized = mainWindow.isMaximized()
  const bounds = maximized ? mainWindow.getNormalBounds() : mainWindow.getBounds()
  const state: WindowStateFile = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    maximized
  }
  try {
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(getWindowStatePath(), JSON.stringify(state), 'utf8')
  } catch {
    // Window state is a convenience; never let it block quitting.
  }
}

function scheduleSaveWindowState(): void {
  if (windowStateTimer) clearTimeout(windowStateTimer)
  windowStateTimer = setTimeout(() => {
    windowStateTimer = null
    saveWindowState()
  }, 250)
}

function browserUserAgent(): string {
  const platformToken =
    process.platform === 'win32'
      ? 'Windows NT 10.0; Win64; x64'
      : process.platform === 'darwin'
        ? 'Macintosh; Intel Mac OS X 10_15_7'
        : 'X11; Linux x86_64'
  return `Mozilla/5.0 (${platformToken}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`
}

function sendToRenderer(channel: string, ...args: unknown[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

function openNewTab(url: string, isPrivate = false): void {
  if (!url) return
  sendToRenderer('navigation:new-tab', url, isPrivate)
}

function uniqueDownloadPath(fileName: string): string {
  const folder =
    downloadDirectoryOverride || join(app.getPath('downloads'), 'Mingyue')
  try {
    mkdirSync(folder, { recursive: true })
  } catch {
    // Fall back to the system Downloads folder.
  }
  const safeName = basename(fileName).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_') || 'download'
  const targetFolder =
    existsSync(folder) ? folder : app.getPath('downloads')
  const parsedExt = extname(safeName)
  const stem = parsedExt ? safeName.slice(0, -parsedExt.length) : safeName
  let candidate = join(targetFolder, safeName)
  let index = 1
  while (existsSync(candidate)) {
    candidate = join(targetFolder, `${stem} (${index})${parsedExt}`)
    index += 1
  }
  return candidate
}

function trackDownloads(targetSession: Session, isPrivate: boolean): void {
  targetSession.on('will-download', async (_event, item) => {
    const id = `download-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    let savePath = uniqueDownloadPath(item.getFilename())

    if (runtimeSettings.downloadAskLocation) {
      item.pause()
      const result = mainWindow
        ? await dialog.showSaveDialog(mainWindow, {
            title: '保存下载文件',
            defaultPath: savePath
          })
        : await dialog.showSaveDialog({
            title: '保存下载文件',
            defaultPath: savePath
          })
      if (result.canceled || !result.filePath) {
        item.cancel()
        return
      }
      savePath = result.filePath
    }

    item.setSavePath(savePath)
    downloadItems.set(id, item)
    downloadPrivacy.set(id, isPrivate)

    const base: DownloadUpdate = {
      id,
      fileName: basename(savePath),
      savePath,
      url: item.getURL(),
      state: item.isPaused() ? 'paused' : 'progressing',
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      startedAt: Date.now(),
      isPrivate,
      canResume: item.canResume()
    }

    sendToRenderer('download:update', base)
    if (item.isPaused()) item.resume()

    const pushProgress = (state: DownloadUpdate['state']): void => {
      sendToRenderer('download:update', {
        ...base,
        state:
          state === 'progressing' && item.isPaused() ? 'paused' : state,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        savePath: item.getSavePath() || savePath,
        canResume: item.canResume()
      } satisfies DownloadUpdate)
    }

    item.on('updated', (_event, state) => {
      if (state === 'progressing') {
        pushProgress('progressing')
      } else if (state === 'interrupted') {
        pushProgress('interrupted')
      }
    })

    item.once('done', (_event, state) => {
      if (state === 'completed') {
        pushProgress('completed')
        const extension = extname(item.getSavePath() || savePath)
          .replace(/^\./, '')
          .toLowerCase()
        if (
          runtimeSettings.downloadOpenWhenDone ||
          runtimeSettings.downloadOpenExtensions.includes(extension)
        ) {
          void shell.openPath(item.getSavePath() || savePath)
        }
      } else if (state === 'cancelled') {
        pushProgress('cancelled')
      } else {
        pushProgress('interrupted')
      }
      setTimeout(() => {
        downloadItems.delete(id)
        downloadPrivacy.delete(id)
      }, 60_000)
    })
  })
}

function permissionKindFor(
  permission: string,
  details?: unknown
): SitePermissionInfo['permission'] | null {
  if (permission === 'media') {
    const mediaTypes =
      (details as { mediaTypes?: string[] } | undefined)?.mediaTypes ?? []
    if (mediaTypes.includes('video')) return 'camera'
    if (mediaTypes.includes('audio')) return 'microphone'
    return 'camera'
  }
  if (permission === 'geolocation') return 'geolocation'
  if (permission === 'notifications') return 'notifications'
  if (permission === 'clipboard-read') return 'clipboard-read'
  return null
}

function originForUrl(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

function permissionAllowed(
  webContents: WebContents | null,
  permission: string,
  details?: unknown
): boolean {
  if (!webContents) return false
  const allowed = new Set([
    'fullscreen',
    'clipboard-sanitized-write',
    'pointerLock',
    'accessibilityFeatures.read'
  ])
  if (allowed.has(permission)) return true
  const kind = permissionKindFor(permission, details)
  if (!kind) return false
  const origin = originForUrl(webContents.getURL())
  return sitePermissions.some(
    (entry) =>
      entry.origin === origin &&
      entry.permission === kind &&
      entry.decision === 'allow'
  )
}

function configurePermissions(targetSession: Session): void {
  targetSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      callback(permissionAllowed(webContents, permission, details))
    }
  )
  targetSession.setPermissionCheckHandler(
    (webContents, permission, _requestingOrigin, details) =>
      permissionAllowed(webContents, permission, details)
  )
}

function setupSession(targetSession: Session, isPrivate: boolean): void {
  targetSession.setUserAgent(browserUserAgent())

  targetSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (doNotTrackEnabled) {
      details.requestHeaders.DNT = '1'
      details.requestHeaders['Sec-GPC'] = '1'
    }
    callback({ requestHeaders: details.requestHeaders })
  })

  configurePermissions(targetSession)
  trackDownloads(targetSession, isPrivate)
}

const TRACKER_HOSTS = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'connect.facebook.net',
  'hotjar.com',
  'scorecardresearch.com',
  'criteo.com',
  'taboola.com',
  'outbrain.com',
  'adnxs.com',
  'quantserve.com',
  'amazon-adsystem.com'
]

function privacyNetworkGuard(
  details: Electron.OnBeforeRequestListenerDetails
): import('./plugins/api').PluginRequestDecision | void {
  try {
    const url = new URL(details.url)
    if (
      runtimeSettings.httpsOnly &&
      url.protocol === 'http:' &&
      !/^(localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(
        url.hostname
      ) &&
      !url.hostname.endsWith('.local')
    ) {
      url.protocol = 'https:'
      return { redirectURL: url.toString() }
    }
    if (
      runtimeSettings.trackingProtection === 'strict' &&
      TRACKER_HOSTS.some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
      )
    ) {
      return { cancel: true }
    }
  } catch {
    // Ignore malformed URLs.
  }
}

const COOKIE_BANNER_SCRIPT = `
(() => {
  if (window.__mingyueCookieBannerHandled) return;
  window.__mingyueCookieBannerHandled = true;
  const selectors = [
    '#onetrust-banner-sdk', '#onetrust-consent-sdk', '#cookie-banner',
    '#cookie-consent', '#cookieConsent', '#gdpr-banner', '#gdpr-consent',
    '.cookie-banner', '.cookie-consent', '.cookie-notice', '.cookie-policy',
    '[id*="cookie"][class*="banner"]', '[class*="cookie"][class*="consent"]'
  ];
  const hide = () => {
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((node) => {
        if (node instanceof HTMLElement && node.offsetHeight > 0) {
          node.style.setProperty('display', 'none', 'important');
        }
      });
    }
  };
  hide();
  const timer = setInterval(hide, 800);
  setTimeout(() => clearInterval(timer), 12000);
})()
`

function setupContextMenu(contents: WebContents): void {
  contents.on('context-menu', (_event, params) => {
    const template: Electron.MenuItemConstructorOptions[] = []

    if (params.linkURL) {
      template.push({
        label: '在新标签页中打开链接',
        click: () => openNewTab(params.linkURL, isPrivateGuest(contents))
      })
      template.push({
        label: '复制链接地址',
        click: () => clipboard.writeText(params.linkURL)
      })
      template.push({ type: 'separator' })
    }

    if (params.isEditable) {
      template.push(
        { label: '撤销', role: 'undo', enabled: params.editFlags.canUndo },
        { label: '重做', role: 'redo', enabled: params.editFlags.canRedo },
        { type: 'separator' },
        { label: '剪切', role: 'cut', enabled: params.editFlags.canCut },
        { label: '复制', role: 'copy', enabled: params.editFlags.canCopy },
        { label: '粘贴', role: 'paste', enabled: params.editFlags.canPaste },
        { label: '全选', role: 'selectAll', enabled: params.editFlags.canSelectAll }
      )
    } else if (params.selectionText) {
      template.push({ label: '复制', role: 'copy' })
    }

    if (template.length > 0) template.push({ type: 'separator' })

    template.push(
      { label: '后退', enabled: contents.canGoBack(), click: () => contents.goBack() },
      { label: '前进', enabled: contents.canGoForward(), click: () => contents.goForward() },
      { label: '重新加载', click: () => contents.reload() },
      { type: 'separator' },
      {
        label: '检查页面',
        click: () => {
          if (!contents.isDevToolsOpened()) contents.openDevTools({ mode: 'detach' })
        }
      }
    )

    Menu.buildFromTemplate(template).popup({ window: mainWindow ?? undefined })
  })
}

function isBrowserGuest(contents: WebContents): boolean {
  return contents.getType() === 'webview'
}

function isPrivateGuest(contents: WebContents): boolean {
  return privateSession !== null && contents.session === privateSession
}

function isTrustedShellNavigation(
  targetUrl: string,
  allowedRendererUrl: string
): boolean {
  try {
    const target = new URL(targetUrl)
    const allowed = new URL(allowedRendererUrl)
    return (
      target.protocol === allowed.protocol &&
      target.host === allowed.host &&
      target.pathname === allowed.pathname
    )
  } catch {
    return false
  }
}

function detectShortcut(
  input: Electron.Input
): BrowserShortcut | null {
  if (input.type !== 'keyDown') return null
  const key = input.key.toLowerCase()
  const modifier = input.control || input.meta
  const alt = input.alt

  if (input.key === 'F12') return 'devtools'
  if (input.key === 'F11') return 'toggle-fullscreen'
  if (alt && input.key === 'ArrowLeft') return 'back'
  if (alt && input.key === 'ArrowRight') return 'forward'
  if (modifier && !input.shift && key === 't') return 'new-tab'
  if (modifier && input.shift && key === 't') return 'reopen-tab'
  if (modifier && input.shift && key === 'n') return 'new-private-tab'
  if (modifier && !input.shift && key === 'w') return 'close-tab'
  if (modifier && !input.shift && key === 'l') return 'focus-address'
  if (modifier && !input.shift && key === 'r') return 'reload'
  if (modifier && input.shift && key === 'r') return 'hard-reload'
  if (modifier && !input.shift && key === 'd') return 'bookmark-page'
  if (modifier && !input.shift && key === 'f') return 'find'
  if (modifier && !input.shift && key === 'h') return 'history'
  if (modifier && input.shift && key === 'j') return 'downloads'
  if (modifier && !input.shift && key === 'j') return 'downloads'
  if (modifier && !input.shift && key === 'k') return 'command-palette'
  if (modifier && input.shift && key === 'a') return 'tab-search'
  if (modifier && !input.shift && key === 'p') return 'print'
  if (modifier && input.shift && key === 'i') return 'devtools'
  if (modifier && key === ',') return 'settings'
  if (modifier && input.shift && key === 'b') return 'bookmarks'
  if (modifier && input.key === 'Tab') return input.shift ? 'previous-tab' : 'next-tab'
  if (modifier && (key === '+' || key === '=')) return 'zoom-in'
  if (modifier && key === '-') return 'zoom-out'
  if (modifier && key === '0') return 'zoom-reset'
  return null
}

function wireGuestContents(contents: WebContents): void {
  contents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      openNewTab(url, isPrivateGuest(contents))
    }
    return { action: 'deny' }
  })

  contents.on('before-input-event', (event, input) => {
    const action = detectShortcut(input)
    if (!action) return
    event.preventDefault()
    sendToRenderer('navigation:shortcut', action)
  })

  contents.on('dom-ready', () => {
    if (runtimeSettings.cookieBannerHandling && !contents.isDestroyed()) {
      void contents.executeJavaScript(COOKIE_BANNER_SCRIPT, true).catch(() => {
        // Some internal pages intentionally reserve the page script context.
      })
    }
  })

  setupContextMenu(contents)
}

function createWindow(): void {
  const saved = loadWindowState()
  const iconPath = join(app.getAppPath(), 'resources', 'icon.png')

  mainWindow = new BrowserWindow({
    width: saved.width,
    height: saved.height,
    x: saved.x,
    y: saved.y,
    minWidth: 390,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: '#eef1ea',
    title: APP_NAME,
    icon: existsSync(iconPath) ? iconPath : undefined,
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      spellcheck: true
    }
  })

  mainWindow.setMenuBarVisibility(false)
  if (saved.maximized) mainWindow.maximize()

  const allowedRendererUrl =
    !app.isPackaged && process.env.ELECTRON_RENDERER_URL
      ? process.env.ELECTRON_RENDERER_URL
      : pathToFileURL(join(__dirname, '../renderer/index.html')).href
  const guardShellNavigation = (
    event: Electron.Event,
    targetUrl: string
  ): void => {
    if (isTrustedShellNavigation(targetUrl, allowedRendererUrl)) return
    event.preventDefault()
    if (/^https?:\/\//i.test(targetUrl)) openNewTab(targetUrl)
  }
  mainWindow.webContents.on('will-navigate', guardShellNavigation)
  mainWindow.webContents.on('will-redirect', guardShellNavigation)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) openNewTab(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-attach-webview', (_event, webPreferences, params) => {
    delete webPreferences.preload
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true
    webPreferences.sandbox = true
    webPreferences.webSecurity = true
    webPreferences.allowRunningInsecureContent = false
    if (params.partition !== NORMAL_PARTITION && params.partition !== PRIVATE_PARTITION) {
      params.partition = NORMAL_PARTITION
    }
  })

  mainWindow.on('maximize', () => sendToRenderer('window:maximize-changed', true))
  mainWindow.on('unmaximize', () => sendToRenderer('window:maximize-changed', false))
  mainWindow.on('resize', scheduleSaveWindowState)
  mainWindow.on('move', scheduleSaveWindowState)
  mainWindow.on('close', (event) => {
    if (windowStateTimer) clearTimeout(windowStateTimer)
    saveWindowState()
    if (!closeGuardEnabled || allowWindowClose) return
    event.preventDefault()
    void dialog
      .showMessageBox(mainWindow!, {
        type: 'question',
        title: '关闭明月浏览器',
        message: '当前打开了多个标签页',
        detail: '确定要关闭所有标签页并退出明月浏览器吗？',
        buttons: ['关闭浏览器', '取消'],
        defaultId: 1,
        cancelId: 1,
        noLink: true
      })
      .then((result) => {
        if (result.response !== 0) return
        allowWindowClose = true
        mainWindow?.close()
      })
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    if (saved.maximized) mainWindow?.maximize()
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function saveBufferWithDialog(
  defaultName: string,
  data: Buffer,
  filters: Electron.FileFilter[],
  defaultDirectory?: string
): Promise<SaveFileResult | null> {
  const options: Electron.SaveDialogOptions = {
    title: '保存文件',
    defaultPath: join(defaultDirectory ?? app.getPath('downloads'), defaultName),
    filters
  }
  const result = mainWindow
    ? await dialog.showSaveDialog(mainWindow, options)
    : await dialog.showSaveDialog(options)
  if (result.canceled || !result.filePath) return null
  writeFileSync(result.filePath, data)
  return { path: result.filePath, name: basename(result.filePath) }
}

function registerIpc(): void {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:toggle-maximize', () => {
    if (!mainWindow) return false
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
    return mainWindow.isMaximized()
  })
  ipcMain.handle('window:close', () => mainWindow?.close())
  ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
  ipcMain.handle('window:toggle-fullscreen', () => {
    if (!mainWindow) return false
    const next = !mainWindow.isFullScreen()
    mainWindow.setFullScreen(next)
    return next
  })
  ipcMain.handle('window:set-close-guard', (_event, enabled: boolean) => {
    closeGuardEnabled = Boolean(enabled)
  })

  ipcMain.handle('downloads:cancel', (_event, id: string) => {
    downloadItems.get(id)?.cancel()
  })
  ipcMain.handle('downloads:pause', (_event, id: string) => {
    const item = downloadItems.get(id)
    if (!item || item.getState() !== 'progressing') return false
    item.pause()
    sendToRenderer('download:update', {
      id,
      fileName: basename(item.getSavePath()),
      savePath: item.getSavePath(),
      url: item.getURL(),
      state: 'paused',
      receivedBytes: item.getReceivedBytes(),
      totalBytes: item.getTotalBytes(),
      startedAt: Date.now(),
      isPrivate: downloadPrivacy.get(id) ?? false,
      canResume: item.canResume()
    } satisfies DownloadUpdate)
    return true
  })
  ipcMain.handle('downloads:resume', (_event, id: string) => {
    const item = downloadItems.get(id)
    if (!item || item.getState() !== 'progressing') return false
    item.resume()
    return true
  })
  ipcMain.handle('downloads:open', async (_event, path: string) => {
    return shell.openPath(path)
  })
  ipcMain.handle('downloads:show-in-folder', (_event, path: string) => {
    shell.showItemInFolder(path)
  })
  ipcMain.handle('downloads:choose-directory', async (): Promise<string | null> => {
    const options: Electron.OpenDialogOptions = {
      title: '选择下载文件夹',
      defaultPath:
        downloadDirectoryOverride ||
        join(app.getPath('downloads'), 'Mingyue'),
      properties: ['openDirectory', 'createDirectory']
    }
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
  ipcMain.handle('downloads:set-directory', (_event, path: string) => {
    downloadDirectoryOverride = typeof path === 'string' && path ? path : null
    if (downloadDirectoryOverride) {
      try {
        mkdirSync(downloadDirectoryOverride, { recursive: true })
      } catch {
        downloadDirectoryOverride = null
      }
    }
  })

  ipcMain.handle('privacy:set', (_event, settings: PrivacySettings) => {
    doNotTrackEnabled = Boolean(settings.doNotTrack)
  })
  ipcMain.handle(
    'privacy:apply',
    async (_event, settings: RuntimeSettings) => {
      await applyRuntimeSettings(settings)
    }
  )
  ipcMain.handle('permissions:list', (): SitePermissionInfo[] => sitePermissions)
  ipcMain.handle(
    'permissions:set',
    (_event, permission: SitePermissionInfo): SitePermissionInfo[] => {
      const next = sitePermissions.filter((entry) => entry.id !== permission.id)
      next.push({ ...permission, updatedAt: Date.now() })
      saveSitePermissions(next)
      return next
    }
  )
  ipcMain.handle('permissions:remove', (_event, id: string): SitePermissionInfo[] => {
    const next = sitePermissions.filter((entry) => entry.id !== id)
    saveSitePermissions(next)
    return next
  })

  ipcMain.handle('passwords:list', (): PasswordRecord[] => passwordStore.list())
  ipcMain.handle(
    'passwords:save',
    (_event, entry: PasswordRecord): PasswordRecord[] => passwordStore.save(entry)
  )
  ipcMain.handle(
    'passwords:remove',
    (_event, id: string): PasswordRecord[] => passwordStore.remove(id)
  )
  ipcMain.handle(
    'passwords:import-csv',
    (_event, csv: string): PasswordRecord[] => passwordStore.importCsv(csv)
  )
  ipcMain.handle(
    'passwords:check-breach',
    (_event, password: string) => passwordStore.checkBreach(password)
  )

  ipcMain.handle('files:open-text', async (): Promise<OpenTextFileResult | null> => {
    const options: Electron.OpenDialogOptions = {
      title: '打开文件',
      properties: ['openFile'],
      filters: [
        { name: '文本文件', extensions: ['txt', 'html', 'htm', 'json', 'csv'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    }
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return null
    const path = result.filePaths[0]
    return {
      path,
      name: basename(path),
      content: readFileSync(path, 'utf8')
    }
  })
  ipcMain.handle(
    'files:save-text',
    async (
      _event,
      defaultName: string,
      content: string,
      filters?: Electron.FileFilter[]
    ): Promise<SaveFileResult | null> => {
      const options: Electron.SaveDialogOptions = {
        title: '保存文件',
        defaultPath: join(app.getPath('downloads'), defaultName),
        filters: filters ?? [{ name: '所有文件', extensions: ['*'] }]
      }
      const result = mainWindow
        ? await dialog.showSaveDialog(mainWindow, options)
        : await dialog.showSaveDialog(options)
      if (result.canceled || !result.filePath) return null
      writeFileSync(result.filePath, content, 'utf8')
      return { path: result.filePath, name: basename(result.filePath) }
    }
  )

  ipcMain.handle(
    'screenshots:capture',
    async (
      _event,
      webContentsId: number,
      mode: 'visible' | 'full',
      rect?: { x: number; y: number; width: number; height: number }
    ): Promise<SaveFileResult | null> => {
      const contents = electronWebContents.fromId(webContentsId)
      if (!contents || contents.isDestroyed()) return null
      let image: Electron.NativeImage
      if (mode === 'full') {
        const debuggerSession = contents.debugger
        let attachedHere = false
        try {
          if (!debuggerSession.isAttached()) {
            debuggerSession.attach('1.3')
            attachedHere = true
          }
          const result = (await debuggerSession.sendCommand(
            'Page.captureScreenshot',
            {
              format: 'png',
              fromSurface: true,
              captureBeyondViewport: true
            }
          )) as { data: string }
          image = Electron.nativeImage.createFromBuffer(
            Buffer.from(result.data, 'base64')
          )
        } finally {
          if (attachedHere && debuggerSession.isAttached()) {
            debuggerSession.detach()
          }
        }
      } else {
        image = await contents.capturePage(rect)
      }
      const stamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19)
      return saveBufferWithDialog(
        `明月截图-${stamp}.png`,
        image.toPNG(),
        [{ name: 'PNG 图片', extensions: ['png'] }],
        app.getPath('pictures')
      )
    }
  )
  ipcMain.handle(
    'screenshots:save-pdf',
    async (_event, webContentsId: number): Promise<SaveFileResult | null> => {
      const contents = electronWebContents.fromId(webContentsId)
      if (!contents || contents.isDestroyed()) return null
      const data = await contents.printToPDF({
        printBackground: true,
        pageSize: 'A4'
      })
      return saveBufferWithDialog(
        '明月页面.pdf',
        data,
        [{ name: 'PDF 文档', extensions: ['pdf'] }],
        app.getPath('documents')
      )
    }
  )

  ipcMain.handle(
    'search:suggest',
    async (_event, url: string, query: string): Promise<string[]> => {
      if (!/^https:\/\//i.test(url) || typeof query !== 'string') return []
      try {
        const response = await fetch(`${url}${encodeURIComponent(query)}`, {
          signal: AbortSignal.timeout(5000),
          headers: {
            Accept: 'application/json,text/plain,*/*',
            'User-Agent': browserUserAgent()
          }
        })
        if (!response.ok) return []
        const text = await response.text()
        const candidates = new Set<string>()
        const arrayMatch = text.match(/\[(?:[^\[\]]|\[[^\]]*\])*\]/g)
        for (const match of arrayMatch ?? []) {
          try {
            const parsed = JSON.parse(match) as unknown
            const visit = (value: unknown): void => {
              if (typeof value === 'string') {
                if (value.toLowerCase() !== query.toLowerCase()) {
                  candidates.add(value)
                }
              } else if (Array.isArray(value)) {
                value.forEach(visit)
              } else if (value && typeof value === 'object') {
                const phrase = (value as { phrase?: unknown }).phrase
                if (typeof phrase === 'string') candidates.add(phrase)
              }
            }
            visit(parsed)
          } catch {
            // Some suggestion services use JSONP or other wrappers.
          }
        }
        if (candidates.size === 0) {
          for (const match of text.matchAll(/"([^"]{1,80})"/g)) {
            if (match[1].toLowerCase() !== query.toLowerCase()) {
              candidates.add(match[1])
            }
          }
        }
        return Array.from(candidates).slice(0, 6)
      } catch {
        return []
      }
    }
  )

  ipcMain.handle('system:set-login-item', (_event, openAtLogin: boolean) => {
    app.setLoginItemSettings({ openAtLogin: Boolean(openAtLogin) })
    return app.getLoginItemSettings().openAtLogin
  })
  ipcMain.handle('system:get-login-item', () =>
    app.getLoginItemSettings().openAtLogin
  )
  ipcMain.handle('system:open-default-apps', async () => {
    if (process.platform === 'win32') {
      await shell.openExternal('ms-settings:defaultapps')
    } else {
      await shell.openExternal('https://support.mozilla.org/kb/make-firefox-default-browser')
    }
  })
  ipcMain.handle('system:check-updates', (): UpdateCheckResult => ({
    status: 'unsupported',
    version: app.getVersion(),
    message: '源码运行版不包含自动更新服务；打包发布后可通过发布通道提供更新。'
  }))

  ipcMain.handle(
    'appearance:set-theme',
    (_event, mode: ThemeMode) => {
      const nextMode: ThemeMode =
        mode === 'dark' || mode === 'system' || mode === 'light'
          ? mode
          : 'system'
      nativeTheme.themeSource = nextMode
      const dark =
        nextMode === 'dark' ||
        (nextMode === 'system' && nativeTheme.shouldUseDarkColors)
      mainWindow?.setBackgroundColor(dark ? '#101c17' : '#eef1ea')
    }
  )

  ipcMain.handle('plugins:list', (): PluginInfo[] => pluginManager?.list() ?? [])
  ipcMain.handle(
    'plugins:set-enabled',
    async (_event, id: string, enabled: boolean): Promise<PluginInfo[]> => {
      if (!pluginManager) return []
      return pluginManager.setEnabled(id, Boolean(enabled))
    }
  )
  ipcMain.handle(
    'plugins:install-local',
    async (): Promise<PluginInfo[]> => {
      if (!pluginManager) return []
      const options: Electron.OpenDialogOptions = {
        title: '安装本地扩展',
        properties: ['openFile'],
        filters: [{ name: '明月扩展清单', extensions: ['json'] }]
      }
      const result = mainWindow
        ? await dialog.showOpenDialog(mainWindow, options)
        : await dialog.showOpenDialog(options)
      if (result.canceled || result.filePaths.length === 0) return pluginManager.list()
      const plugin = installExternalPlugin(result.filePaths[0])
      if (!plugin) return pluginManager.list()
      return pluginManager.register(plugin)
    }
  )
  ipcMain.handle(
    'plugins:remove-local',
    async (_event, id: string): Promise<PluginInfo[]> => {
      if (!pluginManager) return []
      return pluginManager.remove(id)
    }
  )

  ipcMain.handle(
    'translation:translate',
    async (_event, texts: unknown, target: unknown) => {
      if (
        !Array.isArray(texts) ||
        texts.length > 300 ||
        texts.some((text) => typeof text !== 'string')
      ) {
        throw new Error('翻译请求格式无效')
      }
      const translationTarget =
        target === 'zh-TW' || target === 'en' || target === 'ja'
          ? target
          : 'zh-CN'
      return translateTexts(texts, translationTarget)
    }
  )

  ipcMain.handle('app:info', () => ({
    name: APP_NAME,
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    platform: process.platform === 'win32' ? 'win64' : process.platform
  }))

  ipcMain.handle('app:clear-browsing-data', async (_event, scope: 'cache' | 'cookies' | 'all') => {
    const sessions = [normalSession, privateSession].filter(Boolean) as Session[]
    for (const target of sessions) {
      if (scope === 'cache' || scope === 'all') {
        await target.clearCache()
      }
      if (scope === 'cookies' || scope === 'all') {
        await target.clearStorageData({
          storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage']
        })
      }
    }
  })
}

const singleInstanceLock = app.requestSingleInstanceLock()
if (!singleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    if (process.platform === 'win32') app.setAppUserModelId('com.mingyue.browser')
    nativeTheme.themeSource = 'system'
    Menu.setApplicationMenu(null)

    runtimeSettings = loadRuntimeSettings()
    sitePermissions = loadSitePermissions()
    downloadDirectoryOverride = runtimeSettings.downloadDirectory || null

    normalSession = session.fromPartition(NORMAL_PARTITION)
    privateSession = session.fromPartition(PRIVATE_PARTITION)
    setupSession(normalSession, false)
    setupSession(privateSession, true)
    await applyRuntimeSettings(runtimeSettings)

    pluginManager = new PluginManager({
      plugins: [...builtinPlugins, ...loadExternalPlugins()],
      sessions: [normalSession, privateSession],
      onChanged: (plugins) => sendToRenderer('plugins:changed', plugins),
      onBlockedCount: (count) => sendToRenderer('plugins:blocked-count', count),
      networkGuard: privacyNetworkGuard
    })
    void pluginManager.initialize()

    app.on('web-contents-created', (_event, contents) => {
      if (isBrowserGuest(contents)) {
        wireGuestContents(contents)
        pluginManager?.attachToContents(contents)
      }
    })

    nativeTheme.on('updated', () => {
      mainWindow?.setBackgroundColor(
        nativeTheme.shouldUseDarkColors ? '#101c17' : '#eef1ea'
      )
    })

    registerIpc()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('before-quit', (event) => {
    saveWindowState()
    if (
      clearingBeforeQuit ||
      runtimeSettings.clearOnShutdown === 'none'
    ) {
      return
    }
    const scope = runtimeSettings.clearOnShutdown
    clearingBeforeQuit = true
    event.preventDefault()
    const sessions = [normalSession, privateSession].filter(
      Boolean
    ) as Session[]
    Promise.all(
      sessions.map(async (target) => {
        try {
          if (scope === 'cache' || scope === 'all') {
            await target.clearCache()
          }
          if (scope === 'cookies' || scope === 'all') {
            await target.clearStorageData({
              storages: [
                'cookies',
                'localstorage',
                'indexdb',
                'serviceworkers',
                'cachestorage'
              ]
            })
          }
        } catch {
          // Quit regardless of cleanup failures.
        }
      })
    ).finally(() => {
      setTimeout(() => app.quit(), 50)
    })
  })
}
