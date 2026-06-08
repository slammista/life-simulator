import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { Disease, TraumaEvent } from '../../store/types'

export function HealthScreen() {
  const health = useGameStore(s => s.health)
  const stats = useGameStore(s => s.stats)
  const nation = useGameStore(s => s.nation)
  const medicalCheck = useGameStore(s => s.medicalCheck)
  const treatDisease = useGameStore(s => s.treatDisease)
  const exercise = useGameStore(s => s.exercise)
  const attendTherapy = useGameStore(s => s.attendTherapy)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  const handleMedical = () => { const r = medicalCheck(); flash(r.message, r.success) }
  const handleExercise = () => { const r = exercise(); flash(r.message, r.success) }
  const handleTherapy = () => { const r = attendTherapy(); flash(r.message, r.success) }
  const handleTreat = (id: string) => { const r = treatDisease(id); flash(r.message, r.success) }

  const severityColor = (s: number) =>
    s >= 4 ? '#ef4444' : s >= 3 ? '#f97316' : s >= 2 ? '#eab308' : '#10b981'

  const fitnessLabel = health.fitnessLevel >= 80 ? 'Atleta' : health.fitnessLevel >= 60 ? 'In forma' : health.fitnessLevel >= 40 ? 'Sedentario' : health.fitnessLevel >= 20 ? 'Scarsa' : 'Pessima'
  const traumas = health.traumas ?? []
  const therapySessions = health.therapySessions ?? 0
  const resilience = health.resilience ?? 20

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>💊 Salute</h2>

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

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Salute', val: stats.health, color: '#e94560', emoji: '❤️' },
          { label: 'Mente', val: stats.mentalHealth, color: '#8b5cf6', emoji: '🧠' },
          { label: 'Energia', val: stats.energy, color: '#10b981', emoji: '⚡' },
          { label: 'Fitness', val: health.fitnessLevel, color: '#f59e0b', emoji: '💪', label2: fitnessLabel },
        ].map(({ label, val, color, emoji, label2 }) => (
          <div key={label} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{emoji} {label}</p>
              <p style={{ fontWeight: 700, fontSize: 14, color: val < 30 ? '#ef4444' : color }}>{Math.round(val)}</p>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${val}%`, background: val < 30 ? '#ef4444' : color, borderRadius: 4 }} />
            </div>
            {label2 && <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>{label2}</p>}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <button onClick={handleExercise}
          style={{ padding: '12px 0', borderRadius: 14, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', fontSize: 13, fontWeight: 600, border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer' }}>
          🏋️ Allenati
        </button>
        <button onClick={handleMedical}
          style={{ padding: '12px 0', borderRadius: 14, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: 13, fontWeight: 600, border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer' }}>
          🏥 Visita medica{nation?.healthcarePublic ? ' (gratis)' : ' (€120)'}
        </button>
        <button onClick={handleTherapy}
          style={{ gridColumn: '1 / -1', padding: '12px 0', borderRadius: 14, background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', fontSize: 13, fontWeight: 600, border: '1px solid rgba(139,92,246,0.25)', cursor: 'pointer' }}>
          🧠 Terapia{nation?.healthcarePublic ? ' (€40)' : ' (€180)'}
        </button>
      </div>

      {/* Trauma & resilience */}
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Trauma e resilienza
      </p>
      <div className="card" style={{ padding: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Resilienza</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {therapySessions} sessioni terapia · {health.ptsd ? 'PTSD attivo' : 'Nessun PTSD'}
            </p>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#c4b5fd' }}>{resilience}/100</p>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${resilience}%`, background: '#8b5cf6', borderRadius: 4 }} />
        </div>
        {traumas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {traumas.slice(-4).reverse().map((trauma: TraumaEvent) => (
              <div key={trauma.id} style={{
                padding: '8px 10px',
                borderRadius: 10,
                background: trauma.resolved ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${trauma.resolved ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600 }}>{trauma.description}</p>
                  <span style={{ fontSize: 11, color: trauma.resolved ? '#86efac' : '#fca5a5', flexShrink: 0 }}>
                    {trauma.resolved ? 'Risolto' : `${trauma.intensity}%`}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 3 }}>
                  {trauma.type} · severità {trauma.severity}/5 · {trauma.year}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diseases */}
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Condizioni ({health.diseases.length})
      </p>
      {health.diseases.length === 0 ? (
        <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            Sei in perfetta salute!
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Nessuna malattia diagnosticata. Mantieniti attivo per non ammalarti.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {health.diseases.map((disease: Disease) => (
            <div key={disease.id} className="card" style={{ padding: 12, border: disease.severity >= 4 ? '1px solid rgba(239,68,68,0.3)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{disease.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    Dal {disease.yearContracted} · {disease.chronic ? 'Cronica' : 'Acuta'}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: `${severityColor(disease.severity)}22`, color: severityColor(disease.severity) }}>
                    Livello {disease.severity}/5
                  </span>
                  {disease.isTreated && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>In trattamento</span>
                  )}
                </div>
              </div>
              {!disease.isTreated && (
                <button onClick={() => handleTreat(disease.id)}
                  style={{ width: '100%', padding: '8px 0', borderRadius: 12, background: 'rgba(233,69,96,0.15)', color: 'var(--color-cta)', fontSize: 13, fontWeight: 500, border: '1px solid rgba(233,69,96,0.3)', cursor: 'pointer' }}>
                  💊 Cura (€{disease.treatmentCost.toLocaleString('it-IT')})
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Addictions */}
      {health.addictions.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Dipendenze
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {health.addictions.map(a => (
              <div key={a.substance} className="card" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 13 }}>{a.substance}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${a.level}%`, background: '#ef4444', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#fca5a5' }}>{a.level}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
