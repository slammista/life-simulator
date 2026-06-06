import { useGameStore } from '../../store/gameStore'

export function EventLog() {
  const { eventLog } = useGameStore()

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
        Accaduto di recente
      </p>
      {eventLog.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: 16 }}>
          Nessun evento ancora.
        </p>
      )}
      {eventLog.map(entry => (
        <div key={entry.id} className="event-log-entry">
          <span style={{ flexShrink: 0 }}>{entry.emoji}</span>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>
              Età {entry.age} ({entry.year}):
            </span>{' '}
            <span>{entry.text}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
