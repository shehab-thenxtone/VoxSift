import type { SpeechSegment } from '../shared/types/content'

export class QueueManager {
  private segments: SpeechSegment[] = []

  load(segments: SpeechSegment[]): void {
    this.segments = segments
  }

  append(segments: SpeechSegment[]): void {
    this.segments.push(...segments)
  }

  get(index: number): SpeechSegment | undefined {
    return this.segments[index]
  }

  getAll(): SpeechSegment[] {
    return this.segments
  }

  get length(): number {
    return this.segments.length
  }

  clear(): void {
    this.segments = []
  }
}
