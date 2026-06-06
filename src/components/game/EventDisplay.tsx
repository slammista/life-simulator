import { useGameStore } from '../../store/gameStore'

export function EventDisplay() {
  const { currentEvent, availableChoices, handleChoice } = useGameStore()

  if (!currentEvent) {
    return (
      <div className="card fade-in-up" style={{ margin: '12px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Premi <strong style={{ color: 'var(--color-cta)' }}>Invecchia</strong> per avanzare di un anno.
        </p>
      </div>
    )
  }

  const canAfford = (choiceId: string) => {
    const choice = availableChoices.find(c => c.id === choiceId)
    if (!choice) return false
    // Quick check for money requirement
    const moneyEffect = choice.effects.money
    if (moneyEffect && moneyEffect < 0) {
      // Will check in store, just show as available
    }
    return true
  }

  return (
    <div className="card fade-in-up" style={{ margin: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 28 }}>{currentEvent.emoji}</span>
        <div>
          <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>
            {currentEvent.title}
          </p>
          {currentEvent.rarity !== 'common' && (
            <span style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              backgroundColor: currentEvent.rarity === 'legendary' ? '#f59e0b22' : '#8b5cf622',
              color: currentEvent.rarity === 'legendary' ? '#f59e0b' : '#8b5cf6',
              border: `1px solid ${currentEvent.rarity === 'legendary' ? '#f59e0b' : '#8b5cf6'}44`,
            }}>
              {currentEvent.rarity.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
        {currentEvent.description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {availableChoices.map(choice => (
          <button
            key={choice.id}
            className="btn-choice"
            onClick={() => handleChoice(choice.id)}
            disabled={!canAfford(choice.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{choice.text}</span>
              <EffectPreview effects={choice.effects} />
            </div>
          </button>
        ))}
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
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {entries.slice(0, 3).map(([key, val]) => (
        <span
          key={key}
          style={{
            fontSize: 11,
            color: val > 0 ? 'var(--color-positive)' : 'var(--color-negative)',
            backgroundColor: val > 0 ? '#0f9b5822' : '#e9456022',
            padding: '1px 5px',
            borderRadius: 4,
          }}
        >
          {key === 'money' ? '€' : ''}{val > 0 ? '+' : ''}{val}
        </span>
      ))}
    </div>
  )
}
