export type DownloadState =
  | 'progressing'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'interrupted'

export interface DownloadUpdate {
  id: string
  fileName: string
  savePath: string
  url: string
  state: DownloadState
  receivedBytes: number
  totalBytes: number
  startedAt: number
  isPrivate: boolean
  canResume?: boolean
}

export interface SaveFileResult {
  path: string
  name: string
}

export interface OpenTextFileResult {
  path: string
  name: string
  content: string
}

export interface RuntimeSettings {
  doNotTrack: boolean
  trackingProtection: 'standard' | 'strict'
  cookieBannerHandling: boolean
  clearOnShutdown: 'none' | 'cache' | 'cookies' | 'all'
  httpsOnly: boolean
  dohEnabled: boolean
  proxyMode: 'system' | 'direct' | 'manual'
  proxyRules: string
  autoplayPolicy: 'block' | 'allow'
  downloadAskLocation: boolean
  downloadDirectory: string
  downloadOpenWhenDone: boolean
  downloadOpenExtensions: string[]
}

export interface PasswordRecord {
  id: string
  title: string
  url: string
  username: string
  password: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface PasswordBreachResult {
  checked: boolean
  count: number
  message: string
}

export interface SitePermissionInfo {
  id: string
  origin: string
  permission:
    | 'camera'
    | 'microphone'
    | 'geolocation'
    | 'notifications'
    | 'clipboard-read'
  decision: 'allow' | 'deny'
  updatedAt: number
}

export interface UpdateCheckResult {
  status: 'current' | 'available' | 'unsupported'
  version: string
  message: string
}

export interface AppInfo {
  name: string
  version: string
  electron: string
  chrome: string
  platform: string
}

export interface PrivacySettings {
  doNotTrack: boolean
}

export type ThemeMode = 'light' | 'dark' | 'system'

export type PluginStatus = 'active' | 'loading' | 'disabled' | 'error'

export interface PluginInfo {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  license: string
  enabled: boolean
  status: PluginStatus
  blockedCount: number
  builtin: boolean
  detail?: string
}

export type TranslationTarget = 'zh-CN' | 'zh-TW' | 'en' | 'ja'

export interface TranslationResponse {
  translations: string[]
  provider: string
}

export type BrowserShortcut =
  | 'new-tab'
  | 'new-private-tab'
  | 'close-tab'
  | 'reopen-tab'
  | 'focus-address'
  | 'reload'
  | 'hard-reload'
  | 'bookmark-page'
  | 'find'
  | 'history'
  | 'downloads'
  | 'bookmarks'
  | 'settings'
  | 'command-palette'
  | 'tab-search'
  | 'back'
  | 'forward'
  | 'next-tab'
  | 'previous-tab'
  | 'devtools'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
  | 'toggle-fullscreen'
  | 'print'

export interface MingyueAPI {
  platform: string
  isElectron: true
  window: {
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<boolean>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    toggleFullscreen: () => Promise<boolean>
    setCloseGuard: (enabled: boolean) => Promise<void>
    onMaximizeChange: (callback: (maximized: boolean) => void) => () => void
  }
  downloads: {
    onUpdate: (callback: (download: DownloadUpdate) => void) => () => void
    cancel: (id: string) => Promise<void>
    pause: (id: string) => Promise<boolean>
    resume: (id: string) => Promise<boolean>
    open: (path: string) => Promise<string>
    showInFolder: (path: string) => Promise<void>
    chooseDirectory: () => Promise<string | null>
    setDirectory: (path: string) => Promise<void>
  }
  privacy: {
    set: (settings: PrivacySettings) => Promise<void>
    apply: (settings: RuntimeSettings) => Promise<void>
    listPermissions: () => Promise<SitePermissionInfo[]>
    setPermission: (
      permission: SitePermissionInfo
    ) => Promise<SitePermissionInfo[]>
    removePermission: (id: string) => Promise<SitePermissionInfo[]>
  }
  passwords: {
    list: () => Promise<PasswordRecord[]>
    save: (entry: PasswordRecord) => Promise<PasswordRecord[]>
    remove: (id: string) => Promise<PasswordRecord[]>
    importCsv: (csv: string) => Promise<PasswordRecord[]>
    checkBreach: (password: string) => Promise<PasswordBreachResult>
  }
  files: {
    openText: () => Promise<OpenTextFileResult | null>
    saveText: (
      defaultName: string,
      content: string,
      filters?: Array<{ name: string; extensions: string[] }>
    ) => Promise<SaveFileResult | null>
  }
  screenshots: {
    capture: (
      webContentsId: number,
      mode: 'visible' | 'full',
      rect?: { x: number; y: number; width: number; height: number }
    ) => Promise<SaveFileResult | null>
    savePdf: (webContentsId: number) => Promise<SaveFileResult | null>
  }
  search: {
    suggest: (url: string, query: string) => Promise<string[]>
  }
  system: {
    setLoginItem: (openAtLogin: boolean) => Promise<boolean>
    getLoginItem: () => Promise<boolean>
    openDefaultApps: () => Promise<void>
    checkForUpdates: () => Promise<UpdateCheckResult>
  }
  appearance: {
    setTheme: (mode: ThemeMode) => Promise<void>
  }
  plugins: {
    list: () => Promise<PluginInfo[]>
    setEnabled: (id: string, enabled: boolean) => Promise<PluginInfo[]>
    installLocal: () => Promise<PluginInfo[]>
    removeLocal: (id: string) => Promise<PluginInfo[]>
    onChanged: (callback: (plugins: PluginInfo[]) => void) => () => void
    onBlockedCount: (callback: (count: number) => void) => () => void
  }
  translation: {
    translate: (
      texts: string[],
      target: TranslationTarget
    ) => Promise<TranslationResponse>
  }
  navigation: {
    onNewTab: (callback: (url: string, isPrivate: boolean) => void) => () => void
    onShortcut: (callback: (action: BrowserShortcut) => void) => () => void
  }
  app: {
    info: () => Promise<AppInfo>
    clearBrowsingData: (scope: 'cache' | 'cookies' | 'all') => Promise<void>
  }
}
