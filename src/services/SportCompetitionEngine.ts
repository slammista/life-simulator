import type { GameState, Effect } from '../store/types'
import { getSportDef } from './SportEngine'

export type CompetitionLevel = 'locale' | 'regionale' | 'nazionale' | 'internazionale' | 'olimpico'
export type CompetitionOutcome = 'eccezionale' | 'vittoria' | 'podio' | 'eliminato' | 'sconfitta' | 'infortunio'

export interface CompetitionResult {
  sportId: string
  level: CompetitionLevel
  outcome: CompetitionOutcome
  message: string
  effects: Effect
  skillGain: number
  prizeLabel: string
}

const LEVEL_CONFIGS: Record<CompetitionLevel, {
  minSkill: number
  prizeMoney: [number, number]
  fameGain: number
  entryFee: number
  label: string
}> = {
  locale:         { minSkill: 10, prizeMoney: [0, 500],       fameGain: 1,  entryFee: 20,  label: 'locale' },
  regionale:      { minSkill: 30, prizeMoney: [200, 2000],    fameGain: 3,  entryFee: 50,  label: 'regionale' },
  nazionale:      { minSkill: 50, prizeMoney: [1000, 10000],  fameGain: 8,  entryFee: 100, label: 'nazionale' },
  internazionale: { minSkill: 70, prizeMoney: [5000, 50000],  fameGain: 15, entryFee: 200, label: 'internazionale' },
  olimpico:       { minSkill: 85, prizeMoney: [0, 100000],    fameGain: 30, entryFee: 0,   label: 'olimpico' },
}

export class SportCompetitionEngine {
  static getLevelForSkill(skill: number): CompetitionLevel {
    if (skill >= 85) return 'olimpico'
    if (skill >= 70) return 'internazionale'
    if (skill >= 50) return 'nazionale'
    if (skill >= 30) return 'regionale'
    return 'locale'
  }

  static canEnter(sportId: string, state: GameState): { can: boolean; reason?: string } {
    const sport = (state.sports ?? []).find(s => s.id === sportId)
    if (!sport) return { can: false, reason: 'Non pratichi questo sport.' }
    const key = `competition_${sportId}_${state.time.year}`
    const entered = state.diminishingReturns[key] ?? 0
    if (entered >= 2) return { can: false, reason: "Hai già gareggiato abbastanza quest'anno." }
    if (state.stats.health < 20) return { can: false, reason: 'Salute troppo bassa per gareggiare.' }
    if (sport.skillLevel < 10) return { can: false, reason: 'Allena di più prima di gareggiare.' }
    return { can: true }
  }

  static enterCompetition(sportId: string, state: GameState): CompetitionResult {
    const sport = (state.sports ?? []).find(s => s.id === sportId)!
    const def = getSportDef(sportId)!
    const level = this.getLevelForSkill(sport.skillLevel)
    const config = LEVEL_CONFIGS[level]

    // Injury check first
    if (Math.random() < def.injuryRisk * 0.3) {
      return {
        sportId, level, outcome: 'infortunio',
        message: `Ti sei infortunato durante la gara di ${def.name}! Riposo forzato. ${def.emoji}`,
        effects: { health: -15, energy: -20, happiness: -10, money: -config.entryFee },
        skillGain: 0,
        prizeLabel: 'Nessun premio',
      }
    }

    const ageFactor = this._ageFactor(state.time.age, sportId)
    const winChance = (sport.skillLevel / 100) * 0.6 + (state.stats.health / 100) * 0.2 + ageFactor * 0.2
    const roll = Math.random()

    let outcome: CompetitionOutcome
    let prizeMultiplier: number
    let fameMultiplier: number
    let skillGain: number
    let happinessGain: number

    if (roll < winChance * 0.1) {
      outcome = 'eccezionale'; prizeMultiplier = 1.6; fameMultiplier = 2.2; skillGain = 6; happinessGain = 25
    } else if (roll < winChance * 0.3) {
      outcome = 'vittoria'; prizeMultiplier = 1; fameMultiplier = 1.2; skillGain = 4; happinessGain = 18
    } else if (roll < winChance * 0.6) {
      outcome = 'podio'; prizeMultiplier = 0.4; fameMultiplier = 0.7; skillGain = 3; happinessGain = 10
    } else if (roll < 0.78) {
      outcome = 'eliminato'; prizeMultiplier = 0; fameMultiplier = 0.15; skillGain = 2; happinessGain = 2
    } else {
      outcome = 'sconfitta'; prizeMultiplier = 0; fameMultiplier = 0; skillGain = 1; happinessGain = -3
    }

    const [minPrize, maxPrize] = config.prizeMoney
    const prize = prizeMultiplier > 0
      ? Math.round((minPrize + Math.random() * (maxPrize - minPrize)) * prizeMultiplier)
      : 0
    const fameGain = Math.round(config.fameGain * fameMultiplier)

    const effects: Effect = {
      money: prize - config.entryFee,
      happiness: happinessGain,
      energy: -15,
    }
    if (fameGain > 0) effects.fame = fameGain

    const messages: Record<CompetitionOutcome, string> = {
      eccezionale: `Prestazione LEGGENDARIA! Dominio assoluto nella gara ${config.label} di ${def.name}! ${def.emoji}🏆`,
      vittoria:    `Hai VINTO la gara ${config.label} di ${def.name}! ${def.emoji}🥇`,
      podio:       `Sul PODIO nella gara ${config.label} di ${def.name}! ${def.emoji}🥈`,
      eliminato:   `Eliminato nelle fasi iniziali della gara ${config.label} di ${def.name}.`,
      sconfitta:   `Sconfitta nella gara ${config.label} di ${def.name}. Tornerai più forte!`,
      infortunio:  '',
    }

    return {
      sportId, level, outcome,
      message: messages[outcome],
      effects, skillGain,
      prizeLabel: prize > 0 ? `+€${prize.toLocaleString('it-IT')}` : 'Nessun premio',
    }
  }

  private static _ageFactor(age: number, sportId: string): number {
    const peakAge = ['ginnastica', 'nuoto', 'pattinaggio'].includes(sportId) ? 20 : 25
    const diff = Math.abs(age - peakAge)
    return Math.max(0, 1 - diff * 0.025)
  }
}
