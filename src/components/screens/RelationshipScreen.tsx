import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { NPCMood, NPCPersonalityTrait, Relationship } from '../../store/types'
import type { NPCAction } from '../../services/RelationshipEngine'
import { useToastStore } from '../../store/toastStore'

const STAGE_EMOJI: Record<string, string> = {
  stranger: '👤',
  acquaintance: '👋',
  friend: '😊',
  close_friend: '🤝',
  partner: '💑',
  spouse: '💍',
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

const CHAIN_LABELS: Record<string, { label: string; color: string }> = {
  chain_warmth: { label: 'Legame caldo', color: '#86efac' },
  chain_gratitude: { label: 'Gratitudine', color: '#facc15' },
  chain_repairing: { label: 'Riparazione', color: '#93c5fd' },
  chain_trust_decay: { label: 'Ferita aperta', color: '#fca5a5' },
  chain_tension: { label: 'Tensione', color: '#fdba74' },
  chain_jealousy: { label: 'Sospetto', color: '#f0abfc' },
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

// Actions that are romantic or sexual in nature — never allowed with family or minors
const ROMANTIC_ACTIONS: NPCAction[] = ['confess_feelings', 'ask_date', 'kiss', 'propose', 'cheat', 'break_up', 'divorce']
const FAMILY_TYPES = ['parent', 'sibling', 'child']

function getAllowedActions(
  rel: Relationship,
  playerAge: number,
): Array<{ action: NPCAction; label: string; emoji: string }> {
  const base = ACTIONS_BY_STAGE[rel.stage] ?? ACTIONS_BY_STAGE.stranger
  return base.filter(({ action }) => {
    if (FAMILY_TYPES.includes(rel.type) && ROMANTIC_ACTIONS.includes(action)) return false
    if (rel.age < 18 && ROMANTIC_ACTIONS.includes(action)) return false
    if (playerAge < 18 && (action === 'cheat' || action === 'divorce')) return false
    if (playerAge < 16 && ROMANTIC_ACTIONS.includes(action)) return false
    return true
  })
}

export function RelationshipScreen() {
  const relationships = useGameStore(s => s.relationships)
  const family = useGameStore(s => s.family)
  const playerAge = useGameStore(s => s.time.age)
  const interactWithNPC = useGameStore(s => s.interactWithNPC)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [view, setView] = useState<'attivi' | 'storia'>('attivi')

  const pushToast = useToastStore(s => s.push)

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    pushToast(msg, ok ? '💚' : '❌', ok)
    setTimeout(() => setFeedback(null), 3500)
  }

  const handleAction = (relId: string, action: NPCAction) => {
    const r = interactWithNPC(relId, action)
    flash(r.message, r.success)
  }

  const toggleExpand = (id: string) => setExpanded(prev => prev === id ? null : id)

  const activeRels = relationships.filter(r => r.isAlive && r.type !== 'ex_partner')
  const historicRels = relationships.filter(r => !r.isAlive || r.type === 'ex_partner')

  const groupedRels: Record<string, Relationship[]> = {
    Famiglia: activeRels.filter(r => ['parent', 'sibling', 'child'].includes(r.type)),
    Romantiche: activeRels.filter(r => ['partner', 'spouse'].includes(r.type)),
    Amici: activeRels.filter(r => ['friend', 'best_friend', 'colleague', 'acquaintance'].includes(r.type)),
    Altro: activeRels.filter(r => ['rival', 'enemy'].includes(r.type)),
  }

  const historicGroups: Record<string, Relationship[]> = {
    'Ex partner': historicRels.filter(r => r.type === 'ex_partner'),
    'Vecchi colleghi': historicRels.filter(r => !r.isAlive && r.type === 'colleague'),
    'Defunti': historicRels.filter(r => !r.isAlive && r.type !== 'ex_partner' && r.type !== 'colleague'),
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>❤️ Relazioni</h2>
      </div>

      {/* View switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['attivi', 'storia'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 12, fontSize: 12, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: view === v ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
              color: view === v ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {v === 'attivi' ? '👥 Attivi' : '📖 Storia'}
            {v === 'storia' && historicRels.length > 0 && (
              <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.8 }}>({historicRels.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ATTIVI view */}
      {view === 'attivi' && (
        <>
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

          <div style={{ borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
            💡 Per incontrare nuove persone vai su <strong>Attività → Socializza</strong>. Colleghi e compagni emergono automaticamente da Lavoro e Scuola.
          </div>

          {activeRels.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 28 }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>👤</p>
              <p style={{ fontSize: 14, color: 'var(--color-text)' }}>Nessuna relazione attiva.</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Premi "+ Incontra" per conoscere qualcuno o invecchia per eventi sociali automatici.
              </p>
            </div>
          )}

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
                      playerAge={playerAge}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* STORIA view */}
      {view === 'storia' && (
        <>
          {historicRels.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 28 }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>📖</p>
              <p style={{ fontSize: 14, color: 'var(--color-text)' }}>Nessuna storia ancora.</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Ex partner e persone scomparse appariranno qui nel tempo.
              </p>
            </div>
          ) : (
            Object.entries(historicGroups).map(([groupName, rels]) => {
              if (rels.length === 0) return null
              const groupMeta: Record<string, { color: string; icon: string }> = {
                'Ex partner':     { color: '#f43f5e', icon: '💔' },
                'Vecchi colleghi': { color: '#60a5fa', icon: '💼' },
                'Defunti':        { color: '#94a3b8', icon: '🕯️' },
              }
              const meta = groupMeta[groupName] ?? { color: '#94a3b8', icon: '👤' }
              return (
                <div key={groupName} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: meta.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    {meta.icon} {groupName}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rels.map(rel => (
                      <HistoricRelCard key={rel.id} rel={rel} />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </>
      )}
    </div>
  )
}

// ---- HistoricRelCard — read-only card for ex/deceased ----

function HistoricRelCard({ rel }: { rel: Relationship }) {
  const [expanded, setExpanded] = useState(false)
  const isEx = rel.type === 'ex_partner'
  const isColleague = rel.type === 'colleague'
  const statusColor = isEx ? '#f43f5e' : isColleague ? '#60a5fa' : '#64748b'
  const statusLabel = isEx ? '💔 Ex' : isColleague ? '💼 Ex collega' : '🕯️ Scomparso'

  return (
    <div className="card" style={{ padding: 12, opacity: rel.isAlive ? 1 : 0.75 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(p => !p)}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 26, filter: rel.isAlive ? 'none' : 'grayscale(1)' }}>{rel.emoji}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{rel.name}</p>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: `${statusColor}22`, color: statusColor }}>
                {statusLabel}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {REL_TYPE_LABELS[rel.type] ?? rel.type} · {rel.age}y
            </p>
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {[
              { label: 'Fiducia', val: rel.trust, color: '#10b981' },
              { label: 'Amore', val: rel.love, color: '#f43f5e' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 55, flexShrink: 0 }}>{label}</span>
                <div className="stat-bar" style={{ flex: 1 }}>
                  <div className="stat-bar-fill" style={{ width: `${val}%`, backgroundColor: color }} />
                </div>
                <span style={{ fontSize: 11, width: 24, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{val}</span>
              </div>
            ))}
          </div>

          {rel.memoryLog && rel.memoryLog.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                📖 Ricordi
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {rel.memoryLog.slice(0, 5).map(mem => {
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---- RelCard subcomponent ----

function RelCard({ rel, expanded, onToggle, onAction, playerAge }: {
  rel: Relationship
  expanded: boolean
  onToggle: () => void
  onAction: (action: NPCAction) => void
  playerAge: number
}) {
  const actions = getAllowedActions(rel, playerAge)
  const mood = MOOD_LABELS[rel.mood ?? 'neutrale']
  const traits = rel.personalityTraits ?? []
  const chainFlags = rel.historyFlags.filter(flag => flag in CHAIN_LABELS)

  // Determine dominant affection value for the always-visible bar
  const affection = Math.round((rel.trust * 0.5 + rel.love * 0.35 + rel.respect * 0.15))
  const affectionColor = affection >= 70 ? '#10b981' : affection >= 40 ? '#f59e0b' : '#f43f5e'

  const isRomantic = ['partner', 'spouse'].includes(rel.type)
  const isFamilyType = ['parent', 'sibling', 'child'].includes(rel.type)

  return (
    <div className="card tap-scale" style={{ padding: '12px 14px' }}>
      {/* Header row */}
      <div className="rel-card-header" onClick={onToggle}>
        {/* NPC avatar circle */}
        <div className="rel-card-avatar" style={{
          borderColor: isRomantic ? 'rgba(244,63,94,0.4)' : isFamilyType ? 'rgba(251,191,36,0.4)' : 'rgba(124,92,255,0.25)',
          background: isRomantic ? 'rgba(244,63,94,0.12)' : isFamilyType ? 'rgba(251,191,36,0.1)' : 'rgba(124,92,255,0.1)',
        }}>
          {rel.emoji}
        </div>

        {/* Identity + bars */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{rel.name}</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{rel.age}y</span>
            {rel.toxicityTag && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(239,68,68,0.18)', color: '#fca5a5' }}>
                ⚠️ tossica
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {REL_TYPE_LABELS[rel.type] ?? rel.type}
            </span>
            <span style={{ fontSize: 13 }}>{STAGE_EMOJI[rel.stage] ?? '👤'}</span>
            {/* Mood badge */}
            <span className="rel-mood-badge" style={{ color: mood.color }}>
              {mood.emoji} {mood.label}
            </span>
          </div>
          {/* Affection bar — always visible */}
          <div style={{ marginTop: 6 }}>
            <div className="rel-affection-bar">
              <div className="rel-affection-fill" style={{ width: `${affection}%`, background: affectionColor }} />
            </div>
          </div>
        </div>

        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          {/* Trait + chain badges */}
          {(traits.length > 0 || chainFlags.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {traits.map(trait => (
                <span key={trait} style={{ fontSize: 10, color: '#cbd5e1', padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {TRAIT_LABELS[trait]}
                </span>
              ))}
              {chainFlags.map(flag => {
                const chain = CHAIN_LABELS[flag]
                return (
                  <span key={flag} style={{ fontSize: 10, color: chain.color, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: `1px solid ${chain.color}33` }}>
                    {chain.label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Detailed stat bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
            {[
              { label: 'Fiducia', val: rel.trust, color: '#10b981' },
              { label: 'Amore', val: rel.love, color: '#f43f5e' },
              { label: 'Attrazione', val: rel.attraction, color: '#f59e0b' },
              { label: 'Rispetto', val: rel.respect, color: '#8b5cf6' },
              { label: 'Gelosia', val: rel.jealousy, color: '#ef4444' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', width: 60, flexShrink: 0 }}>{label}</span>
                <div className="stat-bar" style={{ flex: 1 }}>
                  <div className="stat-bar-fill" style={{ width: `${val}%`, backgroundColor: color }} />
                </div>
                <span style={{ fontSize: 10, width: 22, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: actions.length > 0 ? 0 : 0 }}>
            {actions.map(({ action, label, emoji }) => {
              const isDanger = action === 'break_up' || action === 'divorce' || action === 'insult'
              const isDark = action === 'cheat'
              return (
                <button
                  key={action}
                  onClick={() => onAction(action)}
                  className="tap-scale"
                  style={{
                    padding: '6px 11px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${isDanger ? 'rgba(239,68,68,0.25)' : isDark ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.1)'}`,
                    background: isDanger ? 'rgba(239,68,68,0.12)' : isDark ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.07)',
                    color: isDanger ? '#fca5a5' : isDark ? '#d8b4fe' : 'var(--color-text)',
                  }}
                >
                  {emoji} {label}
                </button>
              )
            })}
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
