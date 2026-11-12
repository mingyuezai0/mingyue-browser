import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
  variant?: 'plain' | 'paper' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
}

export function IconButton({
  label,
  children,
  className = '',
  variant = 'plain',
  size = 'md',
  active = false,
  ...props
}: IconButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      className={`icon-button icon-button--${variant} icon-button--${size} ${
        active ? 'is-active' : ''
      } ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}): React.ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'is-on' : ''}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}): React.ReactElement {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }): React.ReactElement {
  return <kbd className="kbd">{children}</kbd>
}

export function Spinner({ size = 14 }: { size?: number }): React.ReactElement {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      aria-label="正在加载"
    />
  )
}
