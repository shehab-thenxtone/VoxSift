interface Props {
  progress: number
}

export function ProgressBar({ progress }: Props) {
  return (
    <div
      className="w-full h-1 bg-surface-raised rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-accent transition-all duration-300"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}
