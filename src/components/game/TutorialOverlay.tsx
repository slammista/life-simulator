import { useState, useEffect } from 'react'

const STORAGE_KEY = 'lifesim2d_tutorial_seen'

interface Step {
  emoji: string
  title: string
  body: string
  tip?: string
  highlight?: string
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
    body: 'Il grande pulsante centrale in basso avanza la tua vita di un anno. Ogni anno porta eventi, scelte e conseguenze delle decisioni passate.',
    tip: '💡 Tieni d\'occhio la barra in alto — salute, felicità ed energia cambiano ogni anno.',
    highlight: 'Trova il pulsante "+1 ETÀ" in basso e cliccaci!',
  },
  {
    emoji: '🎭',
    title: 'Gli eventi cambiano tutto',
    body: 'Quando appare un evento con scelte (pulsanti blu), leggi bene prima di scegliere. Ogni opzione ha effetti diversi sulla tua vita. I badge colorati indicano la categoria.',
    tip: '💡 Giallo = Carriera · Verde = Salute · Rosa = Amore · Blu = Istruzione',
  },
  {
    emoji: '🗂️',
    title: 'Esplora le 5 schede',
    body: 'In basso trovi le schede: Vita (eventi), Lavoro, Assets, Persone, Attività. Da Attività puoi fare sport, hobby, viaggi, crimini e molto altro.',
    tip: '💡 Puoi pinnare le attività preferite toccando "Modifica" nella sezione Preferiti.',
  },
]

export function TutorialOverlay() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
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
  const isLast = step === STEPS.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.8)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--color-surface, #1e1e2e)',
        borderRadius: 20, padding: '28px 24px', maxWidth: 360, width: '100%',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        animation: 'fadeInUp 0.25s ease',
      }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 22 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 6, height: 6, borderRadius: 3,
              background: i < step
                ? 'var(--color-cta, #6366f1)'
                : i === step
                  ? 'var(--color-cta, #6366f1)'
                  : 'rgba(255,255,255,0.18)',
              opacity: i < step ? 0.5 : 1,
              transition: 'background 0.25s ease, opacity 0.25s ease',
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>{current.emoji}</div>
          <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--color-text)', lineHeight: 1.35 }}>
            {current.title}
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', lineHeight: 1.65, marginBottom: current.highlight ? 12 : 0 }}>
            {current.body}
          </p>
          {current.highlight && (
            <div style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: 10, padding: '9px 14px', marginTop: 10,
              fontSize: 13, fontWeight: 600, color: '#a5b4fc',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>👇</span>
              <span>{current.highlight}</span>
            </div>
          )}
        </div>

        {/* Tip box */}
        {current.tip && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '8px 12px',
            fontSize: 11.5, color: 'var(--color-text-secondary)',
            lineHeight: 1.5, marginBottom: 18,
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
