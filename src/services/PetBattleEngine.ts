import type { GameState, Pet, ActionResult } from '../store/types'
import { PET_DEFS } from './PetEngine'

// ─── Battle stat derivation ─────────────────────────────────────

export interface BattleStats {
  attack: number
  defense: number
  speed: number
  hp: number
  label: string
  emoji: string
}

const SPECIES_BONUS: Record<string, Partial<BattleStats>> = {
  dog:    { attack: 15, defense: 10, speed: 12 },
  cat:    { attack: 10, defense: 8,  speed: 18 },
  horse:  { attack: 20, defense: 15, speed: 20 },
  rabbit: { attack: 4,  defense: 5,  speed: 22 },
  bird:   { attack: 6,  defense: 4,  speed: 25 },
  fish:   { attack: 2,  defense: 2,  speed: 5  },
  exotic: { attack: 18, defense: 12, speed: 16 },
}

export function deriveBattleStats(pet: Pet): BattleStats {
  const base = SPECIES_BONUS[pet.species] ?? { attack: 8, defense: 8, speed: 10 }
  const rarityMult = pet.rarity === 'legendary' ? 1.5 : pet.rarity === 'rare' ? 1.25 : pet.rarity === 'uncommon' ? 1.1 : 1
  const bondMult = 0.7 + (pet.bondLevel / 100) * 0.6
  const wins = pet.battleWins ?? 0

  return {
    attack:  Math.round(((base.attack ?? 8)  + wins * 0.5 + pet.happiness / 20) * rarityMult * bondMult),
    defense: Math.round(((base.defense ?? 8) + wins * 0.3 + pet.health / 25)    * rarityMult * bondMult),
    speed:   Math.round(((base.speed ?? 10)  + wins * 0.2 + pet.age * 0.5)      * rarityMult),
    hp:      Math.round(80 + pet.health * 0.4 + pet.bondLevel * 0.3 + wins * 2),
    label:   pet.name,
    emoji:   PET_DEFS.find(d => d.breed === pet.breed)?.emoji ?? '🐾',
  }
}

// ─── Opponent pool ───────────────────────────────────────────────

export interface Opponent {
  name: string
  species: Pet['species']
  emoji: string
  rarity: Pet['rarity']
  stats: BattleStats
  prize: number
}

const OPPONENT_POOL: Omit<Opponent, 'stats'>[] = [
  { name: 'Lupo Grigio',     species: 'dog',    emoji: '🐺', rarity: 'common',    prize: 150  },
  { name: 'Tigre Bengala',   species: 'exotic', emoji: '🐯', rarity: 'rare',      prize: 800  },
  { name: 'Falco Reale',     species: 'bird',   emoji: '🦅', rarity: 'uncommon',  prize: 300  },
  { name: 'Puma Selvaggio',  species: 'exotic', emoji: '🐆', rarity: 'uncommon',  prize: 350  },
  { name: 'Gatto Nero',      species: 'cat',    emoji: '🐈‍⬛', rarity: 'common',   prize: 120  },
  { name: 'Stallone Nero',   species: 'horse',  emoji: '🐎', rarity: 'rare',      prize: 1000 },
  { name: 'Drago Komodo',    species: 'exotic', emoji: '🦎', rarity: 'legendary', prize: 3000 },
  { name: 'Coniglio Ninja',  species: 'rabbit', emoji: '🐰', rarity: 'uncommon',  prize: 200  },
  { name: 'Pappagallo Chaos',species: 'bird',   emoji: '🦜', rarity: 'common',    prize: 100  },
  { name: 'Cane Fantasma',   species: 'dog',    emoji: '🐕', rarity: 'rare',      prize: 600  },
]

function makeOpponentStats(opp: Omit<Opponent, 'stats'>, petLevel: number): BattleStats {
  const base = SPECIES_BONUS[opp.species] ?? { attack: 8, defense: 8, speed: 10 }
  const rarityMult = opp.rarity === 'legendary' ? 1.6 : opp.rarity === 'rare' ? 1.3 : opp.rarity === 'uncommon' ? 1.1 : 1
  const lvl = 0.8 + Math.random() * 0.6 + petLevel * 0.015
  return {
    attack:  Math.round((base.attack  ?? 8)  * rarityMult * lvl),
    defense: Math.round((base.defense ?? 8)  * rarityMult * lvl),
    speed:   Math.round((base.speed   ?? 10) * rarityMult * lvl),
    hp:      Math.round(90 * rarityMult * lvl),
    label:   opp.name,
    emoji:   opp.emoji,
  }
}

