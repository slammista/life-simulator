import { useState, useEffect, useCallback } from 'react'
import { CloudSaveService } from '../../services/CloudSaveService'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'

type Category = 'longevity' | 'wealth' | 'happiness' | 'karma' | 'ribbons'

interface LeaderboardEntry {
  username: string
  score: number
  age_reached?: number
  ribbons_count?: number
  user_id: string
}

const CATEGORY_META: Record<Category, { label: string; emoji: string; unit: string }> = {
  longevity:  { label: 'Longevità',  emoji: '🧓', unit: ' anni' },
  wealth:     { label: 'Ricchezza',  emoji: '💰', unit: '€' },
  happiness:  { label: 'Felicità',   emoji: '😊', unit: '/100' },
  karma:      { label: 'Karma',      emoji: '✨', unit: '' },
  ribbons:    { label: 'Medaglie',   emoji: '🏅', unit: '' },
}

async function fetchLeaderboard(category: Category): Promise<LeaderboardEntry[]> {
  // Dynamic import so Supabase isn't bundled if not configured
  if (!CloudSaveService.isConfigured()) return []
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  )
  const { data, error } = await client
    .from('leaderboard')
    .select('username, score, age_reached, ribbons_count, user_id')
    .eq('category', category)
    .order('score', { ascending: false })
    .limit(25)
  if (error || !data) return []
  return data as LeaderboardEntry[]
}

export function LeaderboardScreen() {
  const [category, setCategory] = useState<Category>('longevity')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const { stats, time, ribbons, identity, finance } = useGameStore(useShallow(s => ({
    stats: s.stats,
    time: s.time,
    ribbons: s.ribbons,
    identity: s.identity,
    finance: s.finance,
  })))

  const loadCategory = useCallback(async (cat: Category) => {
    setLoading(true)
    setError('')
    const data = await fetchLeaderboard(cat)
    if (data.length === 0 && CloudSaveService.isConfigured()) {
      setError('Nessun dato per questa categoria. Sii il primo a inviare il tuo punteggio!')
    }
    setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCategory(category)
    CloudSaveService.getCurrentUser().then(u => setCurrentUserId(u?.id ?? null))
  }, [category, loadCategory])

  async function handleSubmit() {
    const user = await CloudSaveService.getCurrentUser()
    if (!user) {
      setSubmitMsg('Accedi dal pannello Impostazioni → Cloud Save per inviare il punteggio.')
      return
    }
    setSubmitting(true)
    setSubmitMsg('')
    try {
      await CloudSaveService.uploadLeaderboard({
        username: identity.name + ' ' + identity.surname,
        longevity: time.age,
        wealth: Math.max(0, Math.round(finance.money)),
        happiness: Math.round(stats.happiness),
        karma: Math.round(stats.karma + 100),
        ribbons: ribbons.filter(r => r.unlockedYear != null).length,
        ageReached: time.age,
      })
      setSubmitMsg('✅ Punteggio inviato! Aggiorno la classifica...')
      setTimeout(() => loadCategory(category), 1500)
    } catch {
      setSubmitMsg('❌ Errore nell\'invio. Riprova.')
    }
    setSubmitting(false)
  }

  const isConfigured = CloudSaveService.isConfigured()

  function formatScore(score: number, cat: Category): string {
    if (cat === 'wealth') return '€' + score.toLocaleString('it-IT')
    if (cat === 'longevity') return score + ' anni'
    return String(score)
  }

  function getMedal(rank: number): string {
    if (rank === 0) return '🥇'
    if (rank === 1) return '🥈'
    if (rank === 2) return '🥉'
    return `#${rank + 1}`
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🏆 Classifiche Globali</h2>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
        Le migliori vite simulate nel mondo
      </p>

      {!isConfigured && (
        <div style={{ padding: 14, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: '#f59e0b' }}>
            ⚠️ Cloud non configurato — le classifiche non sono disponibili in locale. Visita l'app su Vercel.
          </p>
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
        {(Object.keys(CATEGORY_META) as Category[]).map(cat => {
          const m = CATEGORY_META[cat]
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: category === cat ? 'var(--color-cta, #6366f1)' : 'rgba(255,255,255,0.07)',
                color: category === cat ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {m.emoji} {m.label}
            </button>
          )
        })}
      </div>

      {/* Submit panel */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
          Il tuo punteggio attuale — <strong>{CATEGORY_META[category].label}</strong>
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-cta, #6366f1)' }}>
              {category === 'longevity' && `${time.age} ${time.age === 1 ? 'anno' : 'anni'}`}
              {category === 'wealth' && `€${Math.max(0, Math.round(finance.money)).toLocaleString('it-IT')}`}
              {category === 'happiness' && `${Math.round(stats.happiness)}/100`}
              {category === 'karma' && `${Math.round(stats.karma + 100)} pt`}
              {category === 'ribbons' && `${ribbons.filter(r => r.unlockedYear != null).length} medaglie`}
            </p>
            {!currentUserId && (
              <p style={{ fontSize: 10, color: '#f59e0b', marginTop: 2 }}>
                Accedi per pubblicare
              </p>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !isConfigured}
            style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: isConfigured ? 'pointer' : 'not-allowed',
              background: isConfigured ? 'var(--color-cta, #6366f1)' : 'rgba(255,255,255,0.08)',
              color: isConfigured ? '#fff' : 'var(--color-text-secondary)',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Invio...' : '📤 Invia'}
          </button>
        </div>
        {submitMsg && (
          <p style={{
            fontSize: 12, marginTop: 8,
            color: submitMsg.startsWith('✅') ? '#10b981' : '#f59e0b',
          }}>
            {submitMsg}
          </p>
        )}
      </div>

      {/* Leaderboard table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 12, fontWeight: 600 }}>
            {CATEGORY_META[category].emoji} Top 25 — {CATEGORY_META[category].label}
          </p>
        </div>

        {loading && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Caricamento...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{error}</p>
          </div>
        )}

        {!loading && !error && entries.map((entry, i) => {
          const isMe = currentUserId && entry.user_id === currentUserId
          return (
            <div
              key={entry.user_id + i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: isMe ? 'rgba(99,102,241,0.08)' : 'transparent',
              }}
            >
              <div style={{
                width: 32, textAlign: 'center', fontSize: i < 3 ? 18 : 12,
                color: 'var(--color-text-secondary)', fontWeight: 600, flexShrink: 0,
              }}>
                {getMedal(i)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: isMe ? 700 : 500,
                  color: isMe ? 'var(--color-cta, #6366f1)' : 'var(--color-text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.username} {isMe && '(Tu)'}
                </p>
                {entry.age_reached && (
                  <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                    Vissuto {entry.age_reached} anni
                    {entry.ribbons_count ? ` · ${entry.ribbons_count} 🏅` : ''}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  {formatScore(entry.score, category)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reload */}
      <button
        onClick={() => loadCategory(category)}
        style={{
          width: '100%', marginTop: 12, padding: '8px 0', borderRadius: 10,
          fontSize: 12, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)',
        }}
      >
        🔄 Aggiorna classifica
      </button>
    </div>
  )
}
