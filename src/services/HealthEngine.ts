import type { GameState, Effect, Disease } from '../store/types'

export interface HealthActionResult {
  success: boolean
  message: string
  effects: Effect
  newDisease?: Disease
  diseaseCured?: string
}

// ---- disease pool ----

type DiseaseTemplate = {
  id: string
  name: string
  severity: 1 | 2 | 3 | 4 | 5
  curable: boolean
  treatmentCost: number
  ageMin: number
  ageMax: number
  healthThreshold: number // only triggers if health < this
  chronic: boolean
  baseChance: number
  effects: Effect      // per-year untreated effects
}

const DISEASE_POOL: DiseaseTemplate[] = [
  { id: 'flu', name: 'Influenza', severity: 1, curable: true, treatmentCost: 50, ageMin: 0, ageMax: 99, healthThreshold: 80, chronic: false, baseChance: 0.15, effects: { health: -5, energy: -10 } },
  { id: 'cold', name: 'Raffreddore cronico', severity: 1, curable: true, treatmentCost: 30, ageMin: 0, ageMax: 99, healthThreshold: 90, chronic: false, baseChance: 0.20, effects: { health: -3, energy: -5 } },
  { id: 'back_pain', name: 'Mal di schiena cronico', severity: 2, curable: false, treatmentCost: 200, ageMin: 30, ageMax: 99, healthThreshold: 90, chronic: true, baseChance: 0.08, effects: { health: -3, energy: -8, happiness: -5 } },
  { id: 'diabetes', name: 'Diabete', severity: 3, curable: false, treatmentCost: 800, ageMin: 35, ageMax: 99, healthThreshold: 70, chronic: true, baseChance: 0.04, effects: { health: -5, energy: -8 } },
  { id: 'hypertension', name: 'Ipertensione', severity: 2, curable: false, treatmentCost: 400, ageMin: 40, ageMax: 99, healthThreshold: 80, chronic: true, baseChance: 0.06, effects: { health: -4, energy: -5 } },
  { id: 'depression', name: 'Depressione', severity: 3, curable: true, treatmentCost: 1500, ageMin: 15, ageMax: 99, healthThreshold: 90, chronic: false, baseChance: 0.05, effects: { mentalHealth: -10, happiness: -8, energy: -10 } },
  { id: 'anxiety', name: 'Disturbo d\'ansia', severity: 2, curable: true, treatmentCost: 1000, ageMin: 15, ageMax: 99, healthThreshold: 90, chronic: false, baseChance: 0.07, effects: { mentalHealth: -8, happiness: -5, energy: -5 } },
  { id: 'heart_disease', name: 'Cardiopatia', severity: 4, curable: false, treatmentCost: 5000, ageMin: 50, ageMax: 99, healthThreshold: 70, chronic: true, baseChance: 0.03, effects: { health: -8, energy: -12 } },
  { id: 'cancer', name: 'Cancro', severity: 5, curable: true, treatmentCost: 20000, ageMin: 40, ageMax: 99, healthThreshold: 80, chronic: false, baseChance: 0.015, effects: { health: -15, energy: -20, happiness: -15 } },
  { id: 'stroke', name: 'Ictus', severity: 4, curable: true, treatmentCost: 8000, ageMin: 55, ageMax: 99, healthThreshold: 70, chronic: false, baseChance: 0.02, effects: { health: -20, energy: -25, happiness: -20 } },
]

// ---- engine ----

