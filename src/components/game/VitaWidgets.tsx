import { lazy, Suspense, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import { LifePhaseWidget } from './LifePhaseWidget'
import { AdRewardEngine } from '../../services/AdRewardEngine'
import { AdRewardButton } from './AdRewardButton'
import { DailyQuestEngine } from '../../services/DailyQuestEngine'
import type { Tab } from '../navigation/BottomTabs'
import type { DailyQuest } from '../../store/types'

const NpcEditorModal = lazy(() => import('./NpcEditorModal').then(m => ({ default: m.NpcEditorModal })))

interface Props {
  setActiveTab: (tab: Tab) => void
  setVitaSection: (section: 'home' | 'shop' | 'account' | 'rewards') => void
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

// ─── Short-term objective card ───────────────────────────────────────────────

function CurrentObjective(props: Props) {
  const { setActiveTab, setActivitiesSub, setLavoroSub, setRelazioniSub } = props
  const { time, stats, career, education, finance, relationships, children, criminal } =
    useGameStore(useShallow(s => ({
      time: s.time,
      stats: s.stats,
      career: s.career,
      education: s.education,
      finance: s.finance,
      relationships: s.relationships,
      children: s.children,
      criminal: s.criminal,
    })))

  if (criminal.inPrison) return null

  interface Obj { emoji: string; label: string; done: boolean; onClick: () => void }
  let objectives: Obj[] = []

  if (time.age < 13) {
    // Infanzia
    const hasFriend = relationships.some(r => r.type === 'friend' && r.isAlive)
    const goodGpa = education.gpa >= 3.0
    const hasHobby = false // placeholder
    objectives = [
      { emoji: '👫', label: 'Fatti un amico', done: hasFriend, onClick: () => { setActiveTab('relazioni'); setRelazioniSub('relationships') } },
      { emoji: '📚', label: 'GPA ≥ 3.0', done: goodGpa, onClick: () => { setActiveTab('lavoro'); setLavoroSub('education') } },
      { emoji: '🎮', label: 'Coltiva un hobby', done: hasHobby, onClick: () => { setActiveTab('activities'); setActivitiesSub('hobby') } },
    ]
  } else if (time.age < 20) {
    // Adolescenza
    const hasDiploma = education.completedLevels.includes('highschool')
    const hasLove = relationships.some(r => ['partner','spouse'].includes(r.stage ?? '') && r.isAlive)
    const hasJob = !!career.currentJob || career.jobHistory.length > 0
    objectives = [
      { emoji: '🎓', label: 'Diploma di liceo', done: hasDiploma, onClick: () => { setActiveTab('lavoro'); setLavoroSub('education') } },
      { emoji: '❤️', label: 'Primo amore', done: hasLove, onClick: () => { setActiveTab('relazioni'); setRelazioniSub('relationships') } },
      { emoji: '💼', label: 'Primo lavoro', done: hasJob, onClick: () => { setActiveTab('lavoro'); setLavoroSub('career') } },
    ]
  } else if (time.age < 40) {
    // Giovinezza
    const livesAlone = true // simplified
    const hasJob = !!career.currentJob
    const hasSavings = finance.money >= 10000
    objectives = [
      { emoji: '🏠', label: 'Indipendenza economica', done: livesAlone && hasJob, onClick: () => { setActiveTab('lavoro'); setLavoroSub('career') } },
      { emoji: '💰', label: 'Risparmia €10.000', done: hasSavings, onClick: () => { setActiveTab('lavoro'); setLavoroSub('finance') } },
      { emoji: '💍', label: 'Relazione stabile', done: relationships.some(r => ['partner','spouse'].includes(r.stage ?? '') && r.isAlive), onClick: () => { setActiveTab('relazioni'); setRelazioniSub('relationships') } },
    ]
  } else if (time.age < 65) {
    // Maturità
    const hasWealth = finance.money >= 100000
    const hasFamily = children.length > 0
    const healthOk = stats.health >= 50
    objectives = [
      { emoji: '💰', label: 'Patrimonio €100.000', done: hasWealth, onClick: () => { setActiveTab('lavoro'); setLavoroSub('finance') } },
      { emoji: '👨‍👩‍👧', label: 'Costruisci una famiglia', done: hasFamily, onClick: () => { setActiveTab('relazioni'); setRelazioniSub('parenting') } },
      { emoji: '❤️', label: 'Salute ≥ 50', done: healthOk, onClick: () => { setActiveTab('activities'); setActivitiesSub('health') } },
    ]
  } else {
    // Vecchiaia
    const liveRels = relationships.filter(r => r.isAlive && !['parent'].includes(r.type)).length
    const healthOk = stats.health >= 40
    objectives = [
      { emoji: '👥', label: '≥ 2 legami vivi', done: liveRels >= 2, onClick: () => { setActiveTab('relazioni'); setRelazioniSub('relationships') } },
      { emoji: '❤️', label: 'Salute ≥ 40', done: healthOk, onClick: () => { setActiveTab('activities'); setActivitiesSub('health') } },
      { emoji: '😊', label: 'Felicità ≥ 60', done: stats.happiness >= 60, onClick: () => { setActiveTab('activities'); setActivitiesSub('hobby') } },
    ]
  }

  const done = objectives.filter(o => o.done).length
  const total = objectives.length

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
          🎯 Obiettivi di fase
        </p>
        <p style={{ fontSize: 11, color: done === total ? '#10b981' : 'var(--color-text-secondary)' }}>
          {done}/{total}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {objectives.map((o, i) => (
          <button key={i} onClick={o.done ? undefined : o.onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 10,
              border: `1px solid ${o.done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
              background: o.done ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.03)',
              cursor: o.done ? 'default' : 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{o.done ? '✅' : o.emoji}</span>
            <p style={{ fontSize: 12, fontWeight: 500, color: o.done ? '#6ee7b7' : 'var(--color-text)', margin: 0,
              textDecoration: o.done ? 'line-through' : 'none' }}>
              {o.label}
            </p>
            {!o.done && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-secondary)' }}>›</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Vita Hub Navigation ─────────────────────────────────────────────────────

function VitaHubNav({ setVitaSection }: Pick<Props, 'setVitaSection'>) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        🎮 Hub Principale
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {([
          { section: 'shop'    as const, emoji: '🛒', label: 'Shop',    color: '#a78bfa', border: 'rgba(168,85,247,0.2)',  bg: 'rgba(168,85,247,0.05)',  hoverBg: 'rgba(168,85,247,0.1)'  },
          { section: 'account' as const, emoji: '👤', label: 'Account', color: '#60a5fa', border: 'rgba(59,130,246,0.2)',  bg: 'rgba(59,130,246,0.05)',  hoverBg: 'rgba(59,130,246,0.1)'  },
          { section: 'rewards' as const, emoji: '🎁', label: 'Rewards', color: '#4ade80', border: 'rgba(34,197,94,0.2)',   bg: 'rgba(34,197,94,0.05)',   hoverBg: 'rgba(34,197,94,0.1)'   },
        ]).map(({ section, emoji, label, color, border, bg, hoverBg }) => (
          <button
            key={section}
            onClick={() => setVitaSection(section)}
            onMouseOver={e => (e.currentTarget.style.background = hoverBg)}
            onMouseOut={e  => (e.currentTarget.style.background = bg)}
            style={{
              padding: '12px 8px', borderRadius: 12,
              border: `1px solid ${border}`, background: bg,
              cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600,
              color, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}
          >
            <span style={{ fontSize: 20 }}>{emoji}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── God Mode panel (only when unlocked) ─────────────────────────────────────

function GodModePanel() {
  const godModeUnlocked = useGameStore(s => s.settings.godModeUnlocked)
  const [showNpcEditor, setShowNpcEditor] = useState(false)
  if (!godModeUnlocked) return null
  return (
    <div className="card" style={{
      marginBottom: 12, padding: '12px 14px',
      background: 'linear-gradient(160deg, rgba(124,58,237,0.22) 0%, rgba(27,23,51,0.5) 100%)',
      border: '1px solid rgba(167,139,250,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>God Mode</span>
      </div>
      <button
        onClick={() => setShowNpcEditor(true)}
        className="btn-candy btn-candy--primary"
        style={{ width: '100%', fontSize: 13, padding: '9px 0' }}
      >
        🧬 Editor NPC
      </button>
      {showNpcEditor && (
        <Suspense fallback={null}>
          <NpcEditorModal onClose={() => setShowNpcEditor(false)} />
        </Suspense>
      )}
    </div>
  )
}

// ─── Combined export ─────────────────────────────────────────────────────────

export function VitaWidgets(props: Props) {
  return (
    <>
      <LifePhaseWidget />
      <VitaHubNav setVitaSection={props.setVitaSection} />
      <GodModePanel />
      <RewardBanner />
      <CurrentObjective {...props} />
      <SuggestedActions {...props} />
    </>
  )
}
