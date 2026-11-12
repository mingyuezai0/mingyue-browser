import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Accessibility,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  Cloud,
  Cookie,
  Download,
  FolderOpen,
  Globe2,
  HardDrive,
  Home,
  Info,
  KeyRound,
  Languages,
  Monitor,
  Moon,
  Palette,
  PanelLeft,
  PanelTop,
  Plus,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  Upload,
  UserRound
} from 'lucide-react'
import type {
  AppInfo,
  PasswordBreachResult,
  PasswordRecord,
  SitePermissionInfo,
  UpdateCheckResult
} from '../../../shared/types'
import type {
  AccentId,
  CustomSearchEngine,
  Settings
} from '../lib/types'
import { PasswordPane } from './PasswordPane'
import {
  ACCENTS,
  FONT_SIZE_OPTIONS,
  SEARCH_ENGINE_OPTIONS
} from '../lib/defaults'
import { LogoMark } from './Brand'
import { Toggle } from './Ui'

type SettingsPane =
  | 'general'
  | 'home'
  | 'search'
  | 'privacy'
  | 'appearance'
  | 'tabs'
  | 'downloads'
  | 'media'
  | 'passwords'
  | 'accessibility'
  | 'language'
  | 'sync'
  | 'system'
  | 'about'

const PANES: Array<{
  id: SettingsPane
  label: string
  icon: ReactNode
  description: string
  keywords: string
}> = [
  {
    id: 'general',
    label: '常规',
    icon: <SlidersHorizontal size={17} />,
    description: '启动行为与默认缩放。',
    keywords: '启动 恢复 标签页 缩放 首页 窗口 常规'
  },
  {
    id: 'home',
    label: '主页',
    icon: <Home size={17} />,
    description: '主页地址与起始页内容。',
    keywords: '主页 起始页 新标签页 常用网站 首页'
  },
  {
    id: 'search',
    label: '搜索',
    icon: <Search size={17} />,
    description: '默认搜索引擎与地址栏建议。',
    keywords: '搜索 搜索引擎 地址栏 建议 必应 百度 谷歌'
  },
  {
    id: 'privacy',
    label: '隐私与安全',
    icon: <ShieldCheck size={17} />,
    description: '隐私信号、广告拦截与浏览数据。',
    keywords: '隐私 安全 广告 跟踪 防护 Cookie 缓存 数据 不跟踪 DNT'
  },
  {
    id: 'appearance',
    label: '外观',
    icon: <Palette size={17} />,
    description: '界面风格、显示模式、字体、书签栏和强调色。',
    keywords: '外观 主题 颜色 深色 浅色 字体 字号 强调色 书签栏 收藏夹栏'
  },
  {
    id: 'tabs',
    label: '标签页',
    icon: <PanelTop size={17} />,
    description: '布局方式和标签页密度。',
    keywords: '标签页 布局 侧边栏 顶部栏 紧凑'
  },
  {
    id: 'downloads',
    label: '下载',
    icon: <ArrowDownToLine size={17} />,
    description: '下载位置与无痕下载记录。',
    keywords: '下载 保存 文件夹 路径 无痕 清理'
  },
  {
    id: 'media',
    label: '媒体与 PDF',
    icon: <Monitor size={17} />,
    description: '自动播放、画中画与 PDF 阅读。',
    keywords: '媒体 视频 自动播放 画中画 PDF 阅读'
  },
  {
    id: 'passwords',
    label: '密码与自动填充',
    icon: <KeyRound size={17} />,
    description: '本地加密密码库与登录填充。',
    keywords: '密码 自动填充 登录 密码库 生成器 泄露 CSV'
  },
  {
    id: 'accessibility',
    label: '无障碍',
    icon: <Accessibility size={17} />,
    description: '动画与高对比度。',
    keywords: '无障碍 减少动画 高对比度 屏幕阅读器'
  },
  {
    id: 'language',
    label: '语言',
    icon: <Languages size={17} />,
    description: '浏览器界面语言与翻译目标语言。',
    keywords: '语言 界面语言 系统语言 简体中文 繁体中文 英语 日语 翻译 目标语言'
  },
  {
    id: 'sync',
    label: '账户与同步',
    icon: <Cloud size={17} />,
    description: '跨设备同步能力将在后续版本提供。',
    keywords: '账户 同步 云 跨设备 书签 历史'
  },
  {
    id: 'system',
    label: '系统与更新',
    icon: <Globe2 size={17} />,
    description: '默认浏览器、开机启动与更新状态。',
    keywords: '系统 默认浏览器 开机启动 更新 版本'
  },
  {
    id: 'about',
    label: '关于',
    icon: <Info size={17} />,
    description: '版本信息、备份恢复与恢复默认设置。',
    keywords: '关于 版本 内核 作者 重置 恢复 默认 备份'
  }
]

function SettingsCard({
  icon,
  title,
  description,
  children
}: {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}): React.ReactElement {
  return (
    <section className="settings-section settings-fx-card">
      <div className="settings-section-head">
        <span className="settings-section-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="settings-section-body">{children}</div>
    </section>
  )
}

function SettingRow({
  title,
  description,
  children
}: {
  title: string
  description: string
  children: ReactNode
}): React.ReactElement {
  return (
    <div className="setting-row">
      <div className="setting-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <div className="setting-control">{children}</div>
    </div>
  )
}

