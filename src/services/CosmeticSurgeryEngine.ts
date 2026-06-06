import type { GameState, Effect } from '../store/types'
import { uid } from '../store/gameStore'

export interface CosmeticProcedure {
  id: string
  name: string
  emoji: string
  category: 'face' | 'body' | 'filler' | 'non_invasive'
  minCost: number
  maxCost: number
  looksBonus: number       // deterministic (variability in engine)
  minAge: number
  maxUses: number          // how many times can be done lifetime
  recoveryWeeks: number
  complicationBase: number // base complication probability 0-1
  isRepeatable: boolean    // fillers etc.
  description: string
}

export interface PerformedSurgery {
  id: string
  procedureId: string
  name: string
  year: number
  cost: number
  looksBonus: number
  hadComplication: boolean
  complicationDescription: string | null
}

export interface CosmeticSurgeryState {
  surgeries: PerformedSurgery[]
  totalSurgeries: number
  totalLooksBonus: number
  hasActiveComplication: boolean
}

export interface SurgeryResult {
  success: boolean
  message: string
  effects: Effect
  surgery?: PerformedSurgery
  updatedSurgery?: Partial<CosmeticSurgeryState>
}

export const PROCEDURES: CosmeticProcedure[] = [
  {
    id: 'rhinoplasty', name: 'Rinoplastica', emoji: '👃', category: 'face',
    minCost: 6000, maxCost: 15000, looksBonus: 10, minAge: 18, maxUses: 2,
    recoveryWeeks: 6, complicationBase: 0.08, isRepeatable: false,
    description: 'Rimodellazione del naso. Risultati permanenti.'
  },
  {
    id: 'breast_aug', name: 'Aumento del seno', emoji: '💎', category: 'body',
    minCost: 8000, maxCost: 16000, looksBonus: 12, minAge: 18, maxUses: 2,
    recoveryWeeks: 8, complicationBase: 0.07, isRepeatable: false,
    description: 'Impianti protesici. Sostituzione dopo 10-15 anni.'
  },
  {
    id: 'liposuction', name: 'Liposuzione', emoji: '⚡', category: 'body',
    minCost: 4000, maxCost: 9000, looksBonus: 8, minAge: 18, maxUses: 3,
    recoveryWeeks: 4, complicationBase: 0.06, isRepeatable: false,
    description: 'Rimozione chirurgica del grasso localizzato.'
  },
  {
    id: 'facelift', name: 'Lifting viso', emoji: '✨', category: 'face',
    minCost: 12000, maxCost: 28000, looksBonus: 15, minAge: 40, maxUses: 2,
    recoveryWeeks: 10, complicationBase: 0.10, isRepeatable: false,
    description: 'Riduzione rughe e rilassamento cutaneo. Consigliato 40+.'
  },
  {
    id: 'blepharoplasty', name: 'Blefaroplastica', emoji: '👁️', category: 'face',
    minCost: 3000, maxCost: 8000, looksBonus: 6, minAge: 35, maxUses: 2,
    recoveryWeeks: 3, complicationBase: 0.05, isRepeatable: false,
    description: 'Chirurgia delle palpebre. Sguardo più giovane.'
  },
  {
    id: 'chin_implant', name: 'Impianto mento', emoji: '😤', category: 'face',
    minCost: 4000, maxCost: 9000, looksBonus: 7, minAge: 18, maxUses: 1,
    recoveryWeeks: 4, complicationBase: 0.06, isRepeatable: false,
    description: 'Proiezione e definizione del mento.'
  },
  {
    id: 'tummy_tuck', name: 'Addominoplastica', emoji: '💪', category: 'body',
    minCost: 8000, maxCost: 16000, looksBonus: 10, minAge: 25, maxUses: 2,
    recoveryWeeks: 8, complicationBase: 0.08, isRepeatable: false,
    description: 'Rimozione pelle in eccesso e rassodamento addominale.'
  },
  {
    id: 'lip_fillers', name: 'Filler labbra', emoji: '💋', category: 'filler',
    minCost: 500, maxCost: 1500, looksBonus: 4, minAge: 18, maxUses: 20,
    recoveryWeeks: 0, complicationBase: 0.02, isRepeatable: true,
    description: 'Acido ialuronico per volume. Dura 6-12 mesi.'
  },
  {
    id: 'cheek_fillers', name: 'Filler zigomi', emoji: '✨', category: 'filler',
    minCost: 600, maxCost: 2000, looksBonus: 4, minAge: 25, maxUses: 20,
    recoveryWeeks: 0, complicationBase: 0.02, isRepeatable: true,
    description: 'Definizione zigomi e volumizzazione midface.'
  },
  {
    id: 'hair_transplant', name: 'Trapianto capelli', emoji: '💈', category: 'non_invasive',
    minCost: 5000, maxCost: 15000, looksBonus: 8, minAge: 25, maxUses: 2,
    recoveryWeeks: 2, complicationBase: 0.03, isRepeatable: false,
    description: 'FUE o FUT. Risultati in 12 mesi. Ideale per calvizie.'
  },
]

