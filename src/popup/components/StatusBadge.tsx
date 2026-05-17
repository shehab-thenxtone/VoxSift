import type { PlaybackStatus } from '../../shared/types/playback'

const STATUS_LABELS: Record<PlaybackStatus, string> = {
  idle: 'Ready',
  extracting: 'Extracting…',
  ready: 'Ready',
  playing: 'Playing',
  paused: 'Paused',
  stopped: 'Stopped',
  error: 'Error',
}

const STATUS_COLORS: Record<PlaybackStatus, string> = {
  idle: 'bg-surface-raised text-text-muted',
  extracting: 'bg-accent/10 text-accent',
  ready: 'bg-success/10 text-success',
  playing: 'bg-accent text-white',
  paused: 'bg-surface-raised text-text-muted',
  stopped: 'bg-surface-raised text-text-muted',
  error: 'bg-error/10 text-error',
}

interface Props {
  status: PlaybackStatus
}

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}
      role="status"
      aria-live="polite"
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
