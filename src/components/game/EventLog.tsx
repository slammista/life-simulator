import { useGameStore } from '../../store/gameStore'

const CATEGORY_CLASS: Record<string, string> = {
  career:   'career',
  social:   'social',
  health:   'negative',
  finance:  'career',
  criminal: 'negative',
  life:     'positive',
}

function getEntryClass(entry: { emoji: string; category?: string; statChanges?: Record<string, number> }): string {
  if (entry.category && CATEGORY_CLASS[entry.category]) return CATEGORY_CLASS[entry.category]
  // Infer from statChanges
  const changes = entry.statChanges ?? {}
  const sum = Object.values(changes).reduce((a, b) => a + b, 0)
  if (sum > 0) return 'positive'
  if (sum < 0) return 'negative'
  return ''
}

export function EventLog() {
  const { eventLog } = useGameStore()

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
          const cls = getEntryClass(entry)
          return (
            <div key={entry.id} className={`event-log-entry${cls ? ` ${cls}` : ''}`}>
              <span style={{ flexShrink: 0, fontSize: 15 }}>{entry.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: 'var(--color-text)', fontSize: 12 }}>{entry.text}</span>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>
                  Età {entry.age} · {entry.year}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
