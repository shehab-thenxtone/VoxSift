import type { ExtractedContent } from '../shared/types/content'
import { genContentId } from '../shared/utils/id'
import { segmentText } from './segmenter'

export function extractSelection(
  selection: Selection,
  tabId: number,
  url: string,
): ExtractedContent | null {
  const text = selection.toString().trim()
  if (!text) return null

  const lang = document.documentElement.lang || 'en'
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const segments = segmentText(paragraphs, lang)
  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0)

  return {
    id: genContentId(),
    tabId,
    url,
    title: 'Selected Text',
    byline: null,
    siteName: null,
    lang,
    segments,
    sanitizedHtml: `<p>${text.replace(/\n/g, '</p><p>')}</p>`,
    totalChars,
    wordCount: text.split(/\s+/).length,
    extractedAt: Date.now(),
    source: 'selection',
  }
}
