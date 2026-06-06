import type { GameState, Effect, TravelMemory } from '../store/types'

export type TravelClass = 'economy' | 'business' | 'luxury'
export type TravelCategory = 'national' | 'europe' | 'asia' | 'americas' | 'africa' | 'exotic'

export interface TravelDest {
  id: string; name: string; emoji: string; country: string
  category: TravelCategory; economyCost: number; durationDays: number
  riskLevel: number; effects: Omit<Effect, 'money'>; memoryFlag: string; minAge: number
}

export const TRAVEL_DESTS: TravelDest[] = [
  { id: 'roma',        name: 'Roma',           emoji: '🏛️', country: 'Italy',     category: 'national', economyCost: 300,  durationDays: 3,  riskLevel: 1, effects: { happiness: 10, intelligence: 2, socialReputation: 3 }, memoryFlag: 'visited_rome', minAge: 0 },
  { id: 'milano',      name: 'Milano',         emoji: '🌆', country: 'Italy',     category: 'national', economyCost: 200,  durationDays: 2,  riskLevel: 1, effects: { happiness: 8, reputation: 2 }, memoryFlag: 'visited_milan', minAge: 0 },
  { id: 'venezia',     name: 'Venezia',        emoji: '🛶', country: 'Italy',     category: 'national', economyCost: 400,  durationDays: 3,  riskLevel: 1, effects: { happiness: 12, looks: 2 }, memoryFlag: 'visited_venice', minAge: 0 },
  { id: 'parigi',      name: 'Parigi',         emoji: '🗼', country: 'France',    category: 'europe',   economyCost: 600,  durationDays: 5,  riskLevel: 2, effects: { happiness: 15, intelligence: 3, looks: 3, socialReputation: 5 }, memoryFlag: 'visited_paris', minAge: 0 },
  { id: 'barcellona',  name: 'Barcellona',     emoji: '🌺', country: 'Spain',     category: 'europe',   economyCost: 500,  durationDays: 5,  riskLevel: 2, effects: { happiness: 14, energy: 5, socialReputation: 4 }, memoryFlag: 'visited_barcelona', minAge: 0 },
  { id: 'amsterdam',   name: 'Amsterdam',      emoji: '🌷', country: 'Netherlands', category: 'europe', economyCost: 550, durationDays: 4,  riskLevel: 2, effects: { happiness: 12, intelligence: 2, mentalHealth: 5 }, memoryFlag: 'visited_amsterdam', minAge: 18 },
  { id: 'tokyo',       name: 'Tokyo',          emoji: '🗾', country: 'Japan',     category: 'asia',     economyCost: 1200, durationDays: 10, riskLevel: 1, effects: { happiness: 20, intelligence: 5, socialReputation: 8 }, memoryFlag: 'visited_tokyo', minAge: 0 },
  { id: 'bali',        name: 'Bali',           emoji: '🌴', country: 'Indonesia', category: 'asia',     economyCost: 1500, durationDays: 10, riskLevel: 2, effects: { happiness: 25, mentalHealth: 15, health: 5 }, memoryFlag: 'visited_bali', minAge: 0 },
  { id: 'dubai',       name: 'Dubai',          emoji: '🏙️', country: 'UAE',       category: 'asia',     economyCost: 1800, durationDays: 7,  riskLevel: 1, effects: { happiness: 18, reputation: 5, socialReputation: 10 }, memoryFlag: 'visited_dubai', minAge: 0 },
  { id: 'new_york',    name: 'New York',       emoji: '🗽', country: 'USA',       category: 'americas', economyCost: 1300, durationDays: 7,  riskLevel: 3, effects: { happiness: 20, intelligence: 4, socialReputation: 6 }, memoryFlag: 'visited_nyc', minAge: 0 },
  { id: 'rio',         name: 'Rio de Janeiro', emoji: '🎭', country: 'Brazil',    category: 'americas', economyCost: 1600, durationDays: 10, riskLevel: 4, effects: { happiness: 22, energy: 8, socialReputation: 5 }, memoryFlag: 'visited_rio', minAge: 18 },
  { id: 'safari',      name: 'Safari Africa',  emoji: '🦁', country: 'Kenya',     category: 'africa',   economyCost: 3000, durationDays: 10, riskLevel: 3, effects: { happiness: 30, intelligence: 5, mentalHealth: 10 }, memoryFlag: 'visited_safari', minAge: 0 },
  { id: 'maldive',     name: 'Maldive',        emoji: '🏝️', country: 'Maldives',  category: 'exotic',   economyCost: 4000, durationDays: 10, riskLevel: 1, effects: { happiness: 35, mentalHealth: 20, health: 8, looks: 3 }, memoryFlag: 'visited_maldives', minAge: 0 },
  { id: 'islanda',     name: 'Islanda',        emoji: '🌋', country: 'Iceland',   category: 'exotic',   economyCost: 2500, durationDays: 7,  riskLevel: 2, effects: { happiness: 28, intelligence: 6, mentalHealth: 12 }, memoryFlag: 'visited_iceland', minAge: 0 },
  { id: 'australia',   name: 'Australia',      emoji: '🦘', country: 'Australia', category: 'exotic',   economyCost: 2200, durationDays: 14, riskLevel: 2, effects: { happiness: 30, health: 5, socialReputation: 8 }, memoryFlag: 'visited_australia', minAge: 0 },
]

