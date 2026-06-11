import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'
import { LifePhaseEngine } from '../../services/LifePhaseEngine'

export function LifePhaseWidget() {
  const { time, narrative } = useGameStore(useShallow(s => ({
    time: s.time,
    narrative: s.narrative,
  })))
  const gameState = useGameStore()

  const [recapOpen, setRecapOpen] = useState(false)

  const { phase, objectives } = LifePhaseEngine.evaluate(gameState)
  const doneCount = objectives.filter(o => o.done).length
  const lastRecap = narrative?.phaseRecaps?.slice(-1)[0] ?? null

  return (
    <div className="card" style={{ marginBottom: 12, padding: '12px 14px' }}>
      {/* Phase header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 24 }}>{phase.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
            {phase.label} · età {time.age}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)', fontStyle: 'italic', lineHeight: 1.3 }}>
            {phase.tagline}
          </p>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700, color: doneCount === objectives.length ? '#10b981' : '#f59e0b',
          background: doneCount === objectives.length ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
          borderRadius: 8, padding: '3px 8px', flexShrink: 0,
        }}>
          {doneCount}/{objectives.length}
        </div>
      </div>

      {/* Objectives */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {objectives.map(({ def, done }) => (
          <div key={def.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, opacity: done ? 1 : 0.4 }}>{done ? '✅' : '⬜'}</span>
            <span style={{ fontSize: 12, color: done ? 'var(--color-text)' : 'var(--color-text-secondary)', lineHeight: 1.3 }}>
              {def.emoji} {def.label}
            </span>
          </div>
        ))}
      </div>

      {/* Previous chapter recap */}
      {lastRecap && (
        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>
          <button
            onClick={() => setRecapOpen(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: '#6b7280', fontWeight: 600,
            }}
          >
            📖 Capitolo precedente {recapOpen ? '▲' : '▼'}
          </button>
          {recapOpen && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {lastRecap.summary}
              </p>
              {lastRecap.completedObjectives.length > 0 && (
                <p style={{ fontSize: 10, color: '#10b981', margin: '6px 0 0', lineHeight: 1.4 }}>
                  ✅ {lastRecap.completedObjectives.join(' · ')}
                </p>
              )}
              {lastRecap.missedObjectives.length > 0 && (
                <p style={{ fontSize: 10, color: '#f59e0b', margin: '4px 0 0', lineHeight: 1.4 }}>
                  ⬜ {lastRecap.missedObjectives.join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
