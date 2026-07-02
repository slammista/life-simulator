import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ChallengeEngine, CHALLENGE_DEFINITIONS } from '../../services/ChallengeEngine'
import { DailyQuestEngine } from '../../services/DailyQuestEngine'
import type { ChallengeDifficulty } from '../../services/ChallengeEngine'
import { feedback } from '../../services/FeedbackEngine'

type TabId = 'daily' | 'available' | 'active' | 'completed'

const DIFFICULTY_COLOR: Record<ChallengeDifficulty, string> = {
  easy: '#4ade80',
  medium: '#fbbf24',
  hard: '#f87171',
  legendary: '#f0abfc',
}

const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  easy: 'Facile',
  medium: 'Medio',
  hard: 'Difficile',
  legendary: '⭐ Leggendario',
}

const DIFFICULTY_POINTS: Record<ChallengeDifficulty, number> = {
  easy: 1000, medium: 3000, hard: 7000, legendary: 15000,
}

export default function ChallengeScreen() {
  const state = useGameStore(s => s)
  const acceptChallenge = useGameStore(s => s.acceptChallenge)
  const abandonChallenge = useGameStore(s => s.abandonChallenge)
  const claimDailyQuest = useGameStore(s => s.claimDailyQuest)
  const [tab, setTab] = useState<TabId>('daily')
  const [lastMsg, setLastMsg] = useState('')
  const [lastSuccess, setLastSuccess] = useState(true)

  const challengeState = state.challengeEngine
  const available = ChallengeEngine.getAvailableChallenges(state)
  const dailyQuests = DailyQuestEngine.ensure(state.dailyQuests)

  function handleAccept(defId: string) {
    const result = acceptChallenge(defId)
    feedback(result.success ? 'success' : 'error')
    setLastMsg(result.message)
    setLastSuccess(result.success)
  }

  function handleAbandon(defId: string) {
    abandonChallenge(defId)
    feedback('tap')
    setLastMsg('Challenge abbandonata.')
    setLastSuccess(false)
  }

  function handleDailyClaim(questId: string) {
    const result = claimDailyQuest(questId)
    feedback(result.success ? 'success' : 'error')
    setLastMsg(result.message)
    setLastSuccess(result.success)
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'daily', label: 'Giornaliere', count: dailyQuests.quests.filter(q => !q.claimed).length },
    { id: 'available', label: 'Disponibili', count: available.length },
    { id: 'active', label: 'Attive', count: challengeState.activeChallenges.filter(c => !c.completed && !c.failed).length },
    { id: 'completed', label: 'Completate', count: challengeState.completedChallengeIds.length },
  ]

  return (
    <div style={{ padding: '12px', maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ color: '#fbbf24', marginBottom: 8 }}>🏆 Sfide</h2>

      {/* Points & streak */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        <StatBox label="Punti totali" value={challengeState.totalPoints.toLocaleString()} valueColor="#fbbf24" />
        <StatBox label="Streak daily 🔥" value={dailyQuests.streak} valueColor="#fb923c" />
      </div>

      {/* Feedback message */}
      {lastMsg && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 12,
          background: lastSuccess ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${lastSuccess ? '#4ade80' : '#f87171'}`,
          color: lastSuccess ? '#4ade80' : '#f87171',
          fontSize: 13,
        }}>
          {lastMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#d97706' : 'rgba(255,255,255,0.08)',
              color: '#e2e8f0', fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
            }}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* DAILY */}
      {tab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={cardStyle('rgba(251,146,60,0.08)', 'rgba(251,146,60,0.22)')}>
            <div style={{ fontSize: 13, color: '#fed7aa' }}>
              📅 Quest del giorno: {dailyQuests.currentDate} · riscattate totali {dailyQuests.totalClaimed}
            </div>
          </div>
          {dailyQuests.quests.map(quest => {
            const progress = DailyQuestEngine.progress(quest, state)
            const pct = Math.min(100, Math.round((progress.value / Math.max(1, progress.target)) * 100))
            return (
              <div key={quest.id} style={cardStyle(quest.claimed ? '#4ade8015' : 'rgba(255,255,255,0.05)', quest.claimed ? '#4ade8030' : 'rgba(255,255,255,0.08)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>
                      {quest.emoji} {quest.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{quest.description}</div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: progress.completed ? '#4ade80' : '#fbbf24', borderRadius: 6 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Chip label={`${Math.min(progress.value, progress.target).toLocaleString()}/${progress.target.toLocaleString()}`} color={progress.completed ? '#4ade80' : '#fbbf24'} />
                      {Object.entries(quest.reward).map(([key, value]) => (
                        <Chip key={key} label={`${key} ${Number(value) > 0 ? '+' : ''}${value}`} color="#60a5fa" />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDailyClaim(quest.id)}
                    disabled={!progress.completed || quest.claimed}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: quest.claimed ? 'rgba(74,222,128,0.14)' : progress.completed ? '#16a34a' : 'rgba(255,255,255,0.06)',
                      color: quest.claimed ? '#4ade80' : progress.completed ? '#fff' : '#6b7280',
                      cursor: (!progress.completed || quest.claimed) ? 'not-allowed' : 'pointer',
                      fontSize: 12, fontWeight: 600, alignSelf: 'flex-start', flexShrink: 0,
                    }}
                  >
                    {quest.claimed ? 'Claimed' : progress.completed ? 'Claim' : 'Bloccata'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* AVAILABLE */}
      {tab === 'available' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {available.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Nessuna challenge disponibile al momento.</p>
          )}
          {available.map(def => {
            const isActive = challengeState.activeChallenges.some(c => c.definitionId === def.id)
            const isFull = challengeState.activeChallenges.filter(c => !c.completed && !c.failed).length >= 3
            return (
              <div key={def.id} style={cardStyle()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>
                      {def.emoji} {def.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{def.description}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                      <Chip label={DIFFICULTY_LABEL[def.difficulty]} color={DIFFICULTY_COLOR[def.difficulty]} />
                      <Chip label={`${DIFFICULTY_POINTS[def.difficulty].toLocaleString()} pt`} color="#fbbf24" />
                      <Chip label={def.category} color="#94a3b8" />
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>💡 {def.hint}</div>
                  </div>
                  <button
                    onClick={() => handleAccept(def.id)}
                    disabled={isActive || isFull}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: (isActive || isFull) ? 'rgba(255,255,255,0.06)' : '#d97706',
                      color: (isActive || isFull) ? '#6b7280' : '#fff',
                      cursor: (isActive || isFull) ? 'not-allowed' : 'pointer',
                      fontSize: 12, fontWeight: 600, marginLeft: 8, flexShrink: 0,
                    }}
                  >
                    {isActive ? 'Attiva' : isFull ? 'Max 3' : 'Accetta'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ACTIVE */}
      {tab === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {challengeState.activeChallenges.filter(c => !c.completed && !c.failed).length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Nessuna challenge attiva. Accettane una dalla tab Disponibili.</p>
          )}
          {challengeState.activeChallenges
            .filter(c => !c.completed && !c.failed)
            .map(ch => {
              const def = CHALLENGE_DEFINITIONS.find(d => d.id === ch.definitionId)
              return (
                <div key={ch.id} style={cardStyle('#fbbf2415', '#fbbf2430')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>
                        {ch.emoji} {ch.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{ch.description}</div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                        <Chip label={DIFFICULTY_LABEL[ch.difficulty]} color={DIFFICULTY_COLOR[ch.difficulty]} />
                        <Chip label={`Anno ${ch.acceptedYear}`} color="#60a5fa" />
                      </div>
                      {def && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>💡 {def.hint}</div>}
                    </div>
                    <button
                      onClick={() => handleAbandon(ch.definitionId)}
                      style={{
                        padding: '5px 10px', borderRadius: 8, border: 'none',
                        background: 'rgba(248,113,113,0.15)', color: '#f87171',
                        cursor: 'pointer', fontSize: 11, marginLeft: 8, flexShrink: 0,
                      }}
                    >
                      Abbandona
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* COMPLETED */}
      {tab === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {challengeState.activeChallenges.filter(c => c.completed).length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Nessuna challenge completata ancora.</p>
          )}
          {challengeState.activeChallenges
            .filter(c => c.completed)
            .map(ch => (
              <div key={ch.id} style={cardStyle('#4ade8015', '#4ade8030')}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#4ade80', marginBottom: 3 }}>
                  ✅ {ch.emoji} {ch.name}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{ch.description}</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <Chip label={DIFFICULTY_LABEL[ch.difficulty]} color={DIFFICULTY_COLOR[ch.difficulty]} />
                  <Chip label={`+${DIFFICULTY_POINTS[ch.difficulty].toLocaleString()} pt`} color="#fbbf24" />
                  {ch.completedYear && <Chip label={`Anno ${ch.completedYear}`} color="#60a5fa" />}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function cardStyle(bg = 'rgba(255,255,255,0.05)', border = 'rgba(255,255,255,0.08)') {
  return {
    background: bg, border: `1px solid ${border}`,
    borderRadius: 10, padding: '12px',
  }
}

function StatBox({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' as const }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: valueColor ?? '#e2e8f0' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 12,
      background: `${color}20`, border: `1px solid ${color}60`,
      color, fontSize: 11,
    }}>
      {label}
    </span>
  )
}
