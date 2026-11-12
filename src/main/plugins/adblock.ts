import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  ElectronBlocker,
  fromElectronDetails
} from '@ghostery/adblocker-electron'
import type { MingyuePlugin, PluginHost } from './api'

const FALLBACK_HOSTS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'adnxs.com',
  'taboola.com',
  'outbrain.com',
  'criteo.com',
  'criteo.net',
  'scorecardresearch.com',
  'quantserve.com',
  'amazon-adsystem.com',
  'adsrvr.org',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.net',
  'media.net',
  'zedo.com',
  'mgid.com',
  'propellerads.com',
  'popads.net',
  'umeng.com',
  'cnzz.com',
  'hm.baidu.com',
  'pos.baidu.com',
  'cpro.baidu.com',
  'tanx.com',
  'alimama.com',
  'gdt.qq.com',
  'e.qq.com'
]

let engine: ElectronBlocker | null = null
let engineLoad: Promise<ElectronBlocker> | null = null
let loadedWithFallback = false

function engineCachePath(): string {
  return join(app.getPath('userData'), 'plugins', 'adblock-engine.bin')
}

function fallbackFilters(): string {
  return FALLBACK_HOSTS.map((host) => `||${host}^`).join('\n')
}

async function loadEngine(host: PluginHost): Promise<ElectronBlocker> {
  if (engine) return engine
  if (engineLoad) return engineLoad

  engineLoad = (async () => {
    const cachePath = engineCachePath()
    try {
      await mkdir(join(app.getPath('userData'), 'plugins'), { recursive: true })
    } catch {
      // The cache directory is an optimization; loading still works without it.
    }

    try {
      host.setDetail('正在更新广告与跟踪过滤规则…')
      const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(
        fetch as unknown as Parameters<
          typeof ElectronBlocker.fromPrebuiltAdsAndTracking
        >[0],
        {
          path: cachePath,
          read: readFile,
          write: writeFile
        }
      )
      loadedWithFallback = false
      host.setDetail('Ghostery 过滤规则已就绪')
      return blocker
    } catch {
      try {
        const cached = await readFile(cachePath)
        const blocker = ElectronBlocker.deserialize(
          new Uint8Array(cached.buffer, cached.byteOffset, cached.byteLength)
        )
        host.setDetail('使用本地缓存的过滤规则')
        return blocker
      } catch {
        const blocker = ElectronBlocker.parse(fallbackFilters())
        loadedWithFallback = true
        host.setDetail('网络规则更新失败，正在使用内置基础过滤规则')
        return blocker
      }
    }
  })()

  try {
    engine = await engineLoad
    return engine
  } finally {
    engineLoad = null
  }
}

export const adblockPlugin: MingyuePlugin = {
  manifest: {
    id: 'adblock',
    name: '广告与跟踪拦截',
    version: '1.0.0',
    description:
      '基于 Ghostery 开源过滤引擎，在请求阶段拦截常见广告、统计与跟踪资源。',
    author: 'Ghostery · 明月浏览器',
    homepage: 'https://github.com/ghostery/adblocker',
    license: 'MPL-2.0',
    builtin: true,
    defaultEnabled: true
  },

  async activate(host) {
    const blocker = await loadEngine(host)

    host.registerRequestHook(({ details }) => {
      if (!details.url || details.resourceType === 'mainFrame') return
      try {
        const request = fromElectronDetails(details)
        const result = blocker.match(request)
        if (result.redirect?.dataUrl) {
          return { redirectURL: result.redirect.dataUrl }
        }
        if (result.match) {
          host.reportBlocked(1)
          return { cancel: true }
        }
      } catch {
        // Never risk breaking navigation because a filter could not be parsed.
      }
      return undefined
    })

    if (loadedWithFallback) {
      host.setDetail('正在使用内置基础过滤规则')
    } else {
      host.setDetail('Ghostery 过滤规则已启用')
    }
  }
}
