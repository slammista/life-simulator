import { lazy, Suspense, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { CareerEngine, getAllJobs, getContractLabel, getCategorySkillBonus } from '../../services/CareerEngine'
import { useToastStore } from '../../store/toastStore'
import { feedback } from '../../services/FeedbackEngine'
import type { WorkAction, WorkNPC, WorkReputationStatus, PlayerSkills } from '../../store/types'

const WorkNpcDetailModal = lazy(() =>
  import('../relationships/WorkNpcDetailModal').then(m => ({ default: m.WorkNpcDetailModal })))

const CATEGORY_EMOJI: Record<string, string> = {
  care: '🤝', retail: '🛒', food: '🍳', logistics: '🚚',
  technical: '🔧', medical: '🏥', finance: '📈', media: '📸',
  creative: '🎨', public: '🏛️', education: '📚', tech: '💻',
  business: '💼', legal: '⚖️', criminal: '🕵️', none: '👤',
}

const CATEGORY_ACCENT: Record<string, string> = {
  care: 'rgba(244,114,182,0.12)', retail: 'rgba(251,191,36,0.1)',
  food: 'rgba(249,115,22,0.12)', logistics: 'rgba(234,179,8,0.1)',
  technical: 'rgba(99,102,241,0.12)', medical: 'rgba(239,68,68,0.1)',
  finance: 'rgba(16,185,129,0.12)', media: 'rgba(168,85,247,0.12)',
  creative: 'rgba(236,72,153,0.12)', public: 'rgba(59,130,246,0.12)',
  education: 'rgba(96,165,250,0.1)', tech: 'rgba(124,92,255,0.12)',
  business: 'rgba(245,158,11,0.12)', legal: 'rgba(148,163,184,0.1)',
}

const CATEGORY_SKILL_HINTS: Record<string, { key: keyof PlayerSkills; label: string; emoji: string }[]> = {
  care:      [{ key: 'socialSkill',   label: 'Socialità',  emoji: '💬' }, { key: 'charisma',     label: 'Carisma',    emoji: '✨' }],
  retail:    [{ key: 'socialSkill',   label: 'Socialità',  emoji: '💬' }, { key: 'charisma',     label: 'Carisma',    emoji: '✨' }],
  food:      [{ key: 'creativity',    label: 'Creatività', emoji: '🎨' }, { key: 'discipline',   label: 'Disciplina', emoji: '🎯' }],
  logistics: [{ key: 'athleticism',   label: 'Atletica',   emoji: '💪' }, { key: 'discipline',   label: 'Disciplina', emoji: '🎯' }],
  technical: [{ key: 'academicSkill', label: 'Accademico', emoji: '🧠' }, { key: 'discipline',   label: 'Disciplina', emoji: '🎯' }],
  medical:   [{ key: 'academicSkill', label: 'Accademico', emoji: '🧠' }, { key: 'discipline',   label: 'Disciplina', emoji: '🎯' }],
  finance:   [{ key: 'academicSkill', label: 'Accademico', emoji: '🧠' }, { key: 'leadership',   label: 'Leadership', emoji: '👑' }],
  media:     [{ key: 'creativity',    label: 'Creatività', emoji: '🎨' }, { key: 'charisma',     label: 'Carisma',    emoji: '✨' }],
  creative:  [{ key: 'creativity',    label: 'Creatività', emoji: '🎨' }, { key: 'music',        label: 'Musica',     emoji: '🎵' }],
  public:    [{ key: 'leadership',    label: 'Leadership', emoji: '👑' }, { key: 'charisma',     label: 'Carisma',    emoji: '✨' }],
  education: [{ key: 'academicSkill', label: 'Accademico', emoji: '🧠' }, { key: 'socialSkill',  label: 'Socialità',  emoji: '💬' }],
  tech:      [{ key: 'academicSkill', label: 'Accademico', emoji: '🧠' }, { key: 'creativity',   label: 'Creatività', emoji: '🎨' }],
  business:  [{ key: 'leadership',    label: 'Leadership', emoji: '👑' }, { key: 'charisma',     label: 'Carisma',    emoji: '✨' }],
  legal:     [{ key: 'academicSkill', label: 'Accademico', emoji: '🧠' }, { key: 'charisma',     label: 'Carisma',    emoji: '✨' }],
}

const WORK_REP_CONFIG: Record<WorkReputationStatus, { label: string; color: string; bg: string }> = {
  nuovo:       { label: 'Nuovo',        color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  affidabile:  { label: 'Affidabile',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  ambizioso:   { label: 'Ambizioso',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  lecchino:    { label: 'Lecchino',     color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  tossico:     { label: 'Tossico',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  genio:       { label: 'Genio',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  pigro:       { label: 'Pigro',        color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  leader:      { label: 'Leader',       color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  problematico:{ label: 'Problematico', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const STATUS_CONFIG: Record<WorkNPC['status'], { color: string; label: string }> = {
  neutral:  { color: '#94a3b8', label: 'Neutrale' },
  friendly: { color: '#22c55e', label: 'Amichevole' },
  tense:    { color: '#f59e0b', label: 'Teso' },
  hostile:  { color: '#ef4444', label: 'Ostile' },
}

function formatSalary(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `€${(n / 1_000).toFixed(0)}k`
  return `€${n}`
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ padding: '9px 0 7px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)' }}>
        {label}
      </span>
    </div>
  )
}

interface ActionRowProps {
  emoji: string
  label: string
  subtitle: string
  type?: 'arrow' | 'action'
  barVal?: number
  barColor?: string
  barLabel?: string
  onClick: () => void
  danger?: boolean
}

function ActionRow({ emoji, label, subtitle, type = 'action', barVal, barColor, barLabel, onClick, danger }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className="tap-scale"
      style={{
        width: '100%', padding: '13px 0',
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'transparent', border: 'none', cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
        border: danger ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: danger ? '#fca5a5' : 'var(--color-text)', marginBottom: barVal != null ? 4 : 1, lineHeight: 1.25 }}>
          {label}
        </p>
        {barVal != null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{barLabel ?? subtitle}</span>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${barVal}%`, background: barColor ?? '#22c55e', borderRadius: 4 }} />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>{subtitle}</p>
        )}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: type === 'arrow' ? 18 : 15, flexShrink: 0 }}>
        {type === 'arrow' ? '›' : '···'}
      </span>
    </button>
  )
}

export function CareerScreen() {
  const career = useGameStore(s => s.career)
  const time = useGameStore(s => s.time)
  const state = useGameStore(s => s)
  const applyForJob = useGameStore(s => s.applyForJob)
  const quitJob = useGameStore(s => s.quitJob)
  const attemptPromotion = useGameStore(s => s.attemptPromotion)
  const askForRaise = useGameStore(s => s.askForRaise)
  const writeBook = useGameStore(s => s.writeBook)
  const workHarder = useGameStore(s => s.workHarder)
  const reportColleagueToHR = useGameStore(s => s.reportColleagueToHR)
  const workInteract = useGameStore(s => s.workInteract)

  const showPanel = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const [view, setView] = useState<'main' | 'offers' | 'colleagues' | 'history' | 'hrTarget'>('main')
  const [detailColleagueId, setDetailColleagueId] = useState<string | null>(null)

  const flash = (msg: string, ok: boolean, emoji = '💼', effects: Record<string, number> = {}) => {
    feedback(ok ? 'success' : 'error')
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => closePanel(), 3500)
  }

  const detailColleague = detailColleagueId
    ? (career.colleagues ?? []).find(c => c.id === detailColleagueId) ?? null
    : null

  const hasDiploma = state.education.completedLevels.some(l =>
    ['highschool', 'vocational', 'bachelor', 'master', 'phd', 'mba', 'medical', 'law'].includes(l)
  )
  const isMinor = time.age < 18

  const availableJobs = getAllJobs()
    .filter(j => CareerEngine.meetsRequirements(j, state))
    .filter(j => {
      if (j.contractType === 'unemployed' || j.contractType === 'student') return false
      if (isMinor && j.contractType === 'full_time') return false
      if (!hasDiploma && j.contractType === 'full_time' && j.requirements.minAge >= 18) return false
      return true
    })

  // --- Colleague detail ---
  if (detailColleague) {
    return (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <button onClick={() => setDetailColleagueId(null)} style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          ← Torna
        </button>
        <Suspense fallback={null}>
          <WorkNpcDetailModal
            npc={detailColleague}
            onInteract={(id, action) => {
              const r = workInteract(id, action as WorkAction)
              flash(r.message, r.success, '🤝', r.effects as Record<string, number>)
            }}
          />
        </Suspense>
      </div>
    )
  }

  // --- Colleagues list ---
  if (view === 'colleagues') {
    const colleagues = career.colleagues ?? []
    return (
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
        <button onClick={() => setView('main')} style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          ← Torna
        </button>
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>👥 Colleghi</p>
          {colleagues.length === 0 ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>👋</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Nuovo lavoro — colleghi ancora sconosciuti.</p>
            </div>
          ) : colleagues.map(colleague => {
            const statusCfg = STATUS_CONFIG[colleague.status]
            const affectionColor = colleague.affection >= 70 ? '#10b981' : colleague.affection >= 40 ? '#f59e0b' : '#f43f5e'
            return (
              <div key={colleague.id} className="card tap-scale" style={{ padding: '12px 14px', cursor: 'pointer', marginBottom: 8 }} onClick={() => setDetailColleagueId(colleague.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: 'rgba(99,102,241,0.1)', border: '1.5px solid rgba(99,102,241,0.25)' }}>{colleague.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{colleague.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99, background: `${statusCfg.color}22`, color: statusCfg.color }}>{statusCfg.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{colleague.role}</p>
                    <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 5 }}>
                      <div style={{ height: '100%', width: `${colleague.affection}%`, background: affectionColor, borderRadius: 99 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', flexShrink: 0 }}>›</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // --- HR target selection ---
  if (view === 'hrTarget') {
    const colleagues = career.colleagues ?? []
    return (
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
        <button onClick={() => setView('main')} style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          ← Torna
        </button>
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>📋 Risorse Umane</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Seleziona il collega da segnalare all'ufficio HR.</p>
          {colleagues.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Nessun collega disponibile.</p>
          ) : colleagues.map(c => (
            <button key={c.id} onClick={() => { const r = reportColleagueToHR(c.id); flash(r.message, r.success, '📋', r.effects as Record<string, number>); setView('main') }}
              className="tap-scale" style={{ width: '100%', padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{c.name}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{c.role} · {STATUS_CONFIG[c.status].label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // --- Job offers list ---
  if (view === 'offers') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
        <button onClick={() => setView('main')} style={{ padding: '0 0 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          ← Torna
        </button>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🔍 Offerte di Lavoro</p>
        {isMinor && (
          <div style={{ borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
            👦 Minorenne — solo lavori part-time e freelance.
          </div>
        )}
        {availableJobs.length === 0 && (
          <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Mercato silenzioso</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {isMinor ? 'I lavori arriveranno con l\'età e la scuola.' : 'Studia o fai esperienza per sbloccare offerte.'}
            </p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {availableJobs.map(job => {
            const isCurrent = career.currentJob?.id === job.id
            const catEmoji = CATEGORY_EMOJI[job.category] ?? '💼'
            const catAccent = CATEGORY_ACCENT[job.category] ?? 'rgba(124,92,255,0.08)'
            return (
              <div key={job.id} className="card" style={{
                padding: '14px 14px 12px',
                background: isCurrent ? 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, var(--bg-card) 70%)' : `linear-gradient(135deg, ${catAccent} 0%, var(--bg-card) 70%)`,
                border: isCurrent ? '1px solid rgba(34,197,94,0.35)' : '1px solid var(--border-soft)',
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-soft)', fontSize: 22 }}>{catEmoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{job.title}</p>
                    {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.12)', padding: '1px 7px', borderRadius: 99 }}>✅ Attuale</span>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#18D39E', fontSize: 15, fontWeight: 800 }}>{formatSalary(job.salaryMin)}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-faint)' }}>fino a {formatSalary(job.salaryMax)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-secondary)' }}>{getContractLabel(job.contractType)}</span>
                  {job.requirements.cleanRecord && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(234,179,8,0.12)', color: '#fde047' }}>🧾 Fedina pulita</span>}
                </div>
                {CATEGORY_SKILL_HINTS[job.category] && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {CATEGORY_SKILL_HINTS[job.category].map(({ key, label, emoji }) => {
                      const val = (state.skills as unknown as Record<string, number>)[key] ?? 0
                      const isStrong = val >= 35
                      return (
                        <span key={key} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: isStrong ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: isStrong ? '#4ade80' : 'var(--color-text-secondary)', fontWeight: isStrong ? 600 : 400 }}>
                          {emoji} {label}{val > 0 ? ` ${val}` : ''}
                        </span>
                      )
                    })}
                    {getCategorySkillBonus(job.category, state.skills) >= 0.06 && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(124,92,255,0.15)', color: '#a78bfa', fontWeight: 700 }}>⚡ Skill boost</span>
                    )}
                  </div>
                )}
                {!isCurrent && (
                  <button onClick={() => { const r = applyForJob(job.id); flash(r.message, r.success, '💼', r.effects as Record<string, number>); if (r.success) setView('main') }}
                    className="tap-scale" style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Candidati
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // --- History ---
  if (view === 'history') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
        <button onClick={() => setView('main')} style={{ padding: '0 0 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          ← Torna
        </button>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>📋 Storico Carriera</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {career.jobHistory.length === 0 && (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Nessuna storia lavorativa ancora.</p>
            </div>
          )}
          {[...career.jobHistory].reverse().map((job, i) => (
            <div key={i} className="card" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: 14 }}>{job.title}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{job.company} · {job.startYear}</p>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>€{job.salary.toLocaleString('it-IT')}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- Main view ---
  const job = career.currentJob
  const repCfg = WORK_REP_CONFIG[career.workReputation ?? 'nuovo']
  const avgColleagueAffection = (career.colleagues ?? []).length > 0
    ? (career.colleagues ?? []).reduce((s, c) => s + c.affection, 0) / (career.colleagues ?? []).length
    : 0

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>

      {/* Job header card */}
      {job ? (
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              {CATEGORY_EMOJI[job.packId?.split('_')[0] ?? ''] ?? '💼'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>{job.title}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{job.company}</p>
              {/* Performance bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', width: 72, flexShrink: 0 }}>Prestazione</span>
                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${job.promotionChance * 100}%`, background: '#22c55e', borderRadius: 4 }} />
                </div>
              </div>
              {/* Stress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', width: 72, flexShrink: 0 }}>Stress</span>
                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${job.stressLevel}%`, background: '#f43f5e', borderRadius: 4 }} />
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#86efac' }}>€{job.salary.toLocaleString('it-IT')}</p>
              <p style={{ fontSize: 9, color: 'var(--text-faint)' }}>/mese</p>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: repCfg.bg, color: repCfg.color, fontWeight: 600 }}>
              {repCfg.label}
            </span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)' }}>
              Dal {job.startYear}
            </span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)' }}>
              {career.promotions} promozioni
            </span>
          </div>

          <SectionLabel label="Attività" />

          <ActionRow emoji="👥" label="Colleghi" subtitle={`${(career.colleagues ?? []).length} colleghi`} type="arrow" barVal={avgColleagueAffection} barColor="#a78bfa" barLabel="Popolarità" onClick={() => setView('colleagues')} />
          <ActionRow emoji="💪" label="Lavora di Più" subtitle="Metti impegno extra per impressionare il capo" onClick={() => { const r = workHarder(); flash(r.message, r.success, '💪', r.effects as Record<string, number>) }} />
          <ActionRow emoji="📈" label="Promozione" subtitle="Chiedi di salire di grado" onClick={() => { const r = attemptPromotion(); flash(r.message, r.success, '📈', r.effects as Record<string, number>) }} />
          <ActionRow emoji="💶" label="Aumento" subtitle="Chiedi un aumento di stipendio" onClick={() => { const r = askForRaise(); flash(r.message, r.success, '💶', r.effects as Record<string, number>) }} />
          <ActionRow emoji="📋" label="Risorse Umane" subtitle="Segnala un collega all'ufficio HR" type="arrow" onClick={() => setView('hrTarget')} />
          {time.age >= 18 && <ActionRow emoji="📚" label="Scrivi un Libro" subtitle="Usa il tempo libero per scrivere un romanzo" onClick={() => { const r = writeBook(); flash(r.message, r.success, '📚', r.effects as Record<string, number>) }} />}
          <ActionRow emoji="📋" label="Storico Lavori" subtitle="Guarda i tuoi impieghi precedenti" type="arrow" onClick={() => setView('history')} />
          <ActionRow emoji="🚪" label="Licenziati" subtitle="Abbandona il lavoro attuale" danger onClick={() => { const r = quitJob(); flash(r.message, r.success, '🚪', r.effects as Record<string, number>) }} />
        </div>
      ) : (
        <div style={{ padding: '14px 16px' }}>
          {/* No job — show job seeker state */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>😴</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Disoccupato/a</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{time.year} · Cerca un lavoro per iniziare la tua carriera</p>
            </div>
          </div>

          <SectionLabel label="Attività" />
          <ActionRow emoji="🔍" label="Cerca Lavoro" subtitle="Sfoglia le offerte di lavoro disponibili" type="arrow" onClick={() => setView('offers')} />
          {time.age >= 18 && <ActionRow emoji="📚" label="Scrivi un Libro" subtitle="Usa il tempo libero per scrivere un romanzo" onClick={() => { const r = writeBook(); flash(r.message, r.success, '📚', r.effects as Record<string, number>) }} />}
          <ActionRow emoji="📋" label="Storico Lavori" subtitle="Guarda i tuoi impieghi precedenti" type="arrow" onClick={() => setView('history')} />
        </div>
      )}
    </div>
  )
}
