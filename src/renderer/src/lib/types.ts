export type BuiltinSearchEngineId = 'bing' | 'baidu' | 'google' | 'duckduckgo'

export type SearchEngineId = string

export type AccentId = 'moss' | 'tangerine' | 'marigold' | 'camellia'

export type LayoutStyle = 'sidebar' | 'topbar'

export type DesignStyle = 'mingyue' | 'classic'

export type ThemeMode = 'light' | 'dark' | 'system'

export type FontSize = 'standard' | 'large' | 'extra'

export type TranslationStatus = 'idle' | 'translating' | 'translated'

export type UiLanguage = 'system' | 'zh-CN' | 'zh-TW' | 'en' | 'ja'
export type TranslationTarget = 'zh-CN' | 'zh-TW' | 'en' | 'ja'

export type InternalView =
  | 'web'
  | 'bookmarks'
  | 'history'
  | 'downloads'
  | 'plugins'
  | 'settings'

export type DownloadStatus =
  | 'progressing'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'interrupted'

export type TrackingProtection = 'standard' | 'strict'
export type ClearOnShutdown = 'none' | 'cache' | 'cookies' | 'all'
export type ProxyMode = 'system' | 'direct' | 'manual'
export type AutoplayPolicy = 'block' | 'allow'
export type PermissionKind =
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'clipboard-read'
export type PermissionDecision = 'allow' | 'deny'

export interface PageError {
  code: number
  description: string
  url: string
}

export interface Tab {
  id: string
  title: string
  url: string
  favicon: string
  isPrivate: boolean
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  zoom: number
  error: PageError | null
  hoveredUrl: string
  isAudible: boolean
  isMuted: boolean
  translationStatus: TranslationStatus
  isPinned?: boolean
  groupId?: string | null
  readerMode?: boolean
  internalView?: InternalView
}

export interface TabGroup {
  id: string
  name: string
  color: string
  createdAt: number
  collapsed?: boolean
}

export interface CustomSearchEngine {
  id: string
  label: string
  keyword?: string
  searchUrl: string
  homeUrl?: string
}

export interface PasswordEntry {
  id: string
  title: string
  url: string
  username: string
  password: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface SitePermissionEntry {
  id: string
  origin: string
  permission: PermissionKind
  decision: PermissionDecision
  updatedAt: number
}

export interface Bookmark {
  id: string
  title: string
  url: string
  favicon: string
  createdAt: number
  folderId?: string | null
}

export interface BookmarkFolder {
  id: string
  name: string
  parentId?: string | null
  createdAt: number
}

export interface HistoryEntry {
  id: string
  title: string
  url: string
  favicon: string
  visitedAt: number
}

export interface DownloadRecord {
  id: string
  fileName: string
  savePath: string
  url: string
  state: DownloadStatus
  receivedBytes: number
  totalBytes: number
  startedAt: number
  isPrivate: boolean
}

export interface Settings {
  searchEngine: SearchEngineId
  customSearchEngines: CustomSearchEngine[]
  homepage: string
  layout: LayoutStyle
  design: DesignStyle
  themeMode: ThemeMode
  fontSize: FontSize
  accent: AccentId
  doNotTrack: boolean
  restoreSession: boolean
  warnOnCloseMultipleTabs: boolean
  addressBarSuggestions: boolean
  searchSuggestions: boolean
  showQuickLinks: boolean
  showBookmarksBar: boolean
  showBrand: boolean
  clearPrivateDownloads: boolean
  downloadDirectory: string
  downloadAskLocation: boolean
  downloadOpenWhenDone: boolean
  downloadOpenExtensions: string[]
  compactTabs: boolean
  defaultZoom: number
  trackingProtection: TrackingProtection
  cookieBannerHandling: boolean
  clearOnShutdown: ClearOnShutdown
  httpsOnly: boolean
  dohEnabled: boolean
  proxyMode: ProxyMode
  proxyRules: string
  autoplayPolicy: AutoplayPolicy
  pdfViewerEnabled: boolean
  passwordManagerEnabled: boolean
  autofillEnabled: boolean
  reduceMotion: boolean
  highContrast: boolean
  startupOnBoot: boolean
  language: UiLanguage
  translationTarget: TranslationTarget
}

export interface SessionSnapshot {
  tabs: Array<
    Pick<
      Tab,
      | 'id'
      | 'title'
      | 'url'
      | 'favicon'
      | 'isPrivate'
      | 'zoom'
      | 'isPinned'
      | 'groupId'
    >
  >
  activeId: string
}

export interface SearchEngine {
  id: SearchEngineId
  label: string
  shortLabel: string
  searchUrl: string
  homeUrl: string
}

export interface Accent {
  id: AccentId
  label: string
  accent: string
  accentDeep: string
  soft: string
  onAccent: string
}

export interface FindState {
  open: boolean
  query: string
  activeMatch: number
  totalMatches: number
}
