import { useGameStore } from '../../store/gameStore'
import { CareerEngine, getAllJobs, getCategorySkillBonus } from '../../services/CareerEngine'
import { useToastStore } from '../../store/toastStore'
import { haptic } from '../../services/HapticEngine'

const CATEGORY_EMOJI: Record<string, string> = {
  care: '🤝', retail: '🛒', food: '🍳', logistics: '🚚',
  technical: '🔧', medical: '🏥', finance: '📈', media: '📸',
  creative: '🎨', public: '🏛️', education: '📚', tech: '💻',
  business: '💼', legal: '⚖️', criminal: '🕵️', none: '👤',
}

const COMPANY_LABELS: Record<string, string> = {
  care: 'Servizi alla Persona', retail: 'Grande Distribuzione', food: 'Ristorazione',
  logistics: 'Logistica', technical: 'Manutenzione', medical: 'Sanitario',
  media: 'Media & Comunicazione', creative: 'Creatività', public: 'Pubblica Amministrazione',
  education: 'Istruzione', tech: 'Tecnologia', business: 'Business',
}

function formatSalary(n: number): string {
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}k`
  return `€${n}`
}

function stressColor(level: number): string {
  if (level >= 70) return '#ef4444'
  if (level >= 45) return '#f97316'
  return '#22c55e'
}

export function PartTimeJobsScreen() {
  const state = useGameStore(s => s)
  const career = useGameStore(s => s.career)
  const age = useGameStore(s => s.time.age)
  const applyForJob = useGameStore(s => s.applyForJob)
  const quitJob = useGameStore(s => s.quitJob)
  const showPanel = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const flash = (msg: string, ok: boolean, emoji: string, effects: Record<string, number> = {}) => {
    haptic(ok ? 'success' : 'error')
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => closePanel(), 3000)
  }

  const partTimeJobs = getAllJobs().filter(j => j.contractType === 'part_time')

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
      <div style={{ padding: '14px 16px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
          Lavori con orari flessibili e contratti ridotti. Ideali per studenti e chi cerca una seconda entrata.
        </p>
      </div>

      {/* Current part-time notice */}
      {career.currentJob?.contractType === 'part_time' && (
        <div style={{ margin: '0 16px 12px', padding: '10px 14px', borderRadius: 12, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#86efac', marginBottom: 2 }}>✅ Part-time attuale: {career.currentJob.title}</p>
          <button onClick={() => { const r = quitJob(); flash(r.message, r.success, '🚪', r.effects as Record<string, number>) }}
            style={{ fontSize: 11, padding: '4px 12px', borderRadius: 99, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', marginTop: 4 }}>
            🚪 Licenziati
          </button>
        </div>
      )}

      {partTimeJobs.map(job => {
        const meetsReqs = CareerEngine.meetsRequirements(job, state)
        const isCurrent = career.currentJob?.id === job.id
        const catEmoji = CATEGORY_EMOJI[job.category] ?? '💼'
        const skillBoost = getCategorySkillBonus(job.category, state.skills) >= 0.06
        const stressCol = stressColor(job.stressLevel)

        return (
          <div key={job.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            opacity: meetsReqs || isCurrent ? 1 : 0.42,
            background: isCurrent ? 'rgba(34,197,94,0.05)' : 'transparent',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 13, flexShrink: 0,
              background: meetsReqs ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${meetsReqs ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>
              {catEmoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? '#86efac' : 'var(--color-text)', marginBottom: 1 }}>
                {job.title}
                {isCurrent && <span style={{ fontSize: 10, marginLeft: 6, color: '#4ade80' }}>✅</span>}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                {COMPANY_LABELS[job.category] ?? 'Vari settori'}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#86efac' }}>
                  {formatSalary(job.salaryMin)}–{formatSalary(job.salaryMax)}/mese
                </span>
                <span style={{ fontSize: 10, color: stressCol }}>
                  Stress {job.stressLevel}%
                </span>
                {job.requirements.minAge > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                    {job.requirements.minAge}+ anni
                  </span>
                )}
                {skillBoost && (
                  <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 700 }}>⚡ Skill boost</span>
                )}
              </div>
              {!meetsReqs && !isCurrent && (
                <p style={{ fontSize: 10, color: '#f97316', marginTop: 3 }}>
                  {age < job.requirements.minAge ? `Richiede ${job.requirements.minAge}+ anni` : 'Requisiti non soddisfatti'}
                </p>
              )}
            </div>
            {isCurrent ? (
              <span style={{ fontSize: 13, color: '#86efac', flexShrink: 0, fontWeight: 700 }}>✓</span>
            ) : meetsReqs ? (
              <button
                onClick={() => { const r = applyForJob(job.id); flash(r.message, r.success, catEmoji, r.effects as Record<string, number>) }}
                className="tap-scale"
                style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 3px 10px rgba(34,197,94,0.25)',
                }}
              >
                Candidati
              </button>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 15, flexShrink: 0 }}>···</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
