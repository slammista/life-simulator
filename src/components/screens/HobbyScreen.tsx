import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getAllHobbyDefs, getHobbyDef } from '../../services/HobbyEngine'

export function HobbyScreen() {
  const hobbies = useGameStore(s => s.hobbies)
  const finance = useGameStore(s => s.finance)
  const addHobby = useGameStore(s => s.addHobby)
  const practiceHobby = useGameStore(s => s.practiceHobby)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'mine' | 'discover'>('mine')

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  const handleAdd = (id: string) => {
    const r = addHobby(id)
    flash(r.message, r.success)
    if (r.success) setTab('mine')
  }

  const handlePractice = (id: string) => {
    const r = practiceHobby(id)
    flash(r.message, r.success)
  }

  const allDefs = getAllHobbyDefs()
  const myIds = new Set(hobbies.map(h => h.id))
  const discoverable = allDefs.filter(d => !myIds.has(d.id))

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🎸 Hobby</h2>

      {feedback && (
        <div style={{
          borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 500,
          background: feedback.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: feedback.ok ? '#86efac' : '#fca5a5',
          border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['mine', 'discover'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : 'var(--color-text-secondary)' }}
          >
            {t === 'mine' ? `🎯 I miei (${hobbies.length})` : '🔍 Scopri'}
          </button>
        ))}
      </div>

      {/* My hobbies */}
      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hobbies.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>😐</p>
              <p style={{ fontSize: 13, color: 'var(--color-text)' }}>Nessun hobby ancora.</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>Vai su "Scopri" per iniziarne uno.</p>
            </div>
          )}
          {hobbies.map(hobby => {
            const def = getHobbyDef(hobby.id)
            const skillColor = hobby.skillLevel >= 70 ? '#10b981' : hobby.skillLevel >= 40 ? '#f59e0b' : '#6366f1'
            return (
              <div key={hobby.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{def?.emoji ?? '🎯'} {hobby.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      Dal {hobby.yearStarted} · {def?.category ?? ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: skillColor }}>{Math.round(hobby.skillLevel)}</p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>skill / 100</p>
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${hobby.skillLevel}%`, background: skillColor, borderRadius: 4 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {hobby.monetizable && hobby.monthlyIncome > 0 && (
                    <span style={{ fontSize: 12, color: '#86efac' }}>💰 €{hobby.monthlyIncome}/mese</span>
                  )}
                  <button onClick={() => handlePractice(hobby.id)}
                    style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: 12, background: 'rgba(233,69,96,0.15)', color: 'var(--color-cta)', fontSize: 13, fontWeight: 500, border: '1px solid rgba(233,69,96,0.3)', cursor: 'pointer' }}>
                    Pratica
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Discover */}
      {tab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {discoverable.map(def => (
            <div key={def.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{def.emoji} {def.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{def.category}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {def.costToStart > 0 && <p style={{ fontSize: 12, color: '#fca5a5' }}>€{def.costToStart.toLocaleString('it-IT')} avvio</p>}
                  {def.monetizable && <p style={{ fontSize: 11, color: '#86efac' }}>Monetizzabile</p>}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {Object.entries(def.statBenefits).filter(([, v]) => v !== 0).map(([k, v]) => (
                  <span key={k} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: v > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: v > 0 ? '#86efac' : '#fca5a5' }}>
                    {v > 0 ? '+' : ''}{v} {k}
                  </span>
                ))}
              </div>
              <button onClick={() => handleAdd(def.id)}
                disabled={finance.money < def.costToStart}
                style={{ width: '100%', padding: '8px 0', borderRadius: 12, fontSize: 13, fontWeight: 500, border: 'none', cursor: finance.money >= def.costToStart ? 'pointer' : 'not-allowed',
                  background: finance.money >= def.costToStart ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
                  color: finance.money >= def.costToStart ? '#fff' : 'var(--color-text-secondary)' }}>
                {finance.money >= def.costToStart ? 'Inizia' : `Servono €${def.costToStart.toLocaleString('it-IT')}`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
