import type { GameState, Effect, Investment, Asset, MarketAsset, MarketEvent, MarketSentiment, MarketState } from '../store/types'

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
  updatedAsset?: Asset
}

const BASE_MARKET_ASSETS: MarketAsset[] = [
  { symbol: 'WRLD', name: 'ETF Azionario Globale', emoji: '📈', type: 'fund', price: 100, previousPrice: 100, expectedReturn: 0.08, volatility: 0.15, risk: 'medium', sector: 'global' },
  { symbol: 'BTP', name: 'BTP Governativi', emoji: '🏛️', type: 'bond', price: 100, previousPrice: 100, expectedReturn: 0.03, volatility: 0.03, risk: 'low', sector: 'bond' },
  { symbol: 'TECH', name: 'Azioni Tech', emoji: '💻', type: 'stock', price: 75, previousPrice: 75, expectedReturn: 0.15, volatility: 0.35, risk: 'high', sector: 'tech' },
  { symbol: 'BTC', name: 'Bitcoin', emoji: '₿', type: 'crypto', price: 50, previousPrice: 50, expectedReturn: 0.30, volatility: 0.80, risk: 'extreme', sector: 'crypto' },
  { symbol: 'REIT', name: 'Fondo Immobiliare', emoji: '🏢', type: 'fund', price: 120, previousPrice: 120, expectedReturn: 0.06, volatility: 0.08, risk: 'low', sector: 'real_estate' },
  { symbol: 'SPY', name: 'S&P 500 Index', emoji: '🇺🇸', type: 'fund', price: 110, previousPrice: 110, expectedReturn: 0.10, volatility: 0.18, risk: 'medium', sector: 'usa' },
  { symbol: 'GLD', name: 'Oro', emoji: '🥇', type: 'bond', price: 95, previousPrice: 95, expectedReturn: 0.04, volatility: 0.12, risk: 'low', sector: 'commodity' },
]

const INVESTMENT_DEFS: InvestmentDef[] = [
  { id: 'WRLD', name: 'ETF Azionario Globale', emoji: '📈', type: 'fund', minAmount: 1000, expectedReturn: 0.08, volatility: 0.15, risk: 'medium', lockYears: 0 },
  { id: 'BTP', name: 'BTP Governativi', emoji: '🏛️', type: 'bond', minAmount: 500, expectedReturn: 0.03, volatility: 0.03, risk: 'low', lockYears: 2 },
  { id: 'TECH', name: 'Azioni Tech', emoji: '💻', type: 'stock', minAmount: 500, expectedReturn: 0.15, volatility: 0.35, risk: 'high', lockYears: 0 },
  { id: 'BTC', name: 'Bitcoin', emoji: '₿', type: 'crypto', minAmount: 200, expectedReturn: 0.30, volatility: 0.80, risk: 'extreme', lockYears: 0 },
  { id: 'REIT', name: 'Fondo Immobiliare', emoji: '🏢', type: 'fund', minAmount: 5000, expectedReturn: 0.06, volatility: 0.08, risk: 'low', lockYears: 3 },
  { id: 'SPY', name: 'S&P 500 Index', emoji: '🇺🇸', type: 'fund', minAmount: 1000, expectedReturn: 0.10, volatility: 0.18, risk: 'medium', lockYears: 0 },
  { id: 'GLD', name: 'Oro', emoji: '🥇', type: 'bond', minAmount: 1000, expectedReturn: 0.04, volatility: 0.12, risk: 'low', lockYears: 0 },
]

export type AssetType =
  | 'car_economy'
  | 'car_medium'
  | 'car_luxury'
  | 'apartment'
  | 'house'
  | 'villa'
  | 'watch_luxury'
  | 'designer_collection'
  | 'art_collection'
  | 'yacht'
  | 'private_jet'

export interface AssetDef {
  id: AssetType
  name: string
  emoji: string
  price: number
  maintenancePerYear: number
  appreciationRate: number
  type: Asset['type']
  category: NonNullable<Asset['category']>
  statusBonus: number
  theftRisk: number
  insurancePerYear: number
  minAge?: number
}

