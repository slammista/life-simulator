export type Tab = 'main' | 'develop' | 'people' | 'wellbeing' | 'profile'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; emoji: string; label: string }[] = [
  { id: 'main',      emoji: '🏠', label: 'Vita' },
  { id: 'develop',   emoji: '📚', label: 'Sviluppo' },
  { id: 'people',    emoji: '❤️', label: 'Persone' },
  { id: 'wellbeing', emoji: '💊', label: 'Benessere' },
  { id: 'profile',   emoji: '⚙️', label: 'Profilo' },
]

export function BottomTabs({ active, onChange }: Props) {
  return (
    <div className="bottom-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span>{tab.emoji}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
