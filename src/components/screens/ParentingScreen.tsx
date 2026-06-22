import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { PARENTING_ACTIONS } from '../../services/ParentingEngine'
import { haptic } from '../../services/HapticEngine'

const INTL_OPTIONS = [
  { country: 'cina',     flag: '🇨🇳', label: 'Cina',     cost: 20000, desc: 'Processo ~18 mesi, bambino 0-3 anni' },
  { country: 'etiopia',  flag: '🇪🇹', label: 'Etiopia',  cost: 15000, desc: 'Processo ~12 mesi, bambino 0-4 anni' },
  { country: 'colombia', flag: '🇨🇴', label: 'Colombia', cost: 16000, desc: 'Processo ~15 mesi, bambino 0-3 anni' },
  { country: 'india',    flag: '🇮🇳', label: 'India',    cost: 18000, desc: 'Processo ~24 mesi, bambino 0-3 anni' },
]
import type { Child } from '../../store/types'

export default function ParentingScreen() {
  const { children, time, haveChild, adoptChild, adoptInternational, interactWithChild } = useGameStore()
  const { showPanel, closePanel } = useToastStore()
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)

  const act = (fn: () => { success: boolean; message: string; effects?: Record<string, number> }, emoji = '👶') => {
    const r = fn()
    haptic(r.success ? 'success' : 'error')
    showPanel({ title: r.message, emoji, ok: r.success, effects: r.effects ?? {} })
    setTimeout(() => closePanel(), 3500)
  }

  const schoolLabel: Record<string, string> = {
    none: 'Neonato', kindergarten: 'Asilo', elementary: 'Elementari',
    middle: 'Medie', highschool: 'Liceo', bachelor: 'Università',
    master: 'Magistrale', phd: 'Dottorato',
  }

  const actionEmojis: Record<string, string> = {
    play: '🎮', help_homework: '📚', talk: '💬', discipline: '⚠️',
    praise: '🌟', teach: '🏫', read_together: '📖', outdoor_activity: '🏃',
  }

  return (
    <div className="screen-content">
      <h2 className="section-title">👨‍👩‍👧‍👦 Famiglia</h2>

      {/* Azioni principali */}
      <div className="card">
        <h3 className="card-title">Avere figli</h3>
        <p className="card-subtitle">
          Figli: {children.length}/8 · Età: {time.age}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            className="action-btn"
            onClick={() => act(haveChild, '👶')}
            disabled={time.age < 18 || time.age > 50 || children.length >= 8}
          >
            👶 Figlio biologico
          </button>
          <button
            className="action-btn"
            onClick={() => act(adoptChild, '🏠')}
            disabled={time.age < 18 || children.length >= 8}
          >
            🏠 Adotta (€10.000)
          </button>
        </div>
      </div>

      {/* Adozione avanzata */}
      {time.age >= 21 && children.length < 8 && (
        <div className="card">
          <h3 className="card-title">👨‍👩‍👧 Adotta un bambino</h3>
          <p className="card-subtitle">
            Scegli età e sesso del bambino da adottare. Il costo varia in base all'età.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
            {[
              { label: 'Neonato/a', age: 0, emoji: '👶', cost: 8000 },
              { label: 'Bambino/a (5)', age: 5, emoji: '🧒', cost: 10500 },
              { label: 'Adolescente (12)', age: 12, emoji: '🧑', cost: 14000 },
            ].map(({ label, age: childAge, emoji, cost }) => (
              <div key={childAge} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: 4 }}>
                  {emoji} {label}<br />
                  <span style={{ color: '#f59e0b' }}>€{cost.toLocaleString('it-IT')}</span>
                </p>
                <button
                  className="action-btn small"
                  onClick={() => act(() => adoptChild('male', childAge), emoji)}
                  disabled={children.length >= 8}
                >
                  ♂ Maschio
                </button>
                <button
                  className="action-btn small"
                  onClick={() => act(() => adoptChild('female', childAge), emoji)}
                  disabled={children.length >= 8}
                >
                  ♀ Femmina
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adozione internazionale */}
      {time.age >= 25 && children.length < 8 && (
        <div className="card">
          <h3 className="card-title">🌍 Adozione Internazionale</h3>
          <p className="card-subtitle">
            Percorso più lungo e costoso, ma porta un bambino da lontano nella tua famiglia.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {INTL_OPTIONS.map(opt => (
              <div key={opt.country} style={{ borderRadius: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{opt.flag} {opt.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{opt.desc}</p>
                  </div>
                  <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, flexShrink: 0 }}>€{opt.cost.toLocaleString('it-IT')}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="action-btn small"
                    onClick={() => act(() => adoptInternational(opt.country, 'male'), opt.flag)}
                    disabled={children.length >= 8}>
                    ♂ Maschio
                  </button>
                  <button className="action-btn small"
                    onClick={() => act(() => adoptInternational(opt.country, 'female'), opt.flag)}
                    disabled={children.length >= 8}>
                    ♀ Femmina
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                {child.careerPath && ` · 🎯 ${child.careerPath}`}
              </p>

              {/* Interazioni (espande al click) */}
              {selectedChild?.id === child.id && (
                <div className="parenting-actions">
                  <h4>Interagisci con {child.name}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {PARENTING_ACTIONS.map(def => (
                      <button
                        key={def.id}
                        className="action-btn small"
                        onClick={(e) => {
                          e.stopPropagation()
                          act(() => interactWithChild(child.id, def.id), actionEmojis[def.id] ?? def.emoji)
                        }}
                        title={def.label}
                      >
                        {def.emoji} {def.label}
                      </button>
                    ))}
                  </div>

                  {/* Child personality snapshot */}
                  {child.personalityTraits && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries(child.personalityTraits).map(([trait, val]) => {
                        const labels: Record<string, string> = {
                          openness: '🎨 Apertura', conscientiousness: '📋 Coscienza',
                          extraversion: '🗣️ Estr.', agreeableness: '🤝 Amabil.',
                          neuroticism: '😟 Neuroticismo',
                        }
                        const pct = Math.round(val as number)
                        const color = pct > 66 ? '#10b981' : pct > 33 ? '#f59e0b' : '#ef4444'
                        return (
                          <span key={trait} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: `${color}22`, color, fontWeight: 600 }}>
                            {labels[trait] ?? trait} {pct}
                          </span>
                        )
                      })}
                    </div>
                  )}
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
