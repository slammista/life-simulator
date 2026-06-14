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

const SCHOOL_ACTIONS: Array<{ action: SchoolAction; label: string; emoji: string; studentOnly?: boolean }> = [
  { action: 'talk',           label: 'Parla',    emoji: '💬' },
  { action: 'befriend',       label: 'Amicizia', emoji: '🤝' },
  { action: 'study_together', label: 'Studia',   emoji: '📖', studentOnly: true },
  { action: 'gossip',         label: 'Gossip',   emoji: '🗣️', studentOnly: true },
  { action: 'fight',          label: 'Litigate', emoji: '😠' },
  { action: 'copy_homework',  label: 'Copia',    emoji: '📋', studentOnly: true },
]

interface Props {
  npc: SchoolNPC
  onClose: () => void
  onInteract: (npcId: string, action: SchoolAction) => void
}

export function SchoolNpcDetailModal({ npc, onClose, onInteract }: Props) {
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
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        {/* Topbar */}
        <div style={topBar}>
          <button onClick={onClose} style={backBtn} aria-label="Chiudi">‹</button>
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

        {/* Actions */}
        <p style={sectionHead}>Azioni</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {availableActions.map(({ action, label, emoji }) => (
            <button
              key={action}
              onClick={() => onInteract(npc.id, action)}
              style={{
                padding: '10px 4px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: action === 'fight' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.07)',
                color: action === 'fight' ? '#fca5a5' : 'var(--color-text)',
                border: `1px solid ${action === 'fight' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.09)'}`,
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</div>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1100,
  background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
}
const sheet: React.CSSProperties = {
  width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
  background: 'linear-gradient(160deg, #2A2150 0%, #1B1733 100%)',
  borderRadius: '20px 20px 0 0',
  padding: '14px 16px',
  paddingBottom: 'max(36px, env(safe-area-inset-bottom, 0px))',
  boxShadow: '0 -8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.16)',
  border: '1px solid rgba(167,139,250,0.3)',
}
const topBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: 'linear-gradient(180deg, #1e5fb4 0%, #16498c 100%)',
  color: '#fff', borderRadius: 12, padding: '8px 10px', marginBottom: 8,
}
const backBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%', border: 'none',
  background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 22, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  lineHeight: 1, paddingBottom: 2,
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
