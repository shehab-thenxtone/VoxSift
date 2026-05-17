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