const CLASS_MULTIPLIER: Record<TravelClass, number> = { economy: 1, business: 2.5, luxury: 6 }
const CLASS_EFFECTS: Record<TravelClass, Effect> = {
  economy:  { mentalHealth: 0 },
  business: { mentalHealth: 5, happiness: 5 },
  luxury:   { mentalHealth: 10, happiness: 15, reputation: 5, socialReputation: 5 },
}

export interface TravelResult {
  success: boolean; message: string; effects: Effect
  newMemory?: TravelMemory
}

export class TravelEngine {
  static getDests() { return TRAVEL_DESTS }

  static bookTrip(destId: string, travelClass: TravelClass, state: GameState): TravelResult {
    const dest = TRAVEL_DESTS.find(d => d.id === destId)
    if (!dest) return { success: false, message: 'Destinazione non trovata.', effects: {} }
    if (state.time.age < dest.minAge)
      return { success: false, message: `Devi avere almeno ${dest.minAge} anni.`, effects: {} }
    if (state.criminal.inPrison)
      return { success: false, message: 'Non puoi viaggiare mentre sei in prigione.', effects: {} }

    const totalCost = Math.floor(dest.economyCost * CLASS_MULTIPLIER[travelClass])
    if (state.finance.money < totalCost)
      return { success: false, message: `Questo viaggio costa €${totalCost.toLocaleString()}. Non hai fondi sufficienti.`, effects: {} }

    const alreadyVisited = state.travelHistory.some(t => t.destination === dest.name)
    const noveltyBonus = alreadyVisited ? 0 : 5

    // Risk events
    const riskRoll = Math.random()
    let riskMessage = ''
    const riskFx: Effect = {}
    if (riskRoll < dest.riskLevel * 0.03) {
      riskMessage = ' ⚠️ Hai subito un furto durante il viaggio (-€500).'
      riskFx.money = -500
      riskFx.happiness = -10
    }

    const baseEffects: Effect = {
      ...dest.effects,
      ...CLASS_EFFECTS[travelClass],
      ...riskFx,
      money: -totalCost + (riskFx.money ?? 0),
      happiness: (dest.effects.happiness ?? 0) + (CLASS_EFFECTS[travelClass].happiness ?? 0) + noveltyBonus + (riskFx.happiness ?? 0),
    }

    const classLabels = { economy: 'Economica ✈️', business: 'Business ✈️', luxury: 'Prima Classe 🛫' }
    const memory: TravelMemory = {
      destination: dest.name, year: state.time.year,
      activityType: dest.category === 'exotic' ? 'adventure' : 'cultural',
      cost: totalCost, memoryFlag: dest.memoryFlag, photosOnSocial: true,
    }

    return {
      success: true,
      message: `${dest.emoji} Viaggio a ${dest.name} (${classLabels[travelClass]}). €${totalCost.toLocaleString()} spesi.${riskMessage}`,
      effects: baseEffects, newMemory: memory,
    }
  }
}
