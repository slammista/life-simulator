import type { GameState, EducationLevel, Effect, EducationState } from '../store/types'

// ---- types ----

export interface EducationActionResult {
  success: boolean
  message: string
  effects: Effect
  newLevel?: EducationLevel
  graduated?: boolean
  droppedOut?: boolean
}

// ---- constants ----

const LEVEL_REQUIREMENTS: Record<EducationLevel, {
  prevLevel: EducationLevel | null
  minAge: number
  maxAge: number
  durationYears: number
  cost: number
  intelligenceReq: number
}> = {
  none:         { prevLevel: null,          minAge: 0,  maxAge: 5,  durationYears: 0, cost: 0,      intelligenceReq: 0  },
  kindergarten: { prevLevel: null,          minAge: 3,  maxAge: 6,  durationYears: 3, cost: 0,      intelligenceReq: 0  },
  elementary:   { prevLevel: null,          minAge: 6,  maxAge: 11, durationYears: 5, cost: 0,      intelligenceReq: 0  },
  middle:       { prevLevel: 'elementary',  minAge: 11, maxAge: 14, durationYears: 3, cost: 0,      intelligenceReq: 20 },
  highschool:   { prevLevel: 'middle',      minAge: 14, maxAge: 19, durationYears: 5, cost: 0,      intelligenceReq: 30 },
  vocational:   { prevLevel: 'middle',      minAge: 14, maxAge: 30, durationYears: 3, cost: 2000,   intelligenceReq: 25 },
  bachelor:     { prevLevel: 'highschool',  minAge: 18, maxAge: 35, durationYears: 3, cost: 15000,  intelligenceReq: 45 },
  master:       { prevLevel: 'bachelor',    minAge: 21, maxAge: 40, durationYears: 2, cost: 20000,  intelligenceReq: 60 },
  phd:          { prevLevel: 'master',      minAge: 23, maxAge: 45, durationYears: 4, cost: 10000,  intelligenceReq: 75 },
  mba:          { prevLevel: 'bachelor',    minAge: 22, maxAge: 45, durationYears: 2, cost: 30000,  intelligenceReq: 60 },
  medical:      { prevLevel: 'highschool',  minAge: 18, maxAge: 30, durationYears: 6, cost: 25000,  intelligenceReq: 70 },
  law:          { prevLevel: 'highschool',  minAge: 18, maxAge: 30, durationYears: 5, cost: 20000,  intelligenceReq: 65 },
}

const LEVEL_LABELS: Record<EducationLevel, string> = {
  none: 'Nessuna',
  kindergarten: 'Scuola dell\'infanzia',
  elementary: 'Elementari',
  middle: 'Medie',
  highschool: 'Liceo',
  vocational: 'Scuola professionale',
  bachelor: 'Laurea triennale',
  master: 'Laurea magistrale',
  phd: 'Dottorato (PhD)',
  mba: 'MBA',
  medical: 'Medicina',
  law: 'Giurisprudenza',
}

export function getEducationLabel(level: EducationLevel): string {
  return LEVEL_LABELS[level] ?? level
}

// ---- engine ----

export class EducationEngine {
  static canEnroll(level: EducationLevel, state: GameState): { ok: boolean; reason: string } {
    const req = LEVEL_REQUIREMENTS[level]
    const { time, education, stats, finance } = state

    if (education.currentLevel === level) return { ok: false, reason: 'Stai già frequentando questo livello.' }
    if (education.completedLevels.includes(level)) return { ok: false, reason: 'Hai già completato questo livello.' }
    if (education.dropOut) return { ok: false, reason: 'Hai abbandonato gli studi. Devi ripetere il livello precedente.' }

    if (time.age < req.minAge) return { ok: false, reason: `Devi avere almeno ${req.minAge} anni.` }
    if (time.age > req.maxAge) return { ok: false, reason: `Sei troppo vecchio/a (max ${req.maxAge} anni).` }

    if (req.prevLevel && !education.completedLevels.includes(req.prevLevel)) {
      return { ok: false, reason: `Devi prima completare: ${LEVEL_LABELS[req.prevLevel]}.` }
    }

    if (stats.intelligence < req.intelligenceReq) {
      return { ok: false, reason: `Intelligenza insufficiente (min ${req.intelligenceReq}).` }
    }

    if (req.cost > 0 && finance.money < req.cost) {
      return { ok: false, reason: `Non hai abbastanza denaro (costo: €${req.cost.toLocaleString('it-IT')}).` }
    }

    return { ok: true, reason: '' }
  }

