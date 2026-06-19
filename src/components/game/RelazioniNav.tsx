export type RelazioniSubTabId = 'relationships' | 'dating' | 'famiglia' | 'pets'

interface ItemDef {
  id: RelazioniSubTabId
  emoji: string
  label: string
  subtitle: string
  color: string
}

const ITEMS: ItemDef[] = [
  { id: 'relationships', emoji: '👥', label: 'Relazioni',  subtitle: 'Amici, nemici e conoscenti',         color: '#6366f1' },
  { id: 'dating',        emoji: '💘', label: 'Amore',      subtitle: 'Appuntamenti e partner romantici',   color: '#ec4899' },
  { id: 'famiglia',      emoji: '👨‍👩‍👧', label: 'Famiglia',  subtitle: 'Figli e genitorialità',              color: '#f59e0b' },
  { id: 'pets',          emoji: '🐾', label: 'Animali',    subtitle: 'I tuoi animali domestici',           color: '#10b981' },
]

export { ITEMS as RELAZIONI_ITEMS }

interface Props {
  onChange: (sub: RelazioniSubTabId) => void
}

export function RelazioniNav({ onChange }: Props) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
      {ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className="tap-scale"
          style={{
            width: '100%', padding: '11px 16px',
            display: 'flex', alignItems: 'center', gap: 13,
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${item.color}1e`, border: `1px solid ${item.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
          }}>
            {item.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 1, lineHeight: 1.25 }}>
              {item.label}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
              {item.subtitle}
            </p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 18, flexShrink: 0, lineHeight: 1 }}>›</span>
        </button>
      ))}
    </div>
  )
}
