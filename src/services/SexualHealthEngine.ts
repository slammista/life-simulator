import type { GameState, Effect } from '../store/types'

export type ContraceptionMethod =
  | 'condom' | 'female_condom' | 'pill' | 'iud' | 'patch'
  | 'ring' | 'diaphragm' | 'calendar' | 'sterilization' | 'none'

export type STIType = 'hiv' | 'chlamydia' | 'gonorrhea' | 'syphilis' | 'hpv' | 'herpes' | 'hepatitis_b'

export interface STI {
  type: STIType
  name: string
  contractedYear: number
  isTreated: boolean
  isCurable: boolean
  monthlyCost: number
}

export interface SexualHealthState {
  isPregnant: boolean
  pregnancyTrimester: 0 | 1 | 2 | 3
  pregnancyPartnerName: string | null
  contraceptionMethod: ContraceptionMethod
  activeSTIs: STI[]
  sexualPartnersCount: number
  virginityLost: boolean
  lastSTDTestYear: number
  isInfertile: boolean
  ivfAttempts: number
}

export interface SexualHealthResult {
  success: boolean
  message: string
  effects: Effect
  updatedSexualHealth?: Partial<SexualHealthState>
  newSTI?: STI
}

const CONTRACEPTION_EFFICACY: Record<ContraceptionMethod, { efficacy: number; stdProtection: boolean; monthlyCost: number; name: string }> = {
  condom:          { efficacy: 0.98, stdProtection: true,  monthlyCost: 15,   name: 'Preservativo' },
  female_condom:   { efficacy: 0.95, stdProtection: true,  monthlyCost: 25,   name: 'Preservativo femminile' },
  pill:            { efficacy: 0.99, stdProtection: false, monthlyCost: 22,   name: 'Pillola anticoncezionale' },
  iud:             { efficacy: 0.999,stdProtection: false, monthlyCost: 0,    name: 'IUD (spirale)' },  // one-time €400
  patch:           { efficacy: 0.99, stdProtection: false, monthlyCost: 30,   name: 'Cerotto contraccettivo' },
  ring:            { efficacy: 0.99, stdProtection: false, monthlyCost: 22,   name: 'Anello vaginale' },
  diaphragm:       { efficacy: 0.88, stdProtection: false, monthlyCost: 5,    name: 'Diaframma' },
  calendar:        { efficacy: 0.75, stdProtection: false, monthlyCost: 0,    name: 'Metodo calendario' },
  sterilization:   { efficacy: 0.999,stdProtection: false, monthlyCost: 0,    name: 'Sterilizzazione' },
  none:            { efficacy: 0,    stdProtection: false, monthlyCost: 0,    name: 'Nessuno' },
}

const STI_DEFS: Record<STIType, { name: string; emoji: string; curable: boolean; monthlyCost: number; transmissionRate: number }> = {
  hiv:         { name: 'HIV/AIDS',          emoji: '🔴', curable: false, monthlyCost: 1800, transmissionRate: 0.005 },
  chlamydia:   { name: 'Clamidia',          emoji: '🦠', curable: true,  monthlyCost: 75,   transmissionRate: 0.30  },
  gonorrhea:   { name: 'Gonorrea',          emoji: '🦠', curable: true,  monthlyCost: 100,  transmissionRate: 0.25  },
  syphilis:    { name: 'Sifilide',          emoji: '🦠', curable: true,  monthlyCost: 120,  transmissionRate: 0.15  },
  hpv:         { name: 'HPV',              emoji: '🦠', curable: false, monthlyCost: 30,   transmissionRate: 0.70  },
  herpes:      { name: 'Herpes genitale',  emoji: '🔴', curable: false, monthlyCost: 80,   transmissionRate: 0.20  },
  hepatitis_b: { name: 'Epatite B',        emoji: '🟡', curable: false, monthlyCost: 600,  transmissionRate: 0.30  },
}

export class SexualHealthEngine {
  static setContraception(method: ContraceptionMethod, state: GameState): SexualHealthResult {
    if (state.sexualHealth.contraceptionMethod === method)
      return { success: false, message: 'Stai già usando questo metodo.', effects: {} }

    const def = CONTRACEPTION_EFFICACY[method]
    let cost = 0
    let oneTimeCost = 0

    if (method === 'iud') oneTimeCost = 400
    if (method === 'sterilization') {
      if (state.time.age < 25)
        return { success: false, message: 'La sterilizzazione è consigliata dopo i 25 anni.', effects: {} }
      oneTimeCost = 2000
    }

    cost = oneTimeCost + def.monthlyCost
    if (cost > 0 && state.finance.money < cost)
      return { success: false, message: `Servono €${cost} per ${def.name}.`, effects: {} }

    return {
      success: true,
      message: `✅ ${def.name} impostato come metodo contraccettivo. Efficacia: ${Math.round(def.efficacy * 100)}%.`,
      effects: { money: -cost },
      updatedSexualHealth: { contraceptionMethod: method },
    }
  }

