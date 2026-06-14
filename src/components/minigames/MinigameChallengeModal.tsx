// MinigameChallengeModal — renders the active mini-game challenge:
// intro → play → result. Applies rewards to the game store on finish.
// Mounted once at the app root; driven by useChallengeStore.

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useChallengeStore } from '../../store/challengeStore'
import { getChallenge, type ChallengeReward } from './challengeRegistry'

export function MinigameChallengeModal() {
  const activeId = useChallengeStore(s => s.activeId)
  const source = useChallengeStore(s => s.source)
  const close = useChallengeStore(s => s.close)
  const aggiornaStats = useGameStore(s => s.aggiornaStats)
  const addLogEntry = useGameStore(s => s.addLogEntry)

  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro')
  const [result, setResult] = useState<{ reward: ChallengeReward; score: number } | null>(null)

  const challenge = activeId ? getChallenge(activeId) : undefined
  if (!challenge) return null

  const handleFinish = (score: number) => {
    const state = useGameStore.getState()
    const reward = challenge.reward(score, state)
    // Event-posed challenges grant a small bonus over on-demand practice
    const effects = source === 'event'
      ? Object.fromEntries(Object.entries(reward.effects).map(([k, v]) => [k, Math.round(v * 1.25)]))
      : reward.effects
    aggiornaStats(effects)
    addLogEntry({
      year: state.time.year, age: state.time.age,
      text: reward.message, emoji: reward.emoji,
      category: 'minigame', statChanges: effects,
    })
    setResult({ reward: { ...reward, effects }, score })
    setPhase('result')
  }

  const reset = () => { setPhase('intro'); setResult(null); close() }

  const Game = challenge.Component

  return (
    <div style={overlay}>
      <div style={sheet}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 26 }}>{challenge.emoji}</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>{challenge.title}</h2>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
              {source === 'event' ? '🎲 Sfida del destino' : challenge.category} · Minigioco
            </p>
          </div>
          {phase !== 'play' && (
            <button onClick={reset} className="icon-btn icon-btn--danger" style={{ width: 32, height: 32 }} aria-label="Chiudi">✕</button>
          )}
        </div>

        {phase === 'intro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>{challenge.eventIntro}</p>
            <button onClick={() => setPhase('play')} className="btn-candy btn-candy--primary" style={{ width: '100%', fontSize: 16, padding: '13px 0', fontWeight: 800 }}>
              ▶ Gioca
            </button>
            <button onClick={reset} className="btn-candy btn-candy--neutral" style={{ width: '100%', fontSize: 13, padding: '10px 0' }}>
              {source === 'event' ? '🙅 Lascia perdere' : '← Annulla'}
            </button>
          </div>
        )}

        {phase === 'play' && <Game onFinish={handleFinish} />}

        {phase === 'result' && result && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{result.reward.emoji}</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>{result.reward.message}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              Punteggio: {Math.round(result.score * 100)}%
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
              {Object.entries(result.reward.effects).map(([k, v]) => (
                <span key={k} style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                  background: v >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: v >= 0 ? '#6ee7b7' : '#fca5a5',
                }}>
                  {labelFor(k)} {v >= 0 ? '+' : ''}{k === 'money' ? `€${v.toLocaleString('it-IT')}` : v}
                </span>
              ))}
            </div>
            <button onClick={reset} className="btn-candy btn-candy--primary" style={{ width: '100%', fontSize: 15, padding: '12px 0', fontWeight: 700 }}>
              ✓ Continua
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const STAT_LABELS: Record<string, string> = {
  money: '💰', happiness: '😊', health: '❤️', intelligence: '🧠', looks: '✨',
  energy: '⚡', karma: '☯️', reputation: '⭐', socialReputation: '👥', mentalHealth: '🧘',
}
const labelFor = (k: string) => STAT_LABELS[k] ?? k

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1200,
  background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(5px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
}
const sheet: React.CSSProperties = {
  width: '100%', maxWidth: 440,
  background: 'linear-gradient(160deg, #2A2150 0%, #1B1733 100%)',
  borderRadius: 20, padding: '20px 18px',
  boxShadow: '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.16)',
  border: '1px solid rgba(167,139,250,0.3)',
  animation: 'popIn 0.2s ease',
}
