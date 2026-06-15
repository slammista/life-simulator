import type { GameState, Effect, Sport, SportCategory } from '../store/types'

// =============================================================================
// SportEngine — dedicated system for athletic disciplines, separate from hobbies.
//
// Designed to be easily extended in the future with:
//   - skill levels & training plans      (skillLevel, practiceHoursPerWeek already present)
//   - competitions & championships       (competitionsEntered / competitionsWon)
//   - prizes & sport fame                (fame, prizeMoney scaffolding)
//   - injuries                           (injuryRisk on the def, injuries on the instance)
//   - professional careers               (proPotential on the def, isProfessional on the instance)
//
// For now it mirrors the hobby loop (start / practice / annual decay) while
// exposing the richer data model so the extra systems can be layered on later
// without migrations.
// =============================================================================

export interface SportDef {
  id: string
  name: string
  emoji: string
  category: SportCategory
  costToStart: number          // equipment / sign-up
  annualCost: number           // membership / club fees
  weeklyHours: number
  minAge: number               // youngest realistic starting age
  statBenefits: Effect
  decayPerYear: number
  injuryRisk: number           // 0..1 — reserved for the future injury system
  proPotential: number         // 0..1 — likelihood of a professional path later
  packId: string
}

const SPORT_DEFS: SportDef[] = [
  // --- Team sports ---
  { id: 'calcio',       name: 'Calcio',            emoji: '⚽', category: 'team',       costToStart: 120, annualCost: 300, weeklyHours: 4, minAge: 5,  statBenefits: { health: 8, energy: 5, socialReputation: 4, happiness: 5 }, decayPerYear: 7, injuryRisk: 0.18, proPotential: 0.30, packId: 'base' },
  { id: 'basket',       name: 'Basket',            emoji: '🏀', category: 'team',       costToStart: 100, annualCost: 280, weeklyHours: 4, minAge: 6,  statBenefits: { health: 8, energy: 5, looks: 2, socialReputation: 3 }, decayPerYear: 7, injuryRisk: 0.16, proPotential: 0.25, packId: 'base' },
  { id: 'pallavolo',    name: 'Pallavolo',         emoji: '🏐', category: 'team',       costToStart: 90,  annualCost: 260, weeklyHours: 3, minAge: 7,  statBenefits: { health: 7, energy: 4, socialReputation: 4 }, decayPerYear: 6, injuryRisk: 0.12, proPotential: 0.20, packId: 'base' },
  { id: 'rugby',        name: 'Rugby',             emoji: '🏉', category: 'team',       costToStart: 130, annualCost: 320, weeklyHours: 4, minAge: 8,  statBenefits: { health: 9, energy: 4, reputation: 3 }, decayPerYear: 8, injuryRisk: 0.30, proPotential: 0.18, packId: 'base' },
  { id: 'baseball',     name: 'Baseball',          emoji: '⚾', category: 'team',       costToStart: 140, annualCost: 280, weeklyHours: 3, minAge: 7,  statBenefits: { health: 6, energy: 4, socialReputation: 3 }, decayPerYear: 6, injuryRisk: 0.14, proPotential: 0.15, packId: 'base' },
  { id: 'hockey',       name: 'Hockey',            emoji: '🏒', category: 'team',       costToStart: 220, annualCost: 420, weeklyHours: 4, minAge: 7,  statBenefits: { health: 8, energy: 5, reputation: 3 }, decayPerYear: 8, injuryRisk: 0.28, proPotential: 0.16, packId: 'base' },

  // --- Individual sports ---
  { id: 'nuoto',        name: 'Nuoto',             emoji: '🏊', category: 'water',      costToStart: 60,  annualCost: 480, weeklyHours: 3, minAge: 4,  statBenefits: { health: 10, energy: 6, looks: 3 }, decayPerYear: 6, injuryRisk: 0.08, proPotential: 0.22, packId: 'base' },
  { id: 'atletica',     name: 'Atletica leggera',  emoji: '🏃', category: 'individual', costToStart: 80,  annualCost: 180, weeklyHours: 3, minAge: 6,  statBenefits: { health: 9, energy: 6, looks: 3, mentalHealth: 3 }, decayPerYear: 6, injuryRisk: 0.15, proPotential: 0.22, packId: 'base' },
  { id: 'ginnastica',   name: 'Ginnastica',        emoji: '🤸', category: 'individual', costToStart: 90,  annualCost: 360, weeklyHours: 4, minAge: 4,  statBenefits: { health: 8, looks: 5, energy: 4 }, decayPerYear: 8, injuryRisk: 0.22, proPotential: 0.20, packId: 'base' },
  { id: 'ciclismo',     name: 'Ciclismo',          emoji: '🚴', category: 'individual', costToStart: 600, annualCost: 200, weeklyHours: 4, minAge: 8,  statBenefits: { health: 9, energy: 5, mentalHealth: 3 }, decayPerYear: 6, injuryRisk: 0.20, proPotential: 0.18, packId: 'base' },
  { id: 'equitazione',  name: 'Equitazione',       emoji: '🏇', category: 'individual', costToStart: 400, annualCost: 1200, weeklyHours: 3, minAge: 7, statBenefits: { health: 5, happiness: 6, socialReputation: 5 }, decayPerYear: 5, injuryRisk: 0.24, proPotential: 0.12, packId: 'base' },
  { id: 'golf',         name: 'Golf',              emoji: '⛳', category: 'individual', costToStart: 500, annualCost: 900, weeklyHours: 3, minAge: 8,  statBenefits: { happiness: 5, socialReputation: 6, mentalHealth: 3 }, decayPerYear: 4, injuryRisk: 0.06, proPotential: 0.14, packId: 'base' },
  { id: 'arrampicata',  name: 'Arrampicata sportiva', emoji: '🧗', category: 'extreme',  costToStart: 200, annualCost: 360, weeklyHours: 3, minAge: 8, statBenefits: { health: 8, energy: 4, mentalHealth: 5 }, decayPerYear: 7, injuryRisk: 0.26, proPotential: 0.15, packId: 'base' },

  // --- Combat sports ---
  { id: 'arti_marziali', name: 'Arti marziali',    emoji: '🥋', category: 'combat',     costToStart: 150, annualCost: 600, weeklyHours: 4, minAge: 5,  statBenefits: { health: 8, energy: 4, reputation: 3, mentalHealth: 5 }, decayPerYear: 8, injuryRisk: 0.20, proPotential: 0.18, packId: 'base' },
  { id: 'judo',         name: 'Judo',              emoji: '🥋', category: 'combat',     costToStart: 120, annualCost: 480, weeklyHours: 3, minAge: 5,  statBenefits: { health: 7, energy: 4, discipline: 3, mentalHealth: 4 }, decayPerYear: 7, injuryRisk: 0.20, proPotential: 0.18, packId: 'base' },
  { id: 'karate',       name: 'Karate',            emoji: '🥋', category: 'combat',     costToStart: 110, annualCost: 460, weeklyHours: 3, minAge: 5,  statBenefits: { health: 7, energy: 4, reputation: 3, mentalHealth: 4 }, decayPerYear: 7, injuryRisk: 0.18, proPotential: 0.16, packId: 'base' },
  { id: 'taekwondo',    name: 'Taekwondo',         emoji: '🥋', category: 'combat',     costToStart: 110, annualCost: 460, weeklyHours: 3, minAge: 5,  statBenefits: { health: 7, energy: 5, reputation: 3 }, decayPerYear: 7, injuryRisk: 0.20, proPotential: 0.16, packId: 'base' },
  { id: 'boxe',         name: 'Boxe',              emoji: '🥊', category: 'combat',     costToStart: 130, annualCost: 540, weeklyHours: 4, minAge: 10, statBenefits: { health: 8, energy: 5, reputation: 4 }, decayPerYear: 9, injuryRisk: 0.34, proPotential: 0.20, packId: 'base' },
  { id: 'mma',          name: 'MMA',               emoji: '🥊', category: 'combat',     costToStart: 180, annualCost: 720, weeklyHours: 5, minAge: 14, statBenefits: { health: 9, energy: 5, reputation: 5 }, decayPerYear: 10, injuryRisk: 0.40, proPotential: 0.22, packId: 'base' },
  { id: 'scherma',      name: 'Scherma',           emoji: '🤺', category: 'combat',     costToStart: 250, annualCost: 600, weeklyHours: 3, minAge: 7,  statBenefits: { health: 5, energy: 3, mentalHealth: 4, socialReputation: 4 }, decayPerYear: 6, injuryRisk: 0.12, proPotential: 0.14, packId: 'base' },

  // --- Racket sports ---
  { id: 'tennis',       name: 'Tennis',            emoji: '🎾', category: 'racket',     costToStart: 200, annualCost: 700, weeklyHours: 3, minAge: 6,  statBenefits: { health: 8, energy: 5, looks: 2, socialReputation: 4 }, decayPerYear: 6, injuryRisk: 0.16, proPotential: 0.24, packId: 'base' },
  { id: 'badminton',    name: 'Badminton',         emoji: '🏸', category: 'racket',     costToStart: 70,  annualCost: 220, weeklyHours: 2, minAge: 7,  statBenefits: { health: 6, energy: 4 }, decayPerYear: 5, injuryRisk: 0.10, proPotential: 0.12, packId: 'base' },
  { id: 'ping_pong',    name: 'Ping Pong',         emoji: '🏓', category: 'racket',     costToStart: 50,  annualCost: 120, weeklyHours: 2, minAge: 6,  statBenefits: { health: 4, energy: 3, intelligence: 2 }, decayPerYear: 4, injuryRisk: 0.05, proPotential: 0.10, packId: 'base' },

  // --- Winter sports ---
  { id: 'sci',          name: 'Sci',               emoji: '⛷️', category: 'winter',     costToStart: 500, annualCost: 800, weeklyHours: 2, minAge: 6,  statBenefits: { health: 7, energy: 4, happiness: 6 }, decayPerYear: 7, injuryRisk: 0.28, proPotential: 0.16, packId: 'base' },
  { id: 'snowboard',    name: 'Snowboard',         emoji: '🏂', category: 'winter',     costToStart: 450, annualCost: 750, weeklyHours: 2, minAge: 8,  statBenefits: { health: 7, energy: 4, happiness: 6, socialReputation: 3 }, decayPerYear: 7, injuryRisk: 0.30, proPotential: 0.15, packId: 'base' },
  { id: 'pattinaggio',  name: 'Pattinaggio',       emoji: '⛸️', category: 'winter',     costToStart: 150, annualCost: 480, weeklyHours: 3, minAge: 5,  statBenefits: { health: 6, looks: 4, energy: 4, happiness: 4 }, decayPerYear: 6, injuryRisk: 0.18, proPotential: 0.14, packId: 'base' },

  // --- Water / board sports ---
  { id: 'surf',         name: 'Surf',              emoji: '🏄', category: 'water',      costToStart: 350, annualCost: 300, weeklyHours: 3, minAge: 10, statBenefits: { health: 8, energy: 5, happiness: 7, looks: 3 }, decayPerYear: 7, injuryRisk: 0.22, proPotential: 0.14, packId: 'base' },
]

