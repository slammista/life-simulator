import type { GameState, Effect, Crime, CriminalRecord } from '../store/types'

export interface CrimeDef {
  id: string
  name: string
  emoji: string
  category: 'theft' | 'fraud' | 'violence' | 'drug' | 'corruption' | 'vandalism'
  minAge: number
  baseMoneyGain: number
  baseArrestChance: number
  sentence: number
  karmaHit: number
  reputationHit: number
  requiresCleanRecord: boolean
  intelligenceBonus: boolean
}

export interface CriminalActionResult {
  success: boolean
  arrested: boolean
  message: string
  effects: Effect
  crimeRecord?: Crime
}

const CRIME_DEFS: CrimeDef[] = [
  { id: 'pickpocket', name: 'Borseggio', emoji: '👜', category: 'theft', minAge: 14, baseMoneyGain: 80, baseArrestChance: 0.18, sentence: 1, karmaHit: -8, reputationHit: -5, requiresCleanRecord: false, intelligenceBonus: true },
  { id: 'shoplifting', name: 'Taccheggio', emoji: '🏪', category: 'theft', minAge: 14, baseMoneyGain: 120, baseArrestChance: 0.22, sentence: 1, karmaHit: -8, reputationHit: -5, requiresCleanRecord: false, intelligenceBonus: false },
  { id: 'burglary', name: 'Furto con scasso', emoji: '🔐', category: 'theft', minAge: 16, baseMoneyGain: 600, baseArrestChance: 0.28, sentence: 3, karmaHit: -15, reputationHit: -15, requiresCleanRecord: false, intelligenceBonus: true },
  { id: 'fraud', name: 'Frode', emoji: '📄', category: 'fraud', minAge: 18, baseMoneyGain: 2000, baseArrestChance: 0.15, sentence: 4, karmaHit: -18, reputationHit: -25, requiresCleanRecord: false, intelligenceBonus: true },
  { id: 'tax_evasion', name: 'Evasione fiscale', emoji: '🧾', category: 'fraud', minAge: 18, baseMoneyGain: 5000, baseArrestChance: 0.08, sentence: 3, karmaHit: -12, reputationHit: -20, requiresCleanRecord: false, intelligenceBonus: true },
  { id: 'drug_dealing', name: 'Spaccio', emoji: '💊', category: 'drug', minAge: 15, baseMoneyGain: 800, baseArrestChance: 0.25, sentence: 5, karmaHit: -20, reputationHit: -30, requiresCleanRecord: false, intelligenceBonus: false },
  { id: 'robbery', name: 'Rapina', emoji: '💰', category: 'violence', minAge: 16, baseMoneyGain: 2500, baseArrestChance: 0.35, sentence: 7, karmaHit: -30, reputationHit: -40, requiresCleanRecord: false, intelligenceBonus: false },
  { id: 'assault', name: 'Aggressione', emoji: '👊', category: 'violence', minAge: 14, baseMoneyGain: 0, baseArrestChance: 0.40, sentence: 3, karmaHit: -25, reputationHit: -30, requiresCleanRecord: false, intelligenceBonus: false },
  { id: 'corruption', name: 'Corruzione', emoji: '🤝', category: 'corruption', minAge: 25, baseMoneyGain: 8000, baseArrestChance: 0.10, sentence: 6, karmaHit: -30, reputationHit: -50, requiresCleanRecord: false, intelligenceBonus: true },
  { id: 'vandalism', name: 'Vandalismo', emoji: '🖌️', category: 'vandalism', minAge: 14, baseMoneyGain: 0, baseArrestChance: 0.15, sentence: 1, karmaHit: -10, reputationHit: -10, requiresCleanRecord: false, intelligenceBonus: false },
]

export function getCrimeDef(id: string): CrimeDef | undefined {
  return CRIME_DEFS.find(c => c.id === id)
}

export function getAllCrimeDefs(): CrimeDef[] {
  return CRIME_DEFS
}

const uid = () => Math.random().toString(36).slice(2, 10)

