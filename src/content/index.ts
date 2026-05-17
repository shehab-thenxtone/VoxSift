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

// Guard against double-initialisation when the background re-injects this
// script into a tab that pre-dates the extension install.
const _g = globalThis as Record<string, unknown>
if (!_g.__voxsift_init) {
  _g.__voxsift_init = true
  setupMessageListener()
  setupMounts().catch((e) => logger.error('Mount setup failed', e))
  watchSelection((hasSelection, _text) => {
    logger.debug('Selection changed, hasSelection:', hasSelection)
  })
}
