// Lightweight store for the currently-active mini-game challenge.
// Decoupled from the main game store so both the aging loop (event-posed
// challenges) and the activities screen (on-demand) can drive it.

import { create } from 'zustand'

export type ChallengeSource = 'event' | 'activity'

interface ChallengeState {
  activeId: string | null
  source: ChallengeSource
  open: (id: string, source: ChallengeSource) => void
  close: () => void
}

export const useChallengeStore = create<ChallengeState>(set => ({
  activeId: null,
  source: 'activity',
  open: (id, source) => set({ activeId: id, source }),
  close: () => set({ activeId: null }),
}))
