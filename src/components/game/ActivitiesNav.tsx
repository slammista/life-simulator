type ActivitiesSubTab =
  | 'health' | 'hobby' | 'criminal' | 'substances' | 'religion'
  | 'body' | 'beauty' | 'gambling' | 'sex_health' | 'cosmetic'
  | 'travel' | 'politics' | 'goals' | 'challenges' | 'ribbons'
  | 'timeline' | 'minigames' | 'leaderboard' | 'settings' | 'privacy'

const ITEMS: { id: ActivitiesSubTab; emoji: string; label: string }[] = [
  { id: 'health',      emoji: '💊', label: 'Salute' },
  { id: 'hobby',       emoji: '🎸', label: 'Hobby' },
  { id: 'beauty',      emoji: '💄', label: 'Beauty' },
  { id: 'cosmetic',    emoji: '💉', label: 'Estetica' },
  { id: 'body',        emoji: '🎨', label: 'Body Mod' },
  { id: 'sex_health',  emoji: '❤️‍🔥', label: 'Sess.' },
  { id: 'criminal',    emoji: '🚔', label: 'Crimini' },
  { id: 'substances',  emoji: '🍺', label: 'Sostanze' },
  { id: 'gambling',    emoji: '🎲', label: 'Azzardo' },
  { id: 'religion',    emoji: '🙏', label: 'Fede' },
  { id: 'politics',    emoji: '🏛️', label: 'Politica' },
  { id: 'travel',      emoji: '✈️', label: 'Viaggi' },
  { id: 'goals',       emoji: '🎯', label: 'Goals' },
  { id: 'challenges',  emoji: '🏆', label: 'Sfide' },
  { id: 'ribbons',     emoji: '🏅', label: 'Medaglie' },
  { id: 'minigames',   emoji: '🧩', label: 'Giochi' },
  { id: 'timeline',    emoji: '🧠', label: 'Timeline' },
  { id: 'leaderboard', emoji: '🥇', label: 'Classifica' },
  { id: 'settings',    emoji: '⚙️', label: 'Impost.' },
  { id: 'privacy',     emoji: '🔒', label: 'Privacy' },
]

const ITEM_MAP = Object.fromEntries(ITEMS.map(i => [i.id, i]))

const CATEGORIES: { label: string; color: string; ids: ActivitiesSubTab[] }[] = [
  {
    label: 'Corpo & Salute',
    color: '#10b981',
    ids: ['health', 'hobby', 'beauty', 'cosmetic', 'body', 'sex_health'],
  },
  {
    label: 'Rischio',
    color: '#ef4444',
    ids: ['criminal', 'substances', 'gambling'],
  },
  {
    label: 'Socialità',
    color: '#6366f1',
    ids: ['religion', 'politics', 'travel'],
  },
  {
    label: 'Svago',
    color: '#f59e0b',
    ids: ['goals', 'challenges', 'ribbons', 'minigames'],
  },
  {
    label: 'Profilo',
    color: '#94a3b8',
    ids: ['timeline', 'leaderboard', 'settings', 'privacy'],
  },
]

interface Props {
  active: ActivitiesSubTab
  onChange: (tab: ActivitiesSubTab) => void
}

export function ActivitiesNav({ active, onChange }: Props) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.2)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      overflowY: 'auto',
      maxHeight: 200,
      flexShrink: 0,
    }}>
      {CATEGORIES.map(cat => (
        <div key={cat.label} style={{ padding: '6px 12px 2px' }}>
          <div style={{
            fontSize: 9, color: cat.color, textTransform: 'uppercase',
            letterSpacing: 1, marginBottom: 5, fontWeight: 700,
          }}>
            {cat.label}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
            {cat.ids.map(id => {
              const item = ITEM_MAP[id]
              if (!item) return null
              const isActive = active === id
              return (
                <button
                  key={id}
                  onClick={() => onChange(id)}
                  style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                    whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: isActive ? `${cat.color}33` : 'rgba(255,255,255,0.07)',
                    color: isActive ? cat.color : 'var(--color-text-secondary)',
                    outline: isActive ? `1px solid ${cat.color}55` : 'none',
                  }}
                >
                  {item.emoji} {item.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
