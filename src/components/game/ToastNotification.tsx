import { useToastStore } from '../../store/toastStore'

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999,
      alignItems: 'center', pointerEvents: 'none', width: '90%', maxWidth: 360,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          style={{
            pointerEvents: 'auto',
            padding: '10px 16px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(12px)',
            background: t.ok
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${t.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
            color: t.ok ? '#6ee7b7' : '#fca5a5',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.2s ease-out',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{t.emoji}</span>
          <span style={{ flex: 1 }}>{t.text}</span>
        </div>
      ))}
    </div>
  )
}
