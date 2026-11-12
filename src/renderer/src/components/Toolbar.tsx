import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject
} from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Ellipsis,
  EyeOff,
  FileText,
  History,
  Home,
  Languages,
  LockKeyhole,
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X
} from 'lucide-react'
import type {
  Bookmark as BookmarkRecord,
  CustomSearchEngine,
  HistoryEntry,
  InternalView,
  SearchEngineId,
  Tab,
  TrackingProtection,
  TranslationStatus,
  TranslationTarget
} from '../lib/types'
import {
  getDisplayUrl,
  getHostname,
  getSearchEngine,
  getSuggestionUrl,
  searchWith
} from '../lib/search'
import { SiteIcon } from './SiteIcon'
import { IconButton, Kbd } from './Ui'

const INTERNAL_ADDRESSES: Record<Exclude<InternalView, 'web'>, string> = {
  bookmarks: 'mingyue://bookmarks',
  history: 'mingyue://history',
  downloads: 'mingyue://downloads',
  plugins: 'mingyue://plugins',
  settings: 'mingyue://settings'
}

interface AddressSuggestion {
  id: string
  kind: 'search' | 'site'
  title: string
  subtitle: string
  url: string
  favicon: string
  isHistory?: boolean
}

function translationTargetLabel(target: TranslationTarget): string {
  if (target === 'zh-TW') return '繁體中文'
  if (target === 'en') return 'English'
  if (target === 'ja') return '日本語'
  return '简体中文'
}

