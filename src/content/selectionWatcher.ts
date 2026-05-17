import { debounce } from '../shared/utils/debounce'

type SelectionCallback = (hasSelection: boolean, text: string) => void

export function watchSelection(callback: SelectionCallback): () => void {
  const notify = debounce(() => {
    const selection = window.getSelection()
    const text = selection?.toString().trim() ?? ''
    callback(text.length > 0, text)
  }, 300)

  document.addEventListener('selectionchange', notify)
  return () => document.removeEventListener('selectionchange', notify)
}
