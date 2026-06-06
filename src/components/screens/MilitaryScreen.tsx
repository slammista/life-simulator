import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { MILITARY_BRANCHES, MILITARY_RANKS } from '../../services/MilitaryEngine'
import type { MilitaryBranch, MissionType } from '../../services/MilitaryEngine'

const BRANCHES = Object.entries(MILITARY_BRANCHES) as [MilitaryBranch, (typeof MILITARY_BRANCHES)[MilitaryBranch]][]

export default function MilitaryScreen() {
  const { military, time, stats, enlistMilitary, goOnMission, requestMilitaryPromotion, dischargeMilitary } = useGameStore()
  const [tab, setTab] = useState<'stato' | 'arruola' | 'missioni'>('stato')
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const act = (fn: () => { success: boolean; message: string }) => {
    const r = fn()
    setFeedback({ msg: r.message, ok: r.success })
    setTimeout(() => setFeedback(null), 4000)
  }

  const currentRank = MILITARY_RANKS[military.rankIndex]
  const currentBranch = military.branch ? MILITARY_BRANCHES[military.branch as MilitaryBranch] : null
  const monthlySalary = currentBranch && currentRank
    ? Math.round(currentBranch.baseSalary * currentRank.multiplier)
    : 0

  return (
    <div className="screen-content">
      <h2 className="section-title">🪖 Militare</h2>

      {feedback && (
        <div className={`feedback-banner ${feedback.ok ? 'success' : 'error'}`}>
          {feedback.msg}
        </div>
      )}

      <div className="sub-tabs">
        {(['stato', 'arruola', 'missioni'] as const).map(t => (
          <button key={t} className={`sub-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'stato' ? '📋 Stato' : t === 'arruola' ? '🪖 Arruola' : '⚔️ Missioni'}
          </button>
        ))}
      </div>

      {tab === 'stato' && (
        <div>
          {!military.isEnlisted && !military.discharged ? (
            <div className="card empty-state">
              <p>Non sei arruolato nelle forze armate. Vai su "Arruola" per unirti.</p>
            </div>
          ) : (
            <>
              <div className="card">
                <h3 className="card-title">
                  {currentBranch?.emoji} {currentBranch?.name ?? 'Civile'}
                </h3>
                {military.discharged ? (
                  <div className="discharge-badge">
                    {military.honorableDischarge ? '🎗️ Congedo Onorifico' : '📄 Congedo Ordinario'}
                    {military.pensionEligible && ' · 💰 Pensione Militare'}
                  </div>
                ) : (
                  <>
                    <p className="card-subtitle">Grado: {military.rank} · Anni: {military.yearsOfService}</p>
                    <p className="card-subtitle">Stipendio: €{monthlySalary.toLocaleString()}/mese</p>
                    <p className="card-subtitle">Missioni: {military.missions}</p>
                    {military.ptsd && (
                      <div className="warning-badge">⚠️ PTSD — -5 salute mentale/anno</div>
                    )}
                  </>
                )}
              </div>

              {/* Decorazioni */}
              {military.decorations.length > 0 && (
                <div className="card">
                  <h3 className="card-title">🎖️ Decorazioni</h3>
                  <ul className="decoration-list">
                    {military.decorations.map((d, i) => (
                      <li key={i}>🏅 {d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gradi */}
              {military.isEnlisted && (
                <div className="card">
                  <h3 className="card-title">Progressione gradi</h3>
                  <div className="ranks-list">
                    {MILITARY_RANKS.map((r, i) => (
                      <div key={r.rank} className={`rank-item ${i === military.rankIndex ? 'current' : i < military.rankIndex ? 'past' : 'future'}`}>
                        {i < military.rankIndex ? '✅' : i === military.rankIndex ? '⭐' : '🔒'} {r.rank}
                        <span className="rank-salary"> ×{r.multiplier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {military.isEnlisted && (
                <div className="card">
                  <h3 className="card-title">Azioni</h3>
                  <div className="action-grid">
                    <button className="action-btn" onClick={() => act(requestMilitaryPromotion)}>
                      🎖️ Richiedi promozione
                    </button>
                    <button className="action-btn danger" onClick={() => act(dischargeMilitary)}>
                      🎗️ Richiedi congedo
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'arruola' && (
        <div>
          {military.isEnlisted ? (
            <div className="card">
              <p>Sei già arruolato nell'{currentBranch?.name}.</p>
            </div>
          ) : military.discharged ? (
            <div className="card">
              <p>Sei già stato congedato. Non puoi riarruolarti.</p>
            </div>
          ) : (
            <>
              <div className="card">
                <h3 className="card-title">Requisiti arruolamento</h3>
                <ul className="requirements-list">
                  <li className={time.age >= 18 && time.age <= 30 ? 'met' : 'unmet'}>
                    {time.age >= 18 && time.age <= 30 ? '✅' : '❌'} Età 18-30 anni (hai {time.age})
                  </li>
                  <li className={stats.health >= 60 ? 'met' : 'unmet'}>
                    {stats.health >= 60 ? '✅' : '❌'} Salute ≥ 60 (hai {Math.round(stats.health)})
                  </li>
                </ul>
              </div>

              <div className="branches-grid">
                {BRANCHES.map(([id, branch]) => (
                  <div key={id} className="card branch-card">
                    <div className="branch-header">
                      <span className="branch-emoji">{branch.emoji}</span>
                      <h3 className="branch-name">{branch.name}</h3>
                    </div>
                    <div className="branch-details">
                      <p>💰 Stipendio base: €{branch.baseSalary.toLocaleString()}/mese</p>
                      <p>⚔️ Rischio combat: {Math.round(branch.combatRisk * 100)}%</p>
                    </div>
                    <button
                      className="action-btn"
                      onClick={() => act(() => enlistMilitary(id))}
                      disabled={time.age < 18 || time.age > 30 || stats.health < 60}
                    >
                      Arruolati
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'missioni' && (
        <div>
          {!military.isEnlisted ? (
            <div className="card empty-state">
              <p>Devi essere arruolato per andare in missione.</p>
            </div>
          ) : (
            <div className="missions-grid">
              {([
                { type: 'training' as MissionType, emoji: '🎯', title: 'Addestramento', desc: 'Migliora le tue abilità. Rischio zero.', risk: '0%' },
                { type: 'peacekeeping' as MissionType, emoji: '🕊️', title: 'Peacekeeping', desc: 'Missione internazionale di pace. Rischio basso.', risk: '15%' },
                { type: 'combat' as MissionType, emoji: '⚔️', title: 'Combattimento', desc: 'Zona di guerra. Alto rischio, alta ricompensa.', risk: `${Math.round((currentBranch?.combatRisk ?? 0.2) * 40 * 100)}%` },
              ]).map(m => (
                <div key={m.type} className="card mission-card">
                  <div className="mission-header">
                    <span className="mission-emoji">{m.emoji}</span>
                    <h3 className="mission-title">{m.title}</h3>
                  </div>
                  <p className="mission-desc">{m.desc}</p>
                  <p className="mission-risk">⚠️ Rischio morte: {m.risk}</p>
                  <button
                    className="action-btn"
                    onClick={() => act(() => goOnMission(m.type))}
                  >
                    Vai in missione
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
