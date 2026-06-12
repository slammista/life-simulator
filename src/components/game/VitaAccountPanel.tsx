import { useState, useEffect } from 'react'
import { CloudSaveService, type CloudUser } from '../../services/CloudSaveService'

interface Props {
  onBack: () => void
}

interface PastLife {
  life_number: number
  final_age: number
  final_money: number
  final_gems: number
  trophies_earned: number
  ended_at: string
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(1)}K`
  return `€${amount.toLocaleString('it-IT')}`
}

export function VitaAccountPanel({ onBack }: Props) {
  const [user, setUser] = useState<CloudUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMsg, setAuthMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [pastLives, setPastLives] = useState<PastLife[]>([])
  const [loadingLives, setLoadingLives] = useState(false)
  const [cloudDate, setCloudDate] = useState<string | null>(null)
  const isConfigured = CloudSaveService.isConfigured()

  useEffect(() => {
    CloudSaveService.getCurrentUser().then(u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    CloudSaveService.getCloudSaveDate().then(setCloudDate)
    fetchPastLives()
  }, [user])

  async function fetchPastLives() {
    if (!user) return
    setLoadingLives(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const { data: { session } } = await (await getSupaClient()).auth.getSession()
      if (!session) return
      const res = await fetch(`${supabaseUrl}/rest/v1/past_lives?user_id=eq.${user.id}&order=life_number.desc&limit=10`, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      if (res.ok) {
        const rows: PastLife[] = await res.json()
        setPastLives(rows)
      }
    } catch {
      // Silently ignore — leaderboard is optional
    } finally {
      setLoadingLives(false)
    }
  }

  async function getSupaClient() {
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    )
  }

  async function handleEmailAuth() {
    setAuthMsg(null)
    if (!email || !password) { setAuthMsg({ text: 'Inserisci email e password', ok: false }); return }
    const fn = authTab === 'login' ? CloudSaveService.signIn : CloudSaveService.signUp
    const result = await fn.call(CloudSaveService, email, password)
    if (result.success) {
      if (authTab === 'login') {
        const u = await CloudSaveService.getCurrentUser()
        setUser(u)
        setAuthMsg({ text: 'Accesso effettuato!', ok: true })
      } else {
        setAuthMsg({ text: 'Registrazione ok! Controlla la tua email per confermare.', ok: true })
      }
    } else {
      setAuthMsg({ text: result.error ?? 'Errore', ok: false })
    }
  }

  async function handleGoogle() {
    setAuthMsg(null)
    const result = await CloudSaveService.signInWithGoogle()
    if (!result.success) setAuthMsg({ text: result.error ?? 'Errore Google', ok: false })
  }

  async function handleApple() {
    setAuthMsg(null)
    const result = await CloudSaveService.signInWithApple()
    if (!result.success) setAuthMsg({ text: result.error ?? 'Errore Apple', ok: false })
  }

  async function handleSignOut() {
    await CloudSaveService.signOut()
    setUser(null)
    setPastLives([])
    setCloudDate(null)
  }

  async function handleUpload() {
    setSyncing(true)
    setSyncMsg(null)
    const r = await CloudSaveService.uploadSave()
    setSyncMsg({ text: r.success ? '✓ Salvataggio caricato sul cloud' : r.error ?? 'Errore upload', ok: r.success })
    setSyncing(false)
    if (r.success) CloudSaveService.getCloudSaveDate().then(setCloudDate)
  }

  async function handleDownload() {
    setSyncing(true)
    setSyncMsg(null)
    const r = await CloudSaveService.downloadSave()
    setSyncMsg({ text: r.success ? '✓ Salvataggio scaricato. Ricarica per applicarlo.' : r.error ?? 'Errore download', ok: r.success })
    setSyncing(false)
  }

  function handleExport() {
    CloudSaveService.exportToFile()
  }

  async function handleImport() {
    const ok = await CloudSaveService.importFromFile()
    if (ok) setSyncMsg({ text: '✓ Salvataggio importato con successo', ok: true })
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Caricamento…
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={onBack}
          className="icon-btn"
          style={{ width: 36, height: 36, flexShrink: 0 }}
          aria-label="Torna indietro"
        >
          ‹
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#fff' }}>👤 Account</h2>
      </div>

      {/* Sync message */}
      {syncMsg && (
        <div className="card" style={{
          padding: '10px 14px', marginBottom: 12,
          background: syncMsg.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          borderColor: syncMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: syncMsg.ok ? '#6ee7b7' : '#fca5a5' }}>{syncMsg.text}</span>
          <button onClick={() => setSyncMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* === LOGGED IN === */}
      {user ? (
        <>
          {/* User card */}
          <div className="card" style={{ padding: '16px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--section-accent), #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: '#fff',
              }}>
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{user.email}</div>
                {cloudDate && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Ultimo sync: {new Date(cloudDate).toLocaleDateString('it-IT')}
                  </div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="btn-candy btn-candy--danger"
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                Esci
              </button>
            </div>
          </div>

          {/* Cloud sync buttons */}
          <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', margin: '0 0 10px' }}>☁️ Sincronizzazione Cloud</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleUpload}
                disabled={syncing}
                className="btn-candy btn-candy--primary"
                style={{ flex: 1, fontSize: 13, padding: '9px 0' }}
              >
                {syncing ? '…' : '⬆️ Carica'}
              </button>
              <button
                onClick={handleDownload}
                disabled={syncing}
                className="btn-candy btn-candy--neutral"
                style={{ flex: 1, fontSize: 13, padding: '9px 0' }}
              >
                {syncing ? '…' : '⬇️ Scarica'}
              </button>
            </div>
          </div>

          {/* Past Lives Leaderboard */}
          <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', margin: '0 0 10px' }}>📜 Vite Passate</h4>
            {loadingLives ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '8px 0' }}>
                Caricamento…
              </div>
            ) : pastLives.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '8px 0' }}>
                Nessuna vita completata ancora. Invecchia fino alla fine!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pastLives.map(life => (
                  <div key={life.life_number} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(167,139,250,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#c4b5fd', flexShrink: 0,
                    }}>
                      #{life.life_number}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>
                        Morto a {life.final_age} anni
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {new Date(life.ended_at).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#fbbf24' }}>🏆 {life.trophies_earned}</div>
                      <div style={{ fontSize: 11, color: '#86efac' }}>{formatMoney(life.final_money)}</div>
                      <div style={{ fontSize: 11, color: '#a78bfa' }}>💎 {life.final_gems}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* === NOT LOGGED IN === */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isConfigured && (
            <div className="card" style={{
              padding: '12px 14px',
              background: 'rgba(245,158,11,0.1)',
              borderColor: 'rgba(245,158,11,0.3)',
            }}>
              <p style={{ fontSize: 12, color: '#fcd34d', margin: 0 }}>
                ⚠️ Supabase non configurato. Il cloud save non è disponibile in questa sessione.
              </p>
            </div>
          )}

          {/* OAuth buttons */}
          <div className="card" style={{ padding: '16px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleGoogle}
                disabled={!isConfigured}
                className="btn-candy btn-candy--neutral"
                style={{ width: '100%', fontSize: 14, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <span style={{ fontSize: 18 }}>🇬</span> Accedi con Google
              </button>
              <button
                onClick={handleApple}
                disabled={!isConfigured}
                className="btn-candy btn-candy--neutral"
                style={{ width: '100%', fontSize: 14, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(0,0,0,0.4)' }}
              >
                <span style={{ fontSize: 18 }}>🍎</span> Accedi con Apple
              </button>
            </div>
          </div>

          {/* Email/password */}
          <div className="card" style={{ padding: '16px 16px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['login', 'register'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setAuthTab(t); setAuthMsg(null) }}
                  style={{
                    flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 20,
                    fontSize: 13, fontWeight: 600,
                    background: authTab === t ? 'var(--section-accent)' : 'rgba(255,255,255,0.07)',
                    color: authTab === t ? '#fff' : 'var(--color-text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t === 'login' ? 'Accedi' : 'Registrati'}
                </button>
              ))}
            </div>

            {authMsg && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 12,
                background: authMsg.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: authMsg.ok ? '#6ee7b7' : '#fca5a5',
              }}>
                {authMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!isConfigured}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleEmailAuth() }}
                disabled={!isConfigured}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleEmailAuth}
                disabled={!isConfigured}
                className="btn-candy btn-candy--primary"
                style={{ width: '100%', fontSize: 14, padding: '11px 0' }}
              >
                {authTab === 'login' ? 'Accedi' : 'Crea account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local backup (always visible) */}
      <div className="card" style={{ padding: '14px 16px', marginTop: 12 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: '0 0 10px' }}>💾 Backup Locale</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleExport}
            className="btn-candy btn-candy--neutral"
            style={{ flex: 1, fontSize: 13, padding: '9px 0' }}
          >
            📤 Esporta
          </button>
          <button
            onClick={handleImport}
            className="btn-candy btn-candy--neutral"
            style={{ flex: 1, fontSize: 13, padding: '9px 0' }}
          >
            📥 Importa
          </button>
        </div>
      </div>
    </div>
  )
}
