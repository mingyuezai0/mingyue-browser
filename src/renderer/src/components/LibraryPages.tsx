import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bookmark,
  CircleAlert,
  Code2,
  Download,
  ExternalLink,
  EyeOff,
  FileArchive,
  FileText,
  FolderOpen,
  History,
  Image,
  Info,
  Palette,
  Pause,
  Play,
  Puzzle,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X
} from 'lucide-react'
import type { PluginInfo } from '../../../shared/types'
import type {
  Bookmark as BookmarkRecord,
  DownloadRecord,
  HistoryEntry
} from '../lib/types'
import {
  formatBytes,
  formatHistoryGroup,
  formatTimeOfDay
} from '../lib/date'
import {
  getDisplayUrl,
  getHostname
} from '../lib/search'
import { SiteIcon } from './SiteIcon'
import { EmptyState, Toggle } from './Ui'

function LibraryLayout({
  kicker,
  title,
  description,
  actions,
  children
}: {
  kicker: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}): React.ReactElement {
  return (
    <div className="library-page">
      <header className="library-header">
        <div className="library-heading">
          <span className="library-kicker">
            <Sparkles size={12} />
            {kicker}
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions && <div className="library-actions">{actions}</div>}
      </header>
      <div className="library-content">{children}</div>
    </div>
  )
}

function LibrarySearch({
  value,
  onChange,
  placeholder
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}): React.ReactElement {
  return (
    <label className="library-search">
      <Search size={16} />
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
      />
      {value && (
        <button type="button" aria-label="清空搜索" onClick={() => onChange('')}>
          <X size={13} />
        </button>
      )}
    </label>
  )
}

export function BookmarksPage({
  bookmarks,
  activeUrl,
  onOpen,
  onDelete,
  onAddCurrent
}: {
  bookmarks: BookmarkRecord[]
  activeUrl: string
  onOpen: (url: string) => void
  onDelete: (id: string) => void
  onAddCurrent: () => void
}): React.ReactElement {
  const [filter, setFilter] = useState('')
  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return bookmarks
    return bookmarks.filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query)
    )
  }, [bookmarks, filter])
  const alreadySaved = bookmarks.some((bookmark) => bookmark.url === activeUrl)

  return (
    <LibraryLayout
      kicker="书签"
      title="书签"
      description={`${bookmarks.length} 个书签，保存在本机。`}
      actions={
        <div className="library-action-row">
          <LibrarySearch
            value={filter}
            onChange={setFilter}
            placeholder="搜索书签…"
          />
          <button
            type="button"
            className="primary-button"
            onClick={onAddCurrent}
            disabled={!activeUrl || alreadySaved}
          >
            <Bookmark size={16} />
            {alreadySaved ? '已在书签中' : '收藏当前页'}
          </button>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={24} />}
          title={bookmarks.length === 0 ? '暂无书签' : '没有找到相关书签'}
          description={
            bookmarks.length === 0
              ? '打开网页后，点击地址栏右侧的星标即可添加书签。'
              : '换一个关键词，或者清空搜索。'
          }
          action={
            bookmarks.length > 0 ? (
              <button type="button" className="secondary-button" onClick={() => setFilter('')}>
                清空搜索
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="bookmark-grid">
          {filtered.map((bookmark, index) => (
            <article
              key={bookmark.id}
              className="bookmark-card"
              style={{ '--stagger': `${Math.min(index, 8) * 28}ms` } as React.CSSProperties}
            >
              <button
                type="button"
                className="bookmark-main"
                onClick={() => onOpen(bookmark.url)}
              >
                <SiteIcon
                  favicon={bookmark.favicon}
                  title={bookmark.title}
                  url={bookmark.url}
                  size={44}
                />
                <span className="bookmark-copy">
                  <strong>{bookmark.title}</strong>
                  <small>{getHostname(bookmark.url)}</small>
                  <span className="bookmark-url">{getDisplayUrl(bookmark.url)}</span>
                </span>
                <ArrowUpRight size={17} className="bookmark-arrow" />
              </button>
              <button
                type="button"
                className="bookmark-delete"
                aria-label={`删除书签 ${bookmark.title}`}
                onClick={() => onDelete(bookmark.id)}
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))}
        </div>
      )}
      <p className="library-footnote">
        书签仅保存在本机，不会上传。
      </p>
    </LibraryLayout>
  )
}

