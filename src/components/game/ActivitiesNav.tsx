import { useState } from 'react'

type ActivitiesSubTab =
  | 'health' | 'hobby' | 'criminal' | 'substances' | 'religion'
  | 'body' | 'beauty' | 'barber' | 'gambling' | 'sex_health' | 'cosmetic'
  | 'travel' | 'politics' | 'goals' | 'challenges' | 'ribbons'
  | 'timeline' | 'minigames' | 'leaderboard' | 'settings' | 'privacy'
  | 'socialize'

const ITEMS: { id: ActivitiesSubTab; emoji: string; label: string }[] = [
  { id: 'health',      emoji: '💊', label: 'Salute' },
  { id: 'hobby',       emoji: '🎸', label: 'Hobby' },
  { id: 'beauty',      emoji: '💄', label: 'Bellezza' },
  { id: 'barber',      emoji: '💈', label: 'Barbiere' },
  { id: 'cosmetic',    emoji: '💉', label: 'Estetica' },
  { id: 'body',        emoji: '🎨', label: 'Modifiche corporee' },
  { id: 'sex_health',  emoji: '❤️‍🔥', label: 'Salute sessuale' },
  { id: 'criminal',    emoji: '🚔', label: 'Crimini' },
  { id: 'substances',  emoji: '🍺', label: 'Sostanze' },
  { id: 'gambling',    emoji: '🎲', label: 'Azzardo' },
  { id: 'socialize',   emoji: '🎉', label: 'Socializza' },
  { id: 'religion',    emoji: '🙏', label: 'Fede' },
  { id: 'politics',    emoji: '🏛️', label: 'Politica' },
  { id: 'travel',      emoji: '✈️', label: 'Viaggi' },
  { id: 'goals',       emoji: '🎯', label: 'Obiettivi' },
  { id: 'challenges',  emoji: '🏆', label: 'Sfide' },
  { id: 'ribbons',     emoji: '🏅', label: 'Medaglie' },
  { id: 'minigames',   emoji: '🧩', label: 'Minigiochi' },
  { id: 'timeline',    emoji: '🧠', label: 'Timeline' },
  { id: 'leaderboard', emoji: '🥇', label: 'Classifica' },
  { id: 'settings',    emoji: '⚙️', label: 'Impostazioni' },
  { id: 'privacy',     emoji: '🔒', label: 'Privacy' },
]

const ITEM_MAP = Object.fromEntries(ITEMS.map(i => [i.id, i]))

const CATEGORIES: { label: string; color: string; ids: ActivitiesSubTab[] }[] = [
  {
    label: 'Corpo & Salute',
    color: '#9CC77A',
    ids: ['health', 'hobby', 'beauty', 'barber', 'cosmetic', 'body', 'sex_health'],
  },
  {
    label: 'Rischio',
    color: '#ef4444',
    ids: ['criminal', 'substances', 'gambling'],
  },
  {
    label: 'Socialità',
    color: '#34897D',
    ids: ['socialize', 'religion', 'politics', 'travel'],
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
  const activeCat = CATEGORIES.find(c => c.ids.includes(active)) ?? CATEGORIES[0]
  const [openLabel, setOpenLabel] = useState(activeCat.label)
  const open = CATEGORIES.find(c => c.label === openLabel) ?? activeCat

  return (
    <div className="subnav">
      <div className="subnav-cats" role="tablist">
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            role="tab"
            aria-selected={cat.label === open.label}
            className={cat.label === open.label ? 'on' : ''}
            onClick={() => setOpenLabel(cat.label)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="subnav-items">
        {open.ids.map(id => {
          const item = ITEM_MAP[id]
          if (!item) return null
          return (
            <button
              key={id}
              className={active === id ? 'on' : ''}
              onClick={() => onChange(id)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
