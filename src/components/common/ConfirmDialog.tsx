import { feedback } from '../../services/FeedbackEngine'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Purple game-UI kit confirm dialog (img-1/img-2 style):
 * a glossy panel with two large circular ✓ / ✗ buttons.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeInUp 0.18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{
          width: '100%', maxWidth: 320, textAlign: 'center',
          padding: '22px 20px',
        }}
      >
        {title && (
          <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>
            {title}
          </p>
        )}
        <p style={{ margin: '0 0 20px', fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <button
              className="icon-btn icon-btn--danger"
              style={{ width: 52, height: 52, fontSize: 22 }}
              onClick={() => { feedback('tap'); onCancel() }}
              aria-label={cancelLabel}
            >
              ✗
            </button>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{cancelLabel}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <button
              className={`icon-btn ${danger ? 'icon-btn--danger' : 'icon-btn--positive'}`}
              style={{ width: 52, height: 52, fontSize: 22 }}
              onClick={() => { feedback('tap'); onConfirm() }}
              aria-label={confirmLabel}
            >
              ✓
            </button>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{confirmLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
