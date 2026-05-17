import { create } from 'zustand'

interface Position {
  x: number
  y: number
}

interface MiniPlayerStore {
  position: Position
  minimized: boolean
  setPosition: (pos: Position) => void
  toggleMinimized: () => void
}

export const useMiniPlayerStore = create<MiniPlayerStore>((set) => ({
  position: { x: 16, y: 80 },
  minimized: false,
  setPosition: (position) => set({ position }),
  toggleMinimized: () => set((s) => ({ minimized: !s.minimized })),
}))
