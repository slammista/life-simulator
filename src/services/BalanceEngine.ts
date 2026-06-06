import type { Effect, GameState } from '../store/types'

export interface BalanceTickResult {
  effects: Effect
  messages: string[]
}

export class BalanceEngine {
  static annualTick(state: GameState): BalanceTickResult {
    const effects: Effect = {}
    const messages: string[] = []

    const netInvestments = state.finance.investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const netWorth = state.finance.money + state.finance.bankBalance + netInvestments - state.finance.debt
    const debtRatio = state.finance.debt / Math.max(1, state.finance.money + state.finance.bankBalance + netInvestments)

    if (debtRatio > 2 && state.finance.debt > 5000) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 5
      effects.happiness = (effects.happiness ?? 0) - 4
      messages.push('💳 Il peso dei debiti aumenta stress e preoccupazioni.')
    } else if (state.finance.debt === 0 && netWorth > 20000) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) + 1
    }

    if (state.career.burnoutLevel > 80) {
      effects.health = (effects.health ?? 0) - 4
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 6
      messages.push('🔥 Il burnout sta consumando salute e lucidità.')
    }

    if (netWorth < -10000) {
      effects.happiness = (effects.happiness ?? 0) - 6
      effects.reputation = (effects.reputation ?? 0) - 2
      messages.push('📉 La situazione economica negativa limita molte scelte.')
    }

    if (state.stats.energy < 15) {
      effects.health = (effects.health ?? 0) - 2
    } else if (state.stats.energy > 75 && state.stats.health > 55) {
      effects.health = (effects.health ?? 0) + 1
    }

    if (state.fame.scandals >= 3 && state.fame.publicImage < 35) {
      effects.socialReputation = (effects.socialReputation ?? 0) - 3
      messages.push('📰 Gli scandali ripetuti continuano a danneggiare la tua reputazione pubblica.')
    }

    return { effects, messages }
  }
}
