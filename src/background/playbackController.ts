import { sessionManager } from './sessionManager'
import { broadcastPlaybackUpdated } from './broadcast'
import { sessionStore } from '../storage/sessionStore'
import { getTtsEngine } from '../tts/engineFactory'
import type { ExtractedContent, SpeechSegment } from '../shared/types/content'
import type { PlaybackState } from '../shared/types/playback'
import type { VoiceConfig } from '../shared/types/voice'
import { DEFAULT_VOICE } from '../shared/constants/defaults'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { genReqId } from '../shared/utils/id'
import { logger } from '../shared/utils/logger'

function getIdleState(): PlaybackState {
  return {
    status: 'idle',
    contentId: null,
    tabId: null,
    activeSegmentIndex: 0,
    activeSegmentId: null,
    charOffsetInSegment: 0,
    progress: 0,
    extractionProgress: 0,
    voice: DEFAULT_VOICE,
    ghostMode: false,
    revision: 0,
    updatedAt: Date.now(),
    error: null,
  }
}

function persist(tabId: number): void {
  const session = sessionManager.get(tabId)
  if (!session) return
  const state = session.fsm.getState()
  sessionStore.save({
    state: { ...state },
    contentRef:
      state.contentId && state.tabId ? { id: state.contentId, tabId: state.tabId, url: '' } : null,
  })
}

async function broadcast(tabId: number): Promise<void> {
  await broadcastPlaybackUpdated()
  persist(tabId)
}

function isActiveTab(tabId: number): boolean {
  return sessionManager.getActiveTabId() === tabId
}

