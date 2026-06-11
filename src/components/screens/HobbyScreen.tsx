import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getAllHobbyDefs, getHobbyDef } from '../../services/HobbyEngine'
import { useToastStore } from '../../store/toastStore'
import { haptic } from '../../services/HapticEngine'

export function HobbyScreen() {
  const hobbies = useGameStore(s => s.hobbies)
  const finance = useGameStore(s => s.finance)
  const band = useGameStore(s => s.band)
  const addHobby = useGameStore(s => s.addHobby)
  const practiceHobby = useGameStore(s => s.practiceHobby)
  const formBand = useGameStore(s => s.formBand)
  const performConcert = useGameStore(s => s.performConcert)
  const disbandBand = useGameStore(s => s.disbandBand)
  const showPanel = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const [tab, setTab] = useState<'mine' | 'discover' | 'band'>('mine')
  const [bandName, setBandName] = useState('')
  const [bandGenre, setBandGenre] = useState('rock')

  const flash = (msg: string, ok: boolean, emoji = '🎸', effects: Record<string, number> = {}) => {
    haptic(ok ? 'success' : 'error')
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => closePanel(), 3500)
  }

  const handleAdd = (id: string) => {
    const r = addHobby(id)
    flash(r.message, r.success, '🎸', r.effects as Record<string, number>)
    if (r.success) setTab('mine')
  }

  const handlePractice = (id: string) => {
    const r = practiceHobby(id)
    flash(r.message, r.success, '⭐', r.effects as Record<string, number>)
  }

  const allDefs = getAllHobbyDefs()
  const myIds = new Set(hobbies.map(h => h.id))
  const discoverable = allDefs.filter(d => !myIds.has(d.id))

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🎸 Hobby</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['mine', 'discover', 'band'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : 'var(--color-text-secondary)' }}
          >
            {t === 'mine' ? `🎯 I miei (${hobbies.length})` : t === 'discover' ? '🔍 Scopri' : '🎸 Band'}
          </button>
        ))}
      </div>

      {/* My hobbies */}
      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hobbies.length === 0 && (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎸</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                Nessuna passione ancora.
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Gli hobby aumentano felicità e abilità. Vai su "Scopri" per iniziarne uno.
              </p>
            </div>
          )}
          {hobbies.map(hobby => {
            const def = getHobbyDef(hobby.id)
            const skillColor = hobby.skillLevel >= 70 ? '#10b981' : hobby.skillLevel >= 40 ? '#f59e0b' : '#6366f1'
            const skillLabel = hobby.skillLevel >= 80 ? 'Esperto' : hobby.skillLevel >= 55 ? 'Avanzato' : hobby.skillLevel >= 30 ? 'Intermedio' : 'Principiante'
            return (
              <div key={hobby.id} className="card" style={{
                padding: '14px',
                background: `linear-gradient(135deg, ${skillColor}10 0%, var(--bg-card) 70%)`,
                border: `1px solid ${skillColor}30`,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {def?.emoji ?? '🎯'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{hobby.name}</p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: skillColor, background: `${skillColor}18`, padding: '1px 7px', borderRadius: 99, border: `1px solid ${skillColor}30` }}>
                        {skillLabel}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>dal {hobby.yearStarted}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 900, fontSize: 20, color: skillColor, lineHeight: 1 }}>{Math.round(hobby.skillLevel)}</p>
                    <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 1 }}>/ 100</p>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${hobby.skillLevel}%`, background: skillColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {hobby.monetizable && hobby.monthlyIncome > 0 ? (
                    <span style={{ fontSize: 12, color: '#86efac', fontWeight: 600 }}>💰 +€{hobby.monthlyIncome}/mese</span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>+Felicità · +Skill</span>
                  )}
                  <button
                    onClick={() => handlePractice(hobby.id)}
                    className="tap-scale"
                    style={{
                      padding: '8px 20px', borderRadius: 12,
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
                      color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(124,92,255,0.3)',
                    }}
                  >
                    Pratica
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Band */}
      {tab === 'band' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {band && band.isActive ? (
            <>
              <div className="card" style={{ padding: 14, background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, var(--bg-card) 70%)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16 }}>🎸 {band.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{band.genre} · {band.members} membri</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>Popolarità</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: '#a78bfa' }}>{band.popularity}/100</p>
                  </div>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${band.popularity}%`, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-secondary)' }}>
                    Fondata nel {band.formed}
                  </span>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.1)', color: '#86efac' }}>
                    💰 €{band.totalEarnings.toLocaleString('it-IT')} totali
                  </span>
                </div>
              </div>

              <button
                onClick={() => { const r = performConcert(); flash(r.message, r.success, '🎤', r.effects as Record<string, number>) }}
                className="tap-scale"
                style={{ width: '100%', padding: '12px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(99,102,241,0.2) 100%)',
                  color: '#c4b5fd', fontSize: 14, fontWeight: 700 }}>
                🎤 Suona dal vivo
              </button>

              <button
                onClick={() => { const r = disbandBand(); flash(r.message, r.success, '💔') }}
                style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                  background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: 13, fontWeight: 500 }}>
                💔 Scioglie la band
              </button>
            </>
          ) : (
            <>
              {band && !band.isActive && (
                <div className="card" style={{ padding: '12px 14px', marginBottom: 4, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ fontSize: 13, color: '#fca5a5' }}>💔 La tua ex band "{band.name}" si è sciolta.</p>
                </div>
              )}
              <div className="card" style={{ padding: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>🎸 Forma una band</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  Serve musica ≥ 20 e almeno 14 anni. Costo €500.
                </p>
                <input
                  type="text" placeholder="Nome della band…" value={bandName}
                  onChange={e => setBandName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, fontSize: 13, marginBottom: 8,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--color-text)', boxSizing: 'border-box' as const }}
                />
                <select
                  value={bandGenre} onChange={e => setBandGenre(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, fontSize: 13, marginBottom: 12,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--color-text)', boxSizing: 'border-box' as const }}>
                  {['rock', 'pop', 'jazz', 'metal', 'indie', 'rap', 'elettronica', 'folk'].map(g => (
                    <option key={g} value={g} style={{ background: '#1a1a2e' }}>{g}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (!bandName.trim()) { flash('Dai un nome alla band!', false, '❌'); return }
                    const r = formBand(bandName.trim(), bandGenre)
                    flash(r.message, r.success, '🎸', r.effects as Record<string, number>)
                    if (r.success) setBandName('')
                  }}
                  className="tap-scale"
                  style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
                    color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 3px 12px rgba(124,92,255,0.3)' }}>
                  🎸 Forma la band (€500)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Discover */}
      {tab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {discoverable.length === 0 && (
            <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎯</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Hai esplorato tutto!</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Hai già tutti gli hobby disponibili. Continua a praticarli per crescere.
              </p>
            </div>
          )}
          {discoverable.map(def => {
            const canAfford = finance.money >= def.costToStart
            const benefits = Object.entries(def.statBenefits).filter(([, v]) => v !== 0)
            return (
              <div
                key={def.id}
                className={`card${canAfford ? ' tap-scale' : ' card-locked'}`}
                style={{ padding: '14px', opacity: canAfford ? 1 : 0.7 }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {def.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)', marginBottom: 3 }}>{def.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{def.category}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {def.costToStart > 0 ? (
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                        background: canAfford ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: canAfford ? '#86efac' : '#fca5a5',
                        border: `1px solid ${canAfford ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      }}>
                        {canAfford ? '' : '🔒 '}€{def.costToStart.toLocaleString('it-IT')}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#86efac', fontWeight: 600 }}>Gratis</span>
                    )}
                    {def.monetizable && (
                      <p style={{ fontSize: 10, color: '#86efac', marginTop: 2 }}>💰 Monetizzabile</p>
                    )}
                  </div>
                </div>

                {benefits.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                    {benefits.map(([k, v]) => (
                      <span key={k} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: (v as number) > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: (v as number) > 0 ? '#86efac' : '#fca5a5' }}>
                        {(v as number) > 0 ? '+' : ''}{v} {k}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleAdd(def.id)}
                  disabled={!canAfford}
                  className={canAfford ? 'tap-scale' : undefined}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    background: canAfford
                      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)'
                      : 'rgba(255,255,255,0.05)',
                    color: canAfford ? '#fff' : 'var(--color-text-secondary)',
                    boxShadow: canAfford ? '0 4px 16px rgba(124,92,255,0.3)' : 'none',
                  }}
                >
                  {canAfford ? 'Inizia' : `Servono €${def.costToStart.toLocaleString('it-IT')}`}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
