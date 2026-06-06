import type { GameState, Effect } from '../store/types'

export interface CreditScoreResult {
  newScore: number
  delta: number
  factors: CreditFactor[]
  tier: CreditTier
  maxLoanAmount: number
  interestRate: number
  creditCardLimit: number
}

export interface CreditFactor {
  name: string
  impact: number
  description: string
}

export type CreditTier = 'poor' | 'fair' | 'good' | 'very_good' | 'excellent'

const TIER_MAP: { range: [number, number]; tier: CreditTier; label: string; rate: number; maxLoan: number; cardLimit: number }[] = [
  { range: [300, 579], tier: 'poor',      label: 'Scarso',     rate: 0.20, maxLoan: 0,       cardLimit: 0 },
  { range: [580, 669], tier: 'fair',      label: 'Discreto',   rate: 0.15, maxLoan: 5000,    cardLimit: 1000 },
  { range: [670, 739], tier: 'good',      label: 'Buono',      rate: 0.10, maxLoan: 50000,   cardLimit: 5000 },
  { range: [740, 799], tier: 'very_good', label: 'Ottimo',     rate: 0.07, maxLoan: 200000,  cardLimit: 20000 },
  { range: [800, 850], tier: 'excellent', label: 'Eccellente', rate: 0.04, maxLoan: 1000000, cardLimit: 50000 },
]

export function getCreditTierInfo(score: number) {
  return TIER_MAP.find(t => score >= t.range[0] && score <= t.range[1]) ?? TIER_MAP[0]
}

export class CreditScoreEngine {
  static annualTick(state: GameState): { effects: Effect; updatedScore: number; factors: CreditFactor[] } {
    const score = state.finance.creditScore
    const factors: CreditFactor[] = []
    let delta = 0

    // 1. Payment history (35%) — pay debts on time is positive
    const hasDebt = state.finance.debt > 0
    const hasStudentLoan = state.education.studentLoan > 0
    const debtRatio = state.finance.debt / Math.max(1, state.finance.money + state.finance.debt)

    if (!hasDebt && !hasStudentLoan) {
      const gain = 8
      delta += gain
      factors.push({ name: 'Pagamenti puntuali', impact: gain, description: 'Nessun debito insoluto' })
    } else if (debtRatio > 0.8) {
      const loss = -15
      delta += loss
      factors.push({ name: 'Debiti elevati', impact: loss, description: 'Rapporto debito/patrimonio critico' })
    } else if (debtRatio > 0.5) {
      const loss = -5
      delta += loss
      factors.push({ name: 'Debiti moderati', impact: loss, description: 'Rapporto debito/patrimonio alto' })
    } else {
      const gain = 4
      delta += gain
      factors.push({ name: 'Debiti gestibili', impact: gain, description: 'Rapporto debito/patrimonio accettabile' })
    }

    // 2. Credit utilization (30%) — balance relative to income
    const monthlyIncome = state.finance.monthlyIncome
    if (monthlyIncome > 0) {
      const utilization = state.finance.monthlyExpenses / monthlyIncome
      if (utilization < 0.3) {
        const gain = 10
        delta += gain
        factors.push({ name: 'Spese basse', impact: gain, description: 'Utilizzo credito < 30%' })
      } else if (utilization > 0.8) {
        const loss = -8
        delta += loss
        factors.push({ name: 'Spese eccessive', impact: loss, description: 'Utilizzo credito > 80%' })
      }
    }

    // 3. Credit history length (15%) — older = better
    const age = state.time.age
    if (age >= 40) {
      const gain = 5
      delta += gain
      factors.push({ name: 'Storico lungo', impact: gain, description: 'Molti anni di storico creditizio' })
    } else if (age >= 25) {
      const gain = 2
      delta += gain
      factors.push({ name: 'Storico medio', impact: gain, description: 'Storico creditizio in crescita' })
    }

    // 4. Credit mix (10%) — having mortgage or investments is positive
    const hasMortgage = state.finance.assets.some(a => a.type === 'house' && a.purchaseValue > 0)
    const hasInvestments = state.finance.investments.length > 0
    if (hasMortgage || hasInvestments) {
      const gain = 4
      delta += gain
      factors.push({ name: 'Mix crediti', impact: gain, description: 'Diversità tipologie creditizie' })
    }

    // 5. New credit (10%) — criminal record or bankrupty is negative
    const hasCriminalRecord = state.criminal.hasRecord
    const wasInPrison = state.criminal.prisonServed > 0
    if (hasCriminalRecord || wasInPrison) {
      const loss = -10
      delta += loss
      factors.push({ name: 'Fedina penale', impact: loss, description: 'Fedina penale compromessa' })
    }

    // 6. Bankruptcy — debt very high and can't pay
    if (state.finance.debt > state.finance.money * 3 && state.finance.money < 5000) {
      const loss = -50
      delta += loss
      factors.push({ name: 'Insolvenza', impact: loss, description: 'Debiti insostenibili rispetto al patrimonio' })
    }

    // 7. Positive payment if salary is regular
    if (state.career.currentJob !== null && state.finance.monthlyIncome > 1000) {
      const gain = 3
      delta += gain
      factors.push({ name: 'Reddito stabile', impact: gain, description: 'Lavoro fisso con reddito regolare' })
    }

    // Clamp score within 300-850
    const newScore = Math.min(850, Math.max(300, score + Math.round(delta)))

    return {
      effects: {},
      updatedScore: newScore,
      factors,
    }
  }

  static canGetMortgage(state: GameState): { canGet: boolean; reason: string; interestRate: number } {
    const score = state.finance.creditScore
    const tier = getCreditTierInfo(score)
    if (score < 580) return { canGet: false, reason: `Credit score ${score} troppo basso (min 580).`, interestRate: 0 }
    if (state.finance.debt > state.finance.money * 2) return { canGet: false, reason: 'Debiti troppo elevati rispetto al patrimonio.', interestRate: 0 }
    return { canGet: true, reason: `Mutuo disponibile al ${(tier.rate * 100).toFixed(1)}% annuo.`, interestRate: tier.rate }
  }

  static canGetLoan(amount: number, state: GameState): { canGet: boolean; reason: string; monthlyPayment: number } {
    const score = state.finance.creditScore
    const tier = getCreditTierInfo(score)
    if (amount > tier.maxLoan) return { canGet: false, reason: `Importo €${amount.toLocaleString()} supera il limite per il tuo credit score (max €${tier.maxLoan.toLocaleString()}).`, monthlyPayment: 0 }
    const monthly = Math.round((amount * tier.rate) / 12 + amount / 60) // 5-year amortization
    return { canGet: true, reason: `Prestito approvato. Rata mensile €${monthly.toLocaleString()}.`, monthlyPayment: monthly }
  }

  static getReport(state: GameState): { score: number; tier: CreditTier; tierLabel: string; interestRate: number; maxLoan: number; cardLimit: number } {
    const score = state.finance.creditScore
    const tier = getCreditTierInfo(score)
    return {
      score,
      tier: tier.tier,
      tierLabel: tier.label,
      interestRate: tier.rate,
      maxLoan: tier.maxLoan,
      cardLimit: tier.cardLimit,
    }
  }
}
