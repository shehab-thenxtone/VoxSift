import { setupMessageListener, registerMountHandlers } from './messageBridge'
import { watchSelection } from './selectionWatcher'
import { logger } from '../shared/utils/logger'

logger.info('Content script loaded', location.href)

// Lazy-load heavy mounts to avoid blocking page load
async function setupMounts() {
  const [readerModule, miniPlayerModule] = await Promise.all([
    import('./readerMount'),
    import('./miniPlayerMount'),
  ])

  registerMountHandlers({
    mountReader: readerModule.mountReader,
    unmountReader: readerModule.unmountReader,
    mountMiniPlayer: miniPlayerModule.mountMiniPlayer,
    unmountMiniPlayer: miniPlayerModule.unmountMiniPlayer,
    highlightSegment: readerModule.highlightActiveSegment,
  })
}

setupMessageListener()
setupMounts().catch((e) => logger.error('Mount setup failed', e))

// Track text selection for "Read Selected Text" feature
watchSelection((hasSelection, _text) => {
  logger.debug('Selection changed, hasSelection:', hasSelection)
})
