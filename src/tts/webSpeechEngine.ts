import type { TtsEngine, BoundaryEvent } from './engine'
import type { SpeechSegment } from '../shared/types/content'
import type { VoiceConfig, VoiceDescriptor } from '../shared/types/voice'
import { buildVoiceCatalog } from './voiceCatalog'
import { logger } from '../shared/utils/logger'

interface UtteranceItem {
  segment: SpeechSegment
  absoluteIndex: number
}

export class WebSpeechEngine implements TtsEngine {
  readonly name = 'web-speech' as const

  private playlist: UtteranceItem[] = []
  private currentIdx = 0
  private config: VoiceConfig | null = null
  private onBoundaryFn: ((e: BoundaryEvent) => void) | null = null
  private onEndFn: (() => void) | null = null
  private onErrorFn: ((e: string) => void) | null = null
  private active = false

  isAvailable(): boolean {
    return typeof speechSynthesis !== 'undefined'
  }

  async getVoices(): Promise<VoiceDescriptor[]> {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        resolve(buildVoiceCatalog(voices))
        return
      }
      speechSynthesis.onvoiceschanged = () => {
        resolve(buildVoiceCatalog(speechSynthesis.getVoices()))
      }
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

    const active = segments.slice(startIndex)
    this.playlist = active.map((seg, i) => ({ segment: seg, absoluteIndex: startIndex + i }))
    this.currentIdx = 0
    this.active = true
    this.speakCurrent()
  }

  appendSegments(segments: SpeechSegment[]): void {
    if (!this.config) return
    const lastAbsolute =
      this.playlist.length > 0 ? this.playlist[this.playlist.length - 1]!.absoluteIndex + 1 : 0
    const items: UtteranceItem[] = segments.map((seg, i) => ({
      segment: seg,
      absoluteIndex: lastAbsolute + i,
    }))
    this.playlist.push(...items)

    // Resume if we ran out of playlist but are still logically active
    if (this.active && this.currentIdx >= this.playlist.length - items.length) {
      this.speakCurrent()
    }
  }

  private makeUtterance(item: UtteranceItem): SpeechSynthesisUtterance {
    const utter = new SpeechSynthesisUtterance(item.segment.text)
    const cfg = this.config!
    utter.rate = cfg.rate
    utter.pitch = cfg.pitch
    utter.volume = cfg.volume
    utter.lang = cfg.lang
    if (cfg.voiceId) {
      const voice = speechSynthesis.getVoices().find((v) => v.voiceURI === cfg.voiceId)
      if (voice) utter.voice = voice
    }
    return utter
  }

  private speakCurrent(): void {
    if (!this.active || this.currentIdx >= this.playlist.length) {
      if (this.active) {
        this.active = false
        this.onEndFn?.()
      }
      return
    }

    const item = this.playlist[this.currentIdx]!
    this.onBoundaryFn?.({ segmentIndex: item.absoluteIndex, charIndex: 0, charLength: 0 })

    const utter = this.makeUtterance(item)
    utter.onend = () => {
      this.currentIdx++
      this.speakCurrent()
    }
    utter.onerror = (e) => {
      if (e.error !== 'interrupted') {
        logger.error('SpeechSynthesis error', e.error)
        this.onErrorFn?.(e.error)
      }
    }
    speechSynthesis.speak(utter)
  }

  pause(): void {
    speechSynthesis.pause()
  }

  resume(): void {
    speechSynthesis.resume()
  }

  cancel(): void {
    this.active = false
    this.playlist = []
    this.currentIdx = 0
    speechSynthesis.cancel()
  }
}
