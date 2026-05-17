import { type InputHTMLAttributes } from 'react'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function Slider({ label, className = '', ...props }: SliderProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="text-xs text-text-muted font-medium">{label}</span>
      )}
      <input
        type="range"
        className="w-full h-1.5 rounded-full bg-surface-raised accent-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        {...props}
      />
    </div>
  )
}
