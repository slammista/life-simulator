import type { GameState, Effect } from '../store/types'

export type RetirementType = 'early' | 'standard' | 'forced' | 'medical'
export type CognitiveStatus = 'sharp' | 'mild_impairment' | 'dementia' | 'severe_dementia'
export type SeniorLiving = 'own_home' | 'downsizing' | 'retirement_community' | 'assisted_living' | 'nursing_home' | 'with_children'

export interface SeniorCondition {
  id: string
  name: string
  emoji: string
  monthlyCost: number
  healthPenalty: number   // per year
  severity: 1 | 2 | 3
}

export interface RetirementState {
  isRetired: boolean
  retirementAge: number | null
  retirementType: RetirementType | null
  monthlyPension: number
  seniorConditions: SeniorCondition[]
  cognitiveStatus: CognitiveStatus
  livingArrangement: SeniorLiving
  hasMadeWill: boolean
  funeralPrePlanned: boolean
  alzheimersYear: number | null
  alzheimersStage: 'none' | 'mild' | 'moderate' | 'severe'
  volunteeringActive: boolean
}

export interface RetirementResult {
  success: boolean
  message: string
  effects: Effect
  updatedRetirement?: Partial<RetirementState>
  triggerDeath?: boolean
}

// Potential senior conditions with age-based onset probability
const SENIOR_CONDITIONS: Array<SeniorCondition & { onsetAge: number; probability: number }> = [
  { id: 'arthritis',     name: 'Artrite',            emoji: '🦴', monthlyCost: 300,  healthPenalty: 1, severity: 1, onsetAge: 60, probability: 0.15 },
  { id: 'hypertension',  name: 'Ipertensione',       emoji: '💔', monthlyCost: 120,  healthPenalty: 1, severity: 1, onsetAge: 55, probability: 0.12 },
  { id: 'diabetes',      name: 'Diabete Tipo 2',     emoji: '🩸', monthlyCost: 250,  healthPenalty: 2, severity: 2, onsetAge: 60, probability: 0.08 },
  { id: 'heart_disease', name: 'Malattia cardiaca',  emoji: '🫀', monthlyCost: 1200, healthPenalty: 3, severity: 3, onsetAge: 65, probability: 0.07 },
  { id: 'vision',        name: 'Problemi alla vista', emoji: '👁️', monthlyCost: 200,  healthPenalty: 1, severity: 1, onsetAge: 60, probability: 0.10 },
  { id: 'hearing',       name: 'Problemi udito',     emoji: '👂', monthlyCost: 350,  healthPenalty: 1, severity: 1, onsetAge: 65, probability: 0.09 },
  { id: 'dementia',      name: 'Demenza/Alzheimer',  emoji: '🧠', monthlyCost: 6000, healthPenalty: 5, severity: 3, onsetAge: 75, probability: 0.06 },
  { id: 'osteoporosis',  name: 'Osteoporosi',        emoji: '🦷', monthlyCost: 180,  healthPenalty: 1, severity: 1, onsetAge: 65, probability: 0.08 },
  { id: 'cancer',        name: 'Tumore (anziano)',   emoji: '🎗️', monthlyCost: 2000, healthPenalty: 4, severity: 3, onsetAge: 70, probability: 0.04 },
]

const LIVING_COSTS: Record<SeniorLiving, number> = {
  own_home: 200,
  downsizing: 1100,
  retirement_community: 3500,
  assisted_living: 6000,
  nursing_home: 9000,
  with_children: 0,
}

export function calculatePension(state: GameState): number {
  const yearsWorked = state.career.jobHistory.length > 0
    ? Math.min(40, state.career.jobHistory.reduce((sum, _j) => sum + 1, state.career.currentJob ? 1 : 0))
    : 0
  const avgSalary = state.career.currentJob?.salary ?? 2000
  const militaryBonus = state.military.pensionEligible ? 800 : 0
  const base = Math.round((avgSalary * 0.7) * (yearsWorked / 40) + militaryBonus)
  return Math.min(6000, Math.max(800, base))
}

