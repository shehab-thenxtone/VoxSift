import { create } from 'zustand'

interface PopupStore {
  isVoicePanelOpen: boolean
  toggleVoicePanel: () => void
}

export const usePopupStore = create<PopupStore>((set) => ({
  isVoicePanelOpen: false,
  toggleVoicePanel: () => set((s) => ({ isVoicePanelOpen: !s.isVoicePanelOpen })),
}))
