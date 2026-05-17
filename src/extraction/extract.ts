import type { ExtractedContent } from '../shared/types/content'
import type { Result } from '../shared/utils/result'
import { ok, err } from '../shared/utils/result'
import { runReadability } from './readability'
import { sanitizeHtml } from './sanitize'
import { segmentText } from './segmenter'
import { genContentId } from '../shared/utils/id'
import { LIMITS } from '../shared/constants/limits'

export function extractPage(
  doc: Document,
  tabId: number,
  url: string,
): Result<ExtractedContent> {
  const readResult = runReadability(doc)
  if (!readResult.ok) return err(readResult.error)

  const article = readResult.value
  const sanitizedHtml = sanitizeHtml(article.content)

  // Extract plain-text paragraphs from textContent
  const rawParagraphs = article.textContent
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20)

  if (rawParagraphs.length === 0) {
    return err(new Error('No readable content found on this page'))
  }

  const lang = article.lang || 'en'
  const segments = segmentText(rawParagraphs, lang).slice(0, LIMITS.MAX_SEGMENTS_PER_ARTICLE)
  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0)
  const wordCount = article.textContent.split(/\s+/).length

  return ok({
    id: genContentId(),
    tabId,
    url,
    title: article.title,
    byline: article.byline,
    siteName: article.siteName,
    lang,
    segments,
    sanitizedHtml,
    totalChars,
    wordCount,
    extractedAt: Date.now(),
    source: 'page',
  })
}
