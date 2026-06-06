import type { GameState, Effect } from '../store/types'

export interface HistoricalEvent {
  id: string
  year: number
  name: string
  emoji: string
  description: string
  effects: Effect
  minAge: number         // player must be at least this age to experience it
  nationFilter?: string  // only fires for this nation (undefined = global)
  duration: number       // years the event is "active"
  unlocksSocialMedia?: boolean
}

export interface HomeRepairEvent {
  id: string
  name: string
  emoji: string
  minCost: number
  maxCost: number
  probability: number    // per year, for homeowners
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export interface WorldEventsState {
  triggeredEvents: string[]           // ids of historical events already triggered
  activeWorldModifiers: WorldModifier[]
}

export interface WorldModifier {
  id: string
  name: string
  effects: Effect        // applied every year the modifier is active
  expiresYear: number
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'fall_of_berlin_wall',
    year: 1989, name: 'Caduta del Muro di Berlino', emoji: '🧱',
    description: 'Il Muro di Berlino cade. L\'Europa si riunifica. Un momento storico.',
    effects: { happiness: 10, karma: 5 },
    minAge: 5, duration: 1,
  },
  {
    id: 'september_11',
    year: 2001, name: '11 Settembre', emoji: '🌆',
    description: 'Gli attacchi terroristici dell\'11 settembre cambiano il mondo. +sicurezza aeroporti, -turismo.',
    effects: { happiness: -15, mentalHealth: -10 },
    minAge: 0, duration: 2,
  },
  {
    id: 'iphone_launch',
    year: 2007, name: 'Lancio dell\'iPhone', emoji: '📱',
    description: 'Apple lancia l\'iPhone. Inizia l\'era degli smartphone e dei social media.',
    effects: { intelligence: 2, happiness: 5 },
    minAge: 0, duration: 1,
    unlocksSocialMedia: true,
  },
  {
    id: 'financial_crisis_2008',
    year: 2008, name: 'Crisi Finanziaria Globale', emoji: '📉',
    description: 'Crisi dei mutui subprime. Crollo delle borse mondiali. Recessione globale.',
    effects: { money: -5000, happiness: -20, reputation: -5 },
    minAge: 18, duration: 3,
  },
  {
    id: 'covid_pandemic',
    year: 2020, name: 'Pandemia COVID-19', emoji: '🦠',
    description: 'Il mondo si ferma. Lockdown, mascherine, remote work. La vita cambia per sempre.',
    effects: { happiness: -25, mentalHealth: -15, health: -5, socialReputation: -10 },
    minAge: 0, duration: 2,
  },
  {
    id: 'ukraine_war',
    year: 2022, name: 'Guerra Russia-Ucraina', emoji: '⚔️',
    description: 'La guerra in Ucraina scuote l\'Europa. Costi energetici alle stelle. Rifugiati.',
    effects: { money: -1200, happiness: -10 },
    minAge: 0, duration: 3,
  },
  {
    id: 'ai_revolution',
    year: 2023, name: 'Rivoluzione dell\'IA', emoji: '🤖',
    description: 'L\'intelligenza artificiale trasforma il lavoro. Alcuni lavori scompaiono, altri nascono.',
    effects: { intelligence: 5, happiness: 5 },
    minAge: 0, duration: 2,
  },
]

export interface HolidayEvent {
  id: string
  name: string
  emoji: string
  monthTrigger: number  // 1-12
  effects: Effect
  giftCost?: number
  familyBonus?: number
}

export const HOLIDAY_EVENTS: HolidayEvent[] = [
  { id: 'natale',       name: 'Natale',              emoji: '🎄', monthTrigger: 12, effects: { happiness: 15, mentalHealth: 5 }, giftCost: 300, familyBonus: 10 },
  { id: 'capodanno',    name: 'Capodanno',            emoji: '🎆', monthTrigger: 1,  effects: { happiness: 10, karma: 2 } },
  { id: 'pasqua',       name: 'Pasqua',               emoji: '🐣', monthTrigger: 4,  effects: { happiness: 8, karma: 3 }, giftCost: 80, familyBonus: 8 },
  { id: 'san_valentino',name: 'San Valentino',        emoji: '❤️', monthTrigger: 2,  effects: { happiness: 12 }, giftCost: 100 },
  { id: 'halloween',    name: 'Halloween',            emoji: '🎃', monthTrigger: 10, effects: { happiness: 8, mentalHealth: 3 } },
  { id: 'ferragosto',   name: 'Ferragosto',           emoji: '🏖️', monthTrigger: 8,  effects: { happiness: 10, health: 3 } },
  { id: 'festa_mamma',  name: 'Festa della Mamma',    emoji: '💐', monthTrigger: 5,  effects: { happiness: 6, karma: 3 }, giftCost: 60 },
  { id: 'natale_eid',   name: 'Eid al-Fitr (Ramadan)',emoji: '🌙', monthTrigger: 4,  effects: { happiness: 10, karma: 8, mentalHealth: 5 } },
]

