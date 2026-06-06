import type { GameState, Child, PlayerIdentity, ChildInheritance } from '../store/types'

export interface LegacyScore {
  total: number        // 0-1000
  tier: 'poor' | 'fair' | 'good' | 'great' | 'legendary'
  breakdown: {
    wealth: number        // 0-200
    family: number        // 0-200
    career: number        // 0-150
    achievements: number  // 0-150
    character: number     // 0-150
    adventure: number     // 0-150
  }
}

export interface LegacyBonuses {
  intelligenceBonus: number
  looksBonus: number
  moneyMultiplier: number   // e.g. 0.1 = 10% of parent's money
  happinessBonus: number
  reputationBonus: number
}

export class LegacyEngine {
  static calculateLegacyScore(state: GameState): LegacyScore {
    const { finance, children, relationships, career, stats, ribbons, goals, travelHistory, hobbies, completedGoals } = state

    // Wealth (0-200)
    const wealth = Math.min(200, Math.round(finance.money / 10000))

    // Family ties (0-200)
    const avgBond = children.length > 0
      ? children.reduce((sum, c) => sum + c.bondWithPlayer, 0) / children.length
      : 0
    const spouseCount = relationships.filter(r => r.type === 'spouse' && r.isAlive).length
    const closeRelCount = relationships.filter(r => (r.type === 'best_friend' || r.stage === 'close_friend') && r.isAlive).length
    const family = Math.min(200, Math.round(
      (children.length * 15) +
      (avgBond * 0.8) +
      (spouseCount * 30) +
      (closeRelCount * 10)
    ))

    // Career (0-150)
    const careerLevel = career.currentJob?.salary ?? 0
    const careerScore = Math.min(150, Math.round(
      Math.min(80, careerLevel / 100) +
      (career.promotions * 8) +
      (career.businessOwned ? 40 : 0) +
      (career.licenses.length * 5)
    ))

    // Achievements (0-150)
    const achieveScore = Math.min(150, Math.round(
      (completedGoals.length * 10) +
      (ribbons.filter(r => r.unlocked).length * 8)
    ))

    // Character (0-150)
    const characterScore = Math.min(150, Math.round(
      (stats.karma + 100) / 2 * 0.75 +
      stats.reputation * 0.5 +
      (stats.mentalHealth - 50) * 0.3
    ))

    // Adventure (0-150)
    const adventureScore = Math.min(150, Math.round(
      (travelHistory.length * 8) +
      (hobbies.length * 10) +
      (hobbies.reduce((s, h) => s + h.skillLevel, 0) / Math.max(1, hobbies.length) * 0.3)
    ))

    const total = wealth + family + careerScore + achieveScore + characterScore + adventureScore

    const tier =
      total >= 800 ? 'legendary' :
      total >= 600 ? 'great' :
      total >= 400 ? 'good' :
      total >= 200 ? 'fair' : 'poor'

    return {
      total,
      tier,
      breakdown: {
        wealth,
        family,
        career: careerScore,
        achievements: achieveScore,
        character: characterScore,
        adventure: adventureScore,
      },
    }
  }

  static calculateBonuses(score: LegacyScore): LegacyBonuses {
    const { total, breakdown } = score
    return {
      intelligenceBonus: breakdown.career >= 120 ? 10 : breakdown.career >= 80 ? 5 : 0,
      looksBonus: breakdown.family >= 150 ? 5 : 0,
      moneyMultiplier: Math.min(0.5, total / 2000),   // max 50% of parent wealth
      happinessBonus: breakdown.family >= 150 ? 10 : breakdown.family >= 80 ? 5 : 0,
      reputationBonus: breakdown.character >= 120 ? 10 : breakdown.character >= 80 ? 5 : 0,
    }
  }

  static getBestChild(state: GameState): Child | null {
    if (state.children.length === 0) return null
    return state.children.reduce((best, c) =>
      c.bondWithPlayer > best.bondWithPlayer ? c : best
    )
  }

  static buildChildStartingState(
    child: Child,
    parentState: GameState,
    score: LegacyScore,
  ): { identity: PlayerIdentity; startingMoney: number; bonuses: LegacyBonuses } {
    const bonuses = LegacyEngine.calculateBonuses(score)
    const inheritedMoney = Math.round(parentState.finance.money * bonuses.moneyMultiplier)

    const identity: PlayerIdentity = {
      name: child.name,
      surname: parentState.identity.surname,
      gender: child.gender,
      nationality: parentState.identity.nationality,
      birthYear: parentState.time.year - child.age,
      familyBackground: score.total >= 600 ? 'upper_middle' : score.total >= 400 ? 'middle' : 'lower_middle',
      religion: parentState.identity.religion,
      sexualOrientation: 'heterosexual',
      emoji: child.gender === 'female' ? '👧' : '👦',
    }

    return { identity, startingMoney: inheritedMoney, bonuses }
  }

  static buildInheritanceRecord(child: Child, parentState: GameState): ChildInheritance {
    const score = LegacyEngine.calculateLegacyScore(parentState)
    const bonuses = LegacyEngine.calculateBonuses(score)

    return {
      id: child.id,
      age: child.age,
      intelligence: Math.min(100, child.intelligence + bonuses.intelligenceBonus),
      looks: Math.min(100, child.looks + bonuses.looksBonus),
      health: child.health,
      criminalTendency: parentState.criminal.hasRecord ? 20 : 5,
      personality: child.personalityTraits,
      startingMoney: Math.round(parentState.finance.money * bonuses.moneyMultiplier),
      startingRelationships: parentState.relationships.filter(r => r.isAlive).slice(0, 5),
      parentMemory: `${parentState.identity.name} ${parentState.identity.surname} — ${parentState.time.year - parentState.identity.birthYear} anni — Legacy ${score.tier}`,
    }
  }
}
