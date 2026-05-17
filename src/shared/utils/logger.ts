const IS_DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true

export const logger = {
  debug: (...args: unknown[]) => { if (IS_DEV) console.debug('[VoxSift]', ...args) },
  info: (...args: unknown[]) => { if (IS_DEV) console.info('[VoxSift]', ...args) },
  warn: (...args: unknown[]) => console.warn('[VoxSift]', ...args),
  error: (...args: unknown[]) => console.error('[VoxSift]', ...args),
}
