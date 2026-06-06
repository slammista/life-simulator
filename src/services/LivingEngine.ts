import type { GameState, LivingType } from '../store/types'

export interface LivingOption {
  type: LivingType
  label: string
  emoji: string
  description: string
  monthlyCost: number
  upfrontCost: number
  minAge: number
  minIncome: number
  minCreditScore: number
  requiresHousePrice?: boolean
}

export interface LivingUpgradeResult {
  success: boolean
  message: string
  effects: Record<string, number>
  updatedLiving?: Partial<{
    type: LivingType
    location: string
    monthlyCost: number
    mortgageRemaining: number
    propertyValue: number
    roommates: string[]
  }>
}

export const LIVING_OPTIONS: LivingOption[] = [
  {
    type: 'parents',
    label: 'Con i Genitori',
    emoji: '🏠',
    description: 'Vivi con la famiglia di origine. Nessuna spesa mensile.',
    monthlyCost: 0,
    upfrontCost: 0,
    minAge: 0,
    minIncome: 0,
    minCreditScore: 0,
  },
  {
    type: 'dormitory',
    label: 'Dormitorio Universitario',
    emoji: '🏫',
    description: 'Stanza in dormitorio universitario. Economico ma condiviso.',
    monthlyCost: 600,
    upfrontCost: 600,
    minAge: 18,
    minIncome: 0,
    minCreditScore: 0,
  },
  {
    type: 'roommate',
    label: 'Coinquilino',
    emoji: '👥',
    description: 'Appartamento condiviso con coinquilini. Costi ridotti.',
    monthlyCost: 450,
    upfrontCost: 900,
    minAge: 18,
    minIncome: 800,
    minCreditScore: 0,
  },
  {
    type: 'renting',
    label: 'Affitto Indipendente',
    emoji: '🔑',
    description: 'Appartamento in affitto tutto per te. Libertà totale.',
    monthlyCost: 900,
    upfrontCost: 1800,
    minAge: 18,
    minIncome: 1500,
    minCreditScore: 0,
  },
]

export const HOUSE_PRICES = [
  { id: 'small',  label: 'Appartamento piccolo', emoji: '🏢', price: 120000, maintenance: 200 },
  { id: 'medium', label: 'Appartamento medio',   emoji: '🏠', price: 200000, maintenance: 350 },
  { id: 'large',  label: 'Casa grande',           emoji: '🏡', price: 350000, maintenance: 600 },
  { id: 'villa',  label: 'Villa',                 emoji: '🏰', price: 800000, maintenance: 1500 },
]

export class LivingEngine {
  static canUpgrade(
    targetType: LivingType,
    state: GameState,
  ): { canUpgrade: boolean; reason: string } {
    if (targetType === state.living.type) {
      return { canUpgrade: false, reason: 'Sei già in questa situazione abitativa.' }
    }
    const opt = LIVING_OPTIONS.find(o => o.type === targetType)
    if (!opt) {
      return { canUpgrade: false, reason: 'Opzione non disponibile.' }
    }
    if (state.time.age < opt.minAge) {
      return { canUpgrade: false, reason: `Devi avere almeno ${opt.minAge} anni.` }
    }
    if (state.finance.monthlyIncome < opt.minIncome) {
      return { canUpgrade: false, reason: `Serve un reddito mensile di almeno €${opt.minIncome}.` }
    }
    if (state.finance.money < opt.upfrontCost) {
      return { canUpgrade: false, reason: `Servono €${opt.upfrontCost} per deposito/anticipo.` }
    }
    return { canUpgrade: true, reason: '' }
  }

