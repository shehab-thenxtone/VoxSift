import type { SpeechSegment } from '../shared/types/content'
import { genSegmentId } from '../shared/utils/id'

const sentenceSegmenter =
  typeof Intl.Segmenter !== 'undefined'
    ? new Intl.Segmenter('en', { granularity: 'sentence' })
    : null

function splitBySentence(text: string): string[] {
  if (sentenceSegmenter) {
    return Array.from(sentenceSegmenter.segment(text))
      .map((s) => s.segment.trim())
      .filter(Boolean)
  }
  // Fallback: split on sentence-ending punctuation
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
}

export function segmentText(
  paragraphs: string[],
  lang: string,
): SpeechSegment[] {
  const segments: SpeechSegment[] = []
  let charCursor = 0
  let segIndex = 0

  for (const [pIdx, para] of paragraphs.entries()) {
    const sentences = splitBySentence(para)
    const paragraphId = `para_${pIdx}`

    for (const sentence of sentences) {
      const seg: SpeechSegment = {
        id: genSegmentId(),
        index: segIndex++,
        text: sentence,
        charStart: charCursor,
        charEnd: charCursor + sentence.length,
        paragraphId,
        lang,
      }
      segments.push(seg)
      charCursor += sentence.length + 1 // +1 for separator
    }
  }

  return segments
}
