import type { Message, MessageResponse } from '../shared/types/messages'
import { MESSAGE_TYPE } from '../shared/types/messages'
import type { ExtractedContent } from '../shared/types/content'
import { playbackController } from './playbackController'
import { storageManager } from '../storage/storageManager'
import { getTtsEngine } from '../tts/engineFactory'
import { sendToTab } from '../shared/messaging/send'
import { genReqId } from '../shared/utils/id'
import { logger } from '../shared/utils/logger'

function isRestrictedUrl(url: string): boolean {
  return !url || /^(chrome|edge|about|data|chrome-extension):/.test(url)
}

async function ensureContentScript(tabId: number): Promise<void> {
  const files = (chrome.runtime.getManifest().content_scripts?.[0]?.js ?? []) as string[]
  if (!files.length) return
  await chrome.scripting.executeScript({ target: { tabId }, files })
  await new Promise<void>((resolve) => setTimeout(resolve, 100))
}

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

        const tab = await chrome.tabs.get(m.tabId).catch(() => null)
        if (isRestrictedUrl(tab?.url ?? '')) {
          await playbackController.onExtractionFailed("VoxSift can't run on this page")
          return success(reqId, null)
        }

        const contentId = genReqId()
        await playbackController.startExtraction(m.tabId, contentId)

        const runMsg = {
          type: MESSAGE_TYPE.RunExtraction,
          contentId,
          tabId: m.tabId,
        } as Parameters<typeof sendToTab>[1]

        sendToTab(m.tabId, runMsg).catch(async () => {
          // Content script not injected — tab pre-dates extension install. Inject and retry.
          try {
            await ensureContentScript(m.tabId)
            await sendToTab(m.tabId, runMsg)
          } catch {
            playbackController
              .onExtractionFailed('Please reload the page and try again')
              .catch(() => {})
          }
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

      case MESSAGE_TYPE.ReadSelection: {
        const m = msg as Extract<Message, { type: typeof MESSAGE_TYPE.ReadSelection }>

        const tab = await chrome.tabs.get(m.tabId).catch(() => null)
        if (isRestrictedUrl(tab?.url ?? '')) {
          await playbackController.onExtractionFailed("VoxSift can't run on this page")
          return success(reqId, null)
        }

        const selMsg = {
          type: MESSAGE_TYPE.ExtractSelection,
          contentId: genReqId(),
          tabId: m.tabId,
        } as Parameters<typeof sendToTab>[1]

        let response:
          | { ok: true; reqId: string; data: ExtractedContent | null }
          | { ok: false; reqId: string; error: { code: string; message: string } }
        try {
          response = (await sendToTab<ExtractedContent | null>(m.tabId, selMsg)) as typeof response
        } catch {
          try {
            await ensureContentScript(m.tabId)
            response = (await sendToTab<ExtractedContent | null>(
              m.tabId,
              selMsg,
            )) as typeof response
          } catch {
            await playbackController.onExtractionFailed('Please reload the page and try again')
            return success(reqId, null)
          }
        }

        if (!response.ok) {
          await playbackController.onExtractionFailed(response.error.message)
          return success(reqId, null)
        }

        const content = response.data
        if (!content) {
          await playbackController.onExtractionFailed('Select some text on the page first')
          return success(reqId, null)
        }

        await storageManager.cacheContent(content)
        await playbackController.loadContent(content)
        sendToTab(m.tabId, { type: MESSAGE_TYPE.MountReader, content } as Parameters<
          typeof sendToTab
        >[1]).catch(() => {})
        sendToTab(m.tabId, {
          type: MESSAGE_TYPE.MountMiniPlayer,
          contentId: content.id,
        } as Parameters<typeof sendToTab>[1]).catch(() => {})
        return success(reqId, { contentId: content.id })
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
