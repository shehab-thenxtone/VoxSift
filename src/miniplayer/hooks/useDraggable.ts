import { useRef, useCallback } from 'react'
import { useMiniPlayerStore } from '../state/miniPlayerStore'

export function useDraggable() {
  const setPosition = useMiniPlayerStore((s) => s.setPosition)
  const position = useMiniPlayerStore((s) => s.position)
  const dragOffset = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      isDragging.current = true
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [position],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!isDragging.current) return
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      })
    },
    [setPosition],
  )

  const onPointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp, position }
}