  static upgradeLiving(targetType: LivingType, state: GameState): LivingUpgradeResult {
    const { canUpgrade, reason } = LivingEngine.canUpgrade(targetType, state)
    if (!canUpgrade) {
      return { success: false, message: reason, effects: {} }
    }
    const opt = LIVING_OPTIONS.find(o => o.type === targetType)!
    const effects: Record<string, number> = { money: -opt.upfrontCost }

    const msgs: Record<LivingType, string> = {
      parents:   'Sei tornato a vivere con i genitori.',
      dormitory: `Hai preso una stanza al dormitorio. (€${opt.upfrontCost} deposito)`,
      roommate:  `Hai trovato un appartamento condiviso con coinquilini. (€${opt.upfrontCost} anticipo)`,
      renting:   `Hai preso un appartamento in affitto. (€${opt.upfrontCost} deposito)`,
      owning:    'Acquisto completato.',
      homeless:  'Sei rimasto senza casa.',
      prison:    '',
    }

    const happinessBonus: Partial<Record<LivingType, number>> = {
      dormitory: 5,
      roommate: 3,
      renting: 8,
      parents: -3,
    }
    if (happinessBonus[targetType]) {
      effects.happiness = happinessBonus[targetType]!
    }

    return {
      success: true,
      message: msgs[targetType],
      effects,
      updatedLiving: {
        type: targetType,
        monthlyCost: opt.monthlyCost,
        mortgageRemaining: 0,
        propertyValue: 0,
        roommates: targetType === 'roommate' ? ['Coinquilino 1'] : [],
      },
    }
  }

  static canBuyHouse(
    houseId: string,
    state: GameState,
  ): { canBuy: boolean; reason: string; monthlyPayment: number; interestRate: number } {
    const house = HOUSE_PRICES.find(h => h.id === houseId)
    if (!house) return { canBuy: false, reason: 'Casa non trovata.', monthlyPayment: 0, interestRate: 0 }

    if (state.time.age < 18) return { canBuy: false, reason: 'Devi avere almeno 18 anni.', monthlyPayment: 0, interestRate: 0 }

    const creditScore = state.finance.creditScore
    if (creditScore < 580) {
      return { canBuy: false, reason: `Credit score ${creditScore} troppo basso (minimo 580).`, monthlyPayment: 0, interestRate: 0 }
    }

    const downPayment = Math.round(house.price * 0.20)
    if (state.finance.money < downPayment) {
      return {
        canBuy: false,
        reason: `Servono €${downPayment.toLocaleString()} di anticipo (20%).`,
        monthlyPayment: 0,
        interestRate: 0,
      }
    }

    const rate = creditScore >= 800 ? 0.04 : creditScore >= 740 ? 0.05 : creditScore >= 670 ? 0.07 : 0.10
    const loanAmount = house.price - downPayment
    const monthlyPayment = Math.round((loanAmount * (rate / 12)) / (1 - Math.pow(1 + rate / 12, -300)))

    return { canBuy: true, reason: '', monthlyPayment, interestRate: rate }
  }

  static buyHouse(houseId: string, state: GameState): LivingUpgradeResult {
    const house = HOUSE_PRICES.find(h => h.id === houseId)
    if (!house) return { success: false, message: 'Casa non trovata.', effects: {} }

    const { canBuy, reason, monthlyPayment, interestRate } = LivingEngine.canBuyHouse(houseId, state)
    if (!canBuy) return { success: false, message: reason, effects: {} }

    const downPayment = Math.round(house.price * 0.20)
    const loanAmount = house.price - downPayment
    const mortgageYears = 25

    const effects: Record<string, number> = {
      money: -downPayment,
      happiness: 15,
      reputation: 5,
    }

    return {
      success: true,
      message: `🏠 Hai acquistato "${house.label}" per €${house.price.toLocaleString()}! Anticipo €${downPayment.toLocaleString()}, mutuo ${(interestRate * 100).toFixed(1)}% per ${mortgageYears} anni, rata €${monthlyPayment.toLocaleString()}/mese.`,
      effects,
      updatedLiving: {
        type: 'owning',
        monthlyCost: monthlyPayment + house.maintenance,
        mortgageRemaining: loanAmount,
        propertyValue: house.price,
        roommates: [],
      },
    }
  }

  static getLivingStatusLabel(type: LivingType): string {
    const labels: Record<LivingType, string> = {
      parents:   'Con i Genitori',
      dormitory: 'Dormitorio',
      roommate:  'Coinquilino',
      renting:   'In Affitto',
      owning:    'Proprietario',
      homeless:  'Senza Casa',
      prison:    'In Prigione',
    }
    return labels[type] ?? type
  }

  static getLivingEmoji(type: LivingType): string {
    const emojis: Record<LivingType, string> = {
      parents:   '🏠',
      dormitory: '🏫',
      roommate:  '👥',
      renting:   '🔑',
      owning:    '🏡',
      homeless:  '⛺',
      prison:    '⛓️',
    }
    return emojis[type] ?? '🏠'
  }
}
