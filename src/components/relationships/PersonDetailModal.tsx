// PersonDetailModal — BitLife-style full-screen detail for a relationship.
// Header, relationship bar, God-Mode "Edit" entry, attributes, activities,
// money exchange and shared memories.

import { lazy, Suspense, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { AvatarRenderer } from '../avatar/AvatarRenderer'
import { ensureNpcAvatar } from '../../services/NpcAvatarEngine'
import { MoneyExchange } from './MoneyExchange'
import {
  STAGE_EMOJI, MOOD_LABELS, TRAIT_LABELS, REL_TYPE_LABELS, CHAIN_LABELS,
  getAllowedActions,
} from './relationshipActions'
import { ensureNpcAttributes, NPC_ATTR_META } from '../../services/NpcAttributes'
import { RomanticDynamicsEngine } from '../../services/RomanticDynamicsEngine'
import type { Relationship, RelationshipModel } from '../../store/types'
import type { NPCAction } from '../../services/RelationshipEngine'

const GodModePersonEditor = lazy(() =>
  import('./GodModePersonEditor').then(m => ({ default: m.GodModePersonEditor })))

interface Props {
  relId: string
}

const CAT_COLORS: Record<string, string> = {
  romantic: '#f43f5e', family: '#f59e0b', friendship: '#10b981',
  professional: '#60a5fa', financial: '#a855f7', criminal: '#ef4444',
}

// BitLife-style: each action has a coloured icon background + description
const ACTION_META: Record<string, { desc: string; bg: string }> = {
  greet:                { desc: 'Saluta la persona',                         bg: '#64748b' },
  hang_out:             { desc: 'Uscite insieme',                            bg: '#3b82f6' },
  compliment:           { desc: 'Fagli/le un complimento',                   bg: '#f59e0b' },
  gift:                 { desc: 'Fagli/le un regalo',                        bg: '#10b981' },
  confess_feelings:     { desc: 'Confessa i tuoi sentimenti',                bg: '#ef4444' },
  do_activity:          { desc: "Fate un'attività insieme",                  bg: '#8b5cf6' },
  spend_time:           { desc: 'Trascorri del tempo insieme',               bg: '#06b6d4' },
  lend_money:           { desc: 'Prestagli/le dei soldi',                    bg: '#84cc16' },
  ask_money:            { desc: 'Chiedile/gli dei soldi',                    bg: '#eab308' },
  ask_date:             { desc: 'Proponici un appuntamento',                 bg: '#ec4899' },
  make_peace:           { desc: 'Fate pace',                                 bg: '#14b8a6' },
  fight:                { desc: 'Litigate',                                  bg: '#f97316' },
  kiss:                 { desc: 'Dagli/le un bacio',                         bg: '#e879f9' },
  apologize:            { desc: 'Chiedigli/le scusa',                        bg: '#a78bfa' },
  make_love:            { desc: 'Sii intimo/a con il tuo partner',           bg: '#f43f5e' },
  romantic_outing:      { desc: "Un'uscita romantica",                       bg: '#ec4899' },
  surprise:             { desc: 'Fagli/le una sorpresa',                     bg: '#fb923c' },
  vacation_together:    { desc: 'Partite in vacanza insieme',                bg: '#22d3ee' },
  propose_cohabitation: { desc: 'Proponete di andare a vivere insieme',      bg: '#60a5fa' },
  propose:              { desc: 'Falle/gli una proposta di matrimonio',      bg: '#fbbf24' },
  cheat:                { desc: 'Tradisci il tuo partner',                   bg: '#7c3aed' },
  break_up:             { desc: 'Lascia questa relazione',                   bg: '#dc2626' },
  divorce:              { desc: 'Inizia le pratiche di divorzio',            bg: '#b91c1c' },
  thank:                { desc: 'Ringraziale/gli',                           bg: '#34d399' },
}

const MODEL_LABELS: Record<RelationshipModel, { label: string; emoji: string; color: string }> = {
  serious: { label: 'Relazione seria',      emoji: '💞', color: '#f43f5e' },
  dating:  { label: 'Frequentazione',       emoji: '💬', color: '#60a5fa' },
  casual:  { label: 'Relazione non seria',  emoji: '🎈', color: '#fbbf24' },
  fwb:     { label: 'Amicizia con benefici', emoji: '🔥', color: '#f97316' },
  open:    { label: 'Relazione aperta',     emoji: '🔓', color: '#a78bfa' },
  poly:    { label: 'Poliamorosa',          emoji: '💗', color: '#ec4899' },
}

const COMPAT_AXES: { key: 'mental' | 'affective' | 'sexual' | 'projectual'; label: string; emoji: string }[] = [
  { key: 'mental',     label: 'Mentale',    emoji: '🧠' },
  { key: 'affective',  label: 'Affettiva',  emoji: '💗' },
  { key: 'sexual',     label: 'Sessuale',   emoji: '🔥' },
  { key: 'projectual', label: 'Progettuale', emoji: '🎯' },
]

const BOND_BARS: { key: 'emotionalSat' | 'sexualSat' | 'passion' | 'stability'; label: string; emoji: string }[] = [
  { key: 'emotionalSat', label: 'Soddisf. emotiva',  emoji: '😊' },
  { key: 'sexualSat',    label: 'Soddisf. sessuale', emoji: '💋' },
  { key: 'passion',      label: 'Passione',          emoji: '✨' },
  { key: 'stability',    label: 'Stabilità',         emoji: '⚖️' },
]

export function PersonDetailModal({ relId }: Props) {
  const rel = useGameStore(s => s.relationships.find(r => r.id === relId)) as Relationship | undefined
  const playerAge = useGameStore(s => s.time.age)
  const interactWithNPC = useGameStore(s => s.interactWithNPC)
  const godModeUnlocked = useGameStore(s => s.settings.godModeUnlocked)
  const pushToast = useToastStore(s => s.push)
  const showAlert = useToastStore(s => s.showAlert)
  const [showEditor, setShowEditor] = useState(false)

  if (!rel) return null

  const handleAction = (action: NPCAction) => {
    const r = interactWithNPC(rel.id, action)
    pushToast(r.message, r.success ? '💚' : '❌', r.success)
  }

  const openEditor = () => {
    if (!godModeUnlocked) {
      showAlert(
        'L\'editor God Mode permette di modificare nome, aspetto e attributi di ogni persona. Sbloccalo dallo Shop.',
        true, '⚡',
      )
      return
    }
    setShowEditor(true)
  }

  const attrs = ensureNpcAttributes(rel)
  const actions = getAllowedActions(rel, playerAge)

  // Emergent couple dynamics (romantic relationships only) — computed live so the
  // panel is populated even before the first annual tick fills the stored fields.
  const isRomanticRel = rel.type === 'partner' || rel.type === 'spouse'
  const dynamics = (() => {
    if (!isRomanticRel) return null
    const st = useGameStore.getState()
    const player = RomanticDynamicsEngine.playerProfile(st)
    const npcProfile = rel.romanticProfile ?? RomanticDynamicsEngine.ensureProfile(rel)
    const compat = rel.compatibility ?? RomanticDynamicsEngine.computeCompatibility(player, npcProfile, rel, st)
    const model = rel.relationshipModel ?? RomanticDynamicsEngine.classifyModel(player, npcProfile, compat, rel, st)
    const bond = rel.bond ?? RomanticDynamicsEngine.ensureBond({ ...rel, relationshipModel: model, compatibility: compat }, compat)
    return { compat, model, bond }
  })()
  const mood = MOOD_LABELS[rel.mood ?? 'neutrale']
  const traits = rel.personalityTraits ?? []
  const chainFlags = rel.historyFlags.filter(f => f in CHAIN_LABELS)
  const affection = Math.round(rel.trust * 0.5 + rel.love * 0.35 + rel.respect * 0.15)
  const affectionColor = affection >= 70 ? '#10b981' : affection >= 40 ? '#f59e0b' : '#f43f5e'

  // Precise stage label: distinguishes Frequentazione / Fidanzato / Convivente / Sposato
  const relLabel = (() => {
    if (rel.type === 'spouse') return 'Coniuge'
    if (rel.type === 'partner') {
      if (rel.historyFlags.includes('cohabiting')) return 'Convivente'
      const model = dynamics?.model
      if (model === 'serious') return 'Fidanzato/a'
      if (model === 'fwb') return 'Amici con benefici'
      if (model === 'open') return 'Rel. aperta'
      if (model === 'casual') return 'Rel. casuale'
      return 'In frequentazione'
    }
    return REL_TYPE_LABELS[rel.type] ?? rel.type
  })()

  return (
    <>
    <div style={{ padding: '14px 14px', paddingBottom: 'max(96px, env(safe-area-inset-bottom, 0px) + 80px)' }}>
        {/* Top bar */}
        <div style={topBar}>
          <span style={{ width: 32 }} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' }}>{relLabel}</span>
          <span style={{ width: 32 }} />
        </div>

        <div style={{ padding: '4px 4px 8px' }}>
          {/* Identity */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 8px' }}>
            <div style={avatarCircle}>
              <AvatarRenderer size="md" config={ensureNpcAvatar(rel)} age={rel.age} gender={rel.gender} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>{rel.name}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>({rel.age} anni)</span>
                <span style={{ fontSize: 15 }}>{STAGE_EMOJI[rel.stage] ?? '👤'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span className="rel-mood-badge" style={{ color: mood.color }}>{mood.emoji} {mood.label}</span>
                {rel.toxicityTag && (
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(239,68,68,0.18)', color: '#fca5a5' }}>⚠️ tossica</span>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Relazione</span>
                <div className="stat-bar" style={{ marginTop: 3 }}>
                  <div className="stat-bar-fill" style={{ width: `${affection}%`, backgroundColor: affectionColor }} />
                </div>
              </div>
            </div>
          </div>

          {/* Trait + chain badges */}
          {(traits.length > 0 || chainFlags.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 8px 10px' }}>
              {traits.map(t => (
                <span key={t} style={badge}>{TRAIT_LABELS[t]}</span>
              ))}
              {chainFlags.map(f => {
                const c = CHAIN_LABELS[f]
                return <span key={f} style={{ ...badge, color: c.color, border: `1px solid ${c.color}33` }}>{c.label}</span>
              })}
            </div>
          )}

          {/* Edit (God Mode) */}
          <button onClick={openEditor} style={editRow}>
            <span style={{ fontSize: 22 }}>✏️</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Modifica</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>Nome, aspetto e attributi</p>
            </div>
            <span style={godBadge}>GOD MODE</span>
          </button>

          {/* Attributes */}
          <div style={sectionHead}>Attributi</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px 6px' }}>
            {NPC_ATTR_META.map(m => {
              const val = attrs[m.key] as number
              const color = val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#f43f5e'
              return (
                <div key={String(m.key)} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 96, flexShrink: 0 }}>{m.emoji} {m.label}</span>
                  <div className="stat-bar" style={{ flex: 1 }}>
                    <div className="stat-bar-fill" style={{ width: `${val}%`, backgroundColor: color }} />
                  </div>
                  <span style={{ fontSize: 10, width: 30, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{val}%</span>
                </div>
              )
            })}
          </div>

          {/* Suspicion indicator */}
          {isRomanticRel && (rel.suspicion ?? 0) >= 20 && (
            <div style={{
              margin: '4px 8px 6px',
              padding: '8px 12px',
              borderRadius: 10,
              background: (rel.suspicion ?? 0) >= 80
                ? 'rgba(239,68,68,0.15)'
                : (rel.suspicion ?? 0) >= 60
                  ? 'rgba(249,115,22,0.12)'
                  : (rel.suspicion ?? 0) >= 40
                    ? 'rgba(234,179,8,0.10)'
                    : 'rgba(148,163,184,0.10)',
              border: `1px solid ${(rel.suspicion ?? 0) >= 80 ? 'rgba(239,68,68,0.35)' : (rel.suspicion ?? 0) >= 60 ? 'rgba(249,115,22,0.3)' : (rel.suspicion ?? 0) >= 40 ? 'rgba(234,179,8,0.25)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>
                {(rel.suspicion ?? 0) >= 80 ? '😤' : (rel.suspicion ?? 0) >= 60 ? '🔍' : (rel.suspicion ?? 0) >= 40 ? '👀' : '💭'}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: (rel.suspicion ?? 0) >= 80 ? '#fca5a5' : (rel.suspicion ?? 0) >= 60 ? '#fdba74' : (rel.suspicion ?? 0) >= 40 ? '#fde047' : 'var(--color-text-secondary)' }}>
                  {(rel.suspicion ?? 0) >= 80 ? 'In crisi — sospetto profondo' : (rel.suspicion ?? 0) >= 60 ? 'Sospetto alto' : (rel.suspicion ?? 0) >= 40 ? 'Comincia a sospettare' : 'Leggermente distante'}
                </p>
                <div className="stat-bar" style={{ marginTop: 4 }}>
                  <div className="stat-bar-fill" style={{ width: `${rel.suspicion}%`, backgroundColor: (rel.suspicion ?? 0) >= 80 ? '#ef4444' : (rel.suspicion ?? 0) >= 60 ? '#f97316' : (rel.suspicion ?? 0) >= 40 ? '#eab308' : '#94a3b8' }} />
                </div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{rel.suspicion}%</span>
            </div>
          )}

          {/* Couple dynamics — emergent relationship model, compatibility & bond */}
          {dynamics && (
            <>
              <div style={sectionHead}>Dinamiche di coppia</div>
              <div style={{ padding: '0 8px 6px' }}>
                {/* Relationship model chip */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10,
                  fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
                  background: `${MODEL_LABELS[dynamics.model].color}1f`,
                  color: MODEL_LABELS[dynamics.model].color,
                  border: `1px solid ${MODEL_LABELS[dynamics.model].color}40`,
                }}>
                  {MODEL_LABELS[dynamics.model].emoji} {MODEL_LABELS[dynamics.model].label}
                </div>

                {/* Compatibility axes */}
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, margin: '2px 0 5px', fontWeight: 700 }}>
                  Compatibilità · {dynamics.compat.overall}%
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {COMPAT_AXES.map(axis => {
                    const val = dynamics.compat[axis.key]
                    const color = val >= 70 ? '#10b981' : val >= 45 ? '#f59e0b' : '#f43f5e'
                    return (
                      <div key={axis.key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 96, flexShrink: 0 }}>{axis.emoji} {axis.label}</span>
                        <div className="stat-bar" style={{ flex: 1 }}>
                          <div className="stat-bar-fill" style={{ width: `${val}%`, backgroundColor: color }} />
                        </div>
                        <span style={{ fontSize: 10, width: 30, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{val}%</span>
                      </div>
                    )
                  })}
                </div>

                {/* Bond health */}
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, margin: '2px 0 5px', fontWeight: 700 }}>
                  Salute del legame
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {BOND_BARS.map(b => {
                    const val = dynamics.bond[b.key]
                    const color = val >= 65 ? '#10b981' : val >= 40 ? '#f59e0b' : '#f43f5e'
                    return (
                      <div key={b.key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 96, flexShrink: 0 }}>{b.emoji} {b.label}</span>
                        <div className="stat-bar" style={{ flex: 1 }}>
                          <div className="stat-bar-fill" style={{ width: `${val}%`, backgroundColor: color }} />
                        </div>
                        <span style={{ fontSize: 10, width: 30, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{val}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Activities — BitLife-style vertical list */}
          {actions.length > 0 && (
            <>
              <div style={sectionHead}>Attività</div>
              <div style={{ marginLeft: -14, marginRight: -14 }}>
                {actions.map(({ action, label, emoji }) => {
                  const meta = ACTION_META[action]
                  const isDanger = ['break_up', 'divorce', 'fight', 'cheat'].includes(action)
                  return (
                    <div
                      key={action}
                      onClick={() => handleAction(action)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {/* Coloured icon circle */}
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, background: meta?.bg ?? '#64748b',
                      }}>
                        {emoji}
                      </div>
                      {/* Label + description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 14, fontWeight: 700, margin: 0,
                          color: isDanger ? '#fca5a5' : 'var(--color-text)',
                        }}>
                          {label}
                        </p>
                        {meta?.desc && (
                          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, marginTop: 1 }}>
                            {meta.desc}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)', flexShrink: 0, letterSpacing: 1 }}>···</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Money */}
          <div style={{ padding: '0 8px' }}>
            <MoneyExchange rel={rel} />
          </div>

          {/* Memories */}
          {rel.memoryLog && rel.memoryLog.length > 0 && (
            <>
              <div style={sectionHead}>📖 Memorie condivise</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 8px 8px' }}>
                {rel.memoryLog.slice(0, 6).map(mem => {
                  const color = CAT_COLORS[mem.category] ?? '#94a3b8'
                  return (
                    <div key={mem.id} style={{
                      fontSize: 11, color: '#94a3b8', padding: '5px 9px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${color}`,
                      display: 'flex', justifyContent: 'space-between', gap: 8,
                    }}>
                      <span>{mem.description}</span>
                      <span style={{ flexShrink: 0, color: '#475569' }}>Anno {mem.year}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
    </div>

    {showEditor && (
      <Suspense fallback={null}>
        <GodModePersonEditor relId={rel.id} onClose={() => setShowEditor(false)} />
      </Suspense>
    )}
    </>
  )
}

// ─── styles ───────────────────────────────────────────────────────

const topBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: 'linear-gradient(180deg, #1e5fb4 0%, #16498c 100%)',
  color: '#fff', borderRadius: 12, padding: '8px 10px', marginBottom: 8,
}
const avatarCircle: React.CSSProperties = {
  width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(167,139,250,0.3)', overflow: 'hidden',
}
const editRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '11px 12px', borderRadius: 12, cursor: 'pointer',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  margin: '4px 0 6px',
}
const godBadge: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, color: '#1a1a2e', background: 'linear-gradient(180deg,#fde047,#facc15)',
  padding: '3px 7px', borderRadius: 6, letterSpacing: 0.5,
  border: '1px solid #ca8a04', boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
}
const sectionHead: React.CSSProperties = {
  fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1,
  padding: '12px 8px 6px', fontWeight: 700,
}
const badge: React.CSSProperties = {
  fontSize: 10, color: '#cbd5e1', padding: '2px 7px', borderRadius: 99,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
}
