import { useEffect } from 'react'
import type { UiLanguage, TranslationTarget } from './types'

export type UiLocale = Exclude<UiLanguage, 'system'>

const TRADITIONAL_MAP: Record<string, string> = {
  书: '書', 签: '籤', 设: '設', 页: '頁', 历: '歷', 览: '覽',
  浏: '瀏', 语: '語', 这: '這', 个: '個', 为: '為', 与: '與',
  实: '實', 现: '現', 启: '啟', 动: '動', 开: '開', 关: '關',
  闭: '閉', 删: '刪', 复: '復', 制: '製', 贴: '貼', 图: '圖',
  标: '標', 记: '記', 录: '錄', 载: '載', 传: '傳', 输: '輸',
  网: '網', 络: '絡', 连: '連', 隐: '隱', 数: '數', 据: '據',
  缓: '緩', 权: '權', 许: '許', 选: '選', 择: '擇', 应: '應',
  认: '認', 随: '隨', 统: '統', 简: '簡', 体: '體', 译: '譯',
  后: '後', 题: '題', 码: '碼', 无: '無', 碍: '礙',
  对: '對', 账: '賬', 户: '戶', 于: '於', 扩: '擴', 导: '導',
  栏: '欄', 夹: '夾', 项: '項', 单: '單', 检: '檢', 测: '測',
  视: '視', 频: '頻', 声: '聲', 画: '畫', 读: '讀', 种: '種',
  类: '類', 当: '當', 里: '裡', 还: '還', 进: '進', 过: '過',
  将: '將', 时: '時', 间: '間', 从: '從', 来: '來', 会: '會',
  没: '沒', 说: '說', 请: '請', 谢: '謝',
  换: '換', 内: '內', 写: '寫', 机: '機', 钮: '鈕', 响: '響',
  变: '變', 观: '觀'
}

