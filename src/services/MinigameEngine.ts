import type { GameState } from '../store/types'

export type MinigameType = 'hacking' | 'driving' | 'prison'

export interface MinigameReward {
  money: number
  happiness: number
  karma?: number
  intelligence?: number
  careerBoost?: boolean
}

export const MINIGAME_COOLDOWN = 1  // 1 year between plays of same game

// ─── Hacking — CodeBreaker ───────────────────────────────────────
// Player guesses a 4-digit code in up to 6 attempts.
// Each digit is 0-9. Feedback: 🟩 = right digit right spot, 🟨 = right digit wrong spot.

export interface HackingGuess {
  digits: number[]
  bulls: number   // right digit right position
  cows: number    // right digit wrong position
}

export function generateHackingCode(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10))
}

export function scoreHackingGuess(secret: number[], guess: number[]): { bulls: number; cows: number } {
  let bulls = 0
  let cows = 0
  const secretLeft: number[] = []
  const guessLeft: number[] = []

  for (let i = 0; i < 4; i++) {
    if (guess[i] === secret[i]) bulls++
    else { secretLeft.push(secret[i]); guessLeft.push(guess[i]) }
  }
  for (const d of guessLeft) {
    const idx = secretLeft.indexOf(d)
    if (idx !== -1) { cows++; secretLeft.splice(idx, 1) }
  }
  return { bulls, cows }
}

export function hackingReward(attemptsUsed: number, state: GameState): MinigameReward {
  const base = 200
  const mult = Math.max(1, 7 - attemptsUsed)  // fewer attempts = bigger bonus
  const intel = state.stats.intelligence
  return {
    money:        Math.round(base * mult + intel * 5),
    happiness:    6,
    intelligence: attemptsUsed <= 2 ? 1 : 0,
    careerBoost:  attemptsUsed === 1,
  }
}

// ─── Driving Test — Timing game ──────────────────────────────────
// A progress bar fills from 0 to 100. Player clicks STOP.
// Target zone is 70-90. The closer to 85, the better.

export interface DrivingTestResult {
  score: number      // 0-100 where the player stopped
  passed: boolean    // score in 60-100
  perfect: boolean   // score in 78-92
  grade: 'fail' | 'pass' | 'perfect'
}

export function scoreDrivingTest(stoppedAt: number): DrivingTestResult {
  const passed = stoppedAt >= 60 && stoppedAt <= 100
  const perfect = stoppedAt >= 78 && stoppedAt <= 92
  const grade = !passed ? 'fail' : perfect ? 'perfect' : 'pass'
  return { score: stoppedAt, passed, perfect, grade }
}

export function drivingReward(result: DrivingTestResult, state: GameState): MinigameReward {
  if (!result.passed) return { money: 0, happiness: -5 }
  const base = result.perfect ? 600 : 300
  return {
    money:     Math.round(base + state.stats.intelligence * 2),
    happiness: result.perfect ? 12 : 6,
    karma:     1,
  }
}

// ─── Prison Break — Choice maze ──────────────────────────────────
// Player navigates 4 decision nodes to escape prison.
// Each node has 3 options: one succeeds, one fails, one neutral.

export interface PrisonNode {
  description: string
  options: { label: string; outcome: 'success' | 'fail' | 'neutral'; hint?: string }[]
}

export const PRISON_NODES: PrisonNode[] = [
  {
    description: 'Sei in cortile. Vedi una guardia distratta, un condotto di ventilazione e un detenuto che ti fa cenno.',
    options: [
      { label: 'Segui il condotto',        outcome: 'success', hint: 'Strisci nel sistema di ventilazione.' },
      { label: 'Aggredisci la guardia',     outcome: 'fail',    hint: 'Troppo rischioso.' },
      { label: 'Parla con il detenuto',     outcome: 'neutral', hint: 'Ti dà informazioni ma non progredisci.' },
    ],
  },
  {
    description: 'Sei nel condotto. Un bivio: sinistra porta alla lavanderia, destra all\'esterno.',
    options: [
      { label: 'Vai a destra',             outcome: 'success', hint: 'Direzione esterna.' },
      { label: 'Vai a sinistra',           outcome: 'neutral', hint: 'Ti trovi in lavanderia.' },
      { label: 'Torna indietro',           outcome: 'fail',    hint: 'Sei scoperto.' },
    ],
  },
  {
    description: 'Sei nel magazzino vicino al muro esterno. Una scala, un camion in partenza, una finestra alta.',
    options: [
      { label: 'Nasconditi nel camion',    outcome: 'success', hint: 'Il camion esce senza ispezione.' },
      { label: 'Usa la scala',             outcome: 'fail',    hint: 'Guardie sul muro.' },
      { label: 'Aspetta il buio',          outcome: 'neutral', hint: 'Guadagni tempo, ma non esci.' },
    ],
  },
  {
    description: 'Sei fuori dal carcere. Sirene in lontananza. Un taxi, un bosco, una cabina telefonica.',
    options: [
      { label: 'Prendi il taxi',           outcome: 'success', hint: 'Ti porta lontano prima del blocco.' },
      { label: 'Entra nel bosco',          outcome: 'neutral', hint: 'Ti perdi, vieni ritrovato.' },
      { label: 'Usa il telefono',          outcome: 'fail',    hint: 'Le chiamate sono tracciate.' },
    ],
  },
]

export function prisonReward(successSteps: number, state: GameState): MinigameReward {
  if (successSteps < 4) return { money: 0, happiness: -10, karma: -2 }
  return {
    money:     Math.round(500 + state.stats.intelligence * 8),
    happiness: 20,
    karma:     -3,  // breaking out is bad karma but exciting
  }
}

// ─── Availability checks ─────────────────────────────────────────

export function canPlayMinigame(type: MinigameType, state: GameState): { ok: boolean; reason?: string } {
  const lastPlayed = state.minigameStats.lastPlayed[type] ?? 0
  if (state.time.year - lastPlayed < MINIGAME_COOLDOWN)
    return { ok: false, reason: `Puoi giocare di nuovo tra ${MINIGAME_COOLDOWN - (state.time.year - lastPlayed)} anno/i.` }

  if (type === 'prison' && !state.criminal.inPrison)
    return { ok: false, reason: 'Devi essere in prigione per tentare l\'evasione.' }

  if (type === 'driving' && state.career.licenses?.includes('B'))
    return { ok: false, reason: 'Hai già la patente B.' }

  return { ok: true }
}
