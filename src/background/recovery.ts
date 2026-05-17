import type { PlaybackSnapshot } from '../shared/types/playback'
import { sessionStore } from '../storage/sessionStore'
import { logger } from '../shared/utils/logger'

/**
 * On SW startup, restore last known state.
 * Forces status to 'paused' if it was 'playing' — user resumes manually.
 */
export async function recoverSession(): Promise<PlaybackSnapshot | null> {
  const snapshot = await sessionStore.load()
  if (!snapshot) return null

  if (snapshot.state.status === 'playing') {
    snapshot.state = { ...snapshot.state, status: 'paused' }
  }

  logger.info('Session recovered', snapshot.state.status, snapshot.contentRef?.url)
  return snapshot
}
