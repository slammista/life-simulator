import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { EducationEngine, getEducationLabel } from '../../services/EducationEngine'
import type { EducationLevel, SchoolAction, SchoolNPC, SchoolReputationStatus } from '../../store/types'

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

const SCHOOL_ACTIONS: Array<{ action: SchoolAction; label: string; emoji: string; profOnly?: boolean; studentOnly?: boolean }> = [
  { action: 'talk',           label: 'Parla',        emoji: '💬' },
  { action: 'befriend',       label: 'Amicizia',     emoji: '🤝' },
  { action: 'study_together', label: 'Studia',       emoji: '📖', studentOnly: true },
  { action: 'gossip',         label: 'Gossip',       emoji: '🗣️',  studentOnly: true },
  { action: 'fight',          label: 'Litigate',     emoji: '😠' },
  { action: 'copy_homework',  label: 'Copia',        emoji: '📋',  studentOnly: true },
]

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

export function EducationScreen() {
  const education = useGameStore(s => s.education)
  const state = useGameStore(s => s)
  const startEducation = useGameStore(s => s.startEducation)
  const studyAction = useGameStore(s => s.studyAction)
  const schoolInteract = useGameStore(s => s.schoolInteract)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'status' | 'classmates' | 'enroll'>('status')
  const [expandedNPC, setExpandedNPC] = useState<string | null>(null)

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
              const isExpanded = expandedNPC === npc.id
              const statusCfg = STATUS_LABELS[npc.status]
              const isPromoted = !!npc.promotedToRelId
              const roleLabel = npc.role === 'professor' ? (npc.subject ? `Prof. ${npc.subject}` : 'Professore') : 'Studente'
              return (
                <div key={npc.id} className="card" style={{ padding: '12px 14px' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => setExpandedNPC(isExpanded ? null : npc.id)}
                  >
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{npc.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{npc.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {roleLabel} · {npc.age} anni
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
                        {npc.affection}% affinità
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                          <span>Affinità</span><span>{npc.affection}/100</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${npc.affection}%`, background: '#22c55e', borderRadius: 4, transition: 'width 0.3s' }} />
                        </div>
                      </div>

                      {isPromoted ? (
                        <p style={{ fontSize: 12, color: '#4ade80', marginBottom: 8 }}>
                          ✅ {npc.name} è diventato/a tuo amico/a!
                        </p>
                      ) : npc.role === 'student' ? (
                        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                          Porta l'affinità a 65+ per guadagnarti la sua amicizia reale.
                        </p>
                      ) : null}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                        {SCHOOL_ACTIONS.filter(a => {
                          if (a.profOnly && npc.role !== 'professor') return false
                          if (a.studentOnly && npc.role !== 'student') return false
                          return true
                        }).map(({ action, label, emoji }) => (
                          <button
                            key={action}
                            onClick={() => handleSchoolInteract(npc.id, action)}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Studenti loan', val: `€${education.studentLoan.toLocaleString('it-IT')}`, emoji: '💸' },
            { label: 'Borse di studio', val: education.scholarships.length, emoji: '🏆' },
            { label: 'Club frequentati', val: education.clubs.length, emoji: '🎭' },
          ].map(({ label, val, emoji }) => (
            <div key={label} className="card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{emoji} {label}</p>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
