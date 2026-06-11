import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { CareerEngine, getAllJobs, getContractLabel, getCategorySkillBonus } from '../../services/CareerEngine'
import { useToastStore } from '../../store/toastStore'
import { haptic } from '../../services/HapticEngine'
import { ContextualHint } from '../game/ContextualHint'
import type { WorkAction, WorkNPC, WorkReputationStatus, PlayerSkills } from '../../store/types'

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

const CATEGORY_EMOJI: Record<string, string> = {
  care:      '🤝', retail:    '🛒', food:      '🍳', logistics: '🚚',
  technical: '🔧', medical:   '🏥', finance:   '📈', media:     '📸',
  creative:  '🎨', public:    '🏛️', education: '📚', tech:      '💻',
  business:  '💼', legal:     '⚖️', criminal:  '🕵️', none:      '👤',
}

const CATEGORY_ACCENT: Record<string, string> = {
  care:      'rgba(244,114,182,0.12)', retail:    'rgba(251,191,36,0.1)',
  food:      'rgba(249,115,22,0.12)',  logistics: 'rgba(234,179,8,0.1)',
  technical: 'rgba(99,102,241,0.12)', medical:   'rgba(239,68,68,0.1)',
  finance:   'rgba(16,185,129,0.12)', media:     'rgba(168,85,247,0.12)',
  creative:  'rgba(236,72,153,0.12)', public:    'rgba(59,130,246,0.12)',
  education: 'rgba(96,165,250,0.1)',  tech:      'rgba(124,92,255,0.12)',
  business:  'rgba(245,158,11,0.12)', legal:     'rgba(148,163,184,0.1)',
}

const JOB_TAGLINE: Record<string, string> = {
  babysitter:        'Tieni d\'occhio piccoli terremoti dopo scuola.',
  cashier:           'Il sorriso professionale non è negoziabile.',
  barista:           'Cappuccini perfetti e clienti mattinieri.',
  delivery_rider:    'Ogni consegna è una corsa contro l\'orologio.',
  mechanic:          'Dai vita ai motori quando tutti li danno per morti.',
  chef:              'L\'adrenalina della cucina non ha eguali.',
  nurse:             'Cura chi non può curarsi da solo.',
  accountant:        'I numeri raccontano storie che nessuno legge.',
  journalist:        'La verità prima o poi trova la sua via.',
  designer:          'Trasforma idee astratte in pixel concreti.',
  police:            'Ordine, rispetto, presenza sul campo.',
  social_worker:     'Chi aiuta gli altri dimentica spesso se stesso.',
  architect:         'Disegna spazi che cambieranno la vita delle persone.',
  psychologist:      'Ascolti quello che le parole non dicono.',
  manager:           'Decidi, coordini, dai il ritmo alla squadra.',
  programmer:        'Il codice è il linguaggio del futuro.',
  teacher:           'Formi menti prima ancora che carriere.',
  doctor:            'Ogni diagnosi è una responsabilità enorme.',
  lawyer:            'Le parole giuste possono cambiare tutto.',
  criminal_petty:    'Rischi, ma i guadagni sono rapidi.',
  electrician:       'Porti la luce dove c\'è il buio.',
  plumber:           'Il tuo telefono squilla sempre all\'ora peggiore.',
  firefighter:       'Entri dove tutti scappano.',
  paramedic:         'I secondi contano e tu lo sai.',
  pilot:             'Il cielo è il tuo ufficio.',
  pharmacist:        'Il medicinale giusto nella dose giusta.',
  veterinarian:      'Loro non parlano ma tu li capisci.',
  personal_trainer:  'Spingi gli altri oltre i loro limiti.',
  real_estate_agent: 'Ogni appartamento è un sogno da vendere.',
  influencer:        'Il tuo telefono è la tua azienda.',
  game_developer:    'Crei mondi che altri abitano.',
  data_scientist:    'Trasformi dati grezzi in decisioni intelligenti.',
  entrepreneur:      'Zero sicurezze, infinite possibilità.',
  event_planner:     'Il chaos è il tuo ambiente naturale.',
  security_guard:    'Presenza, vigilanza, deterrenza silenziosa.',
  translator:        'Sei il ponte tra due mondi.',
  tattoo_artist:     'L\'arte rimane sulla pelle per sempre.',
  life_coach:        'Aiuti chi non sa ancora dove andare.',
}

