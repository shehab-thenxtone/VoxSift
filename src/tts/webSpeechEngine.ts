import type { TtsEngine, BoundaryEvent } from './engine'
import type { SpeechSegment } from '../shared/types/content'
import type { VoiceConfig, VoiceDescriptor } from '../shared/types/voice'
import { buildVoiceCatalog } from './voiceCatalog'
import { resolveSegmentAtChar } from './boundaryTracker'
import { logger } from '../shared/utils/logger'

export class WebSpeechEngine implements TtsEngine {
  readonly name = 'web-speech' as const

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

    // Concatenate segments into one utterance per paragraph for continuous speech
    const activeSegments = segments.slice(startIndex)
    const fullText = activeSegments.map((s) => s.text).join(' ')

    const utter = new SpeechSynthesisUtterance(fullText)
    utter.rate = config.rate
    utter.pitch = config.pitch
    utter.volume = config.volume
    utter.lang = config.lang

    if (config.voiceId) {
      const voice = speechSynthesis.getVoices().find((v) => v.voiceURI === config.voiceId)
      if (voice) utter.voice = voice
    }

    utter.onboundary = (e) => {
      const resolved = resolveSegmentAtChar(activeSegments, e.charIndex)
      if (resolved) {
        onBoundary({
          segmentIndex: startIndex + resolved.segmentIndex,
          charIndex: e.charIndex,
          charLength: e.charLength,
        })
      }
    }

    utter.onend = onEnd
    utter.onerror = (e) => {
      if (e.error !== 'interrupted') {
        logger.error('SpeechSynthesis error', e.error)
        onError(e.error)
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
    speechSynthesis.cancel()
  }
}
