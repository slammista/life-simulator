import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { SubstanceEngine, type AlcoholType, type SmokeType } from '../../services/SubstanceEngine'

// Age-based access rules (conservative, safety-first)
const MIN_AGE_SMOKE   = 13  // sigarette/vape
const MIN_AGE_CANNABIS = 16
const MIN_AGE_ALCOHOL  = 16

export function SubstanceScreen() {
  const { stats, finance, health, time, drinkAlcohol, smokeCigarette, quitSubstance } = useGameStore()
  const [feedback, setFeedback] = useState('')
  const age = time.age

  const ALCOHOL = SubstanceEngine.getAlcohol()
  const SMOKE   = SubstanceEngine.getSmoke()

  const handleDrink = (type: AlcoholType) => {
    const r = drinkAlcohol(type)
    setFeedback(r.message)
  }
  const handleSmoke = (type: SmokeType) => {
    const r = smokeCigarette(type)
    setFeedback(r.message)
  }
  const handleQuit = (substance: string) => {
    const r = quitSubstance(substance)
    setFeedback(r.message)
  }

  const addictions = health.addictions
  const hasAddiction = addictions.length > 0

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback && (
        <div className="card" style={{ padding: 10, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* Dipendenze attive */}
      {hasAddiction && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Dipendenze Attive
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {addictions.map(a => {
              const color = a.level > 70 ? '#ef4444' : a.level > 40 ? '#f97316' : '#eab308'
              return (
                <div key={a.substance} className="card" style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                      {a.substance === 'alcohol' ? '🍺 Alcol' : a.substance === 'cigarette' ? '🚬 Sigarette' : a.substance === 'vape' ? '💨 Vape' : '🌿 Cannabis'}
                    </span>
                    <span style={{ fontSize: 12, color }}>Livello {a.level}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${a.level}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <button
                    className="btn-secondary"
                    style={{ width: '100%', padding: '6px 0', fontSize: 12 }}
                    onClick={() => handleQuit(a.substance)}
                  >
                    💪 Tenta di smettere
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Blocco minori assoluto */}
      {age < MIN_AGE_SMOKE && (
        <div className="card card-locked" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔞</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>Accesso negato</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Sei troppo giovane per questa sezione. Disponibile dai {MIN_AGE_SMOKE} anni.
          </p>
        </div>
      )}

      {/* Alcol — dai 16 anni */}
      {age >= MIN_AGE_ALCOHOL && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            🍺 Alcol
          </p>
          {age < 18 && (
            <div style={{ fontSize: 11, color: '#f97316', marginBottom: 8, padding: '6px 10px', background: 'rgba(249,115,22,0.1)', borderRadius: 8 }}>
              ⚠️ Minorenne — rischio conseguenze familiari, scolastiche e legali
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(Object.entries(ALCOHOL) as [AlcoholType, typeof ALCOHOL[AlcoholType]][]).map(([type, def]) => (
              <button
                key={type}
                className="card tap-scale"
                style={{ padding: '10px', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                onClick={() => handleDrink(type)}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>{def.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{def.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>€{def.cost} · +{def.effects.happiness ?? 0}😊</div>
              </button>
            ))}
          </div>
          {finance.money < 5 && (
            <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 4 }}>Non hai abbastanza soldi per bere.</p>
          )}
        </div>
      )}

      {/* Fumo/sostanze — dai 13 anni (sigarette/vape), dai 16 (cannabis) */}
      {age >= MIN_AGE_SMOKE && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            🚬 Fumo &amp; Sostanze
          </p>
          {age < 18 && (
            <div style={{ fontSize: 11, color: '#f97316', marginBottom: 8, padding: '6px 10px', background: 'rgba(249,115,22,0.1)', borderRadius: 8 }}>
              ⚠️ Minorenne — rischio sospensione scolastica, punizione genitori, conseguenze salute
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(Object.entries(SMOKE) as [SmokeType, typeof SMOKE[SmokeType]][]).map(([type, def]) => {
              const blocked = type === 'marijuana' && age < MIN_AGE_CANNABIS
              return (
                <button
                  key={type}
                  className="card tap-scale"
                  style={{ padding: '10px', border: 'none', cursor: blocked ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: blocked ? 0.4 : 1 }}
                  onClick={() => !blocked && handleSmoke(type)}
                  disabled={blocked}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{def.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{def.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>€{def.cost}</div>
                  {blocked && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 2 }}>min. {MIN_AGE_CANNABIS} anni</div>}
                  {!def.legal && !blocked && <div style={{ fontSize: 9, color: '#f97316', marginTop: 2 }}>⚠️ Illegale</div>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Info salute */}
      <div className="card" style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.05)' }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Stato di salute</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { label: 'Salute', value: stats.health, color: stats.health > 60 ? '#22c55e' : stats.health > 30 ? '#f97316' : '#ef4444' },
            { label: 'Sal. Mentale', value: stats.mentalHealth, color: stats.mentalHealth > 60 ? '#22c55e' : '#f97316' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize: 11, color: s.color }}>{s.value}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
