import { useGameStore } from '../../store/gameStore'

export function RelationshipScreen() {
  const { relationships } = useGameStore()

  const stageEmoji: Record<string, string> = {
    stranger: '👤',
    acquaintance: '👋',
    friend: '😊',
    close_friend: '🤝',
    partner: '💑',
    spouse: '💍',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12, color: 'var(--color-text)' }}>❤️ Relazioni</h2>

      {relationships.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Nessuna relazione ancora.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Invecchia per incontrare nuove persone.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {relationships.map(rel => (
          <div key={rel.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>{rel.emoji}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{rel.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {rel.type} · {rel.age}y
                  </p>
                </div>
              </div>
              <span style={{ fontSize: 18 }}>{stageEmoji[rel.stage] ?? '👤'}</span>
            </div>

            {/* Relationship bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: 'Fiducia', val: rel.trust, color: '#10b981' },
                { label: 'Attrazione', val: rel.attraction, color: '#f59e0b' },
                { label: 'Gelosia', val: rel.jealousy, color: '#e94560' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 65, flexShrink: 0 }}>{label}</span>
                  <div className="stat-bar" style={{ flex: 1 }}>
                    <div className="stat-bar-fill" style={{ width: `${val}%`, backgroundColor: color }} />
                  </div>
                  <span style={{ fontSize: 11, width: 24, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{val}</span>
                </div>
              ))}
            </div>

            {rel.toxicityTag && (
              <p style={{ fontSize: 11, color: 'var(--color-negative)', marginTop: 6 }}>
                ⚠️ Relazione tossica
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
