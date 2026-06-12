// NpcEditorModal — God Mode only.
// Lets the player directly edit the relationship metrics of any living NPC
// (trust, love, respect, attraction, jealousy) via the store's updateRelationship.

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'
import type { Relationship } from '../../store/types'

interface Props {
  onClose: () => void
}

const METRICS: { key: keyof Relationship; label: string; emoji: string }[] = [
  { key: 'trust',      label: 'Fiducia',     emoji: '🤝' },
  { key: 'love',       label: 'Amore',       emoji: '❤️' },
  { key: 'respect',    label: 'Rispetto',    emoji: '🫡' },
  { key: 'attraction', label: 'Attrazione',  emoji: '💘' },
  { key: 'jealousy',   label: 'Gelosia',     emoji: '😠' },
]

export function NpcEditorModal({ onClose }: Props) {
  const { relationships, updateRelationship } = useGameStore(useShallow(s => ({
    relationships: s.relationships,
    updateRelationship: s.updateRelationship,
  })))

  const living = relationships.filter(r => r.isAlive)
  const [selectedId, setSelectedId] = useState<string | null>(living[0]?.id ?? null)
  const selected = living.find(r => r.id === selectedId) ?? null

  function setMetric(key: keyof Relationship, value: number) {
    if (!selected) return
    updateRelationship(selected.id, { [key]: value } as Partial<Relationship>)
  }

  function maxAll() {
    if (!selected) return
    updateRelationship(selected.id, { trust: 100, love: 100, respect: 100, attraction: 100, jealousy: 0 })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto',
          background: 'linear-gradient(160deg, #2A2150 0%, #1B1733 100%)',
          borderRadius: '20px 20px 0 0', padding: '20px 18px 32px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.16)',
          border: '1px solid rgba(167,139,250,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 26 }}>🧬</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#c4b5fd' }}>Editor NPC</h2>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>God Mode — modifica le relazioni</p>
          </div>
          <button onClick={onClose} className="icon-btn icon-btn--danger" style={{ width: 34, height: 34 }} aria-label="Chiudi">✕</button>
        </div>

        {living.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px 0' }}>
            Nessun NPC vivo da modificare. Vivi un po' e costruisci delle relazioni!
          </p>
        ) : (
          <>
            {/* NPC picker */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
              {living.map(npc => (
                <button
                  key={npc.id}
                  onClick={() => setSelectedId(npc.id)}
                  style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 12px', borderRadius: 12, cursor: 'pointer', minWidth: 70,
                    border: '1px solid', borderColor: selectedId === npc.id ? '#a78bfa' : 'rgba(255,255,255,0.1)',
                    background: selectedId === npc.id ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
                  }}
                >
                  <span style={{ fontSize: 24 }}>{npc.emoji}</span>
                  <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {npc.name.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}>{npc.type}</span>
                </button>
              ))}
            </div>

            {/* Metric sliders */}
            {selected && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {METRICS.map(m => {
                    const val = (selected[m.key] as number) ?? 0
                    return (
                      <div key={String(m.key)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{m.emoji} {m.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', minWidth: 32, textAlign: 'right' }}>{val}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={val}
                          onChange={e => setMetric(m.key, Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#a78bfa' }}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Toxicity toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>☣️ Relazione tossica</span>
                  <button
                    onClick={() => updateRelationship(selected.id, { toxicityTag: !selected.toxicityTag })}
                    className={`toggle-switch ${selected.toxicityTag ? 'on' : ''}`}
                    aria-label="Toggle tossicità"
                  />
                </div>

                <button
                  onClick={maxAll}
                  className="btn-candy btn-candy--positive"
                  style={{ width: '100%', fontSize: 14, padding: '11px 0', marginTop: 18, fontWeight: 700 }}
                >
                  💖 Relazione perfetta
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
