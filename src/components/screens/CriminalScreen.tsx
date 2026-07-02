import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { CriminalEngine } from '../../services/CriminalEngine'
import { feedback } from '../../services/FeedbackEngine'

const MIN_AGE_CRIME = 14

const CATEGORY_EMOJI: Record<string, string> = {
  theft: '🔓',
  fraud: '📄',
  violence: '👊',
  drug: '💊',
  corruption: '🤝',
  vandalism: '🖌️',
}

export function CriminalScreen() {
  const criminal = useGameStore(s => s.criminal)
  const state = useGameStore(s => s)
  const age = useGameStore(s => s.time.age)
  const commitCrime = useGameStore(s => s.commitCrime)
  const robSomeone = useGameStore(s => s.robSomeone)
  const bribeOfficial = useGameStore(s => s.bribeOfficial)
  const workInPrison = useGameStore(s => s.workInPrison)
  const studyInPrison = useGameStore(s => s.studyInPrison)
  const fightInPrison = useGameStore(s => s.fightInPrison)
  const showAlert = useToastStore(s => s.showAlert)

  const [tab, setTab] = useState<'status' | 'crimes'>('status')

  const flash = (msg: string, ok: boolean) => {
    feedback(ok ? 'success' : 'error')
    showAlert(msg, ok, ok ? '🚔' : '🚨')
  }

  const handleCrime = (id: string) => {
    const r = commitCrime(id)
    flash(r.message, r.success)
  }

  const available = CriminalEngine.getAvailableCrimes(state)

  // Whole criminal world is locked until 14
  if (age < MIN_AGE_CRIME && !criminal.inPrison) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🚔 Attività criminali</h2>
        <div className="card card-locked" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔞</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>Troppo giovane</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Le attività criminali sono disponibili dai {MIN_AGE_CRIME} anni.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🚔 Attività criminali</h2>

      {/* Prison alert */}
      {criminal.inPrison && (
        <div style={{ borderRadius: 14, padding: '14px', marginBottom: 14, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>🔒 Sei in prigione</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Pena: {criminal.prisonSentence} anni · Scontati: {criminal.prisonServed} · Rimanenti: {criminal.prisonSentence - criminal.prisonServed}
          </p>
          <div style={{ marginTop: 8, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(criminal.prisonServed / criminal.prisonSentence) * 100}%`, background: '#ef4444', borderRadius: 4 }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['status', 'crimes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : 'var(--color-text-secondary)' }}
          >
            {t === 'status' ? '📋 Fascicolo' : '🎭 Azioni'}
          </button>
        ))}
      </div>

      {tab === 'status' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Status badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Fedina penale', val: criminal.hasRecord ? 'Sporca ❌' : 'Pulita ✅', color: criminal.hasRecord ? '#fca5a5' : '#86efac' },
              { label: 'Stato', val: criminal.inPrison ? 'In prigione' : criminal.parole ? 'Libertà vigilata' : 'Libero/a', color: criminal.inPrison ? '#fca5a5' : '#86efac' },
              { label: 'Crimini totali', val: criminal.crimes.length, color: 'var(--color-text)' },
              { label: 'Condanne', val: criminal.crimes.filter(c => c.convicted).length, color: 'var(--color-text)' },
            ].map(({ label, val, color }) => (
              <div key={label} className="card" style={{ padding: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</p>
                <p style={{ fontWeight: 600, fontSize: 13, color }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Crime history */}
          {criminal.crimes.length > 0 && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 8, marginTop: 4 }}>
                Storico reati
              </p>
              {[...criminal.crimes].reverse().map((c, i) => (
                <div key={i} className="card" style={{ padding: '10px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{c.type.replace('_', ' ')}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{c.year}</p>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: c.convicted ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: c.convicted ? '#fca5a5' : '#86efac' }}>
                    {c.convicted ? `Condannato ${c.sentence}y` : 'Non condannato'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'crimes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {criminal.inPrison ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ borderRadius: 12, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 2 }}>🔒 Sei in carcere — {criminal.prisonSentence - criminal.prisonServed} anni rimasti</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Usa il tempo per migliorarti o per sopravvivere.</p>
              </div>

              {/* Prison activities */}
              {[
                { label: '⛏️ Lavoro carcerario', desc: 'Guadagna €50–€200. Max 3 volte/anno.', color: '#f59e0b', action: workInPrison },
                { label: '📚 Studia in carcere', desc: '+3 intelligenza, +2 benessere. Max 2 volte/anno.', color: '#3b82f6', action: studyInPrison },
                { label: '🥊 Provoca una rissa', desc: '55% vinci (+ rispetto), 45% perdi (− salute). 1 volta/anno.', color: '#ef4444', action: fightInPrison },
              ].map(({ label, desc, color, action }) => (
                <div key={label} style={{ borderRadius: 12, padding: '12px 14px', background: `${color}10`, border: `1px solid ${color}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{label}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { const r = action(); flash(r.message, r.success) }}
                    style={{ width: '100%', padding: '8px 0', borderRadius: 10, background: `${color}20`, color, fontSize: 13, fontWeight: 500, border: `1px solid ${color}40`, cursor: 'pointer' }}>
                    Esegui
                  </button>
                </div>
              ))}

              {/* Bribe from prison */}
              <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>🤝 Corrompi un funzionario</p>
                  <p style={{ fontSize: 11, color: '#fcd34d' }}>Successo 55%</p>
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Paga una tangente per uscire di prigione. Costo €2.000–€5.000.</p>
                <button onClick={() => { const r = bribeOfficial(); flash(r.message, r.success) }}
                  style={{ width: '100%', padding: '8px 0', borderRadius: 12, background: 'rgba(245,158,11,0.15)', color: '#fcd34d', fontSize: 13, fontWeight: 500, border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer' }}>
                  Proponi tangente
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ borderRadius: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ fontSize: 12, color: '#fca5a5' }}>⚠️ Attenzione: le attività criminali comportano rischio di arresto e conseguenze permanenti.</p>
              </div>
              {available.length === 0 && (
                <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>😇</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                    Nessuna azione disponibile.
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Non hai i requisiti per nessun crimine ora. Cresci, esplora, torna più tardi.
                  </p>
                </div>
              )}
              {available.map(def => (
                <div key={def.id} className="card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{def.emoji} {def.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                        {CATEGORY_EMOJI[def.category]} {def.category}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {def.baseMoneyGain > 0 && <p style={{ fontSize: 12, color: '#86efac' }}>+€{def.baseMoneyGain.toLocaleString('it-IT')}</p>}
                      <p style={{ fontSize: 11, color: '#fca5a5' }}>Arresto {Math.round(def.baseArrestChance * 100)}%</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-secondary)' }}>
                      Pena max {def.sentence}y
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
                      Karma {def.karmaHit}
                    </span>
                  </div>
                  <button onClick={() => handleCrime(def.id)}
                    style={{ width: '100%', padding: '8px 0', borderRadius: 12, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 13, fontWeight: 500, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
                    Commetti
                  </button>
                </div>
              ))}

              {/* Street robbery */}
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '10px 12px', marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>🦹 Rapina di strada</p>
                  <p style={{ fontSize: 11, color: '#fca5a5' }}>Arresto 40%</p>
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Rapina un passante. Guadagno €50–€500 se riesce.</p>
                <button onClick={() => { const r = robSomeone(); flash(r.message, r.success) }}
                  style={{ width: '100%', padding: '8px 0', borderRadius: 12, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 13, fontWeight: 500, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}
                  disabled={state.criminal.inPrison}>
                  Esegui
                </button>
              </div>

              {/* Bribe (when outside prison but has record) */}
              {(!criminal.inPrison && criminal.hasRecord) && (
                <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '10px 12px', marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>🤝 Corrompi un funzionario</p>
                    <p style={{ fontSize: 11, color: '#fcd34d' }}>Successo 55%</p>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Paga una tangente per far cadere le accuse o uscire di prigione. Costo €2.000–€5.000.</p>
                  <button onClick={() => { const r = bribeOfficial(); flash(r.message, r.success) }}
                    style={{ width: '100%', padding: '8px 0', borderRadius: 12, background: 'rgba(245,158,11,0.15)', color: '#fcd34d', fontSize: 13, fontWeight: 500, border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer' }}>
                    Proponi tangente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
