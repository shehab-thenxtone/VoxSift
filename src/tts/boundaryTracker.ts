import type { SpeechSegment } from '../shared/types/content'

/** Binary-search the segments array to find which segment contains a given char offset. */
export function resolveSegmentAtChar(
  segments: SpeechSegment[],
  charOffset: number,
): { segmentIndex: number; charOffsetInSegment: number } | null {
  if (segments.length === 0) return null

  let lo = 0
  let hi = segments.length - 1

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const seg = segments[mid]!
    if (charOffset < seg.charStart) {
      hi = mid - 1
    } else if (charOffset > seg.charEnd) {
      lo = mid + 1
    } else {
      return {
        segmentIndex: mid,
        charOffsetInSegment: charOffset - seg.charStart,
      }
    }
  }

  // Clamp to last segment
  const last = segments[segments.length - 1]!
  return { segmentIndex: last.index, charOffsetInSegment: 0 }
}
