import type { GameState, Effect } from '../store/types'

export type GamblingGame = 'slots' | 'blackjack' | 'roulette' | 'poker'
export type LuckyGame = 'lottery' | 'scratch_card' | 'sports_bet'
export type SportBetType = 'calcio' | 'tennis' | 'basket' | 'formula1' | 'boxe'

export interface GamblingState {
  totalWon: number
  totalLost: number
  gamesPlayed: number
  addictionLevel: number    // 0-100
  lastPlayedYear: number
  casinoBlacklisted: boolean
  biggestWin: number
  jackpotWon: boolean
}

export interface GamblingResult {
  success: boolean          // true = net win
  message: string
  effects: Effect
  updatedGambling?: Partial<GamblingState>
  won: number
  lost: number
}

const CASINO_GAMES: Record<GamblingGame, {
  name: string; emoji: string; houseEdge: number; minBet: number; maxBet: number; addictionRisk: number; skillFactor: number
}> = {
  slots:     { name: 'Slot machine',  emoji: '🎰', houseEdge: 0.08, minBet: 1,   maxBet: 100,  addictionRisk: 8, skillFactor: 0   },
  blackjack: { name: 'Blackjack',     emoji: '🃏', houseEdge: 0.005, minBet: 10,  maxBet: 1000, addictionRisk: 5, skillFactor: 0.3 },
  roulette:  { name: 'Roulette',      emoji: '🎡', houseEdge: 0.027, minBet: 5,   maxBet: 500,  addictionRisk: 6, skillFactor: 0   },
  poker:     { name: 'Poker',         emoji: '♠️', houseEdge: 0.03, minBet: 20,  maxBet: 5000, addictionRisk: 7, skillFactor: 0.5 },
}

export class GamblingEngine {
  static playCasinoGame(game: GamblingGame, bet: number, state: GameState): GamblingResult {
    const def = CASINO_GAMES[game]
    if (bet < def.minBet || bet > def.maxBet)
      return { success: false, won: 0, lost: 0, message: `Puntata fuori range (€${def.minBet}–€${def.maxBet}).`, effects: {} }
    if (state.finance.money < bet)
      return { success: false, won: 0, lost: 0, message: 'Non hai abbastanza soldi.', effects: {} }
    if (state.gambling.casinoBlacklisted)
      return { success: false, won: 0, lost: 0, message: 'Sei nella blacklist del casinò.', effects: {} }

    // Win probability = (1 - houseEdge) adjusted by skill
    const intelligenceBonus = (state.stats.intelligence / 100) * def.skillFactor
    const winChance = (1 - def.houseEdge) * (0.5 + intelligenceBonus * 0.3)
    const playerWins = Math.random() < winChance

    const winMultiplier = game === 'slots' ? (Math.random() < 0.05 ? 10 : 1.5) : game === 'poker' ? 1.8 : 1.9
    const netGain = playerWins ? Math.round(bet * (winMultiplier - 1)) : -bet

    const addictionIncrease = def.addictionRisk * 0.5
    const newAddiction = Math.min(100, state.gambling.addictionLevel + addictionIncrease)
    const newGamesPlayed = state.gambling.gamesPlayed + 1
    const newTotalWon = state.gambling.totalWon + (playerWins ? netGain : 0)
    const newTotalLost = state.gambling.totalLost + (playerWins ? 0 : bet)

    const happinessEffect = playerWins ? Math.round(bet / 20) : -Math.round(bet / 30)
    const bankruptcyRisk = state.finance.money + netGain <= 0

    return {
      success: playerWins,
      won: playerWins ? netGain : 0,
      lost: playerWins ? 0 : bet,
      message: playerWins
        ? `${def.emoji} ${def.name}: HAI VINTO +€${netGain.toLocaleString()}!`
        : `${def.emoji} ${def.name}: hai perso €${bet.toLocaleString()}.`,
      effects: {
        money: netGain,
        happiness: bankruptcyRisk ? -30 : happinessEffect,
        mentalHealth: bankruptcyRisk ? -15 : playerWins ? 5 : -3,
        reputation: bankruptcyRisk ? -10 : 0,
      },
      updatedGambling: {
        totalWon: newTotalWon,
        totalLost: newTotalLost,
        gamesPlayed: newGamesPlayed,
        addictionLevel: newAddiction,
        lastPlayedYear: state.time.year,
        biggestWin: playerWins && netGain > state.gambling.biggestWin ? netGain : state.gambling.biggestWin,
      },
    }
  }

