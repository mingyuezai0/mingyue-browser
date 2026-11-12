import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Some IDE / automation terminals launch Electron with this variable set,
// which turns the runtime into plain Node.js. Always clear it for the app.
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
delete env.ELECTRON_NO_ATTACH_CONSOLE

const action = process.argv[2] ?? 'dev'
const extraArgs = process.argv.slice(3)
const cli = resolve('node_modules/electron-vite/bin/electron-vite.js')

if (!existsSync(cli)) {
  console.error('找不到 electron-vite，请先运行 npm install。')
  process.exit(1)
}

const child = spawn(process.execPath, [cli, action, ...extraArgs], {
  stdio: 'inherit',
  env,
  windowsHide: false
})

const forward = (signal) => {
  if (!child.killed) child.kill(signal)
}
process.on('SIGINT', () => forward('SIGINT'))
process.on('SIGTERM', () => forward('SIGTERM'))

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
