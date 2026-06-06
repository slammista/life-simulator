import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { NPCMood, NPCPersonalityTrait, Relationship } from '../../store/types'
import type { NPCContext, NPCAction } from '../../services/RelationshipEngine'

const STAGE_EMOJI: Record<string, string> = {
  stranger: '👤',
  acquaintance: '👋',
  friend: '😊',
  close_friend: '🤝',
  partner: '💑',
  spouse: '💍',
}

const CONTEXT_LABELS: Record<NPCContext, string> = {
  school: '🏫 Scuola',
  work: '💼 Lavoro',
  neighborhood: '🏘️ Quartiere',
  dating_app: '📱 App dating',
  bar: '🍺 Bar',
  travel: '✈️ Viaggio',
  family: '👪 Famiglia',
  random: '🎲 Caso',
}

const MOOD_LABELS: Record<NPCMood, { label: string; emoji: string; color: string }> = {
  neutrale: { label: 'Neutrale', emoji: '😐', color: '#94a3b8' },
  felice: { label: 'Felice', emoji: '😊', color: '#86efac' },
  triste: { label: 'Triste', emoji: '😢', color: '#93c5fd' },
  geloso: { label: 'Geloso', emoji: '😒', color: '#fbbf24' },
  arrabbiato: { label: 'Arrabbiato', emoji: '😠', color: '#fca5a5' },
  nostalgico: { label: 'Nostalgico', emoji: '🥲', color: '#c4b5fd' },
  ansioso: { label: 'Ansioso', emoji: '😰', color: '#fdba74' },
  motivato: { label: 'Motivato', emoji: '🔥', color: '#facc15' },
}

const TRAIT_LABELS: Record<NPCPersonalityTrait, string> = {
  introverso: 'Introverso',
  ambizioso: 'Ambizioso',
  geloso: 'Geloso',
  generoso: 'Generoso',
  sensibile: 'Sensibile',
  sicuro: 'Sicuro',
  avido: 'Avido',
  leale: 'Leale',
  empatico: 'Empatico',
  impulsivo: 'Impulsivo',
}

const REL_TYPE_LABELS: Record<string, string> = {
  parent: 'Genitore',
  sibling: 'Fratello/Sorella',
  partner: 'Partner',
  spouse: 'Coniuge',
  ex_partner: 'Ex partner',
  child: 'Figlio/a',
  friend: 'Amico/a',
  best_friend: 'Migliore amico/a',
  colleague: 'Collega',
  rival: 'Rivale',
  enemy: 'Nemico',
  acquaintance: 'Conoscente',
}

const ACTIONS_BY_STAGE: Record<string, Array<{ action: NPCAction; label: string; emoji: string }>> = {
  stranger: [
    { action: 'greet', label: 'Saluta', emoji: '👋' },
  ],
  acquaintance: [
    { action: 'greet', label: 'Saluta', emoji: '👋' },
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'compliment', label: 'Complimento', emoji: '😊' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'confess_feelings', label: 'Confessa', emoji: '💕' },
  ],
  friend: [
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'compliment', label: 'Complimento', emoji: '😊' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'ask_date', label: 'Appuntamento', emoji: '💑' },
    { action: 'confess_feelings', label: 'Confessa', emoji: '💕' },
    { action: 'fight', label: 'Litigate', emoji: '😠' },
  ],
  close_friend: [
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'ask_date', label: 'Appuntamento', emoji: '💑' },
    { action: 'kiss', label: 'Bacio', emoji: '😘' },
    { action: 'confess_feelings', label: 'Confessa', emoji: '💕' },
    { action: 'fight', label: 'Litigate', emoji: '😠' },
    { action: 'apologize', label: 'Chiedi scusa', emoji: '🙏' },
  ],
  partner: [
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'kiss', label: 'Bacio', emoji: '😘' },
    { action: 'propose', label: 'Proposta', emoji: '💍' },
    { action: 'cheat', label: 'Tradisci', emoji: '😈' },
    { action: 'fight', label: 'Litigate', emoji: '😠' },
    { action: 'apologize', label: 'Chiedi scusa', emoji: '🙏' },
    { action: 'break_up', label: 'Lascia', emoji: '💔' },
  ],
  spouse: [
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'kiss', label: 'Bacio', emoji: '😘' },
    { action: 'cheat', label: 'Tradisci', emoji: '😈' },
    { action: 'fight', label: 'Litigate', emoji: '😠' },
    { action: 'apologize', label: 'Chiedi scusa', emoji: '🙏' },
    { action: 'divorce', label: 'Divorzia', emoji: '📜' },
  ],
}

