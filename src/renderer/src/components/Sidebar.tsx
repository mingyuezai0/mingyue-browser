import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  Bookmark,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  EyeOff,
  History,
  Layers,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  Puzzle,
  Settings2,
  ShieldCheck,
  ShieldOff,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'
import type { InternalView, Tab, TabGroup } from '../lib/types'
import { getHostname } from '../lib/search'
import { SiteIcon } from './SiteIcon'
import { IconButton, Kbd, Spinner } from './Ui'

interface TabContextMenuState {
  tabId: string
  x: number
  y: number
}

export function Sidebar({
  tabs,
  activeId,
  view,
  collapsed,
  blockedCount,
  privacyEnabled,
  activeDownloads,
  onToggleCollapsed,
  onNewTab,
  onNewPrivateTab,
  onSelectTab,
  onCloseTab,
  onDuplicateTab,
  onCloseOthers,
  onToggleMute,
  onReorder,
  onOpenView,
  onOpenCommandPalette,
  groups,
  onTogglePin,
  onOpenTabGroups
}: {
  tabs: Tab[]
  activeId: string
  view: InternalView
  collapsed: boolean
  blockedCount: number
  privacyEnabled: boolean
  activeDownloads: number
  onToggleCollapsed: () => void
  onNewTab: () => void
  onNewPrivateTab: () => void
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onDuplicateTab: (id: string) => void
  onCloseOthers: (id: string) => void
  onToggleMute: (id: string) => void
  onReorder: (sourceId: string, targetId: string) => void
  onOpenView: (view: InternalView) => void
  onOpenCommandPalette: () => void
  groups: TabGroup[]
  onTogglePin: (id: string) => void
  onOpenTabGroups: () => void
}): React.ReactElement {
  const [contextMenu, setContextMenu] = useState<TabContextMenuState | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contextMenu) return
    const close = (event: MouseEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) setContextMenu(null)
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('blur', () => setContextMenu(null), { once: true })
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [contextMenu])

  const contextTab = contextMenu ? tabs.find((tab) => tab.id === contextMenu.tabId) : null

  const navItems: Array<{
    view: InternalView
    label: string
    icon: React.ReactNode
    badge?: number
  }> = [
    { view: 'bookmarks', label: '书签', icon: <Bookmark size={18} /> },
    { view: 'history', label: '历史', icon: <History size={18} /> },
    {
      view: 'downloads',
      label: '下载',
      icon: <ArrowDownToLine size={18} />,
      badge: activeDownloads
    },
    { view: 'plugins', label: '插件', icon: <Puzzle size={18} /> },
    { view: 'settings', label: '设置', icon: <Settings2 size={18} /> }
  ]

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-head">
        <div className="sidebar-eyebrow">
          <IconButton
            label={collapsed ? '展开侧栏' : '收起侧栏'}
            size="sm"
            className="sidebar-collapse"
            onClick={onToggleCollapsed}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </IconButton>
        </div>
        <div className="new-tab-row">
          <button
            type="button"
            className="new-tab-button"
            onClick={onNewTab}
            title="新标签页"
          >
            <span className="new-tab-plus">
              <Plus size={18} strokeWidth={2.2} />
            </span>
            {!collapsed && (
              <>
                <span className="new-tab-label">新标签页</span>
                <Kbd>Ctrl T</Kbd>
              </>
            )}
          </button>
          {!collapsed && (
            <IconButton
              label="新建无痕标签页"
              variant="paper"
              size="md"
              className="private-tab-button"
              onClick={onNewPrivateTab}
            >
              <EyeOff size={17} />
            </IconButton>
          )}
        </div>
      </div>

      <div className="tab-section-heading">
        {!collapsed && <span>标签页</span>}
        {!collapsed && <span className="tab-count">{tabs.length}</span>}
        {!collapsed && (
          <button
            type="button"
            className="sidebar-groups-button"
            title="标签组"
            aria-label="标签组"
            onClick={onOpenTabGroups}
          >
            <Layers size={14} />
          </button>
        )}
      </div>

      <div className="tab-list" role="tablist" aria-label="打开的标签页">
        {tabs.map((tab) => {
          const active = tab.id === activeId
          const group = groups.find((item) => item.id === tab.groupId)
          return (
            <div
              key={tab.id}
              className={`tab-item ${active ? 'is-active' : ''} ${
                tab.isPinned ? 'is-pinned' : ''
              } ${group ? 'is-grouped' : ''} ${
                draggingId === tab.id ? 'is-dragging' : ''
              }`}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              draggable
              onDragStart={(event) => {
                setDraggingId(tab.id)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', tab.id)
              }}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(event) => {
                event.preventDefault()
                const sourceId = event.dataTransfer.getData('text/plain')
                if (sourceId && sourceId !== tab.id) onReorder(sourceId, tab.id)
                setDraggingId(null)
              }}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectTab(tab.id)
                }
              }}
              onContextMenu={(event) => {
                event.preventDefault()
                setContextMenu({
                  tabId: tab.id,
                  x: Math.min(event.clientX, window.innerWidth - 210),
                  y: Math.min(event.clientY, window.innerHeight - 250)
                })
              }}
              title={
                collapsed
                  ? tab.url
                    ? `${tab.title}\n${tab.url}`
                    : tab.title
                  : undefined
              }
            >
              <div className="tab-leading">
                {tab.isLoading ? (
                  <Spinner size={14} />
                ) : (
                  <SiteIcon
                    favicon={tab.favicon}
                    title={tab.title}
                    url={tab.url}
                    size={19}
                  />
                )}
              </div>
              {!collapsed && (
                <div className="tab-copy">
                  <span className="tab-title">
                    {tab.isPrivate && <EyeOff size={11} className="tab-private-icon" />}
                    {group && (
                      <span
                        className="tab-group-dot"
                        style={{ background: group.color }}
                        title={group.name}
                      />
                    )}
                    {tab.title || '新标签页'}
                  </span>
                  <span className="tab-domain">
                    {tab.isPrivate
                      ? '无痕标签页'
                      : tab.url
                        ? getHostname(tab.url)
                        : '新标签页'}
                  </span>
                </div>
              )}
              {tab.isAudible && (
                <span className="tab-audio" title={tab.isMuted ? '已静音' : '正在播放声音'}>
                  {tab.isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </span>
              )}
              <button
                type="button"
                className="tab-close"
                aria-label={`关闭 ${tab.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onCloseTab(tab.id)
                }}
              >
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>

      {!collapsed && (
        <button
          type="button"
          className={`privacy-card ${privacyEnabled ? '' : 'is-off'}`}
          onClick={() => onOpenView('plugins')}
        >
          <span className="privacy-card-icon">
            {privacyEnabled ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
          </span>
          <span className="privacy-card-copy">
            <strong>
              {privacyEnabled ? '广告拦截已开启' : '广告拦截已关闭'}
            </strong>
            <small>
              {privacyEnabled
                ? `已拦截 ${blockedCount} 个请求`
                : '在插件中重新开启'}
            </small>
          </span>
          <ChevronRight size={14} className="privacy-card-arrow" />
        </button>
      )}

      <div className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.view}
            type="button"
            data-nav={item.view}
            className={`sidebar-nav-button ${view === item.view ? 'is-active' : ''}`}
            onClick={() => onOpenView(item.view)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
            {item.badge ? (
              <span className="sidebar-nav-badge">{item.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        {!collapsed ? (
          <>
            <span className="sidebar-footer-mark">
              <Moon size={13} />
              明月浏览器
            </span>
            <button
              type="button"
              className="sidebar-help"
              aria-label="快捷键帮助"
              title="命令面板 · Ctrl K"
              onClick={onOpenCommandPalette}
            >
              <CircleHelp size={14} />
            </button>
          </>
        ) : (
          <span className="sidebar-footer-dot" />
        )}
      </div>

      {contextMenu && contextTab && (
        <div
          ref={menuRef}
          className="tab-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          <button
            type="button"
            className="context-menu-item"
            onClick={() => {
              onTogglePin(contextTab.id)
              setContextMenu(null)
            }}
          >
            {contextTab.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
            {contextTab.isPinned ? '取消固定' : '固定标签页'}
          </button>
          <button
            type="button"
            className="context-menu-item"
            onClick={() => {
              onDuplicateTab(contextTab.id)
              setContextMenu(null)
            }}
          >
            <Copy size={15} />
            复制标签页
          </button>
          <button
            type="button"
            className="context-menu-item"
            onClick={() => {
              onToggleMute(contextTab.id)
              setContextMenu(null)
            }}
          >
            {contextTab.isMuted ? <Volume2 size={15} /> : <VolumeX size={15} />}
            {contextTab.isMuted ? '取消静音' : '静音标签页'}
          </button>
          <div className="context-menu-separator" />
          <button
            type="button"
            className="context-menu-item"
            onClick={() => {
              onCloseOthers(contextTab.id)
              setContextMenu(null)
            }}
          >
            <Clock3 size={15} />
            关闭其他标签页
          </button>
          <button
            type="button"
            className="context-menu-item is-danger"
            onClick={() => {
              onCloseTab(contextTab.id)
              setContextMenu(null)
            }}
          >
            <X size={15} />
            关闭标签页
          </button>
        </div>
      )}
    </aside>
  )
}
