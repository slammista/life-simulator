import { useState } from 'react'

const STORAGE_KEY = 'lifesim_pinned_activities'
const DEFAULT_PINS = ['health', 'hobby', 'travel', 'criminal', 'beauty']

function loadPins(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p }
  } catch { /* ignore */ }
  return DEFAULT_PINS
}

function savePins(pins: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pins))
}

export type ActivitiesSubTab =
  | 'health' | 'hobby' | 'sport' | 'criminal' | 'substances' | 'religion'
  | 'body' | 'beauty' | 'barber' | 'gambling' | 'sex_health' | 'cosmetic'
  | 'travel' | 'politics' | 'goals' | 'challenges' | 'ribbons'
  | 'timeline' | 'minigames' | 'leaderboard' | 'settings' | 'privacy'
  | 'socialize'

interface ActivityDef {
  id: ActivitiesSubTab
  emoji: string
  label: string
  subtitle: string
  color: string
}

const ALL_ITEMS: ActivityDef[] = [
  { id: 'health',      emoji: '💊', label: 'Salute',             subtitle: 'Cura salute e benessere',        color: '#10b981' },
  { id: 'hobby',       emoji: '🎸', label: 'Hobby',              subtitle: 'Coltiva le tue passioni',        color: '#f59e0b' },
  { id: 'sport',       emoji: '🏅', label: 'Sport',              subtitle: 'Discipline e attività sportive', color: '#22c55e' },
  { id: 'beauty',      emoji: '💄', label: 'Beauty',             subtitle: 'Look e bellezza',                color: '#ec4899' },
  { id: 'barber',      emoji: '💈', label: 'Barbiere',           subtitle: 'Taglio e grooming',              color: '#8b5cf6' },
  { id: 'cosmetic',    emoji: '💉', label: 'Chirurgia Estetica', subtitle: 'Operazioni e modifiche fisiche', color: '#6366f1' },
  { id: 'body',        emoji: '🎨', label: 'Body Mod',           subtitle: 'Tatuaggi e piercing',            color: '#7c3aed' },
  { id: 'sex_health',  emoji: '❤️‍🔥', label: 'Salute Sessuale',  subtitle: 'Contraccezione e protezione',    color: '#f43f5e' },
  { id: 'criminal',    emoji: '🚔', label: 'Crimini',            subtitle: 'Attività illecite',              color: '#ef4444' },
  { id: 'substances',  emoji: '🍺', label: 'Sostanze',           subtitle: 'Alcol, fumo e droghe',          color: '#f97316' },
  { id: 'gambling',    emoji: '🎲', label: 'Azzardo',            subtitle: 'Scommesse e casinò',             color: '#dc2626' },
  { id: 'socialize',   emoji: '🎉', label: 'Socializza',         subtitle: 'Incontra nuove persone',         color: '#6366f1' },
  { id: 'religion',    emoji: '🙏', label: 'Fede',               subtitle: 'Pratiche religiose e spirituali', color: '#a78bfa' },
  { id: 'politics',    emoji: '🏛️', label: 'Politica',           subtitle: 'Impegno civile e voto',          color: '#60a5fa' },
  { id: 'travel',      emoji: '✈️', label: 'Viaggi',             subtitle: 'Esplora il mondo',               color: '#06b6d4' },
  { id: 'goals',       emoji: '🎯', label: 'Obiettivi',          subtitle: 'I tuoi traguardi di vita',       color: '#10b981' },
  { id: 'challenges',  emoji: '🏆', label: 'Sfide',              subtitle: 'Missioni e challenge attive',    color: '#f59e0b' },
  { id: 'ribbons',     emoji: '🏅', label: 'Medaglie',           subtitle: 'Riconoscimenti e trofei',        color: '#fbbf24' },
  { id: 'minigames',   emoji: '🧩', label: 'Minigiochi',         subtitle: 'Giochi e passatempi',            color: '#8b5cf6' },
  { id: 'timeline',    emoji: '🧠', label: 'Timeline',           subtitle: 'La storia della tua vita',       color: '#a78bfa' },
  { id: 'leaderboard', emoji: '🥇', label: 'Classifica',         subtitle: 'I migliori giocatori globali',   color: '#fbbf24' },
  { id: 'settings',    emoji: '⚙️', label: 'Impostazioni',       subtitle: 'Cloud save, God Mode, cheat',   color: '#94a3b8' },
  { id: 'privacy',     emoji: '🔒', label: 'Privacy',            subtitle: 'Dati e impostazioni privacy',    color: '#6b7280' },
]

