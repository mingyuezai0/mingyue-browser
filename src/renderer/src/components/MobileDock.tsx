import { ArrowLeft, ArrowRight, Ellipsis, Layers3, Plus } from 'lucide-react'

export function MobileDock({
  canGoBack,
  canGoForward,
  tabCount,
  onBack,
  onForward,
  onNewTab,
  onOpenTabs,
  onOpenMore
}: {
  canGoBack: boolean
  canGoForward: boolean
  tabCount: number
  onBack: () => void
  onForward: () => void
  onNewTab: () => void
  onOpenTabs: () => void
  onOpenMore: () => void
}): React.ReactElement {
  return (
    <nav className="mobile-dock" aria-label="浏览器导航">
      <button
        type="button"
        className="dock-button"
        disabled={!canGoBack}
        onClick={onBack}
      >
        <ArrowLeft size={20} strokeWidth={1.9} />
        <span>后退</span>
      </button>
      <button
        type="button"
        className="dock-button"
        disabled={!canGoForward}
        onClick={onForward}
      >
        <ArrowRight size={20} strokeWidth={1.9} />
        <span>前进</span>
      </button>
      <button
        type="button"
        className="dock-new-tab"
        onClick={onNewTab}
        aria-label="新建标签页"
      >
        <span className="dock-new-tab-button">
          <Plus size={22} strokeWidth={2.1} />
        </span>
        <span>新页</span>
      </button>
      <button type="button" className="dock-button" onClick={onOpenTabs}>
        <span className="dock-icon-wrap">
          <Layers3 size={20} strokeWidth={1.9} />
          <span className="dock-count">{tabCount}</span>
        </span>
        <span>标签</span>
      </button>
      <button type="button" className="dock-button" onClick={onOpenMore}>
        <Ellipsis size={21} strokeWidth={1.9} />
        <span>更多</span>
      </button>
    </nav>
  )
}
