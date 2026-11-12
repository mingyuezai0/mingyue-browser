import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  ArrowDownToLine,
  Bookmark,
  BookOpen,
  Camera,
  EyeOff,
  FileSearch,
  History,
  Home,
  KeyRound,
  Layers,
  PanelLeftClose,
  Plus,
  Puzzle,
  Search,
  Settings2,
  Sparkles,
  X
} from 'lucide-react'
import type {
  AppInfo,
  BrowserShortcut,
  PasswordBreachResult,
  PasswordRecord,
  PluginInfo
} from '../../shared/types'
import type {
  Bookmark as BookmarkRecord,
  BookmarkFolder,
  DownloadRecord,
  FindState,
  HistoryEntry,
  InternalView,
  Settings,
  Tab,
  TabGroup
} from './lib/types'
import {
  ACCENTS,
  DEFAULT_BOOKMARKS,
  DEFAULT_SETTINGS,
  FONT_SCALES,
  createTab
} from './lib/defaults'
import {
  STORAGE_KEYS,
  loadSession,
  removeStorage,
  saveSession
} from './lib/storage'
import { getHostname, normalizeAddress } from './lib/search'
import { resolveUiLocale, useUiLocalization } from './lib/uiI18n'
import { usePersistentState } from './lib/usePersistentState'
import { TitleBar } from './components/TitleBar'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import {
  BrowserStage,
  type BrowserStageHandle,
  type WebviewFindResult
} from './components/BrowserStage'
import { StartPage } from './components/StartPage'
import {
  DownloadsPage,
  HistoryPage,
  PluginsPage
} from './components/LibraryPages'
import { BookmarksPage } from './components/BookmarksPage'
import { SettingsPage } from './components/SettingsPage'
import { BookmarksBar } from './components/BookmarksBar'
import { FindBar } from './components/FindBar'
import { MoreMenu } from './components/MoreMenu'
import {
  CommandPalette,
  type PaletteCommand
} from './components/CommandPalette'
import { MobileDock } from './components/MobileDock'
import { TabSwitcher } from './components/TabSwitcher'
import { TabGroupsPanel } from './components/TabGroupsPanel'

const INTERNAL_ADDRESS_MAP: Record<string, InternalView> = {
  'mingyue://bookmarks': 'bookmarks',
  'mingyue://history': 'history',
  'mingyue://downloads': 'downloads',
  'mingyue://plugins': 'plugins',
  'mingyue://settings': 'settings'
}

const VIEW_TITLES: Record<InternalView, string> = {
  web: '明月浏览器',
  bookmarks: '书签 · 明月',
  history: '历史记录 · 明月',
  downloads: '下载内容 · 明月',
  plugins: '插件 · 明月',
  settings: '设置 · 明月'
}

function makeRestoredTabs(
  restoreSession: boolean,
  defaultZoom: number
): { tabs: Tab[]; activeId: string } {
  const snapshot = restoreSession ? loadSession() : null
  if (snapshot) {
    const restored = snapshot.tabs
      .filter((tab) => tab && typeof tab.url === 'string')
      .map((tab) =>
        createTab({
          id: tab.id,
          title: tab.title || (tab.url ? getHostname(tab.url) : '新标签页'),
          url: /^https?:\/\//i.test(tab.url) ? tab.url : '',
          favicon: tab.favicon || '',
          isPrivate: false,
          isPinned: Boolean(tab.isPinned),
          groupId: tab.groupId ?? null,
          zoom: typeof tab.zoom === 'number' ? tab.zoom : defaultZoom
        })
      )
    if (restored.length > 0) {
      const activeId = restored.some((tab) => tab.id === snapshot.activeId)
        ? snapshot.activeId
        : restored[0].id
      return { tabs: restored, activeId }
    }
  }
  const initialTab = createTab({ zoom: defaultZoom })
  return { tabs: [initialTab], activeId: initialTab.id }
}

function downloadToRecord(
  update: DownloadRecord,
  previous?: DownloadRecord
): DownloadRecord {
  return {
    ...update,
    startedAt: previous?.startedAt ?? update.startedAt
  }
}

