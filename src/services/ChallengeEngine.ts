import type { GameState, Effect } from '../store/types'

export type ChallengeDuration = 'lifetime' | 'early' | 'mid' | 'late'
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'legendary'
export type ChallengeCategory = 'career' | 'financial' | 'relational' | 'educational' | 'criminal' | 'health' | 'travel' | 'special'

export interface ChallengeDefinition {
  id: string
  name: string
  emoji: string
  description: string
  category: ChallengeCategory
  difficulty: ChallengeDifficulty
  duration: ChallengeDuration
  check: (state: GameState) => boolean
  reward: Effect
  rewardRibbon: string | null
  hint: string
}

export interface ActiveChallenge {
  id: string
  definitionId: string
  name: string
  emoji: string
  description: string
  category: ChallengeCategory
  difficulty: ChallengeDifficulty
  acceptedYear: number
  completed: boolean
  failed: boolean
  completedYear: number | null
}

export interface ChallengeEngineState {
  activeChallenges: ActiveChallenge[]
  completedChallengeIds: string[]
  failedChallengeIds: string[]
  totalPoints: number
  streak: number
}

export const CHALLENGE_DEFINITIONS: ChallengeDefinition[] = [
  {
    id: 'millionaire_30',
    name: 'Milionario a 30',
    emoji: '💰',
    description: 'Raggiungi €1.000.000 prima dei 30 anni.',
    category: 'financial', difficulty: 'hard', duration: 'early',
    check: s => s.time.age < 30 && s.finance.money >= 1000000,
    reward: { happiness: 20, reputation: 10, socialReputation: 15 },
    rewardRibbon: 'millionaire_30',
    hint: 'Investi presto e lavora sodo.',
  },
  {
    id: 'ceo_35',
    name: 'CEO a 35',
    emoji: '💼',
    description: 'Diventa CEO o Business Owner prima dei 35 anni.',
    category: 'career', difficulty: 'hard', duration: 'early',
    check: s => s.time.age < 35 && (
      s.career.businessOwned !== null ||
      (s.career.currentJob?.title ?? '').toLowerCase().includes('ceo')
    ),
    reward: { reputation: 20, money: 50000, happiness: 15 },
    rewardRibbon: 'ceo_early',
    hint: 'Apri una business prima dei 35.',
  },
  {
    id: 'no_criminal',
    name: 'Vita Pulita',
    emoji: '⚖️',
    description: 'Raggiungi 40 anni senza mai commettere un crimine.',
    category: 'criminal', difficulty: 'medium', duration: 'mid',
    check: s => s.time.age >= 40 && !s.criminal.hasRecord && s.criminal.crimes.length === 0,
    reward: { karma: 20, reputation: 15, happiness: 10 },
    rewardRibbon: 'clean_life',
    hint: 'Non commettere mai crimini.',
  },
  {
    id: 'phd_holder',
    name: 'Dottorato',
    emoji: '🎓',
    description: 'Consegui un PhD o dottorato.',
    category: 'educational', difficulty: 'medium', duration: 'mid',
    check: s => s.education.completedLevels.includes('phd'),
    reward: { intelligence: 10, reputation: 15, money: 30000 },
    rewardRibbon: 'phd_achieved',
    hint: 'Completa gli studi fino al dottorato.',
  },
  {
    id: 'ten_countries',
    name: 'Esploratore',
    emoji: '✈️',
    description: 'Visita almeno 10 destinazioni diverse nella tua vita.',
    category: 'travel', difficulty: 'medium', duration: 'lifetime',
    check: s => {
      const unique = new Set(s.travelHistory.map(t => t.destination))
      return unique.size >= 10
    },
    reward: { happiness: 15, intelligence: 5, socialReputation: 10 },
    rewardRibbon: 'world_traveler',
    hint: 'Viaggia in 10 posti diversi.',
  },
  {
    id: 'perfect_health_60',
    name: 'Centenario Sano',
    emoji: '💪',
    description: 'Raggiungi i 60 anni con salute > 70.',
    category: 'health', difficulty: 'hard', duration: 'lifetime',
    check: s => s.time.age >= 60 && s.stats.health > 70,
    reward: { health: 10, happiness: 20, mentalHealth: 10 },
    rewardRibbon: 'healthy_60',
    hint: 'Cura la tua salute costantemente.',
  },
  {
    id: 'three_children',
    name: 'Grande Famiglia',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Avere almeno 3 figli.',
    category: 'relational', difficulty: 'medium', duration: 'lifetime',
    check: s => s.children.length >= 3,
    reward: { happiness: 20, karma: 10 },
    rewardRibbon: 'big_family',
    hint: 'Avrai e crescerai almeno 3 figli.',
  },
  {
    id: 'married_20_years',
    name: 'Matrimonio Felice',
    emoji: '💍',
    description: 'Rimani sposato con la stessa persona per 20 anni.',
    category: 'relational', difficulty: 'hard', duration: 'lifetime',
    check: s => {
      const spouse = s.relationships.find(r => r.stage === 'spouse' && r.isAlive)
      if (!spouse) return false
      // Approximate: if still spouse after 20 years
      const spouseAge = s.time.age
      return spouseAge >= 38 && spouse.trust > 60
    },
    reward: { happiness: 25, karma: 15, mentalHealth: 10 },
    rewardRibbon: 'long_marriage',
    hint: 'Trovare l\'amore e mantenerlo.',
  },
  {
    id: 'influencer_100k',
    name: 'Influencer',
    emoji: '📱',
    description: 'Raggiungi 100.000 follower su qualsiasi piattaforma.',
    category: 'career', difficulty: 'medium', duration: 'lifetime',
    check: s => s.socialMedia.some(p => p.followers >= 100000),
    reward: { socialReputation: 20, money: 20000, happiness: 15 },
    rewardRibbon: 'influencer_100k',
    hint: 'Posta regolarmente e diventa virale.',
  },
  {
    id: 'debt_free',
    name: 'Zero Debiti',
    emoji: '🆓',
    description: 'Elimina tutti i tuoi debiti prima dei 40 anni.',
    category: 'financial', difficulty: 'medium', duration: 'mid',
    check: s => s.time.age < 40 && s.finance.debt === 0 && s.education.studentLoan === 0,
    reward: { happiness: 15, mentalHealth: 10, reputation: 10 },
    rewardRibbon: 'debt_free',
    hint: 'Ripaga tutto prima dei 40.',
  },
  {
    id: 'military_hero',
    name: 'Eroe Militare',
    emoji: '🎖️',
    description: 'Completa 10 missioni militari e ottieni almeno 2 decorazioni.',
    category: 'special', difficulty: 'hard', duration: 'lifetime',
    check: s => s.military.missions >= 10 && s.military.decorations.length >= 2,
    reward: { reputation: 25, karma: 15, money: 50000 },
    rewardRibbon: 'military_hero',
    hint: 'Arruolati e completa più missioni.',
  },
  {
    id: 'jackpot_winner',
    name: 'Colpo di Fortuna',
    emoji: '🎰',
    description: 'Vinci il jackpot alla lotteria.',
    category: 'special', difficulty: 'legendary', duration: 'lifetime',
    check: s => s.gambling.jackpotWon,
    reward: { happiness: 30, socialReputation: 20 },
    rewardRibbon: 'jackpot',
    hint: 'Gioca alla lotteria ogni anno... e spera.',
  },
  {
    id: 'zero_addiction',
    name: 'Mente Libera',
    emoji: '🧠',
    description: 'Raggiunge 50 anni senza mai sviluppare dipendenze.',
    category: 'health', difficulty: 'medium', duration: 'lifetime',
    check: s => s.time.age >= 50 && s.health.addictions.length === 0 && s.gambling.addictionLevel < 20,
    reward: { mentalHealth: 15, health: 10, karma: 10 },
    rewardRibbon: 'clean_mind',
    hint: 'Evita sostanze e gioco eccessivo.',
  },
  {
    id: 'world_politician',
    name: 'Politico di Successo',
    emoji: '🏛️',
    description: 'Raggiungi un ruolo politico di alto livello.',
    category: 'career', difficulty: 'hard', duration: 'lifetime',
    check: s => ['premier', 'presidente', 'senatore', 'deputato'].includes(s.politics.currentRole ?? ''),
    reward: { reputation: 30, socialReputation: 25, money: 100000 },
    rewardRibbon: 'politician',
    hint: 'Scala la gerarchia politica fino ai vertici.',
  },
  {
    id: 'self_made',
    name: 'Self-Made',
    emoji: '🚀',
    description: 'Da background povero a €500.000 netti.',
    category: 'financial', difficulty: 'legendary', duration: 'lifetime',
    check: s => s.identity.familyBackground === 'poor' && s.finance.money >= 500000,
    reward: { reputation: 30, happiness: 25, karma: 20, socialReputation: 20 },
    rewardRibbon: 'self_made',
    hint: 'Parti da zero e costruisci la tua fortuna.',
  },
]

