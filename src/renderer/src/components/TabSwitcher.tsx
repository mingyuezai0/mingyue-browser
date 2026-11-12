import { EyeOff, Plus, X } from 'lucide-react'
import type { Tab } from '../lib/types'
import { getHostname } from '../lib/search'
import { SiteIcon } from './SiteIcon'
import { Spinner } from './Ui'

export function TabSwitcher({
  open,
  tabs,
  activeId,
  onClose,
  onSelect,
  onCloseTab,
  onNewTab,
  onNewPrivateTab
}: {
  open: boolean
  tabs: Tab[]
  activeId: string
  onClose: () => void
  onSelect: (id: string) => void
  onCloseTab: (id: string) => void
  onNewTab: () => void
  onNewPrivateTab: () => void
}): React.ReactElement | null {
  if (!open) return null

  return (
    <div className="sheet-layer">
      <button className="sheet-scrim" type="button" aria-label="关闭标签页列表" onClick={onClose} />
      <section className="bottom-sheet tab-switcher-sheet" aria-label="标签页">
        <div className="sheet-grabber" />
        <div className="sheet-heading">
          <div>
            <span className="sheet-eyebrow">当前窗口</span>
            <h2>标签页 <span>{tabs.length}</span></h2>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="sheet-tab-list">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`sheet-tab ${tab.id === activeId ? 'is-active' : ''}`}
            >
              <button
                type="button"
                className="sheet-tab-main"
                onClick={() => onSelect(tab.id)}
              >
                {tab.isLoading ? (
                  <Spinner size={20} />
                ) : (
                  <SiteIcon
                    favicon={tab.favicon}
                    title={tab.title}
                    url={tab.url}
                    size={30}
                  />
                )}
                <span className="sheet-tab-copy">
                  <strong>
                    {tab.isPrivate && <EyeOff size={12} />}
                    {tab.title || '新标签页'}
                  </strong>
                  <small>{tab.url ? getHostname(tab.url) : '新标签页'}</small>
                </span>
                {tab.id === activeId && <span className="sheet-active-dot" />}
              </button>
              <button
                type="button"
                className="sheet-tab-close"
                aria-label={`关闭 ${tab.title}`}
                onClick={() => onCloseTab(tab.id)}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
        <div className="sheet-actions">
          <button type="button" className="sheet-action-primary" onClick={onNewTab}>
            <Plus size={17} />
            新标签页
          </button>
          <button type="button" className="sheet-action-secondary" onClick={onNewPrivateTab}>
            <EyeOff size={16} />
            无痕浏览
          </button>
        </div>
      </section>
    </div>
  )
}
