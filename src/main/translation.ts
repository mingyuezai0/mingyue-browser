import type { TranslationResponse, TranslationTarget } from '../shared/types'

const DEFAULT_TARGET: TranslationTarget = 'zh-CN'
const MAX_REQUEST_CHARS = 420
const MAX_TOTAL_CHARS = 5_500
const MAX_CONCURRENT_REQUESTS = 3
const CACHE_LIMIT = 600

const cache = new Map<string, string>()

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
}

function splitIntoChunks(text: string): string[] {
  if (text.length <= MAX_REQUEST_CHARS) return [text]
  const chunks: string[] = []
  let cursor = 0
  while (cursor < text.length) {
    let end = Math.min(text.length, cursor + MAX_REQUEST_CHARS)
    if (end < text.length) {
      const window = text.slice(cursor, end)
      const breakpoint = Math.max(
        window.lastIndexOf('. '),
        window.lastIndexOf('。'),
        window.lastIndexOf('! '),
        window.lastIndexOf('? '),
        window.lastIndexOf(' '),
        window.lastIndexOf('\n')
      )
      if (breakpoint > 180) end = cursor + breakpoint + 1
    }
    chunks.push(text.slice(cursor, end))
    cursor = end
  }
  return chunks
}

function myMemoryLanguage(target: TranslationTarget): string {
  if (target === 'en') return 'en-GB'
  if (target === 'ja') return 'ja-JP'
  return target
}

async function translateWithMyMemory(
  text: string,
  target: TranslationTarget
): Promise<string> {
  const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${encodeURIComponent(`autodetect|${myMemoryLanguage(target)}`)}`
  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(20_000),
    headers: { Accept: 'application/json' }
  })
  if (!response.ok) {
    throw new Error(`MyMemory 返回 ${response.status}`)
  }
  const payload = (await response.json()) as {
    responseStatus?: number
    responseData?: { translatedText?: string }
    quotaFinished?: boolean
  }
  if (payload.quotaFinished) throw new Error('翻译服务今日额度已用完')
  if (payload.responseStatus !== 200 || !payload.responseData?.translatedText) {
    throw new Error('翻译服务没有返回结果')
  }
  return decodeHtmlEntities(payload.responseData.translatedText)
}

async function translateWithGoogle(
  text: string,
  target: TranslationTarget
): Promise<string> {
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(
    text
  )}`
  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(20_000)
  })
  if (!response.ok) throw new Error(`Google 翻译返回 ${response.status}`)
  const payload = (await response.json()) as unknown
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    throw new Error('Google 翻译没有返回结果')
  }
  const translated = (payload[0] as unknown[])
    .map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
    .join('')
  if (!translated.trim()) throw new Error('Google 翻译没有返回结果')
  return translated
}

async function translateChunk(
  text: string,
  target: TranslationTarget
): Promise<{ text: string; provider: string }> {
  const cacheKey = `${target}\u0000${text}`
  const cached = cache.get(cacheKey)
  if (cached) return { text: cached, provider: '缓存' }

  let provider = 'MyMemory'
  let translated: string
  try {
    translated = await translateWithMyMemory(text, target)
  } catch {
    provider = 'Google'
    translated = await translateWithGoogle(text, target)
  }

  cache.set(cacheKey, translated)
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  return { text: translated, provider }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor
        cursor += 1
        results[index] = await worker(items[index], index)
      }
    }
  )
  await Promise.all(workers)
  return results
}

export async function translateTexts(
  texts: string[],
  target: TranslationTarget = DEFAULT_TARGET
): Promise<TranslationResponse> {
  const cleaned = texts
    .map((text) => text.replace(/\u0000/g, '').trim())
    .filter((text) => text.length > 0)

  if (cleaned.length === 0) {
    return { translations: [], provider: 'MyMemory' }
  }

  if (cleaned.length > 300) {
    throw new Error('当前页面文本过多，请刷新后重试')
  }

  let total = 0
  for (const text of cleaned) {
    total += text.length
    if (total > MAX_TOTAL_CHARS) {
      throw new Error('当前页面文本过长，暂时无法一次完成翻译')
    }
  }

  const chunksByText = cleaned.map((text) => splitIntoChunks(text))
  const chunks = chunksByText.flat()
  const results = await runWithConcurrency(
    chunks,
    MAX_CONCURRENT_REQUESTS,
    (chunk) => translateChunk(chunk, target)
  )

  let cursor = 0
  const providers = new Set<string>()
  const translations = chunksByText.map((textChunks) => {
    const translated = textChunks
      .map(() => {
        const result = results[cursor]
        cursor += 1
        providers.add(result.provider)
        return result.text
      })
      .join('')
    return translated
  })

  return {
    translations,
    provider: Array.from(providers).join(' / ')
  }
}
