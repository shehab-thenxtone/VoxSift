import type { TtsEngine, BoundaryEvent } from './engine'
import type { SpeechSegment } from '../shared/types/content'
import type { VoiceConfig, VoiceDescriptor } from '../shared/types/voice'
import { logger } from '../shared/utils/logger'

export class ChromeTtsEngine implements TtsEngine {
  readonly name = 'chrome-tts' as const

  private config: VoiceConfig | null = null
  private onBoundaryFn: ((e: BoundaryEvent) => void) | null = null
  private onEndFn: (() => void) | null = null
  private onErrorFn: ((e: string) => void) | null = null
  private totalQueued = 0
  private totalEnded = 0
  private active = false

  isAvailable(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.tts
  }

  async getVoices(): Promise<VoiceDescriptor[]> {
    return new Promise((resolve) => {
      chrome.tts.getVoices((voices) => {
        resolve(
          voices.map((v) => ({
            id: v.voiceName ?? '',
            displayName: v.voiceName ?? 'Unknown',
            lang: v.lang ?? 'en',
            engine: 'chrome-tts' as const,
            localService: true,
            isBuiltIn: false,
          })),
        )
      })
    })
  }

  speak(
    segments: SpeechSegment[],
    config: VoiceConfig,
    startIndex: number,
    onBoundary: (event: BoundaryEvent) => void,
    onEnd: () => void,
    onError: (error: string) => void,
  ): void {
    this.cancel()
    this.config = config
    this.onBoundaryFn = onBoundary
    this.onEndFn = onEnd
    this.onErrorFn = onError
    this.totalQueued = 0
    this.totalEnded = 0
    this.active = true

    const active = segments.slice(startIndex)
    active.forEach((seg, i) => {
      this.enqueueSegment(seg, startIndex + i, i > 0)
    })
  }

  appendSegments(segments: SpeechSegment[]): void {
    if (!this.config || !this.active) return
    const offset = this.totalQueued
    segments.forEach((seg, i) => {
      this.enqueueSegment(seg, offset + i, true)
    })
  }

  private enqueueSegment(seg: SpeechSegment, absoluteIndex: number, enqueue: boolean): void {
    this.totalQueued++
    const myCount = this.totalQueued

    chrome.tts.speak(seg.text, {
      rate: this.config!.rate,
      pitch: this.config!.pitch,
      volume: this.config!.volume,
      lang: this.config!.lang,
      voiceName: this.config!.voiceId || undefined,
      enqueue,
      onEvent: (event) => {
        if (event.type === 'start') {
          this.onBoundaryFn?.({ segmentIndex: absoluteIndex, charIndex: 0, charLength: 0 })
        }
        if (event.type === 'end') {
          this.totalEnded++
          if (this.active && this.totalEnded >= myCount && this.totalEnded >= this.totalQueued) {
            this.active = false
            this.onEndFn?.()
          }
        }
        if (event.type === 'error') {
          logger.error('chrome.tts error', event.errorMessage)
          this.onErrorFn?.(event.errorMessage ?? 'TTS error')
        }
      },
    })
  }

  pause(): void {
    chrome.tts.pause()
  }

  resume(): void {
    chrome.tts.resume()
  }

  cancel(): void {
    this.active = false
    this.totalQueued = 0
    this.totalEnded = 0
    chrome.tts.stop()
  }
}
