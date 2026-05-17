import { create } from 'zustand'
import type { PlaybackState } from '../shared/types/playback'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { sendToBackground } from '../shared/messaging/send'
import { logger } from '../shared/utils/logger'

interface PlaybackStore extends PlaybackState {
  _lastRevision: number
  setFromBroadcast: (state: PlaybackState) => void
}

const defaultState: PlaybackState = {
  status: 'idle',
  contentId: null,
  tabId: null,
  activeSegmentIndex: 0,
  activeSegmentId: null,
  charOffsetInSegment: 0,
  progress: 0,
  extractionProgress: 0,
  voice: { voiceId: '', rate: 1, pitch: 1, volume: 1, lang: 'en-US' },
  ghostMode: false,
  revision: -1,
  updatedAt: 0,
  error: null,
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  ...defaultState,
  _lastRevision: -1,

  setFromBroadcast: (incoming: PlaybackState) => {
    if (incoming.revision <= get()._lastRevision) return
    set({ ...incoming, _lastRevision: incoming.revision })
  },
}))

/** Initialize by fetching current state and subscribing to broadcasts. */
export async function initPlaybackChannel(): Promise<void> {
  try {
    const res = await sendToBackground<PlaybackState>({
      type: MESSAGE_TYPE.GetPlaybackState,
    } as Parameters<typeof sendToBackground>[0])

    if (res.ok) {
      usePlaybackStore.getState().setFromBroadcast(res.data)
    }
  } catch (e) {
    logger.warn('Failed to init playback channel', e)
  }

  // Listen for broadcasts from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === MESSAGE_TYPE.PlaybackUpdated) {
      usePlaybackStore.getState().setFromBroadcast(msg.state as PlaybackState)
    }
  })

  // Also listen for events forwarded from content script
  window.addEventListener('voxsift:playback', (e: Event) => {
    usePlaybackStore.getState().setFromBroadcast((e as CustomEvent<PlaybackState>).detail)
  })
}
