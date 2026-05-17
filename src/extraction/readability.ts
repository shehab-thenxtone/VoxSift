import { Readability } from '@mozilla/readability'
import type { Result } from '../shared/utils/result'
import { ok, err } from '../shared/utils/result'

export interface ReadabilityResult {
  title: string
  byline: string | null
  siteName: string | null
  lang: string
  content: string
  textContent: string
  excerpt: string | null
  length: number
}

export function runReadability(doc: Document): Result<ReadabilityResult> {
  // Readability mutates the document — clone it first
  const docClone = doc.cloneNode(true) as Document
  const reader = new Readability(docClone, { keepClasses: false })
  const article = reader.parse()

  if (!article) {
    return err(new Error('Readability could not parse the document'))
  }

  return ok({
    title: article.title,
    byline: article.byline ?? null,
    siteName: article.siteName ?? null,
    lang: article.lang ?? doc.documentElement.lang ?? 'en',
    content: article.content,
    textContent: article.textContent,
    excerpt: article.excerpt ?? null,
    length: article.length,
  })
}

/**
 * Fallback for SPA/app pages where Readability returns null.
 * Walks the visible DOM, strips chrome (nav/header/footer/etc.), and
 * returns the remaining text as a ReadabilityResult.
 */
export function extractBodyText(doc: Document): Result<ReadabilityResult> {
  // Prefer semantic content containers over the raw body
  const preferredSelectors = ['main', '[role="main"]', 'article']
  let root: Element = doc.body
  for (const sel of preferredSelectors) {
    const el = doc.querySelector(sel)
    if (el && (el.textContent?.trim().length ?? 0) > 200) {
      root = el
      break
    }
  }

  // Clone so we can strip without touching the live page
  const clone = root.cloneNode(true) as Element
  const noiseSelectors = [
    'script',
    'style',
    'noscript',
    'nav',
    'header',
    'footer',
    'aside',
    '[aria-hidden="true"]',
    '[role="navigation"]',
    '[role="banner"]',
  ]
  noiseSelectors.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove())
  })

  // Normalise whitespace while preserving paragraph boundaries
  const raw = clone.textContent ?? ''
  const text = raw
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (text.length < 100) {
    return err(new Error('No readable content found on this page'))
  }

  return ok({
    title: doc.title ?? '',
    byline: null,
    siteName: doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ?? null,
    lang: doc.documentElement.lang || 'en',
    content: `<div>${text}</div>`,
    textContent: text,
    excerpt: text.substring(0, 200),
    length: text.length,
  })
}
