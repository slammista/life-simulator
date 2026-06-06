import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { CausalityEngine, type CausalityCategory } from '../../services/CausalityEngine'

const CATEGORY_LABELS: Record<CausalityCategory | 'all', string> = {
  all: 'Tutto',
  life: 'Vita',
  finance: 'Finanze',
  relationship: 'Relazioni',
  health: 'Salute',
  career: 'Carriera',
  chaos: 'Caos',
  legacy: 'Legacy',
}

const CATEGORY_COLORS: Record<CausalityCategory, string> = {
  life: '#94a3b8',
  finance: '#10b981',
  relationship: '#f472b6',
  health: '#ef4444',
  career: '#60a5fa',
  chaos: '#f97316',
  legacy: '#a78bfa',
}

export default function CausalityTimelineScreen() {
  const state = useGameStore(s => s)
  const [filter, setFilter] = useState<CausalityCategory | 'all'>('all')
  const timeline = CausalityEngine.buildTimeline(state)
  const summary = CausalityEngine.summarize(state)
  const filtered = filter === 'all' ? timeline : timeline.filter(entry => entry.category === filter)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🧠 Timeline causale</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <StatBox label="Eventi" value={summary.total} color="#e2e8f0" />
        <StatBox label="Maggiori" value={summary.major} color="#fbbf24" />
        <StatBox label="Caos" value={summary.categories.chaos} color="#f97316" />
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12 }}>
        {(Object.keys(CATEGORY_LABELS) as Array<CausalityCategory | 'all'>).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '6px 11px',
              borderRadius: 20,
              border: 'none',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              background: filter === cat ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
              color: filter === cat ? '#fff' : 'var(--color-text-secondary)',
              fontSize: 12,
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 18, textAlign: 'center' }}>
          <p style={{ fontSize: 22, marginBottom: 6 }}>🧭</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Nessuna conseguenza registrata in questa categoria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(entry => {
            const color = CATEGORY_COLORS[entry.category]
            return (
              <div key={entry.id} className="card" style={{ padding: 12, borderLeft: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>
                      {entry.emoji} {entry.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      Età {entry.age} · {entry.year} · {CATEGORY_LABELS[entry.category]}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color, flexShrink: 0 }}>peso {Math.round(entry.weight)}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.4 }}>
                  {entry.description}
                </p>
                {entry.consequences.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {entry.consequences.slice(0, 4).map(item => (
                      <span key={item} style={{
                        padding: '3px 7px',
                        borderRadius: 12,
                        background: `${color}18`,
                        color,
                        fontSize: 10,
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ padding: 10, textAlign: 'center' }}>
      <p style={{ fontSize: 18, fontWeight: 800, color }}>{value}</p>
      <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{label}</p>
    </div>
  )
}
