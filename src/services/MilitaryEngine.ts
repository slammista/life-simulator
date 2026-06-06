import type { GameState, Effect } from '../store/types'

export interface MilitaryState {
  isEnlisted: boolean
  branch: string | null
  rank: string | null
  rankIndex: number          // 0 = Recluta, 11 = Generale
  yearsOfService: number
  missions: number
  decorations: string[]
  ptsd: boolean
  discharged: boolean
  honorableDischarge: boolean
  pensionEligible: boolean   // true after 20 years of service
}

export type MilitaryBranch = 'esercito' | 'marina' | 'aeronautica' | 'carabinieri' | 'guardia_finanza'
export type MissionType = 'peacekeeping' | 'combat' | 'training'

export const MILITARY_BRANCHES: Record<MilitaryBranch, { name: string; emoji: string; baseSalary: number; combatRisk: number }> = {
  esercito:        { name: 'Esercito Italiano',     emoji: '🪖',  baseSalary: 1600, combatRisk: 0.25 },
  marina:          { name: 'Marina Militare',        emoji: '⚓',  baseSalary: 1700, combatRisk: 0.20 },
  aeronautica:     { name: 'Aeronautica Militare',   emoji: '✈️',  baseSalary: 1800, combatRisk: 0.15 },
  carabinieri:     { name: 'Arma dei Carabinieri',   emoji: '🚔',  baseSalary: 1650, combatRisk: 0.10 },
  guardia_finanza: { name: 'Guardia di Finanza',     emoji: '🛡️',  baseSalary: 1700, combatRisk: 0.08 },
}

export const MILITARY_RANKS = [
  { rank: 'Recluta',                    multiplier: 1.0 },
  { rank: 'Soldato Semplice',           multiplier: 1.1 },
  { rank: 'Caporale',                   multiplier: 1.2 },
  { rank: 'Sergente',                   multiplier: 1.4 },
  { rank: 'Tenente',                    multiplier: 1.7 },
  { rank: 'Capitano',                   multiplier: 2.0 },
  { rank: 'Maggiore',                   multiplier: 2.5 },
  { rank: 'Tenente Colonnello',         multiplier: 3.0 },
  { rank: 'Colonnello',                 multiplier: 3.5 },
  { rank: 'Generale di Brigata',        multiplier: 4.0 },
  { rank: 'Generale di Divisione',      multiplier: 4.5 },
  { rank: 'Generale di Corpo d\'Armata', multiplier: 5.0 },
]

export interface MilitaryActionResult {
  success: boolean
  message: string
  effects: Effect
  updatedMilitary?: Partial<MilitaryState>
  died?: boolean
}

export class MilitaryEngine {
  static getSalary(military: MilitaryState): number {
    if (!military.isEnlisted || !military.branch) return 0
    const branch = MILITARY_BRANCHES[military.branch as MilitaryBranch]
    const rankData = MILITARY_RANKS[military.rankIndex] ?? MILITARY_RANKS[0]
    return Math.round(branch.baseSalary * rankData.multiplier)
  }

  static enlist(branch: MilitaryBranch, state: GameState): MilitaryActionResult {
    const { time, stats, criminal } = state
    if (state.military.isEnlisted)
      return { success: false, message: 'Sei già arruolato nelle forze armate.', effects: {} }
    if (state.military.discharged)
      return { success: false, message: 'Sei già stato congedato. Non puoi riarruolarti.', effects: {} }
    if (time.age < 18 || time.age > 30)
      return { success: false, message: 'L\'arruolamento richiede un\'età tra 18 e 30 anni.', effects: {} }
    if (stats.health < 60)
      return { success: false, message: 'La tua salute è insufficiente (min 60). Allenati prima di arruolarti.', effects: {} }
    if (criminal.hasRecord && criminal.crimes.some(c => c.type !== 'minor_theft'))
      return { success: false, message: 'Con una fedina penale sporca non puoi arruolarti.', effects: {} }

    const branchData = MILITARY_BRANCHES[branch]
    return {
      success: true,
      message: `${branchData.emoji} Sei stato arruolato nell'${branchData.name}! Addestramento di base iniziato. Grado: Recluta. Stipendio: €${branchData.baseSalary}/mese.`,
      effects: { health: -5, mentalHealth: -5, happiness: 10, reputation: 8, energy: -10 },
      updatedMilitary: {
        isEnlisted: true,
        branch,
        rank: 'Recluta',
        rankIndex: 0,
        yearsOfService: 0,
        missions: 0,
      },
    }
  }