const DIFFICULTY_POINTS: Record<ChallengeDifficulty, number> = {
  easy: 1000, medium: 3000, hard: 7000, legendary: 15000,
}

export class ChallengeEngine {
  static getAvailableChallenges(state: GameState): ChallengeDefinition[] {
    const completedIds = state.challengeEngine.completedChallengeIds
    const activeIds = state.challengeEngine.activeChallenges.map(c => c.definitionId)
    return CHALLENGE_DEFINITIONS.filter(d =>
      !completedIds.includes(d.id) && !activeIds.includes(d.id)
    )
  }

  static acceptChallenge(defId: string, state: GameState): { success: boolean; message: string; challenge?: ActiveChallenge } {
    const def = CHALLENGE_DEFINITIONS.find(d => d.id === defId)
    if (!def) return { success: false, message: 'Challenge non trovata.' }

    const active = state.challengeEngine.activeChallenges
    if (active.length >= 3) return { success: false, message: 'Puoi avere max 3 challenge attive.' }
    if (active.some(c => c.definitionId === defId)) return { success: false, message: 'Già attiva.' }
    if (state.challengeEngine.completedChallengeIds.includes(defId)) return { success: false, message: 'Già completata.' }

    const challenge: ActiveChallenge = {
      id: `ch_${defId}_${state.time.year}`,
      definitionId: defId,
      name: def.name,
      emoji: def.emoji,
      description: def.description,
      category: def.category,
      difficulty: def.difficulty,
      acceptedYear: state.time.year,
      completed: false,
      failed: false,
      completedYear: null,
    }
    return { success: true, message: `✅ Challenge accettata: ${def.name}`, challenge }
  }