export const HOME_REPAIR_EVENTS: HomeRepairEvent[] = [
  { id: 'fridge_break',    name: 'Frigorifero rotto',         emoji: '🧊', minCost: 200,  maxCost: 600,  probability: 0.05, urgency: 'high'     },
  { id: 'washer_break',    name: 'Lavatrice rotta',           emoji: '🌀', minCost: 150,  maxCost: 400,  probability: 0.05, urgency: 'high'     },
  { id: 'boiler_break',    name: 'Scaldabagno guasto',        emoji: '🔥', minCost: 300,  maxCost: 600,  probability: 0.04, urgency: 'high'     },
  { id: 'hvac_break',      name: 'Condizionatore guasto',     emoji: '❄️', minCost: 300,  maxCost: 1000, probability: 0.04, urgency: 'medium'   },
  { id: 'roof_leak',       name: 'Perdita dal tetto',         emoji: '🏚️', minCost: 2000, maxCost: 8000, probability: 0.02, urgency: 'high'     },
  { id: 'pipe_burst',      name: 'Tubatura rotta',            emoji: '💧', minCost: 500,  maxCost: 4000, probability: 0.03, urgency: 'critical' },
  { id: 'electrical',      name: 'Problema impianto elettrico', emoji: '⚡', minCost: 500,  maxCost: 3000, probability: 0.03, urgency: 'high'  },
  { id: 'rodents',         name: 'Infestazione roditori',     emoji: '🐀', minCost: 500,  maxCost: 1500, probability: 0.03, urgency: 'medium'   },
  { id: 'termites',        name: 'Infestazione termiti',      emoji: '🐛', minCost: 2000, maxCost: 8000, probability: 0.01, urgency: 'high'     },
]

export interface WorldEventResult {
  triggeredHistorical: HistoricalEvent[]
  homeRepairs: HomeRepairEvent[]
  triggeredHolidays: HolidayEvent[]
  totalRepairCost: number
  effects: Effect
  updatedWorld: Partial<WorldEventsState>
}

export class WorldEventsEngine {
  static annualTick(state: GameState): WorldEventResult {
    const effects: Effect = {}
    const triggeredHistorical: HistoricalEvent[] = []
    const homeRepairs: HomeRepairEvent[] = []
    let totalRepairCost = 0

    // Check historical events
    for (const ev of HISTORICAL_EVENTS) {
      if (state.worldEvents.triggeredEvents.includes(ev.id)) continue
      if (state.time.year !== ev.year) continue
      if (state.time.age < ev.minAge) continue
      if (ev.nationFilter && state.nation?.id !== ev.nationFilter) continue

      triggeredHistorical.push(ev)
      for (const [key, val] of Object.entries(ev.effects)) {
        effects[key] = (effects[key] ?? 0) + (val as number)
      }
    }

    // Active world modifiers
    const activeModifiers = state.worldEvents.activeWorldModifiers.filter(m => m.expiresYear > state.time.year)
    for (const mod of activeModifiers) {
      for (const [key, val] of Object.entries(mod.effects)) {
        effects[key] = (effects[key] ?? 0) + (val as number)
      }
    }

    // Home repair events (only for homeowners)
    const ownsHome = state.living.type === 'owning' || state.finance.assets.some(a => a.type === 'house')
    if (ownsHome) {
      for (const repair of HOME_REPAIR_EVENTS) {
        if (Math.random() < repair.probability) {
          const cost = Math.round(repair.minCost + Math.random() * (repair.maxCost - repair.minCost))
          homeRepairs.push(repair)
          totalRepairCost += cost
          effects.money = (effects.money ?? 0) - cost
          effects.happiness = (effects.happiness ?? 0) - 5
        }
      }
    }

    // Holiday events — fire once per year based on current month
    const triggeredHolidays: HolidayEvent[] = []
    const currentMonth = state.time.month
    for (const holiday of HOLIDAY_EVENTS) {
      // Religious filter for some holidays
      if (holiday.id === 'natale_eid' && state.identity.religion !== 'islam') continue

      // Only fire for the matching month, with some randomness
      if (Math.abs(holiday.monthTrigger - currentMonth) <= 1) {
        triggeredHolidays.push(holiday)
        for (const [key, val] of Object.entries(holiday.effects)) {
          effects[key] = (effects[key] ?? 0) + (val as number)
        }

        // Gift cost deducted if has family/partner
        if (holiday.giftCost) {
          const hasFamily = state.relationships.some(r => r.type === 'parent' || r.type === 'sibling' || r.stage === 'spouse')
          if (hasFamily) {
            effects.money = (effects.money ?? 0) - holiday.giftCost
          }
        }

        // Family bonus if family is present
        if (holiday.familyBonus) {
          const familyCount = state.relationships.filter(r => r.type === 'parent' || r.type === 'sibling').length + state.children.length
          if (familyCount > 0) {
            effects.happiness = (effects.happiness ?? 0) + holiday.familyBonus
          }
        }
      }
    }

    const newTriggered = [
      ...state.worldEvents.triggeredEvents,
      ...triggeredHistorical.map(e => e.id),
    ]

    // Build new modifiers (add duration-based modifiers for new events)
    const newModifiers: WorldModifier[] = [...activeModifiers]
    for (const ev of triggeredHistorical) {
      if (ev.duration > 1) {
        newModifiers.push({
          id: ev.id + '_mod',
          name: ev.name,
          effects: Object.fromEntries(
            Object.entries(ev.effects).map(([k, v]) => [k, Math.round((v as number) * 0.3)])
          ),
          expiresYear: state.time.year + ev.duration,
        })
      }
    }

    return {
      triggeredHistorical,
      homeRepairs,
      triggeredHolidays,
      totalRepairCost,
      effects,
      updatedWorld: {
        triggeredEvents: newTriggered,
        activeWorldModifiers: newModifiers,
      },
    }
  }

  static getActiveEventDescription(state: GameState): string | null {
    const currentYear = state.time.year
    const active = HISTORICAL_EVENTS.find(ev =>
      state.worldEvents.triggeredEvents.includes(ev.id) &&
      currentYear <= ev.year + ev.duration
    )
    return active ? `${active.emoji} ${active.name}` : null
  }
}
