import { useState, useEffect } from 'react'

const SEEN_KEY = 'lifesim2d_first_age_up'

interface Props {
  hasEvent: boolean
  age: number
}

export function FirstPlayHint({ hasEvent, age }: Props) {
  const [visible, setVisible] = useState(false)

  // Delayed-hint visibility driven by the `age` prop (timer + localStorage
  // read) — a genuine effect, not derivable synchronously at render.
  useEffect(() => {
    if (age === 0 && !localStorage.getItem(SEEN_KEY)) {
      const t = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(t)
    } else if (age > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false)
    }
  }, [age])

  // Hide hint once player advances (event appeared = they pressed +1 ETÀ)
  useEffect(() => {
    if (hasEvent && visible) {
      localStorage.setItem(SEEN_KEY, '1')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false)
    }
  }, [hasEvent, visible])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 8px)',
      left: '50%', transform: 'translateX(-50%)',
      zIndex: 9900,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      pointerEvents: 'none',
      animation: 'hintBounce 1.2s ease-in-out infinite',
    }}>
      <div style={{
        background: 'rgba(99,102,241,0.92)',
        borderRadius: 20, padding: '6px 16px',
        fontSize: 12, fontWeight: 700, color: '#fff',
        boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
        whiteSpace: 'nowrap',
      }}>
        Tocca +1 ETÀ per iniziare!
      </div>
      <div style={{ fontSize: 20, filter: 'drop-shadow(0 2px 4px rgba(99,102,241,0.5))' }}>👇</div>

      <style>{`
        @keyframes hintBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </div>
  )
}
