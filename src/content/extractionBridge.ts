import { extractPage } from '../extraction/extract'
import { extractSelection } from '../extraction/selection'
import type { ExtractedContent } from '../shared/types/content'
import type { Result } from '../shared/utils/result'
import { err } from '../shared/utils/result'
import { LIMITS } from '../shared/constants/limits'
import { logger } from '../shared/utils/logger'

export async function runPageExtraction(tabId: number): Promise<Result<ExtractedContent>> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(err(new Error('Extraction timed out')))
    }, LIMITS.EXTRACTION_TIMEOUT_MS)

    try {
      const result = extractPage(document, tabId, location.href)
      clearTimeout(timer)
      resolve(result)
    } catch (e) {
      clearTimeout(timer)
      logger.error('Extraction error', e)
      resolve(err(e instanceof Error ? e : new Error(String(e))))
    }
  })
}

export function runSelectionExtraction(tabId: number): ExtractedContent | null {
  const selection = window.getSelection()
  if (!selection) return null
  return extractSelection(selection, tabId, location.href)
}
