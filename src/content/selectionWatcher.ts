import { debounce } from '../shared/utils/debounce'

type SelectionCallback = (hasSelection: boolean, text: string) => void

let _lastSelectionText = ''

export function getLastSelectionText(): string {
  return _lastSelectionText
}

/**
 * Returns selected text from the document, including text selected inside
 * <input> and <textarea> elements which window.getSelection() misses.
 */
function captureSelectedText(): string {
  const standard = window.getSelection()?.toString().trim() ?? ''
  if (standard) return standard

  const el = document.activeElement
  if (
    (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
    el.selectionStart !== null
  ) {
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? start
    if (end > start) return el.value.substring(start, end).trim()
  }

  return ''
}

export function watchSelection(callback: SelectionCallback): () => void {
  const notifyCallback = debounce((text: string) => {
    callback(text.length > 0, text)
  }, 300)

  const onSelectionChange = () => {
    const text = captureSelectedText()
    // Update cache immediately so the popup always sees the latest selection,
    // even if it opens within the debounce window.
    if (text) _lastSelectionText = text
    notifyCallback(text)
  }

  document.addEventListener('selectionchange', onSelectionChange)
  return () => document.removeEventListener('selectionchange', onSelectionChange)
}
