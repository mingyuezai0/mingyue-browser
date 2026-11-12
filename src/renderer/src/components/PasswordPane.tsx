import { useState } from 'react'
import {
  Check,
  ClipboardPaste,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import type {
  PasswordBreachResult,
  PasswordRecord
} from '../../../shared/types'
import { getHostname } from '../lib/search'

const GENERATOR_CHARS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'

function generatePassword(length = 18): string {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => GENERATOR_CHARS[value % GENERATOR_CHARS.length]).join('')
}

function blankEntry(): PasswordRecord {
  return {
    id: crypto.randomUUID(),
    title: '',
    url: '',
    username: '',
    password: '',
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

export function PasswordPane({
  passwords,
  activeUrl,
  onSave,
  onDelete,
  onImport,
  onAutofill,
  onCheckBreach
}: {
  passwords: PasswordRecord[]
  activeUrl: string
  onSave: (entry: PasswordRecord) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onImport: () => Promise<void>
  onAutofill: (entry: PasswordRecord) => Promise<boolean>
  onCheckBreach: (password: string) => Promise<PasswordBreachResult>
}): React.ReactElement {
  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<PasswordRecord>(blankEntry)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [breach, setBreach] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)

  const openNew = (): void => {
    setDraft(blankEntry())
    setFormOpen(true)
  }

  const edit = (entry: PasswordRecord): void => {
    setDraft({ ...entry })
    setFormOpen(true)
  }

  const submit = async (): Promise<void> => {
    if (!draft.password.trim()) return
    setBusy(true)
    try {
      await onSave({
        ...draft,
        title:
          draft.title.trim() ||
          (draft.url ? getHostname(draft.url) : '未命名密码'),
        updatedAt: Date.now()
      })
      setFormOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const toggleReveal = (id: string): void => {
    setRevealed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const check = async (entry: PasswordRecord): Promise<void> => {
    setCheckingId(entry.id)
    try {
      const result = await onCheckBreach(entry.password)
      setBreach((current) => ({ ...current, [entry.id]: result.message }))
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <div className="password-pane">
      <div className="password-pane-actions">
        <button type="button" className="primary-button" onClick={openNew}>
          <Plus size={15} /> 添加密码
        </button>
        <button type="button" className="secondary-button" onClick={() => void onImport()}>
          <Upload size={15} /> 导入 CSV
        </button>
        <span className="password-security-note">
          <KeyRound size={13} /> 使用系统安全存储加密保存
        </span>
      </div>

      {formOpen && (
        <form
          className="password-form"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <div className="password-form-head">
            <strong>{passwords.some((item) => item.id === draft.id) ? '编辑密码' : '保存新密码'}</strong>
            <button type="button" onClick={() => setFormOpen(false)} aria-label="关闭">
              <X size={16} />
            </button>
          </div>
          <div className="password-form-grid">
            <label>
              网站地址
              <input
                value={draft.url}
                onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                placeholder="https://example.com"
                spellCheck={false}
              />
            </label>
            <label>
              名称
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="例如：GitHub"
              />
            </label>
            <label>
              用户名
              <input
                value={draft.username}
                onChange={(event) => setDraft({ ...draft, username: event.target.value })}
                autoComplete="off"
              />
            </label>
            <label>
              密码
              <div className="password-field">
                <input
                  type="text"
                  value={draft.password}
                  onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  title="生成随机密码"
                  onClick={() => setDraft({ ...draft, password: generatePassword() })}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </label>
            <label className="password-form-wide">
              备注
              <input
                value={draft.notes ?? ''}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                placeholder="可选"
              />
            </label>
          </div>
          <div className="password-form-actions">
            <button type="button" className="text-button" onClick={() => setFormOpen(false)}>
              取消
            </button>
            <button type="submit" className="primary-button" disabled={busy || !draft.password.trim()}>
              <Check size={15} /> 保存密码
            </button>
          </div>
        </form>
      )}

      {passwords.length === 0 ? (
        <div className="password-empty">
          <KeyRound size={28} />
          <strong>密码库为空</strong>
          <p>保存登录信息后，可以在对应网站一键填充。</p>
        </div>
      ) : (
        <div className="password-list">
          {passwords.map((entry) => {
            const visible = revealed.has(entry.id)
            return (
              <article className="password-card" key={entry.id}>
                <div className="password-card-head">
                  <span className="password-card-icon"><KeyRound size={18} /></span>
                  <div>
                    <strong>{entry.title}</strong>
                    <small>{entry.url ? getHostname(entry.url) : '未填写网站'}</small>
                  </div>
                  <button
                    type="button"
                    className="password-fill"
                    disabled={!activeUrl}
                    onClick={() => void onAutofill(entry)}
                  >
                    <ClipboardPaste size={13} /> 填充当前页
                  </button>
                  <button
                    type="button"
                    className="password-icon-button"
                    aria-label={visible ? '隐藏密码' : '显示密码'}
                    onClick={() => toggleReveal(entry.id)}
                  >
                    {visible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    type="button"
                    className="password-icon-button"
                    aria-label="删除密码"
                    onClick={() => void onDelete(entry.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="password-card-body">
                  <span>{entry.username || '未填写用户名'}</span>
                  <code>{visible ? entry.password : '••••••••••••'}</code>
                  <button type="button" className="text-button" onClick={() => edit(entry)}>
                    编辑
                  </button>
                  <button
                    type="button"
                    className="text-button password-breach-button"
                    disabled={checkingId === entry.id}
                    onClick={() => void check(entry)}
                  >
                    <ShieldAlert size={12} />
                    {checkingId === entry.id ? '检查中…' : '检查泄露'}
                  </button>
                  {breach[entry.id] && (
                    <small className="password-breach-result">{breach[entry.id]}</small>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