export class HealthEngine {
  /**
   * Annual health tick — called inside handleInvecchia.
   * Returns effects for age decay and disease progression.
   */
  static annualTick(state: GameState): { effects: Effect; newDisease: Disease | null; messages: string[] } {
    const effects: Effect = {}
    const messages: string[] = []

    // 1. Age-based health decay (accelerates after 50)
    const age = state.time.age
    const ageDecay = age < 30 ? 0.5
      : age < 50 ? 1.0
      : age < 65 ? 1.5 + (age - 50) * 0.05
      : 2.0 + (age - 65) * 0.1
    effects.health = -ageDecay

    // 2. Lifestyle modifiers
    const { health } = state
    effects.health += health.fitnessLevel > 60 ? 0.5 : 0
    effects.health -= health.addictions.reduce((s, a) => s + a.level / 200, 0)

    // 3. Mental health natural recovery/decay
    const stressFromJob = state.career.currentJob ? state.career.currentJob.stressLevel / 100 : 0
    effects.mentalHealth = state.stats.mentalHealth < 50 ? 2 : -stressFromJob

    // 4. Existing disease progression
    for (const disease of health.diseases) {
      if (disease.isTreated) continue
      const template = DISEASE_POOL.find(t => t.id === disease.id)
      if (!template) continue
      for (const [k, v] of Object.entries(template.effects)) {
        effects[k] = (effects[k] ?? 0) + v
      }
      if (disease.severity >= 4 && !disease.isTreated) {
        messages.push(`⚠️ ${disease.name} non trattata sta peggiorando!`)
      }
    }

    // 5. Random new disease
    let newDisease: Disease | null = null
    const eligible = DISEASE_POOL.filter(t => {
      if (age < t.ageMin || age > t.ageMax) return false
      if (state.stats.health > t.healthThreshold) return false
      if (health.diseases.some(d => d.id === t.id)) return false
      return true
    })

    for (const template of eligible) {
      let chance = template.baseChance
      if (health.addictions.length > 0) chance *= 1.3
      if (health.fitnessLevel < 30) chance *= 1.2
      if (Math.random() < chance) {
        newDisease = {
          id: template.id,
          name: template.name,
          severity: template.severity,
          curable: template.curable,
          treatmentCost: template.treatmentCost,
          yearContracted: state.time.year,
          isTreated: false,
          chronic: template.chronic,
        }
        messages.push(`🤒 Hai contratto: ${template.name}`)
        break // one disease per year max
      }
    }

    return { effects, newDisease, messages }
  }

  static treatDisease(diseaseId: string, state: GameState): HealthActionResult {
    const disease = state.health.diseases.find(d => d.id === diseaseId)
    if (!disease) return { success: false, message: 'Malattia non trovata.', effects: {} }
    if (disease.isTreated) return { success: false, message: 'Questa malattia è già in trattamento.', effects: {} }

    if (state.finance.money < disease.treatmentCost) {
      return {
        success: false,
        message: `Non hai i soldi per la cura di ${disease.name} (€${disease.treatmentCost.toLocaleString('it-IT')}).`,
        effects: {},
      }
    }

    const cureSuccess = disease.curable ? Math.random() < 0.80 : false

    if (cureSuccess) {
      return {
        success: true,
        message: `${disease.name} guarita con successo! 🏥`,
        effects: { health: 15, money: -disease.treatmentCost, happiness: 8 },
        diseaseCured: diseaseId,
      }
    }

    // Treated but not cured (chronic diseases): reduces progression
    return {
      success: true,
      message: `${disease.name} sotto controllo medico. Non guarisce completamente ma progredisce più lentamente.`,
      effects: { health: 5, money: -disease.treatmentCost },
    }
  }

  static medicalCheck(state: GameState): HealthActionResult {
    const cost = state.nation?.healthcarePublic ? 0 : 120
    if (state.finance.money < cost && cost > 0) {
      return { success: false, message: `Non hai i fondi per la visita (€${cost}).`, effects: {} }
    }

    const effects: Effect = { money: -cost, health: 5 }

    // Detect undiagnosed disease
    const undiagnosed = DISEASE_POOL.find(t =>
      state.time.age >= t.ageMin &&
      !state.health.diseases.some(d => d.id === t.id) &&
      state.stats.health < 70 &&
      Math.random() < t.baseChance * 2
    )

    if (undiagnosed) {
      const newDisease: Disease = {
        id: undiagnosed.id,
        name: undiagnosed.name,
        severity: undiagnosed.severity,
        curable: undiagnosed.curable,
        treatmentCost: undiagnosed.treatmentCost,
        yearContracted: state.time.year,
        isTreated: false,
        chronic: undiagnosed.chronic,
      }
      return {
        success: true,
        message: `Visita medica completata. Il medico ha rilevato: ${undiagnosed.name}.`,
        effects,
        newDisease,
      }
    }

    return {
      success: true,
      message: `Visita medica: tutto nella norma. ${cost > 0 ? `Costo: €${cost}.` : 'SSN gratuito.'}`,
      effects,
    }
  }

  static exercise(state: GameState): HealthActionResult {
    const key = `exercise_${state.time.year}`
    const uses = state.diminishingReturns[key] ?? 0

    if (uses >= 4) {
      return {
        success: false,
        message: 'Hai già fatto molto sport quest\'anno. Il tuo corpo ha bisogno di riposo.',
        effects: { energy: -5 },
      }
    }

    const dr = Math.max(0.4, 1 - uses * 0.15)
    const healthGain = Math.round(5 * dr)
    const fitnessGain = Math.round(8 * dr)

    return {
      success: true,
      message: `Allenamento completato! +${healthGain} salute, +${fitnessGain} fitness.`,
      effects: { health: healthGain, energy: -10, happiness: 4, mentalHealth: 3 },
    }
  }
}
