import type { TranslationTarget } from '../../../shared/types'

export interface TranslationExtraction {
  texts: string[]
  candidateCount: number
  truncated: boolean
  alreadyTranslated: boolean
}

export interface TranslationApplication {
  applied: number
  total: number
}

const EXCLUDED_SELECTOR =
  'script, style, noscript, code, pre, textarea, input, select, option, svg, canvas, [contenteditable="true"], [translate="no"], .notranslate, [aria-hidden="true"]'

/**
 * Runs inside the guest page. It collects visible text nodes that contain
 * non-Chinese language characters while preserving each node's surrounding
 * whitespace and original value for restoration.
 */
export const EXTRACT_PAGE_TEXT_SCRIPT = String.raw`
(() => {
  const existing = window.__mingyueTranslateState;
  if (existing) {
    return {
      texts: existing.uniqueTexts,
      candidateCount: existing.candidateCount,
      truncated: existing.truncated,
      alreadyTranslated: existing.translated
    };
  }

  if (!document.body) {
    return { texts: [], candidateCount: 0, truncated: false, alreadyTranslated: false };
  }

  const MAX_NODES = 220;
  const MAX_CHARS = 5000;
  const eligibleChars = /[A-Za-z\u00C0-\u024F\u0400-\u04FF\u3040-\u30FF\uAC00-\uD7AF]/;
  const excludedSelector = ${JSON.stringify(EXCLUDED_SELECTOR)};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  const uniqueTexts = [];
  const indexByText = new Map();
  let candidateCount = 0;
  let usedChars = 0;
  let truncated = false;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent) continue;

    const original = node.nodeValue || '';
    const core = original.trim();
    if (core.length < 2 || !eligibleChars.test(core)) continue;
    if (parent.closest(excludedSelector)) continue;

    const style = getComputedStyle(parent);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      parent.getClientRects().length === 0
    ) {
      continue;
    }

    candidateCount += 1;
    if (nodes.length >= MAX_NODES || usedChars + core.length > MAX_CHARS) {
      truncated = true;
      continue;
    }

    let uniqueIndex = indexByText.get(core);
    if (uniqueIndex === undefined) {
      uniqueIndex = uniqueTexts.length;
      uniqueTexts.push(core);
      indexByText.set(core, uniqueIndex);
      usedChars += core.length;
    }

    const coreStart = original.indexOf(core);
    nodes.push({
      node,
      original,
      prefix: original.slice(0, coreStart),
      suffix: original.slice(coreStart + core.length),
      uniqueIndex
    });
  }

  window.__mingyueTranslateState = {
    nodes,
    uniqueTexts,
    candidateCount,
    truncated,
    translated: false
  };

  return {
    texts: uniqueTexts,
    candidateCount,
    truncated,
    alreadyTranslated: false
  };
})()
`

export function buildExtractPageTextScript(
  target: TranslationTarget = 'zh-CN'
): string {
  if (target !== 'en' && target !== 'ja') return EXTRACT_PAGE_TEXT_SCRIPT
  return EXTRACT_PAGE_TEXT_SCRIPT.replace(
    '/[A-Za-z\\u00C0-\\u024F\\u0400-\\u04FF\\u3040-\\u30FF\\uAC00-\\uD7AF]/',
    '/[A-Za-z\\u00C0-\\u024F\\u0400-\\u04FF\\u3040-\\u30FF\\uAC00-\\uD7AF\\u3400-\\u4DBF\\u4E00-\\u9FFF]/'
  )
}

export function buildApplyTranslationScript(
  translations: string[]
): string {
  const payload = JSON.stringify(translations)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

  return `
(() => {
  const state = window.__mingyueTranslateState;
  if (!state) return { applied: 0, total: 0 };
  const translations = ${payload};
  let applied = 0;
  for (const record of state.nodes) {
    if (!record.node || !record.node.isConnected) continue;
    const translated = translations[record.uniqueIndex];
    if (typeof translated !== 'string' || !translated) continue;
    record.node.nodeValue = record.prefix + translated + record.suffix;
    applied += 1;
  }
  state.translated = true;
  document.documentElement.setAttribute('data-mingyue-translated', 'true');
  return { applied, total: state.nodes.length };
})()
`
}

export const RESTORE_PAGE_TEXT_SCRIPT = String.raw`
(() => {
  const state = window.__mingyueTranslateState;
  if (!state) return false;
  for (const record of state.nodes) {
    if (!record.node || !record.node.isConnected) continue;
    record.node.nodeValue = record.original;
  }
  state.translated = false;
  document.documentElement.removeAttribute('data-mingyue-translated');
  return true;
})()
`
