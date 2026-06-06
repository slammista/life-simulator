type Tab = 'main' | 'career' | 'relations' | 'goals' | 'settings'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; emoji: string; label: string }[] = [
  { id: 'main', emoji: '🏠', label: 'Vita' },
  { id: 'career', emoji: '💼', label: 'Carriera' },
  { id: 'relations', emoji: '❤️', label: 'Relazioni' },
  { id: 'goals', emoji: '🎯', label: 'Goals' },
  { id: 'settings', emoji: '⚙️', label: 'Impostazioni' },
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