  static haveSex(state: GameState, partnerHasSTI = false): SexualHealthResult {
    if (state.time.age < 14)
      return { success: false, message: 'Troppo giovane.', effects: {} }

    const method = state.sexualHealth.contraceptionMethod
    const contraData = CONTRACEPTION_EFFICACY[method]
    const isProtected = contraData.stdProtection

    // Pregnancy risk (females only or for partners)
    const pregnancyRisk = state.sexualHealth.isPregnant ? 0 : (1 - contraData.efficacy) * 0.15
    const getsPregnant = !state.sexualHealth.isInfertile && Math.random() < pregnancyRisk

    // STI transmission
    let newSTI: STI | undefined
    if (partnerHasSTI && !isProtected) {
      for (const [stiType, stiDef] of Object.entries(STI_DEFS)) {
        if (state.sexualHealth.activeSTIs.some(s => s.type === stiType)) continue
        if (Math.random() < stiDef.transmissionRate * 0.3) {
          newSTI = {
            type: stiType as STIType,
            name: stiDef.name,
            contractedYear: state.time.year,
            isTreated: false,
            isCurable: stiDef.curable,
            monthlyCost: stiDef.monthlyCost,
          }
          break
        }
      }
    }

    const virginityMessage = !state.sexualHealth.virginityLost ? ' (Prima volta — momento significativo.) ' : ''
    const pregnancyMessage = getsPregnant ? ' ⚠️ Test di gravidanza positivo...' : ''
    const stiMessage = newSTI ? ` ⚠️ Possibile contagio ${newSTI.name}.` : ''

    return {
      success: true,
      message: `💕 Rapporto sessuale${method !== 'none' ? ` (${contraData.name})` : ' (non protetto)'}. ${virginityMessage}${pregnancyMessage}${stiMessage}`,
      effects: { happiness: 10, mentalHealth: 5, energy: -5 },
      updatedSexualHealth: {
        virginityLost: true,
        sexualPartnersCount: state.sexualHealth.sexualPartnersCount + 1,
        isPregnant: getsPregnant || state.sexualHealth.isPregnant,
        pregnancyTrimester: getsPregnant ? 1 : state.sexualHealth.pregnancyTrimester,
        activeSTIs: newSTI
          ? [...state.sexualHealth.activeSTIs, newSTI]
          : state.sexualHealth.activeSTIs,
      },
      newSTI,
    }
  }

  static takePregnancyTest(state: GameState): SexualHealthResult {
    const cost = 10
    if (state.finance.money < cost) return { success: false, message: 'Servono €10.', effects: {} }

    const isPregnant = state.sexualHealth.isPregnant
    return {
      success: true,
      message: isPregnant ? '🤰 Test di gravidanza: POSITIVO. Sei incinta.' : '✅ Test di gravidanza: negativo.',
      effects: { money: -cost, happiness: isPregnant ? -5 : 3 },
    }
  }

  static getAbortion(state: GameState): SexualHealthResult {
    if (!state.sexualHealth.isPregnant)
      return { success: false, message: 'Non sei incinta.', effects: {} }
    if (state.sexualHealth.pregnancyTrimester > 2)
      return { success: false, message: 'La gravidanza è troppo avanzata per un aborto legale.', effects: {} }
    if (state.time.age < 18 && state.sexualHealth.pregnancyTrimester > 1)
      return { success: false, message: 'Consulta un medico per l\'aborto da minorenne.', effects: {} }

    const cost = state.sexualHealth.pregnancyTrimester === 1 ? 300 : 600
    if (state.finance.money < cost)
      return { success: false, message: `Servono €${cost} per la procedura.`, effects: {} }

    return {
      success: true,
      message: `🏥 Interruzione volontaria di gravidanza effettuata. È una scelta difficile. Prenditi cura di te.`,
      effects: { money: -cost, mentalHealth: -15, happiness: -10, health: -3 },
      updatedSexualHealth: { isPregnant: false, pregnancyTrimester: 0, pregnancyPartnerName: null },
    }
  }

