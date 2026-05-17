import type { SpeechSegment } from '../shared/types/content'
import type { VoiceConfig, VoiceDescriptor } from '../shared/types/voice'

export interface BoundaryEvent {
  segmentIndex: number
  charIndex: number
  charLength: number
}

export interface TtsEngine {
  readonly name: 'web-speech' | 'chrome-tts'
  isAvailable(): boolean
  getVoices(): Promise<VoiceDescriptor[]>
  speak(
    segments: SpeechSegment[],
    config: VoiceConfig,
    startIndex: number,
    onBoundary: (event: BoundaryEvent) => void,
    onEnd: () => void,
    onError: (error: string) => void,
  ): void
  /** Append segments to the live playlist; starts speaking if idle */
  appendSegments(segments: SpeechSegment[]): void
  pause(): void
  resume(): void
  cancel(): void
}
