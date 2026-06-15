import { useGameStore } from '../../store/gameStore'
import { SpecialCareerEngine, type SpecialCareerType } from '../../services/SpecialCareerEngine'

export type CarreraSubTab =
  | 'career' | 'education' | 'military' | 'pension' | 'business' | 'special_career'
  | 'freelance_gigs' | 'part_time_jobs'

interface ItemDef {
  id: CarreraSubTab
  emoji: string
  label: string
  subtitle: string
  color: string
}

const ALL_ITEMS: ItemDef[] = [
  { id: 'career',          emoji: '💼', label: 'Lavoro',            subtitle: 'Trova e gestisci il tuo impiego',     color: '#f59e0b' },
  { id: 'part_time_jobs',  emoji: '⏰', label: 'Lavori Part-Time',  subtitle: 'Impieghi flessibili e orari ridotti', color: '#22c55e' },
  { id: 'freelance_gigs',  emoji: '🔨', label: 'Lavoretti',         subtitle: 'Guadagna subito con lavori a chiamata', color: '#06b6d4' },
  { id: 'education',       emoji: '📚', label: 'Istruzione',        subtitle: 'Scuola, università e club',            color: '#3b82f6' },
  { id: 'military',        emoji: '🪖', label: 'Militare',          subtitle: 'Servizio militare e leva',             color: '#6b7280' },
  { id: 'pension',         emoji: '🎗️', label: 'Pensione',          subtitle: 'Pensione anticipata o ordinaria',      color: '#10b981' },
  { id: 'business',        emoji: '🚀', label: 'La tua Azienda',    subtitle: 'Fonda e gestisci la tua società',     color: '#8b5cf6' },
  { id: 'special_career',  emoji: '🌟', label: 'Carriere Speciali', subtitle: 'Attore, musicista, atleta, politico, criminale', color: '#eab308' },
]

export { ALL_ITEMS as CARRERA_ITEMS }

const CAREER_META: Record<SpecialCareerType, { emoji: string; label: string; color: string }> = {
  actor:       { emoji: '🎭', label: 'Attore',    color: '#a855f7' },
  musician:    { emoji: '🎵', label: 'Musicista', color: '#06b6d4' },
  pro_athlete: { emoji: '⚽', label: 'Atleta Pro',color: '#22c55e' },
  politician:  { emoji: '🏛️', label: 'Politico',  color: '#60a5fa' },
  criminal:    { emoji: '🕶️', label: 'Criminale', color: '#ef4444' },
}

interface Props {
  onChange: (sub: CarreraSubTab) => void
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      padding: '9px 16px 7px',
      background: 'rgba(0,0,0,0.18)',
      borderTop: '1px solid rgba(255,255,255,0.045)',
      borderBottom: '1px solid rgba(255,255,255,0.045)',
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

function StatBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', width: 80, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, val))}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 10, width: 22, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{Math.round(val)}</span>
    </div>
  )
}

export function CarreraNav({ onChange }: Props) {
  const job           = useGameStore(s => s.career.currentJob)
  const specialCareer = useGameStore(s => s.specialCareer)
  const pendingOffer  = useGameStore(s => s.pendingCareerOffer)
  const sports        = useGameStore(s => s.sports ?? [])
  const age           = useGameStore(s => s.time.age)

  const bestSport = sports.length > 0 ? [...sports].sort((a, b) => b.skillLevel - a.skillLevel)[0] : null
  const canBeAthlete = !!bestSport && bestSport.skillLevel >= 60 && !specialCareer && age >= 16

  const hasCurrentWork = !!job || !!specialCareer
  const hasJustForYou = !!pendingOffer || canBeAthlete

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>

      {/* ── TU ── */}
      {hasCurrentWork && (
        <>
          <SectionLabel label="Tu" />

          {/* Regular job card */}
          {job && (
            <button
              onClick={() => onChange('career')}
              className="tap-scale"
              style={{
                width: '100%', padding: '13px 16px', display: 'flex', gap: 13, alignItems: 'flex-start',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: '#f59e0b1e', border: '1px solid #f59e0b33',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
              }}>💼</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 1 }}>{job.title}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{job.company}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <StatBar label="Prestazione" val={job.promotionChance * 100} color="#22c55e" />
                  <StatBar label="Stress"      val={job.stressLevel}           color="#f43f5e" />
                </div>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 18, flexShrink: 0, lineHeight: 1, marginTop: 12 }}>›</span>
            </button>
          )}

          {/* Special career card */}
          {specialCareer && (() => {
            const m = CAREER_META[specialCareer.type]
            return (
              <button
                onClick={() => onChange('special_career')}
                className="tap-scale"
                style={{
                  width: '100%', padding: '13px 16px', display: 'flex', gap: 13, alignItems: 'flex-start',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${m.color}1e`, border: `1px solid ${m.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
                }}>{m.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 1 }}>{m.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    {SpecialCareerEngine._phaseLabel(specialCareer.phase, specialCareer.type)}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <StatBar label="Fama"        val={specialCareer.fame}       color="#f59e0b" />
                    <StatBar label="Reputazione" val={specialCareer.reputation} color="#8b5cf6" />
                  </div>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 18, flexShrink: 0, lineHeight: 1, marginTop: 12 }}>›</span>
              </button>
            )
          })()}
        </>
      )}

      {/* No job placeholder */}
      {!hasCurrentWork && (
        <>
          <SectionLabel label="Tu" />
          <div style={{ padding: '16px 16px 12px', display: 'flex', gap: 13, alignItems: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
            }}>😴</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Disoccupato</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Cerca un lavoro o inizia una carriera speciale</p>
            </div>
          </div>
        </>
      )}

      {/* ── SOLO PER TE ── */}
      {hasJustForYou && (
        <>
          <SectionLabel label="Solo per Te" />

          {/* Scout offer row */}
          {pendingOffer && (
            <button
              onClick={() => onChange('special_career')}
              className="tap-scale"
              style={{
                width: '100%', padding: '11px 16px', display: 'flex', gap: 13, alignItems: 'center',
                background: 'linear-gradient(90deg, rgba(34,197,94,0.07) 0%, transparent 100%)',
                border: 'none', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
              }}>🔍</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#86efac', marginBottom: 1 }}>Uno Scout ti ha notato!</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {pendingOffer.offer.fromTeamEmoji} {pendingOffer.offer.fromTeamName} — tocca per rispondere
                </p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.2)', color: '#86efac', border: '1px solid rgba(34,197,94,0.35)', flexShrink: 0 }}>NUOVO</span>
            </button>
          )}

          {/* Athlete suggestion */}
          {canBeAthlete && !pendingOffer && (
            <button
              onClick={() => onChange('special_career')}
              className="tap-scale"
              style={{
                width: '100%', padding: '11px 16px', display: 'flex', gap: 13, alignItems: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
              }}>⚽</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 1 }}>Diventa Atleta Professionista</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  Sei bravo in {bestSport!.name} (livello {Math.round(bestSport!.skillLevel)}). Potresti fare il grande salto!
                </p>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 18, flexShrink: 0 }}>›</span>
            </button>
          )}
        </>
      )}

      {/* ── TUTTO ── */}
      <SectionLabel label="Tutto" />

      {ALL_ITEMS.map(item => (
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
