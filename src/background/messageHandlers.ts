import type { Message, MessageResponse } from '../shared/types/messages'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { playbackController } from './playbackController'
import { storageManager } from '../storage/storageManager'
import { getTtsEngine } from '../tts/engineFactory'
import { sendToTab } from '../shared/messaging/send'
import { genReqId } from '../shared/utils/id'
import { extractPage } from '../extraction/extract'
import { logger } from '../shared/utils/logger'

function success<T>(reqId: string, data: T): MessageResponse<T> {
  return { ok: true, reqId, data }
}

function failure(reqId: string, code: string, message: string): MessageResponse {
  return { ok: false, reqId, error: { code, message } }
}

export async function handleMessage(
  msg: Message,
  _sender: chrome.runtime.MessageSender,
): Promise<MessageResponse> {
  const { type, reqId } = msg

  try {
    switch (type) {
      case MESSAGE_TYPE.GetPlaybackState:
        return success(reqId, playbackController.getState())

      case MESSAGE_TYPE.GetVoices: {
        const voices = await getTtsEngine().getVoices()
        return success(reqId, voices)
      }

      case MESSAGE_TYPE.ExtractAndPlay: {
        const tabId = (msg as Extract<Message, { type: typeof MESSAGE_TYPE.ExtractAndPlay }>).tabId
        const contentId = genReqId()
        await playbackController.startExtraction(tabId, contentId)

        // Ask content script to run extraction
        const extractMsg = {
          type: MESSAGE_TYPE.RunExtraction,
          reqId: genReqId(),
          ts: Date.now(),
          contentId,
        }
        const result = await sendToTab(tabId, extractMsg)
        if (!result.ok) {
          await playbackController.onExtractionFailed(result.error.message)
          return failure(reqId, result.error.code, result.error.message)
        }

        const content = (result as { ok: true; reqId: string; data: ReturnType<typeof extractPage> }).data
        if (!content || typeof content !== 'object' || !('ok' in content)) {
          return failure(reqId, 'EXTRACT_EMPTY', 'No content returned')
        }

        return success(reqId, { contentId })
      }

      case MESSAGE_TYPE.Play:
        await playbackController.play()
        return success(reqId, undefined)

      case MESSAGE_TYPE.Pause:
        await playbackController.pause()
        return success(reqId, undefined)

      case MESSAGE_TYPE.Stop:
        await playbackController.stop()
        return success(reqId, undefined)

      case MESSAGE_TYPE.SkipNext:
        await playbackController.skipNext()
        return success(reqId, undefined)

      case MESSAGE_TYPE.SkipPrev:
        await playbackController.skipPrev()
        return success(reqId, undefined)

      case MESSAGE_TYPE.SeekToSegment: {
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.SeekToSegment }>
        await playbackController.seekToSegment(m.segmentIndex)
        return success(reqId, undefined)
      }

      case MESSAGE_TYPE.SetVoice: {
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.SetVoice }>
        await playbackController.setVoice(m.voice)
        return success(reqId, undefined)
      }

      case MESSAGE_TYPE.SetRate: {
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.SetRate }>
        await playbackController.setRate(m.rate)
        return success(reqId, undefined)
      }

      case MESSAGE_TYPE.ToggleGhostMode: {
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.ToggleGhostMode }>
        await playbackController.toggleGhostMode(m.enabled)
        return success(reqId, undefined)
      }

      case MESSAGE_TYPE.ExtractionCompleted: {
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.ExtractionCompleted }>
        await storageManager.cacheContent(m.content)
        await playbackController.loadContent(m.content)

        // Mount reader and mini player in the originating tab
        const tabId = m.content.tabId
        const mountReaderMsg = { type: MESSAGE_TYPE.MountReader, reqId: genReqId(), ts: Date.now(), content: m.content }
        const mountMiniMsg = { type: MESSAGE_TYPE.MountMiniPlayer, reqId: genReqId(), ts: Date.now(), contentId: m.content.id }
        await Promise.all([
          sendToTab(tabId, mountReaderMsg),
          sendToTab(tabId, mountMiniMsg),
        ])

        await playbackController.play()
        return success(reqId, undefined)
      }

      default:
        logger.warn('Unhandled message type', type)
        return failure(reqId, 'UNKNOWN_TYPE', `Unhandled: ${type}`)
    }
  } catch (e) {
    logger.error('messageHandlers error', e)
    return failure(reqId, 'INTERNAL', String(e))
  }
}
