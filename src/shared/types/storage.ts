import type { PlaybackSnapshot } from './playback'
import type { VoiceConfig } from './voice'
import type { ExtractedContent } from './content'

export interface StoredPreferences {
  voice: VoiceConfig
  ghostModeDefault: boolean
  autoPlayOnExtract: boolean
  readerTheme: 'light' | 'dark' | 'system'
  /** 0.85–1.5 */
  readerFontScale: number
}

export interface StorageSchema {
  schemaVersion: number
  preferences: StoredPreferences
  session: PlaybackSnapshot | null
  /** LRU cache keyed by ExtractedContent.id */
  contentCache: Record<string, ExtractedContent>
  /** Ordered list of cache keys — drives LRU eviction */
  contentCacheOrder: string[]
}

export type StorageKey = keyof StorageSchema
