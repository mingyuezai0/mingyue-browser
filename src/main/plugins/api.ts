import type { OnBeforeRequestListenerDetails } from 'electron'

/**
 * Stable plugin interface for 明月浏览器.
 *
 * A plugin is a trusted main-process module registered in registry.ts. It can
 * contribute synchronous network-request decisions and page scripts. Plugins
 * are enabled/disabled by PluginManager and receive a fresh host on activation.
 */
export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  license: string
  builtin: boolean
  defaultEnabled: boolean
}

export interface PluginRequestContext {
  details: OnBeforeRequestListenerDetails
  isPrivate: boolean
}

export interface PluginRequestDecision {
  cancel?: boolean
  redirectURL?: string
}

export type PluginRequestHook = (
  request: PluginRequestContext
) => PluginRequestDecision | void

export interface PluginContentScript {
  /** Glob-style URL patterns, for example `https://example.com/*`. */
  matches: string[]
  /** JavaScript executed in the page after DOM ready. */
  code: string
}

export interface PluginHost {
  /** Request hooks are synchronous, matching Electron webRequest semantics. */
  registerRequestHook: (hook: PluginRequestHook) => () => void
  registerContentScript: (script: PluginContentScript) => () => void
  reportBlocked: (count?: number) => void
  setDetail: (detail: string) => void
}

export interface MingyuePlugin {
  manifest: PluginManifest
  activate: (host: PluginHost) => void | Promise<void>
  deactivate?: () => void | Promise<void>
}
