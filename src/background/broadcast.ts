import type { PlaybackState } from '../shared/types/playback'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { genReqId } from '../shared/utils/id'
import { logger } from '../shared/utils/logger'

/** Fan-out PlaybackUpdated to all extension surfaces. */
export async function broadcastPlaybackUpdated(state: PlaybackState): Promise<void> {
  const msg = {
    type: MESSAGE_TYPE.PlaybackUpdated,
    reqId: genReqId(),
    ts: Date.now(),
    state,
  }

  // Broadcast to all tabs via scripting API
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (!tab.id) continue
    chrome.tabs.sendMessage(tab.id, msg).catch(() => {
      // Tab may not have content script — ignore
    })
  }

  // Broadcast to popup and other extension pages
  chrome.runtime.sendMessage(msg).catch(() => {
    // Popup may be closed — ignore
  })

  logger.debug('Broadcast PlaybackUpdated rev', state.revision)
}
