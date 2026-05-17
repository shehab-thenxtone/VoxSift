import type { VoiceConfig } from './voice'

export type PlaybackStatus =
  | 'idle'
  | 'extracting'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'error'

export interface PlaybackError {
  code: 'EXTRACTION_FAILED' | 'NO_VOICES' | 'TTS_ENGINE_ERROR' | 'TAB_GONE' | 'UNSUPPORTED_PAGE'
  message: string
  cause?: string
}

export interface PlaybackState {
  status: PlaybackStatus
  contentId: string | null
  tabId: number | null
  activeSegmentIndex: number
  activeSegmentId: string | null
  /** Char offset within the active segment for fine-grained resume */
  charOffsetInSegment: number
  /** 0–1 fraction of totalChars */
  progress: number
  /** 0–1 fraction of extraction completed; 0 when not extracting */
  extractionProgress: number
  voice: VoiceConfig
  ghostMode: boolean
  /** Monotonically increasing — surfaces drop stale broadcasts */
  revision: number
  updatedAt: number
  error: PlaybackError | null
}

/** Serialized form persisted to chrome.storage for SW-restart recovery */
export interface PlaybackSnapshot {
  state: PlaybackState
  contentRef: { id: string; tabId: number; url: string } | null
}
