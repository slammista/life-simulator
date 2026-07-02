import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { useGameStore } from '../../store/gameStore'
import { AudioEngine } from '../../services/AudioEngine'
import { prefersReducedMotion } from '../../services/motionUtils'
import type { RibbonTier } from '../../store/types'

interface Props {
  blocked: boolean
}

const TIER_COLORS: Record<RibbonTier, string[]> = {
  bronze: ['#CD7F32', '#E8A362', '#FFD9A0'],
  silver: ['#B8C0CC', '#E4E9F0', '#FFFFFF'],
  gold: ['#FFD700', '#FFB020', '#FFE9A0'],
  platinum: ['#B9F2FF', '#7C5CFF', '#FFFFFF'],
  diamond: ['#7C5CFF', '#ec4899', '#18D39E'],
}
const GOAL_COLORS = ['#18D39E', '#7C5CFF', '#FFD700']

// Consumes `pendingCelebrations` as a one-at-a-time queue: when the current item is
// dismissed, `current` becomes the next item and the effect below re-fires for it.
export function CelebrationOverlay({ blocked }: Props) {
  const pendingCelebrations = useGameStore(s => s.pendingCelebrations)
  const dismissCelebration = useGameStore(s => s.dismissCelebration)
  const current = pendingCelebrations[0]

  const [phase, setPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle')
  // Guards confetti/SFX from re-firing if this effect re-runs for the same
  // celebration (e.g. `blocked` flips false→true→false before dismissal).
  const firedIdRef = useRef<string | null>(null)

  const visible = !!current && !blocked

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!visible || !current) { setPhase('idle'); return }
    setPhase('in')

    if (firedIdRef.current !== current.id) {
      firedIdRef.current = current.id
      AudioEngine.playSFX('achievement')
      if (!prefersReducedMotion()) {
        const colors = current.tier ? TIER_COLORS[current.tier] : GOAL_COLORS
        const big = current.tier === 'diamond' || current.tier === 'platinum'
        void confetti({
          particleCount: big ? 140 : 90,
          spread: 75,
          origin: { y: 0.35 },
          colors,
          scalar: 1.05,
          ticks: 200,
          zIndex: 9600,
        })
      }
    }

    const id = current.id
    const t1 = setTimeout(() => setPhase('hold'), 220)
    const t2 = setTimeout(() => setPhase('out'), 1900)
    const t3 = setTimeout(() => { setPhase('idle'); dismissCelebration(id) }, 2150)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [visible, current, dismissCelebration])

  if (phase === 'idle' || !current) return null

  const accent = current.tier ? TIER_COLORS[current.tier][0] : '#18D39E'

  return (
    <div
      className={phase === 'in' ? 'celebration-overlay-in' : phase === 'out' ? 'celebration-overlay-out' : ''}
      style={{
        position: 'fixed', inset: 0, zIndex: 9550,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(ellipse at center, ${accent}33 0%, rgba(9,11,22,0.94) 70%)`,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        userSelect: 'none',
      }}
    >
      <div style={{
        fontSize: 76,
        animation: 'celebrationPopIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        filter: `drop-shadow(0 0 30px ${accent})`,
        marginBottom: 18,
      }}>
        {current.emoji}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 3,
        color: accent, textTransform: 'uppercase',
        padding: '5px 16px', borderRadius: 20,
        background: `${accent}22`, border: `1px solid ${accent}55`,
        marginBottom: 14,
      }}>
        ✦ {current.subtitle} ✦
      </div>
      <p style={{
        fontSize: 20, fontWeight: 700, color: '#fff',
        textAlign: 'center', maxWidth: 300, padding: '0 24px',
        textShadow: `0 0 20px ${accent}`,
      }}>
        {current.title}
      </p>

      <style>{`
        @keyframes celebrationPopIn {
          0%   { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes celebrationOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes celebrationOverlayOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .celebration-overlay-in  { animation: celebrationOverlayIn  0.25s ease forwards; }
        .celebration-overlay-out { animation: celebrationOverlayOut 0.3s ease forwards; }
        @media (prefers-reduced-motion: reduce) {
          .celebration-overlay-in, .celebration-overlay-out { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