  static checkChallenges(state: GameState): {
    newlyCompleted: ActiveChallenge[]
    effects: Effect
    bonusPoints: number
    updatedState: Partial<ChallengeEngineState>
  } {
    const newlyCompleted: ActiveChallenge[] = []
    const totalEffects: Effect = {}
    let bonusPoints = 0

    const updatedActive = state.challengeEngine.activeChallenges.map(active => {
      if (active.completed || active.failed) return active
      const def = CHALLENGE_DEFINITIONS.find(d => d.id === active.definitionId)
      if (!def) return active

      if (def.check(state)) {
        const completed: ActiveChallenge = { ...active, completed: true, completedYear: state.time.year }
        newlyCompleted.push(completed)
        const pts = DIFFICULTY_POINTS[def.difficulty]
        const streakBonus = Math.floor(pts * (state.challengeEngine.streak * 0.1))
        bonusPoints += pts + streakBonus

        for (const [k, v] of Object.entries(def.reward)) {
          totalEffects[k] = (totalEffects[k] ?? 0) + (v as number)
        }
        return completed
      }
      return active
    })

    const newCompletedIds = [
      ...state.challengeEngine.completedChallengeIds,
      ...newlyCompleted.map(c => c.definitionId),
    ]

    return {
      newlyCompleted,
      effects: totalEffects,
      bonusPoints,
      updatedState: {
        activeChallenges: updatedActive,
        completedChallengeIds: newCompletedIds,
        totalPoints: state.challengeEngine.totalPoints + bonusPoints,
        streak: newlyCompleted.length > 0 ? state.challengeEngine.streak + newlyCompleted.length : state.challengeEngine.streak,
      },
    }
  }

  static abandonChallenge(defId: string, state: GameState): Partial<ChallengeEngineState> {
    return {
      activeChallenges: state.challengeEngine.activeChallenges.filter(c => c.definitionId !== defId),
      failedChallengeIds: [...state.challengeEngine.failedChallengeIds, defId],
    }
  }

  static getChallengeProgress(defId: string, state: GameState): string {
    void state
    const def = CHALLENGE_DEFINITIONS.find(d => d.id === defId)
    if (!def) return ''
    return def.hint
  }
}
