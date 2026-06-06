import type { ChaosEventRecord, ChaosEventType, ChaosState, Effect, GameState, TraumaEvent } from '../store/types'

export interface ChaosTickResult {
  chaos: ChaosState
  effects: Effect
  messages: string[]
  trauma: TraumaEvent | null
  fameDelta: {
    fame: number
    fanbase: number
    publicImage: number
    scandals: number
  }
}

interface ChaosDefinition {
  type: ChaosEventType
  title: string
  description: string
  emoji: string
  severity: number
  baseChance: number
  effects: Effect
  trauma?: {
    type: TraumaEvent['type']
    description: string
    triggers: string[]
  }
  fameDelta?: Partial<ChaosTickResult['fameDelta']>
  condition?: (state: GameState) => boolean
}

const INITIAL_CHAOS: ChaosState = {
  triggeredEvents: [],
  chaosScore: 0,
}

const CHAOS_EVENTS: ChaosDefinition[] = [
  {
    type: 'overnight_fame',
    title: 'Fama virale improvvisa',
    description: 'Un video casuale della tua vita diventa virale in tutto il mondo.',
    emoji: '🚀',
    severity: 3,
    baseChance: 0.012,
    effects: { happiness: 12, socialReputation: 14, energy: -8 },
    fameDelta: { fame: 18, fanbase: 250_000, publicImage: 4 },
    condition: state => state.time.age >= 13 && state.socialMedia.length > 0,
  },
  {
    type: 'millionaire_scam',
    title: 'Truffa milionaria',
    description: 'Una proposta di investimento troppo perfetta si rivela una trappola finanziaria.',
    emoji: '🧨',
    severity: 4,
    baseChance: 0.008,
    effects: { money: -25_000, happiness: -16, mentalHealth: -10, reputation: -4 },
    trauma: { type: 'bankruptcy', description: 'Truffa finanziaria devastante', triggers: ['money', 'trust'] },
    condition: state => state.finance.money >= 30_000 || (state.fame?.fame ?? 0) >= 35,
  },
  {
    type: 'cult_escape',
    title: 'Setta carismatica',
    description: 'Vieni attirato/a in un gruppo estremo e riesci a uscirne solo dopo mesi difficili.',
    emoji: '🕯️',
    severity: 4,
    baseChance: 0.006,
    effects: { mentalHealth: -18, happiness: -10, karma: -3 },
    trauma: { type: 'violence', description: 'Fuga da una setta manipolatoria', triggers: ['control', 'trust'] },
    condition: state => state.stats.mentalHealth < 45 || state.relationships.filter(r => r.toxicityTag).length > 0,
  },
  {
    type: 'kidnapping',
    title: 'Rapimento lampo',
    description: 'Un rapimento finisce prima del peggio, ma lascia conseguenze fisiche ed emotive.',
    emoji: '🚨',
    severity: 5,
    baseChance: 0.004,
    effects: { health: -22, mentalHealth: -24, happiness: -20 },
    trauma: { type: 'violence', description: 'Rapimento e fuga traumatica', triggers: ['danger', 'violence'] },
    fameDelta: { fame: 8, fanbase: 35_000, publicImage: 2 },
    condition: state => state.time.age >= 16 && ((state.fame?.fame ?? 0) >= 45 || (state.nation?.crimeRate ?? 0) > 0.45),
  },
  {
    type: 'serial_killer',
    title: 'Incontro con un criminale seriale',
    description: 'Sopravvivi per pochissimo a un incontro che finisce sui giornali.',
    emoji: '🗞️',
    severity: 5,
    baseChance: 0.003,
    effects: { health: -30, mentalHealth: -28, happiness: -22 },
    trauma: { type: 'violence', description: 'Sopravvivenza a un aggressore seriale', triggers: ['danger', 'night'] },
    fameDelta: { fame: 12, fanbase: 80_000, publicImage: 3 },
    condition: state => state.time.age >= 18,
  },
  {
    type: 'absurd_accident',
    title: 'Incidente assurdo',
    description: 'Una sequenza improbabile di eventi trasforma una giornata normale in un disastro.',
    emoji: '💥',
    severity: 3,
    baseChance: 0.01,
    effects: { health: -16, energy: -18, happiness: -8 },
    trauma: { type: 'illness', description: 'Incidente assurdo e recupero difficile', triggers: ['accident'] },
    condition: state => state.time.age >= 6,
  },
  {
    type: 'survival_scenario',
    title: 'Scenario di sopravvivenza',
    description: 'Ti perdi durante un viaggio e sopravvivi grazie a decisioni istintive.',
    emoji: '🧭',
    severity: 4,
    baseChance: 0.007,
    effects: { health: -12, mentalHealth: -8, happiness: 5, karma: 4 },
    trauma: { type: 'violence', description: 'Sopravvivenza estrema lontano da casa', triggers: ['travel', 'isolation'] },
    fameDelta: { fame: 7, fanbase: 20_000, publicImage: 5 },
    condition: state => state.travelHistory.length > 0,
  },
  {
    type: 'alien_encounter',
    title: 'Incontro inspiegabile',
    description: 'Racconti di aver visto qualcosa di impossibile. Nessuno sa se crederti.',
    emoji: '🛸',
    severity: 2,
    baseChance: 0.002,
    effects: { happiness: 8, mentalHealth: -4, reputation: -2 },
    fameDelta: { fame: 10, fanbase: 60_000, publicImage: -6, scandals: 1 },
    condition: state => state.time.age >= 12,
  },
]

