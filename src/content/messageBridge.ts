import type { Message, MessageResponse } from '../shared/types/messages'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { runPageExtraction, runSelectionExtraction } from './extractionBridge'
import { logger } from '../shared/utils/logger'

// Will be set by the mount functions
let mountReader: ((content: import('../shared/types/content').ExtractedContent) => void) | null =
  null
let unmountReader: (() => void) | null = null
let mountMiniPlayer: ((contentId: string) => void) | null = null
let unmountMiniPlayer: (() => void) | null = null
let highlightSegment: ((segmentId: string) => void) | null = null

export function registerMountHandlers(handlers: {
  mountReader: typeof mountReader
  unmountReader: typeof unmountReader
  mountMiniPlayer: typeof mountMiniPlayer
  unmountMiniPlayer: typeof unmountMiniPlayer
  highlightSegment: typeof highlightSegment
}): void {
  mountReader = handlers.mountReader
  unmountReader = handlers.unmountReader
  mountMiniPlayer = handlers.mountMiniPlayer
  unmountMiniPlayer = handlers.unmountMiniPlayer
  highlightSegment = handlers.highlightSegment
}

export function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse): boolean => {
    handleContentMessage(msg)
      .then(sendResponse)
      .catch((e) => {
        logger.error('Content message error', e)
        sendResponse({
          ok: false,
          reqId: msg.reqId,
          error: { code: 'INTERNAL', message: String(e) },
        })
      })
    return true
  })
}

async function handleContentMessage(msg: Message): Promise<MessageResponse> {
  const { type, reqId } = msg

  switch (type) {
    case MESSAGE_TYPE.RunExtraction: {
      const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.RunExtraction }>
      // Fire-and-forget: progress/chunks/completed arrive as separate messages
      runPageExtraction(m.tabId, m.contentId).catch((e) => {
        logger.error('runPageExtraction failed', e)
      })
      return { ok: true, reqId, data: undefined }
    }

    case MESSAGE_TYPE.MountReader: {
      const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.MountReader }>
      mountReader?.(m.content)
      return { ok: true, reqId, data: undefined }
    }

    case MESSAGE_TYPE.UnmountReader:
      unmountReader?.()
      return { ok: true, reqId, data: undefined }

    case MESSAGE_TYPE.MountMiniPlayer: {
      const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.MountMiniPlayer }>
      mountMiniPlayer?.(m.contentId)
      return { ok: true, reqId, data: undefined }
    }

    case MESSAGE_TYPE.UnmountMiniPlayer:
      unmountMiniPlayer?.()
      return { ok: true, reqId, data: undefined }

    case MESSAGE_TYPE.HighlightSegment: {
      const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.HighlightSegment }>
      highlightSegment?.(m.segmentId)
      return { ok: true, reqId, data: undefined }
    }

    case MESSAGE_TYPE.ExtractSelection: {
      const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.ExtractSelection }>
      const content = runSelectionExtraction(m.tabId)
      return { ok: true, reqId, data: content }
    }

    case MESSAGE_TYPE.PlaybackUpdated:
      // Forwarded to React trees via custom event
      window.dispatchEvent(
        new CustomEvent('voxsift:playback', {
          detail: (msg as Extract<Message, { type: typeof MESSAGE_TYPE.PlaybackUpdated }>).state,
        }),
      )
      return { ok: true, reqId, data: undefined }

    default:
      return { ok: true, reqId, data: undefined }
  }
}
