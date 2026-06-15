import { lazy, Suspense, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { EducationEngine, getEducationLabel } from '../../services/EducationEngine'
import { useToastStore } from '../../store/toastStore'
import { haptic } from '../../services/HapticEngine'
import type { EducationLevel, SchoolAction, SchoolNPC, SchoolReputationStatus } from '../../store/types'

const SchoolNpcDetailModal = lazy(() =>
  import('../relationships/SchoolNpcDetailModal').then(m => ({ default: m.SchoolNpcDetailModal })))

const LEVEL_EMOJI: Record<EducationLevel, string> = {
  none: '❌', kindergarten: '🧒', elementary: '📒', middle: '📗', highschool: '🎒',
  vocational: '🔧', bachelor: '🎓', master: '📜', phd: '🔬', mba: '💼', medical: '⚕️', law: '⚖️',
}

const SCHOOL_REP_CONFIG: Record<SchoolReputationStatus, { label: string; color: string; bg: string }> = {
  invisibile:   { label: 'Invisibile',   color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  popolare:     { label: 'Popolare',     color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  nerd:         { label: 'Nerd',         color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  atleta:       { label: 'Atleta',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  ribelle:      { label: 'Ribelle',      color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  problematico: { label: 'Problematico', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  leader:       { label: 'Leader',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  artista:      { label: 'Artista',      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}

const STATUS_LABELS: Record<SchoolNPC['status'], { color: string; label: string }> = {
  neutral:  { color: '#94a3b8', label: 'Neutrale' },
  friendly: { color: '#22c55e', label: 'Amichevole' },
  tense:    { color: '#f59e0b', label: 'Teso' },
  hostile:  { color: '#ef4444', label: 'Ostile' },
}

const ENROLLABLE_LEVELS: EducationLevel[] = ['vocational', 'bachelor', 'master', 'phd', 'mba', 'medical', 'law']

const CLUBS = [
  { id: 'sport',    label: 'Club Sportivo',   emoji: '⚽', hint: 'Atletica +2, Disciplina +1' },
  { id: 'music',    label: 'Club Musicale',   emoji: '🎸', hint: 'Musica +2, Creatività +1' },
  { id: 'academic', label: 'Club Accademico', emoji: '📚', hint: 'Accademico +2, Disciplina +1' },
  { id: 'art',      label: 'Club Arte',       emoji: '🎨', hint: 'Creatività +2, Carisma +1' },
  { id: 'debate',   label: 'Club Dibattito',  emoji: '🗣️', hint: 'Carisma +2, Leadership +1' },
]

const CLIQUES: { id: SchoolReputationStatus; emoji: string; desc: string }[] = [
  { id: 'popolare',     emoji: '😎', desc: 'I più cool della scuola' },
  { id: 'nerd',         emoji: '🤓', desc: 'I geni della classe' },
  { id: 'atleta',       emoji: '⚽', desc: 'Sportivi e atletici' },
  { id: 'artista',      emoji: '🎨', desc: 'Creativi e artisti' },
  { id: 'leader',       emoji: '👑', desc: 'I capi del gruppo' },
  { id: 'ribelle',      emoji: '🤘', desc: 'Contro le regole' },
  { id: 'invisibile',   emoji: '👻', desc: 'Preferiscono stare in disparte' },
  { id: 'problematico', emoji: '😈', desc: 'Sempre nei guai' },
]

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ padding: '9px 0 7px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
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
    <button onClick={onClick} className="tap-scale" style={{
      width: '100%', padding: '13px 0', display: 'flex', alignItems: 'center', gap: 14,
      background: 'transparent', border: 'none', cursor: 'pointer',
      borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
        border: danger ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
      }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: danger ? '#fca5a5' : 'var(--color-text)', marginBottom: barVal != null ? 4 : 1, lineHeight: 1.25 }}>{label}</p>
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

export function EducationScreen() {
  const education = useGameStore(s => s.education)
  const skills = useGameStore(s => s.skills)
  const state = useGameStore(s => s)
  const startEducation = useGameStore(s => s.startEducation)
  const studyAction = useGameStore(s => s.studyAction)
  const schoolInteract = useGameStore(s => s.schoolInteract)
  const joinClub = useGameStore(s => s.joinClub)
  const leaveClub = useGameStore(s => s.leaveClub)
  const skipClass = useGameStore(s => s.skipClass)
  const throwSchoolParty = useGameStore(s => s.throwSchoolParty)
  const visitSchoolNurse = useGameStore(s => s.visitSchoolNurse)
  const dropOutSchool = useGameStore(s => s.dropOutSchool)
  const attendSchoolDance = useGameStore(s => s.attendSchoolDance)
  const changeSchoolClique = useGameStore(s => s.changeSchoolClique)

  const showPanel = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const [view, setView] = useState<'main' | 'classmates' | 'clubs' | 'cliques' | 'enroll' | 'skills'>('main')
  const [detailNpcId, setDetailNpcId] = useState<string | null>(null)

  const flash = (msg: string, ok: boolean, emoji = '📚', effects: Record<string, number> = {}) => {
    haptic(ok ? 'success' : 'error')
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => closePanel(), 3500)
  }

  const detailNpc = detailNpcId ? (education.classmates ?? []).find(c => c.id === detailNpcId) ?? null : null

  if (detailNpc) {
    return (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <button onClick={() => setDetailNpcId(null)} style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>
          ← Torna
        </button>
        <Suspense fallback={null}>
          <SchoolNpcDetailModal
            npc={detailNpc}
            onInteract={(id, action) => {
              const r = schoolInteract(id, action as SchoolAction)
              flash(r.message, r.success, '🤝', r.effects as Record<string, number>)
            }}
          />
        </Suspense>
      </div>
    )
  }

  // --- Classmates view ---
  if (view === 'classmates') {
    const classmates = education.classmates ?? []
    return (
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
        <button onClick={() => setView('main')} style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>← Torna</button>
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>👥 Compagni & Professori</p>
          {classmates.length === 0 ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>👋</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Nuovo anno scolastico — compagni ancora sconosciuti.</p>
            </div>
          ) : classmates.map(npc => {
            const statusCfg = STATUS_LABELS[npc.status]
            const isProf = npc.role === 'professor' || npc.role === 'coach'
            const roleLabel = npc.role === 'professor' ? (npc.subject ? `Prof. ${npc.subject}` : 'Professore') : npc.role === 'coach' ? 'Allenatore' : 'Studente'
            const affectionColor = npc.affection >= 70 ? '#10b981' : npc.affection >= 40 ? '#f59e0b' : '#f43f5e'
            return (
              <div key={npc.id} className="card tap-scale" style={{ padding: '12px 14px', cursor: 'pointer', marginBottom: 8 }} onClick={() => setDetailNpcId(npc.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: isProf ? 'rgba(96,165,250,0.1)' : 'rgba(99,102,241,0.1)', border: `1.5px solid ${isProf ? 'rgba(96,165,250,0.25)' : 'rgba(99,102,241,0.25)'}` }}>{npc.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{npc.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99, background: `${statusCfg.color}22`, color: statusCfg.color }}>{statusCfg.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{roleLabel}</p>
                    <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 5 }}>
                      <div style={{ height: '100%', width: `${npc.affection}%`, background: affectionColor, borderRadius: 99 }} />
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

  // --- Clubs view ---
  if (view === 'clubs') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
        <button onClick={() => setView('main')} style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>← Torna</button>
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>🎪 Attività Extrascolastiche</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>{education.clubs.length}/2 club attivi</p>
          {education.clubs.length >= 2 && (
            <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 11, color: '#fbbf24', marginBottom: 12 }}>
              ⚠️ Limite di 2 club raggiunto. Lascia un club per entrarne in un altro.
            </div>
          )}
          {CLUBS.map(club => {
            const joined = education.clubs.includes(club.id)
            return (
              <div key={club.id} style={{ display: 'flex', alignItems: 'center', padding: '13px 0', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: joined ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${joined ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>{club.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: joined ? '#a5b4fc' : 'var(--color-text)' }}>{club.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{club.hint}</p>
                </div>
                {joined ? (
                  <button onClick={() => { const r = leaveClub(club.id); flash(r.message, r.success, club.emoji) }}
                    style={{ fontSize: 11, padding: '6px 14px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', fontWeight: 700 }}>
                    Lascia
                  </button>
                ) : (
                  <button onClick={() => { const r = joinClub(club.id); flash(r.message, r.success, club.emoji) }}
                    disabled={education.clubs.length >= 2}
                    style={{ fontSize: 11, padding: '6px 14px', borderRadius: 20, background: education.clubs.length >= 2 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.15)', color: education.clubs.length >= 2 ? 'var(--color-text-secondary)' : '#a5b4fc', border: `1px solid ${education.clubs.length >= 2 ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.3)'}`, cursor: education.clubs.length >= 2 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                    Entra
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // --- Cliques view ---
  if (view === 'cliques') {
    const repCfg = SCHOOL_REP_CONFIG[education.schoolReputation ?? 'invisibile']
    return (
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
        <button onClick={() => setView('main')} style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>← Torna</button>
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>🤝 Gruppi Scolastici</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Gruppo attuale: <span style={{ color: repCfg.color, fontWeight: 700 }}>{repCfg.label}</span></p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Scegli il gruppo a cui vuoi appartenere.</p>
          {CLIQUES.map(clique => {
            const isActive = education.schoolReputation === clique.id
            const cfg = SCHOOL_REP_CONFIG[clique.id]
            return (
              <button key={clique.id} onClick={() => { if (!isActive) { const r = changeSchoolClique(clique.id); flash(r.message, r.success, clique.emoji); setView('main') } }}
                className={isActive ? undefined : 'tap-scale'}
                style={{ width: '100%', padding: '12px 0', display: 'flex', alignItems: 'center', gap: 14, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: isActive ? 'default' : 'pointer', textAlign: 'left' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: isActive ? `${cfg.color}20` : 'rgba(255,255,255,0.06)', border: `1px solid ${isActive ? `${cfg.color}40` : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21 }}>{clique.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: isActive ? cfg.color : 'var(--color-text)' }}>{cfg.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{clique.desc}</p>
                </div>
                {isActive && <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, padding: '2px 8px', borderRadius: 99, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>Attuale</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // --- Enroll (university) view ---
  if (view === 'enroll') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
        <button onClick={() => setView('main')} style={{ padding: '0 0 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>← Torna</button>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>📝 Iscriviti all'Università</p>
        {ENROLLABLE_LEVELS.map(level => {
          const check = EducationEngine.canEnroll(level, state)
          const isCurrent = education.currentLevel === level
          const isCompleted = education.completedLevels.includes(level)
          return (
            <div key={level} className="card" style={{ padding: 14, marginBottom: 10, opacity: (!check.ok && !isCurrent && !isCompleted) ? 0.6 : 1, border: isCurrent ? '1px solid rgba(99,102,241,0.4)' : isCompleted ? '1px solid rgba(34,197,94,0.3)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{LEVEL_EMOJI[level]} {getEducationLabel(level)}</p>
                {isCompleted && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>✅ Completato</span>}
                {isCurrent && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>📖 In corso</span>}
              </div>
              {!check.ok && !isCurrent && !isCompleted && <p style={{ fontSize: 11, color: '#f97316', marginBottom: 6 }}>⛔ {check.reason}</p>}
              {check.ok && <button onClick={() => { const r = startEducation(level); flash(r.message, r.success, '🎓', r.effects as Record<string, number>); if (r.success) setView('main') }} style={{ width: '100%', padding: '9px 0', borderRadius: 12, background: 'rgba(233,69,96,0.15)', color: 'var(--color-cta)', fontSize: 13, fontWeight: 600, border: '1px solid rgba(233,69,96,0.3)', cursor: 'pointer' }}>Iscriviti</button>}
            </div>
          )
        })}
      </div>
    )
  }

  // --- Skills view ---
  if (view === 'skills') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
        <button onClick={() => setView('main')} style={{ padding: '0 0 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>← Torna</button>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>📊 Abilità & Progressi</p>
        <div className="card" style={{ padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'academicSkill', label: 'Accademico', color: '#60a5fa' },
              { key: 'discipline',    label: 'Disciplina',  color: '#a78bfa' },
              { key: 'creativity',    label: 'Creatività',  color: '#fbbf24' },
              { key: 'music',         label: 'Musica',      color: '#f472b6' },
              { key: 'athleticism',   label: 'Atletica',    color: '#4ade80' },
              { key: 'charisma',      label: 'Carisma',     color: '#fb923c' },
              { key: 'leadership',    label: 'Leadership',  color: '#e879f9' },
              { key: 'socialSkill',   label: 'Socialità',   color: '#38bdf8' },
            ].map(({ key, label, color }) => {
              const val = (skills as unknown as Record<string, number>)[key] ?? 0
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 80, flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 10, color, width: 24, textAlign: 'right', flexShrink: 0 }}>{val}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="card" style={{ padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4 }}>💸 Prestito</p>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#f97316' }}>€{education.studentLoan.toLocaleString('it-IT')}</p>
          </div>
          <div className="card" style={{ padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4 }}>🏆 Borse</p>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#f59e0b' }}>{education.scholarships.length}</p>
          </div>
        </div>
        {education.completedLevels.length > 0 && (
          <div className="card" style={{ padding: '12px 14px', marginTop: 10 }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Titoli conseguiti</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {education.completedLevels.map(lvl => (
                <span key={lvl} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
                  {LEVEL_EMOJI[lvl]} {getEducationLabel(lvl)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- Main view ---
  const inSchool = education.currentLevel !== 'none'
  const gpaColor = education.gpa >= 3.0 ? '#10b981' : education.gpa >= 2.0 ? '#f59e0b' : '#ef4444'
  const repCfg = SCHOOL_REP_CONFIG[education.schoolReputation ?? 'invisibile']
  const avgAffection = (education.classmates ?? []).length > 0
    ? (education.classmates ?? []).reduce((s, c) => s + c.affection, 0) / (education.classmates ?? []).length : 0

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
      <div style={{ padding: '14px 16px 0' }}>

        {/* School header */}
        {inSchool ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                {LEVEL_EMOJI[education.currentLevel]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>{getEducationLabel(education.currentLevel)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: repCfg.bg, color: repCfg.color, fontWeight: 600 }}>{repCfg.label}</span>
                  {['elementary', 'middle', 'highschool'].includes(education.currentLevel) && (
                    <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Obbligo scolastico</span>
                  )}
                </div>
                {/* Grades bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', width: 52, flexShrink: 0 }}>Voti</span>
                  <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(education.gpa / 4) * 100}%`, background: gpaColor, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, color: gpaColor, fontWeight: 700 }}>{education.gpa.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <SectionLabel label="Attività" />

            <ActionRow emoji="👥" label="Compagni di Classe" subtitle={`${(education.classmates ?? []).length} persone`} type="arrow" barVal={avgAffection} barColor="#a78bfa" barLabel="Popolarità" onClick={() => setView('classmates')} />
            <ActionRow emoji="📖" label="Studia" subtitle="Migliora i voti con sessioni di studio" onClick={() => { const r = studyAction(); flash(r.message, r.success, '📖', r.effects as Record<string, number>) }} />
            <ActionRow emoji="🎪" label="Attività Extra" subtitle="Club e attività extrascolastiche" type="arrow" onClick={() => setView('clubs')} />
            <ActionRow emoji="🎉" label="Organizza Festa" subtitle="Invita i compagni a casa tua" onClick={() => { const r = throwSchoolParty(); flash(r.message, r.success, '🎉', r.effects as Record<string, number>) }} />
            <ActionRow emoji="🤝" label="Gruppi" subtitle="Scegli il tuo gruppo sociale" type="arrow" onClick={() => setView('cliques')} />
            <ActionRow emoji="💃" label="Ballo Scolastico" subtitle="Partecipa alla serata danzante" onClick={() => { const r = attendSchoolDance(); flash(r.message, r.success, '💃', r.effects as Record<string, number>) }} />
            <ActionRow emoji="💊" label="Infermeria" subtitle="Visita l'infermiera scolastica" onClick={() => { const r = visitSchoolNurse(); flash(r.message, r.success, '💊', r.effects as Record<string, number>) }} />
            <ActionRow emoji="😴" label="Salta Lezione" subtitle="Fai una giornata di vacanza" onClick={() => { const r = skipClass(); flash(r.message, r.success, '😴', r.effects as Record<string, number>) }} />
            <ActionRow emoji="📝" label="Università" subtitle="Iscriviti a un corso universitario" type="arrow" onClick={() => setView('enroll')} />
            <ActionRow emoji="📊" label="Abilità & Titoli" subtitle="Visualizza le tue competenze" type="arrow" onClick={() => setView('skills')} />
            {!['elementary', 'middle'].includes(education.currentLevel) && (
              <ActionRow emoji="🚶" label="Abbandona la Scuola" subtitle="Lascia definitivamente gli studi" danger onClick={() => { const r = dropOutSchool(); flash(r.message, r.success, '🚶', r.effects as Record<string, number>) }} />
            )}
          </>
        ) : (
          <>
            {/* Not in school */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📚</div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
                  {education.dropOut ? '⚠️ Studi abbandonati' : 'Non iscritto/a'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Iscriviti a un corso per continuare a studiare</p>
              </div>
            </div>

            <SectionLabel label="Attività" />
            <ActionRow emoji="📝" label="Iscriviti all'Università" subtitle="Scegli un corso di laurea o professionale" type="arrow" onClick={() => setView('enroll')} />
            <ActionRow emoji="📊" label="Abilità & Titoli" subtitle="Visualizza le tue competenze" type="arrow" onClick={() => setView('skills')} />
          </>
        )}
      </div>
    </div>
  )
}
