import { useGameStore } from '../../store/gameStore'

export function GoalsScreen() {
  const { goals } = useGameStore()

  const completed = goals.filter(g => g.completed)
  const active = goals.filter(g => !g.completed)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      <h2 style={{ fontSize: 16, marginBottom: 4, color: 'var(--color-text)' }}>🎯 Goals</h2>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Completati: {completed.length}/{goals.length}
      </p>

      {/* Progress bar */}
      <div className="stat-bar" style={{ height: 8, marginBottom: 16 }}>
        <div
          className="stat-bar-fill"
          style={{
            width: `${goals.length > 0 ? (completed.length / goals.length) * 100 : 0}%`,
            backgroundColor: '#10b981',
          }}
        />
      </div>

      {/* Active goals */}
      {active.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>
            Da completare
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {active.map(goal => (
              <div key={goal.id} className="card" style={{ padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{goal.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{goal.description}</p>
                  </div>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    backgroundColor: '#0f9b5822',
                    color: '#0f9b58',
                    border: '1px solid #0f9b5844',
                    flexShrink: 0,
                  }}>
                    {goal.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Completed goals */}
      {completed.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>
            Completati ✅
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completed.map(goal => (
              <div key={goal.id} className="card" style={{ padding: 10, opacity: 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>✅ {goal.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{goal.description}</p>
                  </div>
                  {goal.completedYear && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                      {goal.completedYear}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
