import { app, type Session, type WebContents } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { PluginInfo, PluginStatus } from '../../shared/types'
import type {
  MingyuePlugin,
  PluginContentScript,
  PluginRequestDecision,
  PluginRequestHook
} from './api'

interface PluginPreferences {
  enabled: Record<string, boolean>
}

interface PluginEntry {
  plugin: MingyuePlugin
  enabled: boolean
  status: PluginStatus
  blockedCount: number
  detail?: string
  activation: number
}

interface ActiveSubscription {
  cleanup: () => void
}

function matchUrl(pattern: string, url: string): boolean {
  if (pattern === '<all_urls>' || pattern === '*') return true
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
  try {
    return new RegExp(`^${escaped}$`, 'i').test(url)
  } catch {
    return false
  }
}

export class PluginManager {
  private readonly entries = new Map<string, PluginEntry>()
  private readonly sessions: Session[]
  private readonly preferencesPath: string
  private readonly onChanged: (plugins: PluginInfo[]) => void
  private readonly onBlockedCount: (count: number) => void
  private readonly networkGuard?: (
    details: import('electron').OnBeforeRequestListenerDetails,
    isPrivate: boolean
  ) => PluginRequestDecision | void
  private readonly requestHooks: Array<{ pluginId: string; hook: PluginRequestHook }> = []
  private readonly contentScripts: Array<{
    pluginId: string
    script: PluginContentScript
  }> = []
  private readonly subscriptions = new Map<string, ActiveSubscription[]>()
  private totalBlocked = 0
  private notifyTimer: ReturnType<typeof setTimeout> | null = null

  constructor(options: {
    plugins: MingyuePlugin[]
    sessions: Session[]
    onChanged: (plugins: PluginInfo[]) => void
    onBlockedCount: (count: number) => void
    networkGuard?: (
      details: import('electron').OnBeforeRequestListenerDetails,
      isPrivate: boolean
    ) => PluginRequestDecision | void
  }) {
    this.sessions = options.sessions
    this.onChanged = options.onChanged
    this.onBlockedCount = options.onBlockedCount
    this.networkGuard = options.networkGuard
    this.preferencesPath = join(
      app.getPath('userData'),
      'plugins',
      'preferences.json'
    )
    for (const plugin of options.plugins) {
      this.entries.set(plugin.manifest.id, {
        plugin,
        enabled: plugin.manifest.defaultEnabled,
        status: 'disabled',
        blockedCount: 0,
        activation: 0
      })
    }
  }

  async initialize(): Promise<void> {
    const preferences = this.loadPreferences()
    for (const [id, entry] of this.entries) {
      const enabled =
        typeof preferences.enabled[id] === 'boolean'
          ? preferences.enabled[id]
          : entry.plugin.manifest.defaultEnabled
      entry.enabled = enabled
    }

    this.installSessionHooks()
    this.broadcast()

    for (const entry of this.entries.values()) {
      if (entry.enabled) void this.activate(entry)
    }
  }

  list(): PluginInfo[] {
    return Array.from(this.entries.values()).map((entry) => ({
      ...entry.plugin.manifest,
      enabled: entry.enabled,
      status: entry.status,
      blockedCount: entry.blockedCount,
      detail: entry.detail
    }))
  }

  async setEnabled(id: string, enabled: boolean): Promise<PluginInfo[]> {
    const entry = this.entries.get(id)
    if (!entry || entry.enabled === enabled) return this.list()
    entry.enabled = enabled
    this.savePreferences()
    if (enabled) {
      void this.activate(entry)
    } else {
      await this.deactivate(entry)
    }
    this.broadcast()
    return this.list()
  }

  register(plugin: MingyuePlugin): PluginInfo[] {
    if (this.entries.has(plugin.manifest.id)) return this.list()
    const entry: PluginEntry = {
      plugin,
      enabled: plugin.manifest.defaultEnabled,
      status: 'disabled',
      blockedCount: 0,
      activation: 0
    }
    this.entries.set(plugin.manifest.id, entry)
    this.savePreferences()
    if (entry.enabled) void this.activate(entry)
    this.broadcast()
    return this.list()
  }

  async remove(id: string): Promise<PluginInfo[]> {
    const entry = this.entries.get(id)
    if (!entry || entry.plugin.manifest.builtin) return this.list()
    await this.deactivate(entry)
    this.entries.delete(id)
    this.savePreferences()
    this.broadcast()
    return this.list()
  }

  attachToContents(contents: WebContents): void {
    contents.on('dom-ready', () => {
      if (contents.isDestroyed()) return
      const url = contents.getURL()
      if (!url) return
      for (const { pluginId, script } of this.contentScripts) {
        const entry = this.entries.get(pluginId)
        if (!entry?.enabled) continue
        if (!script.matches.some((pattern) => matchUrl(pattern, url))) continue
        void contents.executeJavaScript(script.code, true).catch(() => {
          // A page can navigate while a plugin script is being injected.
        })
      }
    })
  }

