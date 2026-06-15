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
import type { Relationship } from '../../store/types'
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
  romantic_outing:      { desc: "Un'uscita romantica",                       bg: '#f43f5e' },
  surprise:             { desc: 'Fagli/le una sorpresa',                     bg: '#fb923c' },
  vacation_together:    { desc: 'Partite in vacanza insieme',                bg: '#22d3ee' },
  propose_cohabitation: { desc: 'Proponete di andare a vivere insieme',      bg: '#60a5fa' },
  propose:              { desc: 'Falle/gli una proposta di matrimonio',      bg: '#fbbf24' },
  cheat:                { desc: 'Tradisci il tuo partner',                   bg: '#7c3aed' },
  break_up:             { desc: 'Lascia questa relazione',                   bg: '#dc2626' },
  divorce:              { desc: 'Inizia le pratiche di divorzio',            bg: '#b91c1c' },
  thank:                { desc: 'Ringraziale/gli',                           bg: '#34d399' },
}

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
  const mood = MOOD_LABELS[rel.mood ?? 'neutrale']
  const traits = rel.personalityTraits ?? []
  const chainFlags = rel.historyFlags.filter(f => f in CHAIN_LABELS)
  const affection = Math.round(rel.trust * 0.5 + rel.love * 0.35 + rel.respect * 0.15)
  const affectionColor = affection >= 70 ? '#10b981' : affection >= 40 ? '#f59e0b' : '#f43f5e'
  const relLabel = REL_TYPE_LABELS[rel.type] ?? rel.type

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
