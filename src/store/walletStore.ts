// Wallet store — gem currency, owned cosmetics, entitlements.
// Server-authoritative when authenticated; offline-first otherwise.
// Gems earned offline accumulate in `pendingGemDelta` and sync on reconnect.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CloudSaveService } from '../services/CloudSaveService'

export type GemSource = 'ad_video' | 'quest' | 'game_over' | 'purchase' | 'admin'

export interface WalletState {
  gems: number
  ownedCosmetics: string[]
  equippedCosmetics: string[]
  hasNoAds: boolean
  hasGodMode: boolean
  pendingGemDelta: number // offline-earned gems awaiting server sync
  lastSyncedAt: number

  addGems: (amount: number) => void
  spendGems: (amount: number) => boolean
  buyCosmetic: (id: string, cost: number) => { ok: boolean; error?: string }
  toggleEquip: (id: string) => void
  isEquipped: (id: string) => boolean
  owns: (id: string) => boolean
  setEntitlements: (e: { gems_balance?: number; has_no_ads?: boolean; has_god_mode?: boolean; cosmetics?: string[] }) => void
  syncWithServer: () => Promise<void>
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      gems: 0,
      ownedCosmetics: [],
      equippedCosmetics: [],
      hasNoAds: false,
      hasGodMode: false,
      pendingGemDelta: 0,
      lastSyncedAt: 0,

      addGems: (amount) => {
        if (amount <= 0) return
        set(s => ({ gems: s.gems + amount, pendingGemDelta: s.pendingGemDelta + amount }))
      },

      spendGems: (amount) => {
        if (amount <= 0) return true
        const { gems } = get()
        if (gems < amount) return false
        set(s => ({ gems: s.gems - amount }))
        return true
      },

      buyCosmetic: (id, cost) => {
        const { ownedCosmetics, gems } = get()
        if (ownedCosmetics.includes(id)) return { ok: false, error: 'Già posseduto' }
        if (gems < cost) return { ok: false, error: 'Gemme insufficienti' }
        set(s => ({
          gems: s.gems - cost,
          ownedCosmetics: [...s.ownedCosmetics, id],
        }))
        return { ok: true }
      },

      toggleEquip: (id) => {
        set(s => {
          if (!s.ownedCosmetics.includes(id)) return s
          const equipped = s.equippedCosmetics.includes(id)
          return {
            equippedCosmetics: equipped
              ? s.equippedCosmetics.filter(c => c !== id)
              : [...s.equippedCosmetics, id],
          }
        })
      },

      isEquipped: (id) => get().equippedCosmetics.includes(id),
      owns: (id) => get().ownedCosmetics.includes(id),

      setEntitlements: (e) => {
        set(s => ({
          gems: e.gems_balance ?? s.gems,
          hasNoAds: e.has_no_ads ?? s.hasNoAds,
          hasGodMode: e.has_god_mode ?? s.hasGodMode,
          ownedCosmetics: e.cosmetics
            ? Array.from(new Set([...s.ownedCosmetics, ...e.cosmetics]))
            : s.ownedCosmetics,
          pendingGemDelta: e.gems_balance != null ? 0 : s.pendingGemDelta,
          lastSyncedAt: Date.now(),
        }))
      },

      // Push offline-earned gem delta to the server, then hydrate authoritative state.
      syncWithServer: async () => {
        if (!CloudSaveService.isConfigured()) return
        const user = await CloudSaveService.getCurrentUser()
        if (!user) return
        const { pendingGemDelta } = get()
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
        const authHeaders = {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        }
        try {
          if (pendingGemDelta > 0) {
            const res = await fetch(`${supabaseUrl}/functions/v1/gems-sync`, {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                user_id: user.id,
                local_gems_delta: pendingGemDelta,
                source: 'offline_accrual',
              }),
            })
            if (res.ok) {
              const { gems_balance } = await res.json() as { gems_balance: number }
              set({ gems: gems_balance, pendingGemDelta: 0, lastSyncedAt: Date.now() })
              return
            }
          }
          // Even with no delta, hydrate authoritative entitlements
          const client = await getClient()
          const { data: { session } } = await client.auth.getSession()
          const token = session?.access_token ?? anonKey
          const ent = await fetch(`${supabaseUrl}/functions/v1/user-entitlements`, {
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${token}`,
            },
          })
          if (ent.ok) {
            const data = await ent.json()
            get().setEntitlements(data)
          }
        } catch {
          // Offline — keep local state, retry on next sync
        }
      },
    }),
    { name: 'lifesim2d-wallet' },
  ),
)

async function getClient() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  )
}
