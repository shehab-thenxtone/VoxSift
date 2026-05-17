import { sessionManager } from './sessionManager'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { genReqId } from '../shared/utils/id'
import { logger } from '../shared/utils/logger'

/** Send each tab its own session state; send popup the active session state. */
export async function broadcastPlaybackUpdated(): Promise<void> {
  const ts = Date.now()

  for (const [tabId, session] of sessionManager.entries()) {
    const msg = {
      type: MESSAGE_TYPE.PlaybackUpdated,
      reqId: genReqId(),
      ts,
      state: session.fsm.getState(),
    }
    chrome.tabs.sendMessage(tabId, msg).catch(() => {})
  }

  const activeState = sessionManager.getActive()?.fsm.getState()
  if (activeState) {
    chrome.runtime
      .sendMessage({
        type: MESSAGE_TYPE.PlaybackUpdated,
        reqId: genReqId(),
        ts,
        state: activeState,
      })
      .catch(() => {})
  }

  logger.debug('Broadcast PlaybackUpdated, active tab:', sessionManager.getActiveTabId())
}
