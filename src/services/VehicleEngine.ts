import type { GameState, Effect, OwnedVehicle, VehicleViolation } from '../store/types'

export type VehicleCategory = 'economy' | 'medium' | 'luxury' | 'supercar' | 'moto'

export interface VehicleDef {
  id: string
  category: VehicleCategory
  name: string
  emoji: string
  price: number
  annualInsurance: number
  annualMaintenance: number
  minAge: number
}

export const VEHICLE_DEFS: VehicleDef[] = [
  { id: 'fiat_panda',       category: 'economy',  name: 'Fiat Panda',      emoji: '🚗',  price: 9000,   annualInsurance: 450,   annualMaintenance: 700,   minAge: 18 },
  { id: 'renault_clio',     category: 'economy',  name: 'Renault Clio',    emoji: '🚗',  price: 12000,  annualInsurance: 500,   annualMaintenance: 800,   minAge: 18 },
  { id: 'volkswagen_golf',  category: 'medium',   name: 'Volkswagen Golf', emoji: '🚙',  price: 23000,  annualInsurance: 900,   annualMaintenance: 1200,  minAge: 18 },
  { id: 'audi_a4',          category: 'medium',   name: 'Audi A4',         emoji: '🚙',  price: 40000,  annualInsurance: 1500,  annualMaintenance: 2000,  minAge: 18 },
  { id: 'bmw_serie3',       category: 'luxury',   name: 'BMW Serie 3',     emoji: '🚘',  price: 55000,  annualInsurance: 2500,  annualMaintenance: 3500,  minAge: 18 },
  { id: 'mercedes_e',       category: 'luxury',   name: 'Mercedes Classe E', emoji: '🚘', price: 65000, annualInsurance: 3000,  annualMaintenance: 4000,  minAge: 18 },
  { id: 'ferrari_488',      category: 'supercar', name: 'Ferrari 488',     emoji: '🏎️',  price: 250000, annualInsurance: 12000, annualMaintenance: 18000, minAge: 21 },
  { id: 'lamborghini',      category: 'supercar', name: 'Lamborghini Huracán', emoji: '🏎️', price: 210000, annualInsurance: 10000, annualMaintenance: 15000, minAge: 21 },
  { id: 'honda_cbr',        category: 'moto',     name: 'Honda CBR 600',   emoji: '🏍️',  price: 7000,   annualInsurance: 280,   annualMaintenance: 500,   minAge: 18 },
  { id: 'ducati',           category: 'moto',     name: 'Ducati Monster',  emoji: '🏍️',  price: 14000,  annualInsurance: 450,   annualMaintenance: 900,   minAge: 18 },
]

const VIOLATION_TYPES = [
  { type: 'Eccesso di velocità lieve', fine: 150,  pointsLost: 2 },
  { type: 'Parcheggio in zona vietata', fine: 60,  pointsLost: 0 },
  { type: 'Semaforo rosso',            fine: 350,  pointsLost: 4 },
  { type: 'Uso del cellulare alla guida', fine: 200, pointsLost: 5 },
]

export interface VehicleActionResult {
  success: boolean
  message: string
  effects: Effect
  newVehicle?: OwnedVehicle
  newViolation?: VehicleViolation
  licenseGranted?: boolean
  theoryPassed?: boolean
}

export class VehicleEngine {
  static studyTheory(state: GameState): VehicleActionResult {
    const { vehicle, time } = state
    if (time.age < 16)
      return { success: false, message: 'Devi avere almeno 16 anni per studiare il codice della strada.', effects: {} }
    if (vehicle.hasLicenseB)
      return { success: false, message: 'Hai già la patente B.', effects: {} }
    if (vehicle.theoryPassed)
      return { success: false, message: 'Hai già superato l\'esame di teoria.', effects: {} }
    if (vehicle.studyHours >= 30)
      return { success: false, message: 'Sei pronto! Sostieni l\'esame di teoria.', effects: {} }

    const newHours = Math.min(30, vehicle.studyHours + 10)
    return {
      success: true,
      message: `📖 Hai studiato il codice della strada. (${newHours}/30 ore completate). Costo: €100.`,
      effects: { intelligence: 1, money: -100 },
    }
  }

