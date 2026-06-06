import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { PARENTING_ACTIONS } from '../../services/ParentingEngine'
import type { Child } from '../../store/types'

export default function ParentingScreen() {
  const { children, time, haveChild, adoptChild, interactWithChild } = useGameStore()
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const act = (fn: () => { success: boolean; message: string }) => {
    const r = fn()
    setFeedback({ msg: r.message, ok: r.success })
    setTimeout(() => setFeedback(null), 3000)
  }

  const schoolLabel: Record<string, string> = {
    none: 'Neonato', kindergarten: 'Asilo', elementary: 'Elementari',
    middle: 'Medie', highschool: 'Liceo', bachelor: 'Università',
    master: 'Magistrale', phd: 'Dottorato',
  }

  return (
    <div className="screen-content">
      <h2 className="section-title">👨‍👩‍👧‍👦 Famiglia</h2>

      {feedback && (
        <div className={`feedback-banner ${feedback.ok ? 'success' : 'error'}`}>
          {feedback.msg}
        </div>
      )}

      {/* Azioni principali */}
      <div className="card">
        <h3 className="card-title">Avere figli</h3>
        <p className="card-subtitle">
          Figli: {children.length}/8 · Età: {time.age}
        </p>
        <div className="action-grid">
          <button
            className="action-btn"
            onClick={() => act(haveChild)}
            disabled={time.age < 18 || time.age > 50 || children.length >= 8}
          >
            👶 Figlio biologico
          </button>
          <button
            className="action-btn"
            onClick={() => act(adoptChild)}
            disabled={time.age < 18 || children.length >= 8}
          >
            🏠 Adotta (€10.000)
          </button>
        </div>
      </div>

      {/* Lista figli */}
      {children.length === 0 ? (
        <div className="card empty-state">
          <p>Non hai ancora figli. Avere un figlio è una delle esperienze più significative della vita.</p>
        </div>
      ) : (
        <div className="children-list">
          {children.map(child => (
            <div
              key={child.id}
              className={`card child-card ${selectedChild?.id === child.id ? 'selected' : ''}`}
              onClick={() => setSelectedChild(selectedChild?.id === child.id ? null : child)}
            >
              <div className="child-header">
                <span className="child-name">
                  {child.gender === 'female' ? '👧' : '👦'} {child.name}
                </span>
                <span className="child-age">{child.age} anni</span>
                {child.isAdopted && <span className="badge">Adottato</span>}
              </div>

              <div className="child-stats-row">
                <StatBar label="Legame" value={child.bondWithPlayer} color="#e91e8c" />
                <StatBar label="Felicità" value={child.happiness} color="#ff9800" />
                <StatBar label="Salute" value={child.health} color="#4caf50" />
                <StatBar label="Intelligenza" value={child.intelligence} color="#2196f3" />
              </div>

              <p className="child-school">
                📚 {schoolLabel[child.schoolLevel] ?? child.schoolLevel}
              </p>

              {/* Interazioni (espande al click) */}
              {selectedChild?.id === child.id && (
                <div className="parenting-actions">
                  <h4>Interagisci con {child.name}</h4>
                  <div className="action-grid compact">
                    {PARENTING_ACTIONS.map(def => (
                      <button
                        key={def.id}
                        className="action-btn small"
                        onClick={(e) => {
                          e.stopPropagation()
                          act(() => interactWithChild(child.id, def.id))
                        }}
                        title={def.label}
                      >
                        {def.emoji} {def.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="stat-bar-mini">
      <span className="stat-label-mini">{label}</span>
      <div className="bar-track-mini">
        <div className="bar-fill-mini" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="stat-value-mini">{Math.round(value)}</span>
    </div>
  )
}