  static goOnMission(type: MissionType, state: GameState): MilitaryActionResult {
    const { military } = state
    if (!military.isEnlisted)
      return { success: false, message: 'Devi essere arruolato per andare in missione.', effects: {} }

    const branch = MILITARY_BRANCHES[military.branch as MilitaryBranch]
    const key = `mission_${state.time.year}`
    const uses = state.diminishingReturns[key] ?? 0
    if (uses >= 2)
      return { success: false, message: 'Hai già completato abbastanza missioni quest\'anno.', effects: {} }

    if (type === 'training') {
      return {
        success: true,
        message: '🎯 Addestramento completato. Le tue abilità militari migliorano.',
        effects: { health: 5, energy: -10, intelligence: 2, reputation: 2 },
        updatedMilitary: { missions: military.missions + 1 },
      }
    }

    if (type === 'peacekeeping') {
      const successChance = 0.85
      const success = Math.random() < successChance
      if (success) {
        return {
          success: true,
          message: `🕊️ Missione di peacekeeping completata con successo. +reputazione e +stipendio bonus.`,
          effects: { happiness: 8, reputation: 10, socialReputation: 5, money: 2000, mentalHealth: -3 },
          updatedMilitary: {
            missions: military.missions + 1,
            decorations: [...military.decorations, 'Medaglia al Merito'],
          },
        }
      }
      return {
        success: false,
        message: '😔 La missione di peacekeeping si è rivelata più difficile del previsto. Ritornato sano e salvo.',
        effects: { mentalHealth: -8, happiness: -5 },
        updatedMilitary: { missions: military.missions + 1 },
      }
    }

    // Combat mission — high risk, high reward
    const deathRisk = branch.combatRisk
    const injuryRisk = deathRisk * 1.5
    const ptsdRisk = deathRisk * 2

    if (Math.random() < deathRisk * 0.4) {
      return {
        success: false, died: true,
        message: '💀 Sei caduto in missione di combattimento. Onore al tuo sacrificio.',
        effects: { health: -100 },
        updatedMilitary: { missions: military.missions + 1 },
      }
    }

    if (Math.random() < injuryRisk) {
      return {
        success: false,
        message: '🏥 Sei rimasto ferito in combattimento. Riportato alla base per le cure.',
        effects: { health: -25, mentalHealth: -10, money: 3000 },
        updatedMilitary: {
          missions: military.missions + 1,
          decorations: [...military.decorations, 'Croce al Merito di Guerra'],
        },
      }
    }

    const ptsd = Math.random() < ptsdRisk
    return {
      success: true,
      message: `⚔️ Missione di combattimento completata. Tornato dalla zona di guerra. ${ptsd ? '⚠️ Hai sviluppato sintomi di PTSD.' : 'Nessuna ferita grave.'}`,
      effects: { happiness: 5, reputation: 20, socialReputation: 12, money: 5000, mentalHealth: ptsd ? -25 : -8, health: -5 },
      updatedMilitary: {
        missions: military.missions + 1,
        ptsd: ptsd || military.ptsd,
        decorations: [...military.decorations, 'Medaglia al Valore Militare'],
      },
    }
  }

  static requestPromotion(state: GameState): MilitaryActionResult {
    const { military, time } = state
    if (!military.isEnlisted)
      return { success: false, message: 'Devi essere arruolato.', effects: {} }
    if (military.rankIndex >= MILITARY_RANKS.length - 1)
      return { success: false, message: 'Hai già il grado massimo!', effects: {} }

    const yearsNeeded = 2 + military.rankIndex * 1.5
    if (military.yearsOfService < yearsNeeded)
      return { success: false, message: `Servono almeno ${Math.ceil(yearsNeeded)} anni di servizio per questa promozione (hai ${military.yearsOfService}).`, effects: {} }

    const missionBonus = Math.min(0.3, military.missions * 0.025)
    const passChance = Math.min(0.8, 0.4 + missionBonus + state.stats.reputation * 0.002)
    const promoted = Math.random() < passChance

    if (promoted) {
      const newRankIndex = military.rankIndex + 1
      const newRank = MILITARY_RANKS[newRankIndex]
      const branch = MILITARY_BRANCHES[military.branch as MilitaryBranch]
      const newSalary = Math.round(branch.baseSalary * newRank.multiplier)

      return {
        success: true,
        message: `🎖️ Promosso/a a ${newRank.rank}! Nuovo stipendio: €${newSalary.toLocaleString()}/mese.`,
        effects: { happiness: 15, reputation: 10, socialReputation: 5 },
        updatedMilitary: { rankIndex: newRankIndex, rank: newRank.rank },
      }
    }

    return {
      success: false,
      message: '❌ La domanda di promozione non è stata accettata. Continua a dimostrare il tuo valore.',
      effects: { happiness: -5 },
    }
  }

  static discharge(state: GameState): MilitaryActionResult {
    const { military } = state
    if (!military.isEnlisted)
      return { success: false, message: 'Non sei arruolato.', effects: {} }

    const honorable = military.missions >= 2
    const pensionEligible = military.yearsOfService >= 20

    return {
      success: true,
      message: `🎗️ Congedo ${honorable ? 'onorifico' : 'ordinario'} ottenuto dopo ${military.yearsOfService} anni di servizio. ${pensionEligible ? 'Hai maturato la pensione militare.' : ''}`,
      effects: { happiness: 10, reputation: honorable ? 8 : 3 },
      updatedMilitary: {
        isEnlisted: false,
        discharged: true,
        honorableDischarge: honorable,
        pensionEligible,
      },
    }
  }

  static annualTick(state: GameState): { effects: Effect; updatedMilitary: Partial<MilitaryState> } {
    const { military } = state
    if (!military.isEnlisted) return { effects: {}, updatedMilitary: {} }

    const salary = MilitaryEngine.getSalary(military)
    const yearsOfService = military.yearsOfService + 1
    const pensionEligible = yearsOfService >= 20

    // PTSD annual toll
    const ptsdToll: Effect = military.ptsd ? { mentalHealth: -5, happiness: -3 } : {}

    return {
      effects: { money: salary * 12, health: -2, energy: -5, ...ptsdToll },
      updatedMilitary: { yearsOfService, pensionEligible },
    }
  }
}
