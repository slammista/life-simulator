import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { CausalityEngine, type CausalityCategory } from '../../services/CausalityEngine'
import type { LifeMemory, LifeMemoryCategory } from '../../store/types'

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

const MEMORY_CATEGORY_COLORS: Record<LifeMemoryCategory, string> = {
  life:         '#94a3b8',
  school:       '#60a5fa',
  work:         '#fbbf24',
  relationship: '#f472b6',
  health:       '#ef4444',
  crime:        '#f97316',
  finance:      '#10b981',
  achievement:  '#a78bfa',
}

const MEMORY_CATEGORY_LABELS: Record<LifeMemoryCategory, string> = {
  life:         'Vita',
  school:       'Scuola',
  work:         'Lavoro',
  relationship: 'Amore',
  health:       'Salute',
  crime:        'Crimini',
  finance:      'Finanze',
  achievement:  'Successi',
}

export default function CausalityTimelineScreen() {
  const state = useGameStore(s => s)
  const [view, setView] = useState<'timeline' | 'ricordi'>('timeline')
  const [filter, setFilter] = useState<CausalityCategory | 'all'>('all')
  const [memFilter, setMemFilter] = useState<LifeMemoryCategory | 'all'>('all')

  const timeline = CausalityEngine.buildTimeline(state)
  const summary = CausalityEngine.summarize(state)
  const filtered = filter === 'all' ? timeline : timeline.filter(entry => entry.category === filter)

  const memories: LifeMemory[] = [...(state.lifeMemories ?? [])].sort((a, b) => a.age - b.age)
  const filteredMemories = memFilter === 'all' ? memories : memories.filter(m => m.category === memFilter)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🧠 Cronaca di vita</h2>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {([
          { id: 'timeline', label: '⚡ Timeline', desc: 'Conseguenze e caos' },
          { id: 'ricordi',  label: '📖 Ricordi',  desc: 'Momenti importanti' },
        ] as const).map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: view === v.id ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
              color: view === v.id ? '#fff' : 'var(--color-text-secondary)',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'timeline' && (
        <>
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
        </>
      )}

      {view === 'ricordi' && (
        <>
          {/* Memory category filter */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12 }}>
            <button
              onClick={() => setMemFilter('all')}
              style={{
                padding: '6px 11px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', cursor: 'pointer',
                background: memFilter === 'all' ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
                color: memFilter === 'all' ? '#fff' : 'var(--color-text-secondary)', fontSize: 12,
              }}
            >
              Tutti
            </button>
            {(Object.keys(MEMORY_CATEGORY_LABELS) as LifeMemoryCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setMemFilter(cat)}
                style={{
                  padding: '6px 11px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap', cursor: 'pointer',
                  background: memFilter === cat ? `${MEMORY_CATEGORY_COLORS[cat]}33` : 'rgba(255,255,255,0.07)',
                  color: memFilter === cat ? MEMORY_CATEGORY_COLORS[cat] : 'var(--color-text-secondary)',
                  outline: memFilter === cat ? `1px solid ${MEMORY_CATEGORY_COLORS[cat]}55` : 'none',
                  fontSize: 12,
                }}
              >
                {MEMORY_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {filteredMemories.length === 0 ? (
            <div className="card" style={{ padding: '28px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>📖</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                {memories.length === 0 ? 'Nessun ricordo ancora' : 'Nessun ricordo in questa categoria'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {memories.length === 0
                  ? 'I momenti importanti della tua vita — matrimoni, lavori, nascite — verranno salvati qui.'
                  : 'Prova a selezionare un\'altra categoria.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredMemories.map(mem => {
                const color = MEMORY_CATEGORY_COLORS[mem.category]
                return (
                  <div key={mem.id} className="card" style={{ padding: 12, borderLeft: `3px solid ${color}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${color}18`, border: `1px solid ${color}33`,
                        fontSize: 20,
                      }}>
                        {mem.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', marginBottom: 2 }}>
                          {mem.title}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                          Età {mem.age} · {mem.year} · {MEMORY_CATEGORY_LABELS[mem.category]}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                          {mem.description}
                        </p>
                        {mem.peopleInvolved.length > 0 && (
                          <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                            {mem.peopleInvolved.map(person => (
                              <span key={person} style={{
                                fontSize: 10, padding: '2px 7px', borderRadius: 99,
                                background: `${color}18`, color,
                              }}>
                                👤 {person}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {mem.isImportant && (
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>⭐</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
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
