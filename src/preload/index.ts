import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppInfo,
  BrowserShortcut,
  DownloadUpdate,
  MingyueAPI,
  OpenTextFileResult,
  PasswordBreachResult,
  PasswordRecord,
  PluginInfo,
  PrivacySettings,
  RuntimeSettings,
  SaveFileResult,
  SitePermissionInfo,
  ThemeMode,
  TranslationResponse,
  UpdateCheckResult
} from '../shared/types'

function subscribe<T extends unknown[]>(
  channel: string,
  callback: (...args: T) => void
): () => void {
  const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => {
    callback(...(args as T))
  }
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api: MingyueAPI = {
  platform: process.platform,
  isElectron: true,
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
    setCloseGuard: (enabled) =>
      ipcRenderer.invoke('window:set-close-guard', enabled),
    onMaximizeChange: (callback) =>
      subscribe<[boolean]>('window:maximize-changed', callback)
  },
  downloads: {
    onUpdate: (callback) =>
      subscribe<[DownloadUpdate]>('download:update', callback),
    cancel: (id) => ipcRenderer.invoke('downloads:cancel', id),
    pause: (id) => ipcRenderer.invoke('downloads:pause', id),
    resume: (id) => ipcRenderer.invoke('downloads:resume', id),
    open: (path) => ipcRenderer.invoke('downloads:open', path),
    showInFolder: (path) => ipcRenderer.invoke('downloads:show-in-folder', path),
    chooseDirectory: () => ipcRenderer.invoke('downloads:choose-directory'),
    setDirectory: (path) => ipcRenderer.invoke('downloads:set-directory', path)
  },
  privacy: {
    set: (settings: PrivacySettings) => ipcRenderer.invoke('privacy:set', settings),
    apply: (settings: RuntimeSettings) => ipcRenderer.invoke('privacy:apply', settings),
    listPermissions: (): Promise<SitePermissionInfo[]> =>
      ipcRenderer.invoke('permissions:list'),
    setPermission: (permission): Promise<SitePermissionInfo[]> =>
      ipcRenderer.invoke('permissions:set', permission),
    removePermission: (id): Promise<SitePermissionInfo[]> =>
      ipcRenderer.invoke('permissions:remove', id)
  },
  passwords: {
    list: (): Promise<PasswordRecord[]> => ipcRenderer.invoke('passwords:list'),
    save: (entry): Promise<PasswordRecord[]> =>
      ipcRenderer.invoke('passwords:save', entry),
    remove: (id): Promise<PasswordRecord[]> =>
      ipcRenderer.invoke('passwords:remove', id),
    importCsv: (csv): Promise<PasswordRecord[]> =>
      ipcRenderer.invoke('passwords:import-csv', csv),
    checkBreach: (password): Promise<PasswordBreachResult> =>
      ipcRenderer.invoke('passwords:check-breach', password)
  },
  files: {
    openText: (): Promise<OpenTextFileResult | null> =>
      ipcRenderer.invoke('files:open-text'),
    saveText: (defaultName, content, filters): Promise<SaveFileResult | null> =>
      ipcRenderer.invoke('files:save-text', defaultName, content, filters)
  },
  screenshots: {
    capture: (webContentsId, mode, rect): Promise<SaveFileResult | null> =>
      ipcRenderer.invoke('screenshots:capture', webContentsId, mode, rect),
    savePdf: (webContentsId): Promise<SaveFileResult | null> =>
      ipcRenderer.invoke('screenshots:save-pdf', webContentsId)
  },
  search: {
    suggest: (url, query): Promise<string[]> =>
      ipcRenderer.invoke('search:suggest', url, query)
  },
  system: {
    setLoginItem: (openAtLogin): Promise<boolean> =>
      ipcRenderer.invoke('system:set-login-item', openAtLogin),
    getLoginItem: (): Promise<boolean> =>
      ipcRenderer.invoke('system:get-login-item'),
    openDefaultApps: (): Promise<void> =>
      ipcRenderer.invoke('system:open-default-apps'),
    checkForUpdates: (): Promise<UpdateCheckResult> =>
      ipcRenderer.invoke('system:check-updates')
  },
  appearance: {
    setTheme: (mode: ThemeMode) =>
      ipcRenderer.invoke('appearance:set-theme', mode)
  },
  plugins: {
    list: (): Promise<PluginInfo[]> => ipcRenderer.invoke('plugins:list'),
    setEnabled: (id, enabled): Promise<PluginInfo[]> =>
      ipcRenderer.invoke('plugins:set-enabled', id, enabled),
    installLocal: (): Promise<PluginInfo[]> =>
      ipcRenderer.invoke('plugins:install-local'),
    removeLocal: (id): Promise<PluginInfo[]> =>
      ipcRenderer.invoke('plugins:remove-local', id),
    onChanged: (callback) =>
      subscribe<[PluginInfo[]]>('plugins:changed', callback),
    onBlockedCount: (callback) =>
      subscribe<[number]>('plugins:blocked-count', callback)
  },
  translation: {
    translate: (texts, target): Promise<TranslationResponse> =>
      ipcRenderer.invoke('translation:translate', texts, target)
  },
  navigation: {
    onNewTab: (callback) =>
      subscribe<[string, boolean]>('navigation:new-tab', callback),
    onShortcut: (callback) =>
      subscribe<[BrowserShortcut]>('navigation:shortcut', callback)
  },
  app: {
    info: (): Promise<AppInfo> => ipcRenderer.invoke('app:info'),
    clearBrowsingData: (scope) =>
      ipcRenderer.invoke('app:clear-browsing-data', scope)
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('mingyue', api)
} else {
  // Belt-and-braces fallback for environments without context isolation.
  ;(globalThis as unknown as { mingyue: MingyueAPI }).mingyue = api
}
