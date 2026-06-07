import { useState, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import {
  generateHackingCode, scoreHackingGuess, hackingReward,
  scoreDrivingTest, drivingReward,
  PRISON_NODES, prisonReward,
  canPlayMinigame, MINIGAME_COOLDOWN,
  type HackingGuess, type DrivingTestResult,
} from '../../services/MinigameEngine'

// ─── Shared ─────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', borderRadius: 12,
  padding: 16, marginBottom: 12,
}
const btn = (color: string, disabled = false): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 8, fontSize: 13, border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? 'rgba(255,255,255,0.07)' : color,
  color: '#fff', opacity: disabled ? 0.5 : 1,
})

function ResultBadge({ won }: { won: boolean }) {
  return (
    <div style={{
      padding: '10px 16px', borderRadius: 10, textAlign: 'center', marginTop: 10, fontSize: 15, fontWeight: 700,
      background: won ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
      color: won ? '#10b981' : '#ef4444',
    }}>
      {won ? '🏆 HAI VINTO!' : '💀 HAI PERSO!'}
    </div>
  )
}

// ─── 1. Hacking — CodeBreaker ────────────────────────────────────

function HackingMinigame({ onFinish }: { onFinish: (won: boolean) => void }) {
  const [secret] = useState(() => generateHackingCode())
  const [guesses, setGuesses] = useState<HackingGuess[]>([])
  const [current, setCurrent] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const [won, setWon] = useState(false)
  const MAX_ATTEMPTS = 6

  function addDigit(d: number) {
    if (current.length < 4 && !done) setCurrent(prev => [...prev, d])
  }
  function removeDigit() {
    setCurrent(prev => prev.slice(0, -1))
  }
  function submitGuess() {
    if (current.length < 4 || done) return
    const { bulls, cows } = scoreHackingGuess(secret, current)
    const guess: HackingGuess = { digits: current, bulls, cows }
    const next = [...guesses, guess]
    setGuesses(next)
    setCurrent([])

    if (bulls === 4) {
      setDone(true); setWon(true); onFinish(true)
    } else if (next.length >= MAX_ATTEMPTS) {
      setDone(true); setWon(false); onFinish(false)
    }
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        🔐 Indovina il codice a 4 cifre in {MAX_ATTEMPTS} tentativi.
        🟩 = cifra giusta posto giusto · 🟨 = cifra giusta posto sbagliato
      </p>

      {/* Previous guesses */}
      <div style={{ marginBottom: 12 }}>
        {guesses.map((g, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {g.digits.map((d, j) => (
                <div key={j} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {'🟩'.repeat(g.bulls)}{'🟨'.repeat(g.cows)}{'⬜'.repeat(4 - g.bulls - g.cows)}
            </div>
            {g.bulls === 4 && <span style={{ color: '#10b981' }}>✅</span>}
          </div>
        ))}
      </div>

      {/* Current input */}
      {!done && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 8, border: '2px solid',
                borderColor: i < current.length ? '#6366f1' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18,
                background: i < current.length ? 'rgba(99,102,241,0.15)' : 'transparent',
              }}>
                {current[i] ?? ''}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginBottom: 8 }}>
            {[0,1,2,3,4,5,6,7,8,9].map(d => (
              <button key={d} onClick={() => addDigit(d)} style={btn('#374151')}>
                {d}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={removeDigit} style={{ ...btn('rgba(239,68,68,0.3)'), flex: 1 }}>← Cancella</button>
            <button onClick={submitGuess} disabled={current.length < 4} style={{ ...btn('#6366f1', current.length < 4), flex: 2 }}>
              Verifica ({MAX_ATTEMPTS - guesses.length} rimasti)
            </button>
          </div>
        </div>
      )}

      {done && (
        <>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            Codice segreto: <strong style={{ letterSpacing: 4, fontSize: 18 }}>{secret.join('')}</strong>
          </p>
          <ResultBadge won={won} />
        </>
      )}
    </div>
  )
}

// ─── 2. Driving Test — Timing ────────────────────────────────────

function DrivingMinigame({ onFinish }: { onFinish: (won: boolean) => void }) {
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<DrivingTestResult | null>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const DURATION = 3000 // ms to go from 0 to 100

  function startTest() {
    setProgress(0)
    setResult(null)
    setRunning(true)
    startRef.current = performance.now()

    function tick(now: number) {
      const elapsed = now - startRef.current
      const p = Math.min(100, (elapsed / DURATION) * 100)
      setProgress(p)
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setRunning(false)
        const r = scoreDrivingTest(Math.round(p))
        setResult(r)
        onFinish(r.passed)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function stop() {
    if (!running) return
    cancelAnimationFrame(rafRef.current)
    setRunning(false)
    const r = scoreDrivingTest(Math.round(progress))
    setResult(r)
    onFinish(r.passed)
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const zoneColor = progress >= 78 && progress <= 92 ? '#10b981' : progress >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        🚗 Premi STOP quando la barra è nella zona verde (78-92%). La zona gialla è sufficiente per passare.
      </p>

      {/* Progress bar with target zone markers */}
      <div style={{ position: 'relative', height: 44, marginBottom: 16 }}>
        <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 28, background: 'rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          {/* Target zone overlay */}
          <div style={{ position: 'absolute', left: '60%', width: '40%', top: 0, bottom: 0, background: 'rgba(245,158,11,0.15)' }} />
          <div style={{ position: 'absolute', left: '78%', width: '14%', top: 0, bottom: 0, background: 'rgba(16,185,129,0.25)' }} />
          {/* Fill */}
          <div style={{ height: '100%', width: `${progress}%`, background: zoneColor, transition: 'background 0.1s', borderRadius: 14 }} />
        </div>
        <div style={{ position: 'absolute', top: 0, left: `${progress}%`, transform: 'translateX(-50%)', fontSize: 10, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
          {Math.round(progress)}%
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        <span style={{ color: '#ef4444' }}>■ Bocciato (0-59)</span>
        <span style={{ color: '#f59e0b' }}>■ Sufficiente (60-77)</span>
        <span style={{ color: '#10b981' }}>■ Perfetto (78-92)</span>
      </div>

      {!result && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={startTest} disabled={running} style={btn('#6366f1', running)}>
            {running ? 'In corso...' : '▶ Avvia test'}
          </button>
          <button onClick={stop} disabled={!running} style={{ ...btn('#10b981', !running), flex: 1, fontSize: 16 }}>
            🛑 STOP
          </button>
        </div>
      )}

      {result && (
        <div>
          <p style={{ fontSize: 14, marginBottom: 8 }}>
            Fermato a <strong>{result.score}%</strong> —{' '}
            {result.grade === 'perfect' ? '🌟 Perfetto!' : result.grade === 'pass' ? '✅ Passato' : '❌ Bocciato'}
          </p>
          <ResultBadge won={result.passed} />
        </div>
      )}
    </div>
  )
}

// ─── 3. Prison Break — Choice maze ───────────────────────────────

function PrisonMinigame({ onFinish }: { onFinish: (won: boolean) => void }) {
  const [step, setStep] = useState(0)
  const [successes, setSuccesses] = useState(0)
  const [done, setDone] = useState(false)
  const [won, setWon] = useState(false)
  const [log, setLog] = useState<string[]>([])

  function choose(outcome: 'success' | 'fail' | 'neutral', label: string) {
    const node = PRISON_NODES[step]
    const newSuccesses = successes + (outcome === 'success' ? 1 : 0)
    setLog(prev => [...prev, `Passo ${step + 1}: ${label} → ${outcome === 'success' ? '✅' : outcome === 'fail' ? '❌' : '⚪'}`])

    if (outcome === 'fail') {
      setDone(true); setWon(false); onFinish(false)
      return
    }
    if (step + 1 >= PRISON_NODES.length) {
      const escaped = newSuccesses >= 3
      setDone(true); setWon(escaped); onFinish(escaped)
      setSuccesses(newSuccesses)
      return
    }
    setStep(s => s + 1)
    setSuccesses(newSuccesses)
    void node
  }

  const node = PRISON_NODES[step]

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        🏃 Naviga 4 fasi per evadere. Una scelta sbagliata termina il tentativo.
      </p>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {PRISON_NODES.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < step ? '#10b981' : i === step && !done ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', marginBottom: 12 }}>
          {log.map((l, i) => (
            <p key={i} style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0' }}>{l}</p>
          ))}
        </div>
      )}

      {!done && (
        <div>
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Fase {step + 1} / {PRISON_NODES.length}</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{node.description}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {node.options.map((opt, i) => (
              <button key={i} onClick={() => choose(opt.outcome, opt.label)} style={{
                ...btn(i === 0 ? '#6366f1' : i === 1 ? '#7c3aed' : '#374151'),
                textAlign: 'left', padding: '10px 14px',
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {done && <ResultBadge won={won} />}
    </div>
  )
}

// ─── Main MinigamesScreen ─────────────────────────────────────────

export function MinigamesScreen() {
  const { minigameStats, criminal, time, stats, finance, recordMinigameResult, cheatAddMoney } = useGameStore(useShallow(s => ({
    minigameStats: s.minigameStats,
    criminal: s.criminal,
    time: s.time,
    stats: s.stats,
    finance: s.finance,
    recordMinigameResult: s.recordMinigameResult,
    cheatAddMoney: s.cheatAddMoney,
  })))

  const [activeGame, setActiveGame] = useState<'hacking' | 'driving' | 'prison' | null>(null)
  const [result, setResult] = useState<{ won: boolean; msg: string; money: number } | null>(null)

  const state = useGameStore.getState()

  const hackCheck = canPlayMinigame('hacking', state)
  const driveCheck = canPlayMinigame('driving', state)
  const prisonCheck = canPlayMinigame('prison', state)

  function handleFinish(gameType: 'hacking' | 'driving' | 'prison', won: boolean) {
    recordMinigameResult(gameType, won)
    const freshState = useGameStore.getState()

    let reward = { money: 0, happiness: 0 }
    if (gameType === 'hacking') {
      const attemptsUsed = freshState.minigameStats.hackingPlayed % 6 || 6
      reward = hackingReward(attemptsUsed, freshState)
    } else if (gameType === 'driving') {
      reward = drivingReward(scoreDrivingTest(won ? 85 : 40), freshState)
    } else {
      reward = prisonReward(won ? 4 : 2, freshState)
    }

    if (won && reward.money > 0) {
      cheatAddMoney(reward.money)
    }

    const msg = won
      ? `🏆 Vittoria! Guadagnati €${reward.money.toLocaleString()}`
      : '💀 Sconfitta. Ci riproverai tra un anno.'

    setResult({ won, msg, money: won ? reward.money : 0 })
  }

  function resetGame() {
    setActiveGame(null)
    setResult(null)
  }

  const games = [
    {
      id: 'hacking' as const,
      emoji: '💻',
      name: 'Hacking Puzzle',
      desc: 'Indovina il codice a 4 cifre. Vinci soldi e boost carriera.',
      check: hackCheck,
      stats: `${minigameStats.hackingWins}V/${minigameStats.hackingPlayed}G`,
      prize: '€200–€2000',
      color: '#6366f1',
    },
    {
      id: 'driving' as const,
      emoji: '🚗',
      name: 'Test di Guida',
      desc: 'Ferma la barra al momento giusto. Supera il test per la patente.',
      check: driveCheck,
      stats: `${minigameStats.drivingWins}V/${minigameStats.drivingPlayed}G`,
      prize: '€300–€600',
      color: '#f59e0b',
    },
    {
      id: 'prison' as const,
      emoji: '🏃',
      name: 'Fuga dal Carcere',
      desc: 'Solo disponibile in prigione. Scegli il percorso giusto per evadere.',
      check: prisonCheck,
      stats: `${minigameStats.prisonBreakWins}V/${minigameStats.prisonBreakPlayed}G`,
      prize: '€500+',
      color: '#ef4444',
    },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      <h2 style={{ fontSize: 16, marginBottom: 4, color: 'var(--color-text)' }}>🧩 Minigiochi</h2>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Anno: {time.year} · Età: {time.age} · Soldi: €{finance.money.toLocaleString('it-IT')}
      </p>

      {/* Game selection */}
      {!activeGame && !result && (
        <>
          {games.map(g => (
            <div key={g.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{g.emoji} {g.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{g.desc}</p>
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 12 }}>{g.stats}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#10b981' }}>💰 Premio: {g.prize}</span>
                {g.check.ok
                  ? <button onClick={() => setActiveGame(g.id)} style={btn(g.color)}>Gioca</button>
                  : <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{g.check.reason}</span>
                }
              </div>

              {!g.check.ok && g.check.reason?.includes('anno') && (
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Cooldown: {MINIGAME_COOLDOWN} anno tra una partita e l'altra.
                </p>
              )}
            </div>
          ))}

          {/* Overall stats */}
          <div style={{ ...cardStyle, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>📊 Statistiche Totali</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Hack', w: minigameStats.hackingWins, p: minigameStats.hackingPlayed },
                { label: 'Guida', w: minigameStats.drivingWins, p: minigameStats.drivingPlayed },
                { label: 'Fuga', w: minigameStats.prisonBreakWins, p: minigameStats.prisonBreakPlayed },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>{s.w}</p>
                  <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>/ {s.p} giocate</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Active game */}
      {activeGame && !result && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700 }}>
              {games.find(g => g.id === activeGame)?.emoji} {games.find(g => g.id === activeGame)?.name}
            </p>
            <button onClick={resetGame} style={btn('rgba(255,255,255,0.08)')}>✕ Esci</button>
          </div>

          {activeGame === 'hacking' && (
            <HackingMinigame onFinish={(won) => handleFinish('hacking', won)} />
          )}
          {activeGame === 'driving' && (
            <DrivingMinigame onFinish={(won) => handleFinish('driving', won)} />
          )}
          {activeGame === 'prison' && (
            <PrisonMinigame onFinish={(won) => handleFinish('prison', won)} />
          )}
        </div>
      )}

      {/* Result screen */}
      {result && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 48, marginBottom: 8 }}>{result.won ? '🏆' : '💀'}</p>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: result.won ? '#10b981' : '#ef4444' }}>
            {result.msg}
          </p>
          {result.won && result.money > 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              +€{result.money.toLocaleString()} aggiunti al tuo saldo
            </p>
          )}
          <button onClick={resetGame} style={{ ...btn('#6366f1'), marginTop: 8 }}>← Torna ai minigiochi</button>
        </div>
      )}
    </div>
  )
}
