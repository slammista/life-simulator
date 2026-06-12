import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getAllSportDefs, getSportDef, type SportDef } from '../../services/SportEngine'
import { MinorEconomyEngine } from '../../services/MinorEconomyEngine'
import { useToastStore } from '../../store/toastStore'
import { haptic } from '../../services/HapticEngine'
import type { SportCategory } from '../../store/types'
import { SportCompetitionEngine } from '../../services/SportCompetitionEngine'

const CATEGORY_LABELS: Record<SportCategory, string> = {
  team: '👥 Squadra',
  individual: '🏃 Individuali',
  combat: '🥋 Combattimento',
  water: '🌊 Acquatici',
  winter: '❄️ Invernali',
  racket: '🎾 Racchetta',
  extreme: '🧗 Estremi',
}

const CATEGORY_ORDER: SportCategory[] = ['team', 'individual', 'combat', 'racket', 'water', 'winter', 'extreme']

export function SportScreen() {
  const sports = useGameStore(s => s.sports ?? [])
  const finance = useGameStore(s => s.finance)
  const age = useGameStore(s => s.time.age)
  const relationships = useGameStore(s => s.relationships)
  const startSport = useGameStore(s => s.startSport)
  const practiceSport = useGameStore(s => s.practiceSport)
  const quitSport = useGameStore(s => s.quitSport)
  const enterSportCompetition = useGameStore(s => s.enterSportCompetition)
  const diminishingReturns = useGameStore(s => s.diminishingReturns)
  const year = useGameStore(s => s.time.year)
  const showPanel = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const [tab, setTab] = useState<'mine' | 'discover'>('mine')

  const isMinor = age < MinorEconomyEngine.MINOR_AGE ? true : false
  const hasParents = relationships.some(r => r.type === 'parent' && r.isAlive)

  const flash = (msg: string, ok: boolean, emoji = '🏅', effects: Record<string, number> = {}) => {
    haptic(ok ? 'success' : 'error')
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => closePanel(), 3500)
  }

  const handleStart = (id: string) => {
    const r = startSport(id)
    flash(r.message, r.success, '🏅', r.effects as Record<string, number>)
    if (r.success) setTab('mine')
  }

  const handlePractice = (id: string) => {
    const r = practiceSport(id)
    flash(r.message, r.success, '⭐', r.effects as Record<string, number>)
  }

  const handleQuit = (id: string) => {
    const r = quitSport(id)
    flash(r.message, r.success, '🚫')
  }

  const handleCompete = (id: string) => {
    const r = enterSportCompetition(id)
    const emoji = r.message?.includes('VINTO') || r.message?.includes('LEGGENDARIA') ? '🏆'
      : r.message?.includes('PODIO') ? '🥈'
      : r.message?.includes('infortunato') ? '🤕'
      : '🏅'
    flash(r.message, r.success, emoji, r.effects as Record<string, number>)
  }

  const allDefs = getAllSportDefs()
  const myIds = new Set(sports.map(s => s.id))
  const discoverable = allDefs.filter(d => !myIds.has(d.id))

  // group discoverable by category
  const grouped: Record<string, SportDef[]> = {}
  for (const d of discoverable) {
    ;(grouped[d.category] ??= []).push(d)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>🏅 Sport</h2>

      {/* Minor notice */}
      {isMinor && (
        <div style={{ borderRadius: 12, padding: '10px 14px', marginBottom: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc' }}>
            👨‍👩‍👧 Sei minorenne
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>
            {hasParents
              ? 'Iscrizioni, quote e attrezzature vengono pagate dai tuoi genitori, se approvano la richiesta.'
              : 'Senza un genitore che approvi, non puoi sostenere i costi delle attività sportive.'}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['mine', 'discover'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : 'var(--color-text-secondary)' }}
          >
            {t === 'mine' ? `🏅 I miei (${sports.length})` : '🔍 Scopri'}
          </button>
        ))}
      </div>

      {/* My sports */}
      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sports.length === 0 && (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏅</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                Nessuno sport ancora.
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Lo sport migliora salute, energia e reputazione. Vai su "Scopri" per iniziarne uno.
              </p>
            </div>
          )}
          {sports.map(sport => {
            const def = getSportDef(sport.id)
            const skillColor = sport.skillLevel >= 70 ? '#10b981' : sport.skillLevel >= 40 ? '#f59e0b' : '#6366f1'
            const skillLabel = sport.skillLevel >= 80 ? 'Atleta' : sport.skillLevel >= 55 ? 'Avanzato' : sport.skillLevel >= 30 ? 'Intermedio' : 'Principiante'
            const compKey = `competition_${sport.id}_${year}`
            const compUsed = diminishingReturns[compKey] ?? 0
            const canCompete = sport.skillLevel >= 10 && compUsed < 2
            const compLevel = SportCompetitionEngine.getLevelForSkill(sport.skillLevel)
            const compLevelLabels: Record<string, string> = {
              locale: 'Locale', regionale: 'Regionale', nazionale: 'Nazionale',
              internazionale: 'Internazionale', olimpico: 'Olimpico',
            }
            return (
              <div key={sport.id} className="card" style={{
                padding: '14px',
                background: `linear-gradient(135deg, ${skillColor}10 0%, var(--bg-card) 70%)`,
                border: `1px solid ${skillColor}30`,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {def?.emoji ?? '🏅'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{sport.name}</p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: skillColor, background: `${skillColor}18`, padding: '1px 7px', borderRadius: 99, border: `1px solid ${skillColor}30` }}>
                        {skillLabel}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>dal {sport.yearStarted}</span>
                    </div>
                    {(sport.competitionsEntered > 0) && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                          🏅 {sport.competitionsEntered} gare
                        </span>
                        <span style={{ fontSize: 10, color: '#fcd34d' }}>
                          🏆 {sport.competitionsWon} vittorie
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 900, fontSize: 20, color: skillColor, lineHeight: 1 }}>{Math.round(sport.skillLevel)}</p>
                    <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 1 }}>/ 100</p>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${sport.skillLevel}%`, background: skillColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handlePractice(sport.id)}
                    className="tap-scale"
                    style={{
                      flex: 1, minWidth: 80, padding: '8px 0', borderRadius: 12,
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
                      color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(124,92,255,0.3)',
                    }}
                  >
                    Allenati
                  </button>
                  {sport.skillLevel >= 10 && (
                    <button
                      onClick={() => handleCompete(sport.id)}
                      disabled={!canCompete}
                      className={canCompete ? 'tap-scale' : undefined}
                      style={{
                        flex: 1, minWidth: 80, padding: '8px 0', borderRadius: 12,
                        background: canCompete
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : 'rgba(255,255,255,0.05)',
                        color: canCompete ? '#fff' : 'var(--color-text-secondary)',
                        fontSize: 12, fontWeight: 700, border: 'none',
                        cursor: canCompete ? 'pointer' : 'not-allowed',
                        boxShadow: canCompete ? '0 3px 12px rgba(245,158,11,0.3)' : 'none',
                      }}
                    >
                      {canCompete
                        ? `🏆 Gareggia (${compLevelLabels[compLevel]})`
                        : compUsed >= 2 ? '🏆 Max gare' : '🏆 Gareggia'}
                    </button>
                  )}
                  <button
                    onClick={() => handleQuit(sport.id)}
                    style={{
                      padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Smetti
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Discover */}
      {tab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {discoverable.length === 0 && (
            <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏅</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Pratichi già tutto!</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Hai esplorato ogni disciplina disponibile.
              </p>
            </div>
          )}
          {CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
            <div key={cat}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: 8 }}>
                {CATEGORY_LABELS[cat]}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {grouped[cat].map(def => {
                  const ageOk = age >= def.minAge
                  // Adults pay themselves; minors get parental funding, so the affordability
                  // gate only blocks adults without enough money.
                  const adultCantAfford = !isMinor && finance.money < def.costToStart
                  const disabled = !ageOk || adultCantAfford
                  const benefits = Object.entries(def.statBenefits).filter(([, v]) => v !== 0)
                  return (
                    <div key={def.id} className="card" style={{ padding: '14px', opacity: disabled ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                          {def.emoji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)', marginBottom: 3 }}>{def.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                            Da {def.minAge} anni · {def.weeklyHours}h/sett
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {def.costToStart > 0 ? (
                            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' }}>
                              €{def.costToStart.toLocaleString('it-IT')}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#86efac', fontWeight: 600 }}>Gratis</span>
                          )}
                          <p style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>€{def.annualCost}/anno</p>
                        </div>
                      </div>

                      {benefits.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                          {benefits.map(([k, v]) => (
                            <span key={k} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: (v as number) > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: (v as number) > 0 ? '#86efac' : '#fca5a5' }}>
                              {(v as number) > 0 ? '+' : ''}{v} {k}
                            </span>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => handleStart(def.id)}
                        disabled={disabled}
                        className={!disabled ? 'tap-scale' : undefined}
                        style={{
                          width: '100%', padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          background: !disabled
                            ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)'
                            : 'rgba(255,255,255,0.05)',
                          color: !disabled ? '#fff' : 'var(--color-text-secondary)',
                          boxShadow: !disabled ? '0 4px 16px rgba(124,92,255,0.3)' : 'none',
                        }}
                      >
                        {!ageOk ? `Min ${def.minAge} anni` : adultCantAfford ? `Servono €${def.costToStart.toLocaleString('it-IT')}` : isMinor ? 'Chiedi ai genitori' : 'Iscriviti'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
