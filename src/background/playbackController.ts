import { PlaybackStateMachine } from './playbackStateMachine'
import { QueueManager } from './queueManager'
import { tabRegistry } from './tabRegistry'
import { broadcastPlaybackUpdated } from './broadcast'
import { sessionStore } from '../storage/sessionStore'
import { getTtsEngine } from '../tts/engineFactory'
import type { ExtractedContent } from '../shared/types/content'
import type { VoiceConfig } from '../shared/types/voice'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { genReqId } from '../shared/utils/id'
import { logger } from '../shared/utils/logger'

const fsm = new PlaybackStateMachine()
const queue = new QueueManager()

function persist() {
  const state = fsm.getState()
  sessionStore.save({
    state: { ...state },
    contentRef: state.contentId && state.tabId
      ? { id: state.contentId, tabId: state.tabId, url: '' }
      : null,
  })
}

async function broadcast() {
  await broadcastPlaybackUpdated(fsm.getState())
  persist()
}

export const playbackController = {
  getState() {
    return fsm.getState()
  },

  async loadContent(content: ExtractedContent): Promise<void> {
    queue.load(content.segments)
    tabRegistry.setActive(content.tabId)
    fsm.dispatch({ type: 'EXTRACT_COMPLETED' }, queue.length)
    await broadcast()
  },

  async startExtraction(tabId: number, contentId: string): Promise<void> {
    fsm.dispatch({ type: 'EXTRACT_AND_PLAY', tabId, contentId }, queue.length)
    await broadcast()
  },

  async onExtractionFailed(reason: string): Promise<void> {
    fsm.dispatch({
      type: 'EXTRACT_FAILED',
      error: { code: 'EXTRACTION_FAILED', message: reason },
    })
    await broadcast()
  },

  async play(): Promise<void> {
    fsm.dispatch({ type: 'PLAY' }, queue.length)

    const state = fsm.getState()
    const engine = getTtsEngine()
    const segments = queue.getAll()

    engine.speak(
      segments,
      state.voice,
      state.activeSegmentIndex,
      (boundary) => {
        const seg = segments[boundary.segmentIndex]
        if (!seg) return
        fsm.dispatch({
          type: 'BOUNDARY',
          segmentIndex: boundary.segmentIndex,
          segmentId: seg.id,
          charOffsetInSegment: boundary.charIndex,
        }, queue.length)

        // Broadcast boundary for reader highlighting
        const boundaryMsg = {
          type: MESSAGE_TYPE.SegmentBoundary,
          reqId: genReqId(),
          ts: Date.now(),
          segmentId: seg.id,
          segmentIndex: boundary.segmentIndex,
          charOffsetInSegment: boundary.charIndex,
        }
        const tabId = tabRegistry.getActive()
        if (tabId) chrome.tabs.sendMessage(tabId, boundaryMsg).catch(() => {})
        persist()
      },
      () => {
        fsm.dispatch({ type: 'QUEUE_END' }, queue.length)
        broadcast()
      },
      (error) => {
        logger.error('TTS error', error)
        fsm.dispatch({ type: 'EXTRACT_FAILED', error: { code: 'TTS_ENGINE_ERROR', message: error } })
        broadcast()
      },
    )

    await broadcast()
  },

  async pause(): Promise<void> {
    getTtsEngine().pause()
    fsm.dispatch({ type: 'PAUSE' }, queue.length)
    await broadcast()
  },

  async stop(): Promise<void> {
    getTtsEngine().cancel()
    fsm.dispatch({ type: 'STOP' }, queue.length)
    await broadcast()
  },

  async skipNext(): Promise<void> {
    getTtsEngine().cancel()
    fsm.dispatch({ type: 'SKIP_NEXT' }, queue.length)
    if (fsm.getState().status === 'playing') await this.play()
    else await broadcast()
  },

  async skipPrev(): Promise<void> {
    getTtsEngine().cancel()
    fsm.dispatch({ type: 'SKIP_PREV' }, queue.length)
    if (fsm.getState().status === 'playing') await this.play()
    else await broadcast()
  },

  async seekToSegment(index: number): Promise<void> {
    getTtsEngine().cancel()
    fsm.dispatch({ type: 'SEEK', segmentIndex: index }, queue.length)
    if (fsm.getState().status === 'playing') await this.play()
    else await broadcast()
  },

  async setVoice(voice: VoiceConfig): Promise<void> {
    fsm.dispatch({ type: 'SET_VOICE', voice }, queue.length)
    await broadcast()
  },

  async setRate(rate: number): Promise<void> {
    fsm.dispatch({ type: 'SET_RATE', rate }, queue.length)
    await broadcast()
  },

  async toggleGhostMode(enabled: boolean): Promise<void> {
    fsm.dispatch({ type: 'TOGGLE_GHOST_MODE', enabled }, queue.length)
    await broadcast()
  },
}