const ENGLISH: Record<string, string> = {
  '常规': 'General', '主页': 'Home', '搜索': 'Search',
  '隐私与安全': 'Privacy & security', '外观': 'Appearance',
  '标签页': 'Tabs', '下载': 'Downloads', '媒体与 PDF': 'Media & PDF',
  '密码与自动填充': 'Passwords & autofill', '无障碍': 'Accessibility',
  '语言': 'Language', '账户与同步': 'Account & sync',
  '系统与更新': 'System & updates', '关于': 'About',
  '扩展与主题': 'Extensions & themes', '设置': 'Settings',
  '启动行为与默认缩放。': 'Startup behavior and default zoom.',
  '主页地址与起始页内容。': 'Homepage and start page content.',
  '默认搜索引擎与地址栏建议。': 'Default search and address suggestions.',
  '隐私信号、广告拦截与浏览数据。': 'Privacy signals, ad blocking, and browsing data.',
  '界面风格、显示模式、字体、书签栏和强调色。': 'Theme, display mode, fonts, bookmarks bar, and accent.',
  '布局方式和标签页密度。': 'Layout and tab density.',
  '下载位置与无痕下载记录。': 'Download location and private download history.',
  '自动播放、画中画与 PDF 阅读。': 'Autoplay, picture-in-picture, and PDF viewing.',
  '本地加密密码库与登录填充。': 'Local encrypted password vault and login filling.',
  '动画与高对比度。': 'Motion and high contrast.',
  '浏览器界面语言与翻译目标语言。': 'Browser language and translation target.',
  '跨设备同步能力将在后续版本提供。': 'Cross-device sync will be available in a future version.',
  '默认浏览器、开机启动与更新状态。': 'Default browser, startup, and update status.',
  '版本信息、备份恢复与恢复默认设置。': 'Version, backup restore, and reset.',
  '在设置中查找': 'Find in settings', '主题': 'Theme',
  '显示模式': 'Display mode', '字体大小': 'Font size',
  '浏览器界面': 'Browser interface', '布局风格': 'Layout',
  '标签页密度': 'Tab density', '减少动画': 'Reduce motion',
  '高对比度模式': 'High contrast', '界面语言': 'Interface language',
  '机翻目标语言': 'Translation target', '翻译后语言': 'Translation language',
  '浏览器语言': 'Browser language', '当前界面语言': 'Current interface language',
  '当前翻译目标': 'Current translation target', '启动行为': 'Startup',
  '恢复上次的标签页': 'Restore previous tabs', '新建标签页默认缩放': 'Default new-tab zoom',
  '默认搜索引擎': 'Default search engine', '地址栏建议': 'Address bar suggestions',
  '搜索建议': 'Search suggestions', '显示常用网站': 'Show common sites',
  '显示收藏夹栏': 'Show bookmarks bar', '下载位置': 'Download location',
  '下载前询问保存位置': 'Ask where to save', '下载完成后打开文件': 'Open file when done',
  '按扩展名自动打开': 'Open by file extension', '跟踪保护等级': 'Tracking protection',
  '自动隐藏 Cookie 横幅': 'Hide cookie banners', 'HTTPS-Only 模式': 'HTTPS-Only mode',
  '加密 DNS（DoH）': 'Encrypted DNS (DoH)', '代理': 'Proxy',
  '退出时清除数据': 'Clear data on exit', '站点权限': 'Site permissions',
  '清除缓存': 'Clear cache', '清除 Cookie': 'Clear cookies',
  '清除网站数据': 'Clear site data', '开机时启动明月': 'Start Mingyue on login',
  '默认浏览器': 'Default browser', '检查更新': 'Check for updates',
  '本地备份': 'Local backup', '可用': 'Available', '后续版本更新': 'Coming in a future version',
  '同步状态': 'Sync status', '未登录': 'Not signed in', '保存位置': 'Save location',
  '下载文件夹': 'Download folder', '浏览数据': 'Browsing data',
  '历史记录': 'History', '书签': 'Bookmarks', '收藏夹': 'Bookmarks',
  '全部书签': 'All bookmarks', '书签栏': 'Bookmarks bar',
  '新建文件夹': 'New folder', '导入': 'Import', '导出': 'Export',
  '批量管理': 'Batch manage', '收藏当前页': 'Bookmark this page',
  '打开文件': 'Open file', '在文件夹中显示': 'Show in folder',
  '暂停下载': 'Pause download', '继续下载': 'Resume download',
  '取消': 'Cancel', '清除已结束': 'Clear finished', '插件': 'Plugins',
  '安装本地扩展': 'Install local extension', '外观与隐私设置': 'Appearance & privacy',
  '广告与跟踪拦截': 'Ad & tracker blocking', '内置插件': 'Built-in',
  '默认开启': 'On by default', '运行中': 'Running', '开发者': 'Developer',
  '关于明月': 'About Mingyue', '恢复默认设置': 'Reset settings',
  '检查泄露': 'Check breach', '密码库为空': 'Password vault is empty',
  '保存新密码': 'Save new password', '编辑密码': 'Edit password',
  '删除密码': 'Delete password', '显示密码': 'Show password',
  '隐藏密码': 'Hide password', '生成随机密码': 'Generate password',
  '自动填充登录表单': 'Autofill login form', '导入 CSV': 'Import CSV',
  '新建标签页': 'New tab', '关闭': 'Close', '最小化': 'Minimize',
  '最大化': 'Maximize', '还原': 'Restore', '固定标签页': 'Pin tab',
  '取消固定': 'Unpin tab', '静音标签页': 'Mute tab', '取消静音': 'Unmute tab',
  '标签组': 'Tab groups', '搜索标签页': 'Search tabs',
  '关闭重复标签页': 'Close duplicate tabs', '阅读模式': 'Reader mode',
  '退出阅读模式': 'Exit reader mode', '机翻': 'Translate page',
  '翻译中': 'Translating', '原文': 'Original', '后退': 'Back',
  '前进': 'Forward', '刷新': 'Reload', '停止': 'Stop', '更多': 'More',
  '新建无痕标签页': 'New private tab', '无痕标签页': 'Private tab',
  '搜索或输入网址': 'Search or enter address', '搜索，或输入网址…': 'Search or enter address…',
  '搜索或访问网站': 'Search or enter address', '新标签页': 'New Tab',
  '必应': 'Bing', '百度': 'Baidu', '谷歌': 'Google',
  '打开历史记录': 'Open history', '打开设置': 'Open settings',
  '打开书签': 'Open bookmarks', '打开下载': 'Open downloads', '打开插件': 'Open plugins',
  '暂无历史记录': 'No history yet', '暂无书签': 'No bookmarks yet',
  '暂无下载': 'No downloads yet', '没有找到相关记录': 'No matching records',
  '没有找到相关书签': 'No matching bookmarks', '没有找到相关文件': 'No matching files',
  '没有找到相关设置': 'No matching settings', '清空搜索': 'Clear search',
  '搜索历史…': 'Search history…', '搜索书签…': 'Search bookmarks…',
  '搜索下载…': 'Search downloads…', '导入书签': 'Import bookmarks',
  '导出书签': 'Export bookmarks', '书签已导出': 'Bookmarks exported',
  '书签 HTML': 'Bookmarks HTML', '管理收藏夹': 'Manage bookmarks',
  '新建标签组，例如：工作': 'New tab group, e.g. Work',
  '还没有标签组': 'No tab groups yet', '关闭标签组': 'Close tab groups',
  '标签组已删除，标签页仍保留': 'Group deleted; tabs remain',
  '整理标签页': 'Organize tabs', '当前窗口': 'Current window',
  '当前标签页': 'Current tab', '应用': 'Apply',
  '翻译失败，请稍后重试': 'Translation failed. Try again later.',
  '页面中没有可翻译的外文内容': 'No translatable foreign text found on this page.',
  '已显示网页原文': 'Showing the original page.', '请先打开一个网页': 'Open a web page first.',
  '当前页面不可用': 'This page is not available.', '页面已发生变化，请重新翻译': 'The page changed. Translate again.',
  '账户体系与端到端加密同步服务尚未启用。当前所有浏览器数据只保存在本机，你也可以在「关于」中导出本地备份。':
    'Account and end-to-end encrypted sync are not enabled yet. Everything stays on this device; you can export a local backup from About.',
  '跨设备同步书签、历史记录、密码与打开的标签页。':
    'Sync bookmarks, history, passwords, and open tabs across devices.',
  '使用 Chromium PDF 查看器打开 PDF；关闭后交给系统应用。':
    'Open PDFs with the built-in viewer; otherwise use the system app.',
  '阻止网页在未经交互时自动播放声音或视频。':
    'Prevent pages from playing sound or video before you interact.',
  '适用于可信文件；关闭时只显示完成提示。':
    'For trusted files only; when off, only show a completion notice.',
  '逗号分隔，例如 pdf, png；留空则不自动打开。':
    'Comma-separated, e.g. pdf, png; leave empty to disable.',
  '让界面更适合你的视觉和使用习惯。':
    'Make the interface easier to see and use.',
  '关闭界面过渡与装饰性动画。': 'Turn off interface transitions and decorative motion.',
  '增强边框、文字与背景之间的反差。': 'Increase contrast between borders, text, and background.',
  '控制地址栏下方的书签栏是否显示。': 'Show or hide the bookmarks bar below the address bar.',
  '在顶部搜索框下方显示一行收藏网站。': 'Show a row of favorite sites below the search box.',
  '调整浏览器界面文字大小，不影响网页缩放。': 'Adjust browser UI text size without zooming web pages.',
  '决定明月下次启动时如何打开标签页。': 'Choose how Mingyue opens tabs on the next launch.',
  '决定标签页与工具栏的排布方式，切换后立即生效。':
    'Choose how tabs and the toolbar are arranged; changes apply immediately.',
  '控制输入网址时显示哪些建议。': 'Choose which suggestions appear while typing an address.',
  '联网获取当前搜索引擎的实时搜索建议。':
    'Fetch live search suggestions from the current search engine.',
  '从地址栏或起始页搜索时使用的搜索引擎。':
    'Search engine used from the address bar and start page.',
  '在起始页底部显示默认书签和快捷入口。':
    'Show default bookmarks and shortcuts at the bottom of the start page.',
  '打开网页后，点击地址栏右侧的星标即可添加书签。':
    'Open a page, then click the star at the right of the address bar to bookmark it.',
  '登录 Windows 后自动启动浏览器。': 'Start the browser automatically after signing in to Windows.',
  '使用系统代理、直连或手动代理规则。': 'Use the system proxy, a direct connection, or manual rules.',
  '访问网站时尽量自动升级到 HTTPS，localhost 除外。':
    'Upgrade sites to HTTPS when possible, except localhost.',
  '使用 Cloudflare DNS over HTTPS 解析域名。': 'Resolve domains with Cloudflare DNS over HTTPS.',
  '关闭浏览器时清理缓存、Cookie 或全部网站数据。':
    'Clear cache, cookies, or all site data when the browser closes.',
  '发送“不跟踪”信号': 'Send a “Do Not Track” signal',
  '发送不跟踪信号': 'Send Do Not Track signal',
  '默认跟随 Windows 系统语言，也可以手动固定一种语言。':
    'Follow the Windows system language by default, or choose a fixed language.',
  '界面文字会立即切换；网页内容、书签标题和网站内容不会被改写。':
    'UI text updates immediately; web content, bookmark titles, and site content are unchanged.',
  '网页机翻按钮会将网页文本翻译为这里选择的目标语言。':
    'The page translation button will translate web text into this target language.',
  '只影响网页机翻，不会改变浏览器界面语言。':
    'Only affects web page translation, not the browser UI language.',
  '让明月更自然地融入桌面环境。': 'Make Mingyue fit naturally into your desktop.',
  '当前页面没有可播放的视频': 'No playable video on this page.',
  '已切换到画中画': 'Switched to picture-in-picture.',
  '当前页面没有可查找的内容': 'Nothing to find on this page.',
  '没有找到匹配项': 'No matches found.', '确定恢复默认设置？': 'Reset all settings?',
  '恢复默认搜索、外观与隐私设置，不会删除书签和历史。':
    'Reset search, appearance, and privacy settings without deleting bookmarks or history.',
  '启动': 'Startup',
  '当前浏览器界面语言：': 'Current browser language: ',
  '当前翻译目标：': 'Current translation target: ',
  '下次启动时还原上次打开的标签页。': 'Restore previous tabs on next launch.',
  '仅影响之后新建的标签页。': 'Only affects newly opened tabs.',
  '本地数据': 'Local data',
  '浏览器设置与浏览记录仅保存在本机。': 'Browser settings and history stay on this device.',
  '原生窗口边框': 'Native window frame',
  '使用 Windows 原生标题栏与窗口边框，窗口控制由系统提供。':
    'Uses the native Windows title bar and window frame, with system window controls.',
  '自绘窗口边框': 'Custom window frame',
  '使用明月自绘标题栏与窗口控制按钮，不使用系统原生标题栏。':
    'Uses Mingyue’s own title bar and window controls instead of the native system title bar.',
  '已启用': 'Enabled',
  '点击主页按钮时打开的页面。留空则返回明月起始页。':
    'Page opened by the Home button. Leave blank for the Mingyue start page.',
  '保存': 'Save', '起始页': 'Start page',
  '新标签页会显示明月起始页。': 'New tabs show the Mingyue start page.',
  '稳定，适合日常': 'Stable for everyday use', '中文内容更丰富': 'Richer Chinese results',
  '全球搜索': 'Global search', '不追踪搜索': 'No tracking',
  '地址栏': 'Address bar', '显示地址栏建议': 'Show address bar suggestions',
  '输入时显示搜索引擎、书签和历史记录建议。':
    'Show search engine, bookmark, and history suggestions while typing.',
  '获取搜索建议': 'Fetch search suggestions', '自定义搜索引擎': 'Custom search engines',
  '添加搜索引擎，或用关键字快速调用，例如 gh electron。':
    'Add an engine or use a keyword shortcut, e.g. gh electron.',
  '还没有自定义搜索引擎。': 'No custom search engines yet.',
  '防护': 'Protection',
  '广告与跟踪拦截由内置插件提供。': 'Ad and tracker blocking is provided by the built-in plugin.',
  '基于 Ghostery 开源过滤引擎，可在插件页面开关。':
    "Powered by Ghostery's open-source engine; toggle it on the Plugins page.",
  '管理插件': 'Manage plugins',
  '向网站发送 DNT 与 GPC 请求头。': 'Send DNT and GPC headers to websites.',
  '严格模式会额外拦截常见第三方跟踪域名。':
    'Strict mode also blocks common third-party tracking domains.',
  '标准': 'Standard', '严格': 'Strict',
  '尝试隐藏常见的 Cookie 同意提示，不代替你作出同意。':
    'Try to hide common cookie prompts; this does not consent for you.',
  '连接安全': 'Connection security',
  '升级连接、加密 DNS 与代理设置。': 'Upgrade connections, encrypted DNS, and proxy settings.',
  '直连': 'Direct', '手动': 'Manual', '不清理': 'Do not clear', '缓存': 'Cache',
  'Cookie 与站点数据': 'Cookies & site data', '全部': 'All',
  '为指定网站允许摄像头、麦克风、定位或通知；未列出的网站默认拒绝。':
    'Allow camera, microphone, location, or notifications for specified sites; others are denied by default.',
  '当前没有网站权限例外。': 'No site permission exceptions.',
  '摄像头': 'Camera', '麦克风': 'Microphone', '定位': 'Location', '通知': 'Notifications',
  '读取剪贴板': 'Read clipboard', '允许': 'Allow', '拒绝': 'Deny',
  '添加例外': 'Add exception',
  '清除当前浏览器会话保存的网站数据。': 'Clear site data saved in the current browser session.',
  '释放图片与网页的本地缓存': 'Release local image and page cache',
  '网站登录状态也会退出': 'You will be signed out of websites',
  '缓存、Cookie 与站点存储': 'Cache, cookies, and site storage',
  '选择界面风格。明月是当前默认风格，经典保留上一版的暖色配色。':
    'Choose an interface style. Mingyue is the default; Classic keeps the previous warm palette.',
  '明月': 'Mingyue', '低饱和月白与松绿，默认': 'Muted moon-white and pine green, default',
  '经典': 'Classic', '上一版的暖色界面': 'Warm interface from the previous version',
  '深色模式会同步调整文字、面板与控件颜色。':
    'Dark mode adjusts text, panels, and control colors.',
  '浅色': 'Light', '深色': 'Dark', '大': 'Large', '特大': 'Extra large',
  '强调色': 'Accent color', '用于按钮、选中状态和细节点缀。':
    'Used for buttons, selected states, and small details.',
  '苔绿': 'Moss green', '暖橙': 'Warm orange', '浅金': 'Pale gold', '绯红': 'Crimson',
  '侧边栏': 'Sidebar',
  '标签竖排在左侧，适合宽屏与多任务': 'Tabs on the left, ideal for wide screens and multitasking',
  '顶部栏': 'Top bar',
  '标签横排在顶部，留给网页更多宽度': 'Tabs across the top, leaving more width for pages',
  '减少标签页占用的空间，适合小屏幕或超多标签。':
    'Save space for small screens or many tabs.',
  '紧凑标签页': 'Compact tabs',
  '降低标签高度，并在侧边栏隐藏域名行。': 'Reduce tab height and hide domains in the sidebar.',
  '关闭多个标签页时提醒': 'Warn when closing multiple tabs',
  '关闭包含多个标签页的窗口前显示确认提示。':
    'Show a confirmation before closing a window with multiple tabs.',
  '下载文件默认保存在指定文件夹中。': 'Downloads are saved in this folder by default.',
  '系统下载文件夹 / Mingyue': 'System Downloads / Mingyue', '更改…': 'Change…',
  '无痕下载': 'Private downloads',
  '无痕标签页中的下载不会出现在普通浏览记录中。':
    'Downloads from private tabs do not appear in normal download history.',
  '每个下载都打开系统保存对话框，而不是直接保存。':
    'Ask for a location with the system dialog instead of saving directly.',
  '关闭无痕标签页时清除下载记录': 'Clear private download history when closing private tabs',
  '同时停止仍在进行的无痕下载。': 'Also stop private downloads still in progress.',
  '视频与媒体': 'Video & media', '控制网页媒体和内置播放器。':
    'Control page media and the built-in player.',
  '自动播放': 'Autoplay', '阻止自动播放': 'Block autoplay', '允许自动播放': 'Allow autoplay',
  '内置 PDF 阅读': 'Built-in PDF viewer', '画中画': 'Picture-in-picture',
  '在网页视频上使用右键菜单或“更多 → 画中画”。':
    'Use the context menu on a video or More → Picture-in-picture.',
  '登录与填充': 'Login & autofill',
  '密码库使用系统安全存储加密，仅保存在本机。':
    'The password vault is encrypted with system secure storage and stays on this device.',
  '启用密码库': 'Enable password vault',
  '保存网站用户名和密码，并在需要时填充。':
    'Save site usernames and passwords and fill them when needed.',
  '在密码库中找到匹配网站时允许一键填充。':
    'Allow one-click filling when a matching site is found.',
  '保存登录信息后，可以在对应网站一键填充。':
    'Save login details to fill them on the matching site.',
  '动作与对比度': 'Motion & contrast',
  '系统集成': 'System integration',
  '在 Windows 设置中将明月设为默认浏览器。': 'Set Mingyue as the default browser in Windows Settings.',
  '打开系统设置': 'Open system settings', '更新': 'Updates',
  '当前为源码运行版本，更新通道需在打包发布后启用。':
    'This is a source build; the update channel is enabled after packaging.',
  '无需账号，浏览记录保存在本机。': 'No account needed; history stays on this device.',
  '作者@此间明月在': 'Author @此间明月在', '版本': 'Version', '平台': 'Platform',
  '导出或恢复书签、历史、设置与搜索引擎配置。':
    'Export or restore bookmarks, history, settings, and search engines.',
  '简体中文': 'Simplified Chinese', '繁體中文': 'Traditional Chinese',
  '日本語': 'Japanese', '跟随系统语言': 'Follow system language',
  '跟随系统': 'Follow system', '界面文字': 'Interface text',
  '设置 · 明月': 'Settings · Mingyue', '新页': 'New page', '标签': 'Tabs',
  '明月浏览器': 'Mingyue Browser', '书签 · 明月': 'Bookmarks · Mingyue',
  '历史记录 · 明月': 'History · Mingyue', '下载内容 · 明月': 'Downloads · Mingyue',
  '插件 · 明月': 'Plugins · Mingyue', '新': 'New', '页面': 'Page',
  '显示左上角图标和软件名': 'Show top-left icon and app name',
  '关闭后左上角的 Logo 与「明月」文字会隐藏，窗口控制仍然保留。':
    'Hide the logo and “Mingyue” text at the top left; window controls remain.',
  '跟踪防护': 'Tracking protection',
  '清除 Cookie 和网站数据': 'Clear cookies and site data',
  '返回主页': 'Back to home',
  '收藏此页': 'Bookmark this page', '在页面中查找': 'Find in page',
  '进入阅读模式': 'Enter reader mode', '回到起始页': 'Go to start page',
  '截取整页': 'Capture full page', '截取区域': 'Capture region',
  '另存为 PDF': 'Save as PDF', '打印页面': 'Print page',
  '开发者工具': 'Developer tools', '页面缩放': 'Page zoom',
  '浏览器数据': 'Browser data', '浏览数据仅保存在本机': 'Browsing data is stored locally',
  '关闭菜单': 'Close menu', '关闭查找': 'Close find'
}

