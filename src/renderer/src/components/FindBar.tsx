import { useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'

export function FindBar({
  open,
  query,
  activeMatch,
  totalMatches,
  onQueryChange,
  onNext,
  onPrevious,
  onClose
}: {
  open: boolean
  query: string
  activeMatch: number
  totalMatches: number
  onQueryChange: (query: string) => void
  onNext: () => void
  onPrevious: () => void
  onClose: () => void
}): React.ReactElement | null {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [open])

  if (!open) return null

  return (
    <div className="find-bar" role="search">
      <Search size={15} className="find-bar-icon" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
          } else if (event.key === 'Enter') {
            event.preventDefault()
            if (event.shiftKey) onPrevious()
            else onNext()
          }
        }}
        placeholder="在本页中查找"
        aria-label="在本页中查找"
      />
      <span className="find-bar-count">
        {query ? (totalMatches > 0 ? `${activeMatch} / ${totalMatches}` : '无结果') : ''}
      </span>
      <button
        type="button"
        className="find-bar-button"
        aria-label="上一个"
        disabled={!totalMatches}
        onClick={onPrevious}
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        className="find-bar-button"
        aria-label="下一个"
        disabled={!totalMatches}
        onClick={onNext}
      >
        <ChevronDown size={16} />
      </button>
      <span className="find-bar-divider" />
      <button
        type="button"
        className="find-bar-button"
        aria-label="关闭查找"
        onClick={onClose}
      >
        <X size={15} />
      </button>
    </div>
  )
}
