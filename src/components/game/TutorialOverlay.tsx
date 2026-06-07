import { useState, useEffect } from 'react'

const STORAGE_KEY = 'lifesim2d_tutorial_seen'

interface Step {
  emoji: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    emoji: '👋',
    title: 'Benvenuto in Life Simulator 2D!',
    body: 'Simula un\'intera vita dall\'infanzia alla vecchiaia. Ogni scelta ha conseguenze reali — non ci sono risposte giuste.',
  },
  {
    emoji: '📊',
    title: 'La tua HUD',
    body: 'In alto trovi le tue stat vitali: Salute, Felicità, Energia, Intelligenza e altro. Tienile alte per vivere bene.',
  },
  {
    emoji: '⏩',
    title: 'Il tasto Invecchia',
    body: 'Premi "Invecchia" per far avanzare di un anno. Ogni anno porta eventi, opportunità e conseguenze delle tue scelte precedenti.',
  },
  {
    emoji: '🗂️',
    title: 'Le schede',
    body: 'Usa le 5 schede in basso: Vita (eventi), Sviluppo (carriera/finanze), Persone (relazioni), Benessere (salute/hobby), Profilo (goals/sfide).',
  },
  {
    emoji: '🎯',
    title: 'Obiettivi & Ribbons',
    body: 'Completa Goals e Sfide per sbloccare Ribbons speciali. Guarda la tua storia nella Timeline causale. Buona vita!',
  },
]

export function TutorialOverlay() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so the game renders first
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

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

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--color-surface, #1e1e2e)',
        borderRadius: 20, padding: 28, maxWidth: 360, width: '100%',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        animation: 'fadeInUp 0.25s ease',
      }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? 'var(--color-cta, #6366f1)' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.25s ease',
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{current.emoji}</div>
          <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--color-text)' }}>
            {current.title}
          </p>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            {current.body}
          </p>
        </div>

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
              background: 'var(--color-cta, #6366f1)', color: '#fff',
            }}
          >
            {step < STEPS.length - 1 ? 'Avanti →' : 'Inizia la vita! 🎮'}
          </button>
        </div>

        {/* Step counter */}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 12 }}>
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
