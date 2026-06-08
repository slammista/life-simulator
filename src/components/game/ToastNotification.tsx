import { useToastStore } from '../../store/toastStore'

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 8,
      zIndex: 9000,
      alignItems: 'center',
      pointerEvents: 'none',
      width: '92%',
      maxWidth: 360,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          style={{
            pointerEvents: 'auto',
            padding: '11px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: t.ok
              ? 'rgba(24,211,158,0.13)'
              : 'rgba(255,77,109,0.13)',
            border: `1px solid ${t.ok ? 'rgba(24,211,158,0.32)' : 'rgba(255,77,109,0.32)'}`,
            color: t.ok ? '#6ee7b7' : '#fca5a5',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
            animation: 'slideUp 0.2s ease-out',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <span style={{ fontSize: 19, flexShrink: 0 }}>{t.emoji}</span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.text}</span>
          <span style={{ fontSize: 16, opacity: 0.4, flexShrink: 0 }}>×</span>
        </div>
      ))}
    </div>
  )
}