const ASSET_DEFS: Record<AssetType, AssetDef> = {
  car_economy: { id: 'car_economy', name: 'Auto economica', emoji: '🚗', price: 8000, maintenancePerYear: 700, appreciationRate: -0.15, type: 'car', category: 'vehicle', statusBonus: 1, theftRisk: 0.01, insurancePerYear: 450, minAge: 18 },
  car_medium: { id: 'car_medium', name: 'Auto media', emoji: '🚙', price: 22000, maintenancePerYear: 1200, appreciationRate: -0.12, type: 'car', category: 'vehicle', statusBonus: 2, theftRisk: 0.015, insurancePerYear: 850, minAge: 18 },
  car_luxury: { id: 'car_luxury', name: 'Auto di lusso', emoji: '🏎️', price: 70000, maintenancePerYear: 4000, appreciationRate: -0.09, type: 'car', category: 'luxury', statusBonus: 7, theftRisk: 0.04, insurancePerYear: 3200, minAge: 18 },
  apartment: { id: 'apartment', name: 'Appartamento', emoji: '🏠', price: 180000, maintenancePerYear: 1800, appreciationRate: 0.03, type: 'house', category: 'property', statusBonus: 4, theftRisk: 0.005, insurancePerYear: 900, minAge: 18 },
  house: { id: 'house', name: 'Casa', emoji: '🏡', price: 320000, maintenancePerYear: 3000, appreciationRate: 0.03, type: 'house', category: 'property', statusBonus: 6, theftRisk: 0.006, insurancePerYear: 1400, minAge: 18 },
  villa: { id: 'villa', name: 'Villa', emoji: '🏰', price: 800000, maintenancePerYear: 12000, appreciationRate: 0.04, type: 'house', category: 'property', statusBonus: 12, theftRisk: 0.01, insurancePerYear: 5200, minAge: 18 },
  watch_luxury: { id: 'watch_luxury', name: 'Orologio di lusso', emoji: '⌚', price: 18000, maintenancePerYear: 300, appreciationRate: 0.04, type: 'luxury', category: 'collectible', statusBonus: 4, theftRisk: 0.06, insurancePerYear: 600, minAge: 18 },
  designer_collection: { id: 'designer_collection', name: 'Collezione designer', emoji: '👜', price: 35000, maintenancePerYear: 900, appreciationRate: 0.02, type: 'luxury', category: 'luxury', statusBonus: 6, theftRisk: 0.05, insurancePerYear: 1200, minAge: 18 },
  art_collection: { id: 'art_collection', name: 'Collezione d’arte', emoji: '🖼️', price: 120000, maintenancePerYear: 2500, appreciationRate: 0.07, type: 'luxury', category: 'collectible', statusBonus: 10, theftRisk: 0.035, insurancePerYear: 3500, minAge: 18 },
  yacht: { id: 'yacht', name: 'Yacht', emoji: '🛥️', price: 950000, maintenancePerYear: 70000, appreciationRate: -0.08, type: 'luxury', category: 'watercraft', statusBonus: 18, theftRisk: 0.018, insurancePerYear: 28000, minAge: 21 },
  private_jet: { id: 'private_jet', name: 'Jet privato', emoji: '🛩️', price: 4500000, maintenancePerYear: 260000, appreciationRate: -0.11, type: 'luxury', category: 'luxury', statusBonus: 25, theftRisk: 0.008, insurancePerYear: 90000, minAge: 25 },
}

const uid = () => Math.random().toString(36).slice(2, 10)

const SENTIMENT_IMPACT: Record<MarketSentiment, number> = {
  crash: -0.28,
  bear: -0.08,
  neutral: 0,
  bull: 0.08,
  mania: 0.22,
}

export function getAllInvestmentDefs(): InvestmentDef[] {
  return INVESTMENT_DEFS
}

export function getAllAssetDefs(): AssetDef[] {
  return Object.values(ASSET_DEFS)
}

