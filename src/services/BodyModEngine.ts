import type { GameState, Effect } from '../store/types'

export type BodyModVisibility = 'hidden' | 'partial' | 'full'

export interface BodyMod {
  id: string
  type: 'tattoo' | 'piercing'
  name: string
  location: string
  emoji: string
  cost: number
  yearDone: number
  visibility: BodyModVisibility
  professionalStigma: number  // 0-5
  painLevel: number           // 1-10
}

export interface BodyModState {
  items: BodyMod[]
}

export interface TattooDef {
  id: string
  name: string
  emoji: string
  size: 'small' | 'medium' | 'large' | 'sleeve' | 'back'
  location: string
  cost: number
  painLevel: number
  visibility: BodyModVisibility
  professionalStigma: number
}

export interface PiercingDef {
  id: string
  name: string
  emoji: string
  area: string
  cost: number
  painLevel: number
  healingWeeks: number
  visibility: BodyModVisibility
  professionalStigma: number
}

export const TATTOO_DEFS: TattooDef[] = [
  { id: 'small_wrist',    name: 'Tatuaggio polso (piccolo)',      emoji: '🖊️',  size: 'small',  location: 'Polso',           cost: 100,  painLevel: 4, visibility: 'partial', professionalStigma: 1 },
  { id: 'small_ankle',    name: 'Tatuaggio caviglia (piccolo)',   emoji: '🦵',  size: 'small',  location: 'Caviglia',        cost: 80,   painLevel: 3, visibility: 'hidden',  professionalStigma: 0 },
  { id: 'medium_arm',     name: 'Tatuaggio braccio (medio)',      emoji: '💪',  size: 'medium', location: 'Braccio',         cost: 350,  painLevel: 5, visibility: 'partial', professionalStigma: 2 },
  { id: 'medium_back',    name: 'Tatuaggio schiena (medio)',      emoji: '🔙',  size: 'medium', location: 'Schiena',         cost: 450,  painLevel: 6, visibility: 'hidden',  professionalStigma: 1 },
  { id: 'large_chest',    name: 'Tatuaggio petto (grande)',       emoji: '❤️',  size: 'large',  location: 'Petto',           cost: 1200, painLevel: 7, visibility: 'hidden',  professionalStigma: 2 },
  { id: 'large_shoulder', name: 'Tatuaggio spalla (grande)',      emoji: '🦅',  size: 'large',  location: 'Spalla',          cost: 1000, painLevel: 6, visibility: 'partial', professionalStigma: 2 },
  { id: 'sleeve_right',   name: 'Sleeve braccio destro',         emoji: '🎨',  size: 'sleeve', location: 'Braccio destro',  cost: 4500, painLevel: 7, visibility: 'full',    professionalStigma: 4 },
  { id: 'sleeve_left',    name: 'Sleeve braccio sinistro',       emoji: '🎨',  size: 'sleeve', location: 'Braccio sinistro', cost: 4500, painLevel: 7, visibility: 'full',   professionalStigma: 4 },
  { id: 'back_piece',     name: 'Back piece (schiena completa)',  emoji: '🗺️',  size: 'back',   location: 'Schiena intera',  cost: 10000, painLevel: 8, visibility: 'hidden', professionalStigma: 2 },
  { id: 'neck_tattoo',    name: 'Tatuaggio collo',               emoji: '🦢',  size: 'medium', location: 'Collo',           cost: 600,  painLevel: 7, visibility: 'full',    professionalStigma: 5 },
  { id: 'face_tattoo',    name: 'Tatuaggio viso',                emoji: '😤',  size: 'small',  location: 'Viso',            cost: 300,  painLevel: 8, visibility: 'full',    professionalStigma: 5 },
]

export const PIERCING_DEFS: PiercingDef[] = [
  { id: 'ear_lobe',       name: 'Lobo orecchio',          emoji: '💎', area: 'Orecchie',  cost: 30,  painLevel: 2, healingWeeks: 8,  visibility: 'full',    professionalStigma: 0 },
  { id: 'ear_helix',      name: 'Helix orecchio',         emoji: '✨', area: 'Orecchie',  cost: 50,  painLevel: 4, healingWeeks: 24, visibility: 'partial', professionalStigma: 1 },
  { id: 'nose_stud',      name: 'Ala naso',               emoji: '💫', area: 'Naso',      cost: 40,  painLevel: 4, healingWeeks: 20, visibility: 'full',    professionalStigma: 1 },
  { id: 'septum',         name: 'Setto nasale',           emoji: '🐂', area: 'Naso',      cost: 60,  painLevel: 5, healingWeeks: 24, visibility: 'partial', professionalStigma: 2 },
  { id: 'eyebrow',        name: 'Sopracciglio',           emoji: '🤨', area: 'Viso',      cost: 50,  painLevel: 3, healingWeeks: 36, visibility: 'full',    professionalStigma: 2 },
  { id: 'lip_labret',     name: 'Labret (labbro)',        emoji: '💋', area: 'Bocca',     cost: 50,  painLevel: 5, healingWeeks: 20, visibility: 'full',    professionalStigma: 2 },
  { id: 'tongue',         name: 'Lingua',                 emoji: '👅', area: 'Bocca',     cost: 60,  painLevel: 7, healingWeeks: 8,  visibility: 'hidden',  professionalStigma: 1 },
  { id: 'navel',          name: 'Ombelico',               emoji: '⭕', area: 'Corpo',     cost: 50,  painLevel: 5, healingWeeks: 40, visibility: 'hidden',  professionalStigma: 0 },
  { id: 'nipple',         name: 'Capezzolo',              emoji: '🔘', area: 'Corpo',     cost: 70,  painLevel: 7, healingWeeks: 48, visibility: 'hidden',  professionalStigma: 0 },
]

