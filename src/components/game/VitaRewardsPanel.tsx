import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { CloudSaveService } from '../../services/CloudSaveService'
import { useWalletStore } from '../../store/walletStore'
import { showRewardedAd, ADMOB_IDS } from '../../services/AdRewardEngine'

// Rewards (ad-based) are only live on native apps. On web/PWA we show a
// "coming soon" overlay until AdSense approval lands.
const REWARDS_LIVE = Capacitor.isNativePlatform()

interface Props {
  onBack: () => void
}

const DAILY_VIDEO_LIMIT = 5
const COOLDOWN_SECS = 30 * 60 // 30 minutes between video rewards

const DAILY_QUESTS = [
  { id: 'q_age3',      label: 'Invecchia 3 volte',                 reward: 10, emoji: '⏩' },
  { id: 'q_event5',    label: 'Completa 5 eventi',                  reward: 15, emoji: '📋' },
  { id: 'q_health90',  label: 'Raggiungi 90 di salute',             reward: 20, emoji: '❤️' },
  { id: 'q_happy80',   label: 'Raggiungi 80 di felicità',           reward: 20, emoji: '😊' },
  { id: 'q_login',     label: 'Accedi oggi',                        reward: 5,  emoji: '📅' },
] as const

type QuestId = typeof DAILY_QUESTS[number]['id']

const STORAGE_KEY = 'lifesim2d-rewards'

interface RewardState {
  videosWatched: number
  lastVideoTs: number
  lastReset: string // YYYY-MM-DD
  questsDone: QuestId[]
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadState(): RewardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('empty')
    const s = JSON.parse(raw) as RewardState
    if (s.lastReset !== todayKey()) {
      // Reset daily counters
      return { ...s, videosWatched: 0, lastVideoTs: 0, lastReset: todayKey(), questsDone: [] }
    }
    return s
  } catch {
    return { videosWatched: 0, lastVideoTs: 0, lastReset: todayKey(), questsDone: [] }
  }
}