export class FinanceEngine {
  static initialMarketState(): MarketState {
    return {
      sentiment: 'neutral',
      assets: BASE_MARKET_ASSETS.map(asset => ({ ...asset })),
      events: [],
    }
  }

  static ensureMarket(state: Partial<MarketState> | undefined): MarketState {
    const currentAssets = state?.assets ?? []
    const assets = BASE_MARKET_ASSETS.map(base => {
      const existing = currentAssets.find(asset => asset.symbol === base.symbol || asset.name === base.name)
      return existing ? { ...base, ...existing } : { ...base }
    })
    return {
      sentiment: state?.sentiment ?? 'neutral',
      assets,
      events: state?.events ?? [],
    }
  }

  static invest(defId: string, amount: number, state: GameState): FinanceActionResult {
    const def = INVESTMENT_DEFS.find(d => d.id === defId)
    if (!def) return { success: false, message: 'Investimento non trovato.', effects: {} }
    if (amount < def.minAmount) {
      return { success: false, message: `Importo minimo: €${def.minAmount.toLocaleString('it-IT')}.`, effects: {} }
    }
    if (state.finance.money < amount) {
      return { success: false, message: 'Fondi insufficienti.', effects: {} }
    }
    const market = FinanceEngine.ensureMarket(state.market)
    const asset = market.assets.find(a => a.symbol === def.id || a.name === def.name)
    const price = asset?.price ?? 100
    const shares = amount / price

    const newInvestment: Investment = {
      id: uid(),
      type: def.type,
      name: def.name,
      amount,
      currentValue: amount,
      purchaseDate: String(state.time.year),
      symbol: def.id,
      shares,
      purchasePrice: price,
    }

    return {
      success: true,
      message: `Investiti €${amount.toLocaleString('it-IT')} in ${def.name}. ${def.emoji} Prezzo: €${price.toFixed(2)}.`,
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
    if (def.minAge && state.time.age < def.minAge) {
      return { success: false, message: `Devi avere almeno ${def.minAge} anni per acquistare ${def.name}.`, effects: {} }
    }
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
      emoji: def.emoji,
      category: def.category,
      value: def.price,
      purchaseValue: def.price,
      purchaseYear: state.time.year,
      maintenanceCost: def.maintenancePerYear,
      insured: false,
      condition: 100,
      statusBonus: def.statusBonus,
      theftRisk: def.theftRisk,
    }

    return {
      success: true,
      message: `${def.name} acquistata per €${def.price.toLocaleString('it-IT')}! ${def.emoji} ${mortgage > 0 ? `Mutuo: €${mortgage.toLocaleString('it-IT')}.` : ''}`,
      effects: { money: -downPayment, happiness: Math.min(20, 8 + def.statusBonus), reputation: def.statusBonus },
      newAsset,
    }
  }

  static insureAsset(assetId: string, state: GameState): FinanceActionResult {
    const asset = state.finance.assets.find(a => a.id === assetId)
    if (!asset) return { success: false, message: 'Asset non trovato.', effects: {} }
    if (asset.insured) return { success: false, message: `${asset.name} è già assicurato.`, effects: {} }
    const def = FinanceEngine.findAssetDef(asset)
    const yearlyCost = def?.insurancePerYear ?? Math.max(300, Math.round(asset.value * 0.015))
    if (state.finance.money < yearlyCost) {
      return { success: false, message: `Servono €${yearlyCost.toLocaleString('it-IT')} per assicurare ${asset.name}.`, effects: {} }
    }
    return {
      success: true,
      message: `${asset.emoji ?? '🛡️'} ${asset.name} assicurato. Premio annuo: €${yearlyCost.toLocaleString('it-IT')}.`,
      effects: { money: -yearlyCost, happiness: 2 },
      updatedAsset: { ...asset, insured: true },
    }
  }

