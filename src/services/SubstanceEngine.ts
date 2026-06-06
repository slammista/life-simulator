import type { GameState, Effect, Addiction } from '../store/types'

export type AlcoholType = 'beer' | 'wine' | 'cocktail' | 'shot'
export type SmokeType = 'cigarette' | 'vape' | 'marijuana'
export type SubstanceName = AlcoholType | SmokeType

interface AlcoholDef {
  name: string; emoji: string; cost: number; bacBoost: number
  effects: Effect; addictionRisk: number
}
interface SmokeDef {
  name: string; emoji: string; cost: number; addictionRisk: number
  effects: Effect; legal: boolean
}

const ALCOHOL: Record<AlcoholType, AlcoholDef> = {
  beer:     { name: 'Birra',     emoji: '🍺', cost: 5,  bacBoost: 0.02, effects: { happiness: 4, energy: -2, mentalHealth: 2 }, addictionRisk: 0.05 },
  wine:     { name: 'Vino',      emoji: '🍷', cost: 10, bacBoost: 0.03, effects: { happiness: 5, energy: -2, socialReputation: 1 }, addictionRisk: 0.05 },
  cocktail: { name: 'Cocktail',  emoji: '🍹', cost: 15, bacBoost: 0.04, effects: { happiness: 8, energy: -3, socialReputation: 2 }, addictionRisk: 0.06 },
  shot:     { name: 'Shots',     emoji: '🥃', cost: 8,  bacBoost: 0.06, effects: { happiness: 10, energy: -6, health: -2 }, addictionRisk: 0.08 },
}

const SMOKE: Record<SmokeType, SmokeDef> = {
  cigarette: { name: 'Sigaretta', emoji: '🚬', cost: 0.50, addictionRisk: 0.15, legal: true,
    effects: { health: -3, mentalHealth: 2, energy: -1 } },
  vape:      { name: 'Vape',      emoji: '💨', cost: 1.00, addictionRisk: 0.10, legal: true,
    effects: { health: -1, mentalHealth: 2, energy: -1 } },
  marijuana: { name: 'Cannabis',  emoji: '🌿', cost: 10.00, addictionRisk: 0.05, legal: false,
    effects: { health: -1, mentalHealth: 6, happiness: 10, intelligence: -2, energy: -4 } },
}

export interface SubstanceResult {
  success: boolean; message: string; effects: Effect
  newAddiction?: Addiction
  updatedAddiction?: { substance: string; levelDelta: number }
}

export class SubstanceEngine {
  static getAlcohol() { return ALCOHOL }
  static getSmoke() { return SMOKE }

  static drink(type: AlcoholType, state: GameState): SubstanceResult {
    const def = ALCOHOL[type]
    if (state.finance.money < def.cost)
      return { success: false, message: 'Non hai abbastanza soldi.', effects: {} }

    const effects: Effect = { ...def.effects, money: -def.cost }

    // High BAC penalty (simplified: track addiction level as BAC proxy)
    const alcAddiction = state.health.addictions.find(a => a.substance === 'alcohol')
    const currentLevel = alcAddiction?.level ?? 0
    if (currentLevel > 60) {
      effects.health = (effects.health ?? 0) - 5
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 3
    }

    const addictionChance = def.addictionRisk + currentLevel / 500
    const addictionDelta = Math.random() < addictionChance ? 3 : 1

    const message = currentLevel > 70
      ? `${def.emoji} Bevi un altro ${def.name}. Stai esagerando con l'alcol.`
      : `${def.emoji} Bevi ${def.name}. Ti rilassi un po'.`

    return {
      success: true, message, effects,
      updatedAddiction: { substance: 'alcohol', levelDelta: addictionDelta },
    }
  }

  static smoke(type: SmokeType, state: GameState): SubstanceResult {
    const def = SMOKE[type]
    if (!def.legal && state.criminal.hasRecord && Math.random() < 0.05)
      return { success: false, message: `⚠️ Rischi di essere fermato con la ${def.name}.`, effects: { karma: -2 } }
    if (state.finance.money < def.cost)
      return { success: false, message: 'Non hai abbastanza soldi.', effects: {} }

    const effects: Effect = { ...def.effects, money: -def.cost }
    const existing = state.health.addictions.find(a => a.substance === type)
    const addictionDelta = Math.random() < def.addictionRisk ? 3 : 1

    const message = `${def.emoji} Fumi ${def.name}.${existing && existing.level > 50 ? ' Non riesci più a farne a meno.' : ''}`

    return {
      success: true, message, effects,
      updatedAddiction: { substance: type, levelDelta: addictionDelta },
    }
  }

  static quitSubstance(substance: string, state: GameState): SubstanceResult {
    const addiction = state.health.addictions.find(a => a.substance === substance)
    if (!addiction) return { success: false, message: 'Non hai questa dipendenza.', effects: {} }

    const difficulty = addiction.level / 100
    const success = Math.random() > difficulty * 0.7

    if (success) {
      return {
        success: true,
        message: `💪 Stai resistendo alla tentazione. La tua dipendenza diminuisce.`,
        effects: { mentalHealth: -5, health: 3, karma: 5 },
        updatedAddiction: { substance, levelDelta: -15 },
      }
    }
    return {
      success: false,
      message: `😔 Hai ceduto alla dipendenza. È difficile smettere.`,
      effects: { mentalHealth: -8, happiness: -5 },
    }
  }

  static annualTick(state: GameState): { updatedAddictions: Addiction[]; effects: Effect } {
    const effects: Effect = {}
    const updatedAddictions = state.health.addictions.map(a => {
      // Natural decay if not using
      const decayedLevel = Math.max(0, a.level - 5)
      // Long-term health impact
      if (a.level > 50) {
        effects.health = (effects.health ?? 0) - Math.floor(a.level / 20)
        effects.mentalHealth = (effects.mentalHealth ?? 0) - 2
      }
      return { ...a, level: decayedLevel }
    })
    return { updatedAddictions: updatedAddictions.filter(a => a.level > 0), effects }
  }
}
