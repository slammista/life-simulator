import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { SeniorLiving, RetirementType } from '../../services/RetirementEngine'
import { calculatePension } from '../../services/RetirementEngine'

const LIVING_OPTIONS: Array<{ id: SeniorLiving; name: string; emoji: string; cost: number; desc: string }> = [
  { id: 'own_home',             name: 'Casa propria',        emoji: '🏠', cost: 200,  desc: 'Totale autonomia' },
  { id: 'downsizing',           name: 'Casa più piccola',    emoji: '🏢', cost: 1100, desc: 'Meno spese di gestione' },
  { id: 'retirement_community', name: 'Comunità senior',     emoji: '🏘️', cost: 3500, desc: 'Servizi e attività comuni' },
  { id: 'assisted_living',      name: 'Assistenza resid.',   emoji: '🏥', cost: 6000, desc: 'Aiuto nelle attività quotidiane' },
  { id: 'nursing_home',         name: 'Casa di cura',        emoji: '🏨', cost: 9000, desc: 'Assistenza H24' },
  { id: 'with_children',        name: 'Con i figli',         emoji: '👨‍👩‍👧‍👦', cost: 0,    desc: 'Gratuito, dipende dai figli' },
]

const COGNITIVE_LABELS: Record<string, string> = {
  sharp: '🧠 Mente lucida',
  mild_impairment: '🧩 Lieve deterioramento',
  dementia: '🌫️ Demenza moderata',
  severe_dementia: '❌ Demenza grave',
}

const ALZHEIMER_LABELS: Record<string, string> = {
  none: '—',
  mild: '⚠️ Stadio lieve (anni 1-3)',
  moderate: '🌫️ Stadio moderato (anni 4-7)',
  severe: '❌ Stadio grave (anni 8-10)',
}