  static maintainAsset(assetId: string, state: GameState): FinanceActionResult {
    const asset = state.finance.assets.find(a => a.id === assetId)
    if (!asset) return { success: false, message: 'Asset non trovato.', effects: {} }
    const currentCondition = asset.condition ?? 100
    if (currentCondition >= 95) return { success: false, message: `${asset.name} è già in ottime condizioni.`, effects: {} }
    const cost = Math.max(250, Math.round(asset.maintenanceCost * (1 + (100 - currentCondition) / 80)))
    if (state.finance.money < cost) {
      return { success: false, message: `Servono €${cost.toLocaleString('it-IT')} per la manutenzione.`, effects: {} }
    }
    const repairedCondition = Math.min(100, currentCondition + 28)
    const recoveredValue = Math.round(asset.purchaseValue * ((repairedCondition - currentCondition) / 100) * 0.18)
    return {
      success: true,
      message: `${asset.emoji ?? '🛠️'} Manutenzione completata su ${asset.name}. Condizione ${repairedCondition}/100.`,
      effects: { money: -cost, happiness: 3 },
      updatedAsset: { ...asset, condition: repairedCondition, value: asset.value + recoveredValue },
    }
  }

  static annualTick(state: GameState): { effects: Effect; updatedInvestments: Investment[]; updatedAssets: Asset[]; updatedMarket: MarketState; marketMessages: string[]; assetMessages: string[] } {
    const effects: Effect = {}
    const updatedInvestments: Investment[] = []
    const updatedAssets: Asset[] = []
    const assetMessages: string[] = []
    const market = FinanceEngine.ensureMarket(state.market)
    const { updatedMarket, messages } = FinanceEngine.tickMarket(market, state.time.year)

    // Investment returns
    for (const inv of state.finance.investments) {
      const asset = updatedMarket.assets.find(a => a.symbol === inv.symbol || a.name === inv.name)
      if (!asset) {
        const def = INVESTMENT_DEFS.find(d => d.name === inv.name)
        const annualReturn = def ? def.expectedReturn + (Math.random() - 0.5) * def.volatility * 2 : 0
        updatedInvestments.push({ ...inv, currentValue: Math.max(0, Math.round(inv.currentValue * (1 + annualReturn))) })
        continue
      }
      const shares = inv.shares ?? inv.currentValue / Math.max(1, asset.previousPrice)
      const newValue = Math.max(0, Math.round(shares * asset.price))
      updatedInvestments.push({ ...inv, symbol: asset.symbol, shares, currentValue: newValue })
    }

    // Asset appreciation/depreciation + maintenance
    for (const asset of state.finance.assets) {
      const def = FinanceEngine.findAssetDef(asset)
      const appreciation = def?.appreciationRate ?? -0.10
      const condition = asset.condition ?? 100
      const conditionDecay = FinanceEngine.assetConditionDecay(asset)
      const nextCondition = Math.max(0, condition - conditionDecay)
      const conditionMultiplier = Math.max(0.35, 0.7 + nextCondition / 333)
      const insuranceCost = asset.insured ? (def?.insurancePerYear ?? Math.max(300, Math.round(asset.value * 0.015))) : 0
      const maintenancePenalty = nextCondition < 45 ? Math.round(asset.maintenanceCost * 0.5) : 0
      const annualCost = asset.maintenanceCost + insuranceCost + maintenancePenalty
      let newValue = Math.max(100, Math.round(asset.value * (1 + appreciation) * conditionMultiplier))
      const theftRisk = asset.insured ? (asset.theftRisk ?? def?.theftRisk ?? 0) * 0.2 : (asset.theftRisk ?? def?.theftRisk ?? 0)
      let theftHit = false

      if (theftRisk > 0 && Math.random() < theftRisk) {
        theftHit = true
        if (asset.insured) {
          const deductible = Math.round(Math.min(asset.value * 0.04, 12000))
          effects.money = (effects.money ?? 0) - deductible
          assetMessages.push(`🛡️ Tentato furto su ${asset.name}: assicurazione attivata, franchigia €${deductible.toLocaleString('it-IT')}.`)
        } else {
          const loss = Math.round(newValue * 0.35)
          newValue = Math.max(100, newValue - loss)
          effects.happiness = (effects.happiness ?? 0) - 8
          assetMessages.push(`🚨 Furto/danno su ${asset.name}: valore ridotto di €${loss.toLocaleString('it-IT')}.`)
        }
      }

      effects.money = (effects.money ?? 0) - annualCost
      if (nextCondition < 35 && !theftHit) {
        assetMessages.push(`🛠️ ${asset.name} è in cattive condizioni (${nextCondition}/100): manutenzione consigliata.`)
      }
      updatedAssets.push({
        ...asset,
        emoji: asset.emoji ?? def?.emoji,
        category: asset.category ?? def?.category,
        condition: nextCondition,
        statusBonus: asset.statusBonus ?? def?.statusBonus,
        theftRisk: asset.theftRisk ?? def?.theftRisk,
        value: newValue,
      })
    }

    // Mortgage payment (3% of remaining per year approx)
    if (state.finance.debt > 0) {
      const interest = Math.round(state.finance.debt * 0.04)
      effects.money = (effects.money ?? 0) - interest
    }

    return { effects, updatedInvestments, updatedAssets, updatedMarket, marketMessages: messages, assetMessages }
  }

