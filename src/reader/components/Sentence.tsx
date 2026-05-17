import { memo } from 'react'

interface Props {
  segmentId: string
  text: string
  isActive: boolean
  index: number
  onClick: (index: number) => void
}

export const Sentence = memo(function Sentence({
  segmentId,
  text,
  isActive,
  index,
  onClick,
}: Props) {
  return (
    <span
      data-segment-id={segmentId}
      onClick={() => onClick(index)}
      className={`vs-sentence${isActive ? ' vs-sentence-active' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(index)}
      aria-pressed={isActive}
    >
      {text}{' '}
    </span>
  )
})
