import { createRoot } from 'react-dom/client'
import { createShadowRoot, destroyShadowRoot } from './shadowRoot'
import { highlightSegment as doHighlight } from './highlighter'
import type { ExtractedContent } from '../shared/types/content'
import readerCss from './styles/reader.css?inline'

const HOST_ID = 'voxsift-reader-host'
let readerRoot: ReturnType<typeof createRoot> | null = null

export function mountReader(content: ExtractedContent): void {
  const { shadow } = createShadowRoot(HOST_ID)

  const style = document.createElement('style')
  style.textContent = readerCss
  shadow.appendChild(style)

  const container = document.createElement('div')
  shadow.appendChild(container)

  import('../reader').then(({ ReaderApp }) => {
    readerRoot = createRoot(container)
    readerRoot.render(<ReaderApp content={content} shadowRoot={shadow} />)
  })
}

export function unmountReader(): void {
  readerRoot?.unmount()
  readerRoot = null
  destroyShadowRoot(HOST_ID)
}

export function highlightActiveSegment(segmentId: string): void {
  const host = document.getElementById(HOST_ID)
  if (!host?.shadowRoot) return
  doHighlight(segmentId, host.shadowRoot)
}
