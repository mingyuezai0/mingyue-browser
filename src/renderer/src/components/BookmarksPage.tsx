import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  ArrowUpRight,
  Bookmark,
  CheckSquare,
  Download,
  Folder,
  FolderPlus,
  Layers,
  Plus,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import type {
  Bookmark as BookmarkRecord,
  BookmarkFolder
} from '../lib/types'
import { getDisplayUrl } from '../lib/search'
import { SiteIcon } from './SiteIcon'
import { EmptyState } from './Ui'

export function BookmarksPage({
  bookmarks,
  folders,
  activeUrl,
  onOpen,
  onDelete,
  onAddCurrent,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveBookmarks,
  onImport,
  onExport
}: {
  bookmarks: BookmarkRecord[]
  folders: BookmarkFolder[]
  activeUrl: string
  onOpen: (url: string) => void
  onDelete: (id: string) => void
  onAddCurrent: () => void
  onAddFolder: (name: string) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onMoveBookmarks: (ids: string[], folderId: string | null) => void
  onImport: () => void
  onExport: () => void
}): React.ReactElement {
  const [filter, setFilter] = useState('')
  const [activeFolder, setActiveFolder] = useState<string | 'all' | 'bar'>('all')
  const [managing, setManaging] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase()
    return bookmarks.filter((bookmark) => {
      if (activeFolder === 'bar' && bookmark.folderId) return false
      if (
        activeFolder !== 'all' &&
        activeFolder !== 'bar' &&
        bookmark.folderId !== activeFolder
      ) {
        return false
      }
      return (
        !query ||
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query)
      )
    })
  }, [activeFolder, bookmarks, filter])

  const folderCount = (id: string): number =>
    bookmarks.filter((bookmark) => bookmark.folderId === id).length
  const rootCount = bookmarks.filter((bookmark) => !bookmark.folderId).length
  const alreadySaved = bookmarks.some((bookmark) => bookmark.url === activeUrl)

  const toggleSelection = (id: string): void => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = (): void => {
    setSelected((current) =>
      current.size === filtered.length
        ? new Set()
        : new Set(filtered.map((bookmark) => bookmark.id))
    )
  }

  const finishFolder = (): void => {
    const name = (renamingId ? renameValue : folderName).trim()
    if (!name) return
    if (renamingId) onRenameFolder(renamingId, name)
    else onAddFolder(name)
    setFolderName('')
    setRenameValue('')
    setRenamingId(null)
    setShowFolderForm(false)
  }

  const folderButton = (
    id: string | 'all' | 'bar',
    label: string,
    count: number,
    icon: ReactNode
  ): React.ReactElement => (
    <button
      key={id}
      type="button"
      className={`bookmark-folder-button ${
        activeFolder === id ? 'is-active' : ''
      }`}
      onClick={() => setActiveFolder(id)}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <small>{count}</small>
    </button>
  )

  return (
    <div className="library-page bookmarks-library">
      <header className="library-header">
        <div className="library-heading">
          <span className="library-kicker">
            <Bookmark size={12} /> 书签
          </span>
          <h1>书签</h1>
          <p>{bookmarks.length} 个书签，包含文件夹与书签栏，保存在本机。</p>
        </div>
        <div className="library-actions">
          <label className="library-search">
            <Search size={16} />
            <input
              value={filter}
              placeholder="搜索书签…"
              onChange={(event) => setFilter(event.target.value)}
              spellCheck={false}
            />
            {filter && (
              <button
                type="button"
                aria-label="清空搜索"
                onClick={() => setFilter('')}
              >
                <X size={13} />
              </button>
            )}
          </label>
          <button type="button" className="secondary-button" onClick={onImport}>
            <Upload size={15} /> 导入
          </button>
          <button type="button" className="secondary-button" onClick={onExport}>
            <Download size={15} /> 导出
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setManaging((value) => !value)
              setSelected(new Set())
            }}
          >
            <CheckSquare size={15} /> {managing ? '退出管理' : '批量管理'}
          </button>
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
      </header>

      <div className="bookmarks-library-body">
        <aside className="bookmark-folders">
          <div className="bookmark-folders-title">
            <span>收藏夹</span>
            <button
              type="button"
              title="新建文件夹"
              onClick={() => {
                setRenamingId(null)
                setFolderName('')
                setShowFolderForm(true)
              }}
            >
              <FolderPlus size={15} />
            </button>
          </div>
          {folderButton('all', '全部书签', bookmarks.length, <Layers size={15} />)}
          {folderButton('bar', '书签栏', rootCount, <Bookmark size={15} />)}
          {folders.map((folder) =>
            renamingId === folder.id ? (
              <form
                key={folder.id}
                className="bookmark-folder-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  finishFolder()
                }}
              >
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={() => setRenamingId(null)}
                />
              </form>
            ) : (
              <div className="bookmark-folder-row" key={folder.id}>
                {folderButton(
                  folder.id,
                  folder.name,
                  folderCount(folder.id),
                  <Folder size={15} />
                )}
                <button
                  type="button"
                  className="bookmark-folder-edit"
                  title="重命名文件夹"
                  onClick={() => {
                    setRenamingId(folder.id)
                    setRenameValue(folder.name)
                  }}
                >
                  <span aria-hidden="true">⋯</span>
                </button>
                <button
                  type="button"
                  className="bookmark-folder-delete"
                  title="删除文件夹"
                  onClick={() => {
                    onDeleteFolder(folder.id)
                    if (activeFolder === folder.id) setActiveFolder('all')
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          )}
          {showFolderForm && (
            <form
              className="bookmark-folder-form"
              onSubmit={(event) => {
                event.preventDefault()
                finishFolder()
              }}
            >
              <input
                autoFocus
                value={folderName}
                placeholder="文件夹名称"
                onChange={(event) => setFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setShowFolderForm(false)
                }}
              />
              <button type="submit" className="small-button">
                创建
              </button>
            </form>
          )}
        </aside>

        <main className="bookmarks-main">
          {managing && (
            <div className="bookmark-bulk-bar">
              <button type="button" className="text-button" onClick={selectAll}>
                {selected.size === filtered.length ? '取消全选' : '全选'}
              </button>
              <span>已选 {selected.size} 项</span>
              <select
                defaultValue=""
                disabled={selected.size === 0}
                onChange={(event) => {
                  const value = event.target.value
                  if (!value) return
                  onMoveBookmarks(
                    Array.from(selected),
                    value === '__root__' ? null : value
                  )
                  setSelected(new Set())
                  event.target.value = ''
                }}
              >
                <option value="" disabled>
                  移动到…
                </option>
                <option value="__root__">书签栏（根目录）</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-button is-danger"
                disabled={selected.size === 0}
                onClick={() => {
                  selected.forEach(onDelete)
                  setSelected(new Set())
                }}
              >
                删除所选
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Bookmark size={24} />}
              title={bookmarks.length === 0 ? '暂无书签' : '这个收藏夹是空的'}
              description={
                bookmarks.length === 0
                  ? '打开网页后，点击地址栏右侧的星标即可添加书签。'
                  : '换一个收藏夹或搜索词，也可以从浏览器导入书签。'
              }
              action={
                <button type="button" className="secondary-button" onClick={onImport}>
                  <Upload size={15} /> 导入书签
                </button>
              }
            />
          ) : (
            <div className="bookmark-grid">
              {filtered.map((bookmark, index) => (
                <article
                  key={bookmark.id}
                  className={`bookmark-card ${
                    selected.has(bookmark.id) ? 'is-selected' : ''
                  }`}
                  style={{ '--stagger': `${Math.min(index, 8) * 28}ms` } as CSSProperties}
                >
                  {managing && (
                    <button
                      type="button"
                      className={`bookmark-select ${
                        selected.has(bookmark.id) ? 'is-selected' : ''
                      }`}
                      aria-label={`选择 ${bookmark.title}`}
                      onClick={() => toggleSelection(bookmark.id)}
                    >
                      {selected.has(bookmark.id) && <span>✓</span>}
                    </button>
                  )}
                  <button
                    type="button"
                    className="bookmark-main"
                    onClick={() =>
                      managing ? toggleSelection(bookmark.id) : onOpen(bookmark.url)
                    }
                  >
                    <SiteIcon
                      favicon={bookmark.favicon}
                      title={bookmark.title}
                      url={bookmark.url}
                      size={44}
                    />
                    <span className="bookmark-copy">
                      <strong>{bookmark.title}</strong>
                      <small>
                        {bookmark.folderId
                          ? folders.find((folder) => folder.id === bookmark.folderId)
                              ?.name ?? '文件夹'
                          : '书签栏'}
                      </small>
                      <span className="bookmark-url">
                        {getDisplayUrl(bookmark.url)}
                      </span>
                    </span>
                    <ArrowUpRight size={17} className="bookmark-arrow" />
                  </button>
                  {!managing && (
                    <button
                      type="button"
                      className="bookmark-delete"
                      aria-label={`删除书签 ${bookmark.title}`}
                      onClick={() => onDelete(bookmark.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          <p className="library-footnote">
            书签保存在本机；导出文件可用于备份或迁移到其他浏览器。
          </p>
        </main>
      </div>
    </div>
  )
}
