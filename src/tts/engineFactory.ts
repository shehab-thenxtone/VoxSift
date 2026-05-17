import type { TtsEngine } from './engine'
import { WebSpeechEngine } from './webSpeechEngine'
import { ChromeTtsEngine } from './chromeTtsEngine'

let _engine: TtsEngine | null = null

export function getTtsEngine(): TtsEngine {
  if (_engine) return _engine

  const web = new WebSpeechEngine()
  if (web.isAvailable()) {
    _engine = web
    return _engine
  }

  const chrome = new ChromeTtsEngine()
  if (chrome.isAvailable()) {
    _engine = chrome
    return _engine
  }

  throw new Error('No TTS engine available')
}
