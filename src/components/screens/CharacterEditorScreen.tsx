// CharacterEditorScreen — God Mode only.
// Lets the player override starting attributes before birth. Produces an
// Effect (stat deltas) merged into newGame's startingBonus.

import { useState } from 'react'
import type { Effect } from '../../store/types'

interface Props {
  initial: Effect | null
  onApply: (bonus: Effect | null) => void
  onClose: () => void
}

// Base values used by newGame when computing starting stats (gameStore.ts).
const STAT_DEFS: { key: string; label: string; emoji: string; base: number; min: number; max: number }[] = [
  { key: 'health',       label: 'Salute',          emoji: '❤️',  base: 100, min: 0,    max: 100 },
  { key: 'happiness',    label: 'Felicità',        emoji: '😊',  base: 80,  min: 0,    max: 100 },
  { key: 'intelligence', label: 'Intelligenza',    emoji: '🧠',  base: 50,  min: 0,    max: 100 },
  { key: 'looks',        label: 'Aspetto',         emoji: '✨',  base: 50,  min: 0,    max: 100 },
  { key: 'energy',       label: 'Energia',         emoji: '⚡',  base: 80,  min: 0,    max: 100 },
  { key: 'mentalHealth', label: 'Salute Mentale',  emoji: '🧘',  base: 80,  min: 0,    max: 100 },
  { key: 'karma',        label: 'Karma',           emoji: '☯️',  base: 0,   min: -100, max: 100 },
]

const MONEY_MAX = 1_000_000

function bonusToAbsolute(bonus: Effect | null): Record<string, number> {
  const out: Record<string, number> = {}
  for (const def of STAT_DEFS) {
    out[def.key] = def.base + (bonus?.[def.key] ?? 0)
  }
  out.money = bonus?.money ?? 0
  return out
}

export function CharacterEditorScreen({ initial, onApply, onClose }: Props) {
  const [absolute, setAbsolute] = useState<Record<string, number>>(() => bonusToAbsolute(initial))

  function setStat(key: string, value: number) {
    setAbsolute(prev => ({ ...prev, [key]: value }))
  }

  function handleApply() {
    // Convert absolute targets back into deltas relative to the base values.
    const bonus: Effect = {}
    for (const def of STAT_DEFS) {
      const delta = absolute[def.key] - def.base
      if (delta !== 0) bonus[def.key] = delta
    }
    if (absolute.money > 0) bonus.money = absolute.money
    onApply(Object.keys(bonus).length > 0 ? bonus : null)
    onClose()
  }

  function handleMaxAll() {
    const maxed: Record<string, number> = {}
    for (const def of STAT_DEFS) maxed[def.key] = def.max
    maxed.money = MONEY_MAX
    setAbsolute(maxed)
  }

  function handleReset() {
    setAbsolute(bonusToAbsolute(null))
  }

  return (
    <div style={{
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 26 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#c4b5fd' }}>Editor Personaggio</h2>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>God Mode — attributi iniziali liberi</p>
          </div>
          <button onClick={onClose} className="icon-btn icon-btn--danger" style={{ width: 34, height: 34 }} aria-label="Chiudi">✕</button>
        </div>

        {/* Stat sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {STAT_DEFS.map(def => (
            <div key={def.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>
                  {def.emoji} {def.label}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: '#a78bfa',
                  minWidth: 38, textAlign: 'right',
                }}>{absolute[def.key]}</span>
              </div>
              <input
                type="range"
                min={def.min}
                max={def.max}
                value={absolute[def.key]}
                onChange={e => setStat(def.key, Number(e.target.value))}
                style={{ width: '100%', accentColor: '#a78bfa' }}
              />
            </div>
          ))}

          {/* Money */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>💰 Patrimonio iniziale</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#86efac' }}>
                €{absolute.money.toLocaleString('it-IT')}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={MONEY_MAX}
              step={10_000}
              value={absolute.money}
              onChange={e => setStat('money', Number(e.target.value))}
              style={{ width: '100%', accentColor: '#86efac' }}
            />
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={handleMaxAll} className="btn-candy btn-candy--neutral" style={{ flex: 1, fontSize: 13, padding: '9px 0' }}>
            🔝 Tutto al massimo
          </button>
          <button onClick={handleReset} className="btn-candy btn-candy--neutral" style={{ flex: 1, fontSize: 13, padding: '9px 0' }}>
            ↺ Reset
          </button>
        </div>

        <button
          onClick={handleApply}
          className="btn-candy btn-candy--primary"
          style={{ width: '100%', fontSize: 15, padding: '12px 0', marginTop: 10, fontWeight: 700 }}
        >
          ✓ Applica attributi
        </button>
      </div>
    </div>
  )
}
