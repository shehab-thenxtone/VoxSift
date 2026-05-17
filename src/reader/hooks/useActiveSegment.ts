import { usePlaybackStore } from '../../state/playbackStateChannel'

export function useActiveSegment() {
  return usePlaybackStore((s) => s.activeSegmentId)
}
