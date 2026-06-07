import { create } from 'zustand'

export interface Toast {
  id: string
  text: string
  emoji: string
  ok: boolean
}

interface ToastState {
  toasts: Toast[]
  push: (text: string, emoji: string, ok?: boolean) => void
  remove: (id: string) => void
}

let _seq = 0

export const useToastStore = create<ToastState>(set => ({
  toasts: [],
  push: (text, emoji, ok = true) => {
    const id = `toast_${++_seq}`
    set(s => ({ toasts: [...s.toasts.slice(-2), { id, text, emoji, ok }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
  },
  remove: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
