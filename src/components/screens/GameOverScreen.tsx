import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'
import { LegacyEngine } from '../../services/LegacyEngine'
import { CloudSaveService } from '../../services/CloudSaveService'
import { useWalletStore } from '../../store/walletStore'
import { AdRewardEngine } from '../../services/AdRewardEngine'
import { AdRewardButton } from '../game/AdRewardButton'
import { RegretEngine } from '../../services/RegretEngine'
import type { LifeMemory } from '../../store/types'

function getLifeGrade(score: number): { letter: string; color: string; label: string } {
  if (score >= 750) return { letter: 'A', color: '#10b981', label: 'Vita Straordinaria' }
  if (score >= 500) return { letter: 'B', color: '#3b82f6', label: 'Vita Ricca' }
  if (score >= 300) return { letter: 'C', color: '#f59e0b', label: 'Vita Dignitosa' }
  if (score >= 150) return { letter: 'D', color: '#f97316', label: 'Vita Difficile' }
  return { letter: 'F', color: '#ef4444', label: 'Vita Travagliata' }
}

const deathMessages: Record<string, { emoji: string; title: string; text: string }> = {
  natural:   { emoji: '🕊️',  title: 'Morte Naturale',     text: 'Hai vissuto una vita piena. Hai raggiunto la fine del tuo cammino in pace.' },
  disease:   { emoji: '🏥',  title: 'Malattia',           text: 'La tua salute si è deteriorata oltre il punto di non ritorno.' },
  suicide:   { emoji: '😔',  title: 'Crisi Mentale',      text: 'Il peso della mente è diventato insostenibile.' },
  accident:  { emoji: '🚗',  title: 'Incidente Stradale', text: 'Un tragico incidente ha messo fine alla tua storia.' },
  overdose:  { emoji: '💊',  title: 'Overdose',           text: 'La dipendenza ti ha consumato.' },
  murder:    { emoji: '🔫',  title: 'Omicidio',           text: 'I tuoi nemici hanno avuto la meglio.' },
  execution: { emoji: '⚖️',  title: 'Esecuzione',         text: 'La giustizia ha pronunciato la sua sentenza finale.' },
  war:       { emoji: '⚔️',  title: 'Morte in Guerra',    text: 'Hai sacrificato la vita per il tuo paese.' },
  disaster:  { emoji: '🌊',  title: 'Disastro Naturale',  text: 'Un evento catastrofico ha spezzato la tua storia.' },
}

const LEGACY_TIER_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  poor:      { label: 'Povera',      emoji: '⚫', color: '#666' },
  fair:      { label: 'Discreta',    emoji: '🥉', color: '#cd7f32' },
  good:      { label: 'Buona',       emoji: '🥈', color: '#aaa' },
  great:     { label: 'Grande',      emoji: '🥇', color: '#ffd700' },
  legendary: { label: 'Leggendaria', emoji: '💎', color: '#00e5ff' },
}

