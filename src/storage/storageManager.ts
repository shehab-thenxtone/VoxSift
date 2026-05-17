import type { StorageKey, StorageSchema } from '../shared/types/storage'
import type { ExtractedContent } from '../shared/types/content'
import { CURRENT_SCHEMA_VERSION, getDefaultStorage } from './schema'
import { runMigrations } from './migrations'
import { LIMITS } from '../shared/constants/limits'
import { logger } from '../shared/utils/logger'

async function readAll(): Promise<StorageSchema> {
  const defaults = getDefaultStorage()
  const raw = await chrome.storage.local.get(null)

  if (!raw['schemaVersion']) return defaults as StorageSchema

  const fromVersion = raw['schemaVersion'] as number
  const migrated = fromVersion < CURRENT_SCHEMA_VERSION
    ? runMigrations(raw, fromVersion, CURRENT_SCHEMA_VERSION)
    : raw

  return { ...defaults, ...migrated } as StorageSchema
}

export const storageManager = {
  async get<K extends StorageKey>(key: K): Promise<StorageSchema[K]> {
    const all = await readAll()
    return all[key]
  },

  async set<K extends StorageKey>(key: K, value: StorageSchema[K]): Promise<void> {
    await chrome.storage.local.set({ [key]: value })
  },

  async patch<K extends StorageKey>(
    key: K,
    updater: (current: StorageSchema[K]) => StorageSchema[K],
  ): Promise<void> {
    const current = await this.get(key)
    await this.set(key, updater(current))
  },

  async cacheContent(content: ExtractedContent): Promise<void> {
    const [cache, order] = await Promise.all([
      this.get('contentCache'),
      this.get('contentCacheOrder'),
    ])

    const newCache = { ...cache, [content.id]: content }
    let newOrder = order.filter((id) => id !== content.id)
    newOrder = [content.id, ...newOrder]

    // LRU eviction
    while (newOrder.length > LIMITS.MAX_CONTENT_CACHE_ENTRIES) {
      const evicted = newOrder.pop()!
      delete newCache[evicted]
    }

    await chrome.storage.local.set({
      contentCache: newCache,
      contentCacheOrder: newOrder,
    })
  },

  async getCachedContent(id: string): Promise<ExtractedContent | null> {
    const cache = await this.get('contentCache')
    return (cache[id] as ExtractedContent | undefined) ?? null
  },

  async clearAll(): Promise<void> {
    await chrome.storage.local.clear()
    logger.info('Storage cleared')
  },
}