const JAPANESE: Record<string, string> = {
  '常规': '一般', '主页': 'ホーム', '搜索': '検索',
  '隐私与安全': 'プライバシーとセキュリティ', '外观': '外観',
  '标签页': 'タブ', '下载': 'ダウンロード', '媒体与 PDF': 'メディアと PDF',
  '密码与自动填充': 'パスワードと自動入力', '无障碍': 'アクセシビリティ',
  '语言': '言語', '账户与同步': 'アカウントと同期',
  '系统与更新': 'システムと更新', '关于': '概要',
  '扩展与主题': '拡張機能とテーマ', '设置': '設定',
  '启动行为与默认缩放。': '起動時の動作と既定のズーム。',
  '主页地址与起始页内容。': 'ホームページとスタートページの内容。',
  '默认搜索引擎与地址栏建议。': '既定の検索エンジンとアドレスバーの候補。',
  '隐私信号、广告拦截与浏览数据。': 'プライバシー、広告ブロック、閲覧データ。',
  '界面风格、显示模式、字体、书签栏和强调色。': 'テーマ、表示モード、フォント、ブックマークバー、アクセント。',
  '布局方式和标签页密度。': 'レイアウトとタブの密度。',
  '下载位置与无痕下载记录。': '保存先とプライベートダウンロード履歴。',
  '自动播放、画中画与 PDF 阅读。': '自動再生、ピクチャーインピクチャー、PDF。',
  '本地加密密码库与登录填充。': 'ローカル暗号化パスワード保管庫と入力補助。',
  '动画与高对比度。': 'アニメーションとハイコントラスト。',
  '浏览器界面语言与翻译目标语言。': 'ブラウザの表示言語と翻訳先の言語。',
  '跨设备同步能力将在后续版本提供。': 'デバイス間同期は今後のバージョンで提供予定です。',
  '默认浏览器、开机启动与更新状态。': '既定のブラウザ、自動起動、更新状態。',
  '版本信息、备份恢复与恢复默认设置。': 'バージョン、バックアップ、設定のリセット。',
  '在设置中查找': '設定内を検索', '主题': 'テーマ',
  '显示模式': '表示モード', '字体大小': '文字サイズ',
  '浏览器界面': 'ブラウザ表示', '布局风格': 'レイアウト',
  '标签页密度': 'タブ密度', '减少动画': 'アニメーションを減らす',
  '高对比度模式': 'ハイコントラスト', '界面语言': '表示言語',
  '机翻目标语言': '翻訳先の言語', '翻译后语言': '翻訳後の言語',
  '浏览器语言': 'ブラウザの言語', '当前界面语言': '現在の表示言語',
  '当前翻译目标': '現在の翻訳先', '启动行为': '起動時の動作',
  '恢复上次的标签页': '前回のタブを復元', '新建标签页默认缩放': '新しいタブの既定ズーム',
  '默认搜索引擎': '既定の検索エンジン', '地址栏建议': 'アドレスバーの候補',
  '搜索建议': '検索候補', '显示常用网站': 'よく使うサイトを表示',
  '显示收藏夹栏': 'ブックマークバーを表示', '下载位置': '保存先',
  '下载前询问保存位置': '保存先を確認', '下载完成后打开文件': '完了後にファイルを開く',
  '按扩展名自动打开': '拡張子で自動的に開く', '跟踪保护等级': 'トラッキング保護',
  '自动隐藏 Cookie 横幅': 'Cookie バナーを自動非表示', 'HTTPS-Only 模式': 'HTTPS-Only モード',
  '加密 DNS（DoH）': '暗号化 DNS（DoH）', '代理': 'プロキシ',
  '退出时清除数据': '終了時にデータを消去', '站点权限': 'サイトの権限',
  '清除缓存': 'キャッシュを消去', '清除 Cookie': 'Cookie を消去',
  '清除网站数据': 'サイトデータを消去', '开机时启动明月': 'ログイン時に明月を起動',
  '默认浏览器': '既定のブラウザ', '检查更新': 'アップデートを確認',
  '本地备份': 'ローカルバックアップ', '可用': '利用可能', '后续版本更新': '今後のバージョンで提供',
  '同步状态': '同期状態', '未登录': '未ログイン', '保存位置': '保存先',
  '下载文件夹': 'ダウンロードフォルダー', '浏览数据': '閲覧データ',
  '历史记录': '履歴', '书签': 'ブックマーク', '收藏夹': 'ブックマーク',
  '全部书签': 'すべてのブックマーク', '书签栏': 'ブックマークバー',
  '新建文件夹': '新しいフォルダー', '导入': 'インポート', '导出': 'エクスポート',
  '批量管理': '一括管理', '收藏当前页': 'このページをブックマーク',
  '打开文件': 'ファイルを開く', '在文件夹中显示': 'フォルダーで表示',
  '暂停下载': 'ダウンロードを一時停止', '继续下载': 'ダウンロードを再開',
  '取消': 'キャンセル', '清除已结束': '完了済みを消去', '插件': 'プラグイン',
  '安装本地扩展': 'ローカル拡張をインストール', '外观与隐私设置': '外観とプライバシー',
  '广告与跟踪拦截': '広告・トラッカー遮断', '内置插件': '内蔵',
  '默认开启': '既定で有効', '运行中': '実行中', '开发者': '開発者',
  '关于明月': '明月について', '恢复默认设置': '設定をリセット',
  '检查泄露': '漏えいを確認', '密码库为空': 'パスワード保管庫は空です',
  '保存新密码': '新しいパスワードを保存', '编辑密码': 'パスワードを編集',
  '删除密码': 'パスワードを削除', '显示密码': 'パスワードを表示',
  '隐藏密码': 'パスワードを隠す', '生成随机密码': 'ランダムパスワードを生成',
  '自动填充登录表单': 'ログインフォームを自動入力', '导入 CSV': 'CSV をインポート',
  '新建标签页': '新しいタブ', '关闭': '閉じる', '最小化': '最小化',
  '最大化': '最大化', '还原': '元に戻す', '固定标签页': 'タブを固定',
  '取消固定': '固定を解除', '静音标签页': 'タブをミュート', '取消静音': 'ミュート解除',
  '标签组': 'タブグループ', '搜索标签页': 'タブを検索',
  '关闭重复标签页': '重複タブを閉じる', '阅读模式': 'リーダーモード',
  '退出阅读模式': 'リーダーモードを終了', '机翻': 'ページを翻訳',
  '翻译中': '翻訳中', '原文': '原文', '后退': '戻る',
  '前进': '進む', '刷新': '再読み込み', '停止': '停止', '更多': 'その他',
  '新建无痕标签页': '新しいプライベートタブ', '无痕标签页': 'プライベートタブ',
  '搜索或输入网址': '検索または URL を入力', '搜索，或输入网址…': '検索または URL を入力…',
  '搜索或访问网站': '検索または URL を入力', '新标签页': '新しいタブ',
  '必应': 'Bing', '百度': 'Baidu', '谷歌': 'Google',
  '打开历史记录': '履歴を開く', '打开设置': '設定を開く',
  '打开书签': 'ブックマークを開く', '打开下载': 'ダウンロードを開く', '打开插件': 'プラグインを開く',
  '暂无历史记录': '履歴はありません', '暂无书签': 'ブックマークはありません',
  '暂无下载': 'ダウンロードはありません', '没有找到相关记录': '一致する履歴はありません',
  '没有找到相关书签': '一致するブックマークはありません', '没有找到相关文件': '一致するファイルはありません',
  '没有找到相关设置': '一致する設定はありません', '清空搜索': '検索をクリア',
  '搜索历史…': '履歴を検索…', '搜索书签…': 'ブックマークを検索…',
  '搜索下载…': 'ダウンロードを検索…', '导入书签': 'ブックマークをインポート',
  '导出书签': 'ブックマークをエクスポート', '书签已导出': 'ブックマークをエクスポートしました',
  '书签 HTML': 'ブックマーク HTML', '管理收藏夹': 'ブックマークを管理',
  '新建标签组，例如：工作': '新しいタブグループ（例：仕事）',
  '还没有标签组': 'タブグループはまだありません', '关闭标签组': 'タブグループを閉じる',
  '标签组已删除，标签页仍保留': 'グループを削除しました。タブは残っています。',
  '整理标签页': 'タブを整理', '当前窗口': '現在のウィンドウ',
  '当前标签页': '現在のタブ', '应用': '適用',
  '页面中没有可翻译的外文内容': 'このページに翻訳できる外国語はありません。',
  '已显示网页原文': '元のページを表示しています。', '请先打开一个网页': '先に Web ページを開いてください。',
  '当前页面不可用': '現在のページは利用できません。', '页面已发生变化，请重新翻译': 'ページが変更されました。もう一度翻訳してください。',
  '账户体系与端到端加密同步服务尚未启用。当前所有浏览器数据只保存在本机，你也可以在「关于」中导出本地备份。':
    'アカウントとエンドツーエンド暗号化同期はまだ有効ではありません。データはこの端末に保存され、「概要」からローカルバックアップを書き出せます。',
  '跨设备同步书签、历史记录、密码与打开的标签页。':
    'ブックマーク、履歴、パスワード、開いているタブをデバイス間で同期します。',
  '让界面更适合你的视觉和使用习惯。': '見やすく使いやすい表示に調整します。',
  '关闭界面过渡与装饰性动画。': '画面の遷移と装飾アニメーションを無効にします。',
  '增强边框、文字与背景之间的反差。': '枠線、文字、背景のコントラストを強めます。',
  '控制地址栏下方的书签栏是否显示。': 'アドレスバー下のブックマークバーを表示します。',
  '在顶部搜索框下方显示一行收藏网站。': '検索ボックスの下にお気に入りサイトを表示します。',
  '调整浏览器界面文字大小，不影响网页缩放。': 'Web ページのズームを変えずに UI の文字サイズを調整します。',
  '控制输入网址时显示哪些建议。': 'アドレス入力時に表示する候補を設定します。',
  '联网获取当前搜索引擎的实时搜索建议。': '現在の検索エンジンからリアルタイムの候補を取得します。',
  '在起始页底部显示默认书签和快捷入口。': 'スタートページ下部に既定のブックマークとショートカットを表示します。',
  '登录 Windows 后自动启动浏览器。': 'Windows サインイン後にブラウザを自動起動します。',
  '使用系统代理、直连或手动代理规则。': 'システムプロキシ、直接接続、手動設定を使用します。',
  '访问网站时尽量自动升级到 HTTPS，localhost 除外。': 'localhost を除き、可能な場合は HTTPS にアップグレードします。',
  '使用 Cloudflare DNS over HTTPS 解析域名。': 'Cloudflare DNS over HTTPS で名前解決します。',
  '关闭浏览器时清理缓存、Cookie 或全部网站数据。': 'ブラウザ終了時にキャッシュ、Cookie、サイトデータを消去します。',
  '发送“不跟踪”信号': '「Do Not Track」信号を送信',
  '发送不跟踪信号': 'Do Not Track 信号を送信',
  '默认跟随 Windows 系统语言，也可以手动固定一种语言。':
    '既定では Windows のシステム言語に従い、固定することもできます。',
  '界面文字会立即切换；网页内容、书签标题和网站内容不会被改写。':
    'UI の文字はすぐに切り替わります。Web ページやブックマーク名は変更されません。',
  '网页机翻按钮会将网页文本翻译为这里选择的目标语言。':
    'ページ翻訳ボタンは、ここで選んだ言語に Web テキストを翻訳します。',
  '只影响网页机翻，不会改变浏览器界面语言。':
    'Web ページの翻訳だけに影響し、ブラウザ UI の言語は変わりません。',
  '使用 Chromium PDF 查看器打开 PDF；关闭后交给系统应用。':
    'Chromium の PDF ビューアーで開きます。オフの場合はシステムのアプリを使用します。',
  '让明月更自然地融入桌面环境。': '明月をデスクトップになじませます。',
  '当前页面没有可播放的视频': 'このページに再生できる動画はありません。',
  '已切换到画中画': 'ピクチャーインピクチャーに切り替えました。',
  '当前页面没有可查找的内容': 'このページに検索できる内容はありません。',
  '没有找到匹配项': '一致する項目はありません。',
  '确定恢复默认设置？': '設定をリセットしますか？',
  '恢复默认搜索、外观与隐私设置，不会删除书签和历史。':
    'ブックマークと履歴を残したまま、検索・外観・プライバシー設定をリセットします。',
  '启动': '起動',
  '当前浏览器界面语言：': '現在のブラウザ言語：',
  '当前翻译目标：': '現在の翻訳先：',
  '下次启动时还原上次打开的标签页。': '次回起動時に前回のタブを復元します。',
  '仅影响之后新建的标签页。': '新しく開くタブにのみ適用されます。',
  '本地数据': 'ローカルデータ',
  '浏览器设置与浏览记录仅保存在本机。': 'ブラウザ設定と履歴はこの端末にのみ保存されます。',
  '原生窗口边框': 'ネイティブウィンドウ枠',
  '使用 Windows 原生标题栏与窗口边框，窗口控制由系统提供。':
    'Windows 標準のタイトルバーとウィンドウ枠を使用し、操作はシステムに任せます。',
  '自绘窗口边框': '独自ウィンドウ枠',
  '使用明月自绘标题栏与窗口控制按钮，不使用系统原生标题栏。':
    '明月独自のタイトルバーとウィンドウ操作ボタンを使用し、システム標準のタイトルバーは使いません。',
  '已启用': '有効',
  '点击主页按钮时打开的页面。留空则返回明月起始页。':
    'ホームボタンで開くページ。空欄の場合は明月スタートページ。',
  '保存': '保存', '起始页': 'スタートページ',
  '新标签页会显示明月起始页。': '新しいタブに明月スタートページを表示します。',
  '稳定，适合日常': '安定して日常向け', '中文内容更丰富': '中国語の結果が豊富',
  '全球搜索': 'グローバル検索', '不追踪搜索': 'トラッキングなし',
  '地址栏': 'アドレスバー', '显示地址栏建议': 'アドレスバーの候補を表示',
  '输入时显示搜索引擎、书签和历史记录建议。':
    '入力中に検索エンジン、ブックマーク、履歴の候補を表示します。',
  '获取搜索建议': '検索候補を取得', '自定义搜索引擎': 'カスタム検索エンジン',
  '添加搜索引擎，或用关键字快速调用，例如 gh electron。':
    '検索エンジンを追加するか、gh electron のようなキーワードを使用します。',
  '还没有自定义搜索引擎。': 'カスタム検索エンジンはまだありません。',
  '防护': '保護',
  '广告与跟踪拦截由内置插件提供。': '広告・トラッカー遮断は内蔵プラグインが提供します。',
  '基于 Ghostery 开源过滤引擎，可在插件页面开关。':
    'Ghostery のオープンソースエンジンを使用。プラグインページで切り替えます。',
  '管理插件': 'プラグインを管理',
  '向网站发送 DNT 与 GPC 请求头。': 'Web サイトに DNT と GPC ヘッダーを送信します。',
  '严格模式会额外拦截常见第三方跟踪域名。':
    '厳格モードでは一般的なサードパーティ追跡ドメインも遮断します。',
  '标准': '標準', '严格': '厳格',
  '尝试隐藏常见的 Cookie 同意提示，不代替你作出同意。':
    '一般的な Cookie 通知を隠します。同意の代行はしません。',
  '连接安全': '接続の安全性',
  '升级连接、加密 DNS 与代理设置。': '接続のアップグレード、暗号化 DNS、プロキシ設定。',
  '直连': '直接接続', '手动': '手動', '不清理': '消去しない', '缓存': 'キャッシュ',
  'Cookie 与站点数据': 'Cookie とサイトデータ', '全部': 'すべて',
  '为指定网站允许摄像头、麦克风、定位或通知；未列出的网站默认拒绝。':
    '指定したサイトにカメラ、マイク、位置情報、通知を許可します。未指定のサイトは既定で拒否します。',
  '当前没有网站权限例外。': 'サイト権限の例外はありません。',
  '摄像头': 'カメラ', '麦克风': 'マイク', '定位': '位置情報', '通知': '通知',
  '读取剪贴板': 'クリップボードを読み取る', '允许': '許可', '拒绝': '拒否',
  '添加例外': '例外を追加',
  '清除当前浏览器会话保存的网站数据。': '現在のブラウザセッションのサイトデータを消去します。',
  '释放图片与网页的本地缓存': '画像とページのローカルキャッシュを解放',
  '网站登录状态也会退出': 'Web サイトからもログアウトされます',
  '缓存、Cookie 与站点存储': 'キャッシュ、Cookie、サイトストレージ',
  '选择界面风格。明月是当前默认风格，经典保留上一版的暖色配色。':
    'インターフェースのスタイルを選択。明月が既定、クラシックは以前の暖色配色です。',
  '明月': '明月', '低饱和月白与松绿，默认': '低彩度のムーンホワイトとパイングリーン（既定）',
  '经典': 'クラシック', '上一版的暖色界面': '前バージョンの暖色インターフェース',
  '深色模式会同步调整文字、面板与控件颜色。':
    'ダークモードでは文字、パネル、コントロールの色を調整します。',
  '浅色': 'ライト', '深色': 'ダーク', '大': '大', '特大': '特大',
  '强调色': 'アクセントカラー', '用于按钮、选中状态和细节点缀。':
    'ボタン、選択状態、細部に使用します。',
  '苔绿': '苔緑', '暖橙': '暖橙', '浅金': '淡金', '绯红': '緋紅',
  '侧边栏': 'サイドバー',
  '标签竖排在左侧，适合宽屏与多任务': 'タブを左側に縦並び。ワイド画面とマルチタスク向け',
  '顶部栏': 'トップバー',
  '标签横排在顶部，留给网页更多宽度': 'タブを上部に横並び。ページに広い幅を確保',
  '减少标签页占用的空间，适合小屏幕或超多标签。':
    '小さい画面や多数のタブ向けに省スペース化します。',
  '紧凑标签页': 'コンパクトタブ',
  '降低标签高度，并在侧边栏隐藏域名行。': 'タブの高さを下げ、サイドバーのドメイン行を隠します。',
  '关闭多个标签页时提醒': '複数タブを閉じるときに確認',
  '关闭包含多个标签页的窗口前显示确认提示。':
    '複数のタブがあるウィンドウを閉じる前に確認します。',
  '下载文件默认保存在指定文件夹中。': 'ダウンロードは既定でこのフォルダーに保存されます。',
  '系统下载文件夹 / Mingyue': 'システムのダウンロード / Mingyue', '更改…': '変更…',
  '无痕下载': 'プライベートダウンロード',
  '无痕标签页中的下载不会出现在普通浏览记录中。':
    'プライベートタブのダウンロードは通常の履歴に表示されません。',
  '每个下载都打开系统保存对话框，而不是直接保存。':
    '直接保存せず、システムの保存ダイアログを開きます。',
  '关闭无痕标签页时清除下载记录': 'プライベートタブを閉じるときに履歴を消去',
  '同时停止仍在进行的无痕下载。': '進行中のプライベートダウンロードも停止します。',
  '视频与媒体': '動画とメディア', '控制网页媒体和内置播放器。':
    'ページのメディアと内蔵プレーヤーを制御します。',
  '自动播放': '自動再生', '阻止自动播放': '自動再生をブロック', '允许自动播放': '自動再生を許可',
  '内置 PDF 阅读': '内蔵 PDF ビューアー', '画中画': 'ピクチャーインピクチャー',
  '在网页视频上使用右键菜单或“更多 → 画中画”。':
    '動画の右クリックメニュー、または「その他 → ピクチャーインピクチャー」を使用します。',
  '登录与填充': 'ログインと自動入力',
  '密码库使用系统安全存储加密，仅保存在本机。':
    'パスワード保管庫はシステムの安全な保存領域で暗号化され、この端末にのみ保存されます。',
  '启用密码库': 'パスワード保管庫を有効にする',
  '保存网站用户名和密码，并在需要时填充。':
    'サイトのユーザー名とパスワードを保存し、必要時に自動入力します。',
  '在密码库中找到匹配网站时允许一键填充。':
    '一致するサイトが見つかったときのワンクリック入力を許可します。',
  '保存登录信息后，可以在对应网站一键填充。':
    'ログイン情報を保存すると、該当サイトで自動入力できます。',
  '动作与对比度': '動きとコントラスト', '系统集成': 'システム統合',
  '在 Windows 设置中将明月设为默认浏览器。':
    'Windows の設定で明月を既定のブラウザに設定します。',
  '打开系统设置': 'システム設定を開く', '更新': '更新',
  '当前为源码运行版本，更新通道需在打包发布后启用。':
    '現在はソース版です。更新チャネルはパッケージ後に有効になります。',
  '无需账号，浏览记录保存在本机。': 'アカウント不要。履歴はこの端末に保存されます。',
  '作者@此间明月在': '作者 @此间明月在', '版本': 'バージョン', '平台': 'プラットフォーム',
  '导出或恢复书签、历史、设置与搜索引擎配置。':
    'ブックマーク、履歴、設定、検索エンジンをエクスポート／復元します。',
  '简体中文': '簡体字中国語', '繁體中文': '繁体字中国語',
  '日本語': '日本語', '跟随系统语言': 'システム言語に従う',
  '跟随系统': 'システムに従う', '界面文字': '表示文字',
  '设置 · 明月': '設定 · 明月', '新页': '新しいページ', '标签': 'タブ',
  '明月浏览器': '明月ブラウザ', '书签 · 明月': 'ブックマーク · 明月',
  '历史记录 · 明月': '履歴 · 明月', '下载内容 · 明月': 'ダウンロード · 明月',
  '插件 · 明月': 'プラグイン · 明月', '新': '新規', '页面': 'ページ',
  '显示左上角图标和软件名': '左上のアイコンとアプリ名を表示',
  '关闭后左上角的 Logo 与「明月」文字会隐藏，窗口控制仍然保留。':
    'オフにすると左上のロゴと「明月」を隠します。ウィンドウ操作は残ります。',
  '跟踪防护': 'トラッキング保護',
  '清除 Cookie 和网站数据': 'Cookie とサイトデータを消去',
  '返回主页': 'ホームへ戻る',
  '收藏此页': 'このページをブックマーク', '在页面中查找': 'ページ内を検索',
  '进入阅读模式': 'リーダーモードを開く', '回到起始页': 'スタートページへ',
  '截取整页': 'ページ全体をキャプチャ', '截取区域': '範囲をキャプチャ',
  '另存为 PDF': 'PDF として保存', '打印页面': 'ページを印刷',
  '开发者工具': '開発者ツール', '页面缩放': 'ページズーム',
  '浏览器数据': 'ブラウザデータ', '浏览数据仅保存在本机': '閲覧データはこの端末に保存されます',
  '关闭菜单': 'メニューを閉じる', '关闭查找': '検索を閉じる'
}

