import type { TtsEngine, BoundaryEvent } from './engine'
import type { SpeechSegment } from '../shared/types/content'
import type { VoiceConfig, VoiceDescriptor } from '../shared/types/voice'
import { logger } from '../shared/utils/logger'

export class ChromeTtsEngine implements TtsEngine {
  readonly name = 'chrome-tts' as const

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

    const activeSegments = segments.slice(startIndex)
    const fullText = activeSegments.map((s) => s.text).join(' ')

    chrome.tts.speak(fullText, {
      rate: config.rate,
      pitch: config.pitch,
      volume: config.volume,
      lang: config.lang,
      voiceName: config.voiceId || undefined,
      onEvent: (event) => {
        if (event.type === 'word' && event.charIndex !== undefined) {
          onBoundary({ segmentIndex: startIndex, charIndex: event.charIndex, charLength: 0 })
        }
        if (event.type === 'end') {
          onEnd()
        }
        if (event.type === 'error') {
          logger.error('chrome.tts error', event.errorMessage)
          onError(event.errorMessage ?? 'TTS error')
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
    chrome.tts.stop()
  }
}
