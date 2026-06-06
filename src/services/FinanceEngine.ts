import type { GameState, Effect, Investment, Asset } from '../store/types'

export interface InvestmentDef {
  id: string
  name: string
  emoji: string
  type: 'stock' | 'bond' | 'crypto' | 'fund'
  minAmount: number
  expectedReturn: number
  volatility: number
  risk: 'low' | 'medium' | 'high' | 'extreme'
  lockYears: number
}

export interface FinanceActionResult {
  success: boolean
  message: string
  effects: Effect
  newInvestment?: Investment
  newAsset?: Asset
}

const INVESTMENT_DEFS: InvestmentDef[] = [
  { id: 'etf_global', name: 'ETF Azionario Globale', emoji: '📈', type: 'fund', minAmount: 1000, expectedReturn: 0.08, volatility: 0.15, risk: 'medium', lockYears: 0 },
  { id: 'bond_gov', name: 'BTP Governativi', emoji: '🏛️', type: 'bond', minAmount: 500, expectedReturn: 0.03, volatility: 0.03, risk: 'low', lockYears: 2 },
  { id: 'stock_tech', name: 'Azioni Tech', emoji: '💻', type: 'stock', minAmount: 500, expectedReturn: 0.15, volatility: 0.35, risk: 'high', lockYears: 0 },
  { id: 'bitcoin', name: 'Bitcoin', emoji: '₿', type: 'crypto', minAmount: 200, expectedReturn: 0.30, volatility: 0.80, risk: 'extreme', lockYears: 0 },
  { id: 'real_estate_fund', name: 'Fondo Immobiliare', emoji: '🏢', type: 'fund', minAmount: 5000, expectedReturn: 0.06, volatility: 0.08, risk: 'low', lockYears: 3 },
  { id: 'sp500', name: 'S&P 500 Index', emoji: '🇺🇸', type: 'fund', minAmount: 1000, expectedReturn: 0.10, volatility: 0.18, risk: 'medium', lockYears: 0 },
  { id: 'gold', name: 'Oro', emoji: '🥇', type: 'bond', minAmount: 1000, expectedReturn: 0.04, volatility: 0.12, risk: 'low', lockYears: 0 },
]

export type AssetType = 'car_economy' | 'car_medium' | 'car_luxury' | 'apartment' | 'house' | 'villa'

const ASSET_DEFS: Record<AssetType, { name: string; emoji: string; price: number; maintenancePerYear: number; appreciationRate: number; type: Asset['type'] }> = {
  car_economy:   { name: 'Auto economica',   emoji: '🚗', price: 8000,    maintenancePerYear: 700,   appreciationRate: -0.15, type: 'car' },
  car_medium:    { name: 'Auto media',        emoji: '🚙', price: 22000,   maintenancePerYear: 1200,  appreciationRate: -0.12, type: 'car' },
  car_luxury:    { name: 'Auto di lusso',     emoji: '🏎️', price: 70000,   maintenancePerYear: 4000,  appreciationRate: -0.10, type: 'car' },
  apartment:     { name: 'Appartamento',      emoji: '🏠', price: 180000,  maintenancePerYear: 1800,  appreciationRate: 0.03, type: 'house' },
  house:         { name: 'Casa',              emoji: '🏡', price: 320000,  maintenancePerYear: 3000,  appreciationRate: 0.03, type: 'house' },
  villa:         { name: 'Villa',             emoji: '🏰', price: 800000,  maintenancePerYear: 12000, appreciationRate: 0.04, type: 'house' },
}

const uid = () => Math.random().toString(36).slice(2, 10)

export function getAllInvestmentDefs(): InvestmentDef[] {
  return INVESTMENT_DEFS
}

export class FinanceEngine {
  static invest(defId: string, amount: number, state: GameState): FinanceActionResult {
    const def = INVESTMENT_DEFS.find(d => d.id === defId)
    if (!def) return { success: false, message: 'Investimento non trovato.', effects: {} }
    if (amount < def.minAmount) {
      return { success: false, message: `Importo minimo: €${def.minAmount.toLocaleString('it-IT')}.`, effects: {} }
    }
    if (state.finance.money < amount) {
      return { success: false, message: 'Fondi insufficienti.', effects: {} }
    }

    const newInvestment: Investment = {
      id: uid(),
      type: def.type,
      name: def.name,
      amount,
      currentValue: amount,
      purchaseDate: String(state.time.year),
    }

    return {
      success: true,
      message: `Investiti €${amount.toLocaleString('it-IT')} in ${def.name}. ${def.emoji}`,
      effects: { money: -amount },
      newInvestment,
    }
  }

