# 明月浏览器插件接口 v1

插件运行在 Electron 主进程。插件可以同步检查网络请求，也可以向匹配的网页注入脚本。插件启停状态与拦截计数会显示在「插件」页面。

## 接口

```ts
import type {
  MingyuePlugin,
  PluginContentScript,
  PluginHost,
  PluginManifest,
  PluginRequestContext,
  PluginRequestDecision
} from '../src/main/plugins/api'

const plugin: MingyuePlugin = {
  manifest: {
    id: 'my-plugin',
    name: '示例插件',
    version: '1.0.0',
    description: '一句话说明插件用途。',
    author: 'Your Name',
    license: 'MIT',
    builtin: false,
    defaultEnabled: false
  },

  activate(host: PluginHost) {
    // 同步请求钩子：返回 cancel 或 redirectURL。
    host.registerRequestHook(
      ({ details }: PluginRequestContext): PluginRequestDecision | void => {
        if (details.url.includes('example.com/tracker')) {
          host.reportBlocked()
          return { cancel: true }
        }
      }
    )

    // DOM 就绪后向匹配页面注入脚本。
    host.registerContentScript({
      matches: ['https://example.com/*'],
      code: `document.documentElement.dataset.examplePlugin = 'active'`
    })
  },

  deactivate() {
    // 可选：清理插件自己的计时器或外部连接。
  }
}
```

插件管理器会自动撤销通过 `PluginHost` 注册的请求钩子和页面脚本。插件自己创建的计时器、外部连接等资源，应在 `deactivate()` 中清理。

## 注册

在 `src/main/plugins/registry.ts` 中导入并加入数组：

```ts
import { myPlugin } from './my-plugin'

export const builtinPlugins: MingyuePlugin[] = [
  adblockPlugin,
  myPlugin
]
```

重新启动应用后，插件会出现在「插件」页面，并按 `manifest.defaultEnabled` 初始化。用户的启停选择会持久化到 `%APPDATA%\mingyue-browser\plugins\preferences.json`。

## PluginHost

| 方法 | 说明 |
| --- | --- |
| `registerRequestHook(hook)` | 注册同步请求钩子；支持 `cancel` 与 `redirectURL`。返回取消注册函数。 |
| `registerContentScript(script)` | 在匹配 URL 的页面 DOM 就绪后执行脚本。`matches` 支持 `*` 通配符。返回取消注册函数。 |
| `reportBlocked(count?)` | 记录一次或多次拦截，更新插件计数。 |
| `setDetail(text)` | 在插件卡片中显示运行状态或规则说明。 |

## 约束

- 请求钩子必须是同步函数，以匹配 Electron `webRequest` 的回调模型。需要异步数据时，应在 `activate` 阶段预加载。
- 插件是受信任的主进程代码；当前不支持从未知来源自动安装插件。
- 广告拦截插件采用网络请求过滤；需要元素隐藏的插件可通过 `registerContentScript` 自行注入样式或 DOM 处理。
- 主进程中的插件应避免阻塞导航、收集浏览数据或绕过应用的权限策略。

## 内置插件

`adblock.ts` 是完整示例：它通过 GitHub 开源项目 Ghostery Adblocker 的过滤引擎检查请求，并使用 `reportBlocked()` 更新界面计数。

## 本地扩展格式

插件页面的「安装本地扩展」可以加载一个目录中的 `plugin.json`。目录结构：

```text
my-extension/
  plugin.json
  content.js
```

`plugin.json` 示例：

```json
{
  "id": "my-extension",
  "name": "示例本地扩展",
  "version": "1.0.0",
  "description": "一句话说明扩展用途。",
  "author": "Your Name",
  "license": "MIT",
  "defaultEnabled": true,
  "matches": ["https://example.com/*"],
  "contentScript": "content.js",
  "blockHosts": ["ads.example.com"]
}
```

本地扩展支持两类能力：

- `contentScript`：在匹配 URL 的页面 DOM 就绪后执行。
- `blockHosts`：按域名拦截网络请求并计入拦截统计。

扩展文件会复制到 `%APPDATA%\mingyue-browser\extensions\<id>`。本地扩展仍然运行在页面的沙箱环境中，不应尝试访问主进程或 Node.js API。
