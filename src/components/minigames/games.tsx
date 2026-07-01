// Reusable mini-game components. Each calls onFinish(score) with a 0..1 score
// when the round ends. Self-contained, clean up timers on unmount.

import { useEffect, useRef, useState, useCallback } from 'react'

export interface MiniGameProps {
  onFinish: (score: number) => void
}

const wrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
const hint: React.CSSProperties = { fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }
const bigBtn = (bg: string): React.CSSProperties => ({
  padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
  fontSize: 16, fontWeight: 800, color: '#fff', background: bg,
  boxShadow: '0 3px 0 rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
})

// ─── 1. Timing Bar — stop the marker in the green zone ──────────────
export function TimingBarGame({ onFinish }: MiniGameProps) {
  const [pos, setPos] = useState(0)        // 0..100
  const [done, setDone] = useState(false)
  const dirRef = useRef(1)
  const rafRef = useRef(0)
  const ZONE_C = 50, ZONE_W = 16   // green zone center & half-width
  const GOLD_W = 5

  useEffect(() => {
    let last = performance.now()
    const speed = 0.08
    const tick = (now: number) => {
      const dt = now - last; last = now
      setPos(p => {
        let n = p + dirRef.current * speed * dt
        if (n >= 100) { n = 100; dirRef.current = -1 }
        if (n <= 0)   { n = 0;   dirRef.current = 1 }
        return n
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const stop = () => {
    if (done) return
    cancelAnimationFrame(rafRef.current)
    setDone(true)
    const dist = Math.abs(pos - ZONE_C)
    const score = dist <= GOLD_W ? 1 : dist <= ZONE_W ? 0.6 : Math.max(0, 0.4 - (dist - ZONE_W) / 100)
    setTimeout(() => onFinish(score), 500)
  }

  return (
    <div style={wrap}>
      <p style={hint}>🎯 Premi <b>STOP</b> quando l'indicatore è nella zona verde. Centro dorato = colpo perfetto.</p>
      <div style={{ position: 'relative', height: 34, background: 'rgba(255,255,255,0.08)', borderRadius: 17, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${ZONE_C - ZONE_W}%`, width: `${ZONE_W * 2}%`, background: 'rgba(16,185,129,0.3)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${ZONE_C - GOLD_W}%`, width: `${GOLD_W * 2}%`, background: 'rgba(250,204,21,0.45)' }} />
        <div style={{ position: 'absolute', top: 2, bottom: 2, left: `calc(${pos}% - 3px)`, width: 6, borderRadius: 3, background: '#fff', boxShadow: '0 0 6px #fff' }} />
      </div>
      <button onClick={stop} disabled={done} style={bigBtn('#10b981')}>🛑 STOP</button>
    </div>
  )
}

// ─── 2. Shrinking Target — tap when ring matches target ────────────
export function TapTargetGame({ onFinish }: MiniGameProps) {
  const ROUNDS = 3
  const [round, setRound] = useState(0)
  const [r, setR] = useState(90)
  const [scores, setScores] = useState<number[]>([])
  const dirRef = useRef(-1)
  const rafRef = useRef(0)
  const TARGET = 42, MIN = 18, MAX = 90

  useEffect(() => {
    let last = performance.now()
    const speed = 0.07
    const tick = (now: number) => {
      const dt = now - last; last = now
      setR(v => {
        let n = v + dirRef.current * speed * dt
        if (n <= MIN) { n = MIN; dirRef.current = 1 }
        if (n >= MAX) { n = MAX; dirRef.current = -1 }
        return n
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [round])

  const tap = () => {
    const dist = Math.abs(r - TARGET)
    const s = dist <= 4 ? 1 : dist <= 12 ? 0.6 : Math.max(0, 0.4 - dist / 100)
    const next = [...scores, s]
    setScores(next)
    if (round + 1 >= ROUNDS) {
      cancelAnimationFrame(rafRef.current)
      const avg = next.reduce((a, b) => a + b, 0) / next.length
      setTimeout(() => onFinish(avg), 400)
    } else {
      setRound(round + 1)
      setR(90); dirRef.current = -1
    }
  }

  return (
    <div style={wrap}>
      <p style={hint}>🎯 Tocca quando l'anello bianco coincide con il cerchio dorato. Round {round + 1}/{ROUNDS}.</p>
      <div onClick={tap} style={{ position: 'relative', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
        <div style={{ position: 'absolute', width: TARGET * 2, height: TARGET * 2, borderRadius: '50%', border: '3px solid #facc15' }} />
        <div style={{ position: 'absolute', width: r * 2, height: r * 2, borderRadius: '50%', border: '3px solid #fff' }} />
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', position: 'absolute', bottom: 8 }}>tocca lo schermo</span>
      </div>
    </div>
  )
}

// ─── 3. Reaction — tap as soon as it turns green ───────────────────
export function ReactionGame({ onFinish }: MiniGameProps) {
  const ROUNDS = 3
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<'wait' | 'go' | 'early'>('wait')
  const [scores, setScores] = useState<number[]>([])
  const goAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const arm = useCallback(() => {
    setPhase('wait')
    const delay = 800 + Math.random() * 2200
    timerRef.current = setTimeout(() => {
      goAtRef.current = performance.now()
      setPhase('go')
    }, delay)
  }, [])

  // New round setup (randomized-delay timer) triggered by `round` changing —
  // a genuine effect, not derivable synchronously at render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { arm(); return () => clearTimeout(timerRef.current) }, [arm, round])

  const finishRound = (s: number) => {
    const next = [...scores, s]
    setScores(next)
    if (round + 1 >= ROUNDS) {
      const avg = next.reduce((a, b) => a + b, 0) / next.length
      setTimeout(() => onFinish(avg), 400)
    } else {
      setRound(round + 1)
    }
  }

  const click = () => {
    if (phase === 'wait') {
      clearTimeout(timerRef.current)
      setPhase('early')
      setTimeout(() => finishRound(0), 600)
    } else if (phase === 'go') {
      const rt = performance.now() - goAtRef.current
      const s = rt < 250 ? 1 : rt < 400 ? 0.75 : rt < 600 ? 0.5 : 0.25
      finishRound(s)
    }
  }

  const bg = phase === 'go' ? '#10b981' : phase === 'early' ? '#ef4444' : '#475569'
  const label = phase === 'go' ? 'TOCCA!' : phase === 'early' ? 'Troppo presto!' : 'Aspetta il verde…'

  return (
    <div style={wrap}>
      <p style={hint}>⚡ Tocca appena diventa verde. Non anticipare! Round {round + 1}/{ROUNDS}.</p>
      <div onClick={click} style={{ height: 200, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 800, color: '#fff', transition: 'background 0.05s' }}>
        {label}
      </div>
    </div>
  )
}

// ─── 4. Quiz Flash — multiple choice general knowledge ─────────────
const QUIZ_BANK: { q: string; opts: string[]; a: number }[] = [
  { q: 'Capitale d\'Italia?', opts: ['Milano', 'Roma', 'Napoli', 'Torino'], a: 1 },
  { q: 'Quanti continenti ci sono?', opts: ['5', '6', '7', '8'], a: 2 },
  { q: 'Autore della Divina Commedia?', opts: ['Petrarca', 'Boccaccio', 'Dante', 'Manzoni'], a: 2 },
  { q: 'Pianeta più vicino al Sole?', opts: ['Venere', 'Marte', 'Mercurio', 'Terra'], a: 2 },
  { q: 'Quanti lati ha un esagono?', opts: ['5', '6', '7', '8'], a: 1 },
  { q: 'Simbolo chimico dell\'oro?', opts: ['Or', 'Au', 'Ag', 'Go'], a: 1 },
  { q: 'In che anno è caduto il Muro di Berlino?', opts: ['1985', '1989', '1991', '1995'], a: 1 },
  { q: 'Fiume più lungo d\'Italia?', opts: ['Tevere', 'Adige', 'Po', 'Arno'], a: 2 },
  { q: 'Quante corde ha una chitarra classica?', opts: ['4', '5', '6', '7'], a: 2 },
  { q: 'Chi ha dipinto la Gioconda?', opts: ['Raffaello', 'Leonardo', 'Michelangelo', 'Caravaggio'], a: 1 },
]
export function QuizFlashGame({ onFinish }: MiniGameProps) {
  const [questions] = useState(() => [...QUIZ_BANK].sort(() => Math.random() - 0.5).slice(0, 5))
  const [idx, setIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    const right = i === questions[idx].a
    const newCorrect = correct + (right ? 1 : 0)
    setCorrect(newCorrect)
    setTimeout(() => {
      if (idx + 1 >= questions.length) onFinish(newCorrect / questions.length)
      else { setIdx(idx + 1); setPicked(null) }
    }, 700)
  }

  const cur = questions[idx]
  return (
    <div style={wrap}>
      <p style={hint}>🧠 Domanda {idx + 1}/{questions.length} · Risposte corrette: {correct}</p>
      <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.12)', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>
        {cur.q}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cur.opts.map((o, i) => {
          const isRight = i === cur.a
          const show = picked !== null
          const bg = show && isRight ? 'rgba(16,185,129,0.3)' : show && i === picked ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'
          return (
            <button key={i} onClick={() => choose(i)} disabled={show} style={{
              padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
              background: bg, color: 'var(--color-text)', fontSize: 14, fontWeight: 600, cursor: show ? 'default' : 'pointer', textAlign: 'left',
            }}>
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 5. Quick Tap (rhythm) — hit targets before they vanish ────────
export function QuickTapGame({ onFinish }: MiniGameProps) {
  const TOTAL = 8
  const [shown, setShown] = useState(0)
  const [hits, setHits] = useState(0)
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const shownRef = useRef(0)

  const spawn = useCallback(() => {
    if (shownRef.current >= TOTAL) { onFinish(hitsRef.current / TOTAL); return }
    shownRef.current += 1
    setShown(shownRef.current)
    setTarget({ x: 10 + Math.random() * 78, y: 10 + Math.random() * 70 })
    // Safe: this timeout fires long after the component body (and hitsRef's
    // declaration below) has finished running — no actual TDZ violation.
    // eslint-disable-next-line react-hooks/immutability
    timerRef.current = setTimeout(() => { setTarget(null); setTimeout(spawn, 250) }, 850)
    // `onFinish` (MinigameChallengeModal's handleFinish) is a plain inline
    // function, not memoized — adding it here would give `spawn` a new
    // identity on every parent render, which would cascade into the
    // useEffect below and restart the round's timer mid-game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hitsRef = useRef(0)
  // Standard "latest value in a ref" pattern so the stable `spawn` callback
  // (deps: []) can read the current hit count without becoming unstable.
  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { hitsRef.current = hits }, [hits])

  useEffect(() => { const t = setTimeout(spawn, 400); return () => { clearTimeout(t); clearTimeout(timerRef.current) } }, [spawn])

  const hit = () => {
    clearTimeout(timerRef.current)
    setHits(h => h + 1)
    setTarget(null)
    setTimeout(spawn, 200)
  }

  return (
    <div style={wrap}>
      <p style={hint}>🎵 Tocca i cerchi a tempo prima che spariscano! {shown}/{TOTAL} · 🎯 {hits}</p>
      <div style={{ position: 'relative', height: 220, borderRadius: 16, background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
        {target && (
          <button onClick={hit} style={{
            position: 'absolute', left: `${target.x}%`, top: `${target.y}%`,
            width: 46, height: 46, borderRadius: '50%', border: '3px solid #fff',
            background: 'radial-gradient(circle, #a78bfa, #7c3aed)', cursor: 'pointer',
            transform: 'translate(-50%,-50%)', animation: 'popIn 0.15s ease',
          }} />
        )}
      </div>
    </div>
  )
}

// ─── 6. Sequence Memory (Simon) — repeat the pattern ───────────────
const PADS = [
  { c: '#ef4444', on: '#fca5a5' },
  { c: '#22c55e', on: '#86efac' },
  { c: '#3b82f6', on: '#93c5fd' },
  { c: '#eab308', on: '#fde047' },
]
export function MemorySequenceGame({ onFinish }: MiniGameProps) {
  const LEN = 5
  const [seq] = useState(() => Array.from({ length: LEN }, () => Math.floor(Math.random() * 4)))
  const [phase, setPhase] = useState<'show' | 'input' | 'done'>('show')
  const [flash, setFlash] = useState<number | null>(null)
  const [step, setStep] = useState(0)        // input progress
  const [reached, setReached] = useState(0)

  useEffect(() => {
    if (phase !== 'show') return
    let i = 0
    const run = () => {
      if (i >= seq.length) { setFlash(null); setPhase('input'); return }
      setFlash(seq[i])
      setTimeout(() => {
        setFlash(null)
        i += 1
        setTimeout(run, 220)
      }, 480)
    }
    const t = setTimeout(run, 500)
    return () => clearTimeout(t)
  }, [phase, seq])

  const press = (i: number) => {
    if (phase !== 'input') return
    setFlash(i); setTimeout(() => setFlash(null), 180)
    if (i === seq[step]) {
      const ns = step + 1
      setStep(ns); setReached(ns)
      if (ns >= seq.length) { setPhase('done'); setTimeout(() => onFinish(1), 400) }
    } else {
      setPhase('done')
      setTimeout(() => onFinish(reached / seq.length), 400)
    }
  }

  return (
    <div style={wrap}>
      <p style={hint}>
        🧩 {phase === 'show' ? 'Memorizza la sequenza…' : phase === 'input' ? `Ripeti! ${step}/${seq.length}` : 'Fine'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {PADS.map((p, i) => (
          <button key={i} onClick={() => press(i)} disabled={phase !== 'input'} style={{
            height: 80, borderRadius: 14, border: 'none', cursor: phase === 'input' ? 'pointer' : 'default',
            background: flash === i ? p.on : p.c, transition: 'background 0.1s',
            boxShadow: flash === i ? `0 0 18px ${p.on}` : 'inset 0 -3px 6px rgba(0,0,0,0.25)',
          }} />
        ))}
      </div>
    </div>
  )
}
