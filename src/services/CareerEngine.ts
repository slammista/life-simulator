import type { GameState, Effect, Job, ContractType } from '../store/types'
import db from '../../public/db.json'

// ---- types ----

export type DBJob = {
  id: string
  title: string
  category: string
  contractType: string
  salaryMin: number
  salaryMax: number
  stressLevel: number
  promotionChance: number
  requirements: {
    education: string
    minAge: number
    maxAge: number
    minReputation: number
    cleanRecord: boolean
    licenses: string[]
  }
  effects: Record<string, number>
  packId: string
}

export interface CareerActionResult {
  success: boolean
  message: string
  effects: Effect
  newJob?: Job
  salaryIncrease?: number
}

// ---- helpers ----

const EDU_HIERARCHY = [
  'none', 'kindergarten', 'elementary', 'middle',
  'highschool', 'vocational', 'bachelor', 'master',
  'phd', 'mba', 'medical', 'law',
]

const CONTRACT_LABELS: Record<string, string> = {
  unemployed: 'Disoccupato',
  student: 'Studente',
  part_time: 'Part-time',
  full_time: 'Tempo pieno',
  freelance: 'Freelance',
  business_owner: 'Imprenditore',
  retired: 'Pensionato',
}

export function getContractLabel(type: string): string {
  return CONTRACT_LABELS[type] ?? type
}

export function getAllJobs(): DBJob[] {
  return db.jobs as unknown as DBJob[]
}

// ---- engine ----

export class CareerEngine {
  static meetsRequirements(jobDef: DBJob, state: GameState): boolean {
    const req = jobDef.requirements
    const { time, education, stats, criminal, career } = state

    if (time.age < req.minAge || time.age > req.maxAge) return false
    if (req.cleanRecord && criminal.hasRecord) return false
    if (stats.reputation < req.minReputation) return false

    const playerMaxEdu = education.completedLevels.length
      ? Math.max(...education.completedLevels.map(l => EDU_HIERARCHY.indexOf(l)))
      : 0
    const reqEduIdx = EDU_HIERARCHY.indexOf(req.education)
    if (reqEduIdx > playerMaxEdu) return false

    for (const lic of req.licenses) {
      if (!career.licenses.includes(lic)) return false
    }

    return true
  }

  static getAvailableJobs(state: GameState): DBJob[] {
    return getAllJobs().filter(j => this.meetsRequirements(j, state))
  }

  static applyForJob(jobId: string, state: GameState): CareerActionResult {
    const jobDef = getAllJobs().find(j => j.id === jobId)
    if (!jobDef) return { success: false, message: 'Lavoro non trovato.', effects: {} }

    if (!this.meetsRequirements(jobDef, state)) {
      return { success: false, message: 'Non soddisfi i requisiti per questo lavoro.', effects: {} }
    }

    if (state.career.currentJob?.id === jobId) {
      return { success: false, message: 'Lavori già qui.', effects: {} }
    }

    // Hire chance based on stats
    const base = 0.45
      + (state.stats.reputation / 250)
      + (state.stats.intelligence / 250)
      + (state.stats.looks / 500)
    const chance = Math.min(0.92, base)
    const hired = Math.random() < chance

    if (!hired) {
      return {
        success: false,
        message: `Non sei stato selezionato per ${jobDef.title}. Riprova più tardi.`,
        effects: { happiness: -3, mentalHealth: -2 },
      }
    }

    const salary = Math.round(
      jobDef.salaryMin + Math.random() * (jobDef.salaryMax - jobDef.salaryMin)
    )

    const newJob: Job = {
      id: jobDef.id,
      title: jobDef.title,
      company: generateCompanyName(jobDef.category),
      salary,
      stressLevel: jobDef.stressLevel,
      contractType: jobDef.contractType as ContractType,
      startYear: state.time.year,
      promotionChance: jobDef.promotionChance,
      packId: jobDef.packId,
    }

    return {
      success: true,
      message: `Assunto come ${jobDef.title} a €${salary.toLocaleString('it-IT')}/mese!`,
      effects: { happiness: 12, reputation: 3, energy: -5 },
      newJob,
    }
  }

  static quitJob(state: GameState): CareerActionResult {
    if (!state.career.currentJob) {
      return { success: false, message: 'Non hai un lavoro da cui dimettersi.', effects: {} }
    }
    return {
      success: true,
      message: `Hai dato le dimissioni da ${state.career.currentJob.title}.`,
      effects: { happiness: 5, energy: 10, mentalHealth: 5 },
    }
  }

