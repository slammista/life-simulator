import { useToastStore } from '../../store/toastStore'

// Centered modal alert with an explicit OK button. Used for important
// success/error feedback that the player must acknowledge (replaces the
// easy-to-miss bottom toasts for action results).
export function CenterAlert() {
  const alert = useToastStore(s => s.alert)
  const closeAlert = useToastStore(s => s.closeAlert)

  if (!alert) return null

  const accent = alert.ok ? '#18D39E' : '#FF4D6D'
  const emoji = alert.emoji ?? (alert.ok ? '✅' : '⚠️')

  return (
    <div
      onClick={closeAlert}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        background: 'rgba(6,4,18,0.6)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 340,
          background: 'var(--panel-surface, linear-gradient(160deg, #2A2150 0%, #1B1733 100%))',
          border: `1px solid ${accent}55`,
          borderRadius: 20,
          padding: '26px 22px 20px',
          textAlign: 'center',
          boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
          animation: 'popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div style={{
          fontSize: 44, marginBottom: 12,
          filter: `drop-shadow(0 0 12px ${accent}66)`,
        }}>
          {emoji}
        </div>
        <p style={{
          fontSize: 15, fontWeight: 600, color: '#fff',
          lineHeight: 1.5, margin: '0 0 20px',
        }}>
          {alert.text}
        </p>
        <button
          onClick={closeAlert}
          className="btn-candy"
          style={{
            width: '100%', fontSize: 15, padding: '12px 0', fontWeight: 700,
            background: alert.ok
              ? 'linear-gradient(135deg, #14b88a, #18D39E)'
              : 'linear-gradient(135deg, #e0405f, #FF4D6D)',
          }}
        >
          OK
        </button>
      </div>
    </div>
  )
}
