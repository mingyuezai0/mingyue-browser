import { useEffect, useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import type { Bookmark, Settings } from '../lib/types'
import { getSearchEngine } from '../lib/search'
import { formatClock, formatDate } from '../lib/date'
import { LogoMark } from './Brand'
import { SiteIcon } from './SiteIcon'

function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const update = (): void => setNow(new Date())
    const timer = window.setInterval(update, 30_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return now
}

export function StartPage({
  bookmarks,
  settings,
  showQuickLinks,
  onNavigate,
  onOpenBookmark
}: {
  bookmarks: Bookmark[]
  settings: Settings
  showQuickLinks: boolean
  onNavigate: (raw: string) => void
  onOpenBookmark: (bookmark: Bookmark) => void
}): React.ReactElement {
  const now = useMinuteClock()
  const [query, setQuery] = useState('')
  const engine = getSearchEngine(
    settings.searchEngine,
    settings.customSearchEngines
  )
  const quickLinks = bookmarks
    .filter((bookmark) => !bookmark.folderId)
    .slice(0, 7)

  return (
    <div className="start-page start-page--home">
      <header className="start-home-top">
        <div className="start-brand-lockup">
          <LogoMark size={54} />
          <div className="start-brand-copy">
            <span className="start-brand-name">明月</span>
            <span className="start-brand-en">MINGYUE</span>
          </div>
        </div>
        <div className="start-date-time">
          <span>{formatDate(now)}</span>
          <span className="start-date-dot" />
          <span>{formatClock(now)}</span>
        </div>
      </header>

      <form
        className="start-search start-search--large"
        onSubmit={(event) => {
          event.preventDefault()
          if (query.trim()) onNavigate(query)
        }}
      >
        <Search size={21} strokeWidth={1.9} className="start-search-icon" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索或输入网址"
          aria-label="搜索或输入网址"
          spellCheck={false}
        />
        <span className="start-search-engine">{engine.label}</span>
        <button type="submit" aria-label="搜索或打开网址">
          <ArrowUpRight size={21} strokeWidth={2} />
        </button>
      </form>

      <div className="start-bottom-block">
        {showQuickLinks && (
          <section className="quick-section start-quick-section">
            <div className="quick-grid quick-grid--plain">
              {quickLinks.map((bookmark) => (
                <button
                  key={bookmark.id}
                  type="button"
                  className="quick-tile quick-tile--plain"
                  onClick={() => onOpenBookmark(bookmark)}
                >
                  <SiteIcon
                    favicon={bookmark.favicon}
                    title={bookmark.title}
                    url={bookmark.url}
                    size={42}
                  />
                  <strong className="quick-site-name">{bookmark.title}</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="start-footer start-footer--credit">
          <span>作者@此间明月在</span>
        </footer>
      </div>
    </div>
  )
}
