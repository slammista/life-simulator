import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { SpecialCareerEngine, type SpecialCareerType } from '../../services/SpecialCareerEngine'
import { CareerLifecycleEngine } from '../../services/CareerLifecycleEngine'
import { useToastStore } from '../../store/toastStore'
import { haptic } from '../../services/HapticEngine'
import { ConfirmDialog } from '../common/ConfirmDialog'

const CAREER_META: Record<SpecialCareerType, {
  emoji: string
  label: string
  color: string
  description: string
  minAge: number
}> = {
  actor: {
    emoji: '🎭', label: 'Attore', color: '#a855f7', minAge: 16,
    description: 'Provini, cortometraggi, serie TV e cinema. Costruisci la tua fama sul set, una scena alla volta.',
  },
  musician: {
    emoji: '🎵', label: 'Musicista', color: '#06b6d4', minAge: 14,
    description: 'Demo, concerti, album e tour. Dal palco del locale di quartiere agli stadi del mondo.',
  },
  pro_athlete: {
    emoji: '⚽', label: 'Atleta Pro', color: '#22c55e', minAge: 16,
    description: 'Provini, contratti e sponsorizzazioni. La carriera è breve: punta in alto finché il fisico regge.',
  },
  politician: {
    emoji: '🏛️', label: 'Politico', color: '#60a5fa', minAge: 25,
    description: 'Campagne, comizi ed elezioni. Conquista consenso e scala le istituzioni fino al governo.',
  },
  criminal: {
    emoji: '🕶️', label: 'Criminale', color: '#ef4444', minAge: 16,
    description: 'Gang, racket e colpi grossi. Soldi facili e fama oscura, ma il karma presenta sempre il conto.',
  },
}

const CAREER_ORDER: SpecialCareerType[] = ['actor', 'musician', 'pro_athlete', 'politician', 'criminal']

const ROLE_LABEL: Record<string, string> = {
  riserva: 'Riserva 🪑', titolare: 'Titolare ⚽', stella: 'Stella ⭐', capitano: 'Capitano 🏅',
}

const LEGACY_COLORS: Record<string, string> = {
  dimenticato: '#94a3b8', professionista: '#60a5fa', leggenda_nazionale: '#f59e0b', leggenda_mondiale: '#a855f7',
}

