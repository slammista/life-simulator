export type CarreraSubTab = 'career' | 'education' | 'military' | 'pension' | 'business'

interface ItemDef {
  id: CarreraSubTab
  emoji: string
  label: string
  subtitle: string
  color: string
}

const ITEMS: ItemDef[] = [
  { id: 'career',    emoji: '💼', label: 'Carriera',   subtitle: 'Lavoro, promozioni e colleghi',      color: '#f59e0b' },
  { id: 'education', emoji: '📚', label: 'Istruzione', subtitle: 'Scuola, università e club',           color: '#3b82f6' },
  { id: 'military',  emoji: '🪖', label: 'Militare',   subtitle: 'Servizio militare e leva',            color: '#6b7280' },
  { id: 'pension',   emoji: '🎗️', label: 'Pensione',   subtitle: 'Pensione anticipata o ordinaria',     color: '#10b981' },
  { id: 'business',  emoji: '🚀', label: 'La tua Azienda', subtitle: 'Fonda e gestisci la tua società',   color: '#8b5cf6' },
]

export { ITEMS as CARRERA_ITEMS }

interface Props {
  onChange: (sub: CarreraSubTab) => void
}

export function CarreraNav({ onChange }: Props) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
      <div style={{ padding: '9px 16px 7px', background: 'rgba(0,0,0,0.18)', borderBottom: '1px solid rgba(255,255,255,0.045)' }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
          Carriera & Formazione
        </span>
      </div>
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
