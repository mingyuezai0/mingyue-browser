import { app, safeStorage } from 'electron'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { PasswordBreachResult, PasswordRecord } from '../shared/types'

function vaultPath(): string {
  return join(app.getPath('userData'), 'passwords', 'vault.bin')
}

function readVault(): PasswordRecord[] {
  try {
    if (!existsSync(vaultPath())) return []
    const raw = readFileSync(vaultPath())
    const text = raw.subarray(0, 8).toString('utf8') === 'MYPASS01'
      ? safeStorage.decryptString(raw.subarray(8))
      : Buffer.from(raw.toString('utf8'), 'base64').toString('utf8')
    const parsed = JSON.parse(text) as PasswordRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeVault(entries: PasswordRecord[]): void {
  const dir = dirname(vaultPath())
  mkdirSync(dir, { recursive: true })
  const text = JSON.stringify(entries)
  const payload = safeStorage.isEncryptionAvailable()
    ? Buffer.concat([
        Buffer.from('MYPASS01', 'utf8'),
        safeStorage.encryptString(text)
      ])
    : Buffer.from(Buffer.from(text, 'utf8').toString('base64'), 'utf8')
  writeFileSync(vaultPath(), payload)
}

function normalizeEntry(entry: PasswordRecord): PasswordRecord {
  const now = Date.now()
  return {
    id: entry.id || crypto.randomUUID(),
    title: String(entry.title || entry.url || '未命名密码'),
    url: String(entry.url || ''),
    username: String(entry.username || ''),
    password: String(entry.password || ''),
    notes: entry.notes ? String(entry.notes) : '',
    createdAt: Number(entry.createdAt) || now,
    updatedAt: now
  }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      fields.push(current)
      current = ''
    } else {
      current += character
    }
  }
  fields.push(current)
  return fields
}

export const passwordStore = {
  list(): PasswordRecord[] {
    return readVault()
  },

  save(entry: PasswordRecord): PasswordRecord[] {
    const entries = readVault()
    const normalized = normalizeEntry(entry)
    const existing = entries.findIndex((item) => item.id === normalized.id)
    if (existing >= 0) {
      normalized.createdAt = entries[existing].createdAt
      entries[existing] = normalized
    } else {
      entries.unshift(normalized)
    }
    writeVault(entries)
    return entries
  },

  remove(id: string): PasswordRecord[] {
    const entries = readVault().filter((entry) => entry.id !== id)
    writeVault(entries)
    return entries
  },

  importCsv(csv: string): PasswordRecord[] {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length === 0) return readVault()
    const header = parseCsvLine(lines[0]).map((field) => field.toLowerCase())
    const hasHeader = header.some((field) =>
      ['name', 'title', 'url', 'username', 'password', 'login'].includes(field)
    )
    const indexOf = (...names: string[]): number =>
      names.reduce((found, name) => (found >= 0 ? found : header.indexOf(name)), -1)
    const titleIndex = indexOf('name', 'title')
    const urlIndex = indexOf('url', 'website', 'login')
    const usernameIndex = indexOf('username', 'login', 'user')
    const passwordIndex = indexOf('password', 'pass')
    const notesIndex = indexOf('notes', 'note')
    const entries = readVault()
    for (const line of lines.slice(hasHeader ? 1 : 0)) {
      const fields = parseCsvLine(line)
      const url = urlIndex >= 0 ? fields[urlIndex] : fields[0]
      const username = usernameIndex >= 0 ? fields[usernameIndex] : fields[1]
      const password = passwordIndex >= 0 ? fields[passwordIndex] : fields[2]
      if (!url && !username && !password) continue
      entries.unshift(
        normalizeEntry({
          id: crypto.randomUUID(),
          title:
            (titleIndex >= 0 ? fields[titleIndex] : '') ||
            username ||
            url ||
            '导入的密码',
          url,
          username,
          password,
          notes: notesIndex >= 0 ? fields[notesIndex] : '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      )
    }
    writeVault(entries)
    return entries
  },

  async checkBreach(password: string): Promise<PasswordBreachResult> {
    if (!password) {
      return { checked: false, count: 0, message: '密码为空' }
    }
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = sha1.slice(0, 5)
    const suffix = sha1.slice(5)
    try {
      const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        { signal: AbortSignal.timeout(12_000) }
      )
      if (!response.ok) {
        return {
          checked: false,
          count: 0,
          message: '泄露数据库暂时不可用'
        }
      }
      const body = await response.text()
      const match = body
        .split(/\r?\n/)
        .map((line) => line.split(':'))
        .find(([hashSuffix]) => hashSuffix?.trim() === suffix)
      const count = match ? Number(match[1].trim()) : 0
      return {
        checked: true,
        count,
        message: count
          ? `发现于 ${count.toLocaleString()} 次公开泄露记录`
          : '未在已知泄露记录中找到'
      }
    } catch {
      return {
        checked: false,
        count: 0,
        message: '无法连接泄露检查服务'
      }
    }
  }
}
