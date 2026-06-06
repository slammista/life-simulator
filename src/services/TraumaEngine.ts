import type { Effect, GameState, Relationship, TraumaEvent, TraumaType } from '../store/types'
import type { NPCAction } from './RelationshipEngine'

export interface TraumaActionResult {
  trauma: TraumaEvent | null
  effects: Effect
  message: string | null
}

export interface TraumaAnnualResult {
  updatedTraumas: TraumaEvent[]
  effects: Effect
  messages: string[]
  ptsd: boolean
}

export interface TherapyResult {
  success: boolean
  message: string
  effects: Effect
  updatedTraumas?: TraumaEvent[]
  resilienceGain?: number
}

const uid = () => `trauma_${Math.random().toString(36).slice(2, 10)}`

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function makeTrauma(params: {
  type: TraumaType
  source: string
  description: string
  year: number
  severity: number
  resilience: number
  triggers: string[]
}): TraumaEvent {
  const mitigated = Math.round(params.severity * 12 * (1 - params.resilience / 180))
  return {
    id: uid(),
    type: params.type,
    source: params.source,
    description: params.description,
    year: params.year,
    severity: params.severity,
    intensity: clamp(35 + mitigated, 20, 100),
    triggers: params.triggers,
    resolved: false,
  }
}

export class TraumaEngine {
  static fromRelationshipAction(action: NPCAction, rel: Relationship, state: GameState): TraumaActionResult {
    const base: TraumaActionResult = { trauma: null, effects: {}, message: null }
    const resilience = state.health.resilience ?? 0

    if (action === 'break_up') {
      const trauma = makeTrauma({
        type: 'grief',
        source: rel.id,
        description: `Rottura con ${rel.name}`,
        year: state.time.year,
        severity: rel.love >= 70 ? 4 : 3,
        resilience,
        triggers: ['relationship', 'abandonment'],
      })
      return { trauma, effects: { mentalHealth: -6, happiness: -5 }, message: `La rottura con ${rel.name} lascia una ferita emotiva.` }
    }

    if (action === 'divorce') {
      const trauma = makeTrauma({
        type: 'divorce',
        source: rel.id,
        description: `Divorzio da ${rel.name}`,
        year: state.time.year,
        severity: 5,
        resilience,
        triggers: ['relationship', 'family', 'legal'],
      })
      return { trauma, effects: { mentalHealth: -10, happiness: -8 }, message: `Il divorzio da ${rel.name} diventa un trauma persistente.` }
    }

    if (action === 'cheat') {
      const trauma = makeTrauma({
        type: 'betrayal',
        source: rel.id,
        description: `Tradimento legato a ${rel.name}`,
        year: state.time.year,
        severity: 4,
        resilience,
        triggers: ['relationship', 'trust'],
      })
      return { trauma, effects: { mentalHealth: -5, karma: -2 }, message: `Il tradimento crea un trigger emotivo legato alla fiducia.` }
    }

    if (action === 'fight' && rel.trust < 25) {
      const trauma = makeTrauma({
        type: 'violence',
        source: rel.id,
        description: `Conflitto grave con ${rel.name}`,
        year: state.time.year,
        severity: 2,
        resilience,
        triggers: ['conflict'],
      })
      return { trauma, effects: { mentalHealth: -3 }, message: `Il conflitto con ${rel.name} continua a pesarti.` }
    }

    return base
  }

  static annualTick(state: GameState): TraumaAnnualResult {
    const activeTraumas = state.health.traumas ?? []
    const messages: string[] = []
    let mentalHealth = 0
    let happiness = 0

    const updatedTraumas = activeTraumas.map(trauma => {
      if (trauma.resolved) return trauma
      const age = state.time.year - trauma.year
      const naturalRecovery = 4 + Math.floor((state.health.resilience ?? 0) / 25)
      const triggerSpike = trauma.triggers.includes('relationship') && state.relationships.some(rel => rel.historyFlags.includes('chain_tension')) ? 4 : 0
      const nextIntensity = clamp(trauma.intensity - naturalRecovery + triggerSpike)

      if (nextIntensity >= 65) {
        mentalHealth -= Math.ceil(trauma.severity * 1.5)
        happiness -= Math.ceil(trauma.severity)
        if (age > 0 && Math.random() < 0.2) messages.push(`${trauma.description} riaffiora nei tuoi pensieri.`)
      } else if (nextIntensity <= 10) {
        messages.push(`${trauma.description} non domina più la tua vita.`)
      }

      return {
        ...trauma,
        intensity: nextIntensity,
        resolved: nextIntensity <= 10,
      }
    })

    const ptsd = updatedTraumas.some(trauma => !trauma.resolved && trauma.severity >= 5 && trauma.intensity >= 70)

    return {
      updatedTraumas,
      effects: { mentalHealth, happiness },
      messages,
      ptsd,
    }
  }

  static attendTherapy(state: GameState): TherapyResult {
    const activeTraumas = (state.health.traumas ?? []).filter(trauma => !trauma.resolved)
    if (activeTraumas.length === 0) {
      return {
        success: false,
        message: 'Non hai traumi attivi da affrontare in terapia.',
        effects: {},
      }
    }

    const cost = state.nation?.healthcarePublic ? 40 : 180
    if (state.finance.money < cost) {
      return { success: false, message: `La terapia costa €${cost}. Non hai abbastanza soldi.`, effects: {} }
    }

    const resilienceGain = 4
    const updatedTraumas = (state.health.traumas ?? []).map(trauma => {
      if (trauma.resolved) return trauma
      const intensity = clamp(trauma.intensity - 18)
      return { ...trauma, intensity, resolved: intensity <= 10 }
    })

    const currentTraumas = state.health.traumas ?? []
    const resolvedCount = updatedTraumas.filter((trauma, index) => !currentTraumas[index]?.resolved && trauma.resolved).length

    return {
      success: true,
      message: resolvedCount > 0
        ? `La terapia ti aiuta a chiudere ${resolvedCount} ferita/e emotiva/e.`
        : 'La terapia riduce il peso dei traumi e aumenta la tua resilienza.',
      effects: { money: -cost, mentalHealth: 10, happiness: 3 },
      updatedTraumas,
      resilienceGain,
    }
  }
}