const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAYS_JA = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']

export function resolveUiLocale(value: string | undefined): UiLocale {
  const tag = (value || 'zh-CN').toLowerCase()
  if (tag.startsWith('zh')) {
    return /(tw|hk|mo|hant)/.test(tag) ? 'zh-TW' : 'zh-CN'
  }
  if (tag.startsWith('ja')) return 'ja'
  if (tag.startsWith('en')) return 'en'
  return 'zh-CN'
}

export function localeLabel(locale: UiLocale): string {
  if (locale === 'zh-CN') return '简体中文'
  if (locale === 'zh-TW') return '繁體中文'
  if (locale === 'en') return 'English'
  return '日本語'
}

export function toTraditional(text: string): string {
  return Array.from(text)
    .map((char) => TRADITIONAL_MAP[char] || char)
    .join('')
}

function translateDynamic(text: string, locale: 'en' | 'ja'): string | null {
  const targetName = (value: string): string => {
    if (locale === 'en') {
      return value === '繁體中文'
        ? 'Traditional Chinese'
        : value === 'English'
          ? 'English'
          : value === '日本語'
            ? 'Japanese'
            : 'Simplified Chinese'
    }
    return value === '繁體中文'
      ? '繁体字中国語'
      : value === 'English'
        ? '英語'
        : value === '日本語'
          ? '日本語'
          : '簡体字中国語'
  }
  let match = text.match(/^将当前网页机器翻译为(.+)$/)
  if (match) {
    return locale === 'en'
      ? `Translate this page into ${targetName(match[1])}`
      : `このページを${targetName(match[1])}に翻訳`
  }
  match = text.match(/^机翻当前网页为(.+)$/)
  if (match) {
    return locale === 'en'
      ? `Translate page into ${targetName(match[1])}`
      : `ページを${targetName(match[1])}に翻訳`
  }
  match = text.match(/^已拦截 (\d+) 个请求$/)
  if (match) {
    return locale === 'en' ? `Blocked ${match[1]} requests` : `${match[1]} 件のリクエストを遮断`
  }
  match = text.match(/^已处理 (\d+) 个请求$/)
  if (match) {
    return locale === 'en' ? `Handled ${match[1]} requests` : `${match[1]} 件のリクエストを処理`
  }
  match = text.match(/^(\d+) 个书签，包含文件夹与书签栏，保存在本机。$/)
  if (match) {
    return locale === 'en'
      ? `${match[1]} bookmarks, including folders and the bookmarks bar, saved locally.`
      : `ブックマーク ${match[1]} 件（フォルダーとブックマークバーを含む）をローカルに保存しています。`
  }
  match = text.match(/^(\d+) 个书签，保存在本机。$/)
  if (match) {
    return locale === 'en' ? `${match[1]} bookmarks saved locally.` : `ブックマーク ${match[1]} 件をローカルに保存しています。`
  }
  match = text.match(/^(\d+) 个文件，(\d+) 个正在进行$/)
  if (match) {
    return locale === 'en'
      ? `${match[1]} files, ${match[2]} in progress`
      : `${match[1]} ファイル、${match[2]} 件進行中`
  }
  match = text.match(/^已选 (\d+) 项$/)
  if (match) return locale === 'en' ? `${match[1]} selected` : `${match[1]} 件選択中`
  match = text.match(/^(\d+) 个标签$/)
  if (match) return locale === 'en' ? `${match[1]} tabs` : `${match[1]} 個のタブ`
  match = text.match(/^已机翻 (\d+) 处文本$/)
  if (match) return locale === 'en' ? `Translated ${match[1]} passages` : `${match[1]} 箇所を翻訳しました`
  match = text.match(/^已机翻 (\d+) 处文本；页面较长，仅翻译了前部内容$/)
  if (match) {
    return locale === 'en'
      ? `Translated ${match[1]} passages; the page is long, so only the beginning was translated.`
      : `${match[1]} 箇所を翻訳しました。ページが長いため前半のみ翻訳しました。`
  }
  match = text.match(/^跟随系统语言（(.+)）$/)
  if (match) return locale === 'en' ? `Follow system (${match[1]})` : `システムに従う（${match[1]}）`
  match = text.match(/^跟随系统（(.+)）$/)
  if (match) return locale === 'en' ? `Follow system (${match[1]})` : `システムに従う（${match[1]}）`
  match = text.match(/^(\d+)月(\d+)日 · (星期[一二三四五六日])$/)
  if (match) {
    const day = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'].indexOf(match[3])
    return locale === 'en'
      ? `${match[1]}/${match[2]} · ${WEEKDAYS_EN[day]}`
      : `${match[1]}月${match[2]}日 · ${WEEKDAYS_JA[day]}`
  }
  return null
}

