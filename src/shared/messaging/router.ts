import type { Message, MessageType, MessageResponse } from '../types/messages'
import { logger } from '../utils/logger'

type Handler<M extends Message> = (
  msg: M,
  sender: chrome.runtime.MessageSender,
) => Promise<MessageResponse> | MessageResponse

type HandlerMap = Partial<{ [K in MessageType]: Handler<Extract<Message, { type: K }>> }>

export function createRouter(handlers: HandlerMap) {
  return (
    msg: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (r: MessageResponse) => void,
  ): boolean => {
    const handler = handlers[msg.type as MessageType] as Handler<Message> | undefined
    if (!handler) return false

    const result = handler(msg, sender)
    if (result instanceof Promise) {
      result
        .then(sendResponse)
        .catch((e: unknown) => {
          logger.error('Handler error', msg.type, e)
          sendResponse({ ok: false, reqId: msg.reqId, error: { code: 'INTERNAL', message: String(e) } })
        })
      return true // keeps the message channel open for async response
    }
    sendResponse(result)
    return false
  }
}
