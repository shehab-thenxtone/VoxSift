import { extractPageAsync } from '../extraction/extract'
import { extractSelection } from '../extraction/selection'
import { sendToBackground } from '../shared/messaging/send'
import type { ExtractedContent } from '../shared/types/content'
import type { Result } from '../shared/utils/result'
import { err } from '../shared/utils/result'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { LIMITS } from '../shared/constants/limits'
import { logger } from '../shared/utils/logger'

export async function runPageExtraction(
  tabId: number,
  contentId: string,
): Promise<Result<ExtractedContent>> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(err(new Error('Extraction timed out')))
    }, LIMITS.EXTRACTION_TIMEOUT_MS)

    extractPageAsync(
      document,
      tabId,
      location.href,
      (progress, phase) => {
        sendToBackground({
          type: MESSAGE_TYPE.ExtractionProgress,
          tabId,
          progress,
          phase,
        } as Parameters<typeof sendToBackground>[0]).catch(() => {})
      },
      (segments, meta, isFirst, isFinal) => {
        sendToBackground({
          type: MESSAGE_TYPE.ExtractionChunk,
          contentId,
          segments,
          meta,
          isFirst,
          isFinal,
        } as Parameters<typeof sendToBackground>[0]).catch(() => {})
      },
    )
      .then((result) => {
        clearTimeout(timer)
        if (result.ok) {
          sendToBackground({
            type: MESSAGE_TYPE.ExtractionCompleted,
            content: result.value,
          } as Parameters<typeof sendToBackground>[0]).catch(() => {})
        }
        resolve(result)
      })
      .catch((e) => {
        clearTimeout(timer)
        logger.error('Extraction error', e)
        resolve(err(e instanceof Error ? e : new Error(String(e))))
      })
  })
}

export function runSelectionExtraction(tabId: number): ExtractedContent | null {
  const selection = window.getSelection()
  if (!selection) return null
  return extractSelection(selection, tabId, location.href)
}
