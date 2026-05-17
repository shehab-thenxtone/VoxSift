import { useDraggable } from '../hooks/useDraggable'
import { useMiniPlayerStore } from '../state/miniPlayerStore'
import { usePlaybackState } from '../hooks/usePlaybackState'
import { sendToBackground } from '../../shared/messaging/send'
import { MESSAGE_TYPE } from '../../shared/types/messages'
import { Button } from '../../ui/Button'

export function MiniPlayerShell() {
  const { onPointerDown, onPointerMove, onPointerUp, position } = useDraggable()
  const { minimized, toggleMinimized } = useMiniPlayerStore()
  const { status, progress, voice } = usePlaybackState()

  const isPlaying = status === 'playing'

  const send = (type: string) =>
    sendToBackground({ type } as Parameters<typeof sendToBackground>[0])

  return (
    <div
      style={{
        position: 'fixed',
        transform: `translate(${position.x}px, ${position.y}px)`,
        top: 0,
        left: 0,
        zIndex: 2147483646,
        willChange: 'transform',
      }}
      className="animate-fade-in"
    >
      <div
        className={`bg-surface-dark text-text-dark shadow-lg rounded-lg overflow-hidden transition-all ${
          minimized ? 'w-12 h-12' : 'w-48'
        }`}
      >
        {minimized ? (
          <button
            onClick={toggleMinimized}
            className="w-full h-full flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Expand mini player"
          >
            <span className="text-accent text-xs font-bold">VS</span>
          </button>
        ) : (
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="cursor-grab active:cursor-grabbing"
          >
            {/* Progress bar */}
            <div className="h-0.5 bg-white/10">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-0.5 px-2 py-1.5">
              <Button
                variant="icon"
                size="sm"
                aria-label="Previous"
                onClick={(e) => { e.stopPropagation(); send(MESSAGE_TYPE.SkipPrev) }}
                className="text-text-dark hover:text-accent"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h1.5v4.5L13 3v10L4.5 8.5V13H3z" /></svg>
              </Button>

              <Button
                variant="icon"
                size="sm"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                onClick={(e) => { e.stopPropagation(); send(isPlaying ? MESSAGE_TYPE.Pause : MESSAGE_TYPE.Play) }}
                className="text-text-dark hover:text-accent"
              >
                {isPlaying
                  ? <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="4" height="10" rx="1" /><rect x="9" y="3" width="4" height="10" rx="1" /></svg>
                  : <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5l10 5.5-10 5.5z" /></svg>
                }
              </Button>

              <Button
                variant="icon"
                size="sm"
                aria-label="Next"
                onClick={(e) => { e.stopPropagation(); send(MESSAGE_TYPE.SkipNext) }}
                className="text-text-dark hover:text-accent"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13 3h-1.5v4.5L3 3v10l8.5-4.5V13H13z" /></svg>
              </Button>

              <span className="text-xs text-text-muted-dark ml-auto font-mono">{voice.rate.toFixed(1)}×</span>

              <Button
                variant="icon"
                size="sm"
                aria-label="Minimize"
                onClick={(e) => { e.stopPropagation(); toggleMinimized() }}
                className="text-text-dark hover:text-accent"
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="7.5" width="12" height="1.5" rx="0.75" /></svg>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
