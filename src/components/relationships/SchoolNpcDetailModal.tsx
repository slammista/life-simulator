// SchoolNpcDetailModal — BitLife-style bottom sheet for a classmate/professor.
// Mirrors PersonDetailModal but works with SchoolNPC instead of Relationship.

import { ensureNpcAttributesById, NPC_ATTR_META } from '../../services/NpcAttributes'
import type { SchoolNPC, SchoolAction, NPCPersonalityTrait } from '../../store/types'

const TRAIT_CONFIG: Record<NPCPersonalityTrait, { emoji: string; color: string }> = {
  introverso: { emoji: '🤫', color: '#94a3b8' },
  ambizioso:  { emoji: '🔥', color: '#f59e0b' },
  geloso:     { emoji: '💚', color: '#22c55e' },
  generoso:   { emoji: '🤝', color: '#f472b6' },
  sensibile:  { emoji: '💙', color: '#60a5fa' },
  sicuro:     { emoji: '😎', color: '#a78bfa' },
  avido:      { emoji: '💰', color: '#fbbf24' },
  leale:      { emoji: '🛡️', color: '#38bdf8' },
  empatico:   { emoji: '💫', color: '#ec4899' },
  impulsivo:  { emoji: '⚡', color: '#ef4444' },
}

const STATUS_CONFIG: Record<SchoolNPC['status'], { color: string; label: string }> = {
  neutral:  { color: '#94a3b8', label: 'Neutrale' },
  friendly: { color: '#22c55e', label: 'Amichevole' },
  tense:    { color: '#f59e0b', label: 'Teso' },
  hostile:  { color: '#ef4444', label: 'Ostile' },
}

const SCHOOL_ACTIONS: Array<{ action: SchoolAction; label: string; emoji: string; desc: string; bg: string; studentOnly?: boolean }> = [
  { action: 'talk',           label: 'Parla',          emoji: '💬', desc: 'Fai due chiacchiere con lui/lei',       bg: '#60a5fa' },
  { action: 'befriend',       label: 'Fai amicizia',   emoji: '🤝', desc: 'Cerca la sua amicizia',                 bg: '#10b981' },
  { action: 'study_together', label: 'Studia insieme', emoji: '📖', desc: 'Studiate insieme per i prossimi esami', bg: '#8b5cf6', studentOnly: true },
  { action: 'gossip',         label: 'Gossip',         emoji: '🗣️', desc: 'Spettegola insieme sui compagni',      bg: '#f472b6', studentOnly: true },
  { action: 'fight',          label: 'Litiga',         emoji: '😠', desc: 'Litigate in corridoio',                bg: '#ef4444' },
  { action: 'copy_homework',  label: 'Copia i compiti',emoji: '📋', desc: 'Copiate i compiti da lui/lei',         bg: '#f59e0b', studentOnly: true },
]

interface Props {
  npc: SchoolNPC
  onInteract: (npcId: string, action: SchoolAction) => void
}

export function SchoolNpcDetailModal({ npc, onInteract }: Props) {
  const attrs = ensureNpcAttributesById(npc.id, npc.age, npc.extendedAttributes)
  const statusCfg = STATUS_CONFIG[npc.status]
  const affectionColor = npc.affection >= 70 ? '#10b981' : npc.affection >= 40 ? '#f59e0b' : '#f43f5e'
  const isProf = npc.role === 'professor' || npc.role === 'coach'
  const roleLabel = npc.role === 'professor'
    ? (npc.subject ? `Prof. ${npc.subject}` : 'Professore')
    : npc.role === 'coach' ? '🏅 Allenatore'
    : '🎒 Studente'
  const availableActions = SCHOOL_ACTIONS.filter(a => !(a.studentOnly && isProf))

  return (
    <div style={{ padding: '14px 16px', paddingBottom: 'max(96px, env(safe-area-inset-bottom, 0px) + 80px)' }}>
        {/* Topbar */}
        <div style={topBar}>
          <div style={{ width: 36, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{npc.name}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: 0, marginTop: 1 }}>
              {roleLabel} · {npc.age} anni
            </p>
          </div>
          <div style={{ width: 36, flexShrink: 0 }} />
        </div>

        {/* Avatar + affection bar */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '12px 0 10px' }}>
          <div style={avatarCircle}>
            <span style={{ fontSize: 30 }}>{npc.emoji}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              <span>Affinità</span>
              <span style={{ fontWeight: 700, color: affectionColor }}>{npc.affection}/100</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${npc.affection}%`, background: affectionColor, borderRadius: 99, transition: 'width 0.4s' }} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 99,
              background: `${statusCfg.color}22`, color: statusCfg.color,
              display: 'inline-block', marginTop: 6,
            }}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Personality traits */}
        {npc.personalityTraits.length > 0 && (
          <>
            <p style={sectionHead}>Carattere</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {npc.personalityTraits.map(trait => {
                const tc = TRAIT_CONFIG[trait] ?? { emoji: '🔹', color: '#94a3b8' }
                return (
                  <span key={trait} style={{
                    fontSize: 11, padding: '3px 9px', borderRadius: 99,
                    background: `${tc.color}15`, color: tc.color,
                    border: `1px solid ${tc.color}30`,
                  }}>
                    {tc.emoji} {trait}
                  </span>
                )
              })}
            </div>
          </>
        )}

        {/* Attributes */}
        <p style={sectionHead}>Attributi</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {NPC_ATTR_META.map(({ key, label, emoji }) => {
            const val = (attrs as unknown as Record<string, number>)[key] ?? 0
            const attrColor = val >= 70 ? '#10b981' : val >= 40 ? '#60a5fa' : '#f59e0b'
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, width: 22, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 82, flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${val}%`, background: attrColor, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 26, textAlign: 'right', flexShrink: 0 }}>{val}</span>
              </div>
            )
          })}
        </div>

        {/* Friendship hint */}
        {!isProf && (
          npc.promotedToRelId ? (
            <p style={{ fontSize: 12, color: '#4ade80', marginBottom: 12 }}>
              ✅ {npc.name} è diventato/a tuo/a amico/a!
            </p>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
              Porta l'affinità a 65+ per guadagnarti la sua amicizia reale.
            </p>
          )
        )}

        {/* Actions — BitLife-style vertical list */}
        <p style={sectionHead}>Attività</p>
        <div style={{ marginLeft: -16, marginRight: -16 }}>
          {availableActions.map(({ action, label, emoji, desc, bg }) => (
            <div
              key={action}
              onClick={() => onInteract(npc.id, action)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, background: bg,
              }}>
                {emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: action === 'fight' ? '#fca5a5' : 'var(--color-text)' }}>
                  {label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, marginTop: 1 }}>{desc}</p>
              </div>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)', flexShrink: 0, letterSpacing: 1 }}>···</span>
            </div>
          ))}
        </div>
    </div>
  )
}

const topBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: 'linear-gradient(180deg, #1e5fb4 0%, #16498c 100%)',
  color: '#fff', borderRadius: 12, padding: '8px 10px', marginBottom: 8,
}
const avatarCircle: React.CSSProperties = {
  width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(167,139,250,0.3)',
}
const sectionHead: React.CSSProperties = {
  fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase',
  letterSpacing: 1, padding: '10px 0 6px', fontWeight: 700, margin: 0,
}
