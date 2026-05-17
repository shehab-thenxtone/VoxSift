import { useEffect, useRef } from 'react'

export function useAutoScroll(activeSegmentId: string | null) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeSegmentId || !containerRef.current) return
    const el = containerRef.current.querySelector(`[data-segment-id="${activeSegmentId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeSegmentId])

  return containerRef
}
