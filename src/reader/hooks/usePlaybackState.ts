import { usePlaybackStore } from '../../state/playbackStateChannel'

export function usePlaybackState() {
  return usePlaybackStore((s) => ({
    status: s.status,
    progress: s.progress,
    voice: s.voice,
    activeSegmentId: s.activeSegmentId,
    activeSegmentIndex: s.activeSegmentIndex,
    ghostMode: s.ghostMode,
  }))
}