  static buyLotteryTicket(state: GameState): GamblingResult {
    const cost = 5
    if (state.finance.money < cost)
      return { success: false, won: 0, lost: cost, message: 'Non hai €5 per il biglietto.', effects: {} }

    const jackpotOdds = 1 / 14000000
    const smallOdds = 0.1  // 10% chance of small prize €5-€50

    const roll = Math.random()
    if (roll < jackpotOdds) {
      const jackpot = Math.round(Math.random() * 90000000 + 10000000)
      return {
        success: true, won: jackpot, lost: 0,
        message: `🎉🎉 HAI VINTO IL JACKPOT! €${jackpot.toLocaleString()}! La tua vita cambia per sempre!`,
        effects: { money: jackpot - cost, happiness: 100, reputation: 30, socialReputation: 20 },
        updatedGambling: { totalWon: state.gambling.totalWon + jackpot, jackpotWon: true, gamesPlayed: state.gambling.gamesPlayed + 1 },
      }
    }
    if (roll < jackpotOdds + smallOdds) {
      const prize = Math.round(Math.random() * 45 + 5)
      return {
        success: true, won: prize, lost: 0,
        message: `🍀 Piccola vincita alla lotteria: +€${prize}!`,
        effects: { money: prize - cost, happiness: 5 },
        updatedGambling: { totalWon: state.gambling.totalWon + prize, gamesPlayed: state.gambling.gamesPlayed + 1 },
      }
    }

    return {
      success: false, won: 0, lost: cost,
      message: `🎟️ Nessuna vincita. -€${cost}.`,
      effects: { money: -cost },
      updatedGambling: { totalLost: state.gambling.totalLost + cost, gamesPlayed: state.gambling.gamesPlayed + 1 },
    }
  }

  static buyScratchCard(state: GameState): GamblingResult {
    const cost = Math.random() < 0.5 ? 5 : 10
    if (state.finance.money < cost)
      return { success: false, won: 0, lost: 0, message: 'Non hai abbastanza soldi.', effects: {} }

    // House edge ~50% — odds of winning something: 25%
    const roll = Math.random()
    if (roll < 0.02) {
      const prize = cost * 100
      return {
        success: true, won: prize, lost: 0,
        message: `💰 Grande vincita gratta e vinci: +€${prize}!`,
        effects: { money: prize - cost, happiness: 15 },
        updatedGambling: { totalWon: state.gambling.totalWon + prize, gamesPlayed: state.gambling.gamesPlayed + 1 },
      }
    }
    if (roll < 0.25) {
      const prize = cost * 2
      return {
        success: true, won: prize, lost: 0,
        message: `🍀 Gratta e vinci: vinci €${prize}!`,
        effects: { money: prize - cost, happiness: 3 },
        updatedGambling: { totalWon: state.gambling.totalWon + prize, gamesPlayed: state.gambling.gamesPlayed + 1 },
      }
    }

    return {
      success: false, won: 0, lost: cost,
      message: `📄 Niente di niente. -€${cost}.`,
      effects: { money: -cost },
      updatedGambling: { totalLost: state.gambling.totalLost + cost, gamesPlayed: state.gambling.gamesPlayed + 1 },
    }
  }

  static placeSportsBet(sport: SportBetType, bet: number, state: GameState): GamblingResult {
    if (bet < 5 || bet > 5000)
      return { success: false, won: 0, lost: 0, message: 'Puntata fuori range (€5–€5.000).', effects: {} }
    if (state.finance.money < bet)
      return { success: false, won: 0, lost: 0, message: 'Non hai abbastanza soldi.', effects: {} }

    // Random odds 1.5x to 4x, ~45% win rate
    const odds = 1.5 + Math.random() * 2.5
    const wins = Math.random() < 0.45
    const netGain = wins ? Math.round(bet * (odds - 1)) : -bet

    return {
      success: wins,
      won: wins ? netGain : 0,
      lost: wins ? 0 : bet,
      message: wins
        ? `⚽ Scommessa ${sport} VINTA! Quote ${odds.toFixed(2)}x → +€${netGain.toLocaleString()}`
        : `😔 Scommessa ${sport} persa. -€${bet.toLocaleString()}`,
      effects: { money: netGain, happiness: wins ? 10 : -5 },
      updatedGambling: {
        totalWon: wins ? state.gambling.totalWon + netGain : state.gambling.totalWon,
        totalLost: wins ? state.gambling.totalLost : state.gambling.totalLost + bet,
        gamesPlayed: state.gambling.gamesPlayed + 1,
        lastPlayedYear: state.time.year,
      },
    }
  }

  static annualTick(state: GameState): { effects: Effect; updatedGambling: Partial<GamblingState> } {
    const { gambling } = state
    if (gambling.addictionLevel < 20) return { effects: {}, updatedGambling: {} }

    // Addiction toll
    const mentalToll = gambling.addictionLevel >= 60 ? -8 : gambling.addictionLevel >= 40 ? -4 : -2
    const happinessToll = gambling.addictionLevel >= 80 ? -10 : gambling.addictionLevel >= 50 ? -5 : 0

    // Natural addiction decay (slight)
    const decay = Math.max(0, gambling.addictionLevel - 5)

    return {
      effects: { mentalHealth: mentalToll, happiness: happinessToll },
      updatedGambling: { addictionLevel: decay },
    }
  }
}
