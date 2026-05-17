import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: 'oklch(var(--color-surface) / <alpha-value>)',
        text: 'oklch(var(--color-text) / <alpha-value>)',
        accent: 'oklch(var(--color-accent) / <alpha-value>)',
        muted: 'oklch(var(--color-muted) / <alpha-value>)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms var(--ease-out-expo)',
        'slide-up': 'slideUp 300ms var(--ease-out-expo)',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
} satisfies Config
