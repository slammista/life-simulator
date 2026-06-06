import type { GameState, Effect } from '../store/types'

export type HairStyle = 'none' | 'basic' | 'styled' | 'colored' | 'premium'
export type NailsStyle = 'none' | 'basic' | 'gel' | 'acrylic' | 'nail_art'
export type WardrobeTier = 'none' | 'economy' | 'medium' | 'luxury' | 'ultra_luxury'
export type SkincareLevel = 'none' | 'basic' | 'advanced' | 'clinical'
export type MakeupLevel = 'none' | 'minimal' | 'full_glam' | 'professional'

export interface BeautyState {
  hairStyle: HairStyle
  hairLastUpdatedYear: number
  nailsStyle: NailsStyle
  nailsLastUpdatedYear: number
  wardrobeTier: WardrobeTier
  wardrobeLastUpdatedYear: number
  skincareLevel: SkincareLevel
  makeupLevel: MakeupLevel
  hasLaserHairRemoval: boolean
  hasBotox: boolean
  botoxSessions: number
  luxuryItems: LuxuryAccessory[]
}

export interface LuxuryAccessory {
  id: string
  name: string
  emoji: string
  brand: string
  purchaseYear: number
  value: number
  looksBonus: number
  reputationBonus: number
}

export interface BeautyResult {
  success: boolean
  message: string
  effects: Effect
  updatedBeauty?: Partial<BeautyState>
  newItem?: LuxuryAccessory
}

const HAIR_OPTIONS: Record<HairStyle, { name: string; emoji: string; cost: number; looksBonus: number; annualLimit: number }> = {
  none:    { name: 'Nessuna cura',      emoji: '🚫', cost: 0,   looksBonus: 0,  annualLimit: 0 },
  basic:   { name: 'Taglio base',       emoji: '✂️', cost: 45,  looksBonus: 3,  annualLimit: 4 },
  styled:  { name: 'Taglio + styling',  emoji: '💈', cost: 80,  looksBonus: 6,  annualLimit: 3 },
  colored: { name: 'Colorazione',       emoji: '🎨', cost: 200, looksBonus: 8,  annualLimit: 2 },
  premium: { name: 'Balayage/Premium',  emoji: '✨', cost: 450, looksBonus: 12, annualLimit: 2 },
}

const NAILS_OPTIONS: Record<NailsStyle, { name: string; emoji: string; cost: number; looksBonus: number }> = {
  none:     { name: 'Nessuna cura', emoji: '🚫', cost: 0,   looksBonus: 0 },
  basic:    { name: 'Manicure base', emoji: '💅', cost: 35,  looksBonus: 2 },
  gel:      { name: 'Gel nails',    emoji: '💎', cost: 60,  looksBonus: 4 },
  acrylic:  { name: 'Acrylic nails', emoji: '💅', cost: 75,  looksBonus: 5 },
  nail_art: { name: 'Nail art',     emoji: '🌸', cost: 100, looksBonus: 7 },
}

const WARDROBE_OPTIONS: Record<WardrobeTier, { name: string; emoji: string; cost: number; looksBonus: number; reputationBonus: number }> = {
  none:        { name: 'Niente di speciale', emoji: '👕', cost: 0,     looksBonus: 0,  reputationBonus: 0 },
  economy:     { name: 'Economy (Zara/H&M)', emoji: '🛍️', cost: 1000,  looksBonus: 5,  reputationBonus: 2 },
  medium:      { name: 'Medium (Gap/COS)',   emoji: '👔', cost: 4000,  looksBonus: 10, reputationBonus: 5 },
  luxury:      { name: 'Lusso (Gucci/Prada)', emoji: '👑', cost: 20000, looksBonus: 18, reputationBonus: 12 },
  ultra_luxury: { name: 'Ultra Lusso (Hermès)', emoji: '💎', cost: 100000, looksBonus: 25, reputationBonus: 20 },
}

export const LUXURY_ITEMS = [
  { id: 'rolex_submariner', name: 'Rolex Submariner', emoji: '⌚', brand: 'Rolex', value: 15000, looksBonus: 8, reputationBonus: 12 },
  { id: 'patek_philippe', name: 'Patek Philippe Nautilus', emoji: '⌚', brand: 'Patek Philippe', value: 80000, looksBonus: 12, reputationBonus: 20 },
  { id: 'hermes_birkin', name: 'Hermès Birkin', emoji: '👜', brand: 'Hermès', value: 15000, looksBonus: 10, reputationBonus: 15 },
  { id: 'chanel_flap', name: 'Chanel Classic Flap', emoji: '👜', brand: 'Chanel', value: 8000, looksBonus: 8, reputationBonus: 10 },
  { id: 'louboutin', name: 'Christian Louboutin', emoji: '👠', brand: 'Louboutin', value: 900, looksBonus: 5, reputationBonus: 6 },
  { id: 'jordan_limited', name: 'Nike Jordan Limited', emoji: '👟', brand: 'Nike', value: 2000, looksBonus: 4, reputationBonus: 5 },
  { id: 'rolex_daytona', name: 'Rolex Daytona', emoji: '⌚', brand: 'Rolex', value: 35000, looksBonus: 10, reputationBonus: 16 },
]