  static startEducation(level: EducationLevel, state: GameState): EducationActionResult {
    const check = this.canEnroll(level, state)
    if (!check.ok) return { success: false, message: check.reason, effects: {} }

    const req = LEVEL_REQUIREMENTS[level]
    const tuition = req.cost
    const effects: Effect = { money: -tuition, intelligence: 2, energy: -10 }

    return {
      success: true,
      message: `Sei iscritto/a a ${LEVEL_LABELS[level]}! ${tuition > 0 ? `Costo: €${tuition.toLocaleString('it-IT')}.` : ''}`,
      effects,
      newLevel: level,
    }
  }

  /** Study action — diminishing returns per year */
  static study(state: GameState): EducationActionResult {
    if (!state.education.currentLevel || state.education.currentLevel === 'none') {
      return { success: false, message: 'Non sei iscritto/a a nessun corso.', effects: {} }
    }

    const key = `study_${state.time.year}`
    const uses = state.diminishingReturns[key] ?? 0

    if (uses >= 5) {
      return {
        success: false,
        message: 'Hai già studiato molto quest\'anno. Riposati.',
        effects: { energy: -3 },
      }
    }

    // Diminishing returns: -10% per uso extra
    const dr = Math.max(0.3, 1 - uses * 0.1)
    const intGain = Math.round(5 * dr)
    const gpaGain = 0.1 * dr

    return {
      success: true,
      message: `Hai studiato intensamente. +${intGain} intelligenza, +${gpaGain.toFixed(2)} GPA.`,
      effects: { intelligence: intGain, energy: -8, happiness: -2, mentalHealth: -1 },
    }
  }

  /**
   * Annual GPA tick — called inside handleInvecchia.
   * Returns GPA delta and whether player graduates or drops out.
   */
  static annualTick(state: GameState): {
    gpaDelta: number
    graduated: boolean
    droppedOut: boolean
    message: string
    effects: Effect
  } {
    const edu = state.education
    if (!edu.currentLevel || edu.currentLevel === 'none') {
      return { gpaDelta: 0, graduated: false, droppedOut: false, message: '', effects: {} }
    }

    const req = LEVEL_REQUIREMENTS[edu.currentLevel]
    const intFactor = state.stats.intelligence / 100
    const energyFactor = state.stats.energy / 100

    // GPA change based on intelligence and energy
    const baseGpaGain = 0.3 * intFactor * energyFactor
    const gpaDelta = baseGpaGain - 0.05 // slight natural decay

    // Count years in current level (estimated from completedLevels length + current)
    const yearsInLevel = state.time.age - (req.minAge)
    const graduated = yearsInLevel >= req.durationYears && edu.gpa >= 1.5

    // Dropout risk: low GPA + low energy
    const dropoutChance = edu.gpa < 1.0 ? 0.3 : edu.gpa < 1.5 ? 0.10 : 0.02
    const droppedOut = !graduated && Math.random() < dropoutChance

    const effects: Effect = {}
    if (graduated) {
      effects.intelligence = 5
      effects.reputation = 8
      effects.happiness = 15
    }
    if (droppedOut) {
      effects.happiness = -10
      effects.mentalHealth = -5
    }

    const message = graduated
      ? `Hai completato ${LEVEL_LABELS[edu.currentLevel]}! 🎓`
      : droppedOut
      ? `Hai abbandonato ${LEVEL_LABELS[edu.currentLevel]}. GPA troppo basso.`
      : ''

    return { gpaDelta, graduated, droppedOut, message, effects }
  }
}
