import { useGameStore } from '../../store/gameStore'
import { EmotionalUIEngine } from '../../services/EmotionalUIEngine'

const statConfig = [
  { key: 'health', label: 'Salute', emoji: '❤️', color: '#e94560' },
  { key: 'mentalHealth', label: 'Mente', emoji: '🧠', color: '#8b5cf6' },
  { key: 'happiness', label: 'Felicità', emoji: '😊', color: '#f59e0b' },
  { key: 'energy', label: 'Energia', emoji: '⚡', color: '#10b981' },
]

export function HUD() {
  const store = useGameStore()
  const { stats, finance, time, identity } = store
  const emotion = EmotionalUIEngine.derive(store)

  return (
    <div className="hud flex-col gap-1" style={{ height: 'auto', padding: '8px 12px' }}>
      {/* Top row: identity + money + age */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{identity.emoji}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {identity.name} · {time.age}y · {time.year}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
          €{finance.money.toLocaleString('it-IT')}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        <span className="emotion-badge">
          {emotion.label} · {emotion.intensity}/100
        </span>
      </div>

      {/* Stat bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {statConfig.map(({ key, emoji, label, color }) => {
          const val = (stats as unknown as Record<string, number>)[key]
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-secondary)' }}>
                <span>{emoji} {label}</span>
                <span style={{ color: val < 30 ? 'var(--color-negative)' : val > 70 ? 'var(--color-positive)' : 'var(--color-text)' }}>{Math.round(val)}</span>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${val}%`,
                    backgroundColor: val < 30 ? '#e94560' : color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
