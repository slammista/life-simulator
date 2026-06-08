import { useGameStore } from '../../store/gameStore'

export function EventDisplay() {
  const { currentEvent, availableChoices, handleChoice } = useGameStore()

  if (!currentEvent) {
    return (
      <div style={{ margin: '12px', textAlign: 'center', padding: '20px 16px' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎮</div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
          Premi <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>+1 ETÀ</strong> per avanzare di un anno e far succedere qualcosa.
        </p>
      </div>
    )
  }

  const rarityConfig = {
    common:    { label: 'COMUNE',     bg: 'rgba(255,255,255,0.06)',    color: '#9DA6BA' },
    uncommon:  { label: 'NON COMUNE', bg: 'rgba(24,211,158,0.12)',     color: '#18D39E' },
    rare:      { label: 'RARO',       bg: 'rgba(124,92,255,0.14)',     color: '#7C5CFF' },
    epic:      { label: 'EPICO',      bg: 'rgba(236,72,153,0.14)',     color: '#ec4899' },
    legendary: { label: 'LEGGENDARIO',bg: 'rgba(255,176,32,0.14)',     color: '#FFB020' },
  }
  const rarity = rarityConfig[currentEvent.rarity as keyof typeof rarityConfig] ?? rarityConfig.common

  return (
    <div className="card fade-in-up" style={{ margin: '12px' }}>
      {/* Event header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-soft)',
          fontSize: 28,
        }}>
          {currentEvent.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)', flex: 1 }}>
              {currentEvent.title}
            </p>
            {currentEvent.rarity !== 'common' && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                padding: '2px 7px', borderRadius: 'var(--radius-pill)',
                background: rarity.bg, color: rarity.color,
                border: `1px solid ${rarity.color}33`, flexShrink: 0,
              }}>
                {rarity.label}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
            {currentEvent.description}
          </p>
        </div>
      </div>

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {availableChoices.map((choice, i) => {
          const hasCost = choice.effects.money && choice.effects.money < 0
          return (
            <button
              key={choice.id}
              className="tap-scale"
              onClick={() => handleChoice(choice.id)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: i === 0 ? 'var(--primary-soft)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${i === 0 ? 'rgba(124,92,255,0.3)' : 'var(--border-soft)'}`,
                color: 'var(--color-text)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'background var(--transition-fast), border-color var(--transition-fast)',
              }}
            >
              <span style={{ flex: 1, lineHeight: 1.4 }}>{choice.text}</span>
              <EffectPreview effects={choice.effects} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function EffectPreview({ effects }: { effects: Record<string, number> }) {
  const entries = Object.entries(effects).filter(([k]) =>
    ['health', 'happiness', 'money', 'intelligence', 'karma'].includes(k)
  )
  if (!entries.length) return null

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 8, flexShrink: 0 }}>
      {entries.slice(0, 3).map(([key, val]) => (
        <span
          key={key}
          style={{
            fontSize: 11, fontWeight: 600,
            color: val > 0 ? 'var(--green)' : 'var(--red)',
            background: val > 0 ? 'var(--green-soft)' : 'var(--red-soft)',
            padding: '2px 6px', borderRadius: 'var(--radius-pill)',
          }}
        >
          {key === 'money' ? '€' : ''}{val > 0 ? '+' : ''}{val}
        </span>
      ))}
    </div>
  )
}
