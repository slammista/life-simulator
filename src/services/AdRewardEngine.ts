// AdRewardEngine — Rewarded ad simulation + prize pool
// In production: replace watchAd() body with real AdMob/AdSense SDK call.

import type { GameState } from '../store/types'

export interface AdRewardState {
  watchedToday: number      // reset daily (real-time day)
  lastResetDate: string     // ISO date string YYYY-MM-DD
  lastWatchedAt: number     // timestamp ms (cooldown enforcement)
  totalWatched: number      // lifetime counter
}

export interface AdReward {
  id: string
  label: string
  emoji: string
  description: string
  effects: Partial<{
    money: number
    health: number
    mentalHealth: number
    happiness: number
    energy: number
    karma: number
  }>
}

const DAILY_AD_LIMIT = 5
const AD_COOLDOWN_MS = 5 * 60 * 1000  // 5 minutes between ads

const REWARD_POOL: AdReward[] = [
  {
    id: 'money_small',
    label: 'Bonus Denaro',
    emoji: '💵',
    description: '+€500 di bonus immediato',
    effects: { money: 500 },
  },
  {
    id: 'money_medium',
    label: 'Busta Paga Extra',
    emoji: '💰',
    description: '+€1.500 di compenso straordinario',
    effects: { money: 1500 },
  },
  {
    id: 'energy_full',
    label: 'Ricarica Energia',
    emoji: '⚡',
    description: '+40 energia — ti senti rinvigorito',
    effects: { energy: 40 },
  },
  {
    id: 'health_boost',
    label: 'Visita Medica Gratuita',
    emoji: '🏥',
    description: '+20 salute — controllo gratuito',
    effects: { health: 20 },
  },
  {
    id: 'happiness_boost',
    label: 'Giornata Speciale',
    emoji: '🎉',
    description: '+25 felicità — giornata indimenticabile',
    effects: { happiness: 25 },
  },
  {
    id: 'mental_boost',
    label: 'Sessione di Terapia',
    emoji: '🧠',
    description: '+20 salute mentale — mente sgombra',
    effects: { mentalHealth: 20 },
  },
  {
    id: 'karma_boost',
    label: 'Atto di Bontà',
    emoji: '✨',
    description: '+10 karma — il bene torna',
    effects: { karma: 10 },
  },
  {
    id: 'full_restore',
    label: 'Notte di Recupero',
    emoji: '🌙',
    description: '+15 salute, +15 energia, +10 felicità',
    effects: { health: 15, energy: 15, happiness: 10 },
  },
  {
    id: 'money_large',
    label: 'Premio a Sorpresa',
    emoji: '🎁',
    description: '+€5.000 — colpo di fortuna!',
    effects: { money: 5000 },
  },
  {
    id: 'super_boost',
    label: 'Giornata Perfetta',
    emoji: '🌟',
    description: '+10 a tutte le stat principali',
    effects: { health: 10, mentalHealth: 10, happiness: 10, energy: 10 },
  },
]

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function pickRandom(): AdReward {
  // Slightly weight money rewards less (60% non-money, 40% money)
  const nonMoney = REWARD_POOL.filter(r => !r.id.startsWith('money'))
  const pool = Math.random() < 0.4 ? REWARD_POOL : nonMoney
  return pool[Math.floor(Math.random() * pool.length)]
}

export const AdRewardEngine = {
  initialState(): AdRewardState {
    return {
      watchedToday: 0,
      lastResetDate: todayString(),
      lastWatchedAt: 0,
      totalWatched: 0,
    }
  },

  // Resets daily counter if it's a new day
  refreshDaily(state: AdRewardState): AdRewardState {
    const today = todayString()
    if (state.lastResetDate !== today) {
      return { ...state, watchedToday: 0, lastResetDate: today }
    }
    return state
  },

  canWatch(state: AdRewardState): { ok: boolean; reason?: string } {
    const refreshed = AdRewardEngine.refreshDaily(state)
    if (refreshed.watchedToday >= DAILY_AD_LIMIT) {
      return { ok: false, reason: `Limite giornaliero raggiunto (${DAILY_AD_LIMIT}/giorno). Torna domani.` }
    }
    const elapsed = Date.now() - refreshed.lastWatchedAt
    if (refreshed.lastWatchedAt > 0 && elapsed < AD_COOLDOWN_MS) {
      const secs = Math.ceil((AD_COOLDOWN_MS - elapsed) / 1000)
      const mins = Math.floor(secs / 60)
      const s = secs % 60
      return { ok: false, reason: `Prossimo ad disponibile tra ${mins}:${String(s).padStart(2, '0')}` }
    }
    return { ok: true }
  },

  // Returns picked reward + updated state (call after real ad is watched)
  claimReward(state: AdRewardState): { reward: AdReward; newState: AdRewardState } {
    const refreshed = AdRewardEngine.refreshDaily(state)
    const reward = pickRandom()
    const newState: AdRewardState = {
      ...refreshed,
      watchedToday: refreshed.watchedToday + 1,
      lastWatchedAt: Date.now(),
      totalWatched: refreshed.totalWatched + 1,
    }
    return { reward, newState }
  },

  remainingToday(state: AdRewardState): number {
    const refreshed = AdRewardEngine.refreshDaily(state)
    return Math.max(0, DAILY_AD_LIMIT - refreshed.watchedToday)
  },

  // Simulate the ad watch (countdown in UI, then call claimReward)
  AD_DURATION_MS: 5000,
  DAILY_LIMIT: DAILY_AD_LIMIT,
}

// Utility: merge ad reward effects into a game effect delta
export function adRewardToEffect(reward: AdReward, _state: GameState): Partial<{
  money: number; health: number; mentalHealth: number; happiness: number; energy: number; karma: number
}> {
  return reward.effects
}