function saveState(s: RewardState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function useCooldown(lastTs: number) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    function tick() {
      const elapsed = Math.floor((Date.now() - lastTs) / 1000)
      setRemaining(Math.max(0, COOLDOWN_SECS - elapsed))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lastTs])

  return remaining
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VitaRewardsPanel({ onBack }: Props) {
  const [state, setState] = useState<RewardState>(loadState)
  const [watching, setWatching] = useState(false)
  const [claimed, setClaimed] = useState<QuestId | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const gems = useWalletStore(s => s.gems)
  const addGems = useWalletStore(s => s.addGems)
  const syncWithServer = useWalletStore(s => s.syncWithServer)
  const cooldown = useCooldown(state.lastVideoTs)
  const canWatch = state.videosWatched < DAILY_VIDEO_LIMIT && cooldown === 0

  // Reconcile offline-earned gems with the server when the panel opens
  useEffect(() => { syncWithServer() }, [syncWithServer])

  function update(patch: Partial<RewardState>) {
    setState(prev => {
      const next = { ...prev, ...patch }
      saveState(next)
      return next
    })
  }

  async function handleWatchVideo() {
    if (!canWatch || watching) return
    setWatching(true)
    setMessage(null)
    try {
      // Show real ad (native) or 5-second simulation (web/PWA)
      const watched = await showRewardedAd(ADMOB_IDS.REWARDED_GEMS)
      if (!watched) {
        setMessage({ text: 'Ad non disponibile. Riprova tra poco.', ok: false })
        return
      }

      const rewardId = crypto.randomUUID()

      // Try server-side reward first
      const isConfigured = CloudSaveService.isConfigured()
      if (isConfigured) {
        const user = await CloudSaveService.getCurrentUser()
        if (user) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
          const res = await fetch(`${supabaseUrl}/functions/v1/ad-reward`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ user_id: user.id, ad_type: 'gem_video', reward_id: rewardId }),
          })
          if (res.ok) {
            const { gems_granted } = await res.json() as { gems_granted: number }
            update({ videosWatched: state.videosWatched + 1, lastVideoTs: Date.now() })
            // Server already credited; reflect authoritative balance locally
            useWalletStore.getState().setEntitlements({ gems_balance: gems + gems_granted })
            setMessage({ text: `+${gems_granted} 💎 ricevute! (${state.videosWatched + 1}/${DAILY_VIDEO_LIMIT} oggi)`, ok: true })
            setWatching(false)
            return
          }
        }
      }
      // Local fallback (offline mode or no auth) — queued for sync on next login
      const gemsGranted = 10
      update({ videosWatched: state.videosWatched + 1, lastVideoTs: Date.now() })
      addGems(gemsGranted)
      setMessage({ text: `+${gemsGranted} 💎 ricevute! (offline) — Accedi per sincronizzarle.`, ok: true })
    } catch {
      setMessage({ text: 'Errore. Riprova tra poco.', ok: false })
    } finally {
      setWatching(false)
    }
  }

  function handleClaimQuest(questId: QuestId, reward: number) {
    if (state.questsDone.includes(questId)) return
    setClaimed(questId)
    update({ questsDone: [...state.questsDone, questId] })
    addGems(reward)
    setMessage({ text: `+${reward} 💎 dalla quest!`, ok: true })
    setTimeout(() => setClaimed(null), 1000)
  }

  return (
    <div style={{ padding: '16px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={onBack}
          className="icon-btn"
          style={{ width: 36, height: 36, flexShrink: 0 }}
          aria-label="Torna indietro"
        >
          ‹
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#fff' }}>🎁 Rewards</h2>
        {/* Gem balance chip */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20,
          background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)' }}>
          <span style={{ fontSize: 15 }}>💎</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>{gems.toLocaleString('it-IT')}</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="card" style={{
          padding: '10px 14px', marginBottom: 12,
          background: message.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          borderColor: message.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: message.ok ? '#6ee7b7' : '#fca5a5' }}>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Rewards content — grayed out + locked behind "coming soon" on web/PWA */}
      <div style={{ position: 'relative' }}>
        <div style={{
          filter: REWARDS_LIVE ? 'none' : 'grayscale(1) blur(2px)',
          opacity: REWARDS_LIVE ? 1 : 0.45,
          pointerEvents: REWARDS_LIVE ? 'auto' : 'none',
          userSelect: REWARDS_LIVE ? 'auto' : 'none',
        }}>
      {/* Rewarded video */}
      <div className="card" style={{ padding: '18px 16px', marginBottom: 12 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', margin: '0 0 14px' }}>📺 Guarda un Video — +10 💎</h4>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 5 }}>
            <span>Video oggi</span>
            <span>{state.videosWatched}/{DAILY_VIDEO_LIMIT}</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, var(--section-accent), #a78bfa)',
              width: `${(state.videosWatched / DAILY_VIDEO_LIMIT) * 100}%`,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>

        {cooldown > 0 && state.videosWatched < DAILY_VIDEO_LIMIT && (
          <div style={{ textAlign: 'center', marginBottom: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Prossimo video disponibile in <strong style={{ color: '#a78bfa' }}>{formatTime(cooldown)}</strong>
          </div>
        )}

        {state.videosWatched >= DAILY_VIDEO_LIMIT ? (
          <div style={{
            textAlign: 'center', padding: '12px 0', fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}>
            Hai esaurito i video di oggi. Torna domani! 🌙
          </div>
        ) : (
          <button
            onClick={handleWatchVideo}
            disabled={!canWatch || watching}
            className="btn-candy btn-candy--primary"
            style={{ width: '100%', fontSize: 15, padding: '12px 0', fontWeight: 700 }}
          >
            {watching ? '▶ Caricamento…' : canWatch ? '▶ Guarda ora (+10 💎)' : `⏳ ${formatTime(cooldown)}`}
          </button>
        )}
      </div>

      {/* Daily quests */}
      <div className="card" style={{ padding: '16px 16px' }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', margin: '0 0 12px' }}>📋 Quest Giornaliere</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DAILY_QUESTS.map(quest => {
            const done = state.questsDone.includes(quest.id)
            const isClaiming = claimed === quest.id
            return (
              <div key={quest.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                background: done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                opacity: done ? 0.6 : 1,
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{quest.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: done ? '#6ee7b7' : '#e2e8f0', fontWeight: 600 }}>
                    {quest.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                    Ricompensa: {quest.reward} 💎
                  </div>
                </div>
                {done ? (
                  <span style={{ fontSize: 18, color: '#6ee7b7' }}>✓</span>
                ) : (
                  <button
                    onClick={() => handleClaimQuest(quest.id, quest.reward)}
                    disabled={isClaiming}
                    className="btn-candy btn-candy--positive"
                    style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
                  >
                    {isClaiming ? '…' : `+${quest.reward} 💎`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 12 }}>
        Le quest si azzerano ogni giorno. Accedi per sincronizzare le gemme col tuo account.
      </p>
        </div>

        {/* Coming soon overlay (web/PWA only) */}
        {!REWARDS_LIVE && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              padding: '24px 22px', borderRadius: 18,
              background: 'rgba(26,22,56,0.92)',
              border: '1px solid rgba(167,139,250,0.35)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              maxWidth: 300,
            }}>
              <span style={{ fontSize: 40 }}>🚧</span>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                Presto disponibile
              </h3>
              <p style={{ fontSize: 13, color: '#c4b5fd', margin: 0, lineHeight: 1.5 }}>
                I video premio arriveranno a breve sul web. Nel frattempo puoi
                ottenere gemme dallo Shop o completando la tua vita.
              </p>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#a78bfa',
                padding: '4px 12px', borderRadius: 99,
                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
              }}>
                📱 Già attivo sulle app mobile
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
