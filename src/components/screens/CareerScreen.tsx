import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { CareerEngine, getAllJobs, getContractLabel } from '../../services/CareerEngine'
import { useToastStore } from '../../store/toastStore'

export function CareerScreen() {
  const career = useGameStore(s => s.career)
  const time = useGameStore(s => s.time)
  const state = useGameStore(s => s)
  const applyForJob = useGameStore(s => s.applyForJob)
  const quitJob = useGameStore(s => s.quitJob)
  const attemptPromotion = useGameStore(s => s.attemptPromotion)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'offers' | 'history'>('offers')

  const pushToast = useToastStore(s => s.push)

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    pushToast(msg, ok ? '💼' : '❌', ok)
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleApply = (jobId: string) => {
    const r = applyForJob(jobId)
    flash(r.message, r.success)
  }

  const handleQuit = () => {
    const r = quitJob()
    flash(r.message, r.success)
  }

  const handlePromotion = () => {
    const r = attemptPromotion()
    flash(r.message, r.success)
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

      {/* Teen notice */}
      {isMinor && (
        <div style={{ borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
          👦 Minorenne — disponibili solo lavori part-time e freelance. Lavori full-time sbloccati dopo il diploma.
        </div>
      )}

      {/* Feedback */}
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

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={handlePromotion}
                style={{ flex: 1, padding: '8px 0', borderRadius: 12, background: 'rgba(234,179,8,0.2)', color: '#fde047', fontSize: 13, fontWeight: 500, border: '1px solid rgba(234,179,8,0.3)', cursor: 'pointer' }}
              >
                📈 Promozione
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['offers', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {t === 'offers' ? '🔍 Offerte' : '📋 Storico'}
          </button>
        ))}
      </div>

      {/* Offers list */}
      {tab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {availableJobs.length} offerta/e disponibile/i per te
          </p>
          {availableJobs.length === 0 && (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                Niente per te al momento.
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Il mercato del lavoro non ti considera ancora. Studia, fai esperienza o abbassa le aspettative.
              </p>
            </div>
          )}
          {availableJobs.map(job => {
            const isCurrent = career.currentJob?.id === job.id
            return (
              <div
                key={job.id}
                className={`card card-action${isCurrent ? '' : ''}`}
                style={{ padding: 12, border: isCurrent ? '1px solid rgba(34,197,94,0.4)' : undefined }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{job.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{job.category}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#10b981', fontSize: 13, fontWeight: 700 }}>
                      €{job.salaryMin.toLocaleString('it-IT')}–{job.salaryMax.toLocaleString('it-IT')}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>/mese</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-secondary)' }}>
                    Stress {job.stressLevel}%
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-secondary)' }}>
                    {getContractLabel(job.contractType)}
                  </span>
                  {job.requirements.cleanRecord && (
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(234,179,8,0.2)', color: '#fde047' }}>
                      Fedina pulita
                    </span>
                  )}
                </div>

                {isCurrent ? (
                  <p style={{ fontSize: 12, color: '#4ade80', fontWeight: 500 }}>✅ Lavoro attuale</p>
                ) : (
                  <button
                    onClick={() => handleApply(job.id)}
                    style={{ width: '100%', padding: '8px 0', borderRadius: 12, background: 'rgba(233,69,96,0.15)', color: 'var(--color-cta)', fontSize: 13, fontWeight: 500, border: '1px solid rgba(233,69,96,0.3)', cursor: 'pointer' }}
                  >
                    Candidati
                  </button>
                )}
              </div>
            )
          })}
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
