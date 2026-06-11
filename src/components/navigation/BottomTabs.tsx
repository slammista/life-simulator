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
  { id: 'lavoro',  emoji: '💼', label: 'Carriera' },
  { id: 'assets',  emoji: '🏦', label: 'Assets'  },
]
const SIDE_TABS_RIGHT: { id: Tab; emoji: string; label: string }[] = [
  { id: 'relazioni',  emoji: '❤️',  label: 'Relazioni'  },
  { id: 'activities', emoji: '🎯', label: 'Activities' },
]

export function BottomTabs({ active, onChange, onAge, ageDisabled, hasEvent, currentAge }: Props) {
  const ageReady = !ageDisabled && !hasEvent

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
          onClick={() => active !== 'vita' ? onChange('vita') : onAge()}
          disabled={active === 'vita' && ageDisabled && !hasEvent}
          className={active === 'vita' && ageReady ? 'pulse' : ''}
          style={{
            width: 60, height: 60,
            borderRadius: '50%',
            border: active !== 'vita'
              ? '2px solid rgba(148,163,184,0.4)'
              : hasEvent
              ? '2px solid rgba(255,176,32,0.5)'
              : ageReady
              ? '2px solid rgba(124,92,255,0.5)'
              : '2px solid rgba(255,255,255,0.08)',
            cursor: active === 'vita' && ageDisabled && !hasEvent ? 'not-allowed' : 'pointer',
            background: active !== 'vita'
              ? 'linear-gradient(135deg, #334155, #475569)'
              : hasEvent
              ? 'linear-gradient(135deg, #FFB020, #f59e0b)'
              : ageDisabled
              ? 'rgba(124,92,255,0.2)'
              : 'linear-gradient(135deg, #7C5CFF, #9B5CFF)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: active !== 'vita'
              ? 'none'
              : hasEvent
              ? '0 0 24px rgba(255,176,32,0.45), 0 4px 16px rgba(0,0,0,0.4)'
              : ageReady
              ? '0 0 28px rgba(124,92,255,0.55), 0 4px 16px rgba(0,0,0,0.4)'
              : 'none',
            transform: 'translateY(-10px)',
            flexShrink: 0,
            transition: 'box-shadow 0.2s ease, background 0.2s ease, transform 0.1s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
          onPointerDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-10px) scale(0.93)' }}
          onPointerUp={e =>   { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-10px) scale(1)'    }}
          onPointerLeave={e =>{ (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-10px) scale(1)'    }}
          title={active !== 'vita' ? 'Torna alla vita' : hasEvent ? 'Risolvi evento' : `Invecchia a ${currentAge + 1} anni`}
        >
          {active !== 'vita' ? (
            <>
              <span style={{ fontSize: 19 }}>🏠</span>
              <span style={{ fontSize: 8, fontWeight: 700, marginTop: 1, letterSpacing: 0.5 }}>VITA</span>
            </>
          ) : hasEvent ? (
            <>
              <span style={{ fontSize: 19 }}>⏳</span>
              <span style={{ fontSize: 8, fontWeight: 800, marginTop: 1, letterSpacing: 0.5 }}>EVENT</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>+1</span>
              <span style={{ fontSize: 8, fontWeight: 700, marginTop: 1, letterSpacing: 0.5 }}>ETÀ</span>
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
