import type { Message, MessageResponse } from '../types/messages'
import { genReqId } from '../utils/id'

function buildMessage<T extends Omit<Message, 'reqId' | 'ts'>>(
  payload: T,
): T & { reqId: string; ts: number } {
  return { ...payload, reqId: genReqId(), ts: Date.now() } as T & { reqId: string; ts: number }
}

/** Send a message to the background service worker. */
export function sendToBackground<Res = unknown>(
  payload: Omit<Message, 'reqId' | 'ts'>,
): Promise<MessageResponse<Res>> {
  const msg = buildMessage(payload)
  return chrome.runtime.sendMessage(msg)
}

/** Send a message to a specific tab's content script. */
export function sendToTab<Res = unknown>(
  tabId: number,
  payload: Omit<Message, 'reqId' | 'ts'>,
): Promise<MessageResponse<Res>> {
  const msg = buildMessage(payload)
  return chrome.tabs.sendMessage(tabId, msg)
}
