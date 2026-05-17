import { debounce } from '../shared/utils/debounce'

type SelectionCallback = (hasSelection: boolean, text: string) => void

// Cache the last known selection so it survives popup focus stealing it.
let _lastSelectionText = ''

export function getLastSelectionText(): string {
  return _lastSelectionText
}

export function watchSelection(callback: SelectionCallback): () => void {
  const notify = debounce(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim() ?? ''
    if (text) _lastSelectionText = text
    callback(text.length > 0, text)
  }, 300)

  document.addEventListener('selectionchange', notify)
  return () => document.removeEventListener('selectionchange', notify)
}
