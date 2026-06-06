import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { CriminalEngine } from '../../services/CriminalEngine'

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
  const commitCrime = useGameStore(s => s.commitCrime)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'status' | 'crimes'>('status')

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleCrime = (id: string) => {
    const r = commitCrime(id)
    flash(r.message, r.success)
  }

  const available = CriminalEngine.getAvailableCrimes(state)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🚔 Attività criminali</h2>

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
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>
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
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 22, marginBottom: 6 }}>🔒</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Non puoi commettere crimini mentre sei in prigione.</p>
            </div>
          ) : (
            <>
              <div style={{ borderRadius: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ fontSize: 12, color: '#fca5a5' }}>⚠️ Attenzione: le attività criminali comportano rischio di arresto e conseguenze permanenti.</p>
              </div>
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