export const playbackController = {
  getState(tabId?: number): Readonly<PlaybackState> {
    if (tabId !== undefined) {
      return sessionManager.get(tabId)?.fsm.getState() ?? getIdleState()
    }
    return sessionManager.getActive()?.fsm.getState() ?? getIdleState()
  },

  async startExtraction(tabId: number, contentId: string): Promise<void> {
    await this.pauseActiveIfNeeded(tabId)
    sessionManager.setActive(tabId)
    const session = sessionManager.getOrCreate(tabId)
    session.fsm.dispatch({ type: 'EXTRACT_AND_PLAY', tabId, contentId }, session.queue.length)
    await broadcast(tabId)
  },

  async onExtractionProgress(tabId: number, progress: number): Promise<void> {
    const session = sessionManager.get(tabId)
    if (!session) return
    session.fsm.dispatch({ type: 'EXTRACTION_PROGRESS', progress }, session.queue.length)
    await broadcast(tabId)
  },

  async onFirstChunk(tabId: number, segments: SpeechSegment[]): Promise<void> {
    const session = sessionManager.getOrCreate(tabId)
    session.queue.load(segments)
    if (isActiveTab(tabId)) {
      await this.play(tabId)
    }
  },

  async onChunk(tabId: number, segments: SpeechSegment[]): Promise<void> {
    const session = sessionManager.getOrCreate(tabId)
    session.queue.append(segments)
    if (isActiveTab(tabId)) {
      getTtsEngine().appendSegments(segments)
    }
  },

  async loadContent(content: ExtractedContent): Promise<void> {
    const tabId = content.tabId

    // ReadSelection skips startExtraction, so ensure the session is set up here.
    // For streaming extraction, startExtraction already ran — these are no-ops.
    await this.pauseActiveIfNeeded(tabId)
    sessionManager.setActive(tabId)

    const session = sessionManager.getOrCreate(tabId)
    session.queue.load(content.segments)

    // If the FSM wasn't put into 'extracting' by startExtraction, bootstrap it now
    // so EXTRACT_COMPLETED can transition correctly.
    const currentStatus = session.fsm.getState().status
    if (currentStatus !== 'extracting' && currentStatus !== 'playing') {
      session.fsm.dispatch(
        { type: 'EXTRACT_AND_PLAY', tabId, contentId: content.id },
        session.queue.length,
      )
    }

    session.fsm.dispatch({ type: 'EXTRACT_COMPLETED' }, session.queue.length)
    await broadcast(tabId)
    if (session.fsm.getState().status === 'ready') {
      await this.play(tabId)
    }
  },

  async onExtractionFailed(tabId: number, reason: string): Promise<void> {
    const session = sessionManager.get(tabId)
    if (!session) return
    session.fsm.dispatch({
      type: 'EXTRACT_FAILED',
      error: { code: 'EXTRACTION_FAILED', message: reason },
    })
    await broadcast(tabId)
  },

  /** Pause the currently active TTS tab if it differs from `incomingTabId`. */
  async pauseActiveIfNeeded(incomingTabId: number): Promise<void> {
    const activeTabId = sessionManager.getActiveTabId()
    if (activeTabId === null || activeTabId === incomingTabId) return
    const activeSession = sessionManager.getActive()
    if (!activeSession) return
    if (activeSession.fsm.getState().status === 'playing') {
      getTtsEngine().cancel()
      activeSession.enginePaused = false
      activeSession.fsm.dispatch({ type: 'PAUSE' }, activeSession.queue.length)
      await broadcast(activeTabId)
    }
  },

  async play(tabId?: number): Promise<void> {
    const resolvedTabId = tabId ?? sessionManager.getActiveTabId()
    if (resolvedTabId === null) return

    await this.pauseActiveIfNeeded(resolvedTabId)
    sessionManager.setActive(resolvedTabId)

    const session = sessionManager.getOrCreate(resolvedTabId)
    const prevStatus = session.fsm.getState().status
    session.fsm.dispatch({ type: 'PLAY' }, session.queue.length)

    // Resume in-place only when the engine was truly paused (not cancelled via tab-switch).
    if (prevStatus === 'paused' && session.enginePaused) {
      getTtsEngine().resume()
      session.enginePaused = false
      await broadcast(resolvedTabId)
      return
    }

    session.enginePaused = false
    const state = session.fsm.getState()
    const engine = getTtsEngine()
    const segments = session.queue.getAll()

    engine.speak(
      segments,
      state.voice,
      state.activeSegmentIndex,
      (boundary) => {
        const seg = segments[boundary.segmentIndex]
        if (!seg) return
        session.fsm.dispatch(
          {
            type: 'BOUNDARY',
            segmentIndex: boundary.segmentIndex,
            segmentId: seg.id,
            charOffsetInSegment: boundary.charIndex,
          },
          session.queue.length,
        )

        const boundaryMsg = {
          type: MESSAGE_TYPE.SegmentBoundary,
          reqId: genReqId(),
          ts: Date.now(),
          segmentId: seg.id,
          segmentIndex: boundary.segmentIndex,
          charOffsetInSegment: boundary.charIndex,
        }
        chrome.tabs.sendMessage(resolvedTabId, boundaryMsg).catch(() => {})
        persist(resolvedTabId)
      },
      () => {
        session.fsm.dispatch({ type: 'QUEUE_END' }, session.queue.length)
        broadcast(resolvedTabId)
      },
      (error) => {
        logger.error('TTS error', error)
        session.fsm.dispatch({
          type: 'EXTRACT_FAILED',
          error: { code: 'TTS_ENGINE_ERROR', message: error },
        })
        broadcast(resolvedTabId)
      },
    )

    await broadcast(resolvedTabId)
  },

  async pause(tabId?: number): Promise<void> {
    const resolvedTabId = tabId ?? sessionManager.getActiveTabId()
    if (resolvedTabId === null) return
    const session = sessionManager.get(resolvedTabId)
    if (!session) return
    // Only pause the shared TTS engine when this tab is the one driving it.
    if (isActiveTab(resolvedTabId)) {
      getTtsEngine().pause()
      session.enginePaused = true
    }
    session.fsm.dispatch({ type: 'PAUSE' }, session.queue.length)
    await broadcast(resolvedTabId)
  },

  async stop(tabId?: number): Promise<void> {
    const resolvedTabId = tabId ?? sessionManager.getActiveTabId()
    if (resolvedTabId === null) return
    const session = sessionManager.get(resolvedTabId)
    if (!session) return
    if (isActiveTab(resolvedTabId)) {
      getTtsEngine().cancel()
      session.enginePaused = false
    }
    session.fsm.dispatch({ type: 'STOP' }, session.queue.length)
    await broadcast(resolvedTabId)
  },

  async skipNext(tabId?: number): Promise<void> {
    const resolvedTabId = tabId ?? sessionManager.getActiveTabId()
    if (resolvedTabId === null) return
    const session = sessionManager.get(resolvedTabId)
    if (!session) return
    if (isActiveTab(resolvedTabId)) {
      getTtsEngine().cancel()
      session.enginePaused = false
    }
    session.fsm.dispatch({ type: 'SKIP_NEXT' }, session.queue.length)
    if (session.fsm.getState().status === 'playing') await this.play(resolvedTabId)
    else await broadcast(resolvedTabId)
  },

  async skipPrev(tabId?: number): Promise<void> {
    const resolvedTabId = tabId ?? sessionManager.getActiveTabId()
    if (resolvedTabId === null) return
    const session = sessionManager.get(resolvedTabId)
    if (!session) return
    if (isActiveTab(resolvedTabId)) {
      getTtsEngine().cancel()
      session.enginePaused = false
    }
    session.fsm.dispatch({ type: 'SKIP_PREV' }, session.queue.length)
    if (session.fsm.getState().status === 'playing') await this.play(resolvedTabId)
    else await broadcast(resolvedTabId)
  },

  async seekToSegment(index: number, tabId?: number): Promise<void> {
    const resolvedTabId = tabId ?? sessionManager.getActiveTabId()
    if (resolvedTabId === null) return
    const session = sessionManager.get(resolvedTabId)
    if (!session) return
    if (isActiveTab(resolvedTabId)) {
      getTtsEngine().cancel()
      session.enginePaused = false
    }
    session.fsm.dispatch({ type: 'SEEK', segmentIndex: index }, session.queue.length)
    if (session.fsm.getState().status === 'playing') await this.play(resolvedTabId)
    else await broadcast(resolvedTabId)
  },

  async setVoice(voice: VoiceConfig): Promise<void> {
    const tabId = sessionManager.getActiveTabId()
    if (tabId === null) return
    const session = sessionManager.get(tabId)
    if (!session) return
    session.fsm.dispatch({ type: 'SET_VOICE', voice }, session.queue.length)
    await broadcast(tabId)
  },

  async setRate(rate: number): Promise<void> {
    const tabId = sessionManager.getActiveTabId()
    if (tabId === null) return
    const session = sessionManager.get(tabId)
    if (!session) return
    session.fsm.dispatch({ type: 'SET_RATE', rate }, session.queue.length)
    await broadcast(tabId)
  },

  /** Toggle ghost mode across all active sessions so every reader panel reacts. */
  async toggleGhostMode(enabled: boolean): Promise<void> {
    for (const [, session] of sessionManager.entries()) {
      session.fsm.dispatch({ type: 'TOGGLE_GHOST_MODE', enabled }, session.queue.length)
    }
    await broadcastPlaybackUpdated()
  },
}
