import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getBarberServices } from '../../services/AvatarEngine'
import { AvatarRenderer } from '../avatar/AvatarRenderer'

export function BarberScreen() {
  const money    = useGameStore(s => s.finance.money)
  const age      = useGameStore(s => s.time.age)
  const visitBarber = useGameStore(s => s.visitBarber)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const services = getBarberServices()

  const handleService = (serviceId: string) => {
    const r = visitBarber(serviceId)
    setFeedback({ msg: r.message, ok: r.success })
    setTimeout(() => setFeedback(null), 3500)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>💈 Barbiere / Salone</h2>

      {/* Avatar preview */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{
          padding: 12, borderRadius: 16,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <AvatarRenderer size="lg" />
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Il tuo look attuale</span>
        </div>
      </div>

      {feedback && (
        <div style={{
          borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 500,
          background: feedback.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: feedback.ok ? '#86efac' : '#fca5a5',
          border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {feedback.msg}
        </div>
      )}

      {age < 6 ? (
        <div className="card card-locked" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✂️</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            Troppo piccolo/a!
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Puoi andare dal barbiere dopo i 6 anni.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {services.map(svc => {
            const canAfford = money >= svc.cost
            return (
              <div key={svc.id} className="card" style={{ padding: 12, opacity: canAfford ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{svc.emoji} {svc.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{svc.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: canAfford ? '#4ade80' : '#ef4444' }}>€{svc.cost}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>+{svc.looksBonus} 😍</p>
                  </div>
                </div>
                <button
                  className="tap-scale"
                  onClick={() => handleService(svc.id)}
                  disabled={!canAfford}
                  style={{
                    width: '100%', padding: '8px 0', borderRadius: 10,
                    background: canAfford ? 'rgba(124,92,255,0.18)' : 'rgba(255,255,255,0.05)',
                    color: canAfford ? '#a78bfa' : 'var(--color-text-secondary)',
                    border: `1px solid ${canAfford ? 'rgba(124,92,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    fontSize: 13, fontWeight: 500, cursor: canAfford ? 'pointer' : 'not-allowed',
                  }}
                >
                  {canAfford ? `Prenota (€${svc.cost})` : `Servono €${svc.cost}`}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
