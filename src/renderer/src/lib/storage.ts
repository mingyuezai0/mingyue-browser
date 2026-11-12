import type { SessionSnapshot } from './types'

export const STORAGE_KEYS = {
  settings: 'mingyue.settings.v1',
  bookmarks: 'mingyue.bookmarks.v1',
  bookmarkFolders: 'mingyue.bookmark-folders.v1',
  history: 'mingyue.history.v1',
  downloads: 'mingyue.downloads.v1',
  session: 'mingyue.session.v1',
  tabGroups: 'mingyue.tab-groups.v1',
  sidebar: 'mingyue.sidebar.v1'
} as const

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // The app remains usable even if storage is full or unavailable.
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

export function loadSession(): SessionSnapshot | null {
  const snapshot = readStorage<SessionSnapshot | null>(STORAGE_KEYS.session, null)
  if (!snapshot || !Array.isArray(snapshot.tabs) || snapshot.tabs.length === 0) {
    return null
  }
  return snapshot
}

export function saveSession(snapshot: SessionSnapshot): void {
  writeStorage(STORAGE_KEYS.session, snapshot)
}
