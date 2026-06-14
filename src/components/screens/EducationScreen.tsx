import { lazy, Suspense, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { EducationEngine, getEducationLabel } from '../../services/EducationEngine'
import type { EducationLevel, SchoolAction, SchoolNPC, SchoolReputationStatus } from '../../store/types'

const SchoolNpcDetailModal = lazy(() =>
  import('../relationships/SchoolNpcDetailModal').then(m => ({ default: m.SchoolNpcDetailModal })))

const LEVEL_EMOJI: Record<EducationLevel, string> = {
  none: '❌',
  kindergarten: '🧒',
  elementary: '📒',
  middle: '📗',
  highschool: '🎒',
  vocational: '🔧',
  bachelor: '🎓',
  master: '📜',
  phd: '🔬',
  mba: '💼',
  medical: '⚕️',
  law: '⚖️',
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

// Mandatory levels handled automatically — only show university/post-secondary for manual enrollment
const ENROLLABLE_LEVELS: EducationLevel[] = [
  'vocational', 'bachelor', 'master', 'phd', 'mba', 'medical', 'law',
]
const ALL_LEVELS = ENROLLABLE_LEVELS

const CLUBS = [
  { id: 'sport',    label: 'Club Sportivo',   emoji: '⚽', hint: 'Atletica +2, Disciplina +1' },
  { id: 'music',    label: 'Club Musicale',   emoji: '🎸', hint: 'Musica +2, Creatività +1' },
  { id: 'academic', label: 'Club Accademico', emoji: '📚', hint: 'Accademico +2, Disciplina +1' },
  { id: 'art',      label: 'Club Arte',       emoji: '🎨', hint: 'Creatività +2, Carisma +1' },
  { id: 'debate',   label: 'Club Dibattito',  emoji: '🗣️', hint: 'Carisma +2, Leadership +1' },
]

export function EducationScreen() {
  const education = useGameStore(s => s.education)
  const skills = useGameStore(s => s.skills)
  const state = useGameStore(s => s)
  const startEducation = useGameStore(s => s.startEducation)
  const studyAction = useGameStore(s => s.studyAction)
  const schoolInteract = useGameStore(s => s.schoolInteract)
  const joinClub = useGameStore(s => s.joinClub)
  const leaveClub = useGameStore(s => s.leaveClub)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'status' | 'classmates' | 'enroll'>('status')
  const [detailNpcId, setDetailNpcId] = useState<string | null>(null)

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  const handleEnroll = (level: EducationLevel) => {
    const r = startEducation(level)
    flash(r.message, r.success)
    if (r.success) setTab('status')
  }

  const handleStudy = () => {
    const r = studyAction()
    flash(r.message, r.success)
  }

  const handleSchoolInteract = (npcId: string, action: SchoolAction) => {
    const r = schoolInteract(npcId, action)
    flash(r.message, r.success)
  }

  const gpaColor = education.gpa >= 3.0 ? '#10b981' : education.gpa >= 2.0 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>📚 Istruzione</h2>
      </div>

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

      {/* Current status card */}
      <div className="card" style={{ marginBottom: 12, padding: 14 }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Stato attuale</p>

        {education.currentLevel !== 'none' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 15 }}>
                  {LEVEL_EMOJI[education.currentLevel]} {getEducationLabel(education.currentLevel)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>In corso</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, fontSize: 18, color: gpaColor }}>{education.gpa.toFixed(2)}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>GPA / 4.00</p>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                <span>Progresso GPA</span>
                <span>{((education.gpa / 4) * 100).toFixed(0)}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(education.gpa / 4) * 100}%`, background: gpaColor, borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            </div>

            <button
              onClick={handleStudy}
              style={{ width: '100%', padding: '10px 0', borderRadius: 12, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 14, fontWeight: 600, border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer' }}
            >
              📖 Studia (+GPA & intelligenza)
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
              {education.dropOut ? '⚠️ Hai abbandonato gli studi.' : 'Non sei iscritto/a a nessun corso.'}
            </p>
          </div>
        )}
      </div>

      {/* Completed levels */}
      {education.completedLevels.length > 0 && (
        <div className="card" style={{ marginBottom: 12, padding: 12 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Titoli conseguiti</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {education.completedLevels.map(lvl => (
              <span key={lvl} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
                {LEVEL_EMOJI[lvl]} {getEducationLabel(lvl)}
              </span>
            ))}
          </div>
          {education.graduationYear && (
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
              Ultima laurea: {education.graduationYear}
            </p>
          )}
        </div>
      )}

      {/* Auto-school notice */}
      {['elementary', 'middle', 'highschool'].includes(education.currentLevel) && (
        <div style={{ borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
          📌 Sei automaticamente iscritto/a. La scuola obbligatoria non richiede iscrizione manuale.
        </div>
      )}

      {/* School reputation */}
      {education.currentLevel !== 'none' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Reputazione:</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
            background: SCHOOL_REP_CONFIG[education.schoolReputation ?? 'invisibile'].bg,
            color: SCHOOL_REP_CONFIG[education.schoolReputation ?? 'invisibile'].color,
          }}>
            {SCHOOL_REP_CONFIG[education.schoolReputation ?? 'invisibile'].label}
          </span>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {([
          { id: 'status', label: '📋 Info' },
          { id: 'classmates', label: `👥 Persone${(education.classmates ?? []).length > 0 ? ` (${(education.classmates ?? []).length})` : ''}` },
          { id: 'enroll', label: '📝 Università' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '7px 4px', borderRadius: 12, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t.id ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t.id ? '#fff' : 'var(--color-text-secondary)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Classmates tab */}
      {tab === 'classmates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {education.currentLevel === 'none' ? (
            <div className="card" style={{ padding: '28px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                Nessuna scuola attiva
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Iscriviti a una scuola o università per incontrare compagni e professori.
              </p>
            </div>
          ) : (education.classmates ?? []).length === 0 ? (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>👋</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Nuovo anno scolastico — compagni ancora sconosciuti.
              </p>
            </div>
          ) : (
            (education.classmates ?? []).map(npc => {
              const statusCfg = STATUS_LABELS[npc.status]
              const isProf = npc.role === 'professor' || npc.role === 'coach'
              const roleLabel = npc.role === 'professor'
                ? (npc.subject ? `Prof. ${npc.subject}` : 'Professore')
                : npc.role === 'coach' ? 'Allenatore'
                : 'Studente'
              const affectionColor = npc.affection >= 70 ? '#10b981' : npc.affection >= 40 ? '#f59e0b' : '#f43f5e'
              return (
                <div
                  key={npc.id}
                  className="card tap-scale"
                  style={{ padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => setDetailNpcId(npc.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      background: isProf ? 'rgba(96,165,250,0.1)' : 'rgba(99,102,241,0.1)',
                      border: `1.5px solid ${isProf ? 'rgba(96,165,250,0.25)' : 'rgba(99,102,241,0.25)'}`,
                    }}>
                      {npc.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{npc.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{npc.age}y</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{roleLabel}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99, background: `${statusCfg.color}22`, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 5 }}>
                        <div style={{ height: '100%', width: `${npc.affection}%`, background: affectionColor, borderRadius: 99, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', flexShrink: 0 }}>›</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* SchoolNPC detail modal */}
      {detailNpcId && (() => {
        const npc = (education.classmates ?? []).find(c => c.id === detailNpcId)
        if (!npc) return null
        return (
          <Suspense fallback={null}>
            <SchoolNpcDetailModal
              npc={npc}
              onClose={() => setDetailNpcId(null)}
              onInteract={(id, action) => handleSchoolInteract(id, action)}
            />
          </Suspense>
        )
      })()}

      {/* Enroll tab */}
      {tab === 'enroll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ALL_LEVELS.map(level => {
            const check = EducationEngine.canEnroll(level, state)
            const isCurrent = education.currentLevel === level
            const isCompleted = education.completedLevels.includes(level)
            return (
              <div key={level} className="card" style={{
                padding: 12,
                opacity: (!check.ok && !isCurrent && !isCompleted) ? 0.6 : 1,
                border: isCurrent ? '1px solid rgba(99,102,241,0.4)' : isCompleted ? '1px solid rgba(34,197,94,0.3)' : undefined,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{LEVEL_EMOJI[level]} {getEducationLabel(level)}</p>
                  </div>
                  {isCompleted && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>✅ Completato</span>}
                  {isCurrent && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>📖 In corso</span>}
                </div>
                {!check.ok && !isCurrent && !isCompleted && (
                  <p style={{ fontSize: 11, color: '#f97316', marginBottom: 6 }}>⛔ {check.reason}</p>
                )}
                {check.ok && (
                  <button onClick={() => handleEnroll(level)}
                    style={{ width: '100%', padding: '8px 0', borderRadius: 12, background: 'rgba(233,69,96,0.15)', color: 'var(--color-cta)', fontSize: 13, fontWeight: 500, border: '1px solid rgba(233,69,96,0.3)', cursor: 'pointer' }}
                  >
                    Iscriviti
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Stats tab */}
      {tab === 'status' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Prestito', val: `€${education.studentLoan.toLocaleString('it-IT')}`, emoji: '💸', color: '#f97316' },
              { label: 'Borse di studio', val: String(education.scholarships.length), emoji: '🏆', color: '#f59e0b' },
            ].map(({ label, val, emoji, color }) => (
              <div key={label} className="card" style={{ padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{emoji} {label}</p>
                <p style={{ fontWeight: 700, fontSize: 16, color }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Skills panel */}
          <div className="card" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Abilità sviluppate</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { key: 'academicSkill', label: 'Accademico',  color: '#60a5fa' },
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

          {/* Clubs section */}
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Club & attività extrascolastiche</p>
              {education.currentLevel !== 'none' && (
                <span style={{ fontSize: 10, color: education.clubs.length >= 2 ? '#f59e0b' : 'var(--color-text-secondary)' }}>
                  {education.clubs.length}/2 club
                </span>
              )}
            </div>
            {education.currentLevel === 'none' ? (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Iscriviti a una scuola per accedere ai club.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {education.clubs.length >= 2 && (
                  <div style={{ padding: '7px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 11, color: '#fbbf24' }}>
                    ⚠️ Hai raggiunto il limite di club (2 max con scuola). Lascia un club per entrarne in un altro.
                  </div>
                )}
                {CLUBS.map(club => {
                  const joined = education.clubs.includes(club.id)
                  return (
                    <div key={club.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      padding: '8px 10px', borderRadius: 10,
                      background: joined ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${joined ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{club.emoji}</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: joined ? '#a5b4fc' : 'var(--color-text)' }}>{club.label}</p>
                          <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{club.hint} · 8h/sett.</p>
                        </div>
                      </div>
                      {joined ? (
                        <button
                          onClick={() => { const r = leaveClub(club.id); flash(r.message, r.success) }}
                          style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Lascia
                        </button>
                      ) : (
                        <button
                          onClick={() => { const r = joinClub(club.id); flash(r.message, r.success) }}
                          disabled={education.clubs.length >= 2}
                          style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: education.clubs.length >= 2 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.15)', color: education.clubs.length >= 2 ? 'var(--color-text-secondary)' : '#a5b4fc', border: `1px solid ${education.clubs.length >= 2 ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.3)'}`, cursor: education.clubs.length >= 2 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                        >
                          Entra
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
