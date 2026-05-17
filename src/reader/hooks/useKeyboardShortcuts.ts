import { useEffect } from 'react'
import { sendToBackground } from '../../shared/messaging/send'
import { MESSAGE_TYPE } from '../../shared/types/messages'

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const send = (type: string) =>
        sendToBackground({ type } as Parameters<typeof sendToBackground>[0])

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          send(MESSAGE_TYPE.Play) // toggle handled by FSM
          break
        case 'ArrowRight':
          e.preventDefault()
          send(MESSAGE_TYPE.SkipNext)
          break
        case 'ArrowLeft':
          e.preventDefault()
          send(MESSAGE_TYPE.SkipPrev)
          break
        case 'Escape':
          send(MESSAGE_TYPE.ToggleGhostMode)
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
