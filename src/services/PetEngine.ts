import type { GameState, Pet, Effect } from '../store/types'

export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'bird' | 'fish' | 'horse'
export type AdoptMethod = 'adopt' | 'buy'

export interface PetDef {
  id: string; species: PetSpecies; breed: string; emoji: string
  adoptionCost: number; purchaseCost: number; monthlyCost: number
  lifespan: number; bondPerCare: number; happinessBonus: number
}

export const PET_DEFS: PetDef[] = [
  { id: 'labrador',  species: 'dog', breed: 'Labrador',       emoji: '🐕',  adoptionCost: 0,    purchaseCost: 800,   monthlyCost: 80,  lifespan: 12, bondPerCare: 6, happinessBonus: 8 },
  { id: 'chihuahua', species: 'dog', breed: 'Chihuahua',      emoji: '🐩',  adoptionCost: 0,    purchaseCost: 600,   monthlyCost: 50,  lifespan: 14, bondPerCare: 4, happinessBonus: 6 },
  { id: 'golden',    species: 'dog', breed: 'Golden Retriever',emoji: '🐕‍🦺', adoptionCost: 0,    purchaseCost: 1000,  monthlyCost: 90,  lifespan: 11, bondPerCare: 7, happinessBonus: 10 },
  { id: 'persian',   species: 'cat', breed: 'Persiano',       emoji: '🐱',  adoptionCost: 0,    purchaseCost: 500,   monthlyCost: 50,  lifespan: 15, bondPerCare: 3, happinessBonus: 6 },
  { id: 'siamese',   species: 'cat', breed: 'Siamese',        emoji: '😺',  adoptionCost: 0,    purchaseCost: 400,   monthlyCost: 40,  lifespan: 13, bondPerCare: 3, happinessBonus: 5 },
  { id: 'mainecoon', species: 'cat', breed: 'Maine Coon',     emoji: '🐈',  adoptionCost: 0,    purchaseCost: 700,   monthlyCost: 60,  lifespan: 14, bondPerCare: 4, happinessBonus: 7 },
  { id: 'rabbit',    species: 'rabbit', breed: 'Coniglio Nano',emoji: '🐰', adoptionCost: 0,    purchaseCost: 100,   monthlyCost: 30,  lifespan: 8,  bondPerCare: 2, happinessBonus: 5 },
  { id: 'parrot',    species: 'bird', breed: 'Pappagallo',    emoji: '🦜',  adoptionCost: 0,    purchaseCost: 300,   monthlyCost: 40,  lifespan: 20, bondPerCare: 3, happinessBonus: 7 },
  { id: 'aquarium',  species: 'fish', breed: 'Acquario',      emoji: '🐠',  adoptionCost: 0,    purchaseCost: 50,    monthlyCost: 15,  lifespan: 3,  bondPerCare: 1, happinessBonus: 3 },
  { id: 'horse',     species: 'horse', breed: 'Cavallo',      emoji: '🐴',  adoptionCost: 5000, purchaseCost: 10000, monthlyCost: 500, lifespan: 25, bondPerCare: 8, happinessBonus: 12 },
]

export interface PetActionResult {
  success: boolean; message: string; effects: Effect
  newPet?: Pet
  updatedPet?: Partial<Pet>
}

export class PetEngine {
  static getDefs() { return PET_DEFS }

  static adoptPet(petDefId: string, method: AdoptMethod, state: GameState): PetActionResult {
    if (state.time.age < 18)
      return { success: false, message: 'Devi essere maggiorenne per adottare un animale.', effects: {} }
    if (state.pets.filter(p => p.isAlive).length >= 5)
      return { success: false, message: 'Hai già 5 animali. Non puoi prenderne altri.', effects: {} }

    const def = PET_DEFS.find(p => p.id === petDefId)
    if (!def) return { success: false, message: 'Tipo animale non trovato.', effects: {} }

    const cost = method === 'adopt' ? def.adoptionCost : def.purchaseCost
    if (state.finance.money < cost + def.monthlyCost)
      return { success: false, message: `Non hai abbastanza soldi (servono €${cost + def.monthlyCost}).`, effects: {} }

    const pet: Pet = {
      id: `pet_${Math.random().toString(36).slice(2)}`,
      species: def.species as Pet['species'],
      breed: def.breed,
      name: def.breed,
      age: method === 'adopt' ? Math.floor(Math.random() * 5) + 1 : 0,
      health: 80 + Math.floor(Math.random() * 20),
      happiness: 70,
      bondLevel: method === 'adopt' ? 20 : 30,
      costMaintenance: def.monthlyCost,
      lifespan: def.lifespan,
      specialAbilities: [],
      isAlive: true,
      acquiredYear: state.time.year,
    }

    const effects: Effect = {
      money: -cost,
      happiness: def.happinessBonus,
      mentalHealth: 5,
    }

    const action = method === 'adopt' ? 'adottato' : 'acquistato'
    return {
      success: true,
      message: `${def.emoji} Hai ${action} ${def.breed}! Si chiama ${pet.name}. 🐾`,
      effects, newPet: pet,
    }
  }

