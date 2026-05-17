import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 disabled:cursor-not-allowed select-none'

    const variants = {
      primary: 'bg-accent text-white hover:bg-accent-hover active:scale-95',
      ghost: 'bg-transparent text-text hover:bg-surface-raised active:scale-95',
      icon: 'bg-transparent hover:bg-surface-raised active:scale-90 rounded-full',
    }

    const sizes = {
      sm: 'text-xs px-2 py-1 gap-1',
      md: 'text-sm px-3 py-1.5 gap-1.5',
      lg: 'text-base px-4 py-2 gap-2',
    }

    const iconSizes = { sm: 'p-1', md: 'p-1.5', lg: 'p-2' }

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${variant === 'icon' ? iconSizes[size] : sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
