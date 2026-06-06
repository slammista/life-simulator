import { useState } from 'react'

interface AgeGateProps {
  onConfirm: () => void
}

export function AgeGate({ onConfirm }: AgeGateProps) {
  const [declining, setDeclining] = useState(false)

  const handleConfirm = () => {
    localStorage.setItem('age_confirmed', 'true')
    onConfirm()
  }

  if (declining) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0f0f1a', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: 15 }}>
          Devi avere 18 anni per accedere a Life Simulator 2D.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0f0f1a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🌍</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>
          Life Simulator 2D
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28, lineHeight: 1.6 }}>
          Questo gioco contiene contenuti per adulti: violenza, temi maturi, linguaggio esplicito,
          rappresentazione di droghe e sessualità.<br /><br />
          <strong style={{ color: '#e2e8f0' }}>Classificazione: PEGI 18+</strong>
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 20,
          border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔞</div>
          <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.5 }}>
            Confermando dichiari di avere almeno <strong>18 anni</strong> e di accettare i termini di utilizzo.
          </p>
        </div>

        <button
          onClick={handleConfirm}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12, fontSize: 15,
            fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 10,
            background: 'linear-gradient(135deg, #e94560, #c0392b)',
            color: '#fff',
          }}
        >
          ✅ Ho 18 anni, entra nel gioco
        </button>

        <button
          onClick={() => setDeclining(true)}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 12, fontSize: 13,
            border: 'none', cursor: 'pointer', background: 'transparent',
            color: '#64748b',
          }}
        >
          Non ho 18 anni
        </button>
      </div>
    </div>
  )
}
