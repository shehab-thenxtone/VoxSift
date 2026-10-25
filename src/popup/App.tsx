import { useEffect } from 'react'
import { usePlaybackState } from './hooks/usePlaybackState'
import { TransportControls } from './components/TransportControls'
import { SpeedSlider } from './components/SpeedSlider'
import { GhostModeToggle } from './components/GhostModeToggle'
import { StatusBadge } from './components/StatusBadge'
import { sendToBackground } from '../shared/messaging/send'
import { MESSAGE_TYPE } from '../shared/types/messages'
import { initPlaybackChannel } from '../state/playbackStateChannel'

const RING_RADIUS = 16
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ExtractionRing({ progress }: { progress: number }) {
  const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)))
  const pct = Math.round(progress * 100)
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className="-rotate-90"
      aria-label={`Extracting ${pct}%`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <circle
        cx="20"
        cy="20"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="3"
        className="stroke-surface-raised"
      />
      <circle
        cx="20"
        cy="20"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        className="stroke-accent transition-[stroke-dashoffset] duration-300 ease-out"
      />
    </svg>
  )
}

function ExtractionButton({ extractionProgress }: { extractionProgress: number }) {
  return (
    <button
      disabled
      aria-busy="true"
      className="w-full flex items-center justify-center gap-2.5 text-sm font-medium bg-accent/10 text-accent rounded-lg py-2 cursor-not-allowed"
    >
      <ExtractionRing progress={extractionProgress} />
      <span className="tabular-nums">{Math.round(extractionProgress * 100)}%</span>
      <span className="text-text-muted text-xs">Extracting…</span>
    </button>
  )
}

export function App() {
  const { status, progress, extractionProgress, voice, ghostMode, error } = usePlaybackState()

  useEffect(() => {
    initPlaybackChannel()
  }, [])

  const handleExtractAndPlay = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return
    sendToBackground({ type: MESSAGE_TYPE.ExtractAndPlay, tabId: tab.id } as Parameters<
      typeof sendToBackground
    >[0])
  }

  const handleReadSelection = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return
    sendToBackground({ type: MESSAGE_TYPE.ReadSelection, tabId: tab.id } as Parameters<
      typeof sendToBackground
    >[0])
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

      {/* Playback progress bar */}
      {progress > 0 && status !== 'extracting' && (
        <div
          className="w-full h-0.5 bg-surface-raised rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
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
        <p
          className="text-xs text-error bg-error/5 px-3 py-2 rounded-lg border border-error/20"
          role="alert"
        >
          {error.message}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {status === 'extracting' ? (
          <ExtractionButton extractionProgress={extractionProgress} />
        ) : (
          <button
            onClick={handleExtractAndPlay}
            className="w-full text-sm font-medium bg-accent text-white rounded-lg py-2.5 hover:bg-accent-hover active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Read This Page
          </button>
        )}
        <button
          onClick={handleReadSelection}
          className="w-full text-sm text-text-muted hover:text-text rounded-lg py-2 hover:bg-surface-raised transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Read Selected Text
        </button>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <GhostModeToggle enabled={ghostMode} />
        <a
          href={chrome.runtime.getURL('privacy-policy.html')}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-muted hover:text-text transition-colors duration-150"
        >
          Privacy
        </a>
      </div>
    </main>
  )
}
