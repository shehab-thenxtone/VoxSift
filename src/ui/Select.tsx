import { type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs text-text-muted font-medium">{label}</label>
      )}
      <select
        className="w-full text-sm bg-surface-raised text-text border border-surface-raised rounded-md px-2.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
