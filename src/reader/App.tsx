import { useEffect } from 'react'
import { usePlaybackState } from './hooks/usePlaybackState'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { ArticleBody } from './components/ArticleBody'
import { ProgressBar } from './components/ProgressBar'
import { ReaderControls } from './components/ReaderControls'
import { initPlaybackChannel } from '../state/playbackStateChannel'
import { sendToBackground } from '../shared/messaging/send'
import { MESSAGE_TYPE } from '../shared/types/messages'
import type { ExtractedContent } from '../shared/types/content'

interface Props {
  content: ExtractedContent
  shadowRoot: ShadowRoot
}

export function ReaderApp({ content }: Props) {
  const { status, progress, voice, activeSegmentId, ghostMode } = usePlaybackState()
  const containerRef = useAutoScroll(activeSegmentId)
  useKeyboardShortcuts()

  useEffect(() => {
    initPlaybackChannel()
  }, [])

  const handleClose = () => {
    sendToBackground({ type: MESSAGE_TYPE.ToggleGhostMode, enabled: true } as Parameters<typeof sendToBackground>[0])
  }

  if (ghostMode) return null

  return (
    <div
      className="fixed inset-0 bg-surface z-reader overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Reading: ${content.title}`}
    >
      {/* Sticky header */}
      <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-surface-raised px-6 py-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-text leading-tight">{content.title}</h1>
            {content.byline && (
              <p className="text-sm text-text-muted mt-0.5">{content.byline}</p>
            )}
          </div>
        </div>
        <ProgressBar progress={progress} />
        <ReaderControls status={status} voice={voice} onClose={handleClose} />
      </div>

      {/* Article body */}
      <article className="max-w-2xl mx-auto px-6 py-10">
        <ArticleBody
          segments={content.segments}
          activeSegmentId={activeSegmentId}
          containerRef={containerRef as React.RefObject<HTMLDivElement>}
        />
      </article>
    </div>
  )
}
