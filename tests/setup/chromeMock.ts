import { vi } from 'vitest'

globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    connect: vi.fn().mockReturnValue({
      postMessage: vi.fn(),
      onMessage: { addListener: vi.fn() },
      onDisconnect: { addListener: vi.fn() },
    }),
    id: 'test-extension-id',
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
  tts: {
    speak: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    getVoices: vi.fn().mockImplementation((cb: (v: unknown[]) => void) => cb([])),
  },
} as unknown as typeof chrome
