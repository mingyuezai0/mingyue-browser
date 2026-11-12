import { app } from 'electron'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import type { MingyuePlugin } from './api'

interface ExternalManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  license?: string
  defaultEnabled?: boolean
  matches?: string[]
  contentScript?: string
  blockHosts?: string[]
}

function extensionsRoot(): string {
  return join(app.getPath('userData'), 'extensions')
}

function isSafeId(id: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{2,80}$/i.test(id)
}

function hostMatches(pattern: string, url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === pattern ||
      parsed.hostname.endsWith(`.${pattern}`)
    )
  } catch {
    return false
  }
}

function pluginFromFolder(folder: string): MingyuePlugin | null {
  const manifestPath = join(folder, 'plugin.json')
  if (!existsSync(manifestPath)) return null
  try {
    const manifest = JSON.parse(
      readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, '')
    ) as ExternalManifest
    if (!manifest.id || !isSafeId(manifest.id) || !manifest.name) return null
    const matches =
      Array.isArray(manifest.matches) && manifest.matches.length > 0
        ? manifest.matches
        : ['<all_urls>']
    const blockHosts = Array.isArray(manifest.blockHosts)
      ? manifest.blockHosts.filter((host) => typeof host === 'string')
      : []
    let contentCode = ''
    if (manifest.contentScript) {
      const scriptPath = join(folder, basename(manifest.contentScript))
      if (existsSync(scriptPath) && statSync(scriptPath).isFile()) {
        contentCode = readFileSync(scriptPath, 'utf8')
      }
    }
    return {
      manifest: {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version || '1.0.0',
        description: manifest.description || '本地安装的明月扩展。',
        author: manifest.author || '本地扩展',
        homepage: manifest.homepage,
        license: manifest.license || '未声明',
        builtin: false,
        defaultEnabled: manifest.defaultEnabled !== false
      },
      activate(host) {
        if (contentCode) {
          host.registerContentScript({ matches, code: contentCode })
        }
        if (blockHosts.length > 0) {
          host.registerRequestHook((request) => {
            if (blockHosts.some((pattern) => hostMatches(pattern, request.details.url))) {
              host.reportBlocked()
              return { cancel: true }
            }
          })
        }
        host.setDetail(
          `本地扩展 · ${
            blockHosts.length
              ? `拦截 ${blockHosts.length} 个域名`
              : contentCode
                ? '页面脚本已注入'
                : '已启用'
          }`
        )
      }
    }
  } catch {
    return null
  }
}

export function loadExternalPlugins(): MingyuePlugin[] {
  const root = extensionsRoot()
  if (!existsSync(root)) return []
  const plugins: MingyuePlugin[] = []
  for (const entry of readdirSync(root)) {
    const folder = join(root, entry)
    try {
      if (!statSync(folder).isDirectory()) continue
      const plugin = pluginFromFolder(folder)
      if (plugin) plugins.push(plugin)
    } catch {
      // Ignore a partially copied extension directory.
    }
  }
  return plugins
}

export function installExternalPlugin(manifestPath: string): MingyuePlugin | null {
  try {
    const sourceFolder = dirname(manifestPath)
    const manifest = JSON.parse(
      readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, '')
    ) as ExternalManifest
    if (!manifest.id || !isSafeId(manifest.id) || !manifest.name) return null
    const folder = join(extensionsRoot(), manifest.id)
    mkdirSync(folder, { recursive: true })
    copyFileSync(manifestPath, join(folder, 'plugin.json'))
    if (manifest.contentScript) {
      const sourceScript = join(sourceFolder, basename(manifest.contentScript))
      if (existsSync(sourceScript) && statSync(sourceScript).isFile()) {
        copyFileSync(sourceScript, join(folder, basename(manifest.contentScript)))
      }
    }
    return pluginFromFolder(folder)
  } catch {
    return null
  }
}