export class BeautyEngine {
  static getHaircut(style: HairStyle, state: GameState): BeautyResult {
    const opt = HAIR_OPTIONS[style]
    if (style === 'none') return { success: false, message: 'Stile non valido.', effects: {} }
    if (state.finance.money < opt.cost)
      return { success: false, message: `Servono €${opt.cost} per ${opt.name}.`, effects: {} }

    const key = `beauty_hair_${state.time.year}`
    const uses = state.diminishingReturns[key] ?? 0
    if (uses >= opt.annualLimit)
      return { success: false, message: 'Hai già fatto abbastanza trattamenti capelli quest\'anno.', effects: {} }

    return {
      success: true,
      message: `${opt.emoji} ${opt.name} eseguito! Aspetto migliorato.`,
      effects: { money: -opt.cost, looks: opt.looksBonus, happiness: 5 },
      updatedBeauty: { hairStyle: style, hairLastUpdatedYear: state.time.year },
    }
  }

  static doNails(style: NailsStyle, state: GameState): BeautyResult {
    const opt = NAILS_OPTIONS[style]
    if (style === 'none') return { success: false, message: 'Stile non valido.', effects: {} }
    if (state.finance.money < opt.cost)
      return { success: false, message: `Servono €${opt.cost}.`, effects: {} }

    const key = `beauty_nails_${state.time.year}`
    if ((state.diminishingReturns[key] ?? 0) >= 3)
      return { success: false, message: 'Hai già fatto abbastanza manicure quest\'anno.', effects: {} }

    return {
      success: true,
      message: `${opt.emoji} ${opt.name} eseguito!`,
      effects: { money: -opt.cost, looks: opt.looksBonus, happiness: 3 },
      updatedBeauty: { nailsStyle: style, nailsLastUpdatedYear: state.time.year },
    }
  }

  static upgradeWardrobe(tier: WardrobeTier, state: GameState): BeautyResult {
    const opt = WARDROBE_OPTIONS[tier]
    if (tier === 'none') return { success: false, message: 'Tier non valido.', effects: {} }
    const currentTiers: WardrobeTier[] = ['none', 'economy', 'medium', 'luxury', 'ultra_luxury']
    const currentIdx = currentTiers.indexOf(state.beauty.wardrobeTier)
    const newIdx = currentTiers.indexOf(tier)
    if (newIdx <= currentIdx)
      return { success: false, message: 'Hai già un guardaroba di questo livello o superiore.', effects: {} }
    if (state.finance.money < opt.cost)
      return { success: false, message: `Servono €${opt.cost.toLocaleString()} per il guardaroba ${opt.name}.`, effects: {} }

    return {
      success: true,
      message: `${opt.emoji} Guardaroba aggiornato a ${opt.name}! +aspetto +reputazione.`,
      effects: { money: -opt.cost, looks: opt.looksBonus, reputation: opt.reputationBonus, happiness: 8 },
      updatedBeauty: { wardrobeTier: tier, wardrobeLastUpdatedYear: state.time.year },
    }
  }

  static doSkincare(level: SkincareLevel, state: GameState): BeautyResult {
    const costs: Record<SkincareLevel, number> = { none: 0, basic: 200, advanced: 600, clinical: 2000 }
    const bonuses: Record<SkincareLevel, number> = { none: 0, basic: 3, advanced: 6, clinical: 10 }
    if (level === 'none') return { success: false, message: 'Livello non valido.', effects: {} }
    if (state.finance.money < costs[level])
      return { success: false, message: `Servono €${costs[level]} per la routine ${level}.`, effects: {} }

    return {
      success: true,
      message: `🧴 Routine skincare ${level} avviata! La tua pelle migliora nel tempo.`,
      effects: { money: -costs[level], looks: bonuses[level], happiness: 4 },
      updatedBeauty: { skincareLevel: level },
    }
  }

