import { Button } from '../../ui/Button'
import { sendToBackground } from '../../shared/messaging/send'
import { MESSAGE_TYPE } from '../../shared/types/messages'
import type { PlaybackStatus } from '../../shared/types/playback'

interface Props {
  status: PlaybackStatus
}

export function TransportControls({ status }: Props) {
  const send = (type: string) =>
    sendToBackground({ type } as Parameters<typeof sendToBackground>[0])

  const isPlaying = status === 'playing'
  const canPlay = ['ready', 'paused', 'stopped'].includes(status)

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Playback controls">
      <Button
        variant="icon"
        size="md"
        aria-label="Previous"
        onClick={() => send(MESSAGE_TYPE.SkipPrev)}
        disabled={!canPlay && !isPlaying}
        title="Previous sentence"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 3h1.5v4.5L13 3v10L4.5 8.5V13H3z" />
        </svg>
      </Button>

      <Button
        variant="primary"
        size="md"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={() => send(isPlaying ? MESSAGE_TYPE.Pause : MESSAGE_TYPE.Play)}
        disabled={status === 'idle' || status === 'extracting' || status === 'error'}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="4" height="10" rx="1" />
            <rect x="9" y="3" width="4" height="10" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2.5l10 5.5-10 5.5z" />
          </svg>
        )}
      </Button>

      <Button
        variant="icon"
        size="md"
        aria-label="Stop"
        onClick={() => send(MESSAGE_TYPE.Stop)}
        disabled={!isPlaying && status !== 'paused'}
        title="Stop"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="3" y="3" width="10" height="10" rx="1.5" />
        </svg>
      </Button>

      <Button
        variant="icon"
        size="md"
        aria-label="Next"
        onClick={() => send(MESSAGE_TYPE.SkipNext)}
        disabled={!canPlay && !isPlaying}
        title="Next sentence"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13 3h-1.5v4.5L3 3v10l8.5-4.5V13H13z" />
        </svg>
      </Button>
    </div>
  )
}
