import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import { EmotionalUIEngine } from '../../services/EmotionalUIEngine'

const statConfig = [
  { key: 'health', label: 'Salute', emoji: '❤️', color: '#e94560' },
  { key: 'mentalHealth', label: 'Mente', emoji: '🧠', color: '#8b5cf6' },
  { key: 'happiness', label: 'Felicità', emoji: '😊', color: '#f59e0b' },
  { key: 'energy', label: 'Energia', emoji: '⚡', color: '#10b981' },
]

// Granular selectors — re-renders only when these slices actually change
function useHUDData() {
  const stats = useGameStore(useShallow(s => s.stats))
  const money = useGameStore(s => s.finance.money)
  const age = useGameStore(s => s.time.age)
  const year = useGameStore(s => s.time.year)
  const emoji = useGameStore(s => s.identity.emoji)
  const name = useGameStore(s => s.identity.name)
  // useShallow compares returned object fields — avoids re-render if emotion unchanged
  const emotion = useGameStore(useShallow(s => EmotionalUIEngine.derive(s)))
  return { stats, money, age, year, emoji, name, emotion }
}

export const HUD = memo(function HUD() {
  const { stats, money, age, year, emoji, name, emotion } = useHUDData()

  return (
    <div className="hud flex-col gap-1" style={{ height: 'auto', padding: '8px 12px' }}>
      {/* Top row: identity + money + age */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {name} · {age}y · {year}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
          €{money.toLocaleString('it-IT')}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        <span className="emotion-badge">
          {emotion.label} · {emotion.intensity}/100
        </span>
      </div>

      {/* Stat bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {statConfig.map(({ key, emoji: statEmoji, label, color }) => {
          const val = (stats as unknown as Record<string, number>)[key]
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-secondary)' }}>
                <span>{statEmoji} {label}</span>
                <span style={{
                  color: val < 30 ? 'var(--color-negative)' : val > 70 ? 'var(--color-positive)' : 'var(--color-text)',
                }}>{Math.round(val)}</span>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${val}%`, backgroundColor: val < 30 ? '#e94560' : color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
