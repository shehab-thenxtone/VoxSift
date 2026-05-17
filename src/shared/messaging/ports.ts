import { logger } from '../utils/logger'

export const PORT_NAMES = {
  Playback: 'voxsift-playback',
} as const

/** Opens a long-lived port to the background SW and pings it periodically. */
export function openKeepalivePort(
  name: string,
  pingIntervalMs: number,
  onDisconnect?: () => void,
): chrome.runtime.Port {
  const port = chrome.runtime.connect({ name })
  const timer = setInterval(() => port.postMessage({ type: 'ping' }), pingIntervalMs)

  port.onDisconnect.addListener(() => {
    clearInterval(timer)
    logger.debug('Port disconnected', name)
    onDisconnect?.()
  })

  return port
}