  private static findAssetDef(asset: Asset): AssetDef | null {
    return Object.values(ASSET_DEFS).find(def => def.name === asset.name) ?? null
  }

  private static assetConditionDecay(asset: Asset): number {
    switch (asset.category) {
      case 'property': return 2
      case 'collectible': return 1
      case 'watercraft': return 8
      case 'luxury': return 6
      case 'vehicle': return 7
      default: return asset.type === 'house' ? 2 : asset.type === 'car' ? 7 : 4
    }
  }

  private static tickMarket(market: MarketState, year: number): { updatedMarket: MarketState; messages: string[] } {
    const roll = Math.random()
    let sentiment: MarketSentiment = 'neutral'
    let event: MarketEvent | null = null

    if (roll < 0.04) {
      sentiment = 'crash'
      event = { id: `market_${year}_crash`, year, title: 'Crollo dei mercati', description: 'Paura globale e vendite di massa colpiscono azioni e crypto.', emoji: '📉', impact: -0.35 }
    } else if (roll < 0.14) {
      sentiment = 'bear'
      event = { id: `market_${year}_bear`, year, title: 'Mercato ribassista', description: 'Gli investitori riducono il rischio e cercano asset difensivi.', emoji: '🐻', impact: -0.12 }
    } else if (roll > 0.96) {
      sentiment = 'mania'
      event = { id: `market_${year}_mania`, year, title: 'Mania speculativa', description: 'Un’ondata di euforia gonfia tech e crypto.', emoji: '🚀', impact: 0.28 }
    } else if (roll > 0.78) {
      sentiment = 'bull'
      event = { id: `market_${year}_bull`, year, title: 'Mercato rialzista', description: 'Economia forte e fiducia spingono i mercati.', emoji: '🐂', impact: 0.11 }
    }

    const macroImpact = SENTIMENT_IMPACT[sentiment]
    const assets = market.assets.map(asset => {
      const sectorBoost =
        sentiment === 'mania' && (asset.sector === 'tech' || asset.sector === 'crypto') ? 0.18 :
        sentiment === 'crash' && asset.risk === 'low' ? 0.12 :
        sentiment === 'bear' && asset.sector === 'commodity' ? 0.08 :
        0
      const randomMove = (Math.random() - 0.5) * asset.volatility * 2
      const move = asset.expectedReturn + macroImpact + sectorBoost + randomMove
      const nextPrice = Math.max(1, Number((asset.price * (1 + move)).toFixed(2)))
      return { ...asset, previousPrice: asset.price, price: nextPrice }
    })

    return {
      updatedMarket: {
        sentiment,
        assets,
        events: event ? [event, ...market.events].slice(0, 20) : market.events.slice(0, 20),
      },
      messages: event ? [`${event.emoji} ${event.title}: ${event.description}`] : [],
    }
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
