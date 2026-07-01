import { useEffect, useState } from 'react'

interface Props {
  age: number
  year: number
  visible: boolean
  onDone: () => void
}

const AGE_MSGS = [
  'Un altro anno vola.',
  'La vita continua.',
  'Ogni anno conta.',
  'Il tempo non aspetta.',
  'Stai crescendo.',
  'Nuove sfide ti aspettano.',
  'Il mondo cambia, tu pure.',
  'Ogni scelta ha un peso.',
]

export function AgeTransitionOverlay({ age, year, visible, onDone }: Props) {
  const [phase, setPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle')

  // Timed animation state machine driven by the `visible` prop — a genuine
  // effect (staggered setTimeout phase transitions), not derivable at render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!visible) { setPhase('idle'); return }
    setPhase('in')
    const t1 = setTimeout(() => setPhase('hold'), 220)
    const t2 = setTimeout(() => setPhase('out'), 950)
    const t3 = setTimeout(() => { setPhase('idle'); onDone() }, 1180)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [visible, onDone])

  if (phase === 'idle') return null

  const msg = AGE_MSGS[age % AGE_MSGS.length]

  return (
    <div
      className={phase === 'in' ? 'age-overlay-in' : phase === 'out' ? 'age-overlay-out' : ''}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(9, 11, 22, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        userSelect: 'none',
      }}
    >
      <div style={{ textAlign: 'center', padding: '0 32px' }}>
        {/* Cake emoji */}
        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 10 }}>🎂</div>

        {/* New age — big number */}
        <div
          className="age-number-in"
          style={{
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -2,
            color: '#fff',
            marginBottom: 8,
          }}
        >
          {age}
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 4, fontWeight: 500 }}>
          {msg}
        </div>

        {/* Year */}
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,0.25)',
          fontVariantNumeric: 'tabular-nums', letterSpacing: 2,
        }}>
          {year}
        </div>
      </div>
    </div>
  )
}
