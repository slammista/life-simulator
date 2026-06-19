import { useState, useEffect, useRef } from 'react'
import { AdRewardEngine } from '../../services/AdRewardEngine'
import type { AdRewardState, AdReward } from '../../services/AdRewardEngine'

interface Props {
  adState: AdRewardState
  onClaim: () => { reward: AdReward; ok: boolean; reason?: string }
  compact?: boolean
}

export function AdRewardButton({ adState, onClaim, compact = false }: Props) {
  const [phase, setPhase] = useState<'idle' | 'watching' | 'result'>('idle')
  const [countdown, setCountdown] = useState(5)
  const [result, setResult] = useState<AdReward | null>(null)
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const check = AdRewardEngine.canWatch(adState)
  const remaining = AdRewardEngine.remainingToday(adState)

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => () => clearTimer(), [])

  function startAd() {
    const can = AdRewardEngine.canWatch(adState)
    if (!can.ok) { setError(can.reason ?? 'Non disponibile'); return }

    setPhase('watching')
    setCountdown(5)
    setError('')

    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearTimer()
          // Ad finished — claim reward
          const res = onClaim()
          if (res.ok) {
            setResult(res.reward)
            setPhase('result')
          } else {
            setError(res.reason ?? 'Errore')
            setPhase('idle')
          }
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  function reset() {
    setPhase('idle')
    setResult(null)
    setError('')
  }

  if (phase === 'watching') {
    return (
      <div style={{
        padding: compact ? '10px 14px' : '14px 18px',
        borderRadius: 12, background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: compact ? 20 : 28, marginBottom: 6 }}>📺</div>
        <p style={{ fontSize: compact ? 11 : 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
          Annuncio in corso...
        </p>
        <div style={{
          fontSize: compact ? 22 : 32, fontWeight: 700,
          color: 'var(--color-cta, #6366f1)',
        }}>{countdown}</div>
        <div style={{
          height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)',
          marginTop: 8, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'var(--color-cta, #6366f1)',
            width: '100%',
            transform: `scaleX(${(5 - countdown) / 5})`,
            transformOrigin: 'left',
            transition: 'transform 0.9s linear',
          }} />
        </div>
      </div>
    )
  }

  if (phase === 'result' && result) {
    return (
      <div style={{
        padding: compact ? '10px 14px' : '14px 18px',
        borderRadius: 12,
        background: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.3)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: compact ? 24 : 36, marginBottom: 6 }}>{result.emoji}</div>
        <p style={{ fontSize: compact ? 13 : 15, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
          {result.label}
        </p>
        <p style={{ fontSize: compact ? 11 : 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
          {result.description}
        </p>
        <button onClick={reset} style={{
          padding: '6px 20px', borderRadius: 20, fontSize: 12,
          border: 'none', cursor: 'pointer',
          background: 'rgba(16,185,129,0.2)', color: '#10b981',
        }}>
          OK
        </button>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <p style={{ fontSize: 11, color: '#f59e0b', marginBottom: 6, textAlign: 'center' }}>{error}</p>
      )}
      <button
        onClick={startAd}
        disabled={!check.ok}
        style={{
          width: '100%',
          padding: compact ? '8px 0' : '12px 0',
          borderRadius: 12,
          fontSize: compact ? 12 : 14,
          fontWeight: 600,
          border: 'none',
          cursor: check.ok ? 'pointer' : 'not-allowed',
          background: check.ok
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'rgba(255,255,255,0.06)',
          color: check.ok ? '#fff' : 'var(--color-text-secondary)',
          opacity: check.ok ? 1 : 0.7,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <span>📺</span>
        <span>
          {check.ok
            ? `Guarda un annuncio — premio gratuito (${remaining} rimasti oggi)`
            : (check.reason ?? 'Non disponibile')}
        </span>
      </button>
      {!compact && (
        <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 4 }}>
          Annuncio di 5 secondi · {AdRewardEngine.DAILY_LIMIT} premi al giorno
        </p>
      )}
    </div>
  )
}
