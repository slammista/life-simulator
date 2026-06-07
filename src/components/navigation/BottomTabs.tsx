export type Tab = 'lavoro' | 'assets' | 'vita' | 'relazioni' | 'activities'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
  onAge: () => void
  ageDisabled: boolean
  hasEvent: boolean
  currentAge: number
}

const SIDE_TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'lavoro',     emoji: '💼', label: 'Lavoro' },
  { id: 'assets',     emoji: '🏦', label: 'Assets' },
]
const SIDE_TABS_RIGHT: { id: Tab; emoji: string; label: string }[] = [
  { id: 'relazioni',  emoji: '❤️', label: 'Relazioni' },
  { id: 'activities', emoji: '🎯', label: 'Activities' },
]

export function BottomTabs({ active, onChange, onAge, ageDisabled, hasEvent, currentAge }: Props) {
  return (
    <div className="bottom-tabs" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 72px 1fr 1fr',
      alignItems: 'flex-end',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {SIDE_TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span>{tab.emoji}</span>
          <span>{tab.label}</span>
        </button>
      ))}

      {/* Center Age / Vita button */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: 4 }}>
        <button
          onClick={onAge}
          disabled={ageDisabled && !hasEvent}
          className={ageDisabled || hasEvent ? '' : 'pulse'}
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            border: 'none',
            cursor: ageDisabled && !hasEvent ? 'not-allowed' : 'pointer',
            background: hasEvent
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : ageDisabled
              ? 'rgba(99,102,241,0.3)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: ageDisabled && !hasEvent
              ? 'none'
              : '0 4px 20px rgba(99,102,241,0.5)',
            transform: 'translateY(-8px)',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
          title={hasEvent ? 'Risolvi evento' : `Invecchia a ${currentAge + 1} anni`}
        >
          {hasEvent ? (
            <>
              <span style={{ fontSize: 18 }}>⏳</span>
              <span style={{ fontSize: 8, fontWeight: 700, marginTop: 1 }}>EVENT</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>+1</span>
              <span style={{ fontSize: 8, fontWeight: 700, marginTop: 1 }}>ETÀ</span>
            </>
          )}
        </button>
      </div>

      {SIDE_TABS_RIGHT.map(tab => (
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