  static getBotox(state: GameState): BeautyResult {
    if (state.time.age < 30)
      return { success: false, message: 'Il botox è consigliato dai 30 anni in su.', effects: {} }
    if (state.beauty.botoxSessions >= 10)
      return { success: false, message: 'Hai raggiunto il limite massimo di sessioni botox (rischio medico).', effects: {} }
    const cost = 450
    if (state.finance.money < cost)
      return { success: false, message: `Servono €${cost} per il botox.`, effects: {} }

    const complicationRisk = Math.random() < 0.04 // 4% complication
    return {
      success: true,
      message: `💉 Botox eseguito!${complicationRisk ? ' ⚠️ Lieve complicazione — aspetto temporaneamente alterato.' : ' Rughe ridotte, aspetto ringiovanito.'}`,
      effects: { money: -cost, looks: complicationRisk ? -5 : 8, happiness: complicationRisk ? -5 : 6 },
      updatedBeauty: {
        hasBotox: true,
        botoxSessions: state.beauty.botoxSessions + 1,
      },
    }
  }

  static getLaserHairRemoval(state: GameState): BeautyResult {
    if (state.beauty.hasLaserHairRemoval)
      return { success: false, message: 'Hai già fatto la depilazione laser permanente.', effects: {} }
    const cost = 2500
    if (state.finance.money < cost)
      return { success: false, message: `Servono €${cost} per il ciclo completo di depilazione laser.`, effects: {} }

    return {
      success: true,
      message: '⚡ Ciclo di depilazione laser completato! Risultato permanente.',
      effects: { money: -cost, looks: 5, happiness: 8 },
      updatedBeauty: { hasLaserHairRemoval: true },
    }
  }

  static buyLuxuryItem(itemId: string, state: GameState): BeautyResult {
    const def = LUXURY_ITEMS.find(l => l.id === itemId)
    if (!def) return { success: false, message: 'Item non trovato.', effects: {} }
    if (state.finance.money < def.value)
      return { success: false, message: `Servono €${def.value.toLocaleString()} per ${def.name}.`, effects: {} }
    if (state.beauty.luxuryItems.some(i => i.id === itemId))
      return { success: false, message: 'Hai già questo accessorio.', effects: {} }

    const newItem: LuxuryAccessory = {
      id: itemId,
      name: def.name,
      emoji: def.emoji,
      brand: def.brand,
      purchaseYear: state.time.year,
      value: def.value,
      looksBonus: def.looksBonus,
      reputationBonus: def.reputationBonus,
    }

    return {
      success: true,
      message: `${def.emoji} Acquistato ${def.name} (${def.brand})! Classe elevata.`,
      effects: { money: -def.value, looks: def.looksBonus, socialReputation: def.reputationBonus, happiness: 12 },
      newItem,
    }
  }

  // Total looks modifier from all beauty items
  static getTotalLooksBonus(state: GameState): number {
    const b = state.beauty
    const hairBonus = HAIR_OPTIONS[b.hairStyle]?.looksBonus ?? 0
    const nailsBonus = NAILS_OPTIONS[b.nailsStyle]?.looksBonus ?? 0
    const wardrobeBonus = WARDROBE_OPTIONS[b.wardrobeTier]?.looksBonus ?? 0
    const skincareMap: Record<SkincareLevel, number> = { none: 0, basic: 3, advanced: 6, clinical: 10 }
    const skincareBonus = skincareMap[b.skincareLevel]
    const botoxBonus = b.hasBotox ? 5 : 0
    const laserBonus = b.hasLaserHairRemoval ? 3 : 0
    const accessoryBonus = b.luxuryItems.reduce((s, i) => s + i.looksBonus, 0)
    return hairBonus + nailsBonus + skincareBonus + botoxBonus + laserBonus + accessoryBonus + wardrobeBonus
  }

  static annualTick(state: GameState): { effects: Effect; updatedBeauty: Partial<BeautyState> } {
    const { beauty, time } = state
    let looksDecay = 0

    // Hair outdated: if not done in 2+ years
    const hairAge = time.year - beauty.hairLastUpdatedYear
    if (beauty.hairStyle !== 'none' && hairAge >= 2) looksDecay -= 3

    // Wardrobe outdated: 5+ years
    const wardrobeAge = time.year - beauty.wardrobeLastUpdatedYear
    if (beauty.wardrobeTier !== 'none' && wardrobeAge >= 5) looksDecay -= 5

    // Age-based looks decay (after 40)
    const ageLooksDecay = time.age > 40 ? -Math.round((time.age - 40) * 0.1) : 0

    // Botox partially counteracts age decay
    const botoxOffset = beauty.hasBotox ? 3 : 0

    return {
      effects: {
        looks: Math.min(0, looksDecay) + ageLooksDecay + botoxOffset,
      },
      updatedBeauty: {},
    }
  }
}
