/**
 * Offscreen document — hosts speechSynthesis since it's unavailable in MV3 service workers.
 * All messages to/from the SW are forwarded through chrome.runtime.sendMessage.
 */
import { WebSpeechEngine } from '../tts/webSpeechEngine'
import type { SpeechSegment } from '../shared/types/content'
import type { VoiceConfig } from '../shared/types/voice'
import { logger } from '../shared/utils/logger'

const engine = new WebSpeechEngine()

interface SpeakPayload {
  segments: SpeechSegment[]
  config: VoiceConfig
  startIndex: number
}

chrome.runtime.onMessage.addListener((msg: { target?: string; type: string; payload?: unknown }) => {
  if (msg.target !== 'offscreen') return

  switch (msg.type) {
    case 'speak': {
      const { segments, config, startIndex } = msg.payload as SpeakPayload
      engine.speak(
        segments,
        config,
        startIndex,
        (boundary) => {
          chrome.runtime.sendMessage({ type: 'offscreen/boundary', boundary })
        },
        () => {
          chrome.runtime.sendMessage({ type: 'offscreen/end' })
        },
        (error) => {
          logger.error('Offscreen TTS error', error)
          chrome.runtime.sendMessage({ type: 'offscreen/error', error })
        },
      )
      break
    }
    case 'pause':
      engine.pause()
      break
    case 'resume':
      engine.resume()
      break
    case 'cancel':
      engine.cancel()
      break
    case 'getVoices':
      engine.getVoices().then((voices) => {
        chrome.runtime.sendMessage({ type: 'offscreen/voices', voices })
      })
      break
  }
})

logger.info('Offscreen document ready')