export function HistoryPage({
  history,
  onOpen,
  onDelete,
  onClear
}: {
  history: HistoryEntry[]
  onOpen: (url: string) => void
  onDelete: (id: string) => void
  onClear: () => void
}): React.ReactElement {
  const [filter, setFilter] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return history
    return history.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.url.toLowerCase().includes(query)
    )
  }, [filter, history])

  const groups = useMemo(() => {
    const grouped: Array<{ label: string; items: HistoryEntry[] }> = []
    for (const entry of filtered) {
      const label = formatHistoryGroup(entry.visitedAt)
      const last = grouped[grouped.length - 1]
      if (last && last.label === label) last.items.push(entry)
      else grouped.push({ label, items: [entry] })
    }
    return grouped
  }, [filtered])

  return (
    <LibraryLayout
      kicker="历史记录"
      title="历史记录"
      description="访问记录仅保存在本机，可随时删除或清空。"
      actions={
        <div className="library-action-row">
          <LibrarySearch value={filter} onChange={setFilter} placeholder="搜索历史…" />
          {history.length > 0 &&
            (confirmClear ? (
              <div className="confirm-inline">
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    onClear()
                    setConfirmClear(false)
                  }}
                >
                  确认清空
                </button>
                <button type="button" className="text-button" onClick={() => setConfirmClear(false)}>
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 size={15} />
                清空历史
              </button>
            ))}
        </div>
      }
    >
      {groups.length === 0 ? (
        <EmptyState
          icon={<History size={24} />}
          title={history.length === 0 ? '暂无历史记录' : '没有找到相关记录'}
          description={
            history.length === 0
              ? '打开网页后，这里会显示访问记录。'
              : '换一个关键词，或者查看全部历史。'
          }
          action={
            history.length > 0 ? (
              <button type="button" className="secondary-button" onClick={() => setFilter('')}>
                查看全部历史
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="history-groups">
          {groups.map((group) => (
            <section className="history-group" key={group.label}>
              <div className="history-group-label">
                <span>{group.label}</span>
                <span>{group.items.length}</span>
              </div>
              <div className="history-list">
                {group.items.map((entry) => (
                  <div className="history-row" key={entry.id}>
                    <button
                      type="button"
                      className="history-main"
                      onClick={() => onOpen(entry.url)}
                    >
                      <span className="history-time">{formatTimeOfDay(entry.visitedAt)}</span>
                      <SiteIcon
                        favicon={entry.favicon}
                        title={entry.title}
                        url={entry.url}
                        size={28}
                      />
                      <span className="history-copy">
                        <strong>{entry.title || getHostname(entry.url)}</strong>
                        <small>{getDisplayUrl(entry.url)}</small>
                      </span>
                      <ArrowUpRight size={15} className="history-arrow" />
                    </button>
                    <button
                      type="button"
                      className="history-delete"
                      aria-label={`删除历史记录 ${entry.title}`}
                      onClick={() => onDelete(entry.id)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </LibraryLayout>
  )
}

function DownloadFileIcon({ fileName }: { fileName: string }): React.ReactElement {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) {
    return <Image size={22} />
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'pages'].includes(ext)) {
    return <FileText size={22} />
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive size={22} />
  }
  return <Download size={22} />
}

export function DownloadsPage({
  downloads,
  onOpenFile,
  onShowInFolder,
  onCancel,
  onPause,
  onResume,
  onClearCompleted
}: {
  downloads: DownloadRecord[]
  onOpenFile: (path: string) => void
  onShowInFolder: (path: string) => void
  onCancel: (id: string) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
  onClearCompleted: () => void
}): React.ReactElement {
  const [filter, setFilter] = useState('')
  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return downloads
    return downloads.filter(
      (download) =>
        download.fileName.toLowerCase().includes(query) ||
        download.url.toLowerCase().includes(query)
    )
  }, [downloads, filter])
  const activeCount = downloads.filter(
    (item) => item.state === 'progressing' || item.state === 'paused'
  ).length

  return (
    <LibraryLayout
      kicker="下载内容"
      title="下载内容"
      description={`${downloads.length} 个文件，${activeCount} 个正在进行`}
      actions={
        <div className="library-action-row">
          <LibrarySearch value={filter} onChange={setFilter} placeholder="搜索下载…" />
          <button
            type="button"
            className="secondary-button"
            disabled={downloads.length === 0}
            onClick={onClearCompleted}
          >
            <Trash2 size={15} />
            清除已结束
          </button>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          icon={<ArrowDownToLine size={24} />}
          title={downloads.length === 0 ? '暂无下载' : '没有找到相关文件'}
          description={
            downloads.length === 0
              ? '从网页下载的文件会显示在这里。'
              : '换一个文件名试试。'
          }
        />
      ) : (
        <div className="download-list">
          {filtered.map((download) => {
            const progress =
              download.totalBytes > 0
                ? Math.min(100, Math.round((download.receivedBytes / download.totalBytes) * 100))
                : 0
            return (
              <article className="download-card" key={download.id}>
                <div className="download-file-icon">
                  <DownloadFileIcon fileName={download.fileName} />
                </div>
                <div className="download-main">
                  <div className="download-heading">
                    <strong>{download.fileName}</strong>
                    {download.isPrivate && (
                      <span className="download-private-badge">
                        <EyeOff size={10} />
                        无痕
                      </span>
                    )}
                    <span className={`download-state state-${download.state}`}>
                      {download.state === 'progressing'
                        ? `${progress}%`
                        : download.state === 'paused'
                          ? '已暂停'
                          : download.state === 'completed'
                            ? '已完成'
                            : download.state === 'cancelled'
                              ? '已取消'
                              : '已中断'}
                    </span>
                  </div>
                  <span className="download-url">{getHostname(download.url)}</span>
                  {download.state === 'progressing' ||
                  download.state === 'paused' ? (
                    <div className="download-progress">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  ) : (
                    <span className="download-size">
                      {formatBytes(download.receivedBytes)}
                      {download.totalBytes > 0 && ` / ${formatBytes(download.totalBytes)}`}
                    </span>
                  )}
                </div>
                <div className="download-actions">
                  {download.state === 'progressing' ? (
                    <>
                      <button
                        type="button"
                        className="download-action"
                        title="暂停下载"
                        onClick={() => onPause(download.id)}
                      >
                        <Pause size={15} />
                      </button>
                      <button
                        type="button"
                        className="text-button is-danger"
                        onClick={() => onCancel(download.id)}
                      >
                        取消
                      </button>
                    </>
                  ) : download.state === 'paused' ? (
                    <>
                      <button
                        type="button"
                        className="download-action"
                        title="继续下载"
                        onClick={() => onResume(download.id)}
                      >
                        <Play size={15} />
                      </button>
                      <button
                        type="button"
                        className="text-button is-danger"
                        onClick={() => onCancel(download.id)}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      {download.state === 'completed' && (
                        <button
                          type="button"
                          className="download-action"
                          title="打开文件"
                          onClick={() => onOpenFile(download.savePath)}
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="download-action"
                        title="在文件夹中显示"
                        onClick={() => onShowInFolder(download.savePath)}
                      >
                        <FolderOpen size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
      <p className="library-footnote">
        保存位置可在「设置 → 下载」中更改
      </p>
    </LibraryLayout>
  )
}

export function PluginsPage({
  plugins,
  blockedCount,
  onToggle,
  onInstallLocal,
  onRemoveLocal,
  onOpenSettings
}: {
  plugins: PluginInfo[]
  blockedCount: number
  onToggle: (id: string, enabled: boolean) => Promise<void>
  onInstallLocal: () => Promise<void>
  onRemoveLocal: (id: string) => Promise<void>
  onOpenSettings: () => void
}): React.ReactElement {
  const [busyId, setBusyId] = useState<string | null>(null)

  const togglePlugin = async (plugin: PluginInfo): Promise<void> => {
    setBusyId(plugin.id)
    try {
      await onToggle(plugin.id, !plugin.enabled)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <LibraryLayout
      kicker="插件"
      title="插件"
      description="管理浏览器插件。插件在本机运行，可随时开启或关闭。"
      actions={
        <div className="library-action-row">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void onInstallLocal()}
          >
            <Puzzle size={15} />
            安装本地扩展
          </button>
          <button type="button" className="secondary-button" onClick={onOpenSettings}>
            <Palette size={15} />
            外观与隐私设置
          </button>
        </div>
      }
    >
      {plugins.length === 0 ? (
        <EmptyState
          icon={<Puzzle size={24} />}
          title="暂无可用插件"
          description="内置插件正在加载，请稍后重新打开此页面。"
        />
      ) : (
        <div className="plugin-list">
          {plugins.map((plugin) => {
            const statusLabel =
              plugin.status === 'loading'
                ? '正在加载规则'
                : plugin.status === 'error'
                  ? '启动失败'
                  : plugin.enabled
                    ? '运行中'
                    : '已关闭'
            return (
              <article
                className={`plugin-card status-${plugin.status}`}
                key={plugin.id}
              >
                <div className="plugin-card-head">
                  <div className="plugin-identity">
                    <span className="plugin-icon">
                      {plugin.id === 'adblock' ? (
                        <ShieldCheck size={22} />
                      ) : (
                        <Puzzle size={22} />
                      )}
                    </span>
                    <div className="plugin-title-copy">
                      <div className="plugin-title-row">
                        <h2>{plugin.name}</h2>
                        {plugin.builtin ? (
                          <span className="plugin-badge">内置插件</span>
                        ) : (
                          <span className="plugin-badge plugin-badge--muted">
                            本地扩展
                          </span>
                        )}
                        {plugin.id === 'adblock' && (
                          <span className="plugin-badge plugin-badge--muted">
                            默认开启
                          </span>
                        )}
                      </div>
                      <p>{plugin.description}</p>
                    </div>
                  </div>
                  <div className="plugin-control">
                    <span
                      className={`plugin-status ${
                        plugin.enabled && plugin.status === 'active'
                          ? 'is-active'
                          : plugin.status === 'error'
                            ? 'is-error'
                            : ''
                      }`}
                    >
                      <span />
                      {statusLabel}
                    </span>
                    <Toggle
                      checked={plugin.enabled}
                      disabled={busyId === plugin.id}
                      onChange={() => void togglePlugin(plugin)}
                      label={`${plugin.enabled ? '关闭' : '开启'}${plugin.name}`}
                    />
                    {!plugin.builtin && (
                      <button
                        type="button"
                        className="plugin-remove"
                        title="移除本地扩展"
                        aria-label={`移除 ${plugin.name}`}
                        onClick={() => void onRemoveLocal(plugin.id)}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {plugin.detail && (
                  <div className="plugin-detail">
                    {plugin.status === 'error' ? (
                      <CircleAlert size={14} />
                    ) : (
                      <Info size={14} />
                    )}
                    <span>{plugin.detail}</span>
                  </div>
                )}

                <div className="plugin-meta">
                  <span>版本 {plugin.version}</span>
                  <span>{plugin.author}</span>
                  <span>{plugin.license}</span>
                  {plugin.homepage && (
                    <span className="plugin-source">
                      {plugin.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  )}
                  <span className="plugin-counter">
                    {plugin.id === 'adblock'
                      ? `已拦截 ${blockedCount} 个请求`
                      : `已处理 ${plugin.blockedCount} 个请求`}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <section className="plugin-api-card">
        <div className="plugin-api-icon">
          <Code2 size={21} />
        </div>
        <div>
          <div className="plugin-api-title">
            <h2>插件接口 v1</h2>
            <span>开发者</span>
          </div>
          <p>
            支持同步请求拦截与页面脚本注入。新增插件时，实现
            <code>MingyuePlugin</code> 接口并在主进程插件注册表中登记，即可在插件页面统一管理。
          </p>
        </div>
      </section>

      <p className="library-footnote">
        广告与跟踪拦截基于开源项目 Ghostery Adblocker（MPL-2.0）。
      </p>
    </LibraryLayout>
  )
}
