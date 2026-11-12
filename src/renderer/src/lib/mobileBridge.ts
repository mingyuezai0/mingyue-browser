import type { MingyueAPI } from '../../../shared/types'

/**
 * Capacitor's WebView has no Electron preload bridge. Keep the browser UI
 * usable there by providing safe no-op implementations for desktop-only APIs.
 */
export function installMobileBridge(): void {
  if (typeof window === 'undefined' || window.mingyue) return

  const unsubscribe = (): void => {}
  const emptyList = async (): Promise<never[]> => []

  const bridge = {
    app: {
      info: async () => ({
        name: '明月浏览器',
        version: '1.0.1',
        electron: 'Capacitor',
        chrome: 'Android WebView',
        platform: 'android'
      }),
      clearBrowsingData: async (): Promise<void> => {}
    },
    plugins: {
      list: emptyList,
      setEnabled: async (): Promise<never[]> => [],
      onChanged: () => unsubscribe,
      onBlockedCount: () => unsubscribe,
      installLocal: async () => null,
      removeLocal: async (): Promise<never[]> => []
    },
    passwords: {
      list: emptyList,
      save: async () => null,
      remove: async (): Promise<never[]> => [],
      importCsv: async (): Promise<never[]> => [],
      checkBreach: async () => ({ breached: false, count: 0 })
    },
    privacy: {
      apply: async (): Promise<void> => {},
      listPermissions: emptyList,
      setPermission: async (): Promise<never[]> => [],
      removePermission: async (): Promise<never[]> => []
    },
    downloads: {
      list: emptyList,
      setDirectory: async (): Promise<void> => {},
      chooseDirectory: async () => null,
      pause: async () => false,
      resume: async () => false,
      cancel: async () => false,
      open: async () => {},
      showInFolder: async () => {},
      clearCompleted: async (): Promise<void> => {},
      onUpdate: () => unsubscribe
    },
    window: {
      minimize: (): void => {},
      toggleMaximize: async () => false,
      isMaximized: async () => false,
      onMaximizeChange: () => unsubscribe,
      close: (): void => {},
      setCloseGuard: (): void => {}
    },
    system: {
      setLoginItem: async (): Promise<void> => {},
      getLoginItem: async () => false,
      openDefaultApps: async (): Promise<void> => {},
      checkForUpdates: async () => ({
        status: 'unsupported' as const,
        currentVersion: '1.0.1'
      })
    },
    files: {
      openText: async () => null,
      saveText: async () => null
    },
    screenshots: {
      capture: async () => null,
      savePdf: async () => null
    },
    search: {
      suggest: async (): Promise<string[]> => []
    },
    translation: {
      translate: async (texts: string[]): Promise<{ translations: string[]; provider: string }> => ({
        translations: texts,
        provider: 'local'
      })
    },
    navigation: {
      onNewTab: () => unsubscribe,
      onShortcut: () => unsubscribe
    }
  }

  window.mingyue = bridge as unknown as MingyueAPI
  document.documentElement.dataset.mobileShell = 'true'
}