const uid = () => `chaos_${Math.random().toString(36).slice(2, 10)}`

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function makeTrauma(def: ChaosDefinition, state: GameState): TraumaEvent | null {
  if (!def.trauma) return null
  return {
    id: `trauma_${Math.random().toString(36).slice(2, 10)}`,
    type: def.trauma.type,
    source: def.type,
    description: def.trauma.description,
    year: state.time.year,
    severity: def.severity,
    intensity: clamp(38 + def.severity * 9 - (state.health.resilience ?? 0) / 3, 25, 100),
    triggers: def.trauma.triggers,
    resolved: false,
  }
}

export class ChaosEngine {
  static initialState(): ChaosState {
    return { ...INITIAL_CHAOS, triggeredEvents: [] }
  }

  static ensure(state: Partial<ChaosState> | undefined): ChaosState {
    return {
      triggeredEvents: state?.triggeredEvents ?? [],
      chaosScore: clamp(state?.chaosScore ?? 0),
    }
  }

  static annualTick(state: GameState): ChaosTickResult {
    const current = ChaosEngine.ensure(state.chaos)
    const triggeredTypes = new Set(current.triggeredEvents.map(event => event.type))
    const eligible = CHAOS_EVENTS.filter(def => !triggeredTypes.has(def.type) && (!def.condition || def.condition(state)))
    const luckPenalty = state.stats.karma < -40 ? 1.45 : state.stats.karma > 40 ? 0.75 : 1
    const fameMultiplier = (state.fame?.fame ?? 0) >= 60 ? 1.25 : 1
    const ageMultiplier = state.time.age < 13 ? 0.45 : state.time.age > 75 ? 0.7 : 1

    for (const def of eligible) {
      const chance = def.baseChance * luckPenalty * fameMultiplier * ageMultiplier
      if (Math.random() >= chance) continue

      const record: ChaosEventRecord = {
        id: uid(),
        type: def.type,
        year: state.time.year,
        age: state.time.age,
        title: def.title,
        description: def.description,
        severity: def.severity,
        survived: true,
        effects: def.effects,
      }
      const fameDelta = {
        fame: def.fameDelta?.fame ?? 0,
        fanbase: def.fameDelta?.fanbase ?? 0,
        publicImage: def.fameDelta?.publicImage ?? 0,
        scandals: def.fameDelta?.scandals ?? 0,
      }

      return {
        chaos: {
          triggeredEvents: [record, ...current.triggeredEvents].slice(0, 30),
          chaosScore: clamp(current.chaosScore + def.severity * 8),
        },
        effects: def.effects,
        messages: [`${def.emoji} ${def.title}: ${def.description}`],
        trauma: makeTrauma(def, state),
        fameDelta,
      }
    }

    return {
      chaos: {
        ...current,
        chaosScore: clamp(current.chaosScore - 1),
      },
      effects: {},
      messages: [],
      trauma: null,
      fameDelta: { fame: 0, fanbase: 0, publicImage: 0, scandals: 0 },
    }
  }
}