export function getSportDef(id: string): SportDef | undefined {
  return SPORT_DEFS.find(s => s.id === id)
}

export function getAllSportDefs(): SportDef[] {
  return SPORT_DEFS
}

export interface SportActionResult {
  success: boolean
  message: string
  effects: Effect
  skillGain?: number
  newSport?: Sport
}

export class SportEngine {
  /** Start practising a new sport. Cost handling (incl. minor approval) is done by the store. */
  static startSport(sportId: string, state: GameState): SportActionResult {
    const def = getSportDef(sportId)
    if (!def) return { success: false, message: 'Sport non trovato.', effects: {} }
    if (state.sports?.some(s => s.id === sportId)) {
      return { success: false, message: `Pratichi già ${def.name}.`, effects: {} }
    }
    if (state.time.age < def.minAge) {
      return { success: false, message: `${def.name} si può iniziare da ${def.minAge} anni.`, effects: {} }
    }

    const newSport: Sport = {
      id: sportId,
      name: def.name,
      skillLevel: 5,
      practiceHoursPerWeek: def.weeklyHours,
      yearStarted: state.time.year,
      competitionsEntered: 0,
      competitionsWon: 0,
      injuries: 0,
      isProfessional: false,
      fame: 0,
      packId: def.packId,
    }

    return {
      success: true,
      message: `Ti sei iscritto a ${def.name}! ${def.emoji}`,
      effects: { money: -def.costToStart, happiness: 5, energy: -5 },
      skillGain: 5,
      newSport,
    }
  }

