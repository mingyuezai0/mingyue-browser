import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mingyue.browser',
  appName: '明月浏览器',
  webDir: 'out/renderer',
  android: {
    allowMixedContent: true
  }
}

export default config