const TRAIT_CONFIG: Record<string, { emoji: string; color: string }> = {
  introverso:  { emoji: '🤫', color: '#94a3b8' },
  ambizioso:   { emoji: '🔥', color: '#f59e0b' },
  geloso:      { emoji: '💚', color: '#22c55e' },
  generoso:    { emoji: '🤝', color: '#f472b6' },
  sensibile:   { emoji: '💙', color: '#60a5fa' },
  sicuro:      { emoji: '😎', color: '#a78bfa' },
  avido:       { emoji: '💰', color: '#fbbf24' },
  leale:       { emoji: '🛡️', color: '#38bdf8' },
  empatico:    { emoji: '💫', color: '#ec4899' },
  impulsivo:   { emoji: '⚡', color: '#ef4444' },
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

const WORK_ACTIONS: Array<{ action: WorkAction; label: string; emoji: string }> = [
  { action: 'talk',       label: 'Parla',     emoji: '💬' },
  { action: 'socialize',  label: 'Esci',      emoji: '☕' },
  { action: 'help',       label: 'Aiuta',     emoji: '🤝' },
  { action: 'compliment', label: 'Complimenta', emoji: '😊' },
  { action: 'gossip',     label: 'Gossip',    emoji: '🗣️' },
  { action: 'fight',      label: 'Litiga',    emoji: '😠' },
]

const STATUS_CONFIG: Record<WorkNPC['status'], { color: string; label: string }> = {
  neutral:  { color: '#94a3b8', label: 'Neutrale' },
  friendly: { color: '#22c55e', label: 'Amichevole' },
  tense:    { color: '#f59e0b', label: 'Teso' },
  hostile:  { color: '#ef4444', label: 'Ostile' },
}

function stressConfig(level: number) {
  if (level >= 70) return { label: 'Stress alto',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  if (level >= 45) return { label: 'Stress medio',  color: '#f97316', bg: 'rgba(249,115,22,0.12)' }
  return               { label: 'Stress basso',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
}

function formatSalary(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `€${(n / 1_000).toFixed(0)}k`
  return `€${n}`
}

export function CareerScreen() {
  const career = useGameStore(s => s.career)
  const time = useGameStore(s => s.time)
  const state = useGameStore(s => s)
  const applyForJob = useGameStore(s => s.applyForJob)
  const quitJob = useGameStore(s => s.quitJob)
  const attemptPromotion = useGameStore(s => s.attemptPromotion)
  const askForRaise = useGameStore(s => s.askForRaise)

  const workInteract = useGameStore(s => s.workInteract)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'offers' | 'colleagues' | 'history'>('offers')
  const [expandedColleague, setExpandedColleague] = useState<string | null>(null)

  const showPanel = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const flash = (msg: string, ok: boolean, emoji = '💼', effects: Record<string, number> = {}) => {
    haptic(ok ? 'success' : 'error')
    setFeedback({ msg, ok })
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => { setFeedback(null); closePanel() }, 3500)
  }

  const handleApply = (jobId: string) => {
    const r = applyForJob(jobId)
    flash(r.message, r.success, '💼', r.effects as Record<string, number>)
  }

  const handleQuit = () => {
    const r = quitJob()
    flash(r.message, r.success, '🚪', r.effects as Record<string, number>)
  }

  const handlePromotion = () => {
    const r = attemptPromotion()
    flash(r.message, r.success, '📈', r.effects as Record<string, number>)
  }

  const handleAskRaise = () => {
    const r = askForRaise()
    flash(r.message, r.success, '💶', r.effects as Record<string, number>)
  }

  const handleWorkInteract = (colleagueId: string, action: WorkAction) => {
    const r = workInteract(colleagueId, action)
    flash(r.message, r.success, '🤝', r.effects as Record<string, number>)
  }

  const hasDiploma = state.education.completedLevels.some(l =>
    ['highschool', 'vocational', 'bachelor', 'master', 'phd', 'mba', 'medical', 'law'].includes(l)
  )
  const isMinor = time.age < 18

  const availableJobs = getAllJobs()
    .filter(j => CareerEngine.meetsRequirements(j, state))
    // minors can only access part_time and freelance; full_time blocked without diploma
    .filter(j => {
      if (j.contractType === 'unemployed' || j.contractType === 'student') return false
      if (isMinor && j.contractType === 'full_time') return false
      if (!hasDiploma && j.contractType === 'full_time' && j.requirements.minAge >= 18) return false
      return true
    })

  const burnoutColor =
    career.burnoutLevel >= 80 ? '#ef4444'
    : career.burnoutLevel >= 50 ? '#eab308'
    : '#22c55e'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>💼 Carriera</h2>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{time.year}</span>
      </div>

      <ContextualHint
        sectionKey="career"
        emoji="💼"
        color="#f59e0b"
        message="Trova un lavoro adatto alla tua età e istruzione. Più studi, meglio pagato sarà il lavoro. Usa 'Interagisci' per costruire relazioni coi colleghi."
      />

      {/* Teen notice */}
      {isMinor && (
        <div style={{ borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
          👦 Minorenne — disponibili solo lavori part-time e freelance. Lavori full-time sbloccati dopo il diploma.
        </div>
      )}

      {/* Current job card */}
      <div className="card" style={{ marginBottom: 12, padding: 14 }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Lavoro attuale
        </p>
        {career.currentJob ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15 }}>{career.currentJob.title}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{career.currentJob.company}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#10b981', fontWeight: 700 }}>€{career.currentJob.salary.toLocaleString('it-IT')}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>/mese</p>
              </div>
            </div>

            {/* Stress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                <span>Stress</span><span>{career.currentJob.stressLevel}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${career.currentJob.stressLevel}%`, background: '#f97316', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            </div>

            {/* Burnout */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                <span>Burnout</span><span>{career.burnoutLevel}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${career.burnoutLevel}%`, background: burnoutColor, borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>
                {getContractLabel(career.currentJob.contractType)}
              </span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' }}>
                Dal {career.currentJob.startYear}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <button
                onClick={handlePromotion}
                style={{ flex: 1, minWidth: 110, padding: '8px 0', borderRadius: 12, background: 'rgba(234,179,8,0.2)', color: '#fde047', fontSize: 13, fontWeight: 500, border: '1px solid rgba(234,179,8,0.3)', cursor: 'pointer' }}
              >
                📈 Promozione
              </button>
              <button
                onClick={handleAskRaise}
                style={{ flex: 1, minWidth: 110, padding: '8px 0', borderRadius: 12, background: 'rgba(16,185,129,0.18)', color: '#6ee7b7', fontSize: 13, fontWeight: 500, border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}
              >
                💶 Chiedi aumento
              </button>
              <button
                onClick={handleQuit}
                style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 13, fontWeight: 500, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}
              >
                🚪 Dimetti
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 10 }}>Attualmente disoccupato/a.</p>
            <button
              onClick={() => setTab('offers')}
              style={{ width: '100%', padding: '9px 0', borderRadius: 12, background: 'var(--color-cta)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none' }}
            >
              🔍 Cerca lavoro
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Promozioni', val: career.promotions, emoji: '⭐' },
          { label: 'Licenziamenti', val: career.firings, emoji: '🔴' },
          { label: 'Pensione', val: `€${Math.round(career.pensionContributions).toLocaleString('it-IT')}`, emoji: '🏦' },
        ].map(({ label, val, emoji }) => (
          <div key={label} className="card" style={{ padding: '10px 6px', textAlign: 'center' }}>
            <p style={{ fontSize: 16 }}>{emoji}</p>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>{val}</p>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Work reputation badge */}
      {career.currentJob && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Reputazione:</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
            background: WORK_REP_CONFIG[career.workReputation ?? 'nuovo'].bg,
            color: WORK_REP_CONFIG[career.workReputation ?? 'nuovo'].color,
          }}>
            {WORK_REP_CONFIG[career.workReputation ?? 'nuovo'].label}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {([
          { id: 'offers', label: '🔍 Offerte' },
          { id: 'colleagues', label: `👥 Colleghi${career.colleagues?.length ? ` (${career.colleagues.length})` : ''}` },
          { id: 'history', label: '📋 Storico' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: 12, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t.id ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t.id ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Offers list */}
      {tab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {availableJobs.length > 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {availableJobs.length} {availableJobs.length === 1 ? 'offerta disponibile' : 'offerte disponibili'}
            </p>
          )}
          {availableJobs.length === 0 && (
            <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                Mercato silenzioso
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {isMinor
                  ? 'Sei ancora giovane. I lavori arriveranno con l\'età e la scuola.'
                  : 'Il mercato non ti considera ancora. Studia, fai esperienza o abbassa le aspettative.'
                }
              </p>
            </div>
          )}
          {availableJobs.map(job => {
            const isCurrent = career.currentJob?.id === job.id
            const catEmoji = CATEGORY_EMOJI[job.category] ?? '💼'
            const catAccent = CATEGORY_ACCENT[job.category] ?? 'rgba(124,92,255,0.08)'
            const tagline = JOB_TAGLINE[job.id] ?? ''
            const stress = stressConfig(job.stressLevel)
            return (
              <div
                key={job.id}
                className="card tap-scale"
                style={{
                  padding: '14px 14px 12px',
                  background: isCurrent
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, var(--bg-card) 70%)'
                    : `linear-gradient(135deg, ${catAccent} 0%, var(--bg-card) 70%)`,
                  border: isCurrent ? '1px solid rgba(34,197,94,0.35)' : '1px solid var(--border-soft)',
                }}
              >
                {/* Row 1: icon + title + salary */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: tagline ? 6 : 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-soft)',
                    fontSize: 22,
                  }}>
                    {catEmoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)', marginBottom: 1 }}>{job.title}</p>
                    {isCurrent && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.12)', padding: '1px 7px', borderRadius: 99, border: '1px solid rgba(34,197,94,0.25)' }}>
                        ✅ Lavoro attuale
                      </span>
                    )}
                  </div>
                  {/* Salary chip */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#18D39E', fontSize: 15, fontWeight: 800, lineHeight: 1 }}>
                      {formatSalary(job.salaryMin)}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>
                      fino a {formatSalary(job.salaryMax)}
                    </p>
                  </div>
                </div>

                {/* Tagline */}
                {tagline && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 10, paddingLeft: 56 }}>
                    {tagline}
                  </p>
                )}

                {/* Badges row */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: stress.bg, color: stress.color, fontWeight: 600, border: `1px solid ${stress.color}33` }}>
                    {stress.label}
                  </span>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-secondary)', border: '1px solid var(--border-soft)' }}>
                    {getContractLabel(job.contractType)}
                  </span>
                  {job.requirements.cleanRecord && (
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(234,179,8,0.12)', color: '#fde047', border: '1px solid rgba(234,179,8,0.25)' }}>
                      🧾 Fedina pulita
                    </span>
                  )}
                  {job.requirements.minAge > 0 && (
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', color: 'var(--text-faint)', border: '1px solid var(--border-soft)' }}>
                      {job.requirements.minAge}+ anni
                    </span>
                  )}
                </div>

                {/* Skill hints + boost badge */}
                {CATEGORY_SKILL_HINTS[job.category] && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-faint)', alignSelf: 'center' }}>skill utili:</span>
                    {CATEGORY_SKILL_HINTS[job.category].map(({ key, label, emoji }) => {
                      const val = (state.skills as unknown as Record<string, number>)[key] ?? 0
                      const isStrong = val >= 35
                      return (
                        <span key={key} style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99,
                          background: isStrong ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                          color: isStrong ? '#4ade80' : 'var(--color-text-secondary)',
                          border: `1px solid ${isStrong ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          fontWeight: isStrong ? 600 : 400,
                        }}>
                          {emoji} {label}{val > 0 ? ` ${val}` : ''}
                        </span>
                      )
                    })}
                    {getCategorySkillBonus(job.category, state.skills) >= 0.06 && (
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 99,
                        background: 'rgba(124,92,255,0.15)', color: '#a78bfa',
                        border: '1px solid rgba(124,92,255,0.3)', fontWeight: 700,
                      }}>
                        ⚡ Skill boost attivo
                      </span>
                    )}
                  </div>
                )}

                {/* CTA */}
                {!isCurrent && (
                  <button
                    onClick={() => handleApply(job.id)}
                    className="tap-scale"
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: 12,
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
                      color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(124,92,255,0.3)',
                      letterSpacing: 0.3,
                    }}
                  >
                    Candidati
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Colleagues tab */}
      {tab === 'colleagues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!career.currentJob ? (
            <div className="card" style={{ padding: '28px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                Nessun collega attivo
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Trova un lavoro per incontrare colleghi con cui costruire relazioni.
              </p>
            </div>
          ) : (career.colleagues ?? []).length === 0 ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Nuovo lavoro — colleghi ancora sconosciuti.
              </p>
            </div>
          ) : (
            (career.colleagues ?? []).map(colleague => {
              const isExpanded = expandedColleague === colleague.id
              const statusCfg = STATUS_CONFIG[colleague.status]
              const isPromoted = !!colleague.promotedToRelId
              return (
                <div key={colleague.id} className="card" style={{ padding: '12px 14px' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => setExpandedColleague(isExpanded ? null : colleague.id)}
                  >
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{colleague.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{colleague.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {colleague.role} · {colleague.age} anni
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: `${statusCfg.color}22`, color: statusCfg.color,
                      }}>
                        {statusCfg.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                        {colleague.affection}% affinità
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 10 }}>
                      {/* Trait badges */}
                      {colleague.personalityTraits.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                          {colleague.personalityTraits.map(trait => {
                            const tc = TRAIT_CONFIG[trait] ?? { emoji: '🔹', color: '#94a3b8' }
                            return (
                              <span key={trait} title={trait} style={{
                                fontSize: 10, padding: '2px 7px', borderRadius: 99,
                                background: `${tc.color}15`, color: tc.color,
                                border: `1px solid ${tc.color}30`,
                              }}>
                                {tc.emoji} {trait}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* Affection bar */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                          <span>Affinità</span><span>{colleague.affection}/100</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${colleague.affection}%`, background: '#22c55e', borderRadius: 4, transition: 'width 0.3s' }} />
                        </div>
                      </div>

                      {isPromoted ? (
                        <p style={{ fontSize: 12, color: '#4ade80', marginBottom: 8 }}>
                          ✅ {colleague.name} è diventato/a tuo amico/a!
                        </p>
                      ) : (
                        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                          Porta l'affinità a 65+ per promuoverlo/a come amico/a reale.
                        </p>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                        {WORK_ACTIONS.map(({ action, label, emoji }) => (
                          <button
                            key={action}
                            onClick={() => handleWorkInteract(colleague.id, action)}
                            style={{
                              padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 500,
                              background: action === 'fight' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.07)',
                              color: action === 'fight' ? '#fca5a5' : 'var(--color-text)',
                              border: `1px solid ${action === 'fight' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
                              cursor: 'pointer', textAlign: 'center',
                            }}
                          >
                            {emoji}<br />{label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* History list */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {career.jobHistory.length === 0 && (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                Nessuna storia lavorativa.
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                I tuoi lavori passati appariranno qui. La carriera inizia con il primo impiego.
              </p>
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
      )}
    </div>
  )
}
