import { useGameStore } from '../../store/gameStore'

const EVENT_ICONS: Record<string, string> = {
  married:            '💍',
  child_born:         '👶',
  moved_away:         '📦',
  career_change:      '💼',
  reconciled:         '🤝',
  relationship_broke: '💔',
  death:              '🕯️',
}

const EVENT_COLORS: Record<string, string> = {
  married:            '#f472b6',
  child_born:         '#fb923c',
  moved_away:         '#60a5fa',
  career_change:      '#f59e0b',
  reconciled:         '#10b981',
  relationship_broke: '#f87171',
  death:              '#a78bfa',
}

export function NPCEventNotifications() {
  const npcEventQueue = useGameStore(s => s.npcEventQueue ?? [])
  const dismissNpcEvent = useGameStore(s => s.dismissNpcEvent)

  if (npcEventQueue.length === 0) return null

  // Show only the first (most recent) event as a card
  const ev = npcEventQueue[0]
  const icon = EVENT_ICONS[ev.type] ?? '👤'
  const color = EVENT_COLORS[ev.type] ?? '#6366f1'

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        left: '50%', transform: 'translateX(-50%)',
        width: '92%', maxWidth: 380,
        zIndex: 8400,
        animation: 'slideDownNotif 0.3s cubic-bezier(0.34,1.2,0.64,1)',
      }}
    >
      <div style={{
        background: 'var(--color-surface, #1e1e2e)',
        borderRadius: 14,
        border: `1px solid ${color}33`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
        overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{ height: 3, background: color }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px',
        }}>
          {/* Icon */}
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {icon}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 11, fontWeight: 700,
              color: color, marginBottom: 2,
            }}>
              {ev.npcName} — vita privata
            </p>
            <p style={{
              fontSize: 12.5, color: 'var(--color-text)',
              lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {ev.description}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => dismissNpcEvent(ev.id)}
            style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Queue count */}
        {npcEventQueue.length > 1 && (
          <div style={{
            padding: '4px 14px 8px',
            fontSize: 10.5, color: 'var(--color-text-secondary)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              background: color, color: '#fff', borderRadius: '50%',
              width: 16, height: 16, fontSize: 9, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {npcEventQueue.length - 1}
            </span>
            altri eventi in attesa
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDownNotif {
          0%   { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  )
}
