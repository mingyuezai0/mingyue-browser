import { useEffect, type ReactNode } from 'react'
import {
  ArrowDownToLine,
  Bookmark,
  BookOpen,
  Camera,
  Code2,
  EyeOff,
  FileDown,
  FileSearch,
  History,
  Home,
  Layers,
  Minus,
  PictureInPicture2,
  Plus,
  Printer,
  Puzzle,
  Copy,
  RotateCcw,
  ScanLine,
  Search,
  Settings2,
  X,
  ZoomIn
} from 'lucide-react'
import type { InternalView } from '../lib/types'
import { Kbd } from './Ui'

interface MenuAction {
  id: string
  label: string
  icon: ReactNode
  shortcut?: string
  disabled?: boolean
  onSelect: () => void
}

export function MoreMenu({
  open,
  pageAvailable,
  isBookmarked,
  zoom,
  onClose,
  onNewPrivateTab,
  onToggleBookmark,
  onFind,
  onPrint,
  onDevTools,
  onOpenView,
  onHome,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  readerMode,
  onToggleReader,
  onScreenshot,
  onSavePdf,
  onPictureInPicture,
  onOpenTabGroups,
  onCloseDuplicateTabs,
  onSearchTabs
}: {
  open: boolean
  pageAvailable: boolean
  isBookmarked: boolean
  zoom: number
  onClose: () => void
  onNewPrivateTab: () => void
  onToggleBookmark: () => void
  onFind: () => void
  onPrint: () => void
  onDevTools: () => void
  onOpenView: (view: InternalView) => void
  onHome: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  readerMode: boolean
  onToggleReader: () => void
  onScreenshot: (mode: 'full' | 'region') => void
  onSavePdf: () => void
  onPictureInPicture: () => void
  onOpenTabGroups: () => void
  onCloseDuplicateTabs: () => void
  onSearchTabs: () => void
}): React.ReactElement | null {
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose, open])

  if (!open) return null

  const pageActions: MenuAction[] = [
    {
      id: 'private',
      label: '新建无痕标签页',
      icon: <EyeOff size={16} />,
      shortcut: 'Ctrl Shift N',
      onSelect: onNewPrivateTab
    },
    {
      id: 'bookmark',
      label: isBookmarked ? '取消收藏此页' : '收藏此页',
      icon: <Bookmark size={16} />,
      shortcut: 'Ctrl D',
      disabled: !pageAvailable,
      onSelect: onToggleBookmark
    },
    {
      id: 'find',
      label: '在页面中查找',
      icon: <FileSearch size={16} />,
      shortcut: 'Ctrl F',
      disabled: !pageAvailable,
      onSelect: onFind
    },
    {
      id: 'tab-search',
      label: '搜索标签页',
      icon: <Search size={16} />,
      shortcut: 'Ctrl Shift A',
      onSelect: onSearchTabs
    },
    {
      id: 'reader',
      label: readerMode ? '退出阅读模式' : '进入阅读模式',
      icon: <BookOpen size={16} />,
      disabled: !pageAvailable,
      onSelect: onToggleReader
    },
    {
      id: 'home',
      label: '回到起始页',
      icon: <Home size={16} />,
      onSelect: onHome
    },
    {
      id: 'screenshot-full',
      label: '截取整页',
      icon: <Camera size={16} />,
      disabled: !pageAvailable,
      onSelect: () => onScreenshot('full')
    },
    {
      id: 'screenshot-region',
      label: '截取区域',
      icon: <ScanLine size={16} />,
      disabled: !pageAvailable,
      onSelect: () => onScreenshot('region')
    },
    {
      id: 'save-pdf',
      label: '另存为 PDF',
      icon: <FileDown size={16} />,
      disabled: !pageAvailable,
      onSelect: onSavePdf
    },
    {
      id: 'picture-in-picture',
      label: '画中画',
      icon: <PictureInPicture2 size={16} />,
      disabled: !pageAvailable,
      onSelect: onPictureInPicture
    },
    {
      id: 'print',
      label: '打印页面',
      icon: <Printer size={16} />,
      shortcut: 'Ctrl P',
      disabled: !pageAvailable,
      onSelect: onPrint
    },
    {
      id: 'devtools',
      label: '开发者工具',
      icon: <Code2 size={16} />,
      shortcut: 'F12',
      disabled: !pageAvailable,
      onSelect: onDevTools
    }
  ]

  const libraryActions: MenuAction[] = [
    {
      id: 'bookmarks',
      label: '书签',
      icon: <Bookmark size={16} />,
      onSelect: () => onOpenView('bookmarks')
    },
    {
      id: 'history',
      label: '历史记录',
      icon: <History size={16} />,
      shortcut: 'Ctrl H',
      onSelect: () => onOpenView('history')
    },
    {
      id: 'downloads',
      label: '下载',
      icon: <ArrowDownToLine size={16} />,
      shortcut: 'Ctrl J',
      onSelect: () => onOpenView('downloads')
    },
    {
      id: 'tab-groups',
      label: '标签组',
      icon: <Layers size={16} />,
      onSelect: onOpenTabGroups
    },
    {
      id: 'duplicate-tabs',
      label: '关闭重复标签页',
      icon: <Copy size={16} />,
      onSelect: onCloseDuplicateTabs
    },
    {
      id: 'plugins',
      label: '插件',
      icon: <Puzzle size={16} />,
      onSelect: () => onOpenView('plugins')
    },
    {
      id: 'settings',
      label: '设置',
      icon: <Settings2 size={16} />,
      shortcut: 'Ctrl ,',
      onSelect: () => onOpenView('settings')
    }
  ]

  return (
    <div className="menu-layer">
      <button className="menu-scrim" type="button" aria-label="关闭菜单" onClick={onClose} />
      <div className="more-menu" role="menu" aria-label="浏览器菜单">
        <div className="more-menu-head">
          <span>更多</span>
          <Kbd>Esc</Kbd>
          <button
            type="button"
            className="more-menu-close mobile-only"
            aria-label="关闭菜单"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>
        <div className="menu-group">
          <span className="menu-group-label">页面</span>
          {pageActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="menu-item"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                action.onSelect()
                onClose()
              }}
            >
              <span className="menu-item-icon">{action.icon}</span>
              <span className="menu-item-label">{action.label}</span>
              {action.shortcut && <span className="menu-shortcut">{action.shortcut}</span>}
            </button>
          ))}
          <div className="zoom-row">
            <span className="menu-item-icon">
              <ZoomIn size={16} />
            </span>
            <span className="menu-item-label">页面缩放</span>
            <div className="zoom-controls">
              <button
                type="button"
                aria-label="缩小"
                disabled={!pageAvailable || zoom <= 0.5}
                onClick={onZoomOut}
              >
                <Minus size={13} />
              </button>
              <button
                type="button"
                className="zoom-value"
                title="恢复 100%"
                disabled={!pageAvailable}
                onClick={onZoomReset}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                aria-label="放大"
                disabled={!pageAvailable || zoom >= 2.5}
                onClick={onZoomIn}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        <div className="menu-divider" />
        <div className="menu-group">
          <span className="menu-group-label">浏览器数据</span>
          {libraryActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="menu-item"
              role="menuitem"
              onClick={() => {
                action.onSelect()
                onClose()
              }}
            >
              <span className="menu-item-icon">{action.icon}</span>
              <span className="menu-item-label">{action.label}</span>
              {action.shortcut && <span className="menu-shortcut">{action.shortcut}</span>}
            </button>
          ))}
        </div>

        <div className="more-menu-foot">
          <span className="menu-foot-mark">明月</span>
          <span>浏览数据仅保存在本机</span>
          <button type="button" aria-label="重置缩放" onClick={onZoomReset}>
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
