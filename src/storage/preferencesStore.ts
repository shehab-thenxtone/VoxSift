import type { StoredPreferences } from '../shared/types/storage'
import type { VoiceConfig } from '../shared/types/voice'
import { storageManager } from './storageManager'

export const preferencesStore = {
  async load(): Promise<StoredPreferences> {
    return storageManager.get('preferences')
  },

  async setVoice(voice: VoiceConfig): Promise<void> {
    await storageManager.patch('preferences', (p) => ({ ...p, voice }))
  },

  async setTheme(theme: StoredPreferences['readerTheme']): Promise<void> {
    await storageManager.patch('preferences', (p) => ({ ...p, readerTheme: theme }))
  },

  async setFontScale(scale: number): Promise<void> {
    await storageManager.patch('preferences', (p) => ({ ...p, readerFontScale: scale }))
  },

  async setGhostModeDefault(enabled: boolean): Promise<void> {
    await storageManager.patch('preferences', (p) => ({ ...p, ghostModeDefault: enabled }))
  },
}
