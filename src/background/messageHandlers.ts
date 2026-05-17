import type { Message, MessageResponse } from '../shared/types/messages'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { playbackController } from './playbackController'
import { storageManager } from '../storage/storageManager'
import { getTtsEngine } from '../tts/engineFactory'
import { sendToTab } from '../shared/messaging/send'
import { genReqId } from '../shared/utils/id'
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
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.ExtractAndPlay }>
        const contentId = genReqId()
        await playbackController.startExtraction(m.tabId, contentId)

        // Fire-and-forget: progress/chunks/completed arrive as separate messages
        sendToTab(m.tabId, {
          type: MESSAGE_TYPE.RunExtraction,
          contentId,
          tabId: m.tabId,
        } as Parameters<typeof sendToTab>[1]).catch(() => {
          playbackController.onExtractionFailed('Tab unavailable').catch(() => {})
        })

        return success(reqId, { contentId })
      }

      case MESSAGE_TYPE.ExtractionProgress: {
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.ExtractionProgress }>
        await playbackController.onExtractionProgress(m.progress)
        return success(reqId, undefined)
      }

      case MESSAGE_TYPE.ExtractionChunk: {
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.ExtractionChunk }>
        if (m.isFirst && m.meta) {
          await playbackController.onFirstChunk(m.meta.tabId, m.segments)
          // Mount mini-player immediately so user has controls during extraction
          sendToTab(m.meta.tabId, {
            type: MESSAGE_TYPE.MountMiniPlayer,
            contentId: m.contentId,
          } as Parameters<typeof sendToTab>[1]).catch(() => {})
        } else {
          await playbackController.onChunk(m.segments)
        }
        return success(reqId, undefined)
      }

      case MESSAGE_TYPE.ExtractionCompleted: {
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.ExtractionCompleted }>
        await storageManager.cacheContent(m.content)
        const wasPlaying = playbackController.getState().status === 'playing'
        await playbackController.loadContent(m.content)

        const tabId = m.content.tabId
        // Always mount reader with complete content
        sendToTab(tabId, {
          type: MESSAGE_TYPE.MountReader,
          content: m.content,
        } as Parameters<typeof sendToTab>[1]).catch(() => {})

        // Mini-player only needed if streaming didn't mount it already
        if (!wasPlaying) {
          sendToTab(tabId, {
            type: MESSAGE_TYPE.MountMiniPlayer,
            contentId: m.content.id,
          } as Parameters<typeof sendToTab>[1]).catch(() => {})
        }

        return success(reqId, undefined)
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

      default:
        logger.warn('Unhandled message type', type)
        return failure(reqId, 'UNKNOWN_TYPE', `Unhandled: ${type}`)
    }
  } catch (e) {
    logger.error('messageHandlers error', e)
    return failure(reqId, 'INTERNAL', String(e))
  }
}
