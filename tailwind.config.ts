import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Channel vars (L C H) let Tailwind inject alpha via oklch(... / <alpha-value>)
        surface: 'oklch(var(--c-surface) / <alpha-value>)',
        'surface-raised': 'oklch(var(--c-surface-raised) / <alpha-value>)',
        text: 'oklch(var(--c-text) / <alpha-value>)',
        'text-muted': 'oklch(var(--c-text-muted) / <alpha-value>)',
        accent: 'oklch(var(--c-accent) / <alpha-value>)',
        'accent-hover': 'oklch(var(--c-accent-hover) / <alpha-value>)',
        error: 'oklch(var(--c-error) / <alpha-value>)',
        success: 'oklch(var(--c-success) / <alpha-value>)',
        border: 'oklch(var(--c-border) / <alpha-value>)',
        white: '#ffffff',
      },
      animation: {
        'fade-in': 'fadeIn 200ms var(--ease-out-expo)',
        'slide-up': 'slideUp 300ms var(--ease-out-expo)',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