  static takeTheoryExam(state: GameState): VehicleActionResult {
    const { vehicle, finance, time } = state
    if (time.age < 16) return { success: false, message: 'Devi avere almeno 16 anni.', effects: {} }
    if (vehicle.hasLicenseB) return { success: false, message: 'Hai già la patente B.', effects: {} }
    if (vehicle.theoryPassed) return { success: false, message: 'Hai già superato la teoria.', effects: {} }
    if (finance.money < 120) return { success: false, message: 'Servono €120 per l\'esame di teoria.', effects: {} }

    const passChance = Math.min(0.9, 0.25 + vehicle.studyHours * 0.022 + state.stats.intelligence * 0.002)
    const passed = Math.random() < passChance

    if (passed) {
      return {
        success: true, theoryPassed: true,
        message: '🎉 Hai superato l\'esame di teoria! Ora puoi sostenere la prova pratica.',
        effects: { money: -120, happiness: 10 },
      }
    }
    return {
      success: false,
      message: `❌ Esame di teoria fallito (prob. successo era ${Math.round(passChance * 100)}%). Studia ancora! Costo: €120.`,
      effects: { money: -120, happiness: -5 },
    }
  }

  static takePracticalExam(state: GameState): VehicleActionResult {
    const { vehicle, finance, time } = state
    if (!vehicle.theoryPassed)
      return { success: false, message: 'Devi prima superare l\'esame di teoria.', effects: {} }
    if (vehicle.hasLicenseB)
      return { success: false, message: 'Hai già la patente B.', effects: {} }
    if (time.age < 18)
      return { success: false, message: 'Devi avere almeno 18 anni per la patente B.', effects: {} }
    if (finance.money < 250)
      return { success: false, message: 'Servono €250 per l\'esame pratico.', effects: {} }

    const passChance = Math.max(0.25, Math.min(0.85, 0.5 + state.stats.intelligence * 0.003))
    const passed = Math.random() < passChance

    if (passed) {
      return {
        success: true, licenseGranted: true,
        message: '🎉 Hai ottenuto la patente B! Ora puoi guidare autonomamente.',
        effects: { money: -250, happiness: 20, reputation: 3 },
      }
    }
    return {
      success: false,
      message: '❌ Esame pratico non superato. Puoi riprovare pagando €250.',
      effects: { money: -250, happiness: -10 },
    }
  }

  static buyVehicle(vehicleId: string, state: GameState): VehicleActionResult {
    const def = VEHICLE_DEFS.find(v => v.id === vehicleId)
    if (!def) return { success: false, message: 'Veicolo non trovato.', effects: {} }
    if (state.time.age < def.minAge)
      return { success: false, message: `Devi avere almeno ${def.minAge} anni.`, effects: {} }
    if (!state.vehicle.hasLicenseB)
      return { success: false, message: 'Devi avere la patente B per acquistare questo veicolo.', effects: {} }
    if (state.finance.money < def.price)
      return { success: false, message: `Non hai fondi sufficienti. Servono €${def.price.toLocaleString()}.`, effects: {} }

    const isLuxury = def.category === 'luxury' || def.category === 'supercar'
    const newVehicle: OwnedVehicle = {
      id: Math.random().toString(36).slice(2, 10),
      category: def.category,
      name: def.name,
      emoji: def.emoji,
      purchaseYear: state.time.year,
      purchasePrice: def.price,
      currentValue: def.price,
      annualInsurance: def.annualInsurance,
      annualMaintenance: def.annualMaintenance,
    }

    return {
      success: true, newVehicle,
      message: `${def.emoji} Hai acquistato ${def.name} per €${def.price.toLocaleString()}! Assicurazione annua: €${def.annualInsurance.toLocaleString()}.`,
      effects: {
        money: -def.price,
        happiness: 15,
        reputation: isLuxury ? 12 : 3,
        socialReputation: isLuxury ? 10 : 2,
      },
    }
  }

  static annualTick(state: GameState): { effects: Effect; updatedVehicles: OwnedVehicle[]; newViolations: VehicleViolation[] } {
    const { vehicle } = state
    let totalCost = 0
    const newViolations: VehicleViolation[] = []

    // Annual insurance + maintenance, 12% depreciation
    const updatedVehicles = vehicle.ownedVehicles.map(v => {
      totalCost += v.annualInsurance + v.annualMaintenance
      return { ...v, currentValue: Math.floor(v.currentValue * 0.88) }
    })

    // Random traffic violation for licensed drivers with a vehicle
    if (vehicle.hasLicenseB && vehicle.ownedVehicles.length > 0 && Math.random() < 0.12) {
      const vtype = VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)]
      newViolations.push({ year: state.time.year, ...vtype })
      totalCost += vtype.fine
    }

    return {
      effects: totalCost > 0 ? { money: -totalCost } : {},
      updatedVehicles,
      newViolations,
    }
  }
}
