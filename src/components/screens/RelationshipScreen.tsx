import { lazy, Suspense, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { Relationship } from '../../store/types'
import { useToastStore } from '../../store/toastStore'
import { AvatarRenderer } from '../avatar/AvatarRenderer'
import { ensureNpcAvatar } from '../../services/NpcAvatarEngine'
import {
  MOOD_LABELS, REL_TYPE_LABELS,
} from '../relationships/relationshipActions'

const PersonDetailModal = lazy(() =>
  import('../relationships/PersonDetailModal').then(m => ({ default: m.PersonDetailModal })))

export function RelationshipScreen() {
  const relationships = useGameStore(s => s.relationships)
  const family = useGameStore(s => s.family)
  const playerAge = useGameStore(s => s.time.age)
  const fileForDivorce = useGameStore(s => s.fileForDivorce)

  const confrontPartner = useGameStore(s => s.confrontPartner)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [detailRelId, setDetailRelId] = useState<string | null>(null)
  const [view, setView] = useState<'attivi' | 'storia'>('attivi')

  const pushToast = useToastStore(s => s.push)

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    pushToast(msg, ok ? '💚' : '❌', ok)
    setTimeout(() => setFeedback(null), 3500)
  }

  const activeRels = relationships.filter(r => r.isAlive && r.type !== 'ex_partner')
  const historicRels = relationships.filter(r => !r.isAlive || r.type === 'ex_partner')
  const spouseOrPartner = activeRels.find(r => r.type === 'spouse' || r.type === 'partner')

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

  if (detailRelId) {
    return (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Suspense fallback={null}>
          <PersonDetailModal relId={detailRelId} />
        </Suspense>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 'max(96px, env(safe-area-inset-bottom, 0px) + 80px)' }}>
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

              {/* Ancestry: who you descend from + parents' jobs */}
              {(() => {
                const parents = family.members.filter(m => m.relationToPlayer === 'mother' || m.relationToPlayer === 'father')
                const grandparents = family.members.filter(m => m.relationToPlayer === 'grandparent')
                if (parents.length === 0 && grandparents.length === 0) return null
                const maternalGps = grandparents.filter(g => g.familyBranch === 'maternal')
                const paternalGps = grandparents.filter(g => g.familyBranch === 'paternal')
                const renderPerson = (m: typeof family.members[number], icon: string, role: string) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 12, marginBottom: 3 }}>
                    <span style={{ flexShrink: 0 }}>{icon}</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{m.name}</span>
                    {m.deathYear != null && <span style={{ fontSize: 10, color: '#94a3b8' }}>✝</span>}
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>
                      · {role}{m.occupation ? ` · ${m.occupation}` : ''}
                    </span>
                  </div>
                )
                return (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, marginBottom: 6 }}>
                      🌳 Da chi discendi
                    </p>
                    {parents.map(p => renderPerson(p, p.gender === 'female' ? '👩' : '👨', p.relationToPlayer === 'mother' ? 'Madre' : 'Padre'))}
                    {maternalGps.length > 0 && (
                      <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ramo materno</p>
                    )}
                    {maternalGps.map(g => renderPerson(g, g.gender === 'female' ? '👵' : '👴', g.gender === 'female' ? 'Nonna' : 'Nonno'))}
                    {paternalGps.length > 0 && (
                      <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ramo paterno</p>
                    )}
                    {paternalGps.map(g => renderPerson(g, g.gender === 'female' ? '👵' : '👴', g.gender === 'female' ? 'Nonna' : 'Nonno'))}
                  </div>
                )
              })()}
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

          {spouseOrPartner && playerAge >= 18 && (
            <div className="card" style={{ padding: '12px 14px', marginBottom: 12, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                {spouseOrPartner.type === 'spouse' ? '💍' : '💑'} {spouseOrPartner.name.split(' ')[0]}
              </p>
              {spouseOrPartner.historyFlags.includes('cheated_secretly') && (
                <button
                  className="btn-secondary"
                  style={{ width: '100%', padding: '8px 0', fontSize: 13, fontWeight: 700, marginBottom: 8, borderColor: 'rgba(251,191,36,0.4)', color: '#fcd34d', cursor: 'pointer' }}
                  onClick={() => {
                    const r = confrontPartner()
                    flash(r.message, r.success)
                  }}
                >
                  🔎 Confronta sul tradimento
                </button>
              )}
              {spouseOrPartner.type === 'spouse' && (
                <>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                    Puoi richiedere il divorzio (costo legale da €2.000).
                  </p>
                  <button
                    className="btn-secondary"
                    style={{ width: '100%', padding: '8px 0', fontSize: 13, fontWeight: 700, borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5', cursor: 'pointer' }}
                    onClick={() => {
                      const r = fileForDivorce()
                      flash(r.message, r.success)
                    }}
                  >
                    📜 Chiedi divorzio
                  </button>
                </>
              )}
            </div>
          )}

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
              <div key={groupName} style={{ marginBottom: 12 }}>
                {/* BitLife-style gray section header band */}
                <div style={{
                  background: 'rgba(0,0,0,0.32)',
                  padding: '5px 16px',
                  marginLeft: -16, marginRight: -16,
                  fontSize: 11, color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700,
                  marginBottom: 0,
                }}>
                  {groupName}
                </div>
                {/* Flat rows */}
                <div>
                  {rels.map(rel => (
                    <RelCard
                      key={rel.id}
                      rel={rel}
                      onOpen={() => setDetailRelId(rel.id)}
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
                'Ex partner':      { color: '#f43f5e', icon: '💔' },
                'Vecchi colleghi': { color: '#60a5fa', icon: '💼' },
                'Defunti':         { color: '#94a3b8', icon: '🕯️' },
              }
              const meta = groupMeta[groupName] ?? { color: '#94a3b8', icon: '👤' }
              return (
                <div key={groupName} style={{ marginBottom: 12 }}>
                  <div style={{
                    background: 'rgba(0,0,0,0.32)',
                    padding: '5px 16px',
                    marginLeft: -16, marginRight: -16,
                    fontSize: 11, color: meta.color,
                    textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700,
                  }}>
                    {meta.icon} {groupName}
                  </div>
                  <div>
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

// ---- HistoricRelCard — flat list row for ex/deceased ----

function HistoricRelCard({ rel }: { rel: Relationship }) {
  const isEx = rel.type === 'ex_partner'
  const isColleague = rel.type === 'colleague'
  const statusColor = isEx ? '#f43f5e' : isColleague ? '#60a5fa' : '#64748b'
  const statusLabel = isEx ? '💔 Ex' : isColleague ? '💼 Ex collega' : '🕯️ Scomparso'
  const affection = Math.round((rel.trust * 0.5 + rel.love * 0.35 + rel.respect * 0.15))
  const affectionColor = affection >= 70 ? '#10b981' : affection >= 40 ? '#f59e0b' : '#f43f5e'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', opacity: rel.isAlive ? 0.9 : 0.6,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)',
        filter: rel.isAlive ? 'none' : 'grayscale(1)', overflow: 'hidden',
      }}>
        <AvatarRenderer config={ensureNpcAvatar(rel)} age={rel.age} gender={rel.gender} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{rel.name}</span>
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: `${statusColor}22`, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
          {REL_TYPE_LABELS[rel.type] ?? rel.type} · {rel.age}y
        </p>
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 5 }}>
          <div style={{ height: '100%', width: `${affection}%`, background: affectionColor, borderRadius: 99 }} />
        </div>
      </div>
    </div>
  )
}

// ---- RelCard — BitLife flat list row, opens PersonDetailModal ----

function RelCard({ rel, onOpen }: { rel: Relationship; onOpen: () => void }) {
  const mood = MOOD_LABELS[rel.mood ?? 'neutrale']
  const affection = Math.round((rel.trust * 0.5 + rel.love * 0.35 + rel.respect * 0.15))
  const affectionColor = affection >= 70 ? '#10b981' : affection >= 40 ? '#f59e0b' : '#f43f5e'
  const isRomantic = ['partner', 'spouse'].includes(rel.type)
  const isFamilyType = ['parent', 'sibling', 'child'].includes(rel.type)

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Avatar circle */}
      <div style={{
        width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        background: isRomantic ? 'rgba(244,63,94,0.12)' : isFamilyType ? 'rgba(251,191,36,0.1)' : 'rgba(99,102,241,0.1)',
        border: `2px solid ${isRomantic ? 'rgba(244,63,94,0.3)' : isFamilyType ? 'rgba(251,191,36,0.3)' : 'rgba(99,102,241,0.22)'}`,
        overflow: 'hidden',
      }}>
        <AvatarRenderer config={ensureNpcAvatar(rel)} age={rel.age} gender={rel.gender} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Text + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{rel.name}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>({rel.age}y)</span>
          {rel.toxicityTag && (
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 99, background: 'rgba(239,68,68,0.18)', color: '#fca5a5' }}>
              ⚠️
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {REL_TYPE_LABELS[rel.type] ?? rel.type}
          </span>
          <span style={{ fontSize: 12, color: mood.color }}>{mood.emoji}</span>
        </div>
        {/* Relationship bar */}
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 5 }}>
          <div style={{ height: '100%', width: `${affection}%`, background: affectionColor, borderRadius: 99 }} />
        </div>
      </div>

      {/* Chevron */}
      <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>›</span>
    </div>
  )
}