export function Toolbar({
  activeTab,
  view,
  bookmarks,
  history,
  engine,
  isBookmarked,
  findOpen,
  activeDownloads,
  addressRef,
  onBack,
  onForward,
  onReload,
  onHome,
  onStop,
  onNavigate,
  onToggleBookmark,
  onOpenFind,
  onToggleMore,
  onOpenDownloads,
  translationStatus,
  translationTarget,
  trackingProtection,
  onToggleTrackingProtection,
  onClearSiteData,
  canTranslate,
  onTranslate,
  suggestionsEnabled,
  searchSuggestions,
  customEngines,
  readerMode,
  onToggleReader
}: {
  activeTab: Tab | null
  view: InternalView
  bookmarks: BookmarkRecord[]
  history: HistoryEntry[]
  engine: SearchEngineId
  isBookmarked: boolean
  findOpen: boolean
  activeDownloads: number
  addressRef: RefObject<HTMLInputElement | null>
  onBack: () => void
  onForward: () => void
  onReload: () => void
  onHome: () => void
  onStop: () => void
  onNavigate: (raw: string) => void
  onToggleBookmark: () => void
  onOpenFind: () => void
  onToggleMore: () => void
  onOpenDownloads: () => void
  translationStatus: TranslationStatus
  translationTarget: TranslationTarget
  trackingProtection: TrackingProtection
  onToggleTrackingProtection: () => void
  onClearSiteData: () => void
  canTranslate: boolean
  onTranslate: () => void
  suggestionsEnabled: boolean
  searchSuggestions: boolean
  customEngines: CustomSearchEngine[]
  readerMode: boolean
  onToggleReader: () => void
}): React.ReactElement {
  const displayValue =
    view === 'web' ? activeTab?.url ?? '' : INTERNAL_ADDRESSES[view]
  const [draft, setDraft] = useState(displayValue)
  const [focused, setFocused] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([])
  const [protectionOpen, setProtectionOpen] = useState(false)
  const protectionRef = useRef<HTMLDivElement>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeEngine = getSearchEngine(engine, customEngines)

  useEffect(() => {
    if (!focused) setDraft(displayValue)
  }, [displayValue, focused])

  const isInternal = view !== 'web'
  const isSecure = !isInternal && (activeTab?.url.startsWith('https://') ?? false)
  const isInsecure = !isInternal && (activeTab?.url.startsWith('http://') ?? false)
  const isLoading = activeTab?.isLoading ?? false

  useEffect(() => {
    if (!protectionOpen) return
    const close = (event: MouseEvent): void => {
      if (!protectionRef.current?.contains(event.target as Node)) {
        setProtectionOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setProtectionOpen(false)
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [protectionOpen])
  const canGoBack = view !== 'web' ? true : activeTab?.canGoBack ?? false
  const canGoForward = view !== 'web' ? false : activeTab?.canGoForward ?? false

  useEffect(() => {
    const value = draft.trim()
    if (
      !focused ||
      !suggestionsEnabled ||
      !searchSuggestions ||
      value.length < 2 ||
      !window.mingyue
    ) {
      setRemoteSuggestions([])
      return
    }
    const endpoint = getSuggestionUrl(engine, value, customEngines)
    if (!endpoint) {
      setRemoteSuggestions([])
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      void window.mingyue.search
        .suggest(endpoint, value)
        .then((items) => {
          if (!cancelled) setRemoteSuggestions(items)
        })
        .catch(() => {
          if (!cancelled) setRemoteSuggestions([])
        })
    }, 220)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    customEngines,
    draft,
    engine,
    focused,
    searchSuggestions,
    suggestionsEnabled
  ])

  const suggestions = useMemo<AddressSuggestion[]>(() => {
    if (!suggestionsEnabled) return []
    const value = draft.trim()
    const items: AddressSuggestion[] = []
    const seen = new Set<string>()

    if (value) {
      items.push({
        id: 'search-query',
        kind: 'search',
        title: `搜索“${value}”`,
        subtitle: `使用 ${activeEngine.label}`,
        url: searchWith(engine, value, customEngines),
        favicon: ''
      })
    }

    for (const [index, suggestion] of remoteSuggestions.entries()) {
      if (!suggestion || seen.has(suggestion)) continue
      seen.add(suggestion)
      items.push({
        id: `remote-suggestion-${index}`,
        kind: 'search',
        title: suggestion,
        subtitle: `${activeEngine.label} 搜索建议`,
        url: searchWith(engine, suggestion, customEngines),
        favicon: ''
      })
    }

    const lower = value.toLowerCase()
    const matches = (title: string, url: string): boolean =>
      !value || title.toLowerCase().includes(lower) || url.toLowerCase().includes(lower)

    for (const bookmark of bookmarks) {
      if (!matches(bookmark.title, bookmark.url) || seen.has(bookmark.url)) continue
      seen.add(bookmark.url)
      items.push({
        id: `bookmark-${bookmark.id}`,
        kind: 'site',
        title: bookmark.title,
        subtitle: getDisplayUrl(bookmark.url),
        url: bookmark.url,
        favicon: bookmark.favicon
      })
      if (items.length >= 7) break
    }

    for (const entry of history) {
      if (!matches(entry.title, entry.url) || seen.has(entry.url)) continue
      seen.add(entry.url)
      items.push({
        id: `history-${entry.id}`,
        kind: 'site',
        title: entry.title || getHostname(entry.url),
        subtitle: getDisplayUrl(entry.url),
        url: entry.url,
        favicon: entry.favicon,
        isHistory: true
      })
      if (items.length >= 7) break
    }

    return items.slice(0, 8)
  }, [
    activeEngine.label,
    bookmarks,
    customEngines,
    draft,
    engine,
    history,
    remoteSuggestions,
    suggestionsEnabled
  ])

  const openSuggestions =
    suggestionsEnabled && focused && suggestions.length > 0

  const commit = (raw: string): void => {
    const normalized = raw.trim()
    if (!normalized) return
    setFocused(false)
    setHighlighted(-1)
    addressRef.current?.blur()
    onNavigate(normalized)
  }

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault()
    if (highlighted >= 0 && suggestions[highlighted]) {
      commit(suggestions[highlighted].url)
      return
    }
    commit(draft)
  }

  const handleKeyboard = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      setFocused(false)
      setHighlighted(-1)
      addressRef.current?.blur()
      return
    }
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault()
      setHighlighted((current) => (current + 1) % suggestions.length)
      return
    }
    if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault()
      setHighlighted((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
    }
  }

  return (
    <header className="toolbar">
      <div className="toolbar-nav">
        <IconButton
          label="后退"
          variant="paper"
          size="md"
          disabled={!canGoBack}
          onClick={onBack}
        >
          <ArrowLeft size={18} strokeWidth={1.9} />
        </IconButton>
        <IconButton
          label="前进"
          variant="paper"
          size="md"
          disabled={!canGoForward}
          onClick={onForward}
        >
          <ArrowRight size={18} strokeWidth={1.9} />
        </IconButton>
        <IconButton
          label={isLoading ? '停止加载' : '重新加载'}
          variant="paper"
          size="md"
          disabled={view !== 'web' || !activeTab?.url}
          onClick={isLoading ? onStop : onReload}
        >
          {isLoading ? (
            <X size={17} strokeWidth={2} />
          ) : (
            <RotateCw size={16} strokeWidth={1.9} />
          )}
        </IconButton>
        <IconButton
          label="返回主页"
          variant="paper"
          size="md"
          onClick={onHome}
        >
          <Home size={16} strokeWidth={1.9} />
        </IconButton>
      </div>

      <form
        className={`omnibox ${focused ? 'is-focused' : ''}`}
        onSubmit={handleSubmit}
        aria-label="地址与搜索"
      >
        <div className="omnibox-protection-wrap" ref={protectionRef}>
          <button
            type="button"
            className={`omnibox-protection ${
              protectionOpen ? 'is-open' : ''
            }`}
            title="防护"
            aria-label="防护"
            aria-expanded={protectionOpen}
            onClick={() => setProtectionOpen((open) => !open)}
          >
            <ShieldCheck size={15} />
          </button>
          {protectionOpen && (
            <div className="protection-menu">
              <div className="protection-menu-title">防护</div>
              <button
                type="button"
                className="protection-menu-item"
                onClick={() => {
                  onToggleTrackingProtection()
                  setProtectionOpen(false)
                }}
              >
                <ShieldCheck size={15} />
                <span>跟踪防护</span>
                <em>
                  {trackingProtection === 'strict' ? '严格' : '标准'}
                </em>
              </button>
              <button
                type="button"
                className="protection-menu-item is-danger"
                onClick={() => {
                  onClearSiteData()
                  setProtectionOpen(false)
                }}
              >
                <Trash2 size={15} />
                <span>清除 Cookie 和网站数据</span>
              </button>
            </div>
          )}
        </div>
        <span
          className={`omnibox-security ${
            isSecure ? 'is-secure' : isInsecure ? 'is-insecure' : ''
          }`}
          title={
            isInternal
              ? '浏览器内置页面'
              : isSecure
                ? '此页面使用安全连接'
                : isInsecure
                  ? '此页面未使用加密连接'
                  : '搜索或访问网站'
          }
        >
          {isInternal ? (
            <Sparkles size={15} />
          ) : isSecure ? (
            <LockKeyhole size={15} />
          ) : isInsecure ? (
            <ShieldAlert size={16} />
          ) : (
            <Search size={15} />
          )}
        </span>
        <input
          ref={addressRef}
          className="omnibox-input"
          type="text"
          value={draft}
          placeholder={
            view === 'web'
              ? `搜索，或输入网址…`
              : displayValue
          }
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="地址栏"
          onFocus={(event) => {
            setFocused(true)
            setHighlighted(-1)
            if (blurTimer.current) clearTimeout(blurTimer.current)
            requestAnimationFrame(() => event.target.select())
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => {
              setFocused(false)
              setHighlighted(-1)
              // Draft syncing happens in the display-value effect below, so
              // this timer can never restore the URL from before navigation.
            }, 160)
          }}
          onChange={(event) => {
            setDraft(event.target.value)
            setHighlighted(-1)
          }}
          onKeyDown={handleKeyboard}
        />
        {view === 'web' && (
          <button
            type="button"
            className={`omnibox-bookmark ${
              isBookmarked ? 'is-bookmarked' : ''
            }`}
            title={isBookmarked ? '取消收藏此页' : '收藏此页'}
            aria-label={isBookmarked ? '取消收藏此页' : '收藏此页'}
            disabled={!activeTab?.url}
            onClick={onToggleBookmark}
          >
            <Star
              size={15}
              fill={isBookmarked ? 'currentColor' : 'none'}
            />
          </button>
        )}
        {view === 'web' && (
          <button
            type="button"
            className={`omnibox-translate ${
              translationStatus === 'translated' ? 'is-active' : ''
            }`}
            title={
              translationStatus === 'translated'
                ? '显示网页原文'
                : `将当前网页机器翻译为${translationTargetLabel(translationTarget)}`
            }
            aria-label={
              translationStatus === 'translated'
                ? '显示网页原文'
                : `机翻当前网页为${translationTargetLabel(translationTarget)}`
            }
            disabled={
              !canTranslate || translationStatus === 'translating'
            }
            onClick={onTranslate}
          >
            {translationStatus === 'translating' ? (
              <span className="button-spinner" aria-hidden="true" />
            ) : (
              <Languages size={13} />
            )}
            <span>
              {translationStatus === 'translating'
                ? '翻译中'
                : translationStatus === 'translated'
                  ? '原文'
                  : '机翻'}
            </span>
          </button>
        )}
        {activeTab?.isPrivate && (
          <span className="omnibox-private">
            <EyeOff size={12} />
            无痕
          </span>
        )}
        <button
          type="button"
          className="omnibox-inline-action mobile-only"
          aria-label={isLoading ? '停止加载' : '重新加载'}
          disabled={view !== 'web' || !activeTab?.url}
          onClick={isLoading ? onStop : onReload}
        >
          {isLoading ? <X size={15} /> : <RotateCw size={15} />}
        </button>
        {displayValue && (
          <button
            type="button"
            className="omnibox-clear"
            aria-label="清空地址栏"
            onClick={() => {
              setDraft('')
              addressRef.current?.focus()
            }}
          >
            <X size={13} />
          </button>
        )}

        {openSuggestions && (
          <div
            className="address-suggestions"
            role="listbox"
            onMouseDown={(event) => event.preventDefault()}
          >
            {!draft.trim() && (
              <div className="suggestions-label">最近与收藏</div>
            )}
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={highlighted === index}
                className={`suggestion-item ${highlighted === index ? 'is-highlighted' : ''}`}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => commit(suggestion.url)}
              >
                {suggestion.kind === 'search' ? (
                  <span className="suggestion-search-icon">
                    <Search size={15} />
                  </span>
                ) : (
                  <SiteIcon
                    favicon={suggestion.favicon}
                    title={suggestion.title}
                    url={suggestion.url}
                    size={26}
                  />
                )}
                <span className="suggestion-copy">
                  <span className="suggestion-title">{suggestion.title}</span>
                  <span className="suggestion-subtitle">{suggestion.subtitle}</span>
                </span>
                <span className="suggestion-kind">
                  {suggestion.isHistory ? (
                    <History size={13} />
                  ) : suggestion.kind === 'search' ? (
                    <Kbd>Enter</Kbd>
                  ) : (
                    <Bookmark size={13} />
                  )}
                </span>
              </button>
            ))}
            <div className="suggestions-footer">
              <span>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                选择
              </span>
              <span>
                <Kbd>Enter</Kbd>
                前往
              </span>
            </div>
          </div>
        )}
      </form>

      <div className="toolbar-actions">
        {activeDownloads > 0 && (
          <button
            type="button"
            className="download-indicator"
            title="查看正在下载的文件"
            onClick={onOpenDownloads}
          >
            <ArrowDownToLine size={16} />
            <span>{activeDownloads}</span>
          </button>
        )}
        <IconButton
          label={readerMode ? '退出阅读模式' : '阅读模式'}
          variant="paper"
          size="md"
          className={readerMode ? 'is-active' : ''}
          disabled={!activeTab?.url || view !== 'web'}
          onClick={onToggleReader}
        >
          <BookOpen size={16} />
        </IconButton>
        <IconButton
          label="在页面中查找"
          variant="paper"
          size="md"
          className={findOpen ? 'is-active' : ''}
          disabled={!activeTab?.url || view !== 'web'}
          onClick={onOpenFind}
        >
          <FileText size={16} />
        </IconButton>
        <IconButton
          label="更多"
          variant="paper"
          size="md"
          className="toolbar-more"
          onClick={onToggleMore}
        >
          <Ellipsis size={18} />
        </IconButton>
      </div>

      {isLoading && (
        <div className="toolbar-progress" aria-hidden="true">
          <span />
        </div>
      )}
    </header>
  )
}
