import { useEffect, useRef, useState } from 'react'
import {
  Clock3,
  Copy,
  EyeOff,
  Layers,
  Pin,
  PinOff,
  Plus,
  Volume2,
  VolumeX,
  X
} from 'lucide-react'
import type { Tab, TabGroup } from '../lib/types'
import { BrandLockup } from './Brand'
import { SiteIcon } from './SiteIcon'
import { Spinner } from './Ui'
import { WindowControls } from './WindowControls'

interface TopTabContextMenu {
  tabId: string
  x: number
  y: number
}

export function TopBar({
  tabs,
  activeId,
  pageTitle,
  isPrivate,
  showBrand,
  onNewTab,
  onNewPrivateTab,
  onSelectTab,
  onCloseTab,
  onDuplicateTab,
  onCloseOthers,
  onToggleMute,
  onReorder,
  groups,
  onTogglePin,
  onOpenTabGroups
}: {
  tabs: Tab[]
  activeId: string
  pageTitle: string
  isPrivate: boolean
  showBrand: boolean
  onNewTab: () => void
  onNewPrivateTab: () => void
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onDuplicateTab: (id: string) => void
  onCloseOthers: (id: string) => void
  onToggleMute: (id: string) => void
  onReorder: (sourceId: string, targetId: string) => void
  groups: TabGroup[]
  onTogglePin: (id: string) => void
  onOpenTabGroups: () => void
}): React.ReactElement {
  const [contextMenu, setContextMenu] = useState<TopTabContextMenu | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const activeTabRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest'
    })
  }, [activeId, tabs.length])

  useEffect(() => {
    if (!contextMenu) return
    const closeOnOutsideClick = (event: MouseEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) setContextMenu(null)
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setContextMenu(null)
    }
    const closeOnBlur = (): void => setContextMenu(null)
    window.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('blur', closeOnBlur, { once: true })
    return () => {
      window.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('blur', closeOnBlur)
    }
  }, [contextMenu])

  const contextTab = contextMenu
    ? tabs.find((tab) => tab.id === contextMenu.tabId)
    : null

  return (
    <header
      className="topbar"
      onDoubleClick={(event) => {
        if (
          (event.target as HTMLElement).closest(
            '.top-tab, .topbar-tab-actions, .window-controls, .topbar-brand'
          )
        ) {
          return
        }
        void window.mingyue?.window.toggleMaximize()
      }}
    >
      {showBrand && (
        <div className="topbar-brand">
          <BrandLockup />
        </div>
      )}

      <div className="topbar-main">
        <div
          className="topbar-tabs"
          role="tablist"
          aria-label="打开的标签页"
          onWheel={(event) => {
            if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
              event.currentTarget.scrollLeft += event.deltaY
            }
          }}
        >
          {tabs.map((tab) => {
            const active = tab.id === activeId
            const group = groups.find((item) => item.id === tab.groupId)
            return (
              <div
                key={tab.id}
                ref={(element) => {
                  if (active) activeTabRef.current = element
                }}
                className={`top-tab ${active ? 'is-active' : ''} ${
                  tab.isPinned ? 'is-pinned' : ''
                } ${group ? 'is-grouped' : ''} ${
                  draggingId === tab.id ? 'is-dragging' : ''
                }`}
                role="tab"
                aria-selected={active}
                title={
                  tab.url
                    ? `${tab.title || '新标签页'}\n${tab.url}`
                    : tab.title || '新标签页'
                }
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
                    y: Math.min(event.clientY, window.innerHeight - 235)
                  })
                }}
              >
                <span className="top-tab-favicon">
                  {tab.isLoading ? (
                    <Spinner size={14} />
                  ) : (
                    <SiteIcon
                      favicon={tab.favicon}
                      title={tab.title}
                      url={tab.url}
                      size={18}
                    />
                  )}
                </span>
                {(tab.isAudible || tab.isMuted) && (
                  <button
                    type="button"
                    className="top-tab-audio"
                    title={tab.isMuted ? '取消静音' : '静音标签页'}
                    aria-label={tab.isMuted ? '取消静音' : '静音标签页'}
                    onClick={(event) => {
                      event.stopPropagation()
                      onToggleMute(tab.id)
                    }}
                  >
                    {tab.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                )}
                <span className="top-tab-title">
                  {tab.isPrivate && <EyeOff size={11} />}
                  {group && (
                    <span
                      className="top-tab-group-dot"
                      style={{ background: group.color }}
                      title={group.name}
                    />
                  )}
                  {tab.title || '新标签页'}
                </span>
                <button
                  type="button"
                  className="top-tab-close"
                  aria-label={`关闭 ${tab.title}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    onCloseTab(tab.id)
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>

        <div className="topbar-tab-actions">
          <button
            type="button"
            className="topbar-action topbar-action--new"
            aria-label="新建标签页"
            title="新建标签页 · Ctrl T"
            onClick={onNewTab}
          >
            <Plus size={17} strokeWidth={2.1} />
          </button>
          <button
            type="button"
            className="topbar-action"
            aria-label="新建无痕标签页"
            title="新建无痕标签页 · Ctrl Shift N"
            onClick={onNewPrivateTab}
          >
            <EyeOff size={15} />
          </button>
          <button
            type="button"
            className="topbar-action"
            aria-label="标签组"
            title="标签组"
            onClick={onOpenTabGroups}
          >
            <Layers size={15} />
          </button>
        </div>

        <div className="topbar-drag-fill" aria-hidden="true" />

        <div className="topbar-mobile-title">
          <span>{pageTitle}</span>
          {isPrivate && <span className="private-badge">无痕</span>}
        </div>
      </div>

      <WindowControls />

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
    </header>
  )
}