  static attemptPromotion(state: GameState): CareerActionResult {
    const job = state.career.currentJob
    if (!job) return { success: false, message: 'Non hai un lavoro.', effects: {}, salaryIncrease: 0 }

    // Anti-abuse: diminishing returns per anno
    const key = `promo_${state.time.year}`
    const attempts = state.diminishingReturns[key] ?? 0
    const dr = Math.pow(0.75, attempts)

    const base = job.promotionChance
      * dr
      * (1 + state.stats.intelligence / 300)
      * (1 + state.stats.reputation / 300)
    const success = Math.random() < Math.min(0.85, base)

    if (!success) {
      return {
        success: false,
        message: 'Il tuo capo non ti ha promosso quest\'anno. Continua a lavorare sodo.',
        effects: { happiness: -2, energy: -5 },
        salaryIncrease: 0,
      }
    }

    const increase = Math.round(job.salary * (0.10 + Math.random() * 0.15))
    return {
      success: true,
      message: `Sei stato promosso! Aumento: +€${increase.toLocaleString('it-IT')}/mese 🎉`,
      effects: { happiness: 18, reputation: 5, socialReputation: 4 },
      salaryIncrease: increase,
    }
  }

  /**
   * Annual career tick — returns effects to apply and optional firing.
   * Called inside handleInvecchia.
   */
  static annualTick(state: GameState): { effects: Effect; fired: boolean; fireMessage: string; burnoutDelta: number } {
    const job = state.career.currentJob
    if (!job) return { effects: {}, fired: false, fireMessage: '', burnoutDelta: 0 }

    const effects: Effect = {}

    // Tax on annual salary
    const taxRate = state.nation?.taxRate ?? 0.30
    const annualSalary = job.salary * 12
    effects.money = -(annualSalary * taxRate) // separate from monthly salary added in handleInvecchia

    // Stress → mental health
    effects.mentalHealth = -(job.stressLevel / 40)

    // Pension: 3% employer contribution, not deducted
    // Career stress energy cost
    effects.energy = -(job.stressLevel / 25)

    // Burnout delta
    const burnoutDelta = job.stressLevel > 70 ? 6 : job.stressLevel > 50 ? 3 : -2
    const newBurnout = (state.career.burnoutLevel ?? 0) + burnoutDelta

    if (newBurnout >= 100) {
      effects.mentalHealth = (effects.mentalHealth ?? 0) - 15
      effects.energy = (effects.energy ?? 0) - 20
      effects.happiness = -12
    }

    // Firing check
    const { fired, fireMessage } = this.checkFiring(state, newBurnout)

    return { effects, fired, fireMessage, burnoutDelta }
  }

  private static checkFiring(
    state: GameState,
    projectedBurnout: number
  ): { fired: boolean; fireMessage: string } {
    const job = state.career.currentJob!
    let chance = 0.03
    if (state.stats.energy < 20) chance += 0.05
    if (state.stats.reputation < 20) chance += 0.08
    if (projectedBurnout >= 100) chance += 0.15
    if (state.criminal.inPrison) return { fired: true, fireMessage: `Licenziato da ${job.title} per detenzione.` }

    if (Math.random() >= chance) return { fired: false, fireMessage: '' }

    const reasons = projectedBurnout >= 100
      ? 'Il burnout ha compromesso le tue prestazioni.'
      : state.stats.energy < 20
      ? 'Eri troppo esausto per lavorare bene.'
      : 'Le tue prestazioni erano insoddisfacenti.'

    return { fired: true, fireMessage: `Sei stato licenziato da ${job.title}. ${reasons}` }
  }
}

// ---- internal helpers ----

const COMPANY_NAMES: Record<string, string[]> = {
  retail: ['MegaStore', 'Supermercato Rossi', 'Market & Co.'],
  tech: ['TechSolutions Srl', 'Digital Hub', 'ByteWorks'],
  education: ['Istituto Verdi', 'Scuola Nazionale', 'Academy Plus'],
  medical: ['Clinica Sant\'Anna', 'Ospedale Centrale', 'MedGroup'],
  legal: ['Studio Legale Ferrari', 'Law & Partners', 'Avvocati Associati'],
  criminal: ['Organizzazione Ombra', 'Mercato Nero', 'Rete Illecita'],
  none: ['Libero Professionista'],
}

function generateCompanyName(category: string): string {
  const pool = COMPANY_NAMES[category] ?? COMPANY_NAMES.none
  return pool[Math.floor(Math.random() * pool.length)]
}
