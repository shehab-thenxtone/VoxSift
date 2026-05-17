import { Button } from '../../ui/Button'
import { Slider } from '../../ui/Slider'
import { sendToBackground } from '../../shared/messaging/send'
import { MESSAGE_TYPE } from '../../shared/types/messages'
import type { PlaybackStatus } from '../../shared/types/playback'
import type { VoiceConfig } from '../../shared/types/voice'

interface Props {
  status: PlaybackStatus
  voice: VoiceConfig
  onClose: () => void
}

export function ReaderControls({ status, voice, onClose }: Props) {
  const isPlaying = status === 'playing'
  const send = (type: string) =>
    sendToBackground({ type } as Parameters<typeof sendToBackground>[0])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1" role="group" aria-label="Playback controls">
        <Button variant="icon" size="sm" aria-label="Previous" onClick={() => send(MESSAGE_TYPE.SkipPrev)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h1.5v4.5L13 3v10L4.5 8.5V13H3z" /></svg>
        </Button>
        <Button
          variant="primary"
          size="sm"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={() => send(isPlaying ? MESSAGE_TYPE.Pause : MESSAGE_TYPE.Play)}
        >
          {isPlaying
            ? <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="4" height="10" rx="1" /><rect x="9" y="3" width="4" height="10" rx="1" /></svg>
            : <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5l10 5.5-10 5.5z" /></svg>
          }
        </Button>
        <Button variant="icon" size="sm" aria-label="Next" onClick={() => send(MESSAGE_TYPE.SkipNext)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13 3h-1.5v4.5L3 3v10l8.5-4.5V13H13z" /></svg>
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-32">
        <span className="text-xs text-text-muted w-8">{voice.rate.toFixed(1)}×</span>
        <Slider
          min={0.5} max={2.0} step={0.1}
          value={voice.rate}
          onChange={(e) => sendToBackground({ type: MESSAGE_TYPE.SetRate, rate: parseFloat(e.target.value) } as Parameters<typeof sendToBackground>[0])}
          className="flex-1"
          aria-label="Speed"
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        aria-label="Hide reader (Ghost Mode)"
        title="Hide reader — audio keeps playing"
      >
        Hide
      </Button>
    </div>
  )
}