export interface BodyModResult {
  success: boolean
  message: string
  effects: Effect
  newItem?: BodyMod
}

export class BodyModEngine {
  static getTattoo(tattooId: string, state: GameState): BodyModResult {
    const def = TATTOO_DEFS.find(t => t.id === tattooId)
    if (!def) return { success: false, message: 'Tatuaggio non trovato.', effects: {} }
    if (state.time.age < 18)
      return { success: false, message: 'Devi avere almeno 18 anni per fare un tatuaggio.', effects: {} }
    if (state.finance.money < def.cost)
      return { success: false, message: `Non hai abbastanza soldi. Servono €${def.cost}.`, effects: {} }
    if (state.bodyMods.items.some(m => m.type === 'tattoo' && m.id.startsWith(def.id)))
      return { success: false, message: 'Hai già questo tatuaggio.', effects: {} }

    const infectionRisk = Math.random() < 0.06
    const effects: Effect = {
      money: -(def.cost + (infectionRisk ? 200 : 0)),
      looks: def.professionalStigma >= 4 ? -5 : 2,
      happiness: 8,
      health: infectionRisk ? -8 : 0,
    }

    const newItem: BodyMod = {
      id: def.id + '_' + Math.random().toString(36).slice(2, 6),
      type: 'tattoo',
      name: def.name,
      location: def.location,
      emoji: def.emoji,
      cost: def.cost,
      yearDone: state.time.year,
      visibility: def.visibility,
      professionalStigma: def.professionalStigma,
      painLevel: def.painLevel,
    }

    return {
      success: true,
      newItem,
      message: `${def.emoji} Hai fatto ${def.name} in ${def.location}. €${def.cost} spesi.${infectionRisk ? ' ⚠️ Infezione lieve! Cura con antibiotici (-€200, -8 salute).' : ''}`,
      effects,
    }
  }

  static getPiercing(piercingId: string, state: GameState): BodyModResult {
    const def = PIERCING_DEFS.find(p => p.id === piercingId)
    if (!def) return { success: false, message: 'Piercing non trovato.', effects: {} }
    if (state.time.age < 16)
      return { success: false, message: 'Devi avere almeno 16 anni per i piercing.', effects: {} }
    if (state.finance.money < def.cost)
      return { success: false, message: `Servono €${def.cost}.`, effects: {} }

    const existing = state.bodyMods.items.filter(m => m.type === 'piercing' && m.id.startsWith(def.id)).length
    if (existing >= 2)
      return { success: false, message: 'Hai già questo piercing (max 2 per zona).', effects: {} }

    const infectionRisk = Math.random() < 0.08
    const effects: Effect = {
      money: -(def.cost + (infectionRisk ? 150 : 0)),
      happiness: 5,
      health: infectionRisk ? -6 : 0,
    }

    const newItem: BodyMod = {
      id: def.id + '_' + Math.random().toString(36).slice(2, 6),
      type: 'piercing',
      name: def.name,
      location: def.area,
      emoji: def.emoji,
      cost: def.cost,
      yearDone: state.time.year,
      visibility: def.visibility,
      professionalStigma: def.professionalStigma,
      painLevel: def.painLevel,
    }

    return {
      success: true,
      newItem,
      message: `${def.emoji} Hai fatto il piercing ${def.name}. Guarigione: ${def.healingWeeks} settimane.${infectionRisk ? ' ⚠️ Lieve infezione! -€150, -6 salute.' : ''}`,
      effects,
    }
  }

  static removeTattoo(modId: string, state: GameState): BodyModResult {
    const mod = state.bodyMods.items.find(m => m.id === modId && m.type === 'tattoo')
    if (!mod) return { success: false, message: 'Tatuaggio non trovato.', effects: {} }

    const removalCost = mod.cost * 1.5
    if (state.finance.money < removalCost)
      return { success: false, message: `La rimozione laser costa €${Math.round(removalCost).toLocaleString()} (5-8 sessioni).`, effects: {} }

    return {
      success: true,
      message: `🔬 Rimozione laser ${mod.name} completata. Costo: €${Math.round(removalCost).toLocaleString()}.`,
      effects: { money: -removalCost, health: -2, happiness: -3 },
    }
  }

  // Impact of body mods on reputation (called during evaluations)
  static getReputationModifier(state: GameState): number {
    const items = state.bodyMods?.items ?? []
    const totalStigma = items.reduce((sum, m) => sum + m.professionalStigma, 0)
    return -Math.min(25, totalStigma * 2)
  }
}
