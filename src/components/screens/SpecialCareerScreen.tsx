import { useGameStore } from '../../store/gameStore'
import { SpecialCareerEngine, type SpecialCareerType } from '../../services/SpecialCareerEngine'
import { useToastStore } from '../../store/toastStore'
import { haptic } from '../../services/HapticEngine'

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

export function SpecialCareerScreen() {
  const career = useGameStore(s => s.specialCareer)
  const age = useGameStore(s => s.time.age)
  const money = useGameStore(s => s.finance.money)
  const energy = useGameStore(s => s.stats.energy)
  const sports = useGameStore(s => s.sports ?? [])
  const diminishingReturns = useGameStore(s => s.diminishingReturns)
  const startSpecialCareer = useGameStore(s => s.startSpecialCareer)
  const performSpecialCareerAction = useGameStore(s => s.performSpecialCareerAction)
  const quitSpecialCareer = useGameStore(s => s.quitSpecialCareer)
  const showPanel = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const flash = (msg: string, ok: boolean, emoji = '🌟', effects: Record<string, number> = {}) => {
    haptic(ok ? 'success' : 'error')
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => closePanel(), 3500)
  }

  const handleStart = (type: SpecialCareerType) => {
    const r = startSpecialCareer(type)
    flash(r.message, r.success, CAREER_META[type].emoji, r.effects as Record<string, number>)
  }

  const handleAction = (actionId: string, emoji: string) => {
    const r = performSpecialCareerAction(actionId)
    flash(r.message, r.success, emoji, r.effects as Record<string, number>)
  }

  const handleQuit = () => {
    if (!window.confirm('Vuoi davvero abbandonare la carriera? Perderai fama e progressi.')) return
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
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', width: 80, flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
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

      {/* Actions */}
      {!isRetired && (
        <>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 8 }}>
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
            onClick={handleQuit}
            className="tap-scale"
            style={{
              width: '100%', marginTop: 18, padding: '12px 0', borderRadius: 12,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5',
            }}
          >
            🚪 Abbandona carriera
          </button>
        </>
      )}
    </div>
  )
}