export class RetirementEngine {
  static retire(type: RetirementType, state: GameState): RetirementResult {
    if (state.retirement.isRetired)
      return { success: false, message: 'Sei già in pensione.', effects: {} }

    const { time, career, finance } = state

    if (type === 'early') {
      if (time.age < 55)
        return { success: false, message: 'Il pensionamento anticipato (FIRE) richiede almeno 55 anni.', effects: {} }
      if (finance.money < 500000)
        return { success: false, message: 'Per il pensionamento anticipato servono almeno €500.000 risparmiati.', effects: {} }
    }

    if (type === 'standard') {
      if (time.age < 62)
        return { success: false, message: 'La pensione standard richiede almeno 62 anni.', effects: {} }
    }

    if (type === 'medical') {
      if (state.health.disabilities.length === 0 && state.health.diseases.filter(d => d.severity >= 4).length === 0)
        return { success: false, message: 'La pensione per invalidità richiede una disabilità certificata.', effects: {} }
    }

    const pension = calculatePension(state)
    const emoji = type === 'early' ? '🏖️' : type === 'medical' ? '🏥' : '🎗️'

    return {
      success: true,
      message: `${emoji} Pensionamento ${type === 'early' ? 'anticipato' : type === 'medical' ? 'per invalidità' : 'standard'} ottenuto! Pensione: €${pension.toLocaleString()}/mese.`,
      effects: { happiness: 20, energy: 15, mentalHealth: 10 },
      updatedRetirement: {
        isRetired: true,
        retirementAge: time.age,
        retirementType: type,
        monthlyPension: pension,
      },
    }
  }

  static makeWill(state: GameState): RetirementResult {
    if (state.retirement.hasMadeWill)
      return { success: false, message: 'Hai già fatto testamento.', effects: {} }
    if (state.time.age < 50)
      return { success: false, message: 'Il testamento si redige generalmente dai 50 anni.', effects: {} }
    const cost = 800
    if (state.finance.money < cost)
      return { success: false, message: `Servono €${cost} per il notaio.`, effects: {} }

    return {
      success: true,
      message: '📜 Testamento redatto e depositato dal notaio. I tuoi beni saranno trasmessi secondo i tuoi desideri.',
      effects: { money: -cost, karma: 5, mentalHealth: 5, happiness: 3 },
      updatedRetirement: { hasMadeWill: true },
    }
  }

  static prePlanFuneral(state: GameState): RetirementResult {
    if (state.retirement.funeralPrePlanned)
      return { success: false, message: 'Il funerale è già stato pianificato.', effects: {} }
    const cost = 8000
    if (state.finance.money < cost)
      return { success: false, message: `Servono €${cost} per pre-pianificare il funerale.`, effects: {} }

    return {
      success: true,
      message: '⚰️ Funerale pre-pianificato. I tuoi familiari non dovranno preoccuparsi nei momenti difficili.',
      effects: { money: -cost, karma: 8, mentalHealth: 8, happiness: 5 },
      updatedRetirement: { funeralPrePlanned: true },
    }
  }

  static doVolunteering(state: GameState): RetirementResult {
    if (!state.retirement.isRetired)
      return { success: false, message: 'Il volontariato post-pensionamento richiede di essere in pensione.', effects: {} }
    const key = `volunteer_${state.time.year}`
    if ((state.diminishingReturns[key] ?? 0) >= 3)
      return { success: false, message: 'Hai già svolto abbastanza volontariato quest\'anno.', effects: {} }

    return {
      success: true,
      message: '🤝 Hai trascorso del tempo a fare volontariato. Senso di scopo ritrovato.',
      effects: { happiness: 10, karma: 8, mentalHealth: 8, socialReputation: 5 },
      updatedRetirement: { volunteeringActive: true },
    }
  }

