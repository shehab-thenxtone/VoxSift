import type { ExtractedContent, SpeechSegment } from '../shared/types/content'
import type { Result } from '../shared/utils/result'
import { ok, err } from '../shared/utils/result'
import { runReadability, extractBodyText } from './readability'
import { sanitizeHtml } from './sanitize'
import { segmentText } from './segmenter'
import { genContentId } from '../shared/utils/id'
import { LIMITS } from '../shared/constants/limits'

const CHUNK_SIZE = 20

export interface ExtractionChunkMeta {
  tabId: number
  url: string
  title: string
  byline: string | null
  siteName: string | null
  lang: string
  sanitizedHtml: string
  wordCount: number
  extractedAt: number
}

export async function extractPageAsync(
  doc: Document,
  tabId: number,
  url: string,
  onProgress: (fraction: number, phase: string) => void,
  onChunk: (
    segments: SpeechSegment[],
    meta: ExtractionChunkMeta | null,
    isFirst: boolean,
    isFinal: boolean,
  ) => void,
): Promise<Result<ExtractedContent>> {
  onProgress(0.05, 'Analyzing page')

  const _read = runReadability(doc)
  const readResult = _read.ok ? _read : extractBodyText(doc)
  if (!readResult.ok) return err(readResult.error)

  onProgress(0.6, 'Extracting content')
  const article = readResult.value

  const sanitizedHtml = sanitizeHtml(article.content)
  onProgress(0.75, 'Cleaning content')

  const rawParagraphs = article.textContent
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20)

  if (rawParagraphs.length === 0) {
    return err(new Error('No readable content found on this page'))
  }

  const lang = article.lang || 'en'
  const wordCount = article.textContent.split(/\s+/).length
  const contentId = genContentId()
  const extractedAt = Date.now()

  const meta: ExtractionChunkMeta = {
    tabId,
    url,
    title: article.title,
    byline: article.byline,
    siteName: article.siteName,
    lang,
    sanitizedHtml,
    wordCount,
    extractedAt,
  }

  const allSegments: SpeechSegment[] = []
  const total = rawParagraphs.length

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const batch = rawParagraphs.slice(i, i + CHUNK_SIZE)
    const rawSegs = segmentText(batch, lang)
    const offset = allSegments.length
    const reindexed = rawSegs.map((s) => ({ ...s, index: offset + s.index }))
    allSegments.push(...reindexed)

    const progressEnd = Math.min((i + CHUNK_SIZE) / total, 1)
    onProgress(0.75 + 0.23 * progressEnd, 'Segmenting text')

    const isFirst = i === 0
    const isFinal = i + CHUNK_SIZE >= total
    onChunk(reindexed, isFirst ? meta : null, isFirst, isFinal)

    // Yield to event loop between chunks so progress messages can be sent
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }

  onProgress(1.0, 'Done')

  const limited = allSegments.slice(0, LIMITS.MAX_SEGMENTS_PER_ARTICLE)
  const totalChars = limited.reduce((sum, s) => sum + s.text.length, 0)

  return ok({
    id: contentId,
    tabId,
    url,
    title: article.title,
    byline: article.byline,
    siteName: article.siteName,
    lang,
    segments: limited,
    sanitizedHtml,
    totalChars,
    wordCount,
    extractedAt,
    source: 'page',
  })
}

export function extractPage(doc: Document, tabId: number, url: string): Result<ExtractedContent> {
  const _read = runReadability(doc)
  const readResult = _read.ok ? _read : extractBodyText(doc)
  if (!readResult.ok) return err(readResult.error)

  const article = readResult.value
  const sanitizedHtml = sanitizeHtml(article.content)

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
