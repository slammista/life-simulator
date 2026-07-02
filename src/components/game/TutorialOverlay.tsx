import { useState, useEffect } from 'react'
import { STORAGE_KEY as COOKIE_CONSENT_KEY } from '../common/CookieConsent'

const STORAGE_KEY = 'lifesim2d_tutorial_seen'

interface Step {
  emoji: string
  title: string
  body: string
  tip?: string
  // CSS selector for the real UI element this step spotlights. Omitted on the intro
  // step, which has nothing to point at yet.
  target?: string
}

const STEPS: Step[] = [
  {
    emoji: '👋',
    title: 'Benvenuto in Life Simulator 2D!',
    body: 'Simula un\'intera vita dall\'infanzia alla vecchiaia. Ogni scelta ha conseguenze reali — non ci sono risposte giuste o sbagliate.',
    tip: '💡 La tua vita comincia all\'età di 0 anni. Tutto quello che fai conta.',
  },
  {
    emoji: '⏩',
    title: 'Premi "+1 ETÀ" per iniziare',
    body: 'Questo pulsante avanza la tua vita di un anno. Ogni anno porta eventi, scelte e conseguenze delle decisioni passate.',
    tip: '💡 Tieni d\'occhio la barra in alto — salute, felicità ed energia cambiano ogni anno.',
    target: '[data-coachmark="age-button"]',
  },
  {
    emoji: '🎭',
    title: 'Gli eventi cambiano tutto',
    body: 'Qui appariranno gli eventi della tua vita. Quando ne arriva uno con scelte (pulsanti blu), leggi bene prima di decidere — ogni opzione ha effetti diversi.',
    tip: '💡 Giallo = Carriera · Verde = Salute · Rosa = Amore · Blu = Istruzione',
    target: '[data-coachmark="event-card"]',
  },
  {
    emoji: '🗂️',
    title: 'Esplora le 5 schede',
    body: 'Qui trovi le schede: Vita (eventi), Lavoro, Assets, Persone, Attività. Da Attività puoi fare sport, hobby, viaggi, crimini e molto altro.',
    tip: '💡 Puoi pinnare le attività preferite toccando "Modifica" nella sezione Preferiti.',
    target: '.bottom-tabs',
  },
]

export function TutorialOverlay() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  // Both this overlay and the cookie banner render at the same z-index near the
  // bottom of the screen — showing them at the same time lets the (later-mounted,
  // so visually on top) cookie banner swallow clicks meant for the tutorial. Wait
  // for consent to be resolved before starting the tutorial's own countdown.
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | undefined
    const tryShow = () => {
      if (cancelled) return
      if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
        pollTimer = setTimeout(tryShow, 400)
        return
      }
      setVisible(true)
    }
    const initialTimer = setTimeout(tryShow, 800)
    return () => { cancelled = true; clearTimeout(initialTimer); clearTimeout(pollTimer) }
  }, [])

  // Real coachmark: measure the actual target element's position on the live page
  // whenever the step changes, instead of describing it in text. Steps without a
  // `target` (the intro) fall back to a plain centered modal.
  useEffect(() => {
    if (!visible) return
    const target = STEPS[step].target
    // Reading a live DOM rect (getBoundingClientRect) is exactly the "synchronize
    // with an external system" case the rule's own docs carve out — there's no way
    // to derive it at render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!target) { setRect(null); return }
    const measure = () => {
      const el = document.querySelector(target)
      setRect(el ? el.getBoundingClientRect() : null)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [visible, step])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const PAD = 10
  // Anchor the callout on whichever side of the target has more room — comparing
  // against the viewport midpoint isn't enough on its own since a tall target (like
  // the idle event card) can have more room above it than below even while sitting
  // in the upper half of the screen.
  const calloutBelow = rect ? (window.innerHeight - rect.bottom) > rect.top : false

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* Spotlight cutout around the live target, or a plain backdrop on the intro step */}
      {rect ? (
        <div style={{
          position: 'fixed',
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: 18,
          boxShadow: '0 0 0 9999px rgba(6,7,15,0.82)',
          border: '2px solid rgba(124,92,255,0.6)',
          pointerEvents: 'none',
          transition: 'top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease',
        }} />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,7,15,0.85)' }} />
      )}

      {/* Callout card — positioned near the spotlighted element, or centered on the intro step */}
      <div style={{
        position: 'fixed',
        left: '50%',
        ...(rect
          ? calloutBelow
            ? { top: rect.bottom + PAD + 14, transform: 'translateX(-50%)' }
            : { bottom: window.innerHeight - rect.top + PAD + 14, transform: 'translateX(-50%)' }
          : { top: '50%', transform: 'translate(-50%, -50%)' }),
        width: 'calc(100% - 48px)', maxWidth: 360,
        maxHeight: 'calc(100vh - 24px)', overflowY: 'auto',
        background: 'var(--color-surface, #1e1e2e)',
        borderRadius: 20, padding: '22px 22px 20px',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        animation: 'fadeInUp 0.25s ease',
      }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 6, height: 6, borderRadius: 3,
              background: i <= step ? 'var(--color-cta, #6366f1)' : 'rgba(255,255,255,0.18)',
              opacity: i < step ? 0.5 : 1,
              transition: 'background 0.25s ease, opacity 0.25s ease',
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 44, marginBottom: 10, lineHeight: 1 }}>{current.emoji}</div>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--color-text)', lineHeight: 1.35 }}>
            {current.title}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            {current.body}
          </p>
        </div>

        {/* Tip box */}
        {current.tip && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '8px 12px',
            fontSize: 11.5, color: 'var(--color-text-secondary)',
            lineHeight: 1.5, marginBottom: 16,
            borderLeft: '2px solid rgba(99,102,241,0.4)',
          }}>
            {current.tip}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={dismiss}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13,
              border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-secondary)',
            }}
          >
            Salta
          </button>
          <button
            onClick={next}
            style={{
              flex: 2, padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: isLast
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'var(--color-cta, #6366f1)',
              color: '#fff',
              boxShadow: isLast ? '0 4px 16px rgba(16,185,129,0.35)' : '0 4px 16px rgba(99,102,241,0.3)',
            }}
          >
            {isLast ? '🎮 Inizia la vita!' : 'Avanti →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 10.5, color: 'rgba(255,255,255,0.25)', marginTop: 12 }}>
          {step + 1} / {STEPS.length}
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