  private createHost(
    entry: PluginEntry,
    activation: number
  ): {
    host: import('./api').PluginHost
    subscriptions: ActiveSubscription[]
  } {
    const subscriptions: ActiveSubscription[] = []
    const pluginId = entry.plugin.manifest.id
    const isCurrent = (): boolean =>
      entry.enabled && entry.activation === activation
    const host: import('./api').PluginHost = {
      registerRequestHook: (hook) => {
        if (!isCurrent()) return () => undefined
        const item = { pluginId, hook }
        this.requestHooks.push(item)
        const cleanup = (): void => {
          const index = this.requestHooks.indexOf(item)
          if (index >= 0) this.requestHooks.splice(index, 1)
        }
        subscriptions.push({ cleanup })
        return cleanup
      },
      registerContentScript: (script) => {
        if (!isCurrent()) return () => undefined
        const item = { pluginId, script }
        this.contentScripts.push(item)
        const cleanup = (): void => {
          const index = this.contentScripts.indexOf(item)
          if (index >= 0) this.contentScripts.splice(index, 1)
        }
        subscriptions.push({ cleanup })
        return cleanup
      },
      reportBlocked: (count = 1) => {
        if (!isCurrent()) return
        entry.blockedCount += count
        this.totalBlocked += count
        this.scheduleBlockedBroadcast()
      },
      setDetail: (detail) => {
        if (!isCurrent()) return
        entry.detail = detail
        this.broadcast()
      }
    }
    return { host, subscriptions }
  }

  private async activate(entry: PluginEntry): Promise<void> {
    if (!entry.enabled) return
    const activation = entry.activation + 1
    entry.activation = activation
    entry.status = 'loading'
    entry.detail = undefined
    this.broadcast()

    const { host, subscriptions } = this.createHost(entry, activation)
    this.subscriptions.set(entry.plugin.manifest.id, subscriptions)
    try {
      await entry.plugin.activate(host)
      if (!entry.enabled || entry.activation !== activation) return
      entry.status = 'active'
      this.broadcast()
    } catch (error) {
      if (entry.activation !== activation) return
      entry.status = 'error'
      entry.detail =
        error instanceof Error ? error.message : '插件启动失败'
      this.removeSubscriptions(entry.plugin.manifest.id)
      this.broadcast()
    }
  }

  private async deactivate(entry: PluginEntry): Promise<void> {
    entry.activation += 1
    this.removeSubscriptions(entry.plugin.manifest.id)
    try {
      await entry.plugin.deactivate?.()
    } catch {
      // A plugin failing to clean up must not prevent it from being disabled.
    }
    entry.status = 'disabled'
    entry.detail = undefined
  }

  private removeSubscriptions(pluginId: string): void {
    const subscriptions = this.subscriptions.get(pluginId) ?? []
    for (const subscription of subscriptions) subscription.cleanup()
    this.subscriptions.delete(pluginId)
  }

  private installSessionHooks(): void {
    for (const targetSession of this.sessions) {
      targetSession.webRequest.onBeforeRequest(
        { urls: ['<all_urls>'] },
        (details, callback) => {
          const isPrivate = this.sessions[1] === targetSession
          try {
            const guardDecision = this.networkGuard?.(details, isPrivate)
            if (guardDecision?.cancel) {
              callback({ cancel: true })
              return
            }
            if (guardDecision?.redirectURL) {
              callback({ redirectURL: guardDecision.redirectURL })
              return
            }
          } catch {
            // Runtime network guards must never break ordinary navigation.
          }
          for (const { pluginId, hook } of this.requestHooks) {
            const entry = this.entries.get(pluginId)
            if (!entry?.enabled) continue
            try {
              const decision = hook({ details, isPrivate })
              if (decision?.cancel) {
                callback({ cancel: true })
                return
              }
              if (decision?.redirectURL) {
                callback({ redirectURL: decision.redirectURL })
                return
              }
            } catch (error) {
              console.error(`[plugin:${pluginId}] request hook failed`, error)
            }
          }
          callback({})
        }
      )
    }
  }

  private scheduleBlockedBroadcast(): void {
    if (this.notifyTimer) return
    this.notifyTimer = setTimeout(() => {
      this.notifyTimer = null
      this.onBlockedCount(this.totalBlocked)
      this.broadcast()
    }, 300)
  }

  private broadcast(): void {
    this.onChanged(this.list())
  }

  private loadPreferences(): PluginPreferences {
    try {
      if (!existsSync(this.preferencesPath)) return { enabled: {} }
      return JSON.parse(readFileSync(this.preferencesPath, 'utf8')) as PluginPreferences
    } catch {
      return { enabled: {} }
    }
  }

  private savePreferences(): void {
    const enabled: Record<string, boolean> = {}
    for (const [id, entry] of this.entries) enabled[id] = entry.enabled
    try {
      mkdirSync(dirname(this.preferencesPath), { recursive: true })
      writeFileSync(
        this.preferencesPath,
        JSON.stringify({ enabled }, null, 2),
        'utf8'
      )
    } catch {
      // Plugin preferences are a convenience; activation still works in-session.
    }
  }
}
