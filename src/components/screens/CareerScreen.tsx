import { useGameStore } from '../../store/gameStore'
import db from '../../../public/db.json'
export function CareerScreen() {
  const { career, time, education } = useGameStore()

  type DBJob = { id: string; title: string; contractType: string; stressLevel: number; promotionChance: number; requirements: { minAge: number; maxAge: number; education: string; minReputation: number; cleanRecord: boolean; licenses: string[] }; effects: Record<string, number>; salaryMin: number; salaryMax: number; packId: string }
  const availableJobs = (db.jobs as unknown as DBJob[]).filter(job => {
    const req = job.requirements
    if (time.age < req.minAge || time.age > req.maxAge) return false
    if (education.completedLevels.length === 0 && req.education !== 'none') return false
    return true
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12, color: 'var(--color-text)' }}>💼 Carriera</h2>

      {/* Current job */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Lavoro attuale</p>
        {career.currentJob ? (
          <>
            <p style={{ fontWeight: 600 }}>{career.currentJob.title}</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{career.currentJob.company}</p>
            <p style={{ fontSize: 13, color: '#10b981', marginTop: 4 }}>
              €{career.currentJob.salary.toLocaleString('it-IT')}/mese
            </p>
          </>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Disoccupato/a</p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="card" style={{ padding: 10 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Promozioni</p>
          <p style={{ fontWeight: 700, fontSize: 18 }}>{career.promotions}</p>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Licenziamenti</p>
          <p style={{ fontWeight: 700, fontSize: 18, color: career.firings > 0 ? 'var(--color-negative)' : undefined }}>{career.firings}</p>
        </div>
      </div>

      {/* Available jobs */}
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
        Lavori disponibili
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {availableJobs.map(job => (
          <div key={job.id} className="card" style={{ padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{job.title}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{job.contractType}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, color: '#10b981' }}>
                  €{job.salaryMin.toLocaleString()}-{job.salaryMax.toLocaleString()}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  Stress: {job.stressLevel}/100
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
