import { create } from 'zustand'

export type ToastTier = 'small' | 'medium' | 'large'

export interface Toast {
  id: string
  text: string
  emoji: string
  ok: boolean
  tier: ToastTier
}

export interface ActionPanel {
  title: string
  emoji: string
  ok: boolean
  effects: Record<string, number>
}

export interface CenterAlert {
  text: string
  ok: boolean
  emoji?: string
}

interface ToastState {
  toasts: Toast[]
  panel: ActionPanel | null
  alert: CenterAlert | null
  push: (text: string, emoji: string, ok?: boolean, tier?: ToastTier) => void
  remove: (id: string) => void
  showPanel: (panel: ActionPanel) => void
  closePanel: () => void
  showAlert: (text: string, ok?: boolean, emoji?: string) => void
  closeAlert: () => void
}

let _seq = 0

export const useToastStore = create<ToastState>(set => ({
  toasts: [],
  panel: null,
  alert: null,
  push: (text, emoji, ok = true, tier = 'small') => {
    const id = `toast_${++_seq}`
    set(s => ({ toasts: [...s.toasts.slice(-2), { id, text, emoji, ok, tier }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
  },
  remove: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  showPanel: panel => set({ panel }),
  closePanel: () => set({ panel: null }),
  showAlert: (text, ok = true, emoji) => set({ alert: { text, ok, emoji } }),
  closeAlert: () => set({ alert: null }),
}))