  /** Practise / train an owned sport. */
  static practiceSport(sportId: string, state: GameState): SportActionResult {
    const sport = state.sports?.find(s => s.id === sportId)
    if (!sport) return { success: false, message: 'Non pratichi questo sport.', effects: {} }
    const def = getSportDef(sportId)
    if (!def) return { success: false, message: 'Dati sport non trovati.', effects: {} }

    const key = `sport_${sportId}_${state.time.year}`
    const uses = state.diminishingReturns[key] ?? 0
    if (uses >= 4) {
      return {
        success: false,
        message: `Hai già allenato ${def.name} molto quest'anno.`,
        effects: { energy: -3 },
      }
    }

    const dr = Math.max(0.35, 1 - uses * 0.15)
    const gain = Math.max(1, Math.round(8 * dr * (state.stats.energy / 100 + 0.5)))
    const effects: Effect = { energy: -10, money: -(def.annualCost / 4) }
    for (const [k, v] of Object.entries(def.statBenefits)) {
      effects[k] = (effects[k] ?? 0) + Math.round(v * dr * 0.5)
    }

    return {
      success: true,
      message: `Allenamento di ${def.name} completato! +${gain} abilità. ${def.emoji}`,
      effects,
      skillGain: gain,
    }
  }

  /** Annual maintenance: skill growth if trained, decay otherwise. Also tracks youth exp and injuries. */
  static annualTick(state: GameState): {
    effects: Effect
    updates: Array<{
      id: string
      skillDelta: number
      youthExpDelta?: number
      injuryEvent?: { severity: 'minor' | 'moderate' | 'severe'; skillLoss: number; message: string }
      injuryCleared?: boolean
    }>
    injuryMessages: string[]
  } {
    const effects: Effect = {}
    const updates: Array<{
      id: string
      skillDelta: number
      youthExpDelta?: number
      injuryEvent?: { severity: 'minor' | 'moderate' | 'severe'; skillLoss: number; message: string }
      injuryCleared?: boolean
    }> = []
    const injuryMessages: string[] = []

    for (const sport of state.sports ?? []) {
      const def = getSportDef(sport.id)
      if (!def) continue

      const practiceKey = `sport_${sport.id}_${state.time.year}`
      const practiceCount = state.diminishingReturns[practiceKey] ?? 0
      const practiced = practiceCount > 0

      // Clear injury if recovery year passed
      let injuryCleared = false
      if (sport.currentInjury && sport.injuryRecoveryYear && state.time.year >= sport.injuryRecoveryYear) {
        injuryCleared = true
        injuryMessages.push(`${def.emoji} Sei guarito/a dall'infortunio a ${def.name}. Pronto/a a tornare in pista!`)
      }

      // Skill delta (halved if currently injured)
      const injured = sport.currentInjury && !injuryCleared
      let skillDelta = practiced
        ? Math.max(0, Math.round(5 * state.stats.energy / 100))
        : -def.decayPerYear
      if (injured) skillDelta = Math.min(skillDelta, -2)

      // Youth experience accumulation (age 10-18)
      let youthExpDelta: number | undefined
      if (state.time.age >= 10 && state.time.age < 18 && practiced) {
        youthExpDelta = 1
      }

      // Injury risk calculation (only if not already injured)
      let injuryEvent: { severity: 'minor' | 'moderate' | 'severe'; skillLoss: number; message: string } | undefined
      if (!sport.currentInjury || injuryCleared) {
        const age = state.time.age
        // Age factor: risk rises past sport prime end (approximated as 31 default)
        const ageFactor = Math.max(0, (age - 30) * 0.04)
        const overtrainingFactor = practiceCount >= 4 ? 0.15 : 0
        const healthFactor = ((100 - state.stats.health) / 100) * 0.25
        const rawRisk = def.injuryRisk * (1 + ageFactor + overtrainingFactor + healthFactor)
        const injuryRisk = Math.min(0.75, rawRisk)

        if (Math.random() < injuryRisk) {
          const roll = Math.random()
          if (roll < 0.5) {
            injuryEvent = {
              severity: 'minor',
              skillLoss: 5,
              message: `🤕 Piccolo infortunio durante l'allenamento di ${def.name}. Qualche settimana di riposo.`,
            }
          } else if (roll < 0.85) {
            injuryEvent = {
              severity: 'moderate',
              skillLoss: 12,
              message: `🏥 Infortunio moderato in ${def.name}. Salterai parte della stagione.`,
            }
          } else {
            injuryEvent = {
              severity: 'severe',
              skillLoss: 25,
              message: `🚨 Grave infortunio in ${def.name}! Stagione compromessa — possibile impatto sulla carriera.`,
            }
          }
          injuryMessages.push(injuryEvent.message)
        }
      }

      updates.push({ id: sport.id, skillDelta, youthExpDelta, injuryEvent, injuryCleared })
    }

    return { effects, updates, injuryMessages }
  }
}
