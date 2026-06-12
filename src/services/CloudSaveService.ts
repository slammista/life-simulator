// Cloud Save Service — export/import JSON + Supabase cloud sync
// To enable cloud sync: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env

const SAVE_KEY = 'lifesim2d-save'

// Supabase client — lazily initialized only when env vars are present
let _supabaseClient: Awaited<ReturnType<typeof _createClient>> | null = null

async function _createClient() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  )
}

async function getClient() {
  if (!CloudSaveService.isConfigured()) return null
  if (!_supabaseClient) _supabaseClient = await _createClient()
  return _supabaseClient
}

export interface CloudUser {
  id: string
  email: string
}

export interface CloudSaveResult {
  success: boolean
  error?: string
}

export const CloudSaveService = {
  // ─── Supabase availability ──────────────────────────────────────
  isConfigured(): boolean {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  },

  // ─── JSON local export / import ────────────────────────────────

  exportToFile(): void {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) {
      alert('Nessun salvataggio trovato. Avvia una partita prima di esportare.')
      return
    }
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lifesim2d_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  importFromFile(): Promise<boolean> {
    return new Promise(resolve => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) { resolve(false); return }
        const reader = new FileReader()
        reader.onload = (ev) => {
          try {
            const text = ev.target?.result as string
            const parsed = JSON.parse(text)
            // Validate: Zustand persist wraps in { state: {...}, version: 0 }
            const hasState = parsed?.state?.isStarted !== undefined || parsed?.isStarted !== undefined
            if (!hasState) throw new Error('File non valido: struttura salvataggio non riconosciuta')
            localStorage.setItem(SAVE_KEY, text)
            resolve(true)
          } catch (err) {
            alert(`Errore import: ${(err as Error).message}`)
            resolve(false)
          }
        }
        reader.readAsText(file)
      }
      document.body.appendChild(input)
      input.click()
      document.body.removeChild(input)
    })
  },

  // ─── Auth ───────────────────────────────────────────────────────

  async signIn(email: string, password: string): Promise<CloudSaveResult> {
    const client = await getClient()
    if (!client) return { success: false, error: 'Cloud save non configurato (VITE_SUPABASE_URL mancante)' }
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async signUp(email: string, password: string): Promise<CloudSaveResult> {
    const client = await getClient()
    if (!client) return { success: false, error: 'Cloud save non configurato' }
    const redirectTo = `${window.location.origin}/auth-confirm`
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async signInWithGoogle(): Promise<CloudSaveResult> {
    const client = await getClient()
    if (!client) return { success: false, error: 'Cloud save non configurato' }
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth-confirm` },
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async signInWithApple(): Promise<CloudSaveResult> {
    const client = await getClient()
    if (!client) return { success: false, error: 'Cloud save non configurato' }
    const { error } = await client.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth-confirm` },
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async signOut(): Promise<void> {
    const client = await getClient()
    await client?.auth.signOut()
    _supabaseClient = null
  },

  async getCurrentUser(): Promise<CloudUser | null> {
    const client = await getClient()
    if (!client) return null
    try {
      const { data } = await client.auth.getUser()
      const user = data?.user
      return user ? { id: user.id, email: user.email ?? '' } : null
    } catch {
      return null
    }
  },

  // ─── Cloud save / load ──────────────────────────────────────────

  async uploadSave(): Promise<CloudSaveResult> {
    const client = await getClient()
    if (!client) return { success: false, error: 'Cloud save non configurato' }
    const { data: { user } } = await client.auth.getUser()
    if (!user) return { success: false, error: 'Utente non autenticato' }

    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return { success: false, error: 'Nessun salvataggio locale da caricare' }

    try {
      const saveData = JSON.parse(raw)
      const { error } = await client.from('saves').upsert({
        user_id: user.id,
        save_data: saveData,
        save_version: '2.0',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (error) return { success: false, error: error.message }
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  },

  async downloadSave(): Promise<CloudSaveResult> {
    const client = await getClient()
    if (!client) return { success: false, error: 'Cloud save non configurato' }
    const { data: { user } } = await client.auth.getUser()
    if (!user) return { success: false, error: 'Utente non autenticato' }

    try {
      const { data, error } = await client
        .from('saves')
        .select('save_data, updated_at')
        .eq('user_id', user.id)
        .single()
      if (error || !data) return { success: false, error: 'Nessun salvataggio cloud trovato' }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data.save_data))
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  },

  // Upload score to leaderboard (all categories in one call)
  async uploadLeaderboard(payload: {
    username: string
    longevity?: number
    wealth?: number
    happiness?: number
    karma?: number
    ribbons?: number
    ageReached?: number
  }): Promise<void> {
    const client = await getClient()
    if (!client) return
    const { data: { user } } = await client.auth.getUser()
    if (!user) return

    const categories = (['longevity', 'wealth', 'happiness', 'karma', 'ribbons'] as const)
    await Promise.allSettled(
      categories
        .filter(cat => payload[cat] !== undefined)
        .map(cat =>
          client.from('leaderboard').upsert({
            user_id: user.id,
            username: payload.username,
            category: cat,
            score: payload[cat]!,
            age_reached: payload.ageReached,
            ribbons_count: payload.ribbons ?? 0,
          }, { onConflict: 'user_id,category' })
        )
    )
  },

  // Returns ISO string of last cloud save, or null
  async getCloudSaveDate(): Promise<string | null> {
    const client = await getClient()
    if (!client) return null
    const { data: { user } } = await client.auth.getUser()
    if (!user) return null
    const { data } = await client
      .from('saves')
      .select('updated_at')
      .eq('user_id', user.id)
      .single()
    return data?.updated_at ?? null
  },
}
