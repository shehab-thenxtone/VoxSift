import { z } from 'zod'
import { DEFAULT_PREFERENCES } from '../shared/constants/defaults'

const voiceConfigSchema = z.object({
  voiceId: z.string(),
  rate: z.number().min(0.5).max(2.0),
  pitch: z.number().min(0).max(1),
  volume: z.number().min(0).max(1),
  lang: z.string(),
})

const preferencesSchema = z.object({
  voice: voiceConfigSchema,
  ghostModeDefault: z.boolean(),
  autoPlayOnExtract: z.boolean(),
  readerTheme: z.enum(['light', 'dark', 'system']),
  readerFontScale: z.number().min(0.85).max(1.5),
})

export const storageSchema = z.object({
  schemaVersion: z.number().int().min(1),
  preferences: preferencesSchema,
  session: z.unknown().nullable(),
  contentCache: z.record(z.string(), z.unknown()),
  contentCacheOrder: z.array(z.string()),
})

export const CURRENT_SCHEMA_VERSION = 1

export function getDefaultStorage() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    preferences: DEFAULT_PREFERENCES,
    session: null,
    contentCache: {},
    contentCacheOrder: [],
  }
}