function App(): React.ReactElement {
  const [storedSettings, setSettings] = usePersistentState<Settings>(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS
  )
  const settings = useMemo<Settings>(
    () => ({ ...DEFAULT_SETTINGS, ...storedSettings }),
    [storedSettings]
  )
  const [bookmarks, setBookmarks] = usePersistentState<BookmarkRecord[]>(
    STORAGE_KEYS.bookmarks,
    DEFAULT_BOOKMARKS
  )
  const [bookmarkFolders, setBookmarkFolders] = usePersistentState<
    BookmarkFolder[]
  >(STORAGE_KEYS.bookmarkFolders, [])
  const [tabGroups, setTabGroups] = usePersistentState<TabGroup[]>(
    STORAGE_KEYS.tabGroups,
    []
  )
  const [history, setHistory] = usePersistentState<HistoryEntry[]>(
    STORAGE_KEYS.history,
    []
  )
  const [savedDownloads, setSavedDownloads] = usePersistentState<DownloadRecord[]>(
    STORAGE_KEYS.downloads,
    [],
    500
  )
  const [privateDownloads, setPrivateDownloads] = useState<DownloadRecord[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState(
    STORAGE_KEYS.sidebar,
    false
  )

  const [initialSession] = useState(() =>
    makeRestoredTabs(settings.restoreSession, settings.defaultZoom)
  )
  const [tabs, setTabs] = useState<Tab[]>(initialSession.tabs)
  const [activeId, setActiveId] = useState(initialSession.activeId)
  const [view, setView] = useState<InternalView>('web')
  const [moreOpen, setMoreOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [tabSheetOpen, setTabSheetOpen] = useState(false)
  const [tabGroupsOpen, setTabGroupsOpen] = useState(false)
  const [blockedCount, setBlockedCount] = useState(0)
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [passwordEntries, setPasswordEntries] = useState<PasswordRecord[]>([])
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const [findState, setFindState] = useState<FindState>({
    open: false,
    query: '',
    activeMatch: 0,
    totalMatches: 0
  })

  const addressRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<BrowserStageHandle>(null)
  const tabsRef = useRef(tabs)
  const closedTabsRef = useRef<Tab[]>([])
  const toastTimer = useRef<number | null>(null)
  const notifiedDownloads = useRef(new Set<string>())
  const hadPrivateTabsRef = useRef(false)
  const privateDownloadsRef = useRef<DownloadRecord[]>([])
  tabsRef.current = tabs
  privateDownloadsRef.current = privateDownloads

  const downloads = useMemo(
    () =>
      [...privateDownloads, ...savedDownloads].sort(
        (a, b) => b.startedAt - a.startedAt
      ),
    [privateDownloads, savedDownloads]
  )

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0] ?? null
  const accent = ACCENTS[settings.accent] ?? ACCENTS.moss
  const layout = settings.layout === 'topbar' ? 'topbar' : 'sidebar'
  const design = settings.design === 'classic' ? 'classic' : 'mingyue'
  const systemUiLanguage = useMemo(
    () => resolveUiLocale(navigator.language),
    []
  )
  const uiLanguage =
    settings.language === 'system' ? systemUiLanguage : settings.language
  useUiLocalization(uiLanguage)
  const effectiveMode =
    settings.themeMode === 'system'
      ? systemDark
        ? 'dark'
        : 'light'
      : settings.themeMode === 'dark'
        ? 'dark'
        : 'light'
  const adblockPlugin = plugins.find((plugin) => plugin.id === 'adblock') ?? null
  const adblockEnabled = adblockPlugin?.enabled ?? true
  const activeApiDownloads = downloads.filter(
    (download) => download.state === 'progressing'
  ).length
  const isBookmarked = Boolean(
    activeTab?.url && bookmarks.some((bookmark) => bookmark.url === activeTab.url)
  )
  const visibleTabs = useMemo(
    () =>
      [...tabs].sort(
        (a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned))
      ),
    [tabs]
  )

  const showToast = useCallback((message: string): void => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message })
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent): void => {
      setSystemDark(event.matches)
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.mode = effectiveMode
    root.dataset.design = design
    root.style.colorScheme = effectiveMode
    root.style.setProperty(
      '--font-scale',
      String(FONT_SCALES[settings.fontSize] ?? FONT_SCALES.large)
    )
    root.style.setProperty(
      '--accent',
      effectiveMode === 'dark'
        ? `color-mix(in srgb, ${accent.accent} 45%, #f2f4e9)`
        : accent.accent
    )
    root.style.setProperty(
      '--accent-deep',
      effectiveMode === 'dark'
        ? `color-mix(in srgb, ${accent.accent} 55%, #f2f4e9)`
        : accent.accentDeep
    )
    root.style.setProperty(
      '--accent-soft',
      effectiveMode === 'dark'
        ? `color-mix(in srgb, ${accent.accent} 20%, var(--paper-hi))`
        : accent.soft
    )
    root.style.setProperty('--accent-fill', accent.accent)
    root.style.setProperty('--accent-fill-hover', accent.accentDeep)
    root.style.setProperty('--on-accent', accent.onAccent)
    root.dataset.reduceMotion = settings.reduceMotion ? 'reduce' : 'normal'
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal'
    void window.mingyue?.appearance.setTheme(settings.themeMode)
  }, [
    accent,
    design,
    effectiveMode,
    settings.fontSize,
    settings.highContrast,
    settings.reduceMotion,
    settings.themeMode
  ])

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!window.mingyue) return
    void window.mingyue.app.info().then(setAppInfo)
    const applyPlugins = (next: PluginInfo[]): void => {
      setPlugins(next)
      const adblock = next.find((plugin) => plugin.id === 'adblock')
      if (adblock) setBlockedCount(adblock.blockedCount)
    }
    void window.mingyue.plugins.list().then(applyPlugins)
    void window.mingyue.passwords.list().then(setPasswordEntries)
    const unsubscribeChanged = window.mingyue.plugins.onChanged(applyPlugins)
    const unsubscribeBlocked =
      window.mingyue.plugins.onBlockedCount(setBlockedCount)
    return () => {
      unsubscribeChanged()
      unsubscribeBlocked()
    }
  }, [])

  useEffect(() => {
    if (!window.mingyue) return
    void window.mingyue.privacy.apply({
      doNotTrack: settings.doNotTrack,
      trackingProtection: settings.trackingProtection,
      cookieBannerHandling: settings.cookieBannerHandling,
      clearOnShutdown: settings.clearOnShutdown,
      httpsOnly: settings.httpsOnly,
      dohEnabled: settings.dohEnabled,
      proxyMode: settings.proxyMode,
      proxyRules: settings.proxyRules,
      autoplayPolicy: settings.autoplayPolicy,
      downloadAskLocation: settings.downloadAskLocation,
      downloadDirectory: settings.downloadDirectory,
      downloadOpenWhenDone: settings.downloadOpenWhenDone,
      downloadOpenExtensions: settings.downloadOpenExtensions
    })
    void window.mingyue.system.setLoginItem(settings.startupOnBoot)
  }, [
    settings.autoplayPolicy,
    settings.clearOnShutdown,
    settings.cookieBannerHandling,
    settings.dohEnabled,
    settings.doNotTrack,
    settings.downloadAskLocation,
    settings.downloadDirectory,
    settings.downloadOpenExtensions,
    settings.downloadOpenWhenDone,
    settings.httpsOnly,
    settings.proxyMode,
    settings.proxyRules,
    settings.startupOnBoot,
    settings.trackingProtection
  ])

  useEffect(() => {
    if (!settings.restoreSession) {
      removeStorage(STORAGE_KEYS.session)
      return
    }
    const timer = window.setTimeout(() => {
      const normalTabs = tabs.filter((tab) => !tab.isPrivate)
      if (normalTabs.length === 0) {
        removeStorage(STORAGE_KEYS.session)
        return
      }
      const persistActive = normalTabs.some((tab) => tab.id === activeId)
        ? activeId
        : normalTabs[0].id
      saveSession({
        tabs: normalTabs.map((tab) => ({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          favicon: tab.favicon,
          isPrivate: false,
          zoom: tab.zoom,
          isPinned: tab.isPinned,
          groupId: tab.groupId
        })),
        activeId: persistActive
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [activeId, settings.restoreSession, tabs])

  useEffect(() => {
    // Download tasks do not survive an app restart; mark leftovers honestly.
    setSavedDownloads((current) => {
      let changed = false
      const next = current.map((download) => {
        if (download.state !== 'progressing' && download.state !== 'paused') {
          return download
        }
        changed = true
        return { ...download, state: 'interrupted' as const }
      })
      return changed ? next : current
    })
  }, [setSavedDownloads])

  useEffect(() => {
    const hasPrivateTabs = tabs.some((tab) => tab.isPrivate)
    if (
      settings.clearPrivateDownloads &&
      hadPrivateTabsRef.current &&
      !hasPrivateTabs
    ) {
      // Private downloads belong to the private session; drop their metadata
      // and stop still-running private transfers when that session ends.
      for (const download of privateDownloadsRef.current) {
        if (download.state === 'progressing') {
          void window.mingyue?.downloads.cancel(download.id)
        }
      }
      setPrivateDownloads([])
    }
    hadPrivateTabsRef.current = hasPrivateTabs
  }, [settings.clearPrivateDownloads, tabs])

  useEffect(() => {
    if (!window.mingyue) return
    void window.mingyue.downloads.setDirectory(settings.downloadDirectory)
    void window.mingyue.window.setCloseGuard(
      tabs.length > 1 && settings.warnOnCloseMultipleTabs
    )
  }, [settings.downloadDirectory, settings.warnOnCloseMultipleTabs, tabs.length])

  useEffect(() => {
    if (!window.mingyue) return
    return window.mingyue.downloads.onUpdate((update) => {
      if (update.isPrivate && !tabsRef.current.some((tab) => tab.isPrivate)) {
        return
      }
      const updateDownloads = update.isPrivate
        ? setPrivateDownloads
        : setSavedDownloads
      updateDownloads((current) => {
        const index = current.findIndex((item) => item.id === update.id)
        if (index === -1) return [update, ...current].slice(0, 100)
        const next = [...current]
        next[index] = downloadToRecord(update, current[index])
        return next
      })
      if (
        update.state === 'completed' &&
        !notifiedDownloads.current.has(update.id)
      ) {
        notifiedDownloads.current.add(update.id)
        showToast(`${update.isPrivate ? '无痕下载完成' : '下载完成'}：${update.fileName}`)
      }
    })
  }, [setSavedDownloads, showToast])

  const patchTab = useCallback((tabId: string, patch: Partial<Tab>): void => {
    setTabs((current) =>
      current.map((tab) => (tab.id === tabId ? { ...tab, ...patch } : tab))
    )
  }, [])

  const recordVisit = useCallback(
    (tabId: string, url: string, title: string): void => {
      if (!/^https?:\/\//i.test(url)) return
      const tab = tabsRef.current.find((item) => item.id === tabId)
      if (!tab || tab.isPrivate) return
      const nextTitle = title || tab.title || getHostname(url)
      const favicon = tab.favicon || ''
      setHistory((current) => {
        const now = Date.now()
        const last = current[0]
        if (last && last.url === url && now - last.visitedAt < 120_000) {
          if (last.title === nextTitle) return current
          return [{ ...last, title: nextTitle }, ...current.slice(1)]
        }
        return [
          {
            id: crypto.randomUUID(),
            title: nextTitle,
            url,
            favicon,
            visitedAt: now
          },
          ...current.filter((entry) => !(entry.url === url && now - entry.visitedAt < 30_000))
        ].slice(0, 600)
      })
    },
    [setHistory]
  )

  const closeFind = useCallback((): void => {
    if (activeId) stageRef.current?.stopFind(activeId)
    setFindState((current) =>
      current.open
        ? { open: false, query: current.query, activeMatch: 0, totalMatches: 0 }
        : current
    )
  }, [activeId])

  const closeTransientSurfaces = useCallback((): void => {
    setMoreOpen(false)
    setTabSheetOpen(false)
    setPaletteOpen(false)
    setTabGroupsOpen(false)
  }, [])

  const patchCurrent = useCallback(
    (patch: Partial<Tab>): void => {
      if (!activeTab) return
      patchTab(activeTab.id, patch)
    },
    [activeTab, patchTab]
  )

  const addTab = useCallback(
    (options: {
      url?: string
      isPrivate?: boolean
      title?: string
      internalView?: InternalView
    } = {}): Tab => {
      const internalView = options.internalView ?? 'web'
      const url = internalView === 'web' ? options.url ?? '' : ''
      const tab = createTab({
        url,
        isPrivate: Boolean(options.isPrivate),
        internalView,
        title:
          options.title ||
          (internalView === 'settings'
            ? '设置 · 明月'
            : url
              ? getHostname(url)
              : options.isPrivate
                ? '无痕标签页'
                : '新标签页'),
        zoom: settings.defaultZoom
      })
      setTabs((current) => [...current, tab])
      setActiveId(tab.id)
      setView(internalView)
      closeFind()
      closeTransientSurfaces()
      return tab
    },
    [closeFind, closeTransientSurfaces, settings.defaultZoom]
  )

  const openSettingsTab = useCallback((): void => {
    addTab({ internalView: 'settings', title: '设置 · 明月' })
  }, [addTab])

  const openView = useCallback(
    (nextView: InternalView): void => {
      if (nextView === 'settings') {
        openSettingsTab()
        return
      }
      closeFind()
      closeTransientSurfaces()
      setView(nextView)
    },
    [closeFind, closeTransientSurfaces, openSettingsTab]
  )

  const openNewTab = useCallback((): void => {
    addTab()
    requestAnimationFrame(() => addressRef.current?.focus())
  }, [addTab])

  const openNewPrivateTab = useCallback((): void => {
    addTab({ isPrivate: true })
    showToast('已打开无痕标签页')
  }, [addTab, showToast])

  const selectTab = useCallback(
    (id: string): void => {
      closeFind()
      closeTransientSurfaces()
      setActiveId(id)
      const target = tabsRef.current.find((tab) => tab.id === id)
      setView(target?.internalView ?? 'web')
    },
    [closeFind, closeTransientSurfaces]
  )

  const closeTab = useCallback(
    (id: string): void => {
      const current = tabsRef.current
      const index = current.findIndex((tab) => tab.id === id)
      if (index === -1) return
      const closing = current[index]
      closedTabsRef.current = [
        { ...closing, isLoading: false, error: null },
        ...closedTabsRef.current
      ].slice(0, 20)

      if (current.length === 1) {
        const replacement = createTab({ zoom: settings.defaultZoom })
        setTabs([replacement])
        setActiveId(replacement.id)
        setView('web')
      } else {
        const nextTabs = current.filter((tab) => tab.id !== id)
        setTabs(nextTabs)
        if (activeId === id) {
          const nextActive = nextTabs[Math.min(index, nextTabs.length - 1)]
          setActiveId(nextActive.id)
          setView(nextActive.internalView ?? 'web')
        }
      }
      closeFind()
      closeTransientSurfaces()
    },
    [
      activeId,
      closeFind,
      closeTransientSurfaces,
      settings.defaultZoom
    ]
  )

  const closeOtherTabs = useCallback(
    (id: string): void => {
      const current = tabsRef.current
      const target = current.find((tab) => tab.id === id)
      if (!target) return
      closedTabsRef.current = [
        ...current
          .filter((tab) => tab.id !== id)
          .map((tab) => ({ ...tab, isLoading: false, error: null })),
        ...closedTabsRef.current
      ].slice(0, 20)
      setTabs([target])
      setActiveId(target.id)
      setView(target.internalView ?? 'web')
    },
    []
  )

  const duplicateTab = useCallback(
    (id: string): void => {
      const current = tabsRef.current
      const source = current.find((tab) => tab.id === id)
      if (!source) return
      const copy = createTab({
        title: source.title,
        url: source.url,
        favicon: source.favicon,
        isPrivate: source.isPrivate,
        zoom: source.zoom,
        internalView: source.internalView
      })
      const index = current.findIndex((tab) => tab.id === id)
      const next = [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]
      setTabs(next)
      setActiveId(copy.id)
      setView(copy.internalView ?? 'web')
      showToast('标签页已复制')
    },
    [showToast]
  )

  const reopenClosedTab = useCallback((): void => {
    const restored = closedTabsRef.current.shift()
    if (!restored) {
      showToast('没有可以恢复的标签页')
      return
    }
    const tab = createTab({
      title: restored.title,
      url: restored.url,
      favicon: restored.favicon,
      isPrivate: restored.isPrivate,
      zoom: restored.zoom,
      internalView: restored.internalView
    })
    setTabs((current) => [...current, tab])
    setActiveId(tab.id)
    setView(tab.internalView ?? 'web')
    showToast('已恢复上次关闭的标签页')
  }, [showToast])

  const toggleMute = useCallback(
    (id: string): void => {
      const tab = tabsRef.current.find((item) => item.id === id)
      if (!tab) return
      patchTab(id, { isMuted: !tab.isMuted })
    },
    [patchTab]
  )

  const togglePinTab = useCallback(
    (id: string): void => {
      const tab = tabsRef.current.find((item) => item.id === id)
      if (!tab) return
      patchTab(id, { isPinned: !tab.isPinned })
      showToast(tab.isPinned ? '已取消固定标签页' : '已固定标签页')
    },
    [patchTab, showToast]
  )

  const closeDuplicateTabs = useCallback((): void => {
    const seen = new Set<string>()
    const duplicateIds: string[] = []
    for (const tab of tabsRef.current) {
      if (!tab.url) continue
      const key = `${tab.isPrivate ? 'private' : 'normal'}:${tab.url}`
      if (seen.has(key)) duplicateIds.push(tab.id)
      else seen.add(key)
    }
    if (duplicateIds.length === 0) {
      showToast('没有重复的标签页')
      return
    }
    setTabs((current) => {
      const next = current.filter((tab) => !duplicateIds.includes(tab.id))
      if (!next.some((tab) => tab.id === activeId)) {
        setActiveId(next[0]?.id ?? '')
      }
      return next
    })
    showToast(`已关闭 ${duplicateIds.length} 个重复标签页`)
  }, [activeId, showToast])

  const createTabGroup = useCallback(
    (name: string, color: string): void => {
      const group: TabGroup = {
        id: crypto.randomUUID(),
        name,
        color,
        createdAt: Date.now()
      }
      setTabGroups((current) => [...current, group])
      if (activeTab) patchTab(activeTab.id, { groupId: group.id })
      showToast(`已创建标签组「${name}」`)
    },
    [activeTab, patchTab, setTabGroups, showToast]
  )

  const deleteTabGroup = useCallback(
    (id: string): void => {
      setTabGroups((current) => current.filter((group) => group.id !== id))
      setTabs((current) =>
        current.map((tab) =>
          tab.groupId === id ? { ...tab, groupId: null } : tab
        )
      )
      showToast('标签组已删除，标签页仍保留')
    },
    [setTabGroups, showToast]
  )

  const assignTabGroup = useCallback(
    (tabId: string, groupId: string | null): void => {
      patchTab(tabId, { groupId })
    },
    [patchTab]
  )

  const renameTabGroup = useCallback(
    (id: string, name: string): void => {
      setTabGroups((current) =>
        current.map((group) => (group.id === id ? { ...group, name } : group))
      )
    },
    [setTabGroups]
  )

  const reorderTabs = useCallback((sourceId: string, targetId: string): void => {
    setTabs((current) => {
      const sourceIndex = current.findIndex((tab) => tab.id === sourceId)
      const targetIndex = current.findIndex((tab) => tab.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return current
      const next = [...current]
      const [source] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, source)
      return next
    })
  }, [])

  const navigateToUrl = useCallback(
    (url: string): void => {
      if (!activeTab) return
      setView('web')
      closeFind()
      const handled = stageRef.current?.navigate(activeTab.id, url) ?? false
      patchTab(activeTab.id, {
        url,
        isLoading: true,
        error: null,
        hoveredUrl: '',
        internalView: 'web'
      })
      if (!handled) {
        // Setting the tab URL mounts its webview at the requested address.
      }
    },
    [activeTab, closeFind, patchTab]
  )

  const goHome = useCallback((): void => {
    closeFind()
    closeTransientSurfaces()
    setView('web')
    if (!activeTab) return
    if (settings.homepage) {
      navigateToUrl(settings.homepage)
      return
    }
    patchTab(activeTab.id, {
      url: '',
      title: '新标签页',
      favicon: '',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      error: null,
      hoveredUrl: '',
      internalView: 'web'
    })
  }, [
    activeTab,
    closeFind,
    closeTransientSurfaces,
    navigateToUrl,
    patchTab,
    settings.homepage
  ])

  const handleNavigate = useCallback(
    (raw: string): void => {
      const value = raw.trim()
      if (!value) return
      const internalKey = value.toLowerCase().replace(/\/$/, '')
      if (internalKey === 'mingyue://newtab') {
        goHome()
        return
      }
      if (INTERNAL_ADDRESS_MAP[internalKey]) {
        openView(INTERNAL_ADDRESS_MAP[internalKey])
        return
      }
      const url = normalizeAddress(
        value,
        settings.searchEngine,
        settings.customSearchEngines
      )
      if (!url) return
      navigateToUrl(url)
    },
    [
      goHome,
      navigateToUrl,
      openView,
      settings.customSearchEngines,
      settings.searchEngine
    ]
  )

  const goBack = useCallback((): void => {
    if (view !== 'web') {
      setView('web')
      return
    }
    if (activeTab) stageRef.current?.back(activeTab.id)
  }, [activeTab, view])

  const goForward = useCallback((): void => {
    if (view !== 'web' || !activeTab) return
    stageRef.current?.forward(activeTab.id)
  }, [activeTab, view])

  const reloadPage = useCallback(
    (hard = false): void => {
      if (view !== 'web' || !activeTab?.url) return
      stageRef.current?.reload(activeTab.id, hard)
    },
    [activeTab, view]
  )

  const stopLoading = useCallback((): void => {
    if (activeTab) stageRef.current?.stop(activeTab.id)
  }, [activeTab])

  const toggleBookmark = useCallback((): void => {
    if (!activeTab?.url) {
      showToast('先打开一个网页，再收藏它')
      return
    }
    const existing = bookmarks.find((bookmark) => bookmark.url === activeTab.url)
    if (existing) {
      setBookmarks((current) => current.filter((bookmark) => bookmark.id !== existing.id))
      showToast('已从书签中移除')
      return
    }
    const bookmark: BookmarkRecord = {
      id: crypto.randomUUID(),
      title: activeTab.title || getHostname(activeTab.url),
      url: activeTab.url,
      favicon: activeTab.favicon,
      createdAt: Date.now()
    }
    setBookmarks((current) => [bookmark, ...current])
    showToast(`已收藏「${bookmark.title}」`)
  }, [activeTab, bookmarks, setBookmarks, showToast])

  const installLocalPlugin = useCallback(async (): Promise<void> => {
    if (!window.mingyue) return
    try {
      const next = await window.mingyue.plugins.installLocal()
      setPlugins(next)
      showToast('本地扩展已安装')
    } catch {
      showToast('扩展安装失败，请检查 plugin.json')
    }
  }, [showToast])

  const removeLocalPlugin = useCallback(
    async (id: string): Promise<void> => {
      if (!window.mingyue) return
      setPlugins(await window.mingyue.plugins.removeLocal(id))
      showToast('本地扩展已移除')
    },
    [showToast]
  )

  const setPluginEnabled = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      if (!window.mingyue) return
      const plugin = plugins.find((item) => item.id === id)
      try {
        const next = await window.mingyue.plugins.setEnabled(id, enabled)
        setPlugins(next)
        const adblock = next.find((item) => item.id === 'adblock')
        if (adblock) setBlockedCount(adblock.blockedCount)
        showToast(
          `${plugin?.name ?? '插件'}已${enabled ? '开启' : '关闭'}`
        )
      } catch {
        showToast('插件设置未能保存，请重试')
      }
    },
    [plugins, showToast]
  )

  const translateCurrentPage = useCallback(async (): Promise<void> => {
    if (!window.mingyue || !stageRef.current) return
    if (view !== 'web' || !activeTab?.url) {
      showToast('请先打开一个网页')
      return
    }
    if (activeTab.translationStatus === 'translating') return

    if (activeTab.translationStatus === 'translated') {
      try {
        await stageRef.current.restoreTranslation(activeTab.id)
        patchTab(activeTab.id, { translationStatus: 'idle' })
        showToast('已显示网页原文')
      } catch {
        showToast('恢复原文失败，请刷新页面后重试')
      }
      return
    }

    patchTab(activeTab.id, { translationStatus: 'translating' })
    try {
      const result = await stageRef.current.translate(
        activeTab.id,
        settings.translationTarget
      )
      if (result.candidateCount === 0) {
        patchTab(activeTab.id, { translationStatus: 'idle' })
        showToast('页面中没有可翻译的外文内容')
        return
      }
      if (result.applied === 0) {
        patchTab(activeTab.id, { translationStatus: 'idle' })
        showToast('没有可应用的翻译结果，请刷新页面后重试')
        return
      }
      patchTab(activeTab.id, { translationStatus: 'translated' })
      showToast(
        result.truncated
          ? `已机翻 ${result.applied} 处文本；页面较长，仅翻译了前部内容`
          : `已机翻 ${result.applied} 处文本`
      )
    } catch (error) {
      patchTab(activeTab.id, { translationStatus: 'idle' })
      showToast(
        error instanceof Error ? error.message : '网页翻译失败，请稍后重试'
      )
    }
  }, [activeTab, patchTab, settings.translationTarget, showToast, view])

  const openFind = useCallback((): void => {
    if (view !== 'web' || !activeTab?.url) {
      showToast('当前页面没有可查找的内容')
      return
    }
    setMoreOpen(false)
    setFindState((current) => ({ ...current, open: true }))
    requestAnimationFrame(() => {
      if (findState.query) {
        stageRef.current?.find(activeTab.id, findState.query, true, true)
      }
    })
  }, [activeTab, findState.query, showToast, view])

  const updateFindQuery = useCallback(
    (query: string): void => {
      setFindState((current) => ({
        ...current,
        query,
        activeMatch: 0,
        totalMatches: 0
      }))
      if (activeTab && query) {
        stageRef.current?.find(activeTab.id, query, true, true)
      } else if (activeTab) {
        stageRef.current?.stopFind(activeTab.id)
      }
    },
    [activeTab]
  )

  const findNext = useCallback(
    (forward: boolean): void => {
      if (!activeTab || !findState.query) return
      stageRef.current?.find(activeTab.id, findState.query, forward, false)
    },
    [activeTab, findState.query]
  )

  const handleFindResult = useCallback((result: WebviewFindResult): void => {
    setFindState((current) => ({
      ...current,
      activeMatch: result.activeMatchOrdinal,
      totalMatches: result.matches
    }))
  }, [])

  const setZoom = useCallback(
    (nextZoom: number): void => {
      if (!activeTab) return
      const clamped = Math.min(2.5, Math.max(0.5, Math.round(nextZoom * 10) / 10))
      patchTab(activeTab.id, { zoom: clamped })
      stageRef.current?.setZoom(activeTab.id, clamped)
    },
    [activeTab, patchTab]
  )

  const zoomIn = useCallback((): void => {
    if (activeTab) setZoom(activeTab.zoom + 0.1)
  }, [activeTab, setZoom])

  const zoomOut = useCallback((): void => {
    if (activeTab) setZoom(activeTab.zoom - 0.1)
  }, [activeTab, setZoom])

  const resetZoom = useCallback((): void => {
    setZoom(1)
  }, [setZoom])

  const openDevTools = useCallback((): void => {
    if (activeTab?.url) stageRef.current?.openDevTools(activeTab.id)
  }, [activeTab])

  const printPage = useCallback((): void => {
    if (activeTab?.url) stageRef.current?.print(activeTab.id)
  }, [activeTab])

  const toggleReaderMode = useCallback(async (): Promise<void> => {
    if (!stageRef.current || !activeTab?.url) return
    const wasActive = Boolean(activeTab.readerMode)
    const entered = await stageRef.current.toggleReader(activeTab.id)
    patchTab(activeTab.id, { readerMode: entered })
    showToast(
      wasActive || !entered
        ? '已退出阅读模式'
        : '已进入阅读模式 · 按 Esc 或再次点击可退出'
    )
  }, [activeTab, patchTab, showToast])

  const capturePage = useCallback(
    async (mode: 'full' | 'region' | 'visible'): Promise<void> => {
      if (!stageRef.current || !activeTab?.url) return
      try {
        const result = await stageRef.current.capture(activeTab.id, mode)
        if (result) showToast(`截图已保存：${result.name}`)
        else showToast('没有生成截图')
      } catch {
        showToast('截图失败，请稍后重试')
      }
    },
    [activeTab, showToast]
  )

  const savePassword = useCallback(async (entry: PasswordRecord): Promise<void> => {
    if (!window.mingyue) return
    const next = await window.mingyue.passwords.save(entry)
    setPasswordEntries(next)
    showToast('密码已保存到本机密码库')
  }, [showToast])

  const deletePassword = useCallback(async (id: string): Promise<void> => {
    if (!window.mingyue) return
    setPasswordEntries(await window.mingyue.passwords.remove(id))
    showToast('密码已删除')
  }, [showToast])

  const importPasswords = useCallback(async (): Promise<void> => {
    if (!window.mingyue) return
    const file = await window.mingyue.files.openText()
    if (!file) return
    try {
      const next = await window.mingyue.passwords.importCsv(file.content)
      setPasswordEntries(next)
      showToast('密码已导入')
    } catch {
      showToast('密码 CSV 文件无法识别')
    }
  }, [showToast])

  const autofillPassword = useCallback(async (entry: PasswordRecord): Promise<boolean> => {
    if (!stageRef.current || !activeTab?.url) return false
    if (!settings.passwordManagerEnabled || !settings.autofillEnabled) {
      showToast('密码库或自动填充已在设置中关闭')
      return false
    }
    const filled = await stageRef.current.autofill(
      activeTab.id,
      entry.username,
      entry.password
    )
    showToast(filled ? '已填充到当前页面' : '当前页面没有识别到登录表单')
    return filled > 0
  }, [
    activeTab,
    settings.autofillEnabled,
    settings.passwordManagerEnabled,
    showToast
  ])

  const checkPasswordBreach = useCallback(
    async (password: string): Promise<PasswordBreachResult> => {
      if (!window.mingyue) {
        return { checked: false, count: 0, message: '密码服务不可用' }
      }
      return window.mingyue.passwords.checkBreach(password)
    },
    []
  )

  const savePagePdf = useCallback(async (): Promise<void> => {
    if (!stageRef.current || !activeTab?.url) return
    try {
      const result = await stageRef.current.savePdf(activeTab.id)
      if (result) showToast(`PDF 已保存：${result.name}`)
    } catch {
      showToast('PDF 导出失败，请稍后重试')
    }
  }, [activeTab, showToast])

  const openPictureInPicture = useCallback(async (): Promise<void> => {
    if (!stageRef.current || !activeTab?.url) return
    const opened = await stageRef.current.pictureInPicture(activeTab.id)
    showToast(opened ? '已切换到画中画' : '当前页面没有可播放的视频')
  }, [activeTab, showToast])

  const toggleFullscreen = useCallback((): void => {
    void window.mingyue?.window.toggleFullscreen()
  }, [])

  const runShortcut = useCallback(
    (action: BrowserShortcut): void => {
      switch (action) {
        case 'new-tab':
          openNewTab()
          break
        case 'new-private-tab':
          openNewPrivateTab()
          break
        case 'close-tab':
          if (activeTab) closeTab(activeTab.id)
          break
        case 'reopen-tab':
          reopenClosedTab()
          break
        case 'focus-address':
          addressRef.current?.focus()
          addressRef.current?.select()
          break
        case 'reload':
          reloadPage(false)
          break
        case 'hard-reload':
          reloadPage(true)
          break
        case 'bookmark-page':
          toggleBookmark()
          break
        case 'find':
          openFind()
          break
        case 'history':
          openView('history')
          break
        case 'downloads':
          openView('downloads')
          break
        case 'bookmarks':
          openView('bookmarks')
          break
        case 'settings':
          openView('settings')
          break
        case 'command-palette':
        case 'tab-search':
          setMoreOpen(false)
          setTabSheetOpen(false)
          setTabGroupsOpen(false)
          setPaletteOpen(true)
          break
        case 'back':
          goBack()
          break
        case 'forward':
          goForward()
          break
        case 'next-tab': {
          if (tabs.length < 2) break
          const index = tabs.findIndex((tab) => tab.id === activeId)
          const next = tabs[(index + 1) % tabs.length]
          selectTab(next.id)
          break
        }
        case 'previous-tab': {
          if (tabs.length < 2) break
          const index = tabs.findIndex((tab) => tab.id === activeId)
          const next = tabs[(index - 1 + tabs.length) % tabs.length]
          selectTab(next.id)
          break
        }
        case 'devtools':
          openDevTools()
          break
        case 'zoom-in':
          zoomIn()
          break
        case 'zoom-out':
          zoomOut()
          break
        case 'zoom-reset':
          resetZoom()
          break
        case 'toggle-fullscreen':
          toggleFullscreen()
          break
        case 'print':
          printPage()
          break
        default:
          break
      }
    },
    [
      activeId,
      activeTab,
      closeTab,
      goBack,
      goForward,
      openDevTools,
      openFind,
      openNewPrivateTab,
      openNewTab,
      openView,
      printPage,
      reloadPage,
      reopenClosedTab,
      resetZoom,
      selectTab,
      tabs,
      toggleBookmark,
      toggleFullscreen,
      zoomIn,
      zoomOut
    ]
  )

  useEffect(() => {
    if (!window.mingyue) return
    return window.mingyue.navigation.onShortcut(runShortcut)
  }, [runShortcut])

  useEffect(() => {
    if (!window.mingyue) return
    return window.mingyue.navigation.onNewTab((url, isPrivate) => {
      addTab({ url, isPrivate, title: getHostname(url) })
    })
  }, [addTab])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const modifier = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()

      if (event.key === 'Escape') {
        if (paletteOpen) {
          setPaletteOpen(false)
          return
        }
        if (moreOpen) {
          setMoreOpen(false)
          return
        }
        if (tabSheetOpen) {
          setTabSheetOpen(false)
          return
        }
        if (tabGroupsOpen) {
          setTabGroupsOpen(false)
          return
        }
        if (findState.open) {
          closeFind()
          return
        }
      }

      if (modifier && event.shiftKey && key === 'n') {
        event.preventDefault()
        runShortcut('new-private-tab')
        return
      }
      if (modifier && event.shiftKey && key === 't') {
        event.preventDefault()
        runShortcut('reopen-tab')
        return
      }
      if (modifier && event.shiftKey && key === 'r') {
        event.preventDefault()
        runShortcut('hard-reload')
        return
      }
      if (modifier && event.shiftKey && key === 'j') {
        event.preventDefault()
        runShortcut('downloads')
        return
      }
      if (modifier && event.shiftKey && key === 'b') {
        event.preventDefault()
        runShortcut('bookmarks')
        return
      }
      if (modifier && event.shiftKey && key === 'i') {
        event.preventDefault()
        runShortcut('devtools')
        return
      }
      if (modifier && event.shiftKey && key === 'a') {
        event.preventDefault()
        runShortcut('tab-search')
        return
      }
      if (modifier && event.key === 'Tab') {
        event.preventDefault()
        runShortcut(event.shiftKey ? 'previous-tab' : 'next-tab')
        return
      }
      if (!modifier) {
        if (event.altKey && event.key === 'ArrowLeft') {
          event.preventDefault()
          runShortcut('back')
        } else if (event.altKey && event.key === 'ArrowRight') {
          event.preventDefault()
          runShortcut('forward')
        } else if (event.key === 'F11') {
          event.preventDefault()
          runShortcut('toggle-fullscreen')
        } else if (event.key === 'F12') {
          event.preventDefault()
          runShortcut('devtools')
        }
        return
      }
      const shortcutMap: Partial<Record<string, BrowserShortcut>> = {
        t: 'new-tab',
        w: 'close-tab',
        l: 'focus-address',
        r: 'reload',
        f: 'find',
        d: 'bookmark-page',
        h: 'history',
        j: 'downloads',
        k: 'command-palette',
        p: 'print',
        ',': 'settings',
        '=': 'zoom-in',
        '+': 'zoom-in',
        '-': 'zoom-out',
        '0': 'zoom-reset'
      }
      const action = shortcutMap[key]
      if (action) {
        event.preventDefault()
        runShortcut(action)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    closeFind,
    findState.open,
    moreOpen,
    paletteOpen,
    runShortcut,
    tabGroupsOpen,
    tabSheetOpen
  ])

  useEffect(() => {
    if (!paletteOpen) return
    setMoreOpen(false)
    setTabSheetOpen(false)
  }, [paletteOpen])

  const pageTitle =
    view === 'web'
      ? activeTab?.isLoading
        ? '正在加载…'
        : activeTab?.title || '新标签页'
      : VIEW_TITLES[view]

  const commands = useMemo<PaletteCommand[]>(
    () => [
      {
        id: 'new-tab',
        label: '新建标签页',
        icon: <Plus size={17} />,
        shortcut: 'Ctrl T',
        group: '操作',
        run: openNewTab
      },
      {
        id: 'new-private',
        label: '新建无痕标签页',
        icon: <EyeOff size={17} />,
        shortcut: 'Ctrl Shift N',
        group: '操作',
        run: openNewPrivateTab
      },
      {
        id: 'find',
        label: '在页面中查找',
        icon: <FileSearch size={17} />,
        shortcut: 'Ctrl F',
        group: '操作',
        run: openFind
      },
      {
        id: 'bookmark',
        label: isBookmarked ? '取消收藏当前页' : '收藏当前页',
        icon: <Bookmark size={17} />,
        shortcut: 'Ctrl D',
        group: '操作',
        run: toggleBookmark
      },
      {
        id: 'home',
        label: '回到起始页',
        icon: <Home size={17} />,
        group: '操作',
        run: goHome
      },
      {
        id: 'sidebar',
        label: '折叠 / 展开侧边栏',
        icon: <PanelLeftClose size={17} />,
        keywords: '侧栏 标签栏',
        group: '操作',
        run: () => setSidebarCollapsed((value) => !value)
      },
      {
        id: 'close-tab',
        label: '关闭当前标签页',
        icon: <X size={17} />,
        shortcut: 'Ctrl W',
        group: '操作',
        run: () => activeTab && closeTab(activeTab.id)
      },
      {
        id: 'tab-groups',
        label: '管理标签组',
        icon: <Layers size={17} />,
        keywords: '标签组 分组 工作区 tabs group',
        group: '操作',
        run: () => {
          closeTransientSurfaces()
          setTabGroupsOpen(true)
        }
      },
      {
        id: 'reader-mode',
        label: '阅读模式',
        icon: <BookOpen size={17} />,
        keywords: '阅读 正文 干净模式 reader',
        group: '操作',
        run: () => {
          if (activeTab?.url) void toggleReaderMode()
        }
      },
      {
        id: 'screenshot',
        label: '截取整页',
        icon: <Camera size={17} />,
        keywords: '截图 截屏 screenshot',
        group: '操作',
        run: () => void capturePage('full')
      },
      {
        id: 'bookmarks',
        label: '打开书签',
        icon: <Bookmark size={17} />,
        shortcut: 'Ctrl Shift B',
        group: '前往',
        run: () => openView('bookmarks')
      },
      {
        id: 'history',
        label: '打开历史记录',
        icon: <History size={17} />,
        shortcut: 'Ctrl H',
        group: '前往',
        run: () => openView('history')
      },
      {
        id: 'downloads',
        label: '打开下载',
        icon: <ArrowDownToLine size={17} />,
        shortcut: 'Ctrl J',
        group: '前往',
        run: () => openView('downloads')
      },
      {
        id: 'plugins',
        label: '打开插件',
        icon: <Puzzle size={17} />,
        keywords: '插件 扩展 广告拦截 extension plugin',
        group: '前往',
        run: () => openView('plugins')
      },
      {
        id: 'settings',
        label: '打开设置',
        icon: <Settings2 size={17} />,
        shortcut: 'Ctrl ,',
        group: '前往',
        run: () => openView('settings')
      }
    ],
    [
      activeTab,
      closeTab,
      goHome,
      isBookmarked,
      openFind,
      openNewPrivateTab,
      openNewTab,
      openView,
      setSidebarCollapsed,
      toggleBookmark
    ]
  )

  const handleOpenFile = (path: string): void => {
    void window.mingyue?.downloads.open(path)
  }

  const handleShowInFolder = (path: string): void => {
    void window.mingyue?.downloads.showInFolder(path)
  }

  const handleCancelDownload = (id: string): void => {
    void window.mingyue?.downloads.cancel(id)
  }

  const handlePauseDownload = (id: string): void => {
    void window.mingyue?.downloads.pause(id)
  }

  const handleResumeDownload = (id: string): void => {
    void window.mingyue?.downloads.resume(id)
  }

  const handleClearCompletedDownloads = (): void => {
    setSavedDownloads((current) =>
      current.filter((download) => download.state === 'progressing')
    )
    setPrivateDownloads((current) =>
      current.filter((download) => download.state === 'progressing')
    )
    showToast('已清除结束的下载')
  }

  const handleClearData = async (scope: 'cache' | 'cookies' | 'all'): Promise<void> => {
    if (!window.mingyue) return
    await window.mingyue.app.clearBrowsingData(scope)
  }

  const exportBookmarks = async (): Promise<void> => {
    if (!window.mingyue) return
    const escapeHtml = (value: string): string =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
    const renderItems = (items: BookmarkRecord[]): string =>
      items
        .map(
          (bookmark) =>
            `<DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${Math.floor(
              bookmark.createdAt / 1000
            )}">${escapeHtml(bookmark.title)}</A>`
        )
        .join('\n')
    const rootItems = bookmarks.filter((bookmark) => !bookmark.folderId)
    const folderSections = bookmarkFolders
      .map((folder) => {
        const items = bookmarks.filter(
          (bookmark) => bookmark.folderId === folder.id
        )
        return `<DT><H3>${escapeHtml(folder.name)}</H3>\n<DL><p>\n${renderItems(
          items
        )}\n</DL><p>`
      })
      .join('\n')
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>明月浏览器书签</TITLE>\n<H1>明月浏览器书签</H1>\n<DL><p>\n${renderItems(
      rootItems
    )}\n${folderSections}\n</DL><p>\n`
    const result = await window.mingyue.files.saveText(
      'mingyue-bookmarks.html',
      html,
      [{ name: '书签 HTML', extensions: ['html'] }]
    )
    if (result) showToast(`书签已导出：${result.name}`)
  }

  const exportBackup = async (): Promise<void> => {
    if (!window.mingyue) return
    const data = {
      format: 'mingyue-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      bookmarks,
      bookmarkFolders,
      history,
      tabGroups
    }
    const result = await window.mingyue.files.saveText(
      'mingyue-backup.json',
      JSON.stringify(data, null, 2),
      [{ name: '明月备份', extensions: ['json'] }]
    )
    if (result) showToast(`备份已导出：${result.name}`)
  }

  const importBackup = async (): Promise<void> => {
    if (!window.mingyue) return
    const file = await window.mingyue.files.openText()
    if (!file) return
    try {
      const data = JSON.parse(file.content) as {
        format?: string
        settings?: Partial<Settings>
        bookmarks?: BookmarkRecord[]
        bookmarkFolders?: BookmarkFolder[]
        history?: HistoryEntry[]
        tabGroups?: TabGroup[]
      }
      if (data.format !== 'mingyue-backup') throw new Error('invalid')
      if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
      if (Array.isArray(data.bookmarks)) setBookmarks(data.bookmarks)
      if (Array.isArray(data.bookmarkFolders)) setBookmarkFolders(data.bookmarkFolders)
      if (Array.isArray(data.history)) setHistory(data.history)
      if (Array.isArray(data.tabGroups)) setTabGroups(data.tabGroups)
      showToast('备份已恢复')
    } catch {
      showToast('无法识别这个明月备份文件')
    }
  }

  const importBookmarks = async (): Promise<void> => {
    if (!window.mingyue) return
    const file = await window.mingyue.files.openText()
    if (!file) return
    const imported: BookmarkRecord[] = []
    try {
      if (/\.json$/i.test(file.name)) {
        const parsed = JSON.parse(file.content) as BookmarkRecord[]
        if (!Array.isArray(parsed)) throw new Error('invalid')
        for (const item of parsed) {
          if (typeof item?.url !== 'string') continue
          imported.push({
            id: crypto.randomUUID(),
            title: String(item.title || getHostname(item.url)),
            url: item.url,
            favicon: String(item.favicon || ''),
            folderId: null,
            createdAt: Date.now()
          })
        }
      } else {
        const document = new DOMParser().parseFromString(
          file.content,
          'text/html'
        )
        for (const anchor of Array.from(
          document.querySelectorAll<HTMLAnchorElement>('a[href]')
        )) {
          if (!/^https?:\/\//i.test(anchor.href)) continue
          imported.push({
            id: crypto.randomUUID(),
            title: anchor.textContent?.trim() || getHostname(anchor.href),
            url: anchor.href,
            favicon: '',
            folderId: null,
            createdAt: Date.now()
          })
        }
      }
    } catch {
      showToast('无法识别这个书签文件')
      return
    }
    const seen = new Set(bookmarks.map((bookmark) => bookmark.url))
    const fresh = imported.filter((bookmark) => {
      if (seen.has(bookmark.url)) return false
      seen.add(bookmark.url)
      return true
    })
    if (fresh.length === 0) {
      showToast('没有发现新的书签')
      return
    }
    setBookmarks((current) => [...fresh, ...current])
    showToast(`已导入 ${fresh.length} 个书签`)
  }

  const activePage =
    view === 'web' && !activeTab?.url ? (
      <StartPage
        bookmarks={bookmarks}
        settings={settings}
        showQuickLinks={settings.showQuickLinks}
        onNavigate={handleNavigate}
        onOpenBookmark={(bookmark) => handleNavigate(bookmark.url)}
      />
    ) : view === 'bookmarks' ? (
      <BookmarksPage
        bookmarks={bookmarks}
        folders={bookmarkFolders}
        activeUrl={activeTab?.url ?? ''}
        onOpen={handleNavigate}
        onDelete={(id) =>
          setBookmarks((current) => current.filter((bookmark) => bookmark.id !== id))
        }
        onAddCurrent={toggleBookmark}
        onAddFolder={(name) =>
          setBookmarkFolders((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              name,
              parentId: null,
              createdAt: Date.now()
            }
          ])
        }
        onRenameFolder={(id, name) =>
          setBookmarkFolders((current) =>
            current.map((folder) =>
              folder.id === id ? { ...folder, name } : folder
            )
          )
        }
        onDeleteFolder={(id) => {
          setBookmarkFolders((current) =>
            current.filter((folder) => folder.id !== id)
          )
          setBookmarks((current) =>
            current.map((bookmark) =>
              bookmark.folderId === id
                ? { ...bookmark, folderId: null }
                : bookmark
            )
          )
        }}
        onMoveBookmarks={(ids, folderId) =>
          setBookmarks((current) =>
            current.map((bookmark) =>
              ids.includes(bookmark.id) ? { ...bookmark, folderId } : bookmark
            )
          )
        }
        onImport={() => void importBookmarks()}
        onExport={() => void exportBookmarks()}
      />
    ) : view === 'history' ? (
      <HistoryPage
        history={history}
        onOpen={handleNavigate}
        onDelete={(id) =>
          setHistory((current) => current.filter((entry) => entry.id !== id))
        }
        onClear={() => {
          setHistory([])
          showToast('历史记录已清空')
        }}
      />
    ) : view === 'downloads' ? (
      <DownloadsPage
        downloads={downloads}
        onOpenFile={handleOpenFile}
        onShowInFolder={handleShowInFolder}
        onCancel={handleCancelDownload}
        onPause={handlePauseDownload}
        onResume={handleResumeDownload}
        onClearCompleted={handleClearCompletedDownloads}
      />
    ) : view === 'plugins' ? (
      <PluginsPage
        plugins={plugins}
        blockedCount={blockedCount}
        onToggle={setPluginEnabled}
        onInstallLocal={installLocalPlugin}
        onRemoveLocal={removeLocalPlugin}
        onOpenSettings={() => openView('settings')}
      />
    ) : view === 'settings' ? (
      <SettingsPage
        settings={settings}
        appInfo={appInfo}
        onChange={(patch) =>
          setSettings((current) => ({ ...current, ...patch }))
        }
        onClearData={handleClearData}
        onReset={() => setSettings({ ...DEFAULT_SETTINGS })}
        onOpenDownloads={() => openView('downloads')}
        onOpenPlugins={() => openView('plugins')}
        onNotify={showToast}
        passwords={passwordEntries}
        activeUrl={activeTab?.url ?? ''}
        onSavePassword={savePassword}
        onDeletePassword={deletePassword}
        onImportPasswords={importPasswords}
        onAutofillPassword={autofillPassword}
        onCheckPasswordBreach={checkPasswordBreach}
        onExportBackup={() => void exportBackup()}
        onImportBackup={() => void importBackup()}
      />
    ) : null

  return (
    <div
      className={`app-shell layout-${layout} design-${design} mode-${effectiveMode} ${
        settings.compactTabs ? 'is-compact' : ''
      }`}
    >
      {layout === 'sidebar' ? (
        <TitleBar
          pageTitle={pageTitle}
          isPrivate={Boolean(activeTab?.isPrivate) && view === 'web'}
          showBrand={settings.showBrand}
        />
      ) : (
        <TopBar
          tabs={visibleTabs}
          activeId={activeTab?.id ?? ''}
          pageTitle={pageTitle}
          isPrivate={Boolean(activeTab?.isPrivate) && view === 'web'}
          showBrand={settings.showBrand}
          onNewTab={openNewTab}
          onNewPrivateTab={openNewPrivateTab}
          onSelectTab={selectTab}
          onCloseTab={closeTab}
          onDuplicateTab={duplicateTab}
          onCloseOthers={closeOtherTabs}
          onToggleMute={toggleMute}
          onReorder={reorderTabs}
          groups={tabGroups}
          onTogglePin={togglePinTab}
          onOpenTabGroups={() => {
            closeTransientSurfaces()
            setTabGroupsOpen(true)
          }}
        />
      )}

      <div className="app-workspace">
        {layout === 'sidebar' && (
          <Sidebar
            tabs={visibleTabs}
            activeId={activeTab?.id ?? ''}
            view={view}
            collapsed={sidebarCollapsed}
            blockedCount={blockedCount}
            privacyEnabled={adblockEnabled}
            activeDownloads={activeApiDownloads}
            onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
            onNewTab={openNewTab}
            onNewPrivateTab={openNewPrivateTab}
            onSelectTab={selectTab}
            onCloseTab={closeTab}
            onDuplicateTab={duplicateTab}
            onCloseOthers={closeOtherTabs}
            onToggleMute={toggleMute}
            onReorder={reorderTabs}
            onOpenView={openView}
            onOpenCommandPalette={() => {
              closeTransientSurfaces()
              setPaletteOpen(true)
            }}
            groups={tabGroups}
            onTogglePin={togglePinTab}
            onOpenTabGroups={() => {
              closeTransientSurfaces()
              setTabGroupsOpen(true)
            }}
          />
        )}

        <main className="main-shell">
          <Toolbar
            activeTab={activeTab}
            view={view}
            bookmarks={bookmarks}
            history={history}
            engine={settings.searchEngine}
            isBookmarked={isBookmarked}
            findOpen={findState.open}
            activeDownloads={activeApiDownloads}
            addressRef={addressRef}
            onBack={goBack}
            onForward={goForward}
            onReload={() => reloadPage(false)}
            onHome={goHome}
            onStop={stopLoading}
            onNavigate={handleNavigate}
            onToggleBookmark={toggleBookmark}
            onOpenFind={openFind}
            onToggleMore={() => setMoreOpen((current) => !current)}
            onOpenDownloads={() => openView('downloads')}
            translationStatus={activeTab?.translationStatus ?? 'idle'}
            translationTarget={settings.translationTarget}
            trackingProtection={settings.trackingProtection}
            onToggleTrackingProtection={() =>
              setSettings((current) => ({
                ...current,
                trackingProtection:
                  current.trackingProtection === 'strict' ? 'standard' : 'strict'
              }))
            }
            onClearSiteData={() => {
              void handleClearData('all').then(() =>
                showToast('已清除 Cookie 和网站数据')
              )
            }}
            canTranslate={
              view === 'web' &&
              Boolean(activeTab?.url) &&
              !activeTab?.isLoading
            }
            onTranslate={() => void translateCurrentPage()}
            suggestionsEnabled={settings.addressBarSuggestions}
            searchSuggestions={settings.searchSuggestions}
            customEngines={settings.customSearchEngines}
            readerMode={Boolean(activeTab?.readerMode)}
            onToggleReader={() => void toggleReaderMode()}
          />

          {settings.showBookmarksBar && (
            <BookmarksBar
              bookmarks={bookmarks}
              folders={bookmarkFolders}
              activeUrl={view === 'web' ? activeTab?.url ?? '' : ''}
              onOpen={handleNavigate}
              onManage={() => openView('bookmarks')}
            />
          )}

          <section className="browser-area">
            <BrowserStage
              ref={stageRef}
              tabs={tabs}
              activeId={activeTab?.id ?? ''}
              surfaceVisible={view === 'web' && Boolean(activeTab?.url)}
              onPatch={patchTab}
              onPageSettled={recordVisit}
              onFindResult={handleFindResult}
              onRetry={(tabId) => {
                const tab = tabsRef.current.find((item) => item.id === tabId)
                if (!tab?.url) return
                stageRef.current?.navigate(tabId, tab.url)
              }}
              onErrorHome={(tabId) => {
                const tab = tabsRef.current.find((item) => item.id === tabId)
                if (!tab) return
                patchTab(tab.id, {
                  url: '',
                  title: '新标签页',
                  error: null,
                  isLoading: false
                })
                setView('web')
              }}
              autoplayPolicy={settings.autoplayPolicy}
              pdfViewerEnabled={settings.pdfViewerEnabled}
            />
            {activePage}
            {view === 'web' && activeTab?.hoveredUrl && (
              <div className="link-status">{activeTab.hoveredUrl}</div>
            )}
            <FindBar
              open={findState.open}
              query={findState.query}
              activeMatch={findState.activeMatch}
              totalMatches={findState.totalMatches}
              onQueryChange={updateFindQuery}
              onNext={() => findNext(true)}
              onPrevious={() => findNext(false)}
              onClose={closeFind}
            />
          </section>
        </main>
      </div>

      <MobileDock
        canGoBack={view !== 'web' || Boolean(activeTab?.canGoBack)}
        canGoForward={view === 'web' && Boolean(activeTab?.canGoForward)}
        tabCount={tabs.length}
        onBack={goBack}
        onForward={goForward}
        onNewTab={openNewTab}
        onOpenTabs={() => setTabSheetOpen(true)}
        onOpenMore={() => setMoreOpen(true)}
      />

      <MoreMenu
        open={moreOpen}
        pageAvailable={view === 'web' && Boolean(activeTab?.url)}
        isBookmarked={isBookmarked}
        zoom={activeTab?.zoom ?? 1}
        onClose={() => setMoreOpen(false)}
        onNewPrivateTab={openNewPrivateTab}
        onToggleBookmark={toggleBookmark}
        onFind={openFind}
        onPrint={printPage}
        onDevTools={openDevTools}
        onOpenView={openView}
        onHome={goHome}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={resetZoom}
        readerMode={Boolean(activeTab?.readerMode)}
        onToggleReader={() => void toggleReaderMode()}
        onScreenshot={(mode) => void capturePage(mode)}
        onSavePdf={() => void savePagePdf()}
        onPictureInPicture={() => void openPictureInPicture()}
        onOpenTabGroups={() => {
          closeTransientSurfaces()
          setTabGroupsOpen(true)
        }}
        onCloseDuplicateTabs={closeDuplicateTabs}
        onSearchTabs={() => {
          closeTransientSurfaces()
          setPaletteOpen(true)
        }}
      />

      <CommandPalette
        open={paletteOpen}
        tabs={tabs}
        activeId={activeTab?.id ?? ''}
        commands={commands}
        onClose={() => setPaletteOpen(false)}
        onSelectTab={selectTab}
      />

      <TabSwitcher
        open={tabSheetOpen}
        tabs={visibleTabs}
        activeId={activeTab?.id ?? ''}
        onClose={() => setTabSheetOpen(false)}
        onSelect={selectTab}
        onCloseTab={closeTab}
        onNewTab={() => {
          setTabSheetOpen(false)
          openNewTab()
        }}
        onNewPrivateTab={() => {
          setTabSheetOpen(false)
          openNewPrivateTab()
        }}
      />

      <TabGroupsPanel
        open={tabGroupsOpen}
        groups={tabGroups}
        tabs={tabs}
        activeId={activeTab?.id ?? ''}
        onClose={() => setTabGroupsOpen(false)}
        onCreate={createTabGroup}
        onDelete={deleteTabGroup}
        onRename={renameTabGroup}
        onAssign={assignTabGroup}
        onRemoveTab={(tabId) => assignTabGroup(tabId, null)}
        onSelectTab={(id) => {
          selectTab(id)
          setTabGroupsOpen(false)
        }}
      />

      {toast && (
        <div className="toast" role="status" aria-live="polite" key={toast.id}>
          <span className="toast-mark">
            <Sparkles size={15} />
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default App
