export function LogoMark({ size = 28 }: { size?: number }): React.ReactElement {
  return (
    <svg
      className="logo-mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="12.5" fill="var(--brand-bg)" />
      <circle
        cx="20"
        cy="20"
        r="12.8"
        stroke="var(--brand-ring)"
        strokeWidth=".8"
        strokeDasharray="1.5 4"
      />
      <path
        d="M26.7 10.6A10.4 10.4 0 1 0 26.7 29.4A12.1 12.1 0 0 1 26.7 10.6Z"
        fill="var(--brand-moon)"
      />
      <circle cx="30.1" cy="11.4" r="1.15" fill="var(--brand-star)" />
      <path
        d="M6 30.4C11.3 28 15.5 28.6 20 30.6C24.9 32.8 29.3 32.5 34 30.1"
        stroke="var(--brand-horizon)"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BrandLockup({
  compact = false
}: {
  compact?: boolean
}): React.ReactElement {
  return (
    <div className={`brand-lockup ${compact ? 'is-compact' : ''}`}>
      <LogoMark size={compact ? 22 : 27} />
      {!compact && (
        <div className="brand-copy">
          <span className="brand-name">明月</span>
          <span className="brand-english">MINGYUE</span>
        </div>
      )}
    </div>
  )
}

export function DecorativeSun({
  progress
}: {
  progress: number
}): React.ReactElement {
  const cx = 100 + progress * 220
  const cy = 102 - Math.sin(progress * Math.PI) * 58
  return (
    <svg
      className="hero-landscape"
      viewBox="0 0 420 220"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hill-a" x1="210" y1="110" x2="210" y2="220">
          <stop stopColor="var(--hero-hill-a)" />
          <stop offset="1" stopColor="var(--hero-hill-b)" />
        </linearGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx="82" ry="82" fill="url(#sun-glow)" />
      <circle cx={cx} cy={cy} r="32" fill="var(--sun)" />
      <circle
        cx={cx}
        cy={cy}
        r="45"
        stroke="var(--hero-ink)"
        strokeOpacity="0.16"
        strokeDasharray="1 8"
        strokeLinecap="round"
      />
      <path
        d="M-20 168C46 128 110 132 174 159C245 189 310 184 456 126V236H-20V168Z"
        fill="url(#hill-a)"
        opacity="0.72"
      />
      <path
        d="M-20 192C73 157 146 164 217 185C290 207 356 201 450 169V236H-20V192Z"
        fill="var(--hero-hill-c)"
      />
      <path
        d="M-20 207C68 184 144 190 233 205C318 220 383 215 450 198V236H-20V207Z"
        fill="var(--hero-ink)"
        opacity="0.16"
      />
      <path
        d="M8 63H84"
        stroke="var(--hero-ink)"
        strokeOpacity="0.18"
        strokeLinecap="round"
        strokeDasharray="2 7"
      />
    </svg>
  )
}

export function MoonScene(): React.ReactElement {
  return (
    <svg
      className="hero-moon-scene"
      viewBox="0 0 460 260"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="mingyue-moon-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--moon)" stopOpacity="0.2" />
          <stop offset="66%" stopColor="var(--moon)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--moon)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mingyue-moon-disc" x1="330" y1="65" x2="362" y2="172">
          <stop stopColor="var(--moon-bright)" />
          <stop offset="1" stopColor="var(--moon)" />
        </linearGradient>
      </defs>
      <circle cx="340" cy="112" r="126" fill="url(#mingyue-moon-halo)" />
      <circle
        cx="340"
        cy="112"
        r="94"
        stroke="var(--hero-ink)"
        strokeOpacity="0.1"
        strokeDasharray="1 9"
      />
      <circle
        cx="340"
        cy="112"
        r="78"
        stroke="var(--hero-ink)"
        strokeOpacity="0.08"
      />
      <circle cx="340" cy="112" r="57" fill="url(#mingyue-moon-disc)" />
      <circle cx="324" cy="96" r="10" fill="var(--moon-detail)" opacity="0.32" />
      <circle cx="357" cy="128" r="7" fill="var(--moon-detail)" opacity="0.24" />
      <circle cx="337" cy="146" r="4.5" fill="var(--moon-detail)" opacity="0.2" />
      <circle cx="382" cy="64" r="1.8" fill="var(--hero-ink)" opacity="0.28" />
      <circle cx="407" cy="92" r="1.2" fill="var(--hero-ink)" opacity="0.22" />
      <path
        d="M-30 210C46 185 108 190 176 207C244 224 314 221 492 191V270H-30V210Z"
        fill="var(--hero-hill-a)"
        opacity="0.52"
      />
      <path
        d="M-30 230C61 212 123 215 198 228C275 241 344 236 492 217V270H-30V230Z"
        fill="var(--hero-hill-c)"
        opacity="0.78"
      />
      <path
        d="M54 80H120"
        stroke="var(--hero-ink)"
        strokeOpacity="0.12"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      <path
        d="M56 91H91"
        stroke="var(--hero-ink)"
        strokeOpacity="0.08"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
    </svg>
  )
}
