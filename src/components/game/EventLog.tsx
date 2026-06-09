import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  career:    { emoji: '💼', color: '#f59e0b', label: 'Carriera' },
  social:    { emoji: '👥', color: '#f472b6', label: 'Sociale' },
  health:    { emoji: '❤️', color: '#ef4444', label: 'Salute' },
  finance:   { emoji: '💰', color: '#10b981', label: 'Finanze' },
  criminal:  { emoji: '🚔', color: '#f97316', label: 'Crimini' },
  life:      { emoji: '✨', color: '#a78bfa', label: 'Vita' },
  education: { emoji: '📚', color: '#60a5fa', label: 'Istruzione' },
  choice:    { emoji: '🎯', color: '#22c55e', label: 'Scelta' },
  year:      { emoji: '📅', color: '#94a3b8', label: 'Anno' },
}

function formatStatChanges(changes: Record<string, number>): { key: string; val: number }[] {
  return Object.entries(changes)
    .filter(([k]) => ['health', 'happiness', 'money', 'intelligence', 'karma'].includes(k) && changes[k] !== 0)
    .map(([key, val]) => ({ key, val }))
    .slice(0, 3)
}

const STAT_EMOJI: Record<string, string> = {
  health: '❤️', happiness: '😊', money: '€', intelligence: '🧠', karma: '☯️'
}

export function EventLog() {
  const { eventLog } = useGameStore()
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
      <div className="event-log-panel-inner">
        <p style={{
          fontSize: 10, color: 'var(--text-faint)', marginBottom: 10,
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2,
        }}>
          Cronaca di vita
        </p>

        {eventLog.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📜</div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              La tua storia non è ancora scritta.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
              Premi +1 ETÀ per vivere il primo anno.
            </p>
          </div>
        )}

        {eventLog.map(entry => {
          const cfg = CATEGORY_CONFIG[entry.category ?? 'year'] ?? CATEGORY_CONFIG.year
          const statChanges = formatStatChanges(entry.statChanges ?? {})
          const isExpanded = expanded === entry.id
          return (
            <div
              key={entry.id}
              onClick={() => setExpanded(isExpanded ? null : entry.id)}
              style={{
                display: 'flex', gap: 8, padding: '6px 0', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Category color stripe */}
              <div style={{
                width: 2, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch',
                background: cfg.color + '60',
              }} />

              {/* Emoji */}
              <span style={{ fontSize: 14, flexShrink: 0, alignSelf: 'flex-start', marginTop: 1 }}>
                {entry.emoji}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Main text */}
                <p style={{
                  color: 'var(--color-text)', fontSize: 12, lineHeight: 1.45,
                  overflow: isExpanded ? 'visible' : 'hidden',
                  display: isExpanded ? 'block' : '-webkit-box',
                  WebkitLineClamp: isExpanded ? undefined : 2,
                  WebkitBoxOrient: isExpanded ? undefined : 'vertical',
                }}>
                  {entry.text}
                </p>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>
                    {entry.age}a · {entry.year}
                  </span>
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 99,
                    background: `${cfg.color}18`, color: cfg.color,
                  }}>
                    {cfg.label}
                  </span>
                  {/* Stat delta chips */}
                  {statChanges.map(({ key, val }) => (
                    <span key={key} style={{
                      fontSize: 9, fontWeight: 600,
                      color: val > 0 ? '#4ade80' : '#f87171',
                    }}>
                      {STAT_EMOJI[key]}{val > 0 ? '+' : ''}{key === 'money' ? `€${val}` : val}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
