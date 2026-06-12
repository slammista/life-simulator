import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { DatingEngine, type DatingApp } from '../../services/DatingEngine'
import { ConfirmDialog } from '../common/ConfirmDialog'

function CompatChip({ value }: { value: number }) {
  const color = value >= 75 ? '#f472b6' : value >= 55 ? '#f59e0b' : '#94a3b8'
  const label = value >= 80 ? 'Ottima intesa' : value >= 60 ? 'Buona intesa' : value >= 40 ? 'Discreta' : 'Poca affinità'
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 99,
      background: `${color}18`, color, border: `1px solid ${color}35`, fontWeight: 600,
    }}>
      💕 {value}% · {label}
    </span>
  )
}

const WEDDING_PRESETS = [
  { label: 'Intimo', cost: 5000 },
  { label: 'Standard', cost: 20000 },
  { label: 'Lusso', cost: 50000 },
]

export function DatingScreen() {
  const { relationships, stats, finance, time, criminal, swipe, proposeToPartner, getMarried, getDivorced, skills } = useGameStore()
  const [feedback, setFeedback] = useState('')
  const [selectedApp, setSelectedApp] = useState<DatingApp>('tinder')
  const [ringValue, setRingValue] = useState(2000)
  const [weddingBudget, setWeddingBudget] = useState(20000)

  const apps = DatingEngine.getApps()
  const partners = relationships.filter(r => r.stage === 'partner' || r.historyFlags.includes('engaged'))
  const spouses = relationships.filter(r => r.type === 'spouse')
  const engagedWith = relationships.find(r => r.historyFlags.includes('engaged') && r.type !== 'spouse')

  const handleSwipe = () => {
    const r = swipe(selectedApp)
    setFeedback(r.message)
  }
  const handlePropose = (npcId: string) => {
    const r = proposeToPartner(npcId, ringValue)
    setFeedback(r.message)
  }
  const handleMarry = (npcId: string) => {
    const r = getMarried(npcId, weddingBudget)
    setFeedback(r.message)
  }
  const [divorceId, setDivorceId] = useState<string | null>(null)
  const handleDivorce = (npcId: string) => setDivorceId(npcId)
  const confirmDivorce = () => {
    if (!divorceId) return
    const r = getDivorced(divorceId)
    setDivorceId(null)
    setFeedback(r.message)
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback && (
        <div className="card" style={{ padding: 10, background: 'rgba(236,72,153,0.1)', borderColor: 'rgba(236,72,153,0.3)', fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* Spouse */}
      {spouses.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            💒 Sposato/a con
          </p>
          {spouses.map(s => {
            const compat = DatingEngine.computeCompatibility(skills, stats, s.personalityTraits)
            return (
            <div key={s.id} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 22 }}>{s.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 8 }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 6 }}>{s.age} anni</span>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <CompatChip value={compat} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Amore', value: s.love, color: '#f472b6' },
                  { label: 'Fiducia', value: s.trust, color: '#60a5fa' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{stat.label}</span>
                      <span style={{ fontSize: 11, color: stat.color }}>{stat.value}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${stat.value}%`, background: stat.color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
              {s.toxicityTag && (
                <div style={{ fontSize: 11, color: '#f97316', marginBottom: 8 }}>⚠️ Relazione tossica</div>
              )}
              <button
                style={{ width: '100%', padding: '7px 0', fontSize: 12, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer' }}
                onClick={() => handleDivorce(s.id)}
              >
                📜 Divorzia
              </button>
            </div>
            )
          })}
        </div>
      )}

      {/* Engaged / Partner */}
      {engagedWith && !spouses.find(s => s.id === engagedWith.id) && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            💍 Fidanzato/a con
          </p>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{engagedWith.emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{engagedWith.name}</div>
                <div style={{ fontSize: 11, color: '#a78bfa' }}>💍 Fidanzati</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Budget matrimonio</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {WEDDING_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setWeddingBudget(p.cost)}
                  style={{
                    flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 11, border: 'none', cursor: 'pointer',
                    background: weddingBudget === p.cost ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
                    color: weddingBudget === p.cost ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {p.label}<br />€{p.cost.toLocaleString()}
                </button>
              ))}
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '8px 0', fontSize: 13 }}
              onClick={() => handleMarry(engagedWith.id)}
              disabled={finance.money < weddingBudget}
            >
              💒 Sposati (€{weddingBudget.toLocaleString()})
            </button>
          </div>
        </div>
      )}

      {/* Partner (not yet engaged) */}
      {partners.filter(p => !p.historyFlags.includes('engaged') && p.type !== 'spouse').map(partner => {
        const compat = DatingEngine.computeCompatibility(skills, stats, partner.personalityTraits)
        return (
        <div key={partner.id}>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            ❤️ Partner
          </p>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{partner.emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{partner.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>❤️ Partner · {partner.age} anni</div>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <CompatChip value={compat} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Valore anello</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[500, 2000, 8000, 25000].map(v => (
                <button
                  key={v}
                  onClick={() => setRingValue(v)}
                  style={{
                    flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 10, border: 'none', cursor: 'pointer',
                    background: ringValue === v ? '#a855f7' : 'rgba(255,255,255,0.07)',
                    color: ringValue === v ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  €{v.toLocaleString()}
                </button>
              ))}
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '8px 0', fontSize: 13, background: '#a855f7' }}
              onClick={() => handlePropose(partner.id)}
              disabled={finance.money < ringValue}
            >
              💍 Proponi (€{ringValue.toLocaleString()})
            </button>
          </div>
        </div>
        )
      })}

      {/* Dating apps */}
      {spouses.length === 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            📱 App di Dating
          </p>
          {time.age < 18 ? (
            <div className="card card-locked" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>❤️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>Non ancora disponibile</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Le app di dating sono disponibili dai 18 anni. Torna quando sei maggiorenne.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {apps.map(app => (
                  <label key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="radio" name="datingapp"
                      checked={selectedApp === app.id}
                      onChange={() => setSelectedApp(app.id as DatingApp)}
                    />
                    <span style={{ fontSize: 18 }}>{app.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{app.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        Match rate base: {Math.round(app.matchRate * 100)}% · {app.ageRange[0]}-{app.ageRange[1]} anni
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                💡 Il tuo aspetto ({stats.looks}/100) influenza il match rate
              </p>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '8px 0', fontSize: 13 }}
                onClick={handleSwipe}
                disabled={criminal.inPrison}
              >
                🔥 Scorri su {apps.find(a => a.id === selectedApp)?.name}
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={divorceId !== null}
        title="Divorziare?"
        message="Sei sicuro/a di voler divorziare? Avrà conseguenze economiche ed emotive."
        confirmLabel="Divorzia"
        cancelLabel="Annulla"
        danger
        onConfirm={confirmDivorce}
        onCancel={() => setDivorceId(null)}
      />
    </div>
  )
}
