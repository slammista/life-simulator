import type { Effect, GameState } from '../store/types'

export interface BalanceTickResult {
  effects: Effect
  messages: string[]
}

export class BalanceEngine {
  static annualTick(state: GameState): BalanceTickResult {
    const effects: Effect = {}
    const messages: string[] = []

    const { finance, stats, career, living, pets, health, fame, time, hobbies, relationships } = state

    // ─── Net worth & debt ─────────────────────────────────────────
    const netInvestments = finance.investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const netWorth = finance.money + finance.bankBalance + netInvestments - finance.debt
    const debtRatio = finance.debt / Math.max(1, finance.money + finance.bankBalance + netInvestments)
    const annualIncome = (career.currentJob?.salary ?? 0) * 12
    const housingBurden = living.monthlyCost > 0 && annualIncome > 0
      ? (living.monthlyCost * 12) / annualIncome
      : 0

    // Severe debt spiral
    if (debtRatio > 2 && finance.debt > 5000) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 5
      effects.happiness    = (effects.happiness    ?? 0) - 4
      messages.push('💳 Il peso dei debiti aumenta stress e preoccupazioni.')
    } else if (debtRatio > 0.5 && finance.debt > 1000) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 2
    } else if (finance.debt === 0 && netWorth > 20000) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) + 1
      effects.happiness    = (effects.happiness    ?? 0) + 1
    }

    // Extreme poverty
    if (netWorth < -20000) {
      effects.happiness   = (effects.happiness   ?? 0) - 8
      effects.reputation  = (effects.reputation  ?? 0) - 3
      messages.push('📉 La situazione economica disastrosa limita ogni scelta di vita.')
    } else if (netWorth < -10000) {
      effects.happiness   = (effects.happiness   ?? 0) - 5
      effects.reputation  = (effects.reputation  ?? 0) - 2
      messages.push('📉 La situazione economica negativa pesa sulla qualità della vita.')
    } else if (netWorth > 500000) {
      effects.happiness = (effects.happiness ?? 0) + 2
      effects.socialReputation = (effects.socialReputation ?? 0) + 1
    }

    // Housing affordability stress (rent > 40% of income)
    if (housingBurden > 0.55) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 3
      effects.happiness    = (effects.happiness    ?? 0) - 2
      messages.push('🏠 L\'affitto/mutuo pesa troppo sul reddito, generando stress cronico.')
    } else if (housingBurden > 0.40) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 1
    }

    // Good housing bonus
    if (living.type === 'owning' && living.mortgageRemaining <= 0) {
      effects.happiness    = (effects.happiness    ?? 0) + 2
      effects.mentalHealth = (effects.mentalHealth ?? 0) + 1
    } else if (living.type === 'owning' && living.mortgageRemaining > 0) {
      effects.happiness = (effects.happiness ?? 0) + 1
    } else if (living.type === 'homeless') {
      effects.health       = (effects.health       ?? 0) - 5
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 8
      effects.happiness    = (effects.happiness    ?? 0) - 10
      messages.push('🏚️ Vivere senza una casa fissa danneggia gravemente salute e benessere.')
    }

    // ─── Career / burnout ─────────────────────────────────────────
    if (career.burnoutLevel > 80) {
      effects.health       = (effects.health       ?? 0) - 4
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 6
      messages.push('🔥 Il burnout sta consumando salute e lucidità.')
    } else if (career.burnoutLevel > 60) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 2
      effects.energy       = (effects.energy       ?? 0) - 3
    }

    // No job penalty (adults — skipped if currently studying)
    const isStudent = state.education.currentLevel !== 'none'
    if (!career.currentJob && time.age >= 22 && time.age < 65 && !state.retirement.isRetired && !isStudent) {
      effects.happiness    = (effects.happiness    ?? 0) - 3
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 2
      effects.reputation   = (effects.reputation   ?? 0) - 1
    }

    // ─── Energy / health interactions ─────────────────────────────
    if (stats.energy < 15) {
      effects.health       = (effects.health       ?? 0) - 3
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 2
    } else if (stats.energy < 30) {
      effects.health = (effects.health ?? 0) - 1
    } else if (stats.energy > 75 && stats.health > 60) {
      // Well-rested → small health regeneration
      effects.health = (effects.health ?? 0) + 1
    }

    // Mental health cascade into physical health
    if (stats.mentalHealth < 20) {
      effects.health   = (effects.health   ?? 0) - 3
      effects.energy   = (effects.energy   ?? 0) - 4
      effects.happiness = (effects.happiness ?? 0) - 4
      messages.push('🧠 La salute mentale critica sta impattando anche il corpo.')
    } else if (stats.mentalHealth > 80 && stats.happiness > 60) {
      effects.health = (effects.health ?? 0) + 1
    }

    // ─── Relationships ───────────────────────────────────────────
    const activeRelCount = relationships.filter(r => r.isAlive && r.type !== 'enemy').length
    if (activeRelCount === 0 && time.age >= 25) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 3
      effects.happiness    = (effects.happiness    ?? 0) - 3
    } else if (activeRelCount >= 5) {
      effects.happiness    = (effects.happiness    ?? 0) + 2
      effects.mentalHealth = (effects.mentalHealth ?? 0) + 1
    }

    // ─── Pets ────────────────────────────────────────────────────
    const alivePets = pets.filter(p => p.isAlive)
    if (alivePets.length > 0) {
      const avgBond = alivePets.reduce((s, p) => s + p.bondLevel, 0) / alivePets.length
      if (avgBond > 70) {
        effects.happiness    = (effects.happiness    ?? 0) + 2
        effects.mentalHealth = (effects.mentalHealth ?? 0) + 1
      }
    }

    // ─── Fame / reputation spiral ─────────────────────────────────
    if (fame.scandals >= 3 && fame.publicImage < 35) {
      effects.socialReputation = (effects.socialReputation ?? 0) - 3
      effects.reputation       = (effects.reputation       ?? 0) - 2
      messages.push('📰 Gli scandali ripetuti continuano a erodere la tua reputazione pubblica.')
    }
    if (fame.fame > 500 && fame.publicImage > 70) {
      effects.happiness = (effects.happiness ?? 0) + 2
      effects.looks     = (effects.looks     ?? 0) + 1
    }

    // ─── Hobby fulfillment ────────────────────────────────────────
    const activeHobbies = hobbies.filter(h => h.skillLevel > 20)
    if (activeHobbies.length > 0) {
      effects.happiness    = (effects.happiness    ?? 0) + 1
      effects.mentalHealth = (effects.mentalHealth ?? 0) + 1
    }

    // ─── Age-related wisdom bonus ─────────────────────────────────
    if (time.age >= 30 && time.age < 60) {
      effects.intelligence = (effects.intelligence ?? 0) + Math.round((time.age - 28) / 10 * 0.3)
    }

    // ─── Health diseases from RetirementEngine (senior conditions) ─
    // Already handled by RetirementEngine.annualTick — no duplicate here

    // ─── Addiction compounding ────────────────────────────────────
    if (health.addictions.length >= 2) {
      effects.health       = (effects.health       ?? 0) - 3
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 3
      if (health.addictions.length >= 3) {
        messages.push('💊 Le dipendenze multiple stanno compromettendo seriamente la salute.')
      }
    }

    // ─── Parenting happiness ─────────────────────────────────────
    const children = state.children ?? []
    const bondedKids = children.filter(c => c.bondWithPlayer > 50)
    if (bondedKids.length > 0) {
      effects.happiness    = (effects.happiness    ?? 0) + Math.min(bondedKids.length, 3)
      effects.mentalHealth = (effects.mentalHealth ?? 0) + 1
    }

    // ─── Student engagement ──────────────────────────────────────
    if (isStudent && state.education.gpa >= 2.5) {
      effects.intelligence = (effects.intelligence ?? 0) + 1
    }

    // ─── Energy recovery from good sleep when unemployed/studying ─
    if (!career.currentJob && stats.energy < 60) {
      effects.energy = (effects.energy ?? 0) + 2
    }

    return { effects, messages }
  }
}
