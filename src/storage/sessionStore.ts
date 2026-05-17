import type { PlaybackSnapshot } from '../shared/types/playback'
import { storageManager } from './storageManager'
import { debounce } from '../shared/utils/debounce'
import { LIMITS } from '../shared/constants/limits'

const persistDebounced = debounce(
  async (snapshot: PlaybackSnapshot) => {
    await storageManager.set('session', snapshot)
  },
  LIMITS.PERSIST_DEBOUNCE_MS,
)

export const sessionStore = {
  save: (snapshot: PlaybackSnapshot) => persistDebounced(snapshot),

  async load(): Promise<PlaybackSnapshot | null> {
    return storageManager.get('session')
  },

  async clear(): Promise<void> {
    await storageManager.set('session', null)
  },
}
