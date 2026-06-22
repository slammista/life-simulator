import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { type SocialLocation } from '../../services/WorkSchoolEngine'
import { useToastStore } from '../../store/toastStore'

const LOCATION_CONFIG: Array<{
  id: SocialLocation
  label: string
  emoji: string
  description: string
  skillHint: string
  color: string
}> = [
  { id: 'bar',          label: 'Bar',          emoji: '🍺', description: 'Una birra in compagnia. Facile per fare conoscenze casuali.', skillHint: 'Socialità +1',      color: 'rgba(251,191,36,0.12)' },
  { id: 'quartiere',    label: 'Quartiere',    emoji: '🏘️', description: 'Una passeggiata nel vicinato. Incontri casuali nel quotidiano.', skillHint: 'Socialità +1',   color: 'rgba(34,197,94,0.1)' },
  { id: 'palestra',     label: 'Palestra',     emoji: '💪', description: 'Workout e socialità. Chi si allena insieme si conosce meglio.', skillHint: 'Atletica +2',     color: 'rgba(239,68,68,0.1)' },
  { id: 'festa',        label: 'Festa',        emoji: '🎉', description: 'Musica, gente nuova e flirt possibili. Alta energia.', skillHint: 'Socialità +2',              color: 'rgba(168,85,247,0.12)' },
  { id: 'app_dating',   label: 'App Dating',   emoji: '📱', description: 'Match digitali. Più probabilità di incontri romantici.', skillHint: 'Carisma +1',            color: 'rgba(244,114,182,0.12)' },
  { id: 'evento',       label: 'Evento',       emoji: '🎭', description: 'Festival, concerti, mercati. Persone con interessi simili.', skillHint: 'Creatività +1',      color: 'rgba(96,165,250,0.12)' },
  { id: 'volontariato', label: 'Volontariato', emoji: '🤝', description: 'Aiutare gli altri. Incontri persone genuine e con valori.', skillHint: 'Karma +2 · Carisma +1', color: 'rgba(16,185,129,0.12)' },
  { id: 'club',         label: 'Club / Hobby', emoji: '🎸', description: 'Un club, gruppo o hobby condiviso. Legami duraturi.', skillHint: 'Creatività +1 · Musica +1', color: 'rgba(99,102,241,0.12)' },
]

export function SocializeScreen() {
  const socializeOutside = useGameStore(s => s.socializeOutside)
  const volunteerCommunity = useGameStore(s => s.volunteerCommunity)
  const skills = useGameStore(s => s.skills)
  const playerAge = useGameStore(s => s.time.age)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState<SocialLocation | null>(null)

  const pushToast = useToastStore(s => s.push)

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    pushToast(msg, ok ? '🎉' : '😐', ok)
    setTimeout(() => setFeedback(null), 3500)
  }

  const handle = (location: SocialLocation) => {
    if (loading) return
    setLoading(location)
    setTimeout(() => {
      const r = socializeOutside(location)
      flash(r.message, r.success)
      setLoading(null)
    }, 300)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>🎉 Socializza</h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Esci e incontra nuove persone. Le relazioni nascono nel mondo reale.
        </p>
      </div>

      {feedback && (
        <div style={{
          borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 500,
          background: feedback.ok ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.1)',
          color: feedback.ok ? '#86efac' : '#94a3b8',
          border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.2)'}`,
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Age gate */}
      {playerAge < 14 && (
        <div style={{ borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
          👦 Ancora troppo giovane per uscire da solo/a. Queste attività si sbloccano con l'adolescenza.
        </div>
      )}

      {/* Skills mini-display */}
      <div className="card" style={{ padding: '10px 14px', marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>Le tue abilità sociali</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { key: 'socialSkill', label: 'Socialità', color: '#a5b4fc' },
            { key: 'charisma', label: 'Carisma', color: '#f472b6' },
            { key: 'athleticism', label: 'Atletica', color: '#4ade80' },
            { key: 'creativity', label: 'Creatività', color: '#fbbf24' },
          ].map(({ key, label, color }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <div style={{ width: 32, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(skills as unknown as Record<string, number>)[key] ?? 0}%`, background: color, borderRadius: 2 }} />
              </div>
              <span style={{ color: 'var(--color-text-secondary)' }}>{label} {(skills as unknown as Record<string, number>)[key] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Community volunteering */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8 }}>Volontariato</p>
        <div
          className="card tap-scale"
          style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, var(--bg-card) 70%)', border: '1px solid rgba(16,185,129,0.22)', cursor: 'pointer' }}
          onClick={() => { const r = volunteerCommunity(); flash(r.message, r.success) }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🤲</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)', marginBottom: 2 }}>Volontariato comunitario</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Aiuta la comunità locale. Max 2 volte per anno.</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 12, color: '#86efac', fontWeight: 600 }}>+Karma</p>
              <p style={{ fontSize: 11, color: '#86efac' }}>+Felicità</p>
            </div>
          </div>
        </div>
      </div>

      {/* Location grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LOCATION_CONFIG.map(loc => {
          const isLoading = loading === loc.id
          const tooYoung = playerAge < 14
          return (
            <div
              key={loc.id}
              className="card tap-scale"
              style={{
                padding: '14px 14px 12px',
                background: `linear-gradient(135deg, ${loc.color} 0%, var(--bg-card) 70%)`,
                opacity: tooYoung ? 0.5 : 1,
                cursor: tooYoung ? 'not-allowed' : 'pointer',
              }}
              onClick={() => !tooYoung && handle(loc.id)}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-soft)',
                  fontSize: 22,
                }}>
                  {isLoading ? '⏳' : loc.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)', marginBottom: 2 }}>
                    {loc.label}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {loc.description}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {loc.skillHint}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); !tooYoung && handle(loc.id) }}
                  disabled={tooYoung || !!loading}
                  style={{
                    padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
                    color: '#fff', border: 'none', cursor: tooYoung ? 'not-allowed' : 'pointer',
                    opacity: loading && !isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? '...' : 'Vai'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, borderRadius: 12, padding: '10px 14px', fontSize: 11, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
        💡 Le persone incontrate qui appaiono nelle Relazioni. Colleghi e compagni di scuola si trovano nei tab Carriera e Istruzione.
      </div>
    </div>
  )
}
