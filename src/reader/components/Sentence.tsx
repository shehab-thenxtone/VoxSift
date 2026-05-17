import { memo } from 'react'

interface Props {
  segmentId: string
  text: string
  isActive: boolean
  index: number
  onClick: (index: number) => void
}

export const Sentence = memo(function Sentence({ segmentId, text, isActive, index, onClick }: Props) {
  return (
    <span
      data-segment-id={segmentId}
      onClick={() => onClick(index)}
      className={`cursor-pointer rounded-sm px-0.5 py-0.5 transition-colors duration-200 ${
        isActive
          ? 'bg-accent/20 text-text font-medium'
          : 'hover:bg-surface-raised'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(index)}
      aria-pressed={isActive}
    >
      {text}{' '}
    </span>
  )
})
