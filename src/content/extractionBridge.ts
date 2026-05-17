import { extractPageAsync } from '../extraction/extract'
import { extractSelection } from '../extraction/selection'
import { getLastSelectionText } from './selectionWatcher'
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
        } else {
          sendToBackground({
            type: MESSAGE_TYPE.ExtractionFailed,
            tabId,
            reason: result.error.message,
          } as Parameters<typeof sendToBackground>[0]).catch(() => {})
        }
        resolve(result)
      })
      .catch((e) => {
        clearTimeout(timer)
        logger.error('Extraction error', e)
        const error = e instanceof Error ? e : new Error(String(e))
        sendToBackground({
          type: MESSAGE_TYPE.ExtractionFailed,
          tabId,
          reason: error.message,
        } as Parameters<typeof sendToBackground>[0]).catch(() => {})
        resolve(err(error))
      })
  })
}

export function runSelectionExtraction(tabId: number): ExtractedContent | null {
  // Try standard selection; also check textarea/input since window.getSelection()
  // doesn't capture text selected inside form elements.
  // Fall back to last cached text if focus already moved to the popup.
  let live = window.getSelection()?.toString().trim() ?? ''
  if (!live) {
    const el = document.activeElement
    if (
      (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
      el.selectionStart !== null
    ) {
      const start = el.selectionStart ?? 0
      const end = el.selectionEnd ?? start
      if (end > start) live = el.value.substring(start, end).trim()
    }
  }
  const text = live || getLastSelectionText()
  if (!text) return null

  const fakeSelection = { toString: () => text } as Selection
  return extractSelection(fakeSelection, tabId, location.href)
}
