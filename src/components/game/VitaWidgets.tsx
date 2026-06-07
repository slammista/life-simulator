import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import { AdRewardEngine } from '../../services/AdRewardEngine'
import { AdRewardButton } from './AdRewardButton'
import { DailyQuestEngine } from '../../services/DailyQuestEngine'
import type { Tab } from '../navigation/BottomTabs'
import type { DailyQuest } from '../../store/types'

interface Props {
  setActiveTab: (tab: Tab) => void
  setActivitiesSub: (sub: string) => void
  setLavoroSub: (sub: string) => void
  setRelazioniSub: (sub: string) => void
}

// ─── Reward banner ───────────────────────────────────────────────────────────

function RewardBanner() {
  const { adRewards, claimAdReward, aggiornaStats, dailyQuests, claimDailyQuest } =
    useGameStore(useShallow(s => ({
      adRewards: s.adRewards,
      claimAdReward: s.claimAdReward,
      aggiornaStats: s.aggiornaStats,
      dailyQuests: s.dailyQuests,
      claimDailyQuest: s.claimDailyQuest,
    })))

  const canAd = AdRewardEngine.canWatch(adRewards)
  const questState = DailyQuestEngine.ensure(dailyQuests)
  const pendingQuests: DailyQuest[] = questState.quests.filter(
    q => questState.completedQuestIds.includes(q.id) && !q.claimed
  )

  if (!canAd.ok && pendingQuests.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
      {/* Ad reward */}
      {canAd.ok && (
        <div className="card" style={{ padding: '10px 14px', border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.08)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>
            🎁 Ricompensa disponibile
          </p>
          <AdRewardButton
            adState={adRewards}
            onClaim={() => {
              const res = claimAdReward()
              if (res.ok) aggiornaStats({ money: 500, happiness: 5 })
              return res
            }}
            compact
          />
        </div>
      )}

      {/* Daily quests */}
      {pendingQuests.length > 0 && (
        <div className="card" style={{ padding: '10px 14px', border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.06)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>
            🏆 {pendingQuests.length} quest completata — ritira il premio!
          </p>
          {pendingQuests.slice(0, 2).map(q => (
            <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{q.title}</span>
              <button
                onClick={() => claimDailyQuest(q.id)}
                style={{
                  padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: '#fbbf24', color: '#000', border: 'none', cursor: 'pointer',
                }}
              >
                Ritira
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Suggested actions ────────────────────────────────────────────────────────

interface Hint {
  emoji: string
  label: string
  reason: string
  onClick: () => void
}

function useHints(props: Props): Hint[] {
  const { setActiveTab, setActivitiesSub, setLavoroSub, setRelazioniSub } = props
  const { stats, career, education, relationships, finance, criminal, retirement } =
    useGameStore(useShallow(s => ({
      stats: s.stats,
      career: s.career,
      education: s.education,
      relationships: s.relationships,
      finance: s.finance,
      criminal: s.criminal,
      retirement: s.retirement,
    })))

  const hints: Hint[] = []

  if (stats.health < 35) hints.push({
    emoji: '🏥', label: 'Visita medica urgente',
    reason: `Salute critica: ${Math.round(stats.health)}/100`,
    onClick: () => { setActiveTab('activities'); setActivitiesSub('health') },
  })

  if (!career.currentJob && !retirement.isRetired && education.currentLevel === 'none') hints.push({
    emoji: '💼', label: 'Cerca lavoro',
    reason: 'Non hai un impiego attivo',
    onClick: () => { setActiveTab('lavoro'); setLavoroSub('career') },
  })

  if (stats.happiness < 30) hints.push({
    emoji: '🎸', label: 'Fai un hobby',
    reason: `Felicità bassa: ${Math.round(stats.happiness)}/100`,
    onClick: () => { setActiveTab('activities'); setActivitiesSub('hobby') },
  })

  if (stats.mentalHealth < 35) hints.push({
    emoji: '🧠', label: 'Cura la salute mentale',
    reason: `Mente a rischio: ${Math.round(stats.mentalHealth)}/100`,
    onClick: () => { setActiveTab('activities'); setActivitiesSub('health') },
  })

  if (career.burnoutLevel > 70) hints.push({
    emoji: '😮‍💨', label: 'Prendi una pausa',
    reason: `Burnout al ${career.burnoutLevel}%`,
    onClick: () => { setActiveTab('activities'); setActivitiesSub('hobby') },
  })

  if (finance.money < 200 && !career.currentJob) hints.push({
    emoji: '💰', label: 'Hai bisogno di soldi',
    reason: `Saldo: €${finance.money.toLocaleString('it-IT')}`,
    onClick: () => { setActiveTab('lavoro'); setLavoroSub('career') },
  })

  if (relationships.filter(r => !['parent','sibling','child'].includes(r.type) && r.isAlive).length < 2) hints.push({
    emoji: '👥', label: 'Socializza di più',
    reason: 'Poche relazioni attive',
    onClick: () => { setActiveTab('relazioni'); setRelazioniSub('relationships') },
  })

  if (criminal.inPrison) hints.push({
    emoji: '🔒', label: 'Sei in prigione',
    reason: `Sentenza: ${criminal.prisonSentence - criminal.prisonServed} anni rimanenti`,
    onClick: () => { setActiveTab('activities'); setActivitiesSub('criminal') },
  })

  return hints.slice(0, 3)
}

function SuggestedActions(props: Props) {
  const hints = useHints(props)
  if (hints.length === 0) return null

  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        💡 Cosa fare adesso
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {hints.map((h, i) => (
          <button
            key={i}
            onClick={h.onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{h.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{h.label}</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{h.reason}</p>
            </div>
            <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Combined export ─────────────────────────────────────────────────────────

export function VitaWidgets(props: Props) {
  return (
    <>
      <RewardBanner />
      <SuggestedActions {...props} />
    </>
  )
}
