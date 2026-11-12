import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react'
import { ArrowLeft, RefreshCw, TriangleAlert } from 'lucide-react'
import type { PageError, Tab } from '../lib/types'
import type { TranslationTarget } from '../../../shared/types'
import {
  buildApplyTranslationScript,
  buildExtractPageTextScript,
  RESTORE_PAGE_TEXT_SCRIPT,
  type TranslationApplication,
  type TranslationExtraction
} from '../lib/pageTranslation'
import {
  AUTOFILL_SCRIPT,
  ENTER_READER_MODE_SCRIPT,
  PICTURE_IN_PICTURE_SCRIPT
} from '../lib/readerMode'
import {
  SELECT_REGION_SCRIPT,
  type ScreenshotRegion
} from '../lib/screenshot'

const HAS_ELECTRON_BRIDGE =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')

interface WebviewFindResult {
  activeMatchOrdinal: number
  matches: number
  finalUpdate: boolean
}

interface MingyueWebview extends HTMLElement {
  src: string
  loadURL: (url: string) => Promise<void>
  getURL: () => string
  getTitle: () => string
  canGoBack: () => boolean
  canGoForward: () => boolean
  goBack: () => void
  goForward: () => void
  reload: () => void
  reloadIgnoringCache: () => void
  stop: () => void
  setZoomFactor: (factor: number) => void
  setAudioMuted: (muted: boolean) => void
  isCurrentlyAudible: () => boolean
  findInPage: (
    text: string,
    options?: { forward?: boolean; findNext?: boolean }
  ) => number
  stopFindInPage: (action: 'clearSelection' | 'keepSelection' | 'activateSelection') => void
  openDevTools: () => void
  closeDevTools: () => void
  isDevToolsOpened: () => boolean
  print: () => void
  focus: () => void
  executeJavaScript: <T = unknown>(code: string, userGesture?: boolean) => Promise<T>
  getWebContentsId: () => number
}

export interface PageTranslationResult {
  applied: number
  total: number
  truncated: boolean
  provider: string
  candidateCount: number
}

export interface BrowserStageHandle {
  navigate: (tabId: string, url: string) => boolean
  back: (tabId: string) => void
  forward: (tabId: string) => void
  reload: (tabId: string, hard?: boolean) => void
  stop: (tabId: string) => void
  find: (tabId: string, text: string, forward: boolean, findNext: boolean) => void
  stopFind: (tabId: string, keepSelection?: boolean) => void
  setZoom: (tabId: string, zoom: number) => void
  openDevTools: (tabId: string) => void
  print: (tabId: string) => void
  focus: (tabId: string) => void
  translate: (
    tabId: string,
    target: TranslationTarget
  ) => Promise<PageTranslationResult>
  restoreTranslation: (tabId: string) => Promise<boolean>
  toggleReader: (tabId: string) => Promise<boolean>
  capture: (
    tabId: string,
    mode: 'visible' | 'full' | 'region'
  ) => Promise<{ path: string; name: string } | null>
  savePdf: (tabId: string) => Promise<{ path: string; name: string } | null>
  pictureInPicture: (tabId: string) => Promise<boolean>
  autofill: (tabId: string, username: string, password: string) => Promise<number>
}

type TabPatch = Partial<Tab>

interface BrowserTabProps {
  tab: Tab
  active: boolean
  surfaceVisible: boolean
  registerWebview: (tabId: string, webview: MingyueWebview | null) => void
  onPatch: (tabId: string, patch: TabPatch) => void
  onPageSettled: (tabId: string, url: string, title: string) => void
  onFindResult: (result: WebviewFindResult) => void
  onRetry: (tabId: string) => void
  onHome: (tabId: string) => void
  autoplayPolicy: 'block' | 'allow'
  pdfViewerEnabled: boolean
}

interface CallbacksRef {
  onPatch: BrowserTabProps['onPatch']
  onPageSettled: BrowserTabProps['onPageSettled']
  onFindResult: BrowserTabProps['onFindResult']
}