const COMPLICATIONS = [
  'Infezione post-operatoria. Antibiotici necessari.',
  'Reazione all\'anestesia. Ricovero breve.',
  'Cicatrice ipertrofica. Possibile revisione in futuro.',
  'Asimmetria del risultato. Possibile correzione.',
  'Sieroma (raccolta liquida). Drenaggio necessario.',
  'Trombosi venosa. Trattamento anticoagulante.',
]

export class CosmeticSurgeryEngine {
  static getAvailableProcedures(state: GameState): { procedure: CosmeticProcedure; usesCount: number; canDo: boolean; reason: string }[] {
    const surgeryState = state.cosmeticSurgery
    const totalSurgeries = surgeryState.surgeries.filter(s => !s.hadComplication || true).length

    return PROCEDURES.map(proc => {
      const usesCount = surgeryState.surgeries.filter(s => s.procedureId === proc.id).length
      const reasons: string[] = []

      if (state.time.age < proc.minAge) reasons.push(`Età minima ${proc.minAge} anni`)
      if (state.finance.money < proc.minCost) reasons.push(`Servono almeno €${proc.minCost.toLocaleString()}`)
      if (usesCount >= proc.maxUses) reasons.push(`Massimo ${proc.maxUses} interventi`)
      if (totalSurgeries >= 5 && !proc.isRepeatable) reasons.push('Massimo 5 chirurgie raggiunto')

      return {
        procedure: proc,
        usesCount,
        canDo: reasons.length === 0,
        reason: reasons[0] ?? '',
      }
    })
  }

  static performSurgery(procedureId: string, state: GameState): SurgeryResult {
    const proc = PROCEDURES.find(p => p.id === procedureId)
    if (!proc) return { success: false, message: 'Procedura non trovata.', effects: {} }

    const avail = this.getAvailableProcedures(state).find(a => a.procedure.id === procedureId)
    if (!avail?.canDo) return { success: false, message: avail?.reason ?? 'Non disponibile.', effects: {} }

    const cost = Math.round(proc.minCost + Math.random() * (proc.maxCost - proc.minCost))
    if (state.finance.money < cost) return { success: false, message: `Servono €${cost.toLocaleString()} per questa procedura.`, effects: {} }

    // Cumulative complication risk
    const prevSurgeries = state.cosmeticSurgery.surgeries.length
    const cumulativeRisk = proc.complicationBase + prevSurgeries * 0.02
    const hasComplication = Math.random() < cumulativeRisk

    const complicationDesc = hasComplication
      ? COMPLICATIONS[Math.floor(Math.random() * COMPLICATIONS.length)]
      : null

    const actualLooksBonus = hasComplication
      ? Math.round(proc.looksBonus * 0.3)
      : Math.round(proc.looksBonus * (0.8 + Math.random() * 0.4))

    const complicationCost = hasComplication ? Math.round(cost * 0.3) : 0
    const totalCost = cost + complicationCost

    const surgery: PerformedSurgery = {
      id: uid(),
      procedureId: proc.id,
      name: proc.name,
      year: state.time.year,
      cost: totalCost,
      looksBonus: actualLooksBonus,
      hadComplication: hasComplication,
      complicationDescription: complicationDesc,
    }

    const newSurgeries = [...state.cosmeticSurgery.surgeries, surgery]
    const newTotalLooks = newSurgeries.reduce((s, x) => s + x.looksBonus, 0)

    const effects: Effect = {
      money: -totalCost,
      looks: actualLooksBonus,
      health: hasComplication ? -10 : -2,
      happiness: hasComplication ? -15 : 8,
      mentalHealth: hasComplication ? -8 : 5,
    }

    const message = hasComplication
      ? `🏥 ${proc.name} eseguita (€${totalCost.toLocaleString()}). ⚠️ Complicazione: ${complicationDesc} Bonus aspetto ridotto: +${actualLooksBonus}.`
      : `✨ ${proc.name} completata con successo! €${totalCost.toLocaleString()}. Aspetto +${actualLooksBonus}.`

    return {
      success: true,
      message,
      effects,
      surgery,
      updatedSurgery: {
        surgeries: newSurgeries,
        totalSurgeries: newSurgeries.length,
        totalLooksBonus: newTotalLooks,
        hasActiveComplication: hasComplication,
      },
    }
  }

  static getTotalLooksBonus(state: GameState): number {
    return state.cosmeticSurgery.surgeries.reduce((s, x) => s + x.looksBonus, 0)
  }
}
