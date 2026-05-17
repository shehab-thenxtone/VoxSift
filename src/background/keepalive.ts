import { LIMITS } from '../shared/constants/limits'
import { logger } from '../shared/utils/logger'

const ALARM_NAME = 'voxsift-keepalive'

export function startKeepalive(): void {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: LIMITS.KEEPALIVE_ALARM_PERIOD_MIN,
  })
  logger.debug('Keepalive alarm started')
}

export function stopKeepalive(): void {
  chrome.alarms.clear(ALARM_NAME)
  logger.debug('Keepalive alarm stopped')
}

/** Call this in the alarms.onAlarm listener to respond to keepalive ticks. */
export function handleKeepaliveAlarm(alarm: chrome.alarms.Alarm): boolean {
  return alarm.name === ALARM_NAME
}
