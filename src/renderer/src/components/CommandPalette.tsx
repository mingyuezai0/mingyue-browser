import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CornerDownLeft, Search, Sparkles } from 'lucide-react'
import type { Tab } from '../lib/types'
import { getDisplayUrl } from '../lib/search'
import { SiteIcon } from './SiteIcon'
import { Kbd } from './Ui'

export interface PaletteCommand {
  id: string
  label: string
  hint?: string
  icon: ReactNode
  shortcut?: string
  group: '操作' | '前往'
  keywords?: string
  run: () => void
}

interface PaletteRow {
  id: string
  type: 'tab' | 'command'
  label: string
  hint?: string
  icon: ReactNode
  shortcut?: string
  group: string
  run: () => void
  searchText: string
}

export function CommandPalette({
  open,
  tabs,
  activeId,
  commands,
  onClose,
  onSelectTab
}: {
  open: boolean
  tabs: Tab[]
  activeId: string
  commands: PaletteCommand[]
  onClose: () => void
  onSelectTab: (id: string) => void
}): React.ReactElement | null {
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlighted(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const rows = useMemo<PaletteRow[]>(() => {
    const normalized = query.trim().toLowerCase()
    const tabRows: PaletteRow[] = tabs.map((tab) => ({
      id: `tab-${tab.id}`,
      type: 'tab',
      label: tab.title || '新标签页',
      hint: tab.url ? getDisplayUrl(tab.url) : '明月起始页',
      icon: (
        <SiteIcon favicon={tab.favicon} title={tab.title} url={tab.url} size={26} />
      ),
      group: tab.id === activeId ? '当前标签页' : '标签页',
      run: () => onSelectTab(tab.id),
      searchText: `${tab.title} ${tab.url}`.toLowerCase()
    }))

    const commandRows: PaletteRow[] = commands.map((command) => ({
      id: `command-${command.id}`,
      type: 'command',
      label: command.label,
      hint: command.hint,
      icon: command.icon,
      shortcut: command.shortcut,
      group: command.group,
      run: command.run,
      searchText: `${command.label} ${command.keywords ?? ''}`.toLowerCase()
    }))

    const all = [...tabRows, ...commandRows]
    return normalized
      ? all
          .filter((row) => row.searchText.includes(normalized))
          .sort((a, b) => {
            const aStarts = a.label.toLowerCase().startsWith(normalized) ? 0 : 1
            const bStarts = b.label.toLowerCase().startsWith(normalized) ? 0 : 1
            return aStarts - bStarts
          })
      : all
  }, [activeId, commands, onSelectTab, query, tabs])

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  useEffect(() => {
    const element = listRef.current?.querySelector<HTMLElement>(
      `[data-palette-index="${highlighted}"]`
    )
    element?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  if (!open) return null

  const runRow = (row: PaletteRow): void => {
    onClose()
    row.run()
  }

  let lastGroup = ''

  return (
    <div className="palette-layer" role="presentation">
      <button className="palette-scrim" type="button" aria-label="关闭命令面板" onClick={onClose} />
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="命令面板">
        <div className="palette-input-row">
          <Search size={20} className="palette-search-icon" />
          <input
            ref={inputRef}
            value={query}
            placeholder="搜索标签页，或输入一个操作…"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
              } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                setHighlighted((current) => Math.min(rows.length - 1, current + 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setHighlighted((current) => Math.max(0, current - 1))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                if (rows[highlighted]) runRow(rows[highlighted])
              }
            }}
          />
          <span className="palette-brand-chip">
            <Sparkles size={13} />
            明月
          </span>
        </div>

        <div className="palette-results" ref={listRef}>
          {rows.length === 0 ? (
            <div className="palette-empty">
              <span>没有找到匹配项</span>
              <small>换个关键词试试</small>
            </div>
          ) : (
            rows.map((row, index) => {
              const showGroup = row.group !== lastGroup
              lastGroup = row.group
              return (
                <div key={row.id}>
                  {showGroup && <div className="palette-group-label">{row.group}</div>}
                  <button
                    type="button"
                    data-palette-index={index}
                    className={`palette-row ${highlighted === index ? 'is-highlighted' : ''}`}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => runRow(row)}
                  >
                    <span className="palette-row-icon">{row.icon}</span>
                    <span className="palette-row-copy">
                      <span className="palette-row-label">{row.label}</span>
                      {row.hint && <span className="palette-row-hint">{row.hint}</span>}
                    </span>
                    {row.type === 'tab' ? (
                      <span className="palette-row-type">
                        {row.group === '当前标签页' ? '当前' : '标签'}
                      </span>
                    ) : row.shortcut ? (
                      <span className="palette-shortcut">{row.shortcut}</span>
                    ) : null}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="palette-footer">
          <span>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            移动
          </span>
          <span>
            <Kbd>
              <CornerDownLeft size={10} />
            </Kbd>
            打开
          </span>
          <span>
            <Kbd>Esc</Kbd>
            关闭
          </span>
        </div>
      </section>
    </div>
  )
}