export function GameOverScreen() {
  const store = useGameStore()
  const { deathType, time, stats, finance, completedGoals, goals, newGame, identity, continueAsChild, legacy, adRewards, claimAdReward, aggiornaStats, lifeMemories } =
    useGameStore(useShallow(s => ({
      deathType: s.deathType,
      time: s.time,
      stats: s.stats,
      finance: s.finance,
      completedGoals: s.completedGoals,
      goals: s.goals,
      newGame: s.newGame,
      identity: s.identity,
      continueAsChild: s.continueAsChild,
      legacy: s.legacy,
      ribbons: s.ribbons,
      adRewards: s.adRewards,
      claimAdReward: s.claimAdReward,
      aggiornaStats: s.aggiornaStats,
      lifeMemories: s.lifeMemories,
    })))

  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error' | 'noauth'>('idle')
  const [extraLifeUsed, setExtraLifeUsed] = useState(false)
  const [adError, setAdError] = useState('')
  const [shareDone, setShareDone] = useState(false)
  const [showNewLifeSplash, setShowNewLifeSplash] = useState(false)

  const handleNewLife = () => {
    setShowNewLifeSplash(true)
    setTimeout(() => {
      newGame({ ...identity, emoji: '👶' }, 'italy')
    }, 2000)
  }

  const death = deathMessages[deathType ?? 'natural'] ?? deathMessages.natural
  const goalsCount = completedGoals.length
  const totalGoals = goals.length

  const legacyScore = legacy?.legacyScore != null
    ? { total: legacy.legacyScore, tier: LegacyEngine.calculateLegacyScore(store).tier, breakdown: LegacyEngine.calculateLegacyScore(store).breakdown }
    : LegacyEngine.calculateLegacyScore(store)
  const tierInfo = LEGACY_TIER_INFO[legacyScore.tier]
  const bestChild = LegacyEngine.getBestChild(store)
  const lifeGrade = getLifeGrade(legacyScore.total)
  const highlights: LifeMemory[] = (lifeMemories ?? [])
    .filter(m => m.isImportant)
    .sort((a, b) => b.age - a.age)
    .slice(0, 6)

  const canUseExtraLife = !extraLifeUsed && AdRewardEngine.canWatch(adRewards).ok
  const regrets = RegretEngine.computeRegrets(store)
  const epitaph = RegretEngine.computeEpitaph(store)

  async function handleSubmitLeaderboard() {
    const user = await CloudSaveService.getCurrentUser()
    if (!user) { setSubmitState('noauth'); return }
    setSubmitState('submitting')
    const trophies = store.ribbons.filter(r => r.unlockedYear != null).length
    try {
      await CloudSaveService.uploadLeaderboard({
        username: identity.name + ' ' + identity.surname,
        longevity: time.age,
        wealth: Math.max(0, finance.money),
        happiness: Math.round(stats.happiness),
        karma: Math.round(stats.karma + 100),
        ribbons: trophies,
        ageReached: time.age,
      })
      // Record this life in the personal past_lives leaderboard + claim bonus gems
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
        const res = await fetch(`${supabaseUrl}/functions/v1/game-over`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            final_age: time.age,
            final_money: Math.max(0, Math.round(finance.money)),
            trophies_earned: trophies,
          }),
        })
        if (res.ok) {
          const { total_gems } = await res.json() as { bonus_gems: number; total_gems: number }
          useWalletStore.getState().setEntitlements({ gems_balance: total_gems })
        }
      } catch { /* past_lives recording is best-effort */ }
      setSubmitState('done')
    } catch {
      setSubmitState('error')
    }
  }

  async function handleShare() {
    const text = `Ho vissuto ${time.age} ${time.age === 1 ? 'anno' : 'anni'} su Life Simulator 2D! 🎮\n💰 €${finance.money.toLocaleString('it-IT')} | 😊 Felicità ${Math.round(stats.happiness)}/100 | 🎯 ${completedGoals.length} goals\nQuanto vivi tu? → life-simulator-2d.vercel.app`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Life Simulator 2D', text })
        setShareDone(true)
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text)
      setShareDone(true)
      setTimeout(() => setShareDone(false), 3000)
    }
  }

  function handleExtraLifeClaim() {
    const res = claimAdReward()
    if (!res.ok) {
      setAdError(res.reason ?? 'Non disponibile')
      return res
    }
    // Revive: restore health + mentalHealth, give energy
    aggiornaStats({ health: 35, mentalHealth: 30, energy: 40, happiness: 15 })
    setExtraLifeUsed(true)
    setAdError('')
    useGameStore.setState({ isGameOver: false, deathType: null })
    return res
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, overflowY: 'auto' }}>
      <div className="screen-container">
        {/* Death */}
        <div style={{ fontSize: 64, marginBottom: 12, textAlign: 'center' }}>{death.emoji}</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-text)', textAlign: 'center' }}>{death.title}</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: 20 }}>{death.text}</p>

        {/* Extra life via rewarded ad */}
        {!extraLifeUsed && deathType !== 'natural' && (
          <div className="card" style={{ width: '100%', marginBottom: 16, border: '1px solid rgba(99,102,241,0.4)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>💊 Seconda Possibilità</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
              Guarda un breve annuncio per tornare in vita con salute al 35%.
            </p>
            {adError && <p style={{ fontSize: 11, color: '#f59e0b', marginBottom: 8 }}>{adError}</p>}
            {canUseExtraLife ? (
              <AdRewardButton
                adState={adRewards}
                onClaim={handleExtraLifeClaim}
                compact
              />
            ) : (
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                {AdRewardEngine.canWatch(adRewards).reason ?? 'Limite annunci raggiunto per oggi.'}
              </p>
            )}
          </div>
        )}

        {/* Life stats */}
        <div className="card" style={{ width: '100%', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 600 }}>
            Statistiche di Vita
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[
              { label: 'Anni vissuti',     val: `${time.age}`,                               emoji: '🎂' },
              { label: 'Anno morte',       val: `${time.year}`,                               emoji: '📅' },
              { label: 'Denaro finale',    val: `€${finance.money.toLocaleString('it-IT')}`,  emoji: '💰' },
              { label: 'Goals completati', val: `${goalsCount}/${totalGoals}`,                emoji: '🎯' },
              { label: 'Salute finale',    val: `${Math.round(stats.health)}/100`,            emoji: '❤️' },
              { label: 'Felicità finale',  val: `${Math.round(stats.happiness)}/100`,         emoji: '😊' },
            ].map(({ label, val, emoji }) => (
              <div key={label} style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 8, minWidth: 0 }}>
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{emoji} {label}</p>
                <p style={{ fontWeight: 700, fontSize: 15, overflowWrap: 'anywhere' }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Life grade */}
        <div className="card" style={{ width: '100%', marginBottom: 16, textAlign: 'center', padding: '20px 16px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: '50%',
            background: `${lifeGrade.color}22`, border: `3px solid ${lifeGrade.color}`,
            fontSize: 36, fontWeight: 900, color: lifeGrade.color, marginBottom: 8,
          }}>
            {lifeGrade.letter}
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: lifeGrade.color, margin: '0 0 4px' }}>{lifeGrade.label}</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {identity.name} {identity.surname} · {time.age} {time.age === 1 ? 'anno' : 'anni'} · {time.year}
          </p>
        </div>

        {/* Life highlights */}
        {highlights.length > 0 && (
          <div className="card" style={{ width: '100%', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 600 }}>
              Momenti Indimenticabili
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {highlights.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{m.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{m.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      {m.description.slice(0, 80)}{m.description.length > 80 ? '…' : ''} · età {m.age}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Epitaph */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontStyle: 'italic', color: '#9ca3af', lineHeight: 1.6 }}>{epitaph}</p>
        </div>

        {/* Regrets */}
        <div className="card" style={{ width: '100%', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 600 }}>
            💭 Rimpianti
          </p>
          {regrets.length === 0 ? (
            <p style={{ fontSize: 13, color: '#10b981', fontStyle: 'italic' }}>Nessun rimpianto: hai vissuto pienamente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {regrets.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{r.emoji}</span>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', marginBottom: 16,
            background: shareDone ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.1)',
            color: shareDone ? '#10b981' : '#a78bfa',
          }}
        >
          {shareDone ? '✅ Copiato negli appunti!' : '📤 Condividi il tuo risultato'}
        </button>

        {/* Legacy */}
        <div className="card" style={{ width: '100%', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 600 }}>
            Eredità Lasciata
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>{tierInfo.emoji}</span>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: tierInfo.color }}>{legacyScore.total}/1000</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Legacy {tierInfo.label}</p>
            </div>
          </div>
          {Object.entries(legacyScore.breakdown).map(([key, val]) => {
            const maxes: Record<string, number> = { wealth: 200, family: 200, career: 150, achievements: 150, character: 150, adventure: 150 }
            const labels: Record<string, string> = {
              wealth: '💰 Ricchezza', family: '👨‍👩‍👧 Famiglia', career: '💼 Carriera',
              achievements: '🎯 Traguardi', character: '⭐ Carattere', adventure: '✈️ Avventura',
            }
            return (
              <div key={key} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{labels[key]}</span>
                  <span style={{ fontWeight: 600 }}>{val}/{maxes[key]}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <div style={{ height: '100%', borderRadius: 2, background: tierInfo.color, width: `${(val / maxes[key]) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Leaderboard submission */}
        {CloudSaveService.isConfigured() && (
          <div className="card" style={{ width: '100%', marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', marginBottom: 8 }}>🏆 Pubblica in Classifica</p>
            {submitState === 'idle' && (
              <button
                onClick={handleSubmitLeaderboard}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', background: '#fbbf24', color: '#000',
                }}
              >
                📤 Invia il tuo punteggio finale
              </button>
            )}
            {submitState === 'submitting' && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center' }}>Invio in corso...</p>
            )}
            {submitState === 'done' && (
              <p style={{ fontSize: 13, color: '#10b981', textAlign: 'center' }}>✅ Punteggio pubblicato in classifica!</p>
            )}
            {submitState === 'error' && (
              <p style={{ fontSize: 12, color: '#ef4444' }}>❌ Errore. Vai in Profilo → Classifica per riprovare.</p>
            )}
            {submitState === 'noauth' && (
              <p style={{ fontSize: 12, color: '#f59e0b' }}>
                ⚠️ Devi essere loggato. Vai in Profilo → Impostazioni → Cloud Save per accedere.
              </p>
            )}
          </div>
        )}

        {/* Continue as child */}
        {bestChild && (
          <div className="card" style={{ width: '100%', marginBottom: 16, border: `1px solid ${tierInfo.color}` }}>
            <p style={{ fontSize: 12, color: tierInfo.color, marginBottom: 8, fontWeight: 700 }}>👶 CONTINUA LA STORIA</p>
            <p style={{ fontSize: 14, marginBottom: 4 }}>
              Vuoi continuare come <strong>{bestChild.name}</strong>?
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              {bestChild.age} anni · Legame: {Math.round(bestChild.bondWithPlayer)}% ·
              Eredità: €{Math.round(finance.money * LegacyEngine.calculateBonuses(legacyScore).moneyMultiplier).toLocaleString()}
            </p>
            <button
              className="btn-age"
              onClick={() => continueAsChild(bestChild.id)}
              style={{ width: '100%', marginBottom: 8, background: tierInfo.color, color: '#000' }}
            >
              ▶️ Continua come {bestChild.name}
            </button>
          </div>
        )}

        {/* New game */}
        <button
          className="btn-age"
          onClick={handleNewLife}
          style={{ width: '100%', opacity: 0.7 }}
        >
          🔄 Nuova Vita (Ricomincia)
        </button>

        {/* "Nuova Vita!" splash overlay */}
        {showNewLifeSplash && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'var(--bg-app, #1a1a2e)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <span style={{ fontSize: 72 }}>🎉</span>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-text, #fff)', textAlign: 'center', margin: 0 }}>
              Nuova Vita!
            </h1>
            <p style={{ fontSize: 16, color: 'var(--color-text-secondary, rgba(255,255,255,0.6))', textAlign: 'center', margin: 0 }}>
              In bocca al lupo con questa ahah
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
