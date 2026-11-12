const path = require('node:path')
const fs = require('node:fs')
const rcedit = require('rcedit')

module.exports = async function afterPack(context) {
  const appOutDir = context.appOutDir
  const exe = fs
    .readdirSync(appOutDir)
    .find((name) => name.toLowerCase().endsWith('.exe'))
  if (!exe) return
  const exePath = path.join(appOutDir, exe)
  const projectDir = context.packager.projectDir
  const icon = path.join(projectDir, 'resources', 'icon.ico')
  await rcedit(exePath, {
    'file-version': '1.0.1.0',
    'product-version': '1.0.1',
    'version-string': {
      CompanyName: 'Mingyue',
      FileDescription: '明月浏览器',
      ProductName: '明月浏览器',
      OriginalFilename: exe
    },
    icon,
    'requested-execution-level': 'asInvoker'
  })
  console.log(`  • branded ${exe} as 明月浏览器 1.0.1`)
}