export class CriminalEngine {
  static commitCrime(crimeId: string, state: GameState): CriminalActionResult {
    const def = getCrimeDef(crimeId)
    if (!def) return { success: false, arrested: false, message: 'Crimine non trovato.', effects: {} }
    if (state.time.age < def.minAge) {
      return { success: false, arrested: false, message: `Devi avere almeno ${def.minAge} anni.`, effects: {} }
    }
    if (state.criminal.inPrison) {
      return { success: false, arrested: false, message: 'Sei già in prigione.', effects: {} }
    }

    // Arrest chance modified by intelligence (for fraud/theft) and past crimes
    const intMod = def.intelligenceBonus ? -(state.stats.intelligence - 50) / 500 : 0
    const recidiveMod = state.criminal.crimes.length * 0.03
    const arrestChance = Math.min(0.95, Math.max(0.05, def.baseArrestChance + intMod + recidiveMod))
    const arrested = Math.random() < arrestChance

    const moneyGain = arrested ? 0 : Math.round(def.baseMoneyGain * (0.8 + Math.random() * 0.4))

    const crimeRecord: Crime = {
      id: uid(),
      type: def.id,
      year: state.time.year,
      convicted: arrested,
      sentence: arrested ? def.sentence : 0,
      served: 0,
    }

    if (arrested) {
      return {
        success: false,
        arrested: true,
        message: `Sei stato arrestato per ${def.name}! Sentenza: ${def.sentence} ${def.sentence === 1 ? 'anno' : 'anni'}.`,
        effects: {
          karma: def.karmaHit,
          reputation: def.reputationHit,
          socialReputation: def.reputationHit,
          happiness: -20,
          mentalHealth: -15,
        },
        crimeRecord,
      }
    }

    return {
      success: true,
      arrested: false,
      message: `${def.name} riuscita! Guadagnato €${moneyGain.toLocaleString('it-IT')}. ${def.emoji}`,
      effects: {
        money: moneyGain,
        karma: def.karmaHit,
        reputation: -Math.round(def.reputationHit / 3),
        happiness: 5,
      },
      crimeRecord,
    }
  }

  static annualTick(state: GameState): { effects: Effect; freedThisYear: boolean; message: string; updatedCriminal: CriminalRecord } {
    const criminal = state.criminal
    const effects: Effect = {}
    let freedThisYear = false
    let message = ''

    if (!criminal.inPrison) {
      // Parole/bracelet check
      let updatedCriminal = { ...criminal }
      if (criminal.parole && criminal.paroleDuration > 0) {
        updatedCriminal = { ...updatedCriminal, paroleDuration: criminal.paroleDuration - 1 }
        if (updatedCriminal.paroleDuration <= 0) {
          updatedCriminal = { ...updatedCriminal, parole: false, electronicBracelet: false }
          message = 'Libertà vigilata conclusa. Sei ufficialmente libero/a.'
        }
      }
      return { effects, freedThisYear, message, updatedCriminal }
    }

    // In prison: serve time
    const newServed = criminal.prisonServed + 1
    effects.mentalHealth = -8
    effects.happiness = -10
    effects.health = -3
    effects.energy = -5

    if (newServed >= criminal.prisonSentence) {
      freedThisYear = true
      message = `Hai scontato la pena. Uscito/a di prigione dopo ${criminal.prisonSentence} ${criminal.prisonSentence === 1 ? 'anno' : 'anni'}.`
      const updatedCriminal: CriminalRecord = {
        ...criminal,
        inPrison: false,
        prisonServed: 0,
        prisonSentence: 0,
        parole: criminal.prisonSentence >= 3,
        paroleDuration: criminal.prisonSentence >= 3 ? 2 : 0,
        electronicBracelet: criminal.prisonSentence < 3,
        hasRecord: true,
      }
      return { effects, freedThisYear, message, updatedCriminal }
    }

    const updatedCriminal: CriminalRecord = { ...criminal, prisonServed: newServed }
    return { effects, freedThisYear, message: `Anno ${newServed} in prigione (${criminal.prisonSentence - newServed} rimanenti).`, updatedCriminal }
  }

  static getAvailableCrimes(state: GameState): CrimeDef[] {
    return CRIME_DEFS.filter(c =>
      state.time.age >= c.minAge && !state.criminal.inPrison
    )
  }
}
