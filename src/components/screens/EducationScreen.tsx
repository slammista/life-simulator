import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { EducationEngine, getEducationLabel } from '../../services/EducationEngine'
import type { EducationLevel } from '../../store/types'

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

const ALL_LEVELS: EducationLevel[] = [
  'kindergarten', 'elementary', 'middle', 'highschool',
  'vocational', 'bachelor', 'master', 'phd', 'mba', 'medical', 'law',
]

export function EducationScreen() {
  const education = useGameStore(s => s.education)
  const state = useGameStore(s => s)
  const startEducation = useGameStore(s => s.startEducation)
  const studyAction = useGameStore(s => s.studyAction)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'status' | 'enroll'>('status')

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

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['status', 'enroll'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : 'var(--color-text-secondary)' }}
          >
            {t === 'status' ? '📋 Informazioni' : '📝 Iscriviti'}
          </button>
        ))}
      </div>

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
