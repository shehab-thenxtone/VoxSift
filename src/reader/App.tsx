import { useState, useEffect } from 'react'
import { usePlaybackState } from './hooks/usePlaybackState'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { ArticleBody } from './components/ArticleBody'
import { initPlaybackChannel } from '../state/playbackStateChannel'
import { sendToBackground } from '../shared/messaging/send'
import { MESSAGE_TYPE } from '../shared/types/messages'
import type { ExtractedContent } from '../shared/types/content'

interface Props {
  content: ExtractedContent
  shadowRoot: ShadowRoot
}

export function ReaderApp({ content }: Props) {
  const { status, progress, activeSegmentId, ghostMode } = usePlaybackState()
  const containerRef = useAutoScroll(activeSegmentId)
  useKeyboardShortcuts()
  const [collapsed, setCollapsed] = useState(false)
  const [rate, setRate] = useState(1.0)

  useEffect(() => {
    initPlaybackChannel()
  }, [])

  // Ghost mode controls panel visibility in both directions.
  // Turning ghost mode off (e.g. from the popup) reopens the panel.
  useEffect(() => {
    setCollapsed(ghostMode)
  }, [ghostMode])

  const isPlaying = status === 'playing'

  const handleExpand = () => {
    setCollapsed(false)
    if (ghostMode) {
      sendToBackground({ type: MESSAGE_TYPE.ToggleGhostMode, enabled: false } as Parameters<
        typeof sendToBackground
      >[0])
    }
  }

  if (collapsed) {
    return (
      <div className="vs-tab">
        <button className="vs-tab-btn" onClick={handleExpand} aria-label="Open VoxSift reader">
          VoxSift
        </button>
      </div>
    )
  }

  return (
    <div
      className="vs-panel"
      role="dialog"
      aria-modal="true"
      aria-label={`Reading: ${content.title}`}
    >
      <header className="vs-header">
        <div className="vs-title-row">
          <p className="vs-title">{content.title}</p>
          <button
            className="vs-minimize-btn"
            onClick={() => setCollapsed(true)}
            aria-label="Minimize reader"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        {content.byline && <p className="vs-byline">{content.byline}</p>}
        <div
          className="vs-progress"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="vs-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="vs-controls">
          <div className="vs-transport">
            <button
              className="vs-icon-btn"
              onClick={() =>
                sendToBackground({ type: MESSAGE_TYPE.SkipPrev } as Parameters<
                  typeof sendToBackground
                >[0])
              }
              aria-label="Previous sentence"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 6h2v12H6V6zm3.5 6L18 18V6L9.5 12z" />
              </svg>
            </button>
            <button
              className="vs-play-btn"
              onClick={() =>
                sendToBackground({
                  type: isPlaying ? MESSAGE_TYPE.Pause : MESSAGE_TYPE.Play,
                } as Parameters<typeof sendToBackground>[0])
              }
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              className="vs-icon-btn"
              onClick={() =>
                sendToBackground({ type: MESSAGE_TYPE.SkipNext } as Parameters<
                  typeof sendToBackground
                >[0])
              }
              aria-label="Next sentence"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 18l8.5-6L6 6v12zm2.5-6L17.5 18V6L8.5 12z" />
              </svg>
            </button>
          </div>
          <div className="vs-speed">
            <input
              className="vs-slider"
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={rate}
              onChange={(e) => {
                const r = parseFloat(e.target.value)
                setRate(r)
                sendToBackground({ type: MESSAGE_TYPE.SetRate, rate: r } as Parameters<
                  typeof sendToBackground
                >[0])
              }}
              aria-label="Playback speed"
            />
            <span className="vs-speed-label">{rate.toFixed(1)}×</span>
          </div>
        </div>
      </header>

      <div className="vs-content">
        <ArticleBody
          segments={content.segments}
          activeSegmentId={activeSegmentId}
          containerRef={containerRef as React.RefObject<HTMLDivElement>}
        />
      </div>
    </div>
  )
}