export function translateUiText(text: string, locale: UiLocale): string {
  if (locale === 'zh-CN') return text
  if (locale === 'zh-TW') return toTraditional(text)
  const dynamic = translateDynamic(text, locale)
  if (dynamic) return dynamic
  const dictionary = locale === 'en' ? ENGLISH : JAPANESE
  return dictionary[text] || text
}

interface TextState {
  original: string
  last: string
}

interface AttrState {
  original: string
  last: string
}

const textStates = new WeakMap<Text, TextState>()
const attrStates = new WeakMap<Element, Record<string, AttrState>>()
const knownTexts = new Set<Text>()
const knownAttrs = new Set<Element>()
const SKIP_SELECTOR =
  'script,style,noscript,textarea,code,pre,.webview,[data-i18n-ignore],[contenteditable="true"]'

function translateOneText(node: Text, locale: UiLocale): void {
  const value = node.nodeValue || ''
  if (!value.trim()) return
  let state = textStates.get(node)
  if (!state) {
    state = { original: value, last: value }
    textStates.set(node, state)
    knownTexts.add(node)
  } else if (value !== state.last && value !== state.original) {
    state.original = value
  }
  if (locale === 'zh-CN') {
    if (value !== state.original) node.nodeValue = state.original
    state.last = state.original
    return
  }
  const core = state.original.trim()
  const start = state.original.indexOf(core)
  const translated = translateUiText(core, locale)
  const next = state.original.slice(0, start) + translated + state.original.slice(start + core.length)
  state.last = next
  if (value !== next) node.nodeValue = next
}

