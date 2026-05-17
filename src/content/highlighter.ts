const HIGHLIGHT_CLASS = 'voxsift-active'

let currentHighlightId: string | null = null

export function highlightSegment(segmentId: string, root: ShadowRoot | Document = document): void {
  if (segmentId === currentHighlightId) return

  root.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS)
  })

  const el = root.querySelector(`[data-segment-id="${segmentId}"]`)
  if (el) {
    el.classList.add(HIGHLIGHT_CLASS)
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  currentHighlightId = segmentId
}
