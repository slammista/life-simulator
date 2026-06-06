import type { DailyQuest, DailyQuestState, DailyQuestType, Effect, GameState } from '../store/types'

export interface DailyQuestProgress {
  value: number
  target: number
  completed: boolean
}

export interface ClaimQuestResult {
  success: boolean
  message: string
  effects: Effect
  dailyQuests: DailyQuestState
}

const QUEST_POOL: Array<Omit<DailyQuest, 'id' | 'claimed'>> = [
  {
    type: 'age_up',
    title: 'Vivi un altro anno',
    description: 'Invecchia di almeno 1 anno in questa sessione.',
    emoji: '📅',
    target: 1,
    reward: { happiness: 3, energy: 5 },
  },
  {
    type: 'earn_money',
    title: 'Giornata produttiva',
    description: 'Porta il patrimonio liquido sopra €10.000.',
    emoji: '💰',
    target: 10_000,
    reward: { money: 500, happiness: 2 },
  },
  {
    type: 'improve_health',
    title: 'Corpo in ordine',
    description: 'Raggiungi almeno 70 salute o 70 fitness.',
    emoji: '💪',
    target: 70,
    reward: { health: 4, energy: 4 },
  },
  {
    type: 'social_post',
    title: 'Presenza online',
    description: 'Pubblica almeno 3 contenuti social totali.',
    emoji: '📱',
    target: 3,
    reward: { socialReputation: 3, happiness: 2 },
  },
  {
    type: 'relationship_action',
    title: 'Legami vivi',
    description: 'Mantieni almeno 2 relazioni con fiducia sopra 60.',
    emoji: '🤝',
    target: 2,
    reward: { happiness: 4, mentalHealth: 3 },
  },
  {
    type: 'practice_hobby',
    title: 'Routine personale',
    description: 'Porta un hobby almeno al livello 35.',
    emoji: '🎸',
    target: 35,
    reward: { happiness: 3, intelligence: 2 },
  },
  {
    type: 'complete_challenge',
    title: 'Mentalità da sfida',
    description: 'Accumula almeno 3.000 punti challenge.',
    emoji: '🏆',
    target: 3_000,
    reward: { reputation: 2, socialReputation: 2, money: 750 },
  },
]

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function daysBetween(previous: string | null, current: string) {
  if (!previous) return null
  const prevTime = new Date(`${previous}T00:00:00`).getTime()
  const currTime = new Date(`${current}T00:00:00`).getTime()
  return Math.round((currTime - prevTime) / 86_400_000)
}

function seededIndex(seed: string, offset: number, poolLength: number) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i) + offset * 97) | 0
  return Math.abs(hash) % poolLength
}

function buildQuests(date: string): DailyQuest[] {
  const selected: DailyQuest[] = []
  const usedTypes = new Set<DailyQuestType>()
  let offset = 0
  while (selected.length < 3 && offset < QUEST_POOL.length * 3) {
    const def = QUEST_POOL[seededIndex(date, offset, QUEST_POOL.length)]
    offset += 1
    if (usedTypes.has(def.type)) continue
    usedTypes.add(def.type)
    selected.push({
      ...def,
      id: `${date}_${def.type}`,
      claimed: false,
    })
  }
  return selected
}

export class DailyQuestEngine {
  static initialState(date = todayKey()): DailyQuestState {
    return {
      currentDate: date,
      quests: buildQuests(date),
      completedQuestIds: [],
      streak: 0,
      lastClaimDate: null,
      totalClaimed: 0,
    }
  }

  static ensure(state: Partial<DailyQuestState> | undefined, date = todayKey()): DailyQuestState {
    if (!state?.currentDate || state.currentDate !== date) {
      return {
        currentDate: date,
        quests: buildQuests(date),
        completedQuestIds: state?.completedQuestIds ?? [],
        streak: state?.streak ?? 0,
        lastClaimDate: state?.lastClaimDate ?? null,
        totalClaimed: state?.totalClaimed ?? 0,
      }
    }
    return {
      currentDate: state.currentDate,
      quests: state.quests?.length ? state.quests : buildQuests(date),
      completedQuestIds: state.completedQuestIds ?? [],
      streak: state.streak ?? 0,
      lastClaimDate: state.lastClaimDate ?? null,
      totalClaimed: state.totalClaimed ?? 0,
    }
  }

  static progress(quest: DailyQuest, state: GameState): DailyQuestProgress {
    const value = (() => {
      switch (quest.type) {
        case 'age_up':
          return Math.max(0, state.eventLog.filter(entry => entry.category === 'year' && entry.year === state.time.year).length)
        case 'earn_money':
          return Math.max(0, state.finance.money)
        case 'improve_health':
          return Math.max(state.stats.health, state.health.fitnessLevel ?? 0)
        case 'social_post':
          return state.socialMedia.reduce((sum, profile) => sum + profile.postCount, 0)
        case 'relationship_action':
          return state.relationships.filter(rel => rel.isAlive && rel.trust >= 60).length
        case 'practice_hobby':
          return state.hobbies.reduce((max, hobby) => Math.max(max, hobby.skillLevel), 0)
        case 'complete_challenge':
          return state.challengeEngine.totalPoints
        default:
          return 0
      }
    })()
    return { value, target: quest.target, completed: value >= quest.target }
  }

  static claimQuest(questId: string, state: GameState): ClaimQuestResult {
    const current = DailyQuestEngine.ensure(state.dailyQuests)
    const quest = current.quests.find(q => q.id === questId)
    if (!quest) {
      return { success: false, message: 'Quest giornaliera non trovata.', effects: {}, dailyQuests: current }
    }
    if (quest.claimed || current.completedQuestIds.includes(quest.id)) {
      return { success: false, message: 'Reward già riscattato.', effects: {}, dailyQuests: current }
    }
    const progress = DailyQuestEngine.progress(quest, state)
    if (!progress.completed) {
      return { success: false, message: 'Quest non ancora completata.', effects: {}, dailyQuests: current }
    }

    const today = current.currentDate
    const gap = daysBetween(current.lastClaimDate, today)
    const nextStreak = gap === 1 ? current.streak + 1 : gap === 0 ? current.streak : 1
    const streakBonus = nextStreak >= 7 ? { money: 1000, happiness: 5 } : nextStreak >= 3 ? { happiness: 3 } : {}
    const effects: Effect = { ...quest.reward }
    for (const [key, value] of Object.entries(streakBonus)) {
      effects[key] = (effects[key] ?? 0) + value
    }

    const updated: DailyQuestState = {
      ...current,
      quests: current.quests.map(q => q.id === quest.id ? { ...q, claimed: true } : q),
      completedQuestIds: [...current.completedQuestIds, quest.id],
      streak: nextStreak,
      lastClaimDate: today,
      totalClaimed: current.totalClaimed + 1,
    }

    const bonusText = Object.keys(streakBonus).length > 0 ? ` Streak ${nextStreak}: bonus extra.` : ''
    return {
      success: true,
      message: `Reward riscattato: ${quest.title}.${bonusText}`,
      effects,
      dailyQuests: updated,
    }
  }
}
