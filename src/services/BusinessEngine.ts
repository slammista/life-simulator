import type { GameState, Business, BusinessSector } from '../store/types'

export interface SectorDef {
  id: BusinessSector
  label: string
  emoji: string
  startupCost: number
  baseRevenue: number
  volatility: number
  skillKey: string
}

export const SECTOR_DEFS: SectorDef[] = [
  { id: 'tech',       label: 'Tech / App',      emoji: '💻', startupCost: 120000, baseRevenue: 110000, volatility: 0.4,  skillKey: 'intelligence' },
  { id: 'food',       label: 'Ristorante',       emoji: '🍕', startupCost: 150000, baseRevenue: 95000,  volatility: 0.25, skillKey: 'socialSkill'  },
  { id: 'retail',     label: 'Negozio',          emoji: '🛍️', startupCost: 80000,  baseRevenue: 70000,  volatility: 0.2,  skillKey: 'charisma'    },
  { id: 'consulting', label: 'Consulenza',       emoji: '📊', startupCost: 25000,  baseRevenue: 55000,  volatility: 0.3,  skillKey: 'intelligence' },
  { id: 'fitness',    label: 'Palestra / Sport', emoji: '🏋️', startupCost: 120000, baseRevenue: 85000,  volatility: 0.22, skillKey: 'athleticism' },
  { id: 'fashion',    label: 'Moda / Design',    emoji: '👗', startupCost: 130000, baseRevenue: 100000, volatility: 0.35, skillKey: 'creativity'  },
]

const uid = () => Math.random().toString(36).slice(2, 10)
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

export class BusinessEngine {
  static found(state: GameState, sector: BusinessSector, name: string): { success: boolean; message: string; business?: Business } {
    const def = SECTOR_DEFS.find(d => d.id === sector)!
    if (state.time.age < 18) return { success: false, message: 'Devi avere almeno 18 anni per fondare un\'azienda.' }
    if (state.career.businessOwned?.isActive) return { success: false, message: 'Hai già una società attiva.' }
    if (state.finance.money < def.startupCost) return { success: false, message: `Servono €${def.startupCost.toLocaleString('it-IT')} di capitale iniziale.` }
    return {
      success: true,
      message: `🚀 ${name} fondata nel settore ${def.label}!`,
      business: {
        id: uid(), name, sector, type: sector,
        employees: 0, revenue: 0, expenses: 0, founded: state.time.year,
        reputation: 50, capitalInvested: def.startupCost, annualRevenue: 0,
        annualProfit: 0, valuation: def.startupCost, isActive: true, lossYears: 0,
      },
    }
  }

  static annualTick(state: GameState): { profitEffect: number; messages: string[]; updatedBusiness: Business } {
    const biz = state.career.businessOwned!
    const def = SECTOR_DEFS.find(d => d.id === (biz.sector ?? 'retail' as BusinessSector))
      ?? SECTOR_DEFS[2]
    const rawSkill =
      (state.stats as unknown as Record<string, number>)[def.skillKey] ??
      (state.skills as unknown as Record<string, number>)[def.skillKey] ?? 50
    const skillFactor = 0.5 + rawSkill / 100
    const rand = 0.7 + Math.random() * 0.6
    const revenue = Math.round(def.baseRevenue * (1 + biz.employees * 0.3) * skillFactor * rand * (biz.reputation / 100 + 0.5))
    const fixedCosts = Math.round(def.baseRevenue * 0.20)
    const salaryCosts = biz.employees * 28000
    const expenses = fixedCosts + salaryCosts
    const profit = revenue - expenses
    const valuation = Math.max(0, profit * 4 + (biz.capitalInvested ?? 0))
    const messages: string[] = []

    let repDelta = Math.round((Math.random() - 0.4) * 6)
    if (Math.random() < 0.08) {
      const boom = Math.random() < 0.5
      repDelta += boom ? 8 : -8
      messages.push(boom
        ? `📈 ${biz.name} ha avuto un anno eccezionale! Fatturato record.`
        : `📉 ${biz.name} ha affrontato una crisi. Fatturato in calo.`)
    }
    const newRep = clamp(biz.reputation + repDelta, 0, 100)
    const lossYears = profit < 0 ? (biz.lossYears ?? 0) + 1 : 0
    const failed = lossYears >= 3
    if (failed) messages.push(`💸 ${biz.name} ha dichiarato bancarotta dopo 3 anni in perdita.`)
    else if (profit > 0) messages.push(`🏢 ${biz.name}: ricavi €${revenue.toLocaleString('it-IT')}, profitto netto €${profit.toLocaleString('it-IT')}.`)

    return {
      profitEffect: failed ? 0 : profit,
      messages,
      updatedBusiness: { ...biz, revenue, expenses, annualRevenue: revenue, annualProfit: profit, valuation: valuation as number, reputation: newRep, lossYears, isActive: !failed },
    }
  }

  static hire(biz: Business): { success: boolean; message: string; updatedBusiness?: Business } {
    if (biz.employees >= 20) return { success: false, message: 'Massimo 20 dipendenti.' }
    return { success: true, message: 'Hai assunto un dipendente (+€18.000/anno di costi).', updatedBusiness: { ...biz, employees: biz.employees + 1 } }
  }

  static fire(biz: Business): { success: boolean; message: string; updatedBusiness?: Business } {
    if (biz.employees <= 0) return { success: false, message: 'Non hai dipendenti da licenziare.' }
    return { success: true, message: 'Hai licenziato un dipendente.', updatedBusiness: { ...biz, employees: biz.employees - 1 } }
  }

  static sell(biz: Business): { proceeds: number; message: string } {
    const val = biz.valuation ?? biz.capitalInvested ?? 0
    return { proceeds: val, message: `Hai venduto ${biz.name} per €${val.toLocaleString('it-IT')}.` }
  }
}
