export type Tab = 'lavoro' | 'assets' | 'vita' | 'relazioni' | 'activities'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
  onAge: () => void
  ageDisabled: boolean
  hasEvent: boolean
  currentAge: number
}

import type { ReactNode } from 'react'

const svg = (children: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

const ICONS: Record<Tab, ReactNode> = {
  lavoro: svg(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>),
  assets: svg(<><path d="M3 10l9-6 9 6" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 20h18" /></>),
  vita: svg(<circle cx="12" cy="12" r="8" />),
  relazioni: svg(<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" />),
  activities: svg(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>),
}

const SIDE_TABS: { id: Tab; label: string }[] = [
  { id: 'lavoro', label: 'Lavoro' },
  { id: 'assets', label: 'Patrimonio' },
]
const SIDE_TABS_RIGHT: { id: Tab; label: string }[] = [
  { id: 'relazioni',  label: 'Relazioni' },
  { id: 'activities', label: 'Attività' },
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
          <span className="tab-icon">{ICONS[tab.id]}</span>
          <span>{tab.label}</span>
        </button>
      ))}

      {/* Center Age / Vita button */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: 4 }}>
        <button
          onClick={onAge}
          disabled={ageDisabled && !hasEvent}
          className={ageReady ? 'pulse' : ''}
          style={{
            width: 60, height: 60,
            borderRadius: '50%',
            border: 'none',
            cursor: ageDisabled && !hasEvent ? 'not-allowed' : 'pointer',
            background: hasEvent ? 'var(--gold)' : ageDisabled ? 'var(--bg-secondary)' : 'var(--primary)',
            color: hasEvent ? '#1a1305' : '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
            transform: 'translateY(-10px)',
            flexShrink: 0,
            transition: 'background 0.2s ease, transform 0.1s ease',
            WebkitTapHighlightColor: 'transparent',
          }}
          onPointerDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-10px) scale(0.93)' }}
          onPointerUp={e =>   { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-10px) scale(1)'    }}
          onPointerLeave={e =>{ (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-10px) scale(1)'    }}
          title={hasEvent ? 'Risolvi evento' : `Invecchia a ${currentAge + 1} anni`}
        >
          {hasEvent ? (
            <>
              <span style={{ fontSize: 19 }}>⏳</span>
              <span style={{ fontSize: 10, fontWeight: 700, marginTop: 1 }}>EVENT</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>+1</span>
              <span style={{ fontSize: 10, fontWeight: 600, marginTop: 1 }}>ETÀ</span>
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
          <span className="tab-icon">{ICONS[tab.id]}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