const ITEM_MAP = Object.fromEntries(ALL_ITEMS.map(i => [i.id, i])) as Record<ActivitiesSubTab, ActivityDef>
export { ITEM_MAP as ACTIVITIES_ITEM_MAP }

const CATEGORIES: { label: string; ids: ActivitiesSubTab[] }[] = [
  { label: 'Corpo & Salute',  ids: ['health', 'hobby', 'sport', 'beauty', 'barber', 'cosmetic', 'body', 'sex_health'] },
  { label: 'Rischio',         ids: ['criminal', 'substances', 'gambling'] },
  { label: 'Socialità',       ids: ['socialize', 'religion', 'politics', 'travel'] },
  { label: 'Svago & Goals',   ids: ['goals', 'challenges', 'ribbons', 'minigames'] },
  { label: 'Profilo',         ids: ['timeline', 'leaderboard', 'settings', 'privacy'] },
]

interface RowProps {
  item: ActivityDef
  pinned: boolean
  editMode: boolean
  onClick: () => void
  onTogglePin: (id: ActivitiesSubTab) => void
}

function ActivityRow({ item, pinned, editMode, onClick, onTogglePin }: RowProps) {
  return (
    <button
      onClick={editMode ? () => onTogglePin(item.id) : onClick}
      className="tap-scale"
      style={{
        width: '100%', padding: '11px 16px',
        display: 'flex', alignItems: 'center', gap: 13,
        background: 'transparent', border: 'none', cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        textAlign: 'left',
      }}
    >
      {/* Colored icon circle */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${item.color}1e`,
        border: `1px solid ${item.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 21,
      }}>
        {item.emoji}
      </div>

      {/* Name + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 1, lineHeight: 1.25 }}>
          {item.label}
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
          {item.subtitle}
        </p>
      </div>

      {/* Right indicator */}
      {editMode ? (
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: pinned ? item.color : 'rgba(255,255,255,0.06)',
          border: `2px solid ${pinned ? item.color : 'rgba(255,255,255,0.15)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#fff', fontWeight: 700,
          transition: 'background 0.15s ease',
        }}>
          {pinned ? '✓' : ''}
        </div>
      ) : (
        <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 18, flexShrink: 0, lineHeight: 1 }}>›</span>
      )}
    </button>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      padding: '14px 16px 5px',
      borderTop: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)' }}>
        {label}
      </span>
    </div>
  )
}

interface Props {
  onChange: (tab: ActivitiesSubTab) => void
}

export function ActivitiesNav({ onChange }: Props) {
  const [pins, setPins] = useState<string[]>(loadPins)
  const [editMode, setEditMode] = useState(false)

  const togglePin = (id: ActivitiesSubTab) => {
    setPins(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      savePins(next)
      return next
    })
  }

  const pinnedItems = ALL_ITEMS.filter(a => pins.includes(a.id))

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
      {/* Favorites header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '9px 16px 7px',
        background: 'rgba(0,0,0,0.18)',
        borderBottom: '1px solid rgba(255,255,255,0.045)',
      }}>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: 'var(--text-faint)' }}>
          Preferiti
        </span>
        <button
          onClick={() => setEditMode(e => !e)}
          style={{
            fontSize: 11, border: 'none', cursor: 'pointer',
            padding: '3px 11px', borderRadius: 20,
            background: editMode ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.07)',
            color: editMode ? '#a78bfa' : 'var(--color-text-secondary)',
            fontWeight: editMode ? 700 : 400,
          }}
        >
          {editMode ? '✓ Fatto' : '✏️ Modifica'}
        </button>
      </div>

      {pinnedItems.length === 0 && !editMode && (
        <div style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center' }}>
            Tocca <strong style={{ color: 'var(--color-text-secondary)' }}>Modifica</strong> per aggiungere preferiti rapidi
          </p>
        </div>
      )}

      {pinnedItems.map(item => (
        <ActivityRow key={item.id} item={item} onClick={() => onChange(item.id)}
          pinned={true} editMode={editMode} onTogglePin={togglePin} />
      ))}

      {/* All categories */}
      {CATEGORIES.map(cat => (
        <div key={cat.label}>
          <SectionLabel label={cat.label} />
          {cat.ids.map(id => {
            const item = ITEM_MAP[id]
            if (!item) return null
            const isPinned = pins.includes(id)
            if (!editMode && isPinned) return null  // already shown in Preferiti when not editing
            return (
              <ActivityRow key={id} item={item} onClick={() => onChange(id)}
                pinned={isPinned} editMode={editMode} onTogglePin={togglePin} />
            )
          })}
        </div>
      ))}
    </div>
  )
}
