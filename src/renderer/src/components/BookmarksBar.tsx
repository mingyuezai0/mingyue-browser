import { Bookmark, Folder } from 'lucide-react'
import type { Bookmark as BookmarkRecord, BookmarkFolder } from '../lib/types'
import { SiteIcon } from './SiteIcon'

export function BookmarksBar({
  bookmarks,
  folders,
  activeUrl,
  onOpen,
  onManage
}: {
  bookmarks: BookmarkRecord[]
  folders: BookmarkFolder[]
  activeUrl: string
  onOpen: (url: string) => void
  onManage: () => void
}): React.ReactElement {
  const rootBookmarks = bookmarks.filter((bookmark) => !bookmark.folderId)
  const rootFolders = folders.filter((folder) => !folder.parentId)

  return (
    <div className="bookmarks-bar" role="toolbar" aria-label="收藏夹">
      <div className="bookmarks-bar-items">
        {rootFolders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            className="bookmarks-bar-item bookmarks-bar-folder"
            title={folder.name}
            onClick={onManage}
          >
            <Folder size={15} />
            <span>{folder.name}</span>
          </button>
        ))}
        {rootBookmarks.map((bookmark) => (
          <button
            key={bookmark.id}
            type="button"
            className={`bookmarks-bar-item ${
              activeUrl === bookmark.url ? 'is-active' : ''
            }`}
            title={`${bookmark.title}\n${bookmark.url}`}
            onClick={() => onOpen(bookmark.url)}
          >
            <SiteIcon
              favicon={bookmark.favicon}
              title={bookmark.title}
              url={bookmark.url}
              size={16}
            />
            <span>{bookmark.title}</span>
          </button>
        ))}
        {rootFolders.length === 0 && rootBookmarks.length === 0 && (
          <span className="bookmarks-bar-empty">收藏夹为空</span>
        )}
      </div>
      <button
        type="button"
        className="bookmarks-bar-manage"
        title="管理收藏夹"
        aria-label="管理收藏夹"
        onClick={onManage}
      >
        <Bookmark size={14} />
      </button>
    </div>
  )
}