  static sellInvestment(investmentId: string, state: GameState): FinanceActionResult {
    const inv = state.finance.investments.find(i => i.id === investmentId)
    if (!inv) return { success: false, message: 'Investimento non trovato.', effects: {} }

    const gain = inv.currentValue - inv.amount
    const capitalGainsTax = gain > 0 ? gain * 0.26 : 0

    return {
      success: true,
      message: `Venduto ${inv.name} per €${(inv.currentValue - capitalGainsTax).toLocaleString('it-IT')}. Plusvalenza: €${gain.toLocaleString('it-IT')}.`,
      effects: { money: inv.currentValue - capitalGainsTax },
    }
  }

  static buyAsset(assetType: AssetType, state: GameState): FinanceActionResult {
    const def = ASSET_DEFS[assetType]
    if (!def) return { success: false, message: 'Asset non trovato.', effects: {} }
    if (state.finance.money < def.price * 0.20) {
      return {
        success: false,
        message: `Servono almeno €${Math.round(def.price * 0.20).toLocaleString('it-IT')} (20% acconto).`,
        effects: {},
      }
    }

    const downPayment = Math.round(def.price * 0.20)
    const mortgage = def.type === 'house' ? def.price - downPayment : 0

    const newAsset: Asset = {
      id: uid(),
      type: def.type,
      name: def.name,
      value: def.price,
      purchaseValue: def.price,
      purchaseYear: state.time.year,
      maintenanceCost: def.maintenancePerYear,
    }

    return {
      success: true,
      message: `${def.name} acquistata per €${def.price.toLocaleString('it-IT')}! ${def.emoji} ${mortgage > 0 ? `Mutuo: €${mortgage.toLocaleString('it-IT')}.` : ''}`,
      effects: { money: -downPayment, happiness: 15, reputation: 5 },
      newAsset,
    }
  }

  static annualTick(state: GameState): { effects: Effect; updatedInvestments: Investment[]; updatedAssets: Asset[] } {
    const effects: Effect = {}
    const updatedInvestments: Investment[] = []
    const updatedAssets: Asset[] = []

    // Investment returns
    for (const inv of state.finance.investments) {
      const def = INVESTMENT_DEFS.find(d => d.name === inv.name)
      if (!def) {
        updatedInvestments.push(inv)
        continue
      }
      const annualReturn = def.expectedReturn + (Math.random() - 0.5) * def.volatility * 2
      const newValue = Math.max(0, Math.round(inv.currentValue * (1 + annualReturn)))
      updatedInvestments.push({ ...inv, currentValue: newValue })
    }

    // Asset appreciation/depreciation + maintenance
    for (const asset of state.finance.assets) {
      const defKey = Object.entries(ASSET_DEFS).find(([, d]) => d.name === asset.name)?.[0] as AssetType | undefined
      const def = defKey ? ASSET_DEFS[defKey] : null
      const appreciation = def?.appreciationRate ?? -0.10
      const newValue = Math.max(100, Math.round(asset.value * (1 + appreciation)))
      effects.money = (effects.money ?? 0) - asset.maintenanceCost
      updatedAssets.push({ ...asset, value: newValue })
    }

    // Mortgage payment (3% of remaining per year approx)
    if (state.finance.debt > 0) {
      const interest = Math.round(state.finance.debt * 0.04)
      effects.money = (effects.money ?? 0) - interest
    }

    return { effects, updatedInvestments, updatedAssets }
  }

  static calculateCreditScore(state: GameState): number {
    let score = 650
    const { finance, criminal, time } = state

    // Payment history (35%) — having a job = regular payments
    if (state.career.currentJob) score += 50
    if (finance.debt === 0) score += 30

    // Credit utilization (30%)
    const utilization = finance.debt / Math.max(1, finance.bankBalance + finance.money)
    if (utilization < 0.1) score += 80
    else if (utilization < 0.3) score += 40
    else if (utilization > 0.8) score -= 80

    // Length of credit history (15%)
    score += Math.min(60, time.age * 1.5)

    // Criminal record (penalty)
    if (criminal.hasRecord) score -= 80
    if (criminal.inPrison) score -= 150

    // Wealth bonus
    if (finance.money > 50000) score += 40
    if (finance.investments.length > 0) score += 20

    return Math.round(Math.min(850, Math.max(300, score)))
  }

  static takeLoan(amount: number, state: GameState): FinanceActionResult {
    const score = this.calculateCreditScore(state)
    if (score < 500) {
      return { success: false, message: 'Credit score troppo basso per ottenere un prestito.', effects: {} }
    }
    if (state.finance.debt > state.finance.money * 3) {
      return { success: false, message: 'Hai già troppi debiti.', effects: {} }
    }
    const interestRate = score >= 750 ? 0.05 : score >= 650 ? 0.09 : 0.14
    return {
      success: true,
      message: `Prestito di €${amount.toLocaleString('it-IT')} approvato (tasso ${(interestRate * 100).toFixed(1)}%).`,
      effects: { money: amount },
    }
  }
}
