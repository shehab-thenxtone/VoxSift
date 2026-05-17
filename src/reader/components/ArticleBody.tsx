import type { SpeechSegment } from '../../shared/types/content'
import { Sentence } from './Sentence'
import { sendToBackground } from '../../shared/messaging/send'
import { MESSAGE_TYPE } from '../../shared/types/messages'

interface Props {
  segments: SpeechSegment[]
  activeSegmentId: string | null
  containerRef: React.RefObject<HTMLDivElement>
}

export function ArticleBody({ segments, activeSegmentId, containerRef }: Props) {
  const handleSeek = (index: number) => {
    sendToBackground({ type: MESSAGE_TYPE.SeekToSegment, segmentIndex: index } as Parameters<typeof sendToBackground>[0])
  }

  // Group segments by paragraph
  const paragraphs = segments.reduce<SpeechSegment[][]>((acc, seg) => {
    const last = acc[acc.length - 1]
    if (last && last[0]?.paragraphId === seg.paragraphId) {
      last.push(seg)
    } else {
      acc.push([seg])
    }
    return acc
  }, [])

  return (
    <div ref={containerRef} className="prose prose-lg max-w-none text-text leading-relaxed">
      {paragraphs.map((para, pIdx) => (
        <p key={para[0]?.paragraphId ?? pIdx} className="mb-5">
          {para.map((seg) => (
            <Sentence
              key={seg.id}
              segmentId={seg.id}
              text={seg.text}
              isActive={seg.id === activeSegmentId}
              index={seg.index}
              onClick={handleSeek}
            />
          ))}
        </p>
      ))}
    </div>
  )
}