// ─── Battle simulation ───────────────────────────────────────────

export interface BattleLog {
  round: number
  attacker: string
  damage: number
  remaining: number
  crit: boolean
}

export interface BattleResult {
  won: boolean
  petStats: BattleStats
  oppStats: BattleStats
  opponent: Opponent
  log: BattleLog[]
  prize: number
  xpGained: number
  petUpdates: Partial<Pet>
  effects: { money: number; happiness: number; karma: number }
  message: string
}

export const PetBattleEngine = {
  canBattle(pet: Pet, state: GameState): { ok: boolean; reason?: string } {
    if (!pet.isAlive) return { ok: false, reason: `${pet.name} non è in vita.` }
    if (pet.health < 20) return { ok: false, reason: `${pet.name} è troppo malato per combattere (salute < 20).` }
    if (pet.species === 'fish') return { ok: false, reason: 'I pesci non combattono.' }
    if (state.time.age < 12) return { ok: false, reason: 'Devi avere almeno 12 anni per le battaglie.' }
    return { ok: true }
  },

  battle(petId: string, state: GameState): ActionResult & { battleResult?: BattleResult } {
    const pet = state.pets.find(p => p.id === petId)
    if (!pet) return { success: false, message: 'Animale non trovato.', effects: {} }

    const check = PetBattleEngine.canBattle(pet, state)
    if (!check.ok) return { success: false, message: check.reason!, effects: {} }

    const petLevel = (pet.battleWins ?? 0)
    const oppDef = OPPONENT_POOL[Math.floor(Math.random() * OPPONENT_POOL.length)]
    const opponent: Opponent = {
      ...oppDef,
      stats: makeOpponentStats(oppDef, petLevel),
      prize: Math.round(oppDef.prize * (0.8 + Math.random() * 0.4)),
    }

    const petStats = deriveBattleStats(pet)
    let petHp = petStats.hp
    let oppHp = opponent.stats.hp
    const log: BattleLog[] = []

    // Simulate up to 20 rounds
    for (let round = 1; round <= 20 && petHp > 0 && oppHp > 0; round++) {
      const petFirst = petStats.speed >= opponent.stats.speed

      // Pet attacks
      if (petFirst || round % 2 === 1) {
        const crit = Math.random() < 0.12
        const dmg = Math.max(1, Math.round(
          (petStats.attack - opponent.stats.defense * 0.4) * (crit ? 1.8 : 1) * (0.85 + Math.random() * 0.3)
        ))
        oppHp -= dmg
        log.push({ round, attacker: pet.name, damage: dmg, remaining: Math.max(0, oppHp), crit })
        if (oppHp <= 0) break
      }

      // Opponent attacks
      {
        const crit = Math.random() < 0.10
        const dmg = Math.max(1, Math.round(
          (opponent.stats.attack - petStats.defense * 0.4) * (crit ? 1.8 : 1) * (0.85 + Math.random() * 0.3)
        ))
        petHp -= dmg
        log.push({ round, attacker: opponent.name, damage: dmg, remaining: Math.max(0, petHp), crit })
      }
    }

    const won = petHp > 0
    const prize = won ? opponent.prize : 0
    const healthLost = Math.round(10 + Math.random() * 15)

    const petUpdates: Partial<Pet> = {
      battleWins:   (pet.battleWins ?? 0)   + (won ? 1 : 0),
      battleLosses: (pet.battleLosses ?? 0) + (won ? 0 : 1),
      health:       Math.max(10, pet.health - healthLost),
      happiness:    Math.min(100, pet.happiness + (won ? 10 : -5)),
    }

    const effects = {
      money:     prize,
      happiness: won ? 8 : -3,
      karma:     won ? 0 : -1,
    }

    const totalBattles = (petUpdates.battleWins ?? 0) + (petUpdates.battleLosses ?? 0)
    let message: string
    if (won) {
      message = `⚔️ ${pet.name} ha sconfitto ${opponent.emoji} ${opponent.name}! Premi: €${prize.toLocaleString()} · ${totalBattles} battaglie totali`
    } else {
      message = `💥 ${pet.name} è stato sconfitto da ${opponent.emoji} ${opponent.name}. Si è battuto coraggiosamente! (${totalBattles} battaglie)`
    }

    const battleResult: BattleResult = { won, petStats, oppStats: opponent.stats, opponent, log, prize, xpGained: won ? 10 : 3, petUpdates, effects, message }
    return { success: true, message, effects, battleResult }
  },

  // ─── Breeding ─────────────────────────────────────────────────

  canBreed(pet1: Pet, pet2: Pet): { ok: boolean; reason?: string } {
    if (!pet1.isAlive || !pet2.isAlive) return { ok: false, reason: 'Entrambi gli animali devono essere in vita.' }
    if (pet1.id === pet2.id) return { ok: false, reason: 'Non puoi far riprodurre un animale con sé stesso.' }
    if (pet1.species !== pet2.species) return { ok: false, reason: `Specie diverse (${pet1.species} × ${pet2.species}) — non compatibili.` }
    if (pet1.species === 'fish') return { ok: false, reason: 'I pesci non si riproducono nel gioco.' }
    if (pet1.age < 1 || pet2.age < 1) return { ok: false, reason: 'Entrambi gli animali devono avere almeno 1 anno.' }
    return { ok: true }
  },

  breed(pet1Id: string, pet2Id: string, state: GameState): ActionResult & { newPet?: Pet } {
    const pet1 = state.pets.find(p => p.id === pet1Id)
    const pet2 = state.pets.find(p => p.id === pet2Id)
    if (!pet1 || !pet2) return { success: false, message: 'Animali non trovati.', effects: {} }

    const check = PetBattleEngine.canBreed(pet1, pet2)
    if (!check.ok) return { success: false, message: check.reason!, effects: {} }

    if (state.pets.filter(p => p.isAlive).length >= 5)
      return { success: false, message: 'Hai già 5 animali vivi — non c\'è spazio per un cucciolo.', effects: {} }

    // Rarity inheritance — rare chance of upgrade
    const parentRarities = [pet1.rarity ?? 'common', pet2.rarity ?? 'common']
    const rarityOrder: Pet['rarity'][] = ['common', 'uncommon', 'rare', 'legendary']
    const maxIdx = Math.max(rarityOrder.indexOf(parentRarities[0]!), rarityOrder.indexOf(parentRarities[1]!))
    const roll = Math.random()
    let rarity: Pet['rarity'] = rarityOrder[maxIdx]
    if (roll < 0.05 && maxIdx < 3) rarity = rarityOrder[maxIdx + 1]  // 5% upgrade

    // Inherit best stats
    const parentDef1 = PET_DEFS.find(d => d.breed === pet1.breed)
    const parentDef2 = PET_DEFS.find(d => d.breed === pet2.breed)
    const baseDef = parentDef1 ?? parentDef2 ?? PET_DEFS[0]

    const newPet: Pet = {
      id:              `pet_${Math.random().toString(36).slice(2)}`,
      species:         pet1.species,
      breed:           baseDef.breed,
      name:            `${pet1.name.slice(0, 3)}${pet2.name.slice(0, 3)}`,
      age:             0,
      health:          Math.round((pet1.health + pet2.health) / 2 * 1.1),
      happiness:       75,
      bondLevel:       40,
      costMaintenance: baseDef.monthlyCost,
      lifespan:        Math.round((pet1.lifespan + pet2.lifespan) / 2 * 1.05),
      specialAbilities: [...new Set([...pet1.specialAbilities, ...pet2.specialAbilities])].slice(0, 3),
      isAlive:         true,
      acquiredYear:    state.time.year,
      battleWins:      0,
      battleLosses:    0,
      isRare:          rarity !== 'common',
      rarity,
    }

    const rarityLabel = rarity === 'legendary' ? '⭐⭐⭐⭐ LEGGENDARIO' : rarity === 'rare' ? '⭐⭐⭐ Raro' : rarity === 'uncommon' ? '⭐⭐ Non Comune' : '⭐ Comune'
    const emoji = PET_DEFS.find(d => d.breed === newPet.breed)?.emoji ?? '🐾'
    const message = `🍼 ${pet1.name} e ${pet2.name} hanno avuto un cucciolo: ${emoji} ${newPet.name} [${rarityLabel}]!`

    return {
      success: true,
      message,
      effects: { happiness: 12, mentalHealth: 5 },
      newPet,
    }
  },
}