  static careForPet(petId: string, state: GameState): PetActionResult {
    const pet = state.pets.find(p => p.id === petId)
    if (!pet || !pet.isAlive)
      return { success: false, message: 'Animale non trovato.', effects: {} }

    const def = PET_DEFS.find(d => d.species === pet.species && d.breed === pet.breed)
    const bondGain = def?.bondPerCare ?? 3
    const newBond = Math.min(100, pet.bondLevel + bondGain)
    const newHappiness = Math.min(100, pet.happiness + 10)

    return {
      success: true,
      message: `${def?.emoji ?? '🐾'} Ti prendi cura di ${pet.name}. Il legame cresce! (Bond: ${newBond})`,
      effects: { happiness: 3, mentalHealth: 2, money: -pet.costMaintenance },
      updatedPet: { bondLevel: newBond, happiness: newHappiness },
    }
  }

  static vetVisit(petId: string, state: GameState): PetActionResult {
    const pet = state.pets.find(p => p.id === petId)
    if (!pet || !pet.isAlive)
      return { success: false, message: 'Animale non trovato.', effects: {} }
    const cost = 80 + Math.floor(Math.random() * 120)
    if (state.finance.money < cost)
      return { success: false, message: `La visita veterinaria costa €${cost}. Non hai abbastanza soldi.`, effects: {} }

    const healthGain = Math.floor(Math.random() * 20) + 10
    return {
      success: true,
      message: `🏥 Visita veterinaria per ${pet.name}. Costo: €${cost}. ${pet.name} sta meglio!`,
      effects: { money: -cost, happiness: 2 },
      updatedPet: { health: Math.min(100, pet.health + healthGain) },
    }
  }

  static annualTick(state: GameState): { updatedPets: Pet[]; effects: Effect; deathMessages: string[] } {
    const effects: Effect = {}
    const deathMessages: string[] = []
    let totalMaintenance = 0

    const updatedPets = state.pets.map(pet => {
      if (!pet.isAlive) return pet
      const def = PET_DEFS.find(d => d.species === pet.species)

      const newAge = pet.age + 1
      totalMaintenance += pet.costMaintenance

      // Natural aging and death
      const lifespan = def?.lifespan ?? 10
      const deathChance = newAge > lifespan ? (newAge - lifespan) * 0.3 : 0.01
      if (Math.random() < deathChance) {
        deathMessages.push(`💔 Il tuo ${pet.breed} ${pet.name} è morto a ${newAge} anni. Riposa in pace. 🌈`)
        effects.happiness = (effects.happiness ?? 0) - 15
        effects.mentalHealth = (effects.mentalHealth ?? 0) - 10
        return { ...pet, isAlive: false, age: newAge }
      }

      const healthDecay = newAge > lifespan * 0.8 ? -5 : -1
      const bondDecay = pet.bondLevel > 10 ? -3 : 0
      return {
        ...pet,
        age: newAge,
        health: Math.max(0, pet.health + healthDecay),
        bondLevel: Math.max(0, pet.bondLevel + bondDecay),
        happiness: Math.max(0, pet.happiness - 5),
      }
    })

    effects.money = (effects.money ?? 0) - totalMaintenance
    // Happiness bonus from alive pets
    const alivePets = updatedPets.filter(p => p.isAlive)
    if (alivePets.length > 0) {
      effects.happiness = (effects.happiness ?? 0) + alivePets.length * 3
    }

    return { updatedPets, effects, deathMessages }
  }
}
