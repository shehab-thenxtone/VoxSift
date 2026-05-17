import { handleMessage, handleKeyboardShortcut } from './messageHandlers'
import { recoverSession } from './recovery'
import { startKeepalive, handleKeepaliveAlarm } from './keepalive'
import type { Message } from '../shared/types/messages'
import { logger } from '../shared/utils/logger'

// --- Startup ---
logger.info('Background SW started')
startKeepalive()
recoverSession().catch((e) => logger.error('Recovery failed', e))

// --- Message router ---
chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  handleMessage(msg, sender)
    .then(sendResponse)
    .catch((e) => {
      logger.error('Handler threw', e)
      sendResponse({ ok: false, reqId: msg.reqId, error: { code: 'INTERNAL', message: String(e) } })
    })
  return true // keep channel open for async
})

// --- Keepalive alarm ---
chrome.alarms.onAlarm.addListener((alarm) => {
  if (handleKeepaliveAlarm(alarm)) {
    logger.debug('Keepalive tick')
  }
})

// --- Keyboard shortcut ---
chrome.commands.onCommand.addListener((command) => {
  if (command !== 'activate-reading') return
  chrome.tabs
    .query({ active: true, currentWindow: true })
    .then(([tab]) => {
      if (tab?.id) return handleKeyboardShortcut(tab.id)
    })
    .catch((e) => logger.error('Shortcut handler failed', e))
})

// --- Long-lived port connections (keeps SW alive during playback) ---
chrome.runtime.onConnect.addListener((port) => {
  logger.debug('Port connected', port.name)
  port.onMessage.addListener((msg) => {
    if (msg.type === 'ping') port.postMessage({ type: 'pong' })
  })
  port.onDisconnect.addListener(() => {
    logger.debug('Port disconnected', port.name)
  })
})
