import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import { useToastStore } from '../../store/toastStore'
import { haptic } from '../../services/HapticEngine'
import { AudioEngine } from '../../services/AudioEngine'
import { prefersReducedMotion } from '../../services/motionUtils'

const STAT_LABELS: Record<string, string> = {
  health: 'Salute', happiness: 'Felicità', energy: 'Energia',
  intelligence: 'Intelligenza', looks: 'Aspetto', mentalHealth: 'Salute Mentale',
  karma: 'Karma', reputation: 'Reputazione', money: 'Denaro',
  resilience: 'Resilienza', socialReputation: 'Rep. Sociale',
}

const STAT_EMOJI: Record<string, string> = {
  health: '❤️', happiness: '😊', energy: '⚡',
  intelligence: '🧠', looks: '✨', mentalHealth: '🧘',
  karma: '☯️', reputation: '⭐', money: '💰',
  resilience: '🛡️', socialReputation: '👥',
}

// Pure classification of an action's magnitude — €10.000 and +1 felicità should not
// look the same. 'money' is judged on its own scale; other stats (roughly -20..+20
// per action) are summed by absolute value since several small effects together can
// still be a big moment.
function classifyTier(effects: Record<string, number>): 'small' | 'medium' | 'large' {
  const money = Math.abs(effects.money ?? 0)
  const statSum = Object.entries(effects)
    .filter(([k]) => k !== 'money')
    .reduce((sum, [, v]) => sum + Math.abs(v), 0)
  if (money >= 5000 || statSum >= 30) return 'large'
  if (money >= 500 || statSum >= 12) return 'medium'
  return 'small'
}

export function ActionResultPanel() {
  const { panel } = useToastStore()
  const rawClose = useToastStore(s => s.closePanel)

  const tier = panel ? classifyTier(panel.effects) : 'small'

  // Confetti burst for a big positive outcome — fires once per panel, gated by
  // prefers-reduced-motion like every other confetti call site in the app.
  useEffect(() => {
    if (panel && panel.ok && tier === 'large' && !prefersReducedMotion()) {
      void confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.72 },
        colors: ['#FFD700', '#7C5CFF', '#18D39E'],
        scalar: 0.9,
        ticks: 160,
        zIndex: 8600,
      })
    }
    // Only the identity of the panel (via its title) should retrigger the burst,
    // not every re-render while the same panel is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel?.title, panel?.ok, tier])

  const closePanel = () => {
    haptic(panel?.ok ? 'tap' : 'error')
    AudioEngine.playSFX(panel?.ok ? 'success' : 'fail')
    rawClose()
  }

  if (!panel) return null

  const effectEntries = Object.entries(panel.effects).filter(([k, v]) =>
    STAT_LABELS[k] && v !== 0
  )

  return (
    <div
      onClick={closePanel}
      style={{
        position: 'fixed', inset: 0, zIndex: 8500,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        pointerEvents: 'auto',
        background: 'rgba(0,0,0,0.25)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={tier !== 'small' ? `effect-tier-${tier}` : undefined}
        style={{
          width: '92%', maxWidth: 380,
          background: 'var(--color-surface, #1e1e2e)',
          borderRadius: '18px 18px 14px 14px',
          border: `1px solid ${panel.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
          boxShadow: `0 -4px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
          overflow: 'hidden',
          // Entrance slide, then (for medium/large) a brief emphasis pop once it settles.
          animation: tier === 'large'
            ? 'slideUpPanel 0.28s cubic-bezier(0.34,1.2,0.64,1), tierPopLarge 0.4s cubic-bezier(0.34,1.5,0.64,1) 0.28s'
            : tier === 'medium'
            ? 'slideUpPanel 0.28s cubic-bezier(0.34,1.2,0.64,1), tierPopMedium 0.32s cubic-bezier(0.34,1.4,0.64,1) 0.28s'
            : 'slideUpPanel 0.28s cubic-bezier(0.34,1.2,0.64,1)',
        }}
      >
        {/* Status bar */}
        <div style={{
          height: 4,
          background: panel.ok
            ? 'linear-gradient(90deg, #10b981, #34d399)'
            : 'linear-gradient(90deg, #ef4444, #f87171)',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px 10px',
          borderBottom: effectEntries.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: panel.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${panel.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {panel.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 13.5, fontWeight: 700,
              color: panel.ok ? '#6ee7b7' : '#fca5a5',
              lineHeight: 1.35,
            }}>
              {panel.title}
            </p>
            <p style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', marginTop: 1 }}>
              {panel.ok ? 'Azione completata' : 'Azione fallita'}
            </p>
          </div>
          <button
            onClick={closePanel}
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Effects list */}
        {effectEntries.length > 0 && (
          <div style={{ padding: '10px 16px 14px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {effectEntries.map(([key, val]) => (
              <div
                key={key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 99,
                  background: val > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${val > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  fontSize: 12,
                }}
              >
                <span>{STAT_EMOJI[key] ?? '📊'}</span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {STAT_LABELS[key] ?? key}
                </span>
                <span style={{
                  fontWeight: 700,
                  color: val > 0 ? '#6ee7b7' : '#fca5a5',
                }}>
                  {val > 0 ? '+' : ''}{key === 'money' ? `€${Math.abs(val).toLocaleString()}` : val}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUpPanel {
          0%   { transform: translateY(60px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
