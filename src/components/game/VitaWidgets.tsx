import { lazy, Suspense, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import { useWalletStore } from '../../store/walletStore'
import { LifePhaseEngine } from '../../services/LifePhaseEngine'
import { AdRewardEngine } from '../../services/AdRewardEngine'
import { AdRewardButton } from './AdRewardButton'
import { DailyQuestEngine } from '../../services/DailyQuestEngine'
import type { Tab } from '../navigation/BottomTabs'
import type { DailyQuest } from '../../store/types'

const NpcEditorModal = lazy(() => import('./NpcEditorModal').then(m => ({ default: m.NpcEditorModal })))

// Ad-based rewards are live only on native apps (web waits for AdSense approval)
const REWARDS_LIVE = Capacitor.isNativePlatform()

interface Props {
  setActiveTab: (tab: Tab) => void
  setVitaSection: (section: 'home' | 'shop' | 'account' | 'rewards') => void
  setActivitiesSub: (sub: string) => void
  setLavoroSub: (sub: string) => void
  setRelazioniSub: (sub: string) => void
}

// ─── Life Chapter Strip ───────────────────────────────────────────────────────

function LifeChapterStrip() {
  const { time, narrative } = useGameStore(useShallow(s => ({
    time: s.time,
    narrative: s.narrative,
  })))
  const gameState = useGameStore()
  const [recapOpen, setRecapOpen] = useState(false)

  const { phase } = LifePhaseEngine.evaluate(gameState)
  const lastRecap = narrative?.phaseRecaps?.slice(-1)[0] ?? null

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>{phase.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 17, fontWeight: 800, color: 'var(--color-text)',
              letterSpacing: '-0.02em',
            }}>
              {phase.label}
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              · {time.age} anni
            </span>
          </div>
          <p style={{
            fontSize: 12, color: 'var(--color-text-secondary)',
            fontStyle: 'italic', margin: 0, lineHeight: 1.4,
          }}>
            {phase.tagline}
          </p>
        </div>
      </div>

      {lastRecap && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setRecapOpen(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, color: 'var(--text-faint)', fontWeight: 600,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            📖 Capitolo precedente {recapOpen ? '▲' : '▼'}
          </button>
          {recapOpen && (
            <div style={{ marginTop: 8 }}>
              <p style={{
                fontSize: 12, color: 'var(--color-text-secondary)',
                lineHeight: 1.6, fontStyle: 'italic', margin: 0,
              }}>
                {lastRecap.summary}
              </p>
              {lastRecap.completedObjectives.length > 0 && (
                <p style={{ fontSize: 10, color: '#10b981', margin: '6px 0 0', lineHeight: 1.4 }}>
                  ✅ {lastRecap.completedObjectives.join(' · ')}
                </p>
              )}
              {lastRecap.missedObjectives.length > 0 && (
                <p style={{ fontSize: 10, color: '#f59e0b', margin: '4px 0 0', lineHeight: 1.4 }}>
                  ⬜ {lastRecap.missedObjectives.join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Economy Strip ────────────────────────────────────────────────────────────

function EconomyStrip({ setVitaSection }: Pick<Props, 'setVitaSection'>) {
  const gems = useWalletStore(s => s.gems)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 12px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(255,255,255,0.07)',
      marginBottom: 14,
    }}>
      <span style={{ fontSize: 16 }}>💎</span>
      <span style={{
        fontSize: 14, fontWeight: 700, color: '#a78bfa', flex: 1,
      }}>
        {gems.toLocaleString('it-IT')}
      </span>
      <button
        onClick={() => setVitaSection('shop')}
        style={{
          padding: '5px 12px', borderRadius: 'var(--radius-pill)',
          background: 'rgba(168,85,247,0.14)', border: '1px solid rgba(168,85,247,0.28)',
          color: '#c4b5fd', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        }}
      >
        🛒 Shop
      </button>
      <button
        onClick={() => setVitaSection('rewards')}
        style={{
          padding: '5px 12px', borderRadius: 'var(--radius-pill)',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)',
          color: '#4ade80', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        }}
      >
        🎁 Premi
      </button>
    </div>
  )
}

// ─── Reward banner ────────────────────────────────────────────────────────────

function RewardBanner() {
  const { adRewards, claimAdReward, aggiornaStats, dailyQuests, claimDailyQuest } =
    useGameStore(useShallow(s => ({
      adRewards: s.adRewards,
      claimAdReward: s.claimAdReward,
      aggiornaStats: s.aggiornaStats,
      dailyQuests: s.dailyQuests,
      claimDailyQuest: s.claimDailyQuest,
    })))

  // Only surface ad rewards on native apps; web/PWA shows nothing until AdSense approval
  const canAd = REWARDS_LIVE && AdRewardEngine.canWatch(adRewards).ok
  const questState = DailyQuestEngine.ensure(dailyQuests)
  const pendingQuests: DailyQuest[] = questState.quests.filter(
    q => questState.completedQuestIds.includes(q.id) && !q.claimed
  )

  if (!canAd && pendingQuests.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
      {canAd && (
        <div style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99,102,241,0.07)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
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

      {pendingQuests.length > 0 && (
        <div style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.2)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>
            🏆 {pendingQuests.length} quest {pendingQuests.length === 1 ? 'completata' : 'completate'} — ritira il premio!
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

// ─── God Mode panel ───────────────────────────────────────────────────────────

function GodModePanel() {
  const godModeUnlocked = useGameStore(s => s.settings.godModeUnlocked)
  const [showNpcEditor, setShowNpcEditor] = useState(false)
  if (!godModeUnlocked) return null
  return (
    <div style={{
      marginBottom: 12, padding: '12px 14px',
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(160deg, rgba(124,58,237,0.16) 0%, rgba(27,23,51,0.4) 100%)',
      border: '1px solid rgba(167,139,250,0.3)',
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

// ─── Combined export ──────────────────────────────────────────────────────────

export function VitaWidgets({ setVitaSection }: Props) {
  return (
    <>
      <LifeChapterStrip />
      <EconomyStrip setVitaSection={setVitaSection} />
      <RewardBanner />
      <GodModePanel />
    </>
  )
}
