export interface VoiceDescriptor {
  /** Web Speech voiceURI or chrome.tts voiceName */
  id: string
  displayName: string
  lang: string
  engine: 'web-speech' | 'chrome-tts'
  localService: boolean
  /** Marked as one of our 5 curated built-ins */
  isBuiltIn: boolean
}

export interface VoiceConfig {
  voiceId: string
  /** 0.5–2.0 */
  rate: number
  /** 0.0–1.0 */
  pitch: number
  /** 0.0–1.0 */
  volume: number
  lang: string
}