  static getSTDTest(state: GameState): SexualHealthResult {
    const cost = 80
    if (state.finance.money < cost) return { success: false, message: 'Servono €80 per i test MST.', effects: {} }

    const hasSTIs = state.sexualHealth.activeSTIs.length > 0
    const stiNames = state.sexualHealth.activeSTIs.map(s => s.name).join(', ')

    return {
      success: true,
      message: hasSTIs
        ? `🔬 Test MST: positivo per ${stiNames}. Consulta il medico per la terapia.`
        : '✅ Test MST: tutti negativi. Sei in salute.',
      effects: { money: -cost, mentalHealth: hasSTIs ? -10 : 5 },
      updatedSexualHealth: { lastSTDTestYear: state.time.year },
    }
  }

  static treatSTI(stiType: STIType, state: GameState): SexualHealthResult {
    const sti = state.sexualHealth.activeSTIs.find(s => s.type === stiType)
    if (!sti) return { success: false, message: 'MST non trovata.', effects: {} }
    if (!sti.isCurable) return { success: false, message: `${sti.name} non è curabile, ma è gestibile con terapia.`, effects: {} }

    const treatmentCost = sti.monthlyCost * 3
    if (state.finance.money < treatmentCost)
      return { success: false, message: `Servono €${treatmentCost} per la terapia.`, effects: {} }

    return {
      success: true,
      message: `💊 ${sti.name} curata con successo. Segui sempre pratiche sessuali sicure.`,
      effects: { money: -treatmentCost, health: 5, happiness: 8 },
      updatedSexualHealth: {
        activeSTIs: state.sexualHealth.activeSTIs.filter(s => s.type !== stiType),
      },
    }
  }

  static doIVF(state: GameState): SexualHealthResult {
    if (state.sexualHealth.isPregnant)
      return { success: false, message: 'Sei già incinta.', effects: {} }
    if (state.time.age > 50)
      return { success: false, message: 'La FIV è generalmente sconsigliata oltre i 50 anni.', effects: {} }

    const cost = 4500
    if (state.finance.money < cost)
      return { success: false, message: `Servono €${cost} per un ciclo FIV.`, effects: {} }

    // 35% success rate per cycle, lower after 40
    const agePenalty = state.time.age > 40 ? 0.5 : state.time.age > 35 ? 0.75 : 1
    const successRate = 0.35 * agePenalty
    const success = Math.random() < successRate

    return {
      success,
      message: success
        ? '🌸 FIV riuscita! Sei incinta. Questo è un momento meraviglioso.'
        : '💔 Il ciclo FIV non è andato a buon fine. Puoi riprovare.',
      effects: {
        money: -cost,
        happiness: success ? 25 : -15,
        mentalHealth: success ? 10 : -12,
        health: -3,
      },
      updatedSexualHealth: {
        isPregnant: success,
        pregnancyTrimester: success ? 1 : 0,
        ivfAttempts: state.sexualHealth.ivfAttempts + 1,
      },
    }
  }

  static annualTick(state: GameState): { effects: Effect; updatedSexualHealth: Partial<SexualHealthState> } {
    const { sexualHealth, time } = state
    const effects: Effect = {}
    const updates: Partial<SexualHealthState> = {}

    // Pregnancy progression
    if (sexualHealth.isPregnant) {
      if (sexualHealth.pregnancyTrimester < 3) {
        updates.pregnancyTrimester = (sexualHealth.pregnancyTrimester + 1) as 0 | 1 | 2 | 3
        if (sexualHealth.pregnancyTrimester === 2) {
          // Birth! (handled by ParentingEngine on haveChild, but we reset pregnancy)
          updates.isPregnant = false
          updates.pregnancyTrimester = 0
          updates.pregnancyPartnerName = null
        }
      }
    }

    // STI monthly costs (annual)
    const stiAnnualCost = sexualHealth.activeSTIs.reduce((s, sti) => s + sti.monthlyCost * 12, 0)
    if (stiAnnualCost > 0) {
      effects.money = -stiAnnualCost
      effects.health = -sexualHealth.activeSTIs.filter(s => !s.isTreated).length * 3
    }

    // Fertility decline (women 35+, men 50+)
    if (time.age >= 45 && !sexualHealth.isInfertile && Math.random() < 0.05) {
      updates.isInfertile = true
    }

    return { effects, updatedSexualHealth: updates }
  }
}