export default function RetirementScreen() {
  const { retirement, time, stats, finance, career, health, military, children, retire, makeWill, prePlanFuneral, doVolunteering, changeLiving } = useGameStore()
  const state = useGameStore()
  const [tab, setTab] = useState<'stato' | 'pensione' | 'salute' | 'pianificazione'>('stato')
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const act = (fn: () => { success: boolean; message: string }) => {
    const r = fn()
    setFeedback({ msg: r.message, ok: r.success })
    setTimeout(() => setFeedback(null), 4000)
  }

  const estimatedPension = calculatePension(state)

  return (
    <div className="screen-content">
      <h2 className="section-title">🎗️ Pensionamento & Vita Senior</h2>

      {feedback && (
        <div className={`feedback-banner ${feedback.ok ? 'success' : 'error'}`}>
          {feedback.msg}
        </div>
      )}

      <div className="sub-tabs">
        {(['stato', 'pensione', 'salute', 'pianificazione'] as const).map(t => (
          <button key={t} className={`sub-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'stato' ? '📋 Stato' : t === 'pensione' ? '💰 Pensione' : t === 'salute' ? '🏥 Salute Senior' : '📜 Pianificazione'}
          </button>
        ))}
      </div>

      {tab === 'stato' && (
        <div>
          <div className="card">
            <h3 className="card-title">{retirement.isRetired ? '🎗️ In Pensione' : '💼 Attivo'}</h3>
            {retirement.isRetired ? (
              <>
                <p className="card-subtitle">Pensionato a {retirement.retirementAge} anni · Tipo: {retirement.retirementType}</p>
                <p className="card-subtitle">💰 Pensione: €{retirement.monthlyPension.toLocaleString()}/mese</p>
                <p className="card-subtitle">🏠 Sistemazione: {LIVING_OPTIONS.find(l => l.id === retirement.livingArrangement)?.name ?? retirement.livingArrangement}</p>
                <p className="card-subtitle">{COGNITIVE_LABELS[retirement.cognitiveStatus]}</p>
              </>
            ) : (
              <>
                <p className="card-subtitle">Età attuale: {time.age} anni</p>
                <p className="card-subtitle">Pensione stimata: €{estimatedPension.toLocaleString()}/mese</p>
                {time.age >= 62 && <p className="tip">✅ Sei eleggibile per la pensione standard.</p>}
                {time.age >= 55 && finance.money >= 500000 && <p className="tip">✅ Sei eleggibile per il pensionamento anticipato (FIRE).</p>}
              </>
            )}
          </div>

          {/* Alzheimer */}
          {retirement.alzheimersStage !== 'none' && (
            <div className="card warning-card">
              <h3 className="card-title">🧠 Alzheimer / Demenza</h3>
              <p>{ALZHEIMER_LABELS[retirement.alzheimersStage]}</p>
              {retirement.alzheimersYear && (
                <p className="card-subtitle">Inizio: {retirement.alzheimersYear} (anno {time.year - retirement.alzheimersYear} di malattia)</p>
              )}
            </div>
          )}

          {/* Senior conditions */}
          {retirement.seniorConditions.length > 0 && (
            <div className="card">
              <h3 className="card-title">🩺 Condizioni mediche</h3>
              {retirement.seniorConditions.map(c => (
                <div key={c.id} className="condition-row">
                  <span>{c.emoji} {c.name}</span>
                  <span className="condition-cost">€{c.monthlyCost.toLocaleString()}/mese</span>
                </div>
              ))}
              <p className="card-subtitle">
                Costo totale: €{retirement.seniorConditions.reduce((s, c) => s + c.monthlyCost, 0).toLocaleString()}/mese
              </p>
            </div>
          )}

          {/* Attività volontariato */}
          {retirement.isRetired && (
            <div className="card">
              <h3 className="card-title">🤝 Volontariato</h3>
              <p className="card-subtitle">+felicità +karma +reputazione</p>
              <button className="action-btn" onClick={() => act(doVolunteering)}>
                Fai volontariato
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'pensione' && (
        <div>
          {/* Retire actions */}
          {!retirement.isRetired && (
            <div className="card">
              <h3 className="card-title">Vai in pensione</h3>
              <div className="action-grid">
                {([
                  { type: 'early' as RetirementType,    label: '🏖️ Anticipata (FIRE)', min: 55, moneyMin: 500000, desc: 'Età 55+, €500k+ risparmiati' },
                  { type: 'standard' as RetirementType, label: '🎗️ Standard',          min: 62, moneyMin: 0,      desc: 'Età 62+' },
                  { type: 'medical' as RetirementType,  label: '🏥 Per invalidità',    min: 0,  moneyMin: 0,      desc: 'Richiede disabilità certificata' },
                ]).map(opt => (
                  <div key={opt.type} className="card">
                    <p className="card-subtitle">{opt.label}</p>
                    <p className="small-text">{opt.desc}</p>
                    <button
                      className="action-btn"
                      disabled={time.age < opt.min || finance.money < opt.moneyMin}
                      onClick={() => act(() => retire(opt.type))}
                    >
                      Vai in pensione
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Living arrangement */}
          <div className="card">
            <h3 className="card-title">🏠 Sistemazione abitativa</h3>
            <div className="mods-grid">
              {LIVING_OPTIONS.map(opt => {
                const isCurrent = retirement.livingArrangement === opt.id
                const isDisabled = opt.id === 'nursing_home' && time.age < 70
                return (
                  <div key={opt.id} className={`card mod-catalog-card ${isCurrent ? 'owned' : ''}`}>
                    <div className="mod-catalog-header">
                      <span className="mod-emoji">{opt.emoji}</span>
                      <h3 className="mod-catalog-name">{opt.name}</h3>
                    </div>
                    <p>{opt.desc}</p>
                    <p>💰 €{opt.cost.toLocaleString()}/mese</p>
                    {isCurrent
                      ? <div className="owned-badge">✅ Attuale</div>
                      : <button className="action-btn" disabled={isDisabled} onClick={() => act(() => changeLiving(opt.id))}>Trasferisciti</button>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'salute' && (
        <div>
          <div className="card">
            <h3 className="card-title">Stato di salute</h3>
            <div className="stats-column">
              {[
                { label: 'Salute', val: stats.health, color: '#4caf50' },
                { label: 'Salute mentale', val: stats.mentalHealth, color: '#9c27b0' },
                { label: 'Energia', val: stats.energy, color: '#ff9800' },
                { label: 'Fitness', val: health.fitnessLevel, color: '#2196f3' },
              ].map(s => (
                <div key={s.label} className="stat-bar-mini">
                  <span className="stat-label-mini">{s.label}</span>
                  <div className="bar-track-mini">
                    <div className="bar-fill-mini" style={{ width: `${s.val}%`, background: s.color }} />
                  </div>
                  <span className="stat-value-mini">{Math.round(s.val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Condizioni senior in arrivo */}
          <div className="card">
            <h3 className="card-title">⚠️ Rischi per età {time.age}+</h3>
            {time.age < 55
              ? <p className="card-subtitle">I rischi di condizioni senior compaiono dai 55 anni.</p>
              : (
                <ul className="requirements-list">
                  {time.age >= 55 && <li className="unmet">Ipertensione, Artrite (55+)</li>}
                  {time.age >= 60 && <li className="unmet">Diabete Tipo 2, Problemi vista (60+)</li>}
                  {time.age >= 65 && <li className="unmet">Malattia cardiaca, Osteoporosi (65+)</li>}
                  {time.age >= 70 && <li className="unmet">Tumore, Problemi udito (70+)</li>}
                  {time.age >= 75 && <li className="unmet">Alzheimer/Demenza (75+)</li>}
                </ul>
              )
            }
          </div>
        </div>
      )}

      {tab === 'pianificazione' && (
        <div>
          <div className="card">
            <h3 className="card-title">📜 Testamento</h3>
            <p className="card-subtitle">Costo notaio: €800 · Età consigliata: 50+</p>
            {retirement.hasMadeWill
              ? <div className="owned-badge">✅ Testamento redatto</div>
              : <button className="action-btn" disabled={time.age < 50 || finance.money < 800} onClick={() => act(makeWill)}>Redigi testamento</button>
            }
          </div>

          <div className="card">
            <h3 className="card-title">⚰️ Funerale pre-pianificato</h3>
            <p className="card-subtitle">€8.000 · Solleva i familiari da decisioni difficili</p>
            {retirement.funeralPrePlanned
              ? <div className="owned-badge">✅ Funerale pianificato</div>
              : <button className="action-btn" disabled={finance.money < 8000} onClick={() => act(prePlanFuneral)}>Pre-pianifica</button>
            }
          </div>

          {/* Legacy preview */}
          <div className="card">
            <h3 className="card-title">🏆 Eredità ai figli</h3>
            {children.length === 0
              ? <p className="card-subtitle">Non hai figli. L'eredità verrà dispersa.</p>
              : children.map(c => (
                <div key={c.id} className="condition-row">
                  <span>{c.gender === 'female' ? '👧' : '👦'} {c.name} ({c.age} anni)</span>
                  <span className="condition-cost">€{Math.round(finance.money * 0.3).toLocaleString()} stimati</span>
                </div>
              ))
            }
            <p className="small-text">L'importo esatto dipende dal tuo legacy score al momento della morte.</p>
          </div>
        </div>
      )}
    </div>
  )
}
