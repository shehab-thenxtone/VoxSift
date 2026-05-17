import type { PlaybackState, PlaybackError } from '../shared/types/playback'
import type { VoiceConfig } from '../shared/types/voice'
import { DEFAULT_VOICE } from '../shared/constants/defaults'
import { assertNever } from '../shared/utils/assertNever'

type TransitionEvent =
  | { type: 'EXTRACT_AND_PLAY'; tabId: number; contentId: string }
  | { type: 'EXTRACT_COMPLETED' }
  | { type: 'EXTRACT_FAILED'; error: PlaybackError }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'SKIP_NEXT' }
  | { type: 'SKIP_PREV' }
  | { type: 'SEEK'; segmentIndex: number }
  | { type: 'BOUNDARY'; segmentIndex: number; segmentId: string; charOffsetInSegment: number }
  | { type: 'QUEUE_END' }
  | { type: 'SET_VOICE'; voice: VoiceConfig }
  | { type: 'SET_RATE'; rate: number }
  | { type: 'TOGGLE_GHOST_MODE'; enabled: boolean }
  | { type: 'RESET' }

export class PlaybackStateMachine {
  private state: PlaybackState

  constructor(initial?: Partial<PlaybackState>) {
    this.state = {
      status: 'idle',
      contentId: null,
      tabId: null,
      activeSegmentIndex: 0,
      activeSegmentId: null,
      charOffsetInSegment: 0,
      progress: 0,
      voice: DEFAULT_VOICE,
      ghostMode: false,
      revision: 0,
      updatedAt: Date.now(),
      error: null,
      ...initial,
    }
  }

  getState(): Readonly<PlaybackState> {
    return this.state
  }

  dispatch(event: TransitionEvent, totalSegments?: number): Readonly<PlaybackState> {
    const prev = this.state
    const next = this.reduce(prev, event, totalSegments)
    if (next !== prev) {
      this.state = { ...next, revision: prev.revision + 1, updatedAt: Date.now() }
    }
    return this.state
  }

  private reduce(
    s: PlaybackState,
    event: TransitionEvent,
    totalSegments = 0,
  ): PlaybackState {
    switch (event.type) {
      case 'EXTRACT_AND_PLAY':
        return {
          ...s,
          status: 'extracting',
          contentId: event.contentId,
          tabId: event.tabId,
          activeSegmentIndex: 0,
          activeSegmentId: null,
          charOffsetInSegment: 0,
          progress: 0,
          error: null,
        }

      case 'EXTRACT_COMPLETED':
        if (s.status !== 'extracting') return s
        return { ...s, status: 'ready' }

      case 'EXTRACT_FAILED':
        if (s.status !== 'extracting') return s
        return { ...s, status: 'error', error: event.error }

      case 'PLAY': {
        if (s.status === 'ready' || s.status === 'stopped') return { ...s, status: 'playing' }
        if (s.status === 'paused') return { ...s, status: 'playing' }
        return s
      }

      case 'PAUSE':
        if (s.status !== 'playing') return s
        return { ...s, status: 'paused' }

      case 'STOP':
        if (!['playing', 'paused', 'ready', 'extracting'].includes(s.status)) return s
        return { ...s, status: 'stopped' }

      case 'SKIP_NEXT': {
        const next = Math.min(s.activeSegmentIndex + 1, totalSegments - 1)
        return { ...s, activeSegmentIndex: next, charOffsetInSegment: 0 }
      }

      case 'SKIP_PREV': {
        const prev = Math.max(s.activeSegmentIndex - 1, 0)
        return { ...s, activeSegmentIndex: prev, charOffsetInSegment: 0 }
      }

      case 'SEEK':
        return {
          ...s,
          activeSegmentIndex: Math.max(0, Math.min(event.segmentIndex, totalSegments - 1)),
          charOffsetInSegment: 0,
        }

      case 'BOUNDARY':
        return {
          ...s,
          activeSegmentIndex: event.segmentIndex,
          activeSegmentId: event.segmentId,
          charOffsetInSegment: event.charOffsetInSegment,
          progress: totalSegments > 0 ? event.segmentIndex / totalSegments : 0,
        }

      case 'QUEUE_END':
        return { ...s, status: 'stopped', progress: 1, activeSegmentIndex: 0, charOffsetInSegment: 0 }

      case 'SET_VOICE':
        return { ...s, voice: event.voice }

      case 'SET_RATE':
        return { ...s, voice: { ...s.voice, rate: event.rate } }

      case 'TOGGLE_GHOST_MODE':
        return { ...s, ghostMode: event.enabled }

      case 'RESET':
        return { ...s, status: 'idle', error: null, contentId: null, tabId: null, progress: 0 }

      default:
        return assertNever(event)
    }
  }
}
