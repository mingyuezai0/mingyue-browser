export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night'

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export function getDayPhase(date: Date): DayPhase {
  const hour = date.getHours()
  if (hour >= 5 && hour < 9) return 'dawn'
  if (hour >= 9 && hour < 17) return 'day'
  if (hour >= 17 && hour < 21) return 'dusk'
  return 'night'
}

export function getGreeting(date: Date): string {
  const hour = date.getHours()
  if (hour >= 5 && hour < 9) return '早上好'
  if (hour >= 9 && hour < 12) return '上午好'
  if (hour >= 12 && hour < 14) return '中午好'
  if (hour >= 14 && hour < 18) return '下午好'
  if (hour >= 18 && hour < 23) return '晚上好'
  if (hour >= 23 || hour < 5) return '凌晨好'
  return '你好'
}

export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日 · ${WEEKDAYS[date.getDay()]}`
}

export function formatFullDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 2 * day) return '昨天'
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return `${new Date(timestamp).getMonth() + 1}月${new Date(timestamp).getDate()}日`
}

export function formatHistoryGroup(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const dayDiff = Math.round((startOfToday - startOfDate) / 86_400_000)
  if (dayDiff <= 0) return '今天'
  if (dayDiff === 1) return '昨天'
  if (dayDiff < 7) return WEEKDAYS[date.getDay()]
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatTimeOfDay(timestamp: number): string {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}

export function getSunProgress(date: Date): number {
  const minutes = date.getHours() * 60 + date.getMinutes()
  const sunrise = 6 * 60
  const sunset = 19 * 60
  return Math.min(1, Math.max(0, (minutes - sunrise) / (sunset - sunrise)))
}
