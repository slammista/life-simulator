import type { GameState, Effect, Hobby } from '../store/types'

export interface HobbyDef {
  id: string
  name: string
  emoji: string
  category: 'music' | 'sport' | 'art' | 'cognitive' | 'physical' | 'digital'
  costToStart: number
  annualCost: number
  weeklyHours: number
  statBenefits: Effect
  decayPerYear: number
  monetizable: boolean
  incomePerSkillPoint: number
  packId: string
}

export interface HobbyActionResult {
  success: boolean
  message: string
  effects: Effect
  skillGain?: number
  newHobby?: Hobby
}

const HOBBY_DEFS: HobbyDef[] = [
  { id: 'guitar', name: 'Chitarra', emoji: '🎸', category: 'music', costToStart: 300, annualCost: 120, weeklyHours: 3, statBenefits: { mentalHealth: 5, happiness: 6, socialReputation: 2 }, decayPerYear: 8, monetizable: true, incomePerSkillPoint: 15, packId: 'base' },
  { id: 'piano', name: 'Pianoforte', emoji: '🎹', category: 'music', costToStart: 800, annualCost: 300, weeklyHours: 4, statBenefits: { mentalHealth: 6, happiness: 6, intelligence: 2 }, decayPerYear: 10, monetizable: true, incomePerSkillPoint: 20, packId: 'base' },
  { id: 'painting', name: 'Pittura', emoji: '🎨', category: 'art', costToStart: 150, annualCost: 80, weeklyHours: 3, statBenefits: { mentalHealth: 8, happiness: 7, looks: 1 }, decayPerYear: 5, monetizable: true, incomePerSkillPoint: 10, packId: 'base' },
  { id: 'photography', name: 'Fotografia', emoji: '📸', category: 'art', costToStart: 600, annualCost: 100, weeklyHours: 2, statBenefits: { socialReputation: 5, happiness: 4 }, decayPerYear: 5, monetizable: true, incomePerSkillPoint: 12, packId: 'base' },
  { id: 'cooking', name: 'Cucina', emoji: '🍳', category: 'art', costToStart: 50, annualCost: 200, weeklyHours: 2, statBenefits: { health: 3, happiness: 6, socialReputation: 3 }, decayPerYear: 3, monetizable: true, incomePerSkillPoint: 8, packId: 'base' },
  { id: 'running', name: 'Corsa', emoji: '🏃', category: 'sport', costToStart: 100, annualCost: 80, weeklyHours: 3, statBenefits: { health: 8, energy: 5, looks: 3, mentalHealth: 4 }, decayPerYear: 6, monetizable: false, incomePerSkillPoint: 0, packId: 'base' },
  { id: 'gym', name: 'Palestra', emoji: '🏋️', category: 'physical', costToStart: 0, annualCost: 600, weeklyHours: 4, statBenefits: { health: 10, looks: 6, energy: 5 }, decayPerYear: 10, monetizable: false, incomePerSkillPoint: 0, packId: 'base' },
  { id: 'yoga', name: 'Yoga', emoji: '🧘', category: 'physical', costToStart: 50, annualCost: 240, weeklyHours: 3, statBenefits: { mentalHealth: 10, health: 4, energy: 6 }, decayPerYear: 4, monetizable: false, incomePerSkillPoint: 0, packId: 'base' },
  { id: 'chess', name: 'Scacchi', emoji: '♟️', category: 'cognitive', costToStart: 30, annualCost: 10, weeklyHours: 2, statBenefits: { intelligence: 6, mentalHealth: 3 }, decayPerYear: 4, monetizable: true, incomePerSkillPoint: 5, packId: 'base' },
  { id: 'reading', name: 'Lettura', emoji: '📚', category: 'cognitive', costToStart: 20, annualCost: 120, weeklyHours: 3, statBenefits: { intelligence: 8, mentalHealth: 4, happiness: 3 }, decayPerYear: 2, monetizable: false, incomePerSkillPoint: 0, packId: 'base' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮', category: 'digital', costToStart: 400, annualCost: 200, weeklyHours: 5, statBenefits: { happiness: 8, intelligence: 2, mentalHealth: -2 }, decayPerYear: 3, monetizable: true, incomePerSkillPoint: 8, packId: 'base' },
  { id: 'dancing', name: 'Danza', emoji: '💃', category: 'physical', costToStart: 100, annualCost: 400, weeklyHours: 3, statBenefits: { looks: 5, happiness: 8, health: 3, socialReputation: 4 }, decayPerYear: 8, monetizable: true, incomePerSkillPoint: 12, packId: 'base' },
  { id: 'swimming', name: 'Nuoto', emoji: '🏊', category: 'sport', costToStart: 50, annualCost: 480, weeklyHours: 3, statBenefits: { health: 10, energy: 6, looks: 2 }, decayPerYear: 6, monetizable: false, incomePerSkillPoint: 0, packId: 'base' },
  { id: 'martial_arts', name: 'Arti marziali', emoji: '🥋', category: 'sport', costToStart: 150, annualCost: 600, weeklyHours: 4, statBenefits: { health: 8, energy: 4, reputation: 3, mentalHealth: 5 }, decayPerYear: 8, monetizable: false, incomePerSkillPoint: 0, packId: 'base' },
  { id: 'languages', name: 'Lingue', emoji: '🗣️', category: 'cognitive', costToStart: 30, annualCost: 150, weeklyHours: 3, statBenefits: { intelligence: 5, socialReputation: 5, happiness: 2 }, decayPerYear: 5, monetizable: true, incomePerSkillPoint: 10, packId: 'base' },
]

export function getHobbyDef(id: string): HobbyDef | undefined {
  return HOBBY_DEFS.find(h => h.id === id)
}

export function getAllHobbyDefs(): HobbyDef[] {
  return HOBBY_DEFS
}

export class HobbyEngine {
  static addHobby(hobbyId: string, state: GameState): HobbyActionResult {
    const def = getHobbyDef(hobbyId)
    if (!def) return { success: false, message: 'Hobby non trovato.', effects: {} }
    if (state.hobbies.some(h => h.id === hobbyId)) {
      return { success: false, message: `Pratichi già ${def.name}.`, effects: {} }
    }
    if (state.finance.money < def.costToStart) {
      return { success: false, message: `Non hai abbastanza soldi (costo avvio: €${def.costToStart}).`, effects: {} }
    }

    const newHobby: Hobby = {
      id: hobbyId,
      name: def.name,
      skillLevel: 5,
      practiceHoursPerWeek: def.weeklyHours,
      monetizable: def.monetizable,
      monthlyIncome: 0,
      yearStarted: state.time.year,
      packId: def.packId,
    }

    return {
      success: true,
      message: `Hai iniziato a praticare ${def.name}! ${def.emoji}`,
      effects: { money: -def.costToStart, happiness: 5, energy: -5 },
      skillGain: 5,
      newHobby,
    }
  }

  static practiceHobby(hobbyId: string, state: GameState): HobbyActionResult {
    const hobby = state.hobbies.find(h => h.id === hobbyId)
    if (!hobby) return { success: false, message: 'Non pratichi questo hobby.', effects: {} }
    const def = getHobbyDef(hobbyId)
    if (!def) return { success: false, message: 'Dati hobby non trovati.', effects: {} }

    const key = `hobby_${hobbyId}_${state.time.year}`
    const uses = state.diminishingReturns[key] ?? 0
    if (uses >= 4) {
      return {
        success: false,
        message: `Hai già praticato ${def.name} molto quest'anno.`,
        effects: { energy: -3 },
      }
    }

    const dr = Math.max(0.35, 1 - uses * 0.15)
    const gain = Math.max(1, Math.round(8 * dr * (state.stats.intelligence / 100 + 0.5)))
    const effects: Effect = { energy: -10, money: -(def.annualCost / 4) }
    for (const [k, v] of Object.entries(def.statBenefits)) {
      effects[k] = (effects[k] ?? 0) + Math.round(v * dr * 0.5)
    }

    return {
      success: true,
      message: `Sessione di ${def.name} completata! +${gain} skill. ${def.emoji}`,
      effects,
      skillGain: gain,
    }
  }

  static annualTick(state: GameState): { effects: Effect; updates: Array<{ id: string; skillDelta: number; income: number }> } {
    const effects: Effect = {}
    const updates: Array<{ id: string; skillDelta: number; income: number }> = []

    for (const hobby of state.hobbies) {
      const def = getHobbyDef(hobby.id)
      if (!def) continue

      const practiceKey = `hobby_${hobby.id}_${state.time.year}`
      const practiced = (state.diminishingReturns[practiceKey] ?? 0) > 0

      const skillDelta = practiced
        ? Math.max(0, Math.round(5 * state.stats.intelligence / 100))
        : -def.decayPerYear

      const monthlyIncome = hobby.monetizable && hobby.skillLevel > 30
        ? Math.round(def.incomePerSkillPoint * hobby.skillLevel * 0.1)
        : 0

      effects.money = (effects.money ?? 0) + monthlyIncome * 12
      updates.push({ id: hobby.id, skillDelta, income: monthlyIncome })
    }

    return { effects, updates }
  }
}
