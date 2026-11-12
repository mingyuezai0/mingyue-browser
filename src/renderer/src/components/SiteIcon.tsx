import { useEffect, useState, type CSSProperties } from 'react'
import { getHostname } from '../lib/search'

const SITE_TINTS = [
  { background: '#f7d8c6', foreground: '#963a22' },
  { background: '#dfe8d5', foreground: '#345335' },
  { background: '#f4e4b8', foreground: '#4e5e2a' },
  { background: '#f1d0cc', foreground: '#a33c3c' },
  { background: '#e7ddc4', foreground: '#4b5b31' },
  { background: '#d9e4d8', foreground: '#30503f' }
]

function tintFor(seed: string): (typeof SITE_TINTS)[number] {
  let total = 0
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i)
  return SITE_TINTS[total % SITE_TINTS.length]
}

export function SiteIcon({
  favicon,
  title,
  url,
  size = 24,
  className = ''
}: {
  favicon?: string
  title: string
  url: string
  size?: number
  className?: string
}): React.ReactElement {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [favicon, url])

  const host = getHostname(url)
  const seed = host || title || '网'
  const tint = tintFor(seed)
  const letter = (title.trim() || host || '网').slice(0, 1).toUpperCase()
  const isGitHub = /(^|\.)github\.com$/i.test(host)
  const resolvedFavicon =
    favicon ||
    (() => {
      try {
        return url ? `${new URL(url).origin}/favicon.ico` : ''
      } catch {
        return ''
      }
    })()
  const hasImage = Boolean(resolvedFavicon && !failed)

  const style = {
    '--site-bg': tint.background,
    '--site-fg': tint.foreground,
    width: size,
    height: size,
    borderRadius: hasImage ? 0 : Math.max(7, Math.round(size * 0.32))
  } as CSSProperties

  return (
    <span
      className={`site-icon ${hasImage ? 'has-image' : ''} ${
        isGitHub ? 'site-icon--github' : ''
      } ${className}`}
      style={style}
      aria-hidden="true"
    >
      {hasImage ? (
        <img
          src={resolvedFavicon}
          alt=""
          width={size}
          height={size}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="site-icon-letter">{letter}</span>
      )}
    </span>
  )
}
