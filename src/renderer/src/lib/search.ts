import type {
  BuiltinSearchEngineId,
  CustomSearchEngine,
  SearchEngine,
  SearchEngineId
} from './types'

export const SEARCH_ENGINES: Record<BuiltinSearchEngineId, SearchEngine> = {
  bing: {
    id: 'bing',
    label: '必应',
    shortLabel: 'Bing',
    searchUrl: 'https://www.bing.com/search?q=',
    homeUrl: 'https://www.bing.com'
  },
  baidu: {
    id: 'baidu',
    label: '百度',
    shortLabel: 'Baidu',
    searchUrl: 'https://www.baidu.com/s?wd=',
    homeUrl: 'https://www.baidu.com'
  },
  google: {
    id: 'google',
    label: 'Google',
    shortLabel: 'Google',
    searchUrl: 'https://www.google.com/search?q=',
    homeUrl: 'https://www.google.com'
  },
  duckduckgo: {
    id: 'duckduckgo',
    label: 'DuckDuckGo',
    shortLabel: 'DuckDuckGo',
    searchUrl: 'https://duckduckgo.com/?q=',
    homeUrl: 'https://duckduckgo.com'
  }
}

export const SEARCH_SUGGEST_URLS: Record<BuiltinSearchEngineId, string> = {
  bing: 'https://api.bing.com/osjson.aspx?query=',
  baidu: 'https://suggestion.baidu.com/su?wd=',
  google: 'https://suggestqueries.google.com/complete/search?client=firefox&q=',
  duckduckgo: 'https://duckduckgo.com/ac/?q='
}

const DOMAIN_RE = /^(?:[\w-]+\.)+[a-z]{2,}(?::\d{1,5})?(?:[/?#].*)?$/i
const LOCALHOST_RE = /^localhost(?::\d{1,5})?(?:[/?#].*)?$/i
const IP_RE = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?(?:[/?#].*)?$/i

function customToEngine(engine: CustomSearchEngine): SearchEngine {
  return {
    id: engine.id,
    label: engine.label,
    shortLabel: engine.label,
    searchUrl: engine.searchUrl,
    homeUrl: engine.homeUrl || ''
  }
}

export function getSearchEngine(
  id: SearchEngineId,
  customEngines: CustomSearchEngine[] = []
): SearchEngine {
  const builtin = SEARCH_ENGINES[id as BuiltinSearchEngineId]
  if (builtin) return builtin
  const custom = customEngines.find((engine) => engine.id === id)
  return custom ? customToEngine(custom) : SEARCH_ENGINES.bing
}

export function formatSearchUrl(template: string, query: string): string {
  const encoded = encodeURIComponent(query)
  return template.includes('%s')
    ? template.replace(/%s/g, encoded)
    : `${template}${encoded}`
}

export function searchWith(
  engine: SearchEngineId,
  query: string,
  customEngines: CustomSearchEngine[] = []
): string {
  return formatSearchUrl(getSearchEngine(engine, customEngines).searchUrl, query)
}

export function applySearchKeyword(
  rawValue: string,
  engine: SearchEngineId,
  customEngines: CustomSearchEngine[] = []
): string | null {
  const value = rawValue.trim()
  const match = /^([^\s:]+)\s+(.+)$/.exec(value)
  if (!match) return null
  const keyword = match[1].toLowerCase()
  const custom = customEngines.find(
    (item) => item.keyword?.toLowerCase() === keyword
  )
  if (!custom) return null
  return formatSearchUrl(custom.searchUrl, match[2])
}

export function normalizeAddress(
  rawValue: string,
  engine: SearchEngineId,
  customEngines: CustomSearchEngine[] = []
): string | null {
  const value = rawValue.trim()
  if (!value) return null

  const keywordResult = applySearchKeyword(value, engine, customEngines)
  if (keywordResult) return keywordResult

  if (/^https?:\/\/\S+$/i.test(value)) return value
  if (/^file:\/\/\S+$/i.test(value)) return value
  if (/^about:blank$/i.test(value)) return 'about:blank'

  if (!value.includes(' ') && (DOMAIN_RE.test(value) || IP_RE.test(value))) {
    const isPrivateIp = /^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(value)
    return `${isPrivateIp ? 'http' : 'https'}://${value}`
  }
  if (!value.includes(' ') && LOCALHOST_RE.test(value)) {
    return `http://${value}`
  }

  return searchWith(engine, value, customEngines)
}

export function isValidWebUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return ['http:', 'https:', 'file:', 'about:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function getHostname(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

export function getDisplayUrl(value: string): string {
  if (!value) return ''
  try {
    const url = new URL(value)
    const path = `${url.pathname === '/' ? '' : url.pathname}${url.search}${url.hash}`
    return `${url.hostname.replace(/^www\./, '')}${decodeURI(path)}`
  } catch {
    return value
  }
}

export function buildSearchHome(
  engine: SearchEngineId,
  customEngines: CustomSearchEngine[] = []
): string {
  return getSearchEngine(engine, customEngines).homeUrl
}

export function getSuggestionUrl(
  engine: SearchEngineId,
  query: string,
  customEngines: CustomSearchEngine[] = []
): string | null {
  const builtin = SEARCH_SUGGEST_URLS[engine as BuiltinSearchEngineId]
  if (builtin) return builtin
  void customEngines
  return null
}
