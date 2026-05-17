import { usePlaybackStore } from '../../state/playbackStateChannel'

export function usePlaybackState() {
  return usePlaybackStore((s) => ({
    status: s.status,
    progress: s.progress,
    extractionProgress: s.extractionProgress,
    voice: s.voice,
    ghostMode: s.ghostMode,
    error: s.error,
    activeSegmentIndex: s.activeSegmentIndex,
  }))
}