function describeLoadError(code: number, fallback: string): string {
  const messages: Record<number, string> = {
    [-2]: '页面进程意外退出，请重新加载。',
    [-6]: '找不到这个本地文件。',
    [-7]: '页面响应超时，请检查网络后重试。',
    [-21]: '网络刚刚发生变化，请重新加载。',
    [-100]: '连接被意外关闭，请重新加载。',
    [-101]: '连接被网站或网络重置了，请检查网络后再试。',
    [-102]: '网站拒绝了连接，可能暂时不可用。',
    [-105]: '找不到这个网站，请检查网址是否拼写正确。',
    [-106]: '设备似乎没有连接到网络，请检查网络设置。',
    [-118]: '连接超时，请稍后再试。',
    [-137]: '无法解析这个网址，请检查后重试。',
    [-138]: '网络访问被阻止，请检查代理或防火墙设置。',
    [-300]: '这个地址无法打开，请检查网址格式。',
    [-324]: '网站没有返回内容，请稍后重试。',
    [-200]: '网站的安全证书无效，明月已阻止访问。',
    [-202]: '网站的安全证书不受信任，明月已阻止访问。'
  }
  return messages[code] ?? fallback ?? '页面暂时无法打开。'
}

function BrowserTab({
  tab,
  active,
  surfaceVisible,
  registerWebview,
  onPatch,
  onPageSettled,
  onFindResult,
  onRetry,
  onHome,
  autoplayPolicy,
  pdfViewerEnabled
}: BrowserTabProps): React.ReactElement {
  const hostRef = useRef<HTMLDivElement>(null)
  const webviewRef = useRef<MingyueWebview | null>(null)
  const callbacksRef = useRef<CallbacksRef>({
    onPatch,
    onPageSettled,
    onFindResult
  })
  const zoomRef = useRef(tab.zoom)
  const muteRef = useRef(tab.isMuted)

  callbacksRef.current = { onPatch, onPageSettled, onFindResult }
  zoomRef.current = tab.zoom
  muteRef.current = tab.isMuted

  useEffect(() => {
    if (!HAS_ELECTRON_BRIDGE) return
    const host = hostRef.current
    if (!host) return

    if (!tab.url) {
      if (webviewRef.current) {
        registerWebview(tab.id, null)
        webviewRef.current.remove()
        webviewRef.current = null
      }
      return
    }

    if (webviewRef.current) return

    const webview = document.createElement('webview') as unknown as MingyueWebview
    webview.className = 'browser-webview'
    webview.setAttribute('partition', tab.isPrivate ? 'mingyue-private' : 'persist:mingyue')
    webview.setAttribute(
      'webpreferences',
      `contextIsolation=yes, nodeIntegration=no, sandbox=yes, javascript=yes, plugins=${
        pdfViewerEnabled ? 'yes' : 'no'
      }, autoplayPolicy=${
        autoplayPolicy === 'allow'
          ? 'no-user-gesture-required'
          : 'user-gesture-required'
      }`
    )
    // Popups are denied in the main process and re-opened as native app tabs.
    webview.setAttribute('allowpopups', '')
    webview.setAttribute('data-tab-id', tab.id)

    const patch = (next: TabPatch): void => callbacksRef.current.onPatch(tab.id, next)

    const loadCurrent = (): void => {
      const url = webview.getURL()
      if (url) patch({ url })
    }

    const onStartLoading = (): void => {
      patch({
        isLoading: true,
        error: null,
        hoveredUrl: '',
        translationStatus: 'idle',
        readerMode: false
      })
    }

    const onStopLoading = (): void => {
      patch({
        isLoading: false,
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward()
      })
      const url = webview.getURL()
      const title = webview.getTitle()
      window.setTimeout(() => {
        callbacksRef.current.onPageSettled(tab.id, url, title)
      }, 250)
    }

    const onDidNavigate = (event: Event): void => {
      const detail = event as Event & { url?: string }
      patch({
        url: detail.url || webview.getURL(),
        canGoBack: webview.canGoBack(),
        canGoForward: webview.canGoForward(),
        error: null,
        hoveredUrl: '',
        translationStatus: 'idle',
        readerMode: false
      })
    }

    const onDidNavigateInPage = (event: Event): void => {
      const detail = event as Event & { url?: string; isMainFrame?: boolean }
      if (detail.isMainFrame === false) return
      patch({ url: detail.url || webview.getURL() })
    }

    const onTitle = (event: Event): void => {
      const detail = event as Event & { title?: string }
      patch({ title: detail.title || webview.getTitle() || '无标题页面' })
    }

    const onFavicon = (event: Event): void => {
      const detail = event as Event & { favicons?: string[] }
      const favicon = detail.favicons?.find((item) => /^(https?:|data:)/i.test(item))
      if (favicon) patch({ favicon })
    }

    const onDidFailLoad = (event: Event): void => {
      const detail = event as Event & {
        errorCode?: number
        errorDescription?: string
        validatedURL?: string
        isMainFrame?: boolean
      }
      if (detail.isMainFrame === false || detail.errorCode === -3) return
      const code = detail.errorCode ?? -1
      const error: PageError = {
        code,
        description: describeLoadError(code, detail.errorDescription || ''),
        url: detail.validatedURL || webview.getURL() || tab.url
      }
      patch({ isLoading: false, error })
    }

    const onDomReady = (): void => {
      try {
        webview.setZoomFactor(zoomRef.current || 1)
        webview.setAudioMuted(muteRef.current)
      } catch {
        // The guest can disappear during teardown.
      }
      loadCurrent()
    }

    const onFound = (event: Event): void => {
      const detail = event as Event & {
        result?: WebviewFindResult
      }
      if (detail.result) callbacksRef.current.onFindResult(detail.result)
    }

    const onUpdateTarget = (event: Event): void => {
      const detail = event as Event & { url?: string }
      patch({ hoveredUrl: detail.url || '' })
    }

    const onAudioState = (event: Event): void => {
      const detail = event as Event & { audible?: boolean }
      patch({ isAudible: Boolean(detail.audible) })
    }

    const onConsoleMessage = (event: Event): void => {
      const detail = event as Event & { message?: string }
      if (detail.message === '__mingyue_reader_closed__') {
        patch({ readerMode: false })
      }
    }

    const onRenderGone = (): void => {
      patch({
        isLoading: false,
        error: {
          code: -2,
          description: '页面进程意外退出，请重新加载。',
          url: webview.getURL() || tab.url
        }
      })
    }

    webview.addEventListener('did-start-loading', onStartLoading)
    webview.addEventListener('did-stop-loading', onStopLoading)
    webview.addEventListener('did-navigate', onDidNavigate)
    webview.addEventListener('did-navigate-in-page', onDidNavigateInPage)
    webview.addEventListener('page-title-updated', onTitle)
    webview.addEventListener('page-favicon-updated', onFavicon)
    webview.addEventListener('did-fail-load', onDidFailLoad)
    webview.addEventListener('dom-ready', onDomReady)
    webview.addEventListener('found-in-page', onFound)
    webview.addEventListener('update-target-url', onUpdateTarget)
    webview.addEventListener('audio-state-changed', onAudioState)
    webview.addEventListener('console-message', onConsoleMessage)
    webview.addEventListener('render-process-gone', onRenderGone)

    let lastAudible = false
    const syncAudioState = (): void => {
      try {
        const audible = webview.isCurrentlyAudible()
        if (audible !== lastAudible) {
          lastAudible = audible
          patch({ isAudible: audible })
        }
      } catch {
        // The guest can disappear during teardown.
      }
    }
    const audioTimer = window.setInterval(syncAudioState, 900)

    webviewRef.current = webview
    registerWebview(tab.id, webview)
    host.appendChild(webview)
    webview.src = tab.url
    patch({ isLoading: true, error: null })

    return () => {
      window.clearInterval(audioTimer)
      registerWebview(tab.id, null)
      webview.removeEventListener('did-start-loading', onStartLoading)
      webview.removeEventListener('did-stop-loading', onStopLoading)
      webview.removeEventListener('did-navigate', onDidNavigate)
      webview.removeEventListener('did-navigate-in-page', onDidNavigateInPage)
      webview.removeEventListener('page-title-updated', onTitle)
      webview.removeEventListener('page-favicon-updated', onFavicon)
      webview.removeEventListener('did-fail-load', onDidFailLoad)
      webview.removeEventListener('dom-ready', onDomReady)
      webview.removeEventListener('found-in-page', onFound)
      webview.removeEventListener('update-target-url', onUpdateTarget)
      webview.removeEventListener('audio-state-changed', onAudioState)
      webview.removeEventListener('console-message', onConsoleMessage)
      webview.removeEventListener('render-process-gone', onRenderGone)
      webview.remove()
      webviewRef.current = null
    }
    // The webview is created once per tab URL lifecycle. Navigation after that
    // is imperative so React updates never reload a page that is already open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id, tab.isPrivate, tab.url === '' ? '' : 'mounted'])

  useEffect(() => {
    if (!webviewRef.current) return
    try {
      webviewRef.current.setZoomFactor(tab.zoom || 1)
    } catch {
      // Ignore updates during guest teardown.
    }
  }, [tab.zoom])

  useEffect(() => {
    if (!webviewRef.current) return
    try {
      webviewRef.current.setAudioMuted(tab.isMuted)
    } catch {
      // Ignore updates during guest teardown.
    }
  }, [tab.isMuted])

  return (
    <div
      className={`webview-host ${active && surfaceVisible ? 'is-active' : ''} ${
        tab.error ? 'has-error' : ''
      }`}
      aria-hidden={!active}
    >
      <div ref={hostRef} className="webview-slot">
        {!HAS_ELECTRON_BRIDGE && tab.url && (
          <iframe
            className="mobile-webview"
            src={tab.url}
            title={tab.title}
            allow="autoplay; fullscreen"
          />
        )}
      </div>
      {tab.error && (
        <div className="page-error">
          <div className="page-error-illustration" aria-hidden="true">
            <span className="page-error-sun" />
            <span className="page-error-hill" />
            <TriangleAlert size={24} className="page-error-icon" />
          </div>
          <span className="page-error-kicker">页面加载失败</span>
          <h2>无法访问此页面</h2>
          <p>
            {tab.error.description}
            {tab.error.code !== -1 && (
              <span className="page-error-code">错误代码 {tab.error.code}</span>
            )}
          </p>
          <span className="page-error-url">{tab.error.url}</span>
          <div className="page-error-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => onRetry(tab.id)}
            >
              <RefreshCw size={16} />
              重新加载
            </button>
            <button type="button" className="secondary-button" onClick={() => onHome(tab.id)}>
              <ArrowLeft size={16} />
              返回起始页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const BrowserStage = forwardRef<
  BrowserStageHandle,
  {
    tabs: Tab[]
    activeId: string
    surfaceVisible: boolean
    onPatch: (tabId: string, patch: TabPatch) => void
    onPageSettled: (tabId: string, url: string, title: string) => void
    onFindResult: (result: WebviewFindResult) => void
    onRetry: (tabId: string) => void
    onErrorHome: (tabId: string) => void
    autoplayPolicy: 'block' | 'allow'
    pdfViewerEnabled: boolean
  }
>(function BrowserStage(
  {
    tabs,
    activeId,
    surfaceVisible,
    onPatch,
    onPageSettled,
    onFindResult,
    onRetry,
    onErrorHome,
    autoplayPolicy,
    pdfViewerEnabled
  },
  ref
): React.ReactElement {
  const webviews = useRef(new Map<string, MingyueWebview>())

  const registerWebview = (tabId: string, webview: MingyueWebview | null): void => {
    if (webview) webviews.current.set(tabId, webview)
    else webviews.current.delete(tabId)
  }

  const get = (tabId: string): MingyueWebview | null => {
    return webviews.current.get(tabId) ?? null
  }

  useImperativeHandle(
    ref,
    (): BrowserStageHandle => ({
      navigate(tabId, url) {
        const webview = get(tabId)
        if (!webview) return false
        void webview.loadURL(url).catch(() => {
          // did-fail-load renders the in-app error surface.
        })
        return true
      },
      back(tabId) {
        const webview = get(tabId)
        if (webview?.canGoBack()) webview.goBack()
      },
      forward(tabId) {
        const webview = get(tabId)
        if (webview?.canGoForward()) webview.goForward()
      },
      reload(tabId, hard = false) {
        const webview = get(tabId)
        if (!webview) return
        if (hard) webview.reloadIgnoringCache()
        else webview.reload()
      },
      stop(tabId) {
        get(tabId)?.stop()
      },
      find(tabId, text, forward, findNext) {
        const webview = get(tabId)
        if (!webview) return
        if (!text) {
          webview.stopFindInPage('clearSelection')
          return
        }
        // A first request must explicitly start a session (findNext: true),
        // while subsequent next/previous clicks continue that same session.
        webview.findInPage(text, { forward, findNext })
      },
      stopFind(tabId, keepSelection = false) {
        get(tabId)?.stopFindInPage(keepSelection ? 'keepSelection' : 'clearSelection')
      },
      setZoom(tabId, zoom) {
        get(tabId)?.setZoomFactor(zoom)
      },
      openDevTools(tabId) {
        const webview = get(tabId)
        if (!webview) return
        if (webview.isDevToolsOpened()) webview.closeDevTools()
        else webview.openDevTools()
      },
      print(tabId) {
        get(tabId)?.print()
      },
      focus(tabId) {
        get(tabId)?.focus()
      },
      async translate(tabId, target) {
        const webview = get(tabId)
        if (!webview) throw new Error('当前页面不可用')
        const sourceUrl = webview.getURL()
        const extracted =
          await webview.executeJavaScript<TranslationExtraction>(
            buildExtractPageTextScript(target),
            true
          )
        if (extracted.alreadyTranslated || extracted.texts.length === 0) {
          return {
            applied: 0,
            total: extracted.texts.length,
            truncated: extracted.truncated,
            provider: '',
            candidateCount: extracted.candidateCount
          }
        }
        const translated = await window.mingyue.translation.translate(
          extracted.texts,
          target
        )
        if (webview.getURL() !== sourceUrl) {
          throw new Error('页面已发生变化，请重新翻译')
        }
        const applied =
          await webview.executeJavaScript<TranslationApplication>(
            buildApplyTranslationScript(translated.translations),
            true
          )
        return {
          applied: applied.applied,
          total: applied.total,
          truncated: extracted.truncated,
          provider: translated.provider,
          candidateCount: extracted.candidateCount
        }
      },
      async restoreTranslation(tabId) {
        const webview = get(tabId)
        if (!webview) return false
        return webview.executeJavaScript<boolean>(RESTORE_PAGE_TEXT_SCRIPT, true)
      },
      async toggleReader(tabId) {
        const webview = get(tabId)
        if (!webview) return false
        return webview.executeJavaScript<boolean>(
          ENTER_READER_MODE_SCRIPT,
          true
        )
      },
      async capture(tabId, mode) {
        const webview = get(tabId)
        if (!webview || !window.mingyue) return null
        let rect: ScreenshotRegion | undefined
        if (mode === 'region') {
          const selected = await webview.executeJavaScript<
            ScreenshotRegion | null
          >(SELECT_REGION_SCRIPT, true)
          if (!selected) return null
          rect = selected
        }
        return window.mingyue.screenshots.capture(
          webview.getWebContentsId(),
          mode === 'full' ? 'full' : 'visible',
          rect
        )
      },
      async savePdf(tabId) {
        const webview = get(tabId)
        if (!webview || !window.mingyue) return null
        return window.mingyue.screenshots.savePdf(webview.getWebContentsId())
      },
      async pictureInPicture(tabId) {
        const webview = get(tabId)
        if (!webview) return false
        return webview.executeJavaScript<boolean>(
          PICTURE_IN_PICTURE_SCRIPT,
          true
        )
      },
      async autofill(tabId, username, password) {
        const webview = get(tabId)
        if (!webview) return 0
        return webview.executeJavaScript<number>(
          AUTOFILL_SCRIPT(username, password),
          true
        )
      }
    }),
    []
  )

  return (
    <div className={`browser-stage ${surfaceVisible ? 'is-visible' : 'is-obscured'}`}>
      {tabs.map((tab) => (
        <BrowserTab
          key={tab.id}
          tab={tab}
          active={tab.id === activeId}
          surfaceVisible={surfaceVisible}
          registerWebview={registerWebview}
          onPatch={onPatch}
          onPageSettled={onPageSettled}
          onFindResult={onFindResult}
          onRetry={onRetry}
          onHome={onErrorHome}
          autoplayPolicy={autoplayPolicy}
          pdfViewerEnabled={pdfViewerEnabled}
        />
      ))}
    </div>
  )
})

export type { MingyueWebview, WebviewFindResult }
