import { useState, useCallback } from 'react'

const STORAGE_KEY = 'lifesim_pinned_activities'
const DEFAULT_PINS = ['health', 'hobby', 'travel']
const MAX_PINS = 5

const ALL_ACTIVITIES: { id: string; emoji: string; label: string }[] = [
  { id: 'health',     emoji: '💊', label: 'Salute' },
  { id: 'hobby',      emoji: '🎸', label: 'Hobby' },
  { id: 'substances', emoji: '🍺', label: 'Sostanze' },
  { id: 'criminal',   emoji: '🚔', label: 'Crimini' },
  { id: 'religion',   emoji: '🙏', label: 'Fede' },
  { id: 'body',       emoji: '🎨', label: 'Body Mod' },
  { id: 'beauty',     emoji: '💄', label: 'Beauty' },
  { id: 'gambling',   emoji: '🎲', label: 'Azzardo' },
  { id: 'sex_health', emoji: '❤️‍🔥', label: 'Sess.' },
  { id: 'cosmetic',   emoji: '💉', label: 'Estetica' },
  { id: 'travel',     emoji: '✈️', label: 'Viaggi' },
  { id: 'politics',   emoji: '🏛️', label: 'Politica' },
  { id: 'goals',      emoji: '🎯', label: 'Goals' },
  { id: 'challenges', emoji: '🏆', label: 'Sfide' },
  { id: 'ribbons',    emoji: '🏅', label: 'Medaglie' },
  { id: 'timeline',   emoji: '🧠', label: 'Timeline' },
  { id: 'minigames',  emoji: '🧩', label: 'Giochi' },
  { id: 'leaderboard',emoji: '🥇', label: 'Classifica' },
  { id: 'settings',   emoji: '⚙️', label: 'Impost.' },
]

function loadPins(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return DEFAULT_PINS
}

function savePins(pins: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pins))
}

interface Props {
  activeSub: string
  onChange: (sub: string) => void
}

export function PinnedActivities({ activeSub, onChange }: Props) {
  const [pins, setPins] = useState<string[]>(loadPins)
  const [editing, setEditing] = useState(false)

  const togglePin = useCallback((id: string) => {
    setPins(prev => {
      let next: string[]
      if (prev.includes(id)) {
        next = prev.filter(p => p !== id)
      } else if (prev.length < MAX_PINS) {
        next = [...prev, id]
      } else {
        return prev
      }
      savePins(next)
      return next
    })
  }, [])

  const pinnedItems = ALL_ACTIVITIES.filter(a => pins.includes(a.id))

  if (pinnedItems.length === 0 && !editing) return null

  return (
    <div style={{ padding: '8px 12px 0', flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          ⭐ Preferiti
        </span>
        <button
          onClick={() => setEditing(e => !e)}
          style={{
            fontSize: 10, color: editing ? '#8b5cf6' : 'var(--color-text-secondary)',
            border: 'none', cursor: 'pointer', padding: '2px 6px',
            borderRadius: 6, background: editing ? 'rgba(139,92,246,0.12)' : 'transparent',
          }}
        >
          {editing ? '✓ Fatto' : '✏️ Modifica'}
        </button>
      </div>

      {/* Pinned quick-access chips */}
      {!editing && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {pinnedItems.map(item => (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: activeSub === item.id
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(139,92,246,0.12)',
                color: activeSub === item.id ? '#fff' : '#a78bfa',
                boxShadow: activeSub === item.id ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Edit mode: show all activities with toggle */}
      {editing && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 10 }}>
          {ALL_ACTIVITIES.map(item => {
            const isPinned = pins.includes(item.id)
            const atMax = pins.length >= MAX_PINS && !isPinned
            return (
              <button
                key={item.id}
                onClick={() => togglePin(item.id)}
                disabled={atMax}
                style={{
                  padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                  whiteSpace: 'nowrap', cursor: atMax ? 'default' : 'pointer', border: 'none',
                  background: isPinned
                    ? 'rgba(139,92,246,0.25)'
                    : 'rgba(255,255,255,0.05)',
                  color: isPinned ? '#a78bfa'
                    : atMax ? 'rgba(255,255,255,0.2)'
                    : 'var(--color-text-secondary)',
                  opacity: atMax ? 0.5 : 1,
                }}
              >
                {isPinned ? '⭐' : '☆'} {item.emoji} {item.label}
              </button>
            )
          })}
          <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', width: '100%', marginTop: 2 }}>
            {pins.length}/{MAX_PINS} preferiti selezionati
          </p>
        </div>
      )}
    </div>
  )
}