export function RelationshipScreen() {
  const relationships = useGameStore(s => s.relationships)
  const family = useGameStore(s => s.family)
  const meetNewPerson = useGameStore(s => s.meetNewPerson)
  const interactWithNPC = useGameStore(s => s.interactWithNPC)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showContextPicker, setShowContextPicker] = useState(false)

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  const handleMeet = (ctx: NPCContext) => {
    setShowContextPicker(false)
    const r = meetNewPerson(ctx)
    flash(r.message, r.success)
  }

  const handleAction = (relId: string, action: NPCAction) => {
    const r = interactWithNPC(relId, action)
    flash(r.message, r.success)
  }

  const toggleExpand = (id: string) => setExpanded(prev => prev === id ? null : id)

  const groupedRels: Record<string, Relationship[]> = {
    Famiglia: relationships.filter(r => ['parent', 'sibling', 'child'].includes(r.type)),
    Romantiche: relationships.filter(r => ['partner', 'spouse', 'ex_partner'].includes(r.type)),
    Amici: relationships.filter(r => ['friend', 'best_friend', 'colleague', 'acquaintance'].includes(r.type)),
    Altro: relationships.filter(r => ['rival', 'enemy'].includes(r.type)),
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>❤️ Relazioni</h2>
        <button
          onClick={() => setShowContextPicker(true)}
          style={{ padding: '6px 14px', borderRadius: 12, background: 'var(--color-cta)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          + Incontra
        </button>
      </div>

      {family.members.length > 0 && (
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Albero familiare
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginTop: 2 }}>
                Casata {family.dynastyName}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: '#cbd5e1', padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                👪 {family.members.length}
              </span>
              <span style={{ fontSize: 12, color: '#cbd5e1', padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                ⭐ {family.familyReputation}
              </span>
            </div>
          </div>
          {family.inheritedFlags.length > 0 && (
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
              Origine: {family.familyWealthTier.replace('_', ' ')}
            </p>
          )}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div style={{
          borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 500,
          background: feedback.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: feedback.ok ? '#86efac' : '#fca5a5',
          border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Context picker modal */}
      {showContextPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowContextPicker(false)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 430 }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Dove vuoi incontrare qualcuno?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.entries(CONTEXT_LABELS) as [NPCContext, string][]).map(([ctx, label]) => (
                <button
                  key={ctx}
                  onClick={() => handleMeet(ctx)}
                  style={{ padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowContextPicker(false)}
              style={{ width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', fontSize: 14, border: 'none', cursor: 'pointer' }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {relationships.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>👤</p>
          <p style={{ fontSize: 14, color: 'var(--color-text)' }}>Nessuna relazione ancora.</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
            Premi "+ Incontra" per conoscere qualcuno o invecchia per eventi sociali automatici.
          </p>
        </div>
      )}

      {/* Groups */}
      {Object.entries(groupedRels).map(([groupName, rels]) => {
        if (rels.length === 0) return null
        return (
          <div key={groupName} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {groupName}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rels.map(rel => (
                <RelCard
                  key={rel.id}
                  rel={rel}
                  expanded={expanded === rel.id}
                  onToggle={() => toggleExpand(rel.id)}
                  onAction={(action) => handleAction(rel.id, action)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- RelCard subcomponent ----

function RelCard({ rel, expanded, onToggle, onAction }: {
  rel: Relationship
  expanded: boolean
  onToggle: () => void
  onAction: (action: NPCAction) => void
}) {
  const actions = ACTIONS_BY_STAGE[rel.stage] ?? ACTIONS_BY_STAGE.stranger
  const mood = MOOD_LABELS[rel.mood ?? 'neutrale']
  const traits = rel.personalityTraits ?? []

  return (
    <div className="card" style={{ padding: 12 }}>
      {/* Header row */}
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={onToggle}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 26 }}>{rel.emoji}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{rel.name}</p>
              {rel.toxicityTag && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>⚠️ tossica</span>}
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{REL_TYPE_LABELS[rel.type] ?? rel.type} · {rel.age}y</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            title={`Umore: ${mood.label}`}
            style={{
              fontSize: 11,
              color: mood.color,
              padding: '2px 7px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              whiteSpace: 'nowrap',
            }}
          >
            {mood.emoji} {mood.label}
          </span>
          <span style={{ fontSize: 18 }}>{STAGE_EMOJI[rel.stage] ?? '👤'}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          {traits.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {traits.map(trait => (
                <span
                  key={trait}
                  style={{
                    fontSize: 11,
                    color: '#cbd5e1',
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {TRAIT_LABELS[trait]}
                </span>
              ))}
            </div>
          )}

          {/* Stat bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            {[
              { label: 'Fiducia', val: rel.trust, color: '#10b981' },
              { label: 'Amore', val: rel.love, color: '#f43f5e' },
              { label: 'Attrazione', val: rel.attraction, color: '#f59e0b' },
              { label: 'Rispetto', val: rel.respect, color: '#8b5cf6' },
              { label: 'Gelosia', val: rel.jealousy, color: '#ef4444' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 65, flexShrink: 0 }}>{label}</span>
                <div className="stat-bar" style={{ flex: 1 }}>
                  <div className="stat-bar-fill" style={{ width: `${val}%`, backgroundColor: color }} />
                </div>
                <span style={{ fontSize: 11, width: 24, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {actions.map(({ action, label, emoji }) => (
              <button
                key={action}
                onClick={() => onAction(action)}
                style={{
                  padding: '6px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
                  background: action === 'break_up' || action === 'divorce' || action === 'insult'
                    ? 'rgba(239,68,68,0.15)'
                    : action === 'cheat'
                    ? 'rgba(168,85,247,0.15)'
                    : 'rgba(255,255,255,0.07)',
                  color: action === 'break_up' || action === 'divorce' || action === 'insult'
                    ? '#fca5a5'
                    : action === 'cheat'
                    ? '#d8b4fe'
                    : 'var(--color-text)',
                }}
              >
                {emoji} {label}
              </button>
            ))}
          </div>

          {/* NPC Memories */}
          {rel.memoryLog && rel.memoryLog.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                📖 Memorie condivise
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {rel.memoryLog.slice(0, 4).map(mem => {
                  const catColors: Record<string, string> = {
                    romantic: '#f43f5e', family: '#f59e0b', friendship: '#10b981',
                    professional: '#60a5fa', financial: '#a855f7', criminal: '#ef4444',
                  }
                  const color = catColors[mem.category] ?? '#94a3b8'
                  return (
                    <div key={mem.id} style={{
                      fontSize: 11, color: '#94a3b8', padding: '4px 8px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${color}`,
                      display: 'flex', justifyContent: 'space-between', gap: 8,
                    }}>
                      <span>{mem.description}</span>
                      <span style={{ flexShrink: 0, color: '#475569' }}>Anno {mem.year}</span>
                    </div>
                  )
                })}
                {rel.memoryLog.length > 4 && (
                  <div style={{ fontSize: 10, color: '#475569', textAlign: 'right' }}>
                    +{rel.memoryLog.length - 4} altre memorie
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