  static changeLiving(arrangement: SeniorLiving, state: GameState): RetirementResult {
    if (state.retirement.livingArrangement === arrangement)
      return { success: false, message: 'Abiti già in questa sistemazione.', effects: {} }
    if (arrangement === 'nursing_home' && state.time.age < 70)
      return { success: false, message: 'La casa di cura è per persone di età avanzata (70+) con condizioni gravi.', effects: {} }

    const emoji: Record<SeniorLiving, string> = {
      own_home: '🏠', downsizing: '🏢', retirement_community: '🏘️',
      assisted_living: '🏥', nursing_home: '🏨', with_children: '👨‍👩‍👧‍👦',
    }
    const name: Record<SeniorLiving, string> = {
      own_home: 'Casa propria', downsizing: 'Casa più piccola',
      retirement_community: 'Comunità senior', assisted_living: 'Assistenza residenziale',
      nursing_home: 'Casa di cura', with_children: 'Con i figli',
    }

    const happinessChange = arrangement === 'with_children' ? 10
      : arrangement === 'retirement_community' ? 5
      : arrangement === 'nursing_home' ? -10 : 0

    return {
      success: true,
      message: `${emoji[arrangement]} Ti sei trasferito/a in: ${name[arrangement]}. Costo mensile: €${LIVING_COSTS[arrangement].toLocaleString()}.`,
      effects: { happiness: happinessChange },
      updatedRetirement: { livingArrangement: arrangement },
    }
  }

  static annualTick(state: GameState): { effects: Effect; updatedRetirement: Partial<RetirementState>; newConditions: SeniorCondition[] } {
    const { retirement, time, health } = state
    const effects: Effect = {}
    const updates: Partial<RetirementState> = {}
    const newConditions: SeniorCondition[] = []

    // Pension income
    if (retirement.isRetired && retirement.monthlyPension > 0) {
      effects.money = (effects.money ?? 0) + retirement.monthlyPension * 12
    }

    // Senior living costs
    if (time.age >= 65) {
      const livingCost = LIVING_COSTS[retirement.livingArrangement]
      if (livingCost > 0) effects.money = (effects.money ?? 0) - livingCost * 12
    }

    // Senior conditions cost
    const conditionCosts = retirement.seniorConditions.reduce((sum, c) => sum + c.monthlyCost, 0)
    if (conditionCosts > 0) effects.money = (effects.money ?? 0) - conditionCosts * 12

    // Annual health penalty from conditions
    const healthPenalty = retirement.seniorConditions.reduce((sum, c) => sum + c.healthPenalty, 0)
    if (healthPenalty > 0) effects.health = (effects.health ?? 0) - healthPenalty

    // Random new senior conditions
    if (time.age >= 55) {
      for (const cond of SENIOR_CONDITIONS) {
        if (time.age < cond.onsetAge) continue
        if (retirement.seniorConditions.some(c => c.id === cond.id)) continue
        if (cond.id === 'dementia' && retirement.alzheimersStage !== 'none') continue

        // Weighted by health
        const healthFactor = (100 - health.fitnessLevel) / 100
        const chance = cond.probability * healthFactor * (time.age >= 75 ? 1.5 : 1)
        if (Math.random() < chance) {
          newConditions.push(cond)
          if (cond.id === 'dementia') {
            updates.alzheimersYear = time.year
            updates.alzheimersStage = 'mild'
            updates.cognitiveStatus = 'mild_impairment'
          }
        }
      }
    }

    // Alzheimer progression
    if (retirement.alzheimersStage !== 'none' && retirement.alzheimersYear != null) {
      const yearsWithAlz = time.year - retirement.alzheimersYear
      if (yearsWithAlz >= 7 && retirement.alzheimersStage === 'moderate') {
        updates.alzheimersStage = 'severe'
        updates.cognitiveStatus = 'severe_dementia'
        effects.mentalHealth = (effects.mentalHealth ?? 0) - 15
        effects.happiness = (effects.happiness ?? 0) - 10
      } else if (yearsWithAlz >= 3 && retirement.alzheimersStage === 'mild') {
        updates.alzheimersStage = 'moderate'
        updates.cognitiveStatus = 'dementia'
        effects.mentalHealth = (effects.mentalHealth ?? 0) - 10
        effects.happiness = (effects.happiness ?? 0) - 8
      }
    }

    // Forced retirement at 75
    if (!retirement.isRetired && time.age >= 75) {
      updates.isRetired = true
      updates.retirementAge = time.age
      updates.retirementType = 'forced'
      updates.monthlyPension = Math.max(800, calculatePension(state) * 0.8)
    }

    return { effects, updatedRetirement: updates, newConditions }
  }
}
