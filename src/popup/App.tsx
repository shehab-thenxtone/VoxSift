import { useEffect } from 'react'
import { usePlaybackState } from './hooks/usePlaybackState'
import { TransportControls } from './components/TransportControls'
import { SpeedSlider } from './components/SpeedSlider'
import { GhostModeToggle } from './components/GhostModeToggle'
import { StatusBadge } from './components/StatusBadge'
import { sendToBackground } from '../shared/messaging/send'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { initPlaybackChannel } from '../state/playbackStateChannel'

export function App() {
  const { status, progress, voice, ghostMode, error } = usePlaybackState()

  useEffect(() => {
    initPlaybackChannel()
  }, [])

  const handleExtractAndPlay = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return
    sendToBackground({ type: MESSAGE_TYPE.ExtractAndPlay, tabId: tab.id } as Parameters<typeof sendToBackground>[0])
  }

  const handleReadSelection = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return
    sendToBackground({ type: MESSAGE_TYPE.ReadSelection, tabId: tab.id } as Parameters<typeof sendToBackground>[0])
  }

  return (
    <main className="w-72 bg-surface text-text p-4 flex flex-col gap-4 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight">VoxSift</span>
        </div>
        <StatusBadge status={status} />
      </header>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="w-full h-0.5 bg-surface-raised rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* Transport */}
      <div className="flex flex-col items-center gap-3">
        <TransportControls status={status} />
        <SpeedSlider rate={voice.rate} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-error bg-error/5 px-3 py-2 rounded-md" role="alert">
          {error.message}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleExtractAndPlay}
          disabled={status === 'extracting'}
          className="w-full text-sm font-medium bg-accent text-white rounded-md py-2 hover:bg-accent-hover transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {status === 'extracting' ? 'Extracting…' : 'Read This Page'}
        </button>
        <button
          onClick={handleReadSelection}
          className="w-full text-sm text-text-muted hover:text-text rounded-md py-1.5 hover:bg-surface-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Read Selected Text
        </button>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-1 border-t border-surface-raised">
        <GhostModeToggle enabled={ghostMode} />
      </div>
    </main>
  )
}
