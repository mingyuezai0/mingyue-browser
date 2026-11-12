import type {
  Accent,
  AccentId,
  Bookmark,
  BuiltinSearchEngineId,
  FontSize,
  SearchEngineId,
  Settings,
  Tab
} from './types'

export const ACCENTS: Record<AccentId, Accent> = {
  moss: {
    id: 'moss',
    label: '苔绿',
    accent: '#5f735a',
    accentDeep: '#4b5f47',
    soft: '#e4eae0',
    onAccent: '#fbfcf7'
  },
  tangerine: {
    id: 'tangerine',
    label: '暖橙',
    accent: '#975c43',
    accentDeep: '#7e4832',
    soft: '#efe0d7',
    onAccent: '#fdfaf4'
  },
  marigold: {
    id: 'marigold',
    label: '浅金',
    accent: '#846b36',
    accentDeep: '#6b5529',
    soft: '#ece5d4',
    onAccent: '#fdfaf4'
  },
  camellia: {
    id: 'camellia',
    label: '绯红',
    accent: '#984c47',
    accentDeep: '#7f3d39',
    soft: '#eed9d6',
    onAccent: '#fdfaf4'
  }
}

export const FONT_SCALES: Record<FontSize, number> = {
  standard: 1.1,
  large: 1.2,
  extra: 1.3
}

export const FONT_SIZE_OPTIONS: Array<{
  id: FontSize
  label: string
  sample: number
}> = [
  { id: 'standard', label: '标准', sample: 12 },
  { id: 'large', label: '大', sample: 14 },
  { id: 'extra', label: '特大', sample: 16 }
]

export const DEFAULT_SETTINGS: Settings = {
  searchEngine: 'bing',
  customSearchEngines: [],
  homepage: '',
  layout: 'topbar',
  design: 'mingyue',
  themeMode: 'system',
  fontSize: 'large',
  accent: 'moss',
  doNotTrack: true,
  restoreSession: true,
  warnOnCloseMultipleTabs: true,
  addressBarSuggestions: true,
  searchSuggestions: true,
  showQuickLinks: true,
  showBookmarksBar: true,
  showBrand: true,
  clearPrivateDownloads: true,
  downloadDirectory: '',
  downloadAskLocation: false,
  downloadOpenWhenDone: false,
  downloadOpenExtensions: [],
  compactTabs: false,
  defaultZoom: 1,
  trackingProtection: 'standard',
  cookieBannerHandling: true,
  clearOnShutdown: 'none',
  httpsOnly: false,
  dohEnabled: false,
  proxyMode: 'system',
  proxyRules: '',
  autoplayPolicy: 'allow',
  pdfViewerEnabled: true,
  passwordManagerEnabled: true,
  autofillEnabled: true,
  reduceMotion: false,
  highContrast: false,
  startupOnBoot: false,
  language: 'system',
  translationTarget: 'zh-CN'
}

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: 'seed-bilibili',
    title: '哔哩哔哩',
    url: 'https://www.bilibili.com',
    favicon: 'https://www.bilibili.com/favicon.ico',
    createdAt: 1
  },
  {
    id: 'seed-github',
    title: 'GitHub',
    url: 'https://github.com',
    favicon: 'https://github.com/favicon.ico',
    createdAt: 2
  },
  {
    id: 'seed-deepseek',
    title: 'DeepSeek',
    url: 'https://www.deepseek.com',
    favicon: 'https://www.deepseek.com/favicon.ico',
    createdAt: 3
  },
  {
    id: 'seed-douyin',
    title: '抖音',
    url: 'https://www.douyin.com',
    favicon: 'https://www.douyin.com/favicon.ico',
    createdAt: 4
  },
  {
    id: 'seed-douyu',
    title: '斗鱼',
    url: 'https://www.douyu.com',
    favicon: 'https://www.douyu.com/favicon.ico',
    createdAt: 5
  },
  {
    id: 'seed-huya',
    title: '虎牙',
    url: 'https://www.huya.com',
    favicon: 'https://www.huya.com/favicon.ico',
    createdAt: 6
  },
  {
    id: 'seed-qzone',
    title: 'QQ空间',
    url: 'https://qzone.qq.com',
    favicon: 'https://qzone.qq.com/favicon.ico',
    createdAt: 7
  }
]

export const SEARCH_ENGINE_OPTIONS: Array<{
  id: BuiltinSearchEngineId
  label: string
  hint: string
}> = [
  { id: 'bing', label: '必应', hint: '稳定，适合日常' },
  { id: 'baidu', label: '百度', hint: '中文内容更丰富' },
  { id: 'google', label: 'Google', hint: '全球搜索' },
  { id: 'duckduckgo', label: 'DuckDuckGo', hint: '不追踪搜索' }
]

export function createTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: crypto.randomUUID(),
    title: '新标签页',
    url: '',
    favicon: '',
    isPrivate: false,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    zoom: 1,
    error: null,
    hoveredUrl: '',
    isAudible: false,
    isMuted: false,
    translationStatus: 'idle',
    isPinned: false,
    groupId: null,
    readerMode: false,
    internalView: 'web',
    ...overrides
  }
}

export function createInitialTab(): Tab {
  return createTab()
}