export function SpecialCareerScreen() {
  const career = useGameStore(s => s.specialCareer)
  const age = useGameStore(s => s.time.age)
  const money = useGameStore(s => s.finance.money)
  const energy = useGameStore(s => s.stats.energy)
  const sports = useGameStore(s => s.sports ?? [])
  const diminishingReturns = useGameStore(s => s.diminishingReturns)
  const pendingCareerOffer = useGameStore(s => s.pendingCareerOffer)
  const startSpecialCareer = useGameStore(s => s.startSpecialCareer)
  const performSpecialCareerAction = useGameStore(s => s.performSpecialCareerAction)
  const quitSpecialCareer = useGameStore(s => s.quitSpecialCareer)
  const respondToScoutOffer = useGameStore(s => s.respondToScoutOffer)
  const respondToTransferOffer = useGameStore(s => s.respondToTransferOffer)
  const showPanel = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const flash = (msg: string, ok: boolean, emoji = '🌟', effects: Record<string, number> = {}) => {
    haptic(ok ? 'success' : 'error')
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => closePanel(), 3500)
  }

  const handleScoutResponse = (accept: boolean) => {
    const r = respondToScoutOffer(accept)
    flash(r.message, r.success, accept ? '📝' : '❌', r.effects as Record<string, number>)
  }

  const handleTransferResponse = (response: 'accept' | 'negotiate' | 'reject') => {
    const r = respondToTransferOffer(response)
    flash(r.message, r.success, response === 'accept' ? '✈️' : response === 'negotiate' ? '🤝' : '❌', r.effects as Record<string, number>)
  }

  const handleStart = (type: SpecialCareerType) => {
    const r = startSpecialCareer(type)
    flash(r.message, r.success, CAREER_META[type].emoji, r.effects as Record<string, number>)
  }

  const handleAction = (actionId: string, emoji: string) => {
    const r = performSpecialCareerAction(actionId)
    flash(r.message, r.success, emoji, r.effects as Record<string, number>)
  }

  const [confirmQuit, setConfirmQuit] = useState(false)

  const doQuit = () => {
    setConfirmQuit(false)
    const r = quitSpecialCareer()
    flash(r.message, r.success, '🚪', r.effects as Record<string, number>)
  }

  // Real gate for the pro athlete card: at least one sport at skill >= 60
  const bestSport = sports.length > 0
    ? [...sports].sort((a, b) => b.skillLevel - a.skillLevel)[0]
    : null
  const athleteQualifies = !!bestSport && bestSport.skillLevel >= 60
  const athleteHint = athleteQualifies
    ? `Ottimo: pratichi ${bestSport!.name} a livello ${Math.round(bestSport!.skillLevel)}. Hai le carte in regola!`
    : 'Requisito: almeno 60 di abilità in uno sport. Allenati prima nella sezione Sport.'

  // ---- Chooser view (no career yet) ----
  if (!career) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>🌟 Carriera Speciale</h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          Intraprendi un percorso fuori dall'ordinario: fama, reputazione e guadagni crescono con i tuoi successi.
        </p>

        {/* Scout offer banner */}
        {pendingCareerOffer && (
          <div className="card" style={{
            padding: 14, marginBottom: 14,
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, var(--bg-card) 70%)',
            border: '1px solid rgba(34,197,94,0.40)',
          }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#86efac', marginBottom: 6 }}>
              🔍 UNO SCOUT TI HA NOTATO!
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 4 }}>
              {pendingCareerOffer.offer.fromTeamEmoji} <strong>{pendingCareerOffer.offer.fromTeamName}</strong> vuole offrirti un contratto professionale.
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
              Ruolo: <strong>{ROLE_LABEL[pendingCareerOffer.offer.role]}</strong> · Stipendio: <strong>€{pendingCareerOffer.offer.monthlySalary.toLocaleString()}/mese</strong> · Durata: {pendingCareerOffer.offer.durationYears} {pendingCareerOffer.offer.durationYears === 1 ? 'anno' : 'anni'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleScoutResponse(true)} className="tap-scale" style={{
                flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff',
              }}>✅ Vai al Provino</button>
              <button onClick={() => handleScoutResponse(false)} className="tap-scale" style={{
                flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1px solid rgba(239,68,68,0.4)', cursor: 'pointer',
                background: 'rgba(239,68,68,0.08)', color: '#fca5a5',
              }}>❌ Rifiuta</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CAREER_ORDER.map(type => {
            const meta = CAREER_META[type]
            const ageOk = age >= meta.minAge
            const sportOk = type !== 'pro_athlete' || athleteQualifies
            const canStart = ageOk && sportOk
            const hint = type === 'pro_athlete'
              ? athleteHint
              : `Disponibile dai ${meta.minAge} anni.`
            const blockedLabel = !ageOk
              ? `Min ${meta.minAge} anni (hai ${age})`
              : 'Serve abilità ≥ 60 in uno sport'
            return (
              <div key={type} className="card" style={{
                padding: 14,
                background: `linear-gradient(135deg, ${meta.color}10 0%, var(--bg-card) 70%)`,
                border: `1px solid ${meta.color}30`,
                opacity: canStart ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${meta.color}1e`, border: `1px solid ${meta.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {meta.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{meta.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>{meta.description}</p>
                  </div>
                </div>

                <p style={{ fontSize: 11, color: meta.color, marginBottom: 10 }}>
                  💡 {hint}
                </p>

                <button
                  onClick={() => handleStart(type)}
                  disabled={!canStart}
                  className={canStart ? 'tap-scale' : undefined}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none',
                    cursor: canStart ? 'pointer' : 'not-allowed',
                    background: canStart
                      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)'
                      : 'rgba(255,255,255,0.05)',
                    color: canStart ? '#fff' : 'var(--color-text-secondary)',
                    boxShadow: canStart ? '0 4px 16px rgba(124,92,255,0.3)' : 'none',
                  }}
                >
                  {canStart ? `Inizia carriera da ${meta.label}` : blockedLabel}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ---- Dashboard view (career active) ----
  const meta = CAREER_META[career.type]
  const isRetired = career.phase === 'retired'
  // Reference diminishingReturns so the action list refreshes when yearly usage changes.
  const availableActions = isRetired
    ? []
    : SpecialCareerEngine.getAvailableActions(career, { ...useGameStore.getState(), diminishingReturns })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🌟 Carriera Speciale</h2>

      {/* Dashboard card */}
      <div className="card" style={{
        padding: 14, marginBottom: 14,
        background: `linear-gradient(135deg, ${meta.color}12 0%, var(--bg-card) 70%)`,
        border: `1px solid ${meta.color}30`,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: `${meta.color}1e`, border: `1px solid ${meta.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            {meta.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>{meta.label}</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: meta.color, background: `${meta.color}18`,
                padding: '1px 8px', borderRadius: 99, border: `1px solid ${meta.color}30`,
              }}>
                {SpecialCareerEngine._phaseLabel(career.phase, career.type)}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>dal {career.startYear}</span>
            </div>
          </div>
          {career.income > 0 && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: '#86efac', lineHeight: 1 }}>
                €{career.income.toLocaleString('it-IT')}/mese
              </p>
              <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2 }}>accreditati ogni anno</p>
            </div>
          )}
        </div>

        {isRetired && (
          <div style={{
            borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, fontWeight: 600,
            background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.3)', color: '#cbd5e1',
          }}>
            🏅 Ti sei ritirato/a da questa carriera. Goditi la gloria del passato.
          </div>
        )}

        {/* Fame & reputation bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {[
            { label: 'Fama', val: career.fame, color: '#f59e0b' },
            { label: 'Reputazione', val: career.reputation, color: '#8b5cf6' },
            ...(career.type === 'pro_athlete' && career.professionalFame != null ? [
              { label: 'Fama Prof.', val: career.professionalFame, color: '#22c55e' },
              { label: 'Fama Pub.', val: career.publicFame ?? 0, color: '#f43f5e' },
            ] : []),
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 80, flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: color, borderRadius: 4, transform: `scaleX(${val / 100})`, transformOrigin: 'left', transition: 'transform 0.4s ease' }} />
              </div>
              <span style={{ fontSize: 11, width: 26, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{Math.round(val)}</span>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#86efac', padding: '3px 9px', borderRadius: 999, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            ✅ {career.projectsCompleted} progetti riusciti
          </span>
          <span style={{ fontSize: 11, color: '#fca5a5', padding: '3px 9px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            ❌ {career.projectsFailed} falliti
          </span>
        </div>
      </div>

      {/* Current contract card — only for pro_athlete */}
      {career.type === 'pro_athlete' && career.contract && (
        <div className="card" style={{
          padding: 14, marginBottom: 14,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.10) 0%, var(--bg-card) 70%)',
          border: '1px solid rgba(34,197,94,0.30)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#86efac', marginBottom: 10 }}>
            📋 Contratto in Corso
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                {career.contract.teamEmoji} {career.contract.teamName}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {ROLE_LABEL[career.contract.role]}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#86efac' }}>
                €{career.contract.monthlySalary.toLocaleString('it-IT')}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-secondary)' }}>/mese</span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {career.contract.yearsRemaining} {career.contract.yearsRemaining === 1 ? 'anno rimasto' : 'anni rimasti'}
              </p>
            </div>
          </div>
          {career.contract.signingBonus > 0 && (
            <p style={{ fontSize: 11, color: '#fcd34d' }}>🎁 Bonus firma: €{career.contract.signingBonus.toLocaleString('it-IT')}</p>
          )}
        </div>
      )}

      {/* Transfer offer panel */}
      {career.type === 'pro_athlete' && career.pendingOffer && (
        <div className="card" style={{
          padding: 14, marginBottom: 14,
          background: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, var(--bg-card) 70%)',
          border: '1px solid rgba(96,165,250,0.35)',
        }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#93c5fd', marginBottom: 8 }}>
            ✈️ OFFERTA DI TRASFERIMENTO
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 4 }}>
            {career.pendingOffer.fromTeamEmoji} <strong>{career.pendingOffer.fromTeamName}</strong> ti vuole nel suo roster.
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Ruolo: <strong>{ROLE_LABEL[career.pendingOffer.role]}</strong>
            {' · '}Stipendio: <strong>€{career.pendingOffer.monthlySalary.toLocaleString('it-IT')}/mese</strong>
            {' · '}Durata: {career.pendingOffer.durationYears} {career.pendingOffer.durationYears === 1 ? 'anno' : 'anni'}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => handleTransferResponse('accept')} className="tap-scale" style={{
              flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff',
            }}>✅ Accetta</button>
            <button onClick={() => handleTransferResponse('negotiate')} className="tap-scale" style={{
              flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, border: '1px solid rgba(96,165,250,0.4)', cursor: 'pointer',
              background: 'rgba(96,165,250,0.10)', color: '#93c5fd',
            }}>🤝 Negozia</button>
            <button onClick={() => handleTransferResponse('reject')} className="tap-scale" style={{
              flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, border: '1px solid rgba(239,68,68,0.4)', cursor: 'pointer',
              background: 'rgba(239,68,68,0.08)', color: '#fca5a5',
            }}>❌ Rifiuta</button>
          </div>
        </div>
      )}

      {/* Last season stats — only for pro_athlete */}
      {career.type === 'pro_athlete' && career.seasonHistory && career.seasonHistory.length > 0 && (() => {
        const last = career.seasonHistory[career.seasonHistory.length - 1]
        return (
          <div className="card" style={{
            padding: 14, marginBottom: 14,
            background: 'linear-gradient(135deg, rgba(168,85,247,0.10) 0%, var(--bg-card) 70%)',
            border: '1px solid rgba(168,85,247,0.28)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd', marginBottom: 10 }}>
              📊 Ultima Stagione ({last.year})
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              {last.teamEmoji} {last.teamName}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {[
                { label: 'Partite', val: last.matches, emoji: '🏟️' },
                { label: 'Gol', val: last.goals, emoji: '⚽' },
                { label: 'Assist', val: last.assists, emoji: '🎯' },
                { label: 'Rating', val: last.averageRating.toFixed(1), emoji: '⭐' },
              ].map(({ label, val, emoji }) => (
                <div key={label} style={{
                  flex: '1 1 60px', textAlign: 'center', padding: '8px 6px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>{val}</p>
                  <p style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}>{label}</p>
                </div>
              ))}
            </div>
            {last.trophies.length > 0 && (
              <p style={{ fontSize: 11, color: '#fcd34d', marginBottom: 4 }}>
                🏆 {last.trophies.join(', ')}
              </p>
            )}
            {last.personalAward && (
              <p style={{ fontSize: 11, color: '#f9a8d4', marginBottom: 4 }}>
                🌟 {last.personalAward}
              </p>
            )}
            {last.injuries > 0 && (
              <p style={{ fontSize: 11, color: '#fca5a5' }}>
                🏥 {last.injuries} {last.injuries === 1 ? 'infortunio' : 'infortuni'} questa stagione
              </p>
            )}
          </div>
        )
      })()}

      {/* Career legacy */}
      {career.careerLegacy && (
        <div style={{
          marginBottom: 14, padding: '10px 14px', borderRadius: 12,
          background: `${LEGACY_COLORS[career.careerLegacy]}18`,
          border: `1px solid ${LEGACY_COLORS[career.careerLegacy]}40`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>
            {career.careerLegacy === 'leggenda_mondiale' ? '🌍' : career.careerLegacy === 'leggenda_nazionale' ? '🏅' : career.careerLegacy === 'professionista' ? '📋' : '💤'}
          </span>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: LEGACY_COLORS[career.careerLegacy] }}>
              Legacy
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', textTransform: 'capitalize' }}>
              {CareerLifecycleEngine.legacyLabel(career.careerLegacy)}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isRetired && (
        <>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 8 }}>
            Azioni disponibili
          </p>
          {availableActions.length === 0 ? (
            <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div>
              <p style={{ fontSize: 13, color: 'var(--color-text)' }}>Nessuna azione disponibile per ora.</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Hai esaurito i tentativi di quest'anno: invecchia per sbloccarne di nuovi.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableActions.map(action => {
                const cantAffordMoney = money < action.moneyCost
                const cantAffordEnergy = energy < action.energyCost
                const disabled = cantAffordMoney || cantAffordEnergy
                const reason = cantAffordMoney
                  ? `Servono €${action.moneyCost.toLocaleString('it-IT')}`
                  : cantAffordEnergy
                    ? `Serve ${action.energyCost} energia`
                    : null
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id, action.emoji)}
                    disabled={disabled}
                    className={disabled ? 'card' : 'card tap-scale'}
                    style={{
                      display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px',
                      textAlign: 'left', width: '100%', border: '1px solid var(--border-soft)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.55 : 1,
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {action.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{action.label}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{action.description}</p>
                      {reason && (
                        <p style={{ fontSize: 10, color: '#fca5a5', marginTop: 3 }}>⚠️ {reason}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                        ⚡ {action.energyCost}
                      </span>
                      {action.moneyCost > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' }}>
                          €{action.moneyCost.toLocaleString('it-IT')}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Abandon career */}
          <button
            onClick={() => setConfirmQuit(true)}
            className="tap-scale"
            style={{
              width: '100%', marginTop: 18, padding: '12px 0', borderRadius: 'var(--radius-pill)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5',
            }}
          >
            🚪 Abbandona carriera
          </button>
        </>
      )}

      <ConfirmDialog
        open={confirmQuit}
        title="Abbandonare la carriera?"
        message="Perderai fama e progressi accumulati. Questa scelta è definitiva."
        confirmLabel="Abbandona"
        cancelLabel="Resta"
        danger
        onConfirm={doQuit}
        onCancel={() => setConfirmQuit(false)}
      />
    </div>
  )
}
