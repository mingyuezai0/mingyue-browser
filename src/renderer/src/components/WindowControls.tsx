import { useEffect, useState } from 'react'
import { Copy, Minus, Square, X } from 'lucide-react'

export function WindowControls(): React.ReactElement {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!window.mingyue) return
    void window.mingyue.window.isMaximized().then(setMaximized)
    return window.mingyue.window.onMaximizeChange(setMaximized)
  }, [])

  const handleMaximize = (): void => {
    void window.mingyue?.window.toggleMaximize().then(setMaximized)
  }

  return (
    <div className="window-controls">
      <button
        type="button"
        className="window-control"
        aria-label="最小化"
        onClick={() => void window.mingyue?.window.minimize()}
      >
        <Minus size={15} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        className="window-control"
        aria-label={maximized ? '还原' : '最大化'}
        onClick={handleMaximize}
      >
        {maximized ? (
          <Copy size={13} strokeWidth={1.7} />
        ) : (
          <Square size={12} strokeWidth={1.7} />
        )}
      </button>
      <button
        type="button"
        className="window-control window-control--close"
        aria-label="关闭"
        onClick={() => void window.mingyue?.window.close()}
      >
        <X size={16} strokeWidth={1.8} />
      </button>
    </div>
  )
}
