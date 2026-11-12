import { useState } from 'react'
import {
  FolderPlus,
  Layers,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import type { Tab, TabGroup } from '../lib/types'
import { SiteIcon } from './SiteIcon'

const GROUP_COLORS = ['#5f735a', '#975c43', '#846b36', '#984c47', '#7d8775']

export function TabGroupsPanel({
  open,
  groups,
  tabs,
  activeId,
  onClose,
  onCreate,
  onDelete,
  onRename,
  onAssign,
  onRemoveTab,
  onSelectTab
}: {
  open: boolean
  groups: TabGroup[]
  tabs: Tab[]
  activeId: string
  onClose: () => void
  onCreate: (name: string, color: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onAssign: (tabId: string, groupId: string | null) => void
  onRemoveTab: (tabId: string) => void
  onSelectTab: (id: string) => void
}): React.ReactElement | null {
  const [name, setName] = useState('')
  const [color, setColor] = useState(GROUP_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  if (!open) return null
  const activeTab = tabs.find((tab) => tab.id === activeId)

  return (
    <div className="tab-groups-layer">
      <button className="tab-groups-scrim" type="button" aria-label="关闭标签组" onClick={onClose} />
      <section className="tab-groups-panel" role="dialog" aria-modal="true" aria-label="标签组">
        <header className="tab-groups-head">
          <div>
            <span className="sheet-eyebrow">整理标签页</span>
            <h2><Layers size={20} /> 标签组 <span>{groups.length}</span></h2>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </header>

        <form
          className="tab-group-create"
          onSubmit={(event) => {
            event.preventDefault()
            const next = name.trim()
            if (!next) return
            onCreate(next, color)
            setName('')
          }}
        >
          <FolderPlus size={16} />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="新建标签组，例如：工作"
          />
          <div className="tab-group-colors" aria-label="标签组颜色">
            {GROUP_COLORS.map((value) => (
              <button
                key={value}
                type="button"
                className={color === value ? 'is-selected' : ''}
                style={{ background: value }}
                aria-label={`选择颜色 ${value}`}
                onClick={() => setColor(value)}
              />
            ))}
          </div>
          <button type="submit" className="primary-button" disabled={!name.trim()}>
            <Plus size={15} /> 新建
          </button>
        </form>

        <div className="tab-group-list">
          {groups.length === 0 && (
            <div className="tab-group-empty">
              <Layers size={23} />
              <strong>还没有标签组</strong>
              <span>把相关标签页放进一个组，切换时会更清爽。</span>
            </div>
          )}
          {groups.map((group) => {
            const groupTabs = tabs.filter((tab) => tab.groupId === group.id)
            return (
              <article key={group.id} className="tab-group-card">
                <header>
                  <span className="tab-group-dot" style={{ background: group.color }} />
                  {editingId === group.id ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        if (editingName.trim()) onRename(group.id, editingName.trim())
                        setEditingId(null)
                      }}
                    >
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        onBlur={() => setEditingId(null)}
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="tab-group-name"
                      title="重命名标签组"
                      onClick={() => {
                        setEditingId(group.id)
                        setEditingName(group.name)
                      }}
                    >
                      {group.name}
                    </button>
                  )}
                  <small>{groupTabs.length} 个标签</small>
                  <button
                    type="button"
                    className="tab-group-delete"
                    title="删除标签组"
                    onClick={() => onDelete(group.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </header>

                <div className="tab-group-tabs">
                  {groupTabs.length === 0 && (
                    <span className="tab-group-tab-empty">这个组还是空的</span>
                  )}
                  {groupTabs.map((tab) => (
                    <div key={tab.id} className="tab-group-tab">
                      <button type="button" onClick={() => onSelectTab(tab.id)}>
                        <SiteIcon
                          favicon={tab.favicon}
                          title={tab.title}
                          url={tab.url}
                          size={17}
                        />
                        <span>{tab.title || '新标签页'}</span>
                      </button>
                      <button
                        type="button"
                        className="tab-group-tab-remove"
                        aria-label={`从标签组移除 ${tab.title}`}
                        onClick={() => onRemoveTab(tab.id)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="tab-group-assign"
                  disabled={!activeTab || activeTab.groupId === group.id}
                  onClick={() => activeTab && onAssign(activeTab.id, group.id)}
                >
                  <Plus size={13} /> 把当前页加入
                </button>
              </article>
            )
          })}
        </div>

        {activeTab?.groupId && (
          <button
            type="button"
            className="text-button tab-group-leave"
            onClick={() => onAssign(activeTab.id, null)}
          >
            将当前页移出标签组
          </button>
        )}
      </section>
    </div>
  )
}