function translateOneAttr(element: Element, name: string, locale: UiLocale): void {
  const value = element.getAttribute(name)
  if (!value || !value.trim()) return
  let states = attrStates.get(element)
  if (!states) {
    states = {}
    attrStates.set(element, states)
    knownAttrs.add(element)
  }
  let state = states[name]
  if (!state) {
    state = { original: value, last: value }
    states[name] = state
  } else if (value !== state.last && value !== state.original) {
    state.original = value
  }
  if (locale === 'zh-CN') {
    if (value !== state.original) element.setAttribute(name, state.original)
    state.last = state.original
    return
  }
  const next = translateUiText(state.original.trim(), locale)
  state.last = next
  if (value !== next) element.setAttribute(name, next)
}

export function useUiLocalization(locale: UiLocale): void {
  useEffect(() => {
    document.documentElement.lang = locale
    if (locale === 'zh-CN') {
      for (const node of knownTexts) {
        const state = textStates.get(node)
        if (state && node.isConnected) node.nodeValue = state.original
      }
      for (const element of knownAttrs) {
        const states = attrStates.get(element)
        if (!states) continue
        for (const [name, state] of Object.entries(states)) {
          if (element.isConnected) element.setAttribute(name, state.original)
        }
      }
      return
    }

    const root = document.getElementById('root') || document.body
    const apply = (): void => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        const parent = node.parentElement
        if (!parent || parent.closest(SKIP_SELECTOR)) continue
        translateOneText(node as Text, locale)
      }
      for (const element of root.querySelectorAll('[title],[placeholder],[aria-label]')) {
        translateOneAttr(element, 'title', locale)
        translateOneAttr(element, 'placeholder', locale)
        translateOneAttr(element, 'aria-label', locale)
      }
    }

    apply()
    let frame = 0
    const observer = new MutationObserver(() => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        apply()
      })
    })
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'placeholder', 'aria-label']
    })
    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      for (const node of knownTexts) {
        const state = textStates.get(node)
        if (state && node.isConnected) node.nodeValue = state.original
      }
      for (const element of knownAttrs) {
        const states = attrStates.get(element)
        if (!states) continue
        for (const [name, state] of Object.entries(states)) {
          if (element.isConnected) element.setAttribute(name, state.original)
        }
      }
    }
  }, [locale])
}

export const UI_LANGUAGE_OPTIONS: Array<{ value: UiLanguage; label: string }> = [
  { value: 'system', label: '跟随系统语言' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' }
]

export const TRANSLATION_TARGET_OPTIONS: Array<{
  value: TranslationTarget
  label: string
}> = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' }
]
