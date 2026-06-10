import { useState } from 'react'

interface Props {
  sectionKey: string
  message: string
  emoji: string
  color?: string
}

export function ContextualHint({ sectionKey, message, emoji, color = '#6366f1' }: Props) {
  const storageKey = `lifesim_hint_${sectionKey}`
  const [visible, setVisible] = useState(() => !localStorage.getItem(storageKey))

  if (!visible) return null

  return (
    <div style={{
      background: `${color}14`,
      border: `1px solid ${color}33`,
      borderRadius: 10,
      padding: '8px 10px 8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', flex: 1, margin: 0, lineHeight: 1.4 }}>
        {message}
      </p>
      <button
        onClick={() => {
          localStorage.setItem(storageKey, '1')
          setVisible(false)
        }}
        style={{
          fontSize: 18, lineHeight: 1, background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--color-text-secondary)',
          padding: '0 2px', flexShrink: 0,
        }}
        aria-label="Chiudi suggerimento"
      >
        ×
      </button>
    </div>
  )
}
