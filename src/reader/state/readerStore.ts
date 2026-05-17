import { create } from 'zustand'

interface ReaderStore {
  isSettingsOpen: boolean
  toggleSettings: () => void
}

export const useReaderStore = create<ReaderStore>((set) => ({
  isSettingsOpen: false,
  toggleSettings: () => set((s) => ({ isSettingsOpen: !s.isSettingsOpen })),
}))
