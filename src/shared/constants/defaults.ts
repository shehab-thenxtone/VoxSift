import type { VoiceConfig } from '../types/voice'
import type { StoredPreferences } from '../types/storage'

export const DEFAULT_VOICE: VoiceConfig = {
  voiceId: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  lang: 'en-US',
}

export const DEFAULT_PREFERENCES: StoredPreferences = {
  voice: DEFAULT_VOICE,
  ghostModeDefault: false,
  autoPlayOnExtract: true,
  readerTheme: 'system',
  readerFontScale: 1.0,
}

export const BUILTIN_VOICE_LABELS = [
  'Neutral',
  'Warm Female',
  'Warm Male',
  'Energetic Female',
  'Calm Male',
] as const