export function SettingsPage({
  settings,
  appInfo,
  onChange,
  onClearData,
  onReset,
  onOpenDownloads,
  onOpenPlugins,
  onNotify,
  passwords,
  activeUrl,
  onSavePassword,
  onDeletePassword,
  onImportPasswords,
  onAutofillPassword,
  onCheckPasswordBreach,
  onExportBackup,
  onImportBackup
}: {
  settings: Settings
  appInfo: AppInfo | null
  onChange: (patch: Partial<Settings>) => void
  onClearData: (scope: 'cache' | 'cookies' | 'all') => Promise<void>
  onReset: () => void
  onOpenDownloads: () => void
  onOpenPlugins: () => void
  onNotify: (message: string) => void
  passwords: PasswordRecord[]
  activeUrl: string
  onSavePassword: (entry: PasswordRecord) => Promise<void>
  onDeletePassword: (id: string) => Promise<void>
  onImportPasswords: () => Promise<void>
  onAutofillPassword: (entry: PasswordRecord) => Promise<boolean>
  onCheckPasswordBreach: (password: string) => Promise<PasswordBreachResult>
  onExportBackup: () => void
  onImportBackup: () => void
}): React.ReactElement {
  const [activePane, setActivePane] = useState<SettingsPane>('general')
  const [settingsSearch, setSettingsSearch] = useState('')
  const [homepage, setHomepage] = useState(settings.homepage)
  const [confirmReset, setConfirmReset] = useState(false)
  const [clearing, setClearing] = useState<string | null>(null)
  const [engineName, setEngineName] = useState('')
  const [engineKeyword, setEngineKeyword] = useState('')
  const [engineUrl, setEngineUrl] = useState('')
  const [updateState, setUpdateState] = useState<UpdateCheckResult | null>(null)
  const [permissions, setPermissions] = useState<SitePermissionInfo[]>([])
  const [permissionOrigin, setPermissionOrigin] = useState('')
  const [permissionKind, setPermissionKind] =
    useState<SitePermissionInfo['permission']>('camera')
  const [permissionDecision, setPermissionDecision] =
    useState<SitePermissionInfo['decision']>('allow')

  useEffect(() => {
    setHomepage(settings.homepage)
  }, [settings.homepage])

  useEffect(() => {
    void window.mingyue?.privacy.listPermissions().then(setPermissions)
  }, [])

  const visiblePanes = useMemo(() => {
    const query = settingsSearch.trim().toLowerCase()
    if (!query) return PANES
    return PANES.filter((pane) =>
      `${pane.label} ${pane.description} ${pane.keywords}`
        .toLowerCase()
        .includes(query)
    )
  }, [settingsSearch])

  useEffect(() => {
    if (settingsSearch.trim() && visiblePanes.length > 0) {
      if (!visiblePanes.some((pane) => pane.id === activePane)) {
        setActivePane(visiblePanes[0].id)
      }
    }
  }, [activePane, settingsSearch, visiblePanes])

  const activeMeta =
    visiblePanes.find((pane) => pane.id === activePane) ?? visiblePanes[0]

  const commitHomepage = (): void => {
    const next = homepage.trim()
    if (next && !/^https?:\/\//i.test(next)) {
      onChange({ homepage: `https://${next}` })
      setHomepage(`https://${next}`)
      onNotify('主页已更新')
      return
    }
    onChange({ homepage: next })
    onNotify('主页已更新')
  }

  const clear = async (scope: 'cache' | 'cookies' | 'all'): Promise<void> => {
    setClearing(scope)
    try {
      await onClearData(scope)
      onNotify(scope === 'all' ? '网站数据已清除' : '已清除所选数据')
    } catch {
      onNotify('清除失败，请稍后再试')
    } finally {
      setClearing(null)
    }
  }

  const chooseDownloadFolder = async (): Promise<void> => {
    if (!window.mingyue) return
    const selected = await window.mingyue.downloads.chooseDirectory()
    if (!selected) return
    onChange({ downloadDirectory: selected })
    onNotify('下载位置已更新')
  }

  const addSearchEngine = (): void => {
    const label = engineName.trim()
    const url = engineUrl.trim()
    if (!label || !url) return
    const engine: CustomSearchEngine = {
      id: `custom-${crypto.randomUUID()}`,
      label,
      keyword: engineKeyword.trim() || undefined,
      searchUrl: url
    }
    onChange({
      customSearchEngines: [...settings.customSearchEngines, engine]
    })
    setEngineName('')
    setEngineKeyword('')
    setEngineUrl('')
    onNotify(`已添加搜索引擎「${label}」`)
  }

  const removeSearchEngine = (id: string): void => {
    onChange({
      customSearchEngines: settings.customSearchEngines.filter(
        (engine) => engine.id !== id
      ),
      ...(settings.searchEngine === id ? { searchEngine: 'bing' } : {})
    })
    onNotify('搜索引擎已移除')
  }

  const checkForUpdates = async (): Promise<void> => {
    if (!window.mingyue) return
    setUpdateState(await window.mingyue.system.checkForUpdates())
  }

  const addPermission = async (): Promise<void> => {
    if (!window.mingyue) return
    const value = permissionOrigin.trim()
    if (!value) return
    let origin = value
    try {
      origin = new URL(value).origin
    } catch {
      onNotify('请输入完整的网站地址')
      return
    }
    const next = await window.mingyue.privacy.setPermission({
      id: `${origin}:${permissionKind}`,
      origin,
      permission: permissionKind,
      decision: permissionDecision,
      updatedAt: Date.now()
    })
    setPermissions(next)
    setPermissionOrigin('')
    onNotify('网站权限例外已保存')
  }

  const removePermission = async (id: string): Promise<void> => {
    if (!window.mingyue) return
    setPermissions(await window.mingyue.privacy.removePermission(id))
  }

  const permissionLabel = (kind: SitePermissionInfo['permission']): string => {
    const labels: Record<SitePermissionInfo['permission'], string> = {
      camera: '摄像头',
      microphone: '麦克风',
      geolocation: '定位',
      notifications: '通知',
      'clipboard-read': '读取剪贴板'
    }
    return labels[kind]
  }

  const renderPane = (): ReactNode => {
    if (!activeMeta) {
      return (
        <div className="settings-no-results">
          <Search size={22} />
          <strong>没有找到相关设置</strong>
          <p>换一个关键词试试。</p>
        </div>
      )
    }

    switch (activePane) {
      case 'general':
        return (
          <>
            <SettingsCard
              icon={<SlidersHorizontal size={17} />}
              title="启动"
              description="决定明月下次启动时如何打开标签页。"
            >
              <SettingRow
                title="恢复上次的标签页"
                description="下次启动时还原上次打开的标签页。"
              >
                <Toggle
                  checked={settings.restoreSession}
                  onChange={(checked) => onChange({ restoreSession: checked })}
                  label="恢复上次的标签页"
                />
              </SettingRow>
              <SettingRow
                title="新标签页默认缩放"
                description="仅影响之后新建的标签页。"
              >
                <select
                  className="select-control"
                  value={settings.defaultZoom}
                  onChange={(event) =>
                    onChange({ defaultZoom: Number(event.target.value) })
                  }
                >
                  <option value={0.8}>80%</option>
                  <option value={0.9}>90%</option>
                  <option value={1}>100%</option>
                  <option value={1.1}>110%</option>
                  <option value={1.25}>125%</option>
                </select>
              </SettingRow>
            </SettingsCard>
            <SettingsCard
              icon={<HardDrive size={17} />}
              title="本地数据"
              description="浏览器设置与浏览记录仅保存在本机。"
            >
              <SettingRow
                title="自绘窗口边框"
                description="使用明月自绘标题栏与窗口控制按钮，不使用系统原生标题栏。"
              >
                <span className="settings-value">已启用</span>
              </SettingRow>
            </SettingsCard>
          </>
        )
      case 'home':
        return (
          <>
            <SettingsCard
              icon={<Home size={17} />}
              title="主页"
              description="点击主页按钮时打开的页面。留空则返回明月起始页。"
            >
              <div className="settings-homepage-row">
                <div className="homepage-input">
                  <input
                    value={homepage}
                    placeholder="https://example.com"
                    spellCheck={false}
                    onChange={(event) => setHomepage(event.target.value)}
                    onBlur={commitHomepage}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        commitHomepage()
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="small-button"
                    onClick={commitHomepage}
                  >
                    保存
                  </button>
                </div>
              </div>
            </SettingsCard>
            <SettingsCard
              icon={<SlidersHorizontal size={17} />}
              title="起始页"
              description="新标签页会显示明月起始页。"
            >
              <SettingRow
                title="显示常用网站"
                description="在起始页底部显示默认书签和快捷入口。"
              >
                <Toggle
                  checked={settings.showQuickLinks}
                  onChange={(checked) => onChange({ showQuickLinks: checked })}
                  label="起始页显示常用网站"
                />
              </SettingRow>
            </SettingsCard>
          </>
        )
      case 'search':
        return (
          <>
            <SettingsCard
              icon={<Search size={17} />}
              title="默认搜索引擎"
              description="从地址栏或起始页搜索时使用的搜索引擎。"
            >
              <div className="engine-grid">
                {SEARCH_ENGINE_OPTIONS.map((engine) => (
                  <button
                    key={engine.id}
                    type="button"
                    className={`engine-option ${
                      settings.searchEngine === engine.id ? 'is-selected' : ''
                    }`}
                    onClick={() => onChange({ searchEngine: engine.id })}
                  >
                    <span className="engine-radio">
                      {settings.searchEngine === engine.id && (
                        <Check size={12} />
                      )}
                    </span>
                    <span className="engine-copy">
                      <strong>{engine.label}</strong>
                      <small>{engine.hint}</small>
                    </span>
                  </button>
                ))}
                {settings.customSearchEngines.map((engine) => (
                  <button
                    key={engine.id}
                    type="button"
                    className={`engine-option ${
                      settings.searchEngine === engine.id ? 'is-selected' : ''
                    }`}
                    onClick={() => onChange({ searchEngine: engine.id })}
                  >
                    <span className="engine-radio">
                      {settings.searchEngine === engine.id && (
                        <Check size={12} />
                      )}
                    </span>
                    <span className="engine-copy">
                      <strong>{engine.label}</strong>
                      <small>
                        自定义{engine.keyword ? ` · ${engine.keyword}` : ''}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </SettingsCard>
            <SettingsCard
              icon={<PanelTop size={17} />}
              title="地址栏"
              description="控制输入网址时显示哪些建议。"
            >
              <SettingRow
                title="显示地址栏建议"
                description="输入时显示搜索引擎、书签和历史记录建议。"
              >
                <Toggle
                  checked={settings.addressBarSuggestions}
                  onChange={(checked) =>
                    onChange({ addressBarSuggestions: checked })
                  }
                  label="显示地址栏建议"
                />
              </SettingRow>
              <SettingRow
                title="获取搜索建议"
                description="联网获取当前搜索引擎的实时搜索建议。"
              >
                <Toggle
                  checked={settings.searchSuggestions}
                  onChange={(checked) =>
                    onChange({ searchSuggestions: checked })
                  }
                  label="获取搜索建议"
                />
              </SettingRow>
            </SettingsCard>
            <SettingsCard
              icon={<Globe2 size={17} />}
              title="自定义搜索引擎"
              description="添加搜索引擎，或用关键字快速调用，例如 gh electron。"
            >
              <div className="custom-engine-list">
                {settings.customSearchEngines.map((engine) => (
                  <div className="custom-engine-row" key={engine.id}>
                    <span>
                      <strong>{engine.label}</strong>
                      <small>
                        {engine.keyword ? `关键字 ${engine.keyword} · ` : ''}
                        {engine.searchUrl}
                      </small>
                    </span>
                    <button
                      type="button"
                      aria-label={`删除 ${engine.label}`}
                      onClick={() => removeSearchEngine(engine.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {settings.customSearchEngines.length === 0 && (
                  <p className="custom-engine-empty">还没有自定义搜索引擎。</p>
                )}
              </div>
              <div className="custom-engine-form">
                <input
                  value={engineName}
                  onChange={(event) => setEngineName(event.target.value)}
                  placeholder="名称，例如 GitHub"
                />
                <input
                  value={engineKeyword}
                  onChange={(event) => setEngineKeyword(event.target.value)}
                  placeholder="关键字（可选）"
                />
                <input
                  value={engineUrl}
                  onChange={(event) => setEngineUrl(event.target.value)}
                  placeholder="搜索地址，含 %s，例如 https://example.com/?q=%s"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="small-button"
                  disabled={!engineName.trim() || !engineUrl.trim()}
                  onClick={addSearchEngine}
                >
                  <Plus size={14} /> 添加
                </button>
              </div>
            </SettingsCard>
          </>
        )
      case 'privacy':
        return (
          <>
            <SettingsCard
              icon={<ShieldCheck size={17} />}
              title="防护"
              description="广告与跟踪拦截由内置插件提供。"
            >
              <SettingRow
                title="广告与跟踪拦截"
                description="基于 Ghostery 开源过滤引擎，可在插件页面开关。"
              >
                <button
                  type="button"
                  className="small-button"
                  onClick={onOpenPlugins}
                >
                  管理插件
                </button>
              </SettingRow>
              <SettingRow
                title="发送“不跟踪”信号"
                description="向网站发送 DNT 与 GPC 请求头。"
              >
                <Toggle
                  checked={settings.doNotTrack}
                  onChange={(checked) => onChange({ doNotTrack: checked })}
                  label="发送不跟踪信号"
                />
              </SettingRow>
              <SettingRow
                title="跟踪保护等级"
                description="严格模式会额外拦截常见第三方跟踪域名。"
              >
                <select
                  className="select-control"
                  value={settings.trackingProtection}
                  onChange={(event) =>
                    onChange({
                      trackingProtection: event.target.value as
                        | 'standard'
                        | 'strict'
                    })
                  }
                >
                  <option value="standard">标准</option>
                  <option value="strict">严格</option>
                </select>
              </SettingRow>
              <SettingRow
                title="自动隐藏 Cookie 横幅"
                description="尝试隐藏常见的 Cookie 同意提示，不代替你作出同意。"
              >
                <Toggle
                  checked={settings.cookieBannerHandling}
                  onChange={(checked) =>
                    onChange({ cookieBannerHandling: checked })
                  }
                  label="自动隐藏 Cookie 横幅"
                />
              </SettingRow>
            </SettingsCard>
            <SettingsCard
              icon={<Globe2 size={17} />}
              title="连接安全"
              description="升级连接、加密 DNS 与代理设置。"
            >
              <SettingRow
                title="HTTPS-Only 模式"
                description="访问网站时尽量自动升级到 HTTPS，localhost 除外。"
              >
                <Toggle
                  checked={settings.httpsOnly}
                  onChange={(checked) => onChange({ httpsOnly: checked })}
                  label="HTTPS-Only 模式"
                />
              </SettingRow>
              <SettingRow
                title="加密 DNS（DoH）"
                description="使用 Cloudflare DNS over HTTPS 解析域名。"
              >
                <Toggle
                  checked={settings.dohEnabled}
                  onChange={(checked) => onChange({ dohEnabled: checked })}
                  label="加密 DNS"
                />
              </SettingRow>
              <SettingRow
                title="代理"
                description="使用系统代理、直连或手动代理规则。"
              >
                <select
                  className="select-control"
                  value={settings.proxyMode}
                  onChange={(event) =>
                    onChange({
                      proxyMode: event.target.value as
                        | 'system'
                        | 'direct'
                        | 'manual'
                    })
                  }
                >
                  <option value="system">跟随系统</option>
                  <option value="direct">直连</option>
                  <option value="manual">手动</option>
                </select>
              </SettingRow>
              {settings.proxyMode === 'manual' && (
                <div className="settings-inline-field">
                  <input
                    value={settings.proxyRules}
                    onChange={(event) =>
                      onChange({ proxyRules: event.target.value })
                    }
                    placeholder="例如 http=127.0.0.1:8080;https=127.0.0.1:8080"
                    spellCheck={false}
                  />
                </div>
              )}
              <SettingRow
                title="退出时清除数据"
                description="关闭浏览器时清理缓存、Cookie 或全部网站数据。"
              >
                <select
                  className="select-control"
                  value={settings.clearOnShutdown}
                  onChange={(event) =>
                    onChange({
                      clearOnShutdown: event.target.value as
                        | 'none'
                        | 'cache'
                        | 'cookies'
                        | 'all'
                    })
                  }
                >
                  <option value="none">不清理</option>
                  <option value="cache">缓存</option>
                  <option value="cookies">Cookie 与站点数据</option>
                  <option value="all">全部</option>
                </select>
              </SettingRow>
            </SettingsCard>
            <SettingsCard
              icon={<ShieldCheck size={17} />}
              title="站点权限"
              description="为指定网站允许摄像头、麦克风、定位或通知；未列出的网站默认拒绝。"
            >
              <div className="permission-list">
                {permissions.map((permission) => (
                  <div className="permission-row" key={permission.id}>
                    <span>
                      <strong>{permission.origin}</strong>
                      <small>
                        {permissionLabel(permission.permission)} ·{' '}
                        {permission.decision === 'allow' ? '允许' : '拒绝'}
                      </small>
                    </span>
                    <button
                      type="button"
                      aria-label="删除权限例外"
                      onClick={() => void removePermission(permission.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {permissions.length === 0 && (
                  <p className="permission-empty">当前没有网站权限例外。</p>
                )}
              </div>
              <form
                className="permission-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void addPermission()
                }}
              >
                <input
                  value={permissionOrigin}
                  onChange={(event) => setPermissionOrigin(event.target.value)}
                  placeholder="https://example.com"
                  spellCheck={false}
                />
                <select
                  value={permissionKind}
                  onChange={(event) =>
                    setPermissionKind(
                      event.target.value as SitePermissionInfo['permission']
                    )
                  }
                >
                  <option value="camera">摄像头</option>
                  <option value="microphone">麦克风</option>
                  <option value="geolocation">定位</option>
                  <option value="notifications">通知</option>
                  <option value="clipboard-read">读取剪贴板</option>
                </select>
                <select
                  value={permissionDecision}
                  onChange={(event) =>
                    setPermissionDecision(
                      event.target.value as SitePermissionInfo['decision']
                    )
                  }
                >
                  <option value="allow">允许</option>
                  <option value="deny">拒绝</option>
                </select>
                <button
                  type="submit"
                  className="small-button"
                  disabled={!permissionOrigin.trim()}
                >
                  添加例外
                </button>
              </form>
            </SettingsCard>
            <SettingsCard
              icon={<Cookie size={17} />}
              title="浏览数据"
              description="清除当前浏览器会话保存的网站数据。"
            >
              <div className="settings-data-actions">
                <button
                  type="button"
                  disabled={clearing !== null}
                  onClick={() => void clear('cache')}
                >
                  <span>
                    <strong>清除缓存</strong>
                    <small>释放图片与网页的本地缓存</small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
                <button
                  type="button"
                  disabled={clearing !== null}
                  onClick={() => void clear('cookies')}
                >
                  <span>
                    <strong>清除 Cookie</strong>
                    <small>网站登录状态也会退出</small>
                  </span>
                  <Cookie size={15} />
                </button>
                <button
                  type="button"
                  className="is-danger"
                  disabled={clearing !== null}
                  onClick={() => void clear('all')}
                >
                  <span>
                    <strong>清除网站数据</strong>
                    <small>缓存、Cookie 与站点存储</small>
                  </span>
                  <Trash2 size={15} />
                </button>
              </div>
            </SettingsCard>
          </>
        )
      case 'appearance':
        return (
          <>
            <SettingsCard
              icon={<Palette size={17} />}
              title="主题"
              description="选择界面风格。明月是当前默认风格，经典保留上一版的暖色配色。"
            >
              <div className="design-picker">
                <button
                  type="button"
                  className={`design-option ${
                    settings.design !== 'classic' ? 'is-selected' : ''
                  }`}
                  onClick={() => onChange({ design: 'mingyue' })}
                >
                  <span className="design-preview design-preview--mingyue">
                    <span className="design-preview-side" />
                    <span className="design-preview-surface">
                      <span />
                      <span />
                    </span>
                  </span>
                  <span className="design-option-copy">
                    <strong>明月</strong>
                    <small>低饱和月白与松绿，默认</small>
                  </span>
                  <span className="layout-check">
                    {settings.design !== 'classic' && <Check size={12} />}
                  </span>
                </button>
                <button
                  type="button"
                  className={`design-option ${
                    settings.design === 'classic' ? 'is-selected' : ''
                  }`}
                  onClick={() => onChange({ design: 'classic' })}
                >
                  <span className="design-preview design-preview--classic">
                    <span className="design-preview-side" />
                    <span className="design-preview-surface">
                      <span />
                      <span />
                    </span>
                  </span>
                  <span className="design-option-copy">
                    <strong>经典</strong>
                    <small>上一版的暖色界面</small>
                  </span>
                  <span className="layout-check">
                    {settings.design === 'classic' && <Check size={12} />}
                  </span>
                </button>
              </div>
            </SettingsCard>
            <SettingsCard
              icon={<Moon size={17} />}
              title="显示模式"
              description="深色模式会同步调整文字、面板与控件颜色。"
            >
              <div className="appearance-picker">
                {(
                  [
                    { id: 'light', label: '浅色', icon: <Sun size={16} /> },
                    { id: 'dark', label: '深色', icon: <Moon size={16} /> },
                    {
                      id: 'system',
                      label: '跟随系统',
                      icon: <Monitor size={16} />
                    }
                  ] as Array<{
                    id: 'light' | 'dark' | 'system'
                    label: string
                    icon: ReactNode
                  }>
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`appearance-option ${
                      (settings.themeMode ?? 'system') === mode.id
                        ? 'is-selected'
                        : ''
                    }`}
                    onClick={() => onChange({ themeMode: mode.id })}
                  >
                    {mode.icon}
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </SettingsCard>
            <SettingsCard
              icon={<span className="settings-letter-icon">Aa</span>}
              title="字体大小"
              description="调整浏览器界面文字大小，不影响网页缩放。"
            >
              <div className="appearance-picker font-size-picker">
                {FONT_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`appearance-option font-size-option ${
                      (settings.fontSize ?? 'large') === option.id
                        ? 'is-selected'
                        : ''
                    }`}
                    onClick={() => onChange({ fontSize: option.id })}
                  >
                    <span
                      className="font-size-sample"
                      style={{ fontSize: option.sample }}
                      aria-hidden="true"
                    >
                      Aa
                    </span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </SettingsCard>
            <SettingsCard
              icon={<PanelTop size={17} />}
              title="浏览器界面"
              description="控制地址栏下方的书签栏是否显示。"
            >
              <SettingRow
                title="显示收藏夹栏"
                description="在顶部搜索框下方显示一行收藏网站。"
              >
                <Toggle
                  checked={settings.showBookmarksBar}
                  onChange={(checked) => onChange({ showBookmarksBar: checked })}
                  label="显示收藏夹栏"
                />
              </SettingRow>
              <SettingRow
                title="显示左上角图标和软件名"
                description="关闭后左上角的 Logo 与「明月」文字会隐藏，窗口控制仍然保留。"
              >
                <Toggle
                  checked={settings.showBrand}
                  onChange={(checked) => onChange({ showBrand: checked })}
                  label="显示左上角图标和软件名"
                />
              </SettingRow>
            </SettingsCard>
            <SettingsCard
              icon={<Palette size={17} />}
              title="强调色"
              description="用于按钮、选中状态和细节点缀。"
            >
              <div className="accent-picker">
                {(Object.keys(ACCENTS) as AccentId[]).map((accentId) => {
                  const accent = ACCENTS[accentId]
                  return (
                    <button
                      key={accentId}
                      type="button"
                      className={`accent-option ${
                        settings.accent === accentId ? 'is-selected' : ''
                      }`}
                      onClick={() => onChange({ accent: accentId })}
                    >
                      <span
                        className="accent-swatch"
                        style={{ background: accent.accent }}
                      >
                        {settings.accent === accentId && <Check size={14} />}
                      </span>
                      <span>{accent.label}</span>
                    </button>
                  )
                })}
              </div>
            </SettingsCard>
          </>
        )
      case 'tabs':
        return (
          <>
            <SettingsCard
              icon={<PanelTop size={17} />}
              title="布局风格"
              description="决定标签页与工具栏的排布方式，切换后立即生效。"
            >
              <div className="layout-picker">
                <button
                  type="button"
                  data-layout="sidebar"
                  className={`layout-option ${
                    (settings.layout ?? 'topbar') === 'sidebar'
                      ? 'is-selected'
                      : ''
                  }`}
                  onClick={() => onChange({ layout: 'sidebar' })}
                >
                  <span className="layout-choice-icon">
                    <PanelLeft size={21} strokeWidth={1.8} />
                  </span>
                  <span className="layout-option-copy">
                    <strong>侧边栏</strong>
                    <small>标签竖排在左侧，适合宽屏与多任务</small>
                  </span>
                  <span className="layout-check">
                    {(settings.layout ?? 'topbar') === 'sidebar' && (
                      <Check size={12} />
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  data-layout="topbar"
                  className={`layout-option ${
                    (settings.layout ?? 'topbar') === 'topbar'
                      ? 'is-selected'
                      : ''
                  }`}
                  onClick={() => onChange({ layout: 'topbar' })}
                >
                  <span className="layout-choice-icon">
                    <PanelTop size={21} strokeWidth={1.8} />
                  </span>
                  <span className="layout-option-copy">
                    <strong>顶部栏</strong>
                    <small>标签横排在顶部，留给网页更多宽度</small>
                  </span>
                  <span className="layout-check">
                    {(settings.layout ?? 'topbar') === 'topbar' && (
                      <Check size={12} />
                    )}
                  </span>
                </button>
              </div>
            </SettingsCard>
            <SettingsCard
              icon={<SlidersHorizontal size={17} />}
              title="标签页密度"
              description="减少标签页占用的空间，适合小屏幕或超多标签。"
            >
              <SettingRow
                title="紧凑标签页"
                description="降低标签高度，并在侧边栏隐藏域名行。"
              >
                <Toggle
                  checked={settings.compactTabs}
                  onChange={(checked) => onChange({ compactTabs: checked })}
                  label="紧凑标签页"
                />
              </SettingRow>
              <SettingRow
                title="关闭多个标签页时提醒"
                description="关闭包含多个标签页的窗口前显示确认提示。"
              >
                <Toggle
                  checked={settings.warnOnCloseMultipleTabs}
                  onChange={(checked) =>
                    onChange({ warnOnCloseMultipleTabs: checked })
                  }
                  label="关闭多个标签页时提醒"
                />
              </SettingRow>
            </SettingsCard>
          </>
        )
      case 'downloads':
        return (
          <>
            <SettingsCard
              icon={<FolderOpen size={17} />}
              title="保存位置"
              description="下载文件默认保存在指定文件夹中。"
            >
              <div className="settings-download-path">
                <div className="settings-path-display">
                  <span>下载文件夹</span>
                  <strong>
                    {settings.downloadDirectory ||
                      '系统下载文件夹 / Mingyue'}
                  </strong>
                </div>
                <button
                  type="button"
                  className="small-button"
                  onClick={() => void chooseDownloadFolder()}
                >
                  更改…
                </button>
              </div>
              {settings.downloadDirectory && (
                <button
                  type="button"
                  className="text-button settings-reset-path"
                  onClick={() => {
                    onChange({ downloadDirectory: '' })
                    onNotify('已恢复默认下载位置')
                  }}
                >
                  恢复默认位置
                </button>
              )}
            </SettingsCard>
            <SettingsCard
              icon={<Trash2 size={17} />}
              title="无痕下载"
              description="无痕标签页中的下载不会出现在普通浏览记录中。"
            >
              <SettingRow
                title="下载前询问保存位置"
                description="每个下载都打开系统保存对话框，而不是直接保存。"
              >
                <Toggle
                  checked={settings.downloadAskLocation}
                  onChange={(checked) =>
                    onChange({ downloadAskLocation: checked })
                  }
                  label="下载前询问保存位置"
                />
              </SettingRow>
              <SettingRow
                title="下载完成后打开文件"
                description="适用于可信文件；关闭时只显示完成提示。"
              >
                <Toggle
                  checked={settings.downloadOpenWhenDone}
                  onChange={(checked) =>
                    onChange({ downloadOpenWhenDone: checked })
                  }
                  label="下载完成后打开文件"
                />
              </SettingRow>
              <SettingRow
                title="按扩展名自动打开"
                description="逗号分隔，例如 pdf, png；留空则不自动打开。"
              >
                <input
                  className="settings-small-input"
                  defaultValue={settings.downloadOpenExtensions.join(', ')}
                  placeholder="pdf, png"
                  onBlur={(event) =>
                    onChange({
                      downloadOpenExtensions: event.target.value
                        .split(',')
                        .map((item) => item.trim().replace(/^\./, '').toLowerCase())
                        .filter(Boolean)
                    })
                  }
                />
              </SettingRow>
              <SettingRow
                title="关闭无痕标签页时清除下载记录"
                description="同时停止仍在进行的无痕下载。"
              >
                <Toggle
                  checked={settings.clearPrivateDownloads}
                  onChange={(checked) =>
                    onChange({ clearPrivateDownloads: checked })
                  }
                  label="关闭无痕标签页时清除下载记录"
                />
              </SettingRow>
            </SettingsCard>
            <button
              type="button"
              className="settings-inline-link"
              onClick={onOpenDownloads}
            >
              打开下载内容
              <ArrowUpRight size={14} />
            </button>
          </>
        )
      case 'media':
        return (
          <>
            <SettingsCard
              icon={<Monitor size={17} />}
              title="视频与媒体"
              description="控制网页媒体和内置播放器。"
            >
              <SettingRow
                title="自动播放"
                description="阻止网页在未经交互时自动播放声音或视频。"
              >
                <select
                  className="select-control"
                  value={settings.autoplayPolicy}
                  onChange={(event) =>
                    onChange({
                      autoplayPolicy: event.target.value as 'block' | 'allow'
                    })
                  }
                >
                  <option value="block">阻止自动播放</option>
                  <option value="allow">允许自动播放</option>
                </select>
              </SettingRow>
              <SettingRow
                title="内置 PDF 阅读"
                description="使用 Chromium PDF 查看器打开 PDF；关闭后交给系统应用。"
              >
                <Toggle
                  checked={settings.pdfViewerEnabled}
                  onChange={(checked) => onChange({ pdfViewerEnabled: checked })}
                  label="内置 PDF 阅读"
                />
              </SettingRow>
              <SettingRow
                title="画中画"
                description="在网页视频上使用右键菜单或“更多 → 画中画”。"
              >
                <span className="settings-value">可用</span>
              </SettingRow>
            </SettingsCard>
          </>
        )
      case 'passwords':
        return (
          <>
            <SettingsCard
              icon={<KeyRound size={17} />}
              title="登录与填充"
              description="密码库使用系统安全存储加密，仅保存在本机。"
            >
              <SettingRow
                title="启用密码库"
                description="保存网站用户名和密码，并在需要时填充。"
              >
                <Toggle
                  checked={settings.passwordManagerEnabled}
                  onChange={(checked) =>
                    onChange({ passwordManagerEnabled: checked })
                  }
                  label="启用密码库"
                />
              </SettingRow>
              <SettingRow
                title="自动填充登录表单"
                description="在密码库中找到匹配网站时允许一键填充。"
              >
                <Toggle
                  checked={settings.autofillEnabled}
                  onChange={(checked) => onChange({ autofillEnabled: checked })}
                  label="自动填充登录表单"
                />
              </SettingRow>
            </SettingsCard>
            <PasswordPane
              passwords={passwords}
              activeUrl={activeUrl}
              onSave={onSavePassword}
              onDelete={onDeletePassword}
              onImport={onImportPasswords}
              onAutofill={onAutofillPassword}
              onCheckBreach={onCheckPasswordBreach}
            />
          </>
        )
      case 'accessibility':
        return (
          <>
            <SettingsCard
              icon={<Accessibility size={17} />}
              title="动作与对比度"
              description="让界面更适合你的视觉和使用习惯。"
            >
              <SettingRow
                title="减少动画"
                description="关闭界面过渡与装饰性动画。"
              >
                <Toggle
                  checked={settings.reduceMotion}
                  onChange={(checked) => onChange({ reduceMotion: checked })}
                  label="减少动画"
                />
              </SettingRow>
              <SettingRow
                title="高对比度模式"
                description="增强边框、文字与背景之间的反差。"
              >
                <Toggle
                  checked={settings.highContrast}
                  onChange={(checked) => onChange({ highContrast: checked })}
                  label="高对比度模式"
                />
              </SettingRow>
            </SettingsCard>
          </>
        )
      case 'language':
        return (
          <>
            <SettingsCard
              icon={<Languages size={17} />}
              title="浏览器语言"
              description="界面文字会立即切换；网页内容、书签标题和网站内容不会被改写。"
            >
              <SettingRow
                title="界面语言"
                description="默认跟随 Windows 系统语言，也可以手动固定一种语言。"
              >
                <select
                  className="select-control select-control--wide"
                  value={settings.language}
                  onChange={(event) =>
                    onChange({
                      language: event.target.value as Settings['language']
                    })
                  }
                >
                  <option value="system">跟随系统语言</option>
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </SettingRow>
              <div className="settings-inline-note">
                当前浏览器界面语言：
                <strong>
                  {settings.language === 'system'
                    ? `跟随系统（${navigator.language}）`
                    : settings.language === 'zh-CN'
                      ? '简体中文'
                      : settings.language === 'zh-TW'
                        ? '繁體中文'
                        : settings.language === 'en'
                          ? 'English'
                          : '日本語'}
                </strong>
              </div>
            </SettingsCard>
            <SettingsCard
              icon={<Globe2 size={17} />}
              title="翻译后语言"
              description="网页机翻按钮会将网页文本翻译为这里选择的目标语言。"
            >
              <SettingRow
                title="机翻目标语言"
                description="只影响网页机翻，不会改变浏览器界面语言。"
              >
                <select
                  className="select-control"
                  value={settings.translationTarget}
                  onChange={(event) =>
                    onChange({
                      translationTarget: event.target
                        .value as Settings['translationTarget']
                    })
                  }
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </SettingRow>
              <div className="settings-inline-note">
                当前翻译目标：
                <strong>
                  {settings.translationTarget === 'zh-CN'
                    ? '简体中文'
                    : settings.translationTarget === 'zh-TW'
                      ? '繁體中文'
                      : settings.translationTarget === 'en'
                        ? 'English'
                        : '日本語'}
                </strong>
              </div>
            </SettingsCard>
          </>
        )
      case 'sync':
        return (
          <SettingsCard
            icon={<Cloud size={17} />}
            title="账户与同步"
            description="跨设备同步书签、历史记录、密码与打开的标签页。"
          >
            <div className="settings-placeholder-card">
              <span className="settings-placeholder-mark"><Cloud size={22} /></span>
              <div>
                <strong>后续版本更新</strong>
                <p>账户体系与端到端加密同步服务尚未启用。当前所有浏览器数据只保存在本机，你也可以在「关于」中导出本地备份。</p>
              </div>
            </div>
            <div className="settings-about-grid">
              <div>
                <span>同步状态</span>
                <strong>未登录</strong>
              </div>
              <div>
                <span>本地备份</span>
                <strong>可用</strong>
              </div>
            </div>
          </SettingsCard>
        )
      case 'system':
        return (
          <>
            <SettingsCard
              icon={<UserRound size={17} />}
              title="系统集成"
              description="让明月更自然地融入桌面环境。"
            >
              <SettingRow
                title="开机时启动明月"
                description="登录 Windows 后自动启动浏览器。"
              >
                <Toggle
                  checked={settings.startupOnBoot}
                  onChange={(checked) => onChange({ startupOnBoot: checked })}
                  label="开机时启动明月"
                />
              </SettingRow>
              <SettingRow
                title="默认浏览器"
                description="在 Windows 设置中将明月设为默认浏览器。"
              >
                <button
                  type="button"
                  className="small-button"
                  onClick={() => {
                    void window.mingyue?.system.openDefaultApps()
                    onNotify('已打开 Windows 默认应用设置')
                  }}
                >
                  打开系统设置
                </button>
              </SettingRow>
            </SettingsCard>
            <SettingsCard
              icon={<RefreshCw size={17} />}
              title="更新"
              description="当前为源码运行版本，更新通道需在打包发布后启用。"
            >
              <div className="settings-update-row">
                <div>
                  <strong>明月浏览器 v{appInfo?.version ?? '1.0.1'}</strong>
                  <span>Chromium {appInfo?.chrome ?? '—'} · Electron {appInfo?.electron ?? '—'}</span>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void checkForUpdates()}
                >
                  <RefreshCw size={14} /> 检查更新
                </button>
              </div>
              {updateState && (
                <p className="settings-update-message">{updateState.message}</p>
              )}
            </SettingsCard>
          </>
        )
      case 'about':
        return (
          <>
            <SettingsCard
              icon={<Info size={17} />}
              title="关于明月"
              description="无需账号，浏览记录保存在本机。"
            >
              <div className="settings-about-brand">
                <LogoMark size={46} />
                <div>
                  <h2>明月浏览器</h2>
                  <p>作者@此间明月在</p>
                </div>
              </div>
              <div className="settings-about-grid">
                <div>
                  <span>版本</span>
                  <strong>v{appInfo?.version ?? '1.0.1'}</strong>
                </div>
                <div>
                  <span>Chromium</span>
                  <strong>{appInfo?.chrome ?? '—'}</strong>
                </div>
                <div>
                  <span>Electron</span>
                  <strong>{appInfo?.electron ?? '—'}</strong>
                </div>
                <div>
                  <span>平台</span>
                  <strong>{appInfo?.platform ?? '—'}</strong>
                </div>
              </div>
            </SettingsCard>
            <SettingsCard
              icon={<Download size={17} />}
              title="本地备份"
              description="导出或恢复书签、历史、设置与搜索引擎配置。"
            >
              <div className="settings-backup-actions">
                <button type="button" className="secondary-button" onClick={onExportBackup}>
                  <Download size={15} /> 导出备份
                </button>
                <button type="button" className="secondary-button" onClick={onImportBackup}>
                  <Upload size={15} /> 恢复备份
                </button>
              </div>
            </SettingsCard>
            <SettingsCard
              icon={<RotateCcw size={17} />}
              title="恢复默认设置"
              description="恢复默认搜索、外观与隐私设置，不会删除书签和历史。"
            >
              {confirmReset ? (
                <div className="confirm-inline">
                  <span>确定恢复默认设置？</span>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => {
                      onReset()
                      setConfirmReset(false)
                      onNotify('已恢复默认设置')
                    }}
                  >
                    确认恢复
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setConfirmReset(false)}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setConfirmReset(true)}
                >
                  <RotateCcw size={15} />
                  恢复默认设置
                </button>
              )}
            </SettingsCard>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="library-page settings-page settings-page--fx">
      <div className="settings-shell">
        <aside className="settings-rail">
          <div className="settings-rail-head">
            <LogoMark size={23} />
            <strong>设置</strong>
          </div>
          <nav className="settings-nav" aria-label="设置分类">
            {visiblePanes.map((pane) => (
              <button
                key={pane.id}
                type="button"
                className={`settings-nav-item ${
                  activePane === pane.id ? 'is-active' : ''
                }`}
                onClick={() => setActivePane(pane.id)}
              >
                {pane.icon}
                <span>{pane.label}</span>
              </button>
            ))}
            {visiblePanes.length === 0 && (
              <span className="settings-nav-empty">无匹配设置</span>
            )}
          </nav>
          <div className="settings-rail-footer">
            <button
              type="button"
              className="settings-nav-item"
              onClick={onOpenPlugins}
            >
              <Puzzle size={17} />
              <span>扩展与主题</span>
            </button>
          </div>
        </aside>

        <section className="settings-content">
          <label className="settings-search">
            <Search size={16} />
            <input
              value={settingsSearch}
              onChange={(event) => setSettingsSearch(event.target.value)}
              placeholder="在设置中查找"
              spellCheck={false}
            />
          </label>

          {activeMeta && (
            <header className="settings-pane-head">
              <span>{activeMeta.icon}</span>
              <div>
                <h1>{activeMeta.label}</h1>
                <p>{activeMeta.description}</p>
              </div>
            </header>
          )}

          <div className="settings-pane-body">{renderPane()}</div>
        </section>
      </div>
    </div>
  )
}
