// Mini-game challenge registry. Each challenge wraps a mini-game component with
// a framing intro (so it can be "posed as an event" by the game), an
// eligibility check, and a score→reward mapping.

import type { GameState, Effect } from '../../store/types'
import {
  TimingBarGame, TapTargetGame, ReactionGame, QuizFlashGame, QuickTapGame, MemorySequenceGame,
  type MiniGameProps,
} from './games'

export interface ChallengeReward {
  effects: Effect
  message: string
  emoji: string
}

export interface MiniChallenge {
  id: string
  title: string
  emoji: string
  category: string
  // Framing shown when the game "poses" this as an event
  eventIntro: string
  Component: React.FC<MiniGameProps>
  eligible: (s: GameState) => boolean
  reward: (score: number, s: GameState) => ChallengeReward
  eventWeight: number   // relative chance of being chosen as a random event
}

const ok = (score: number) => score >= 0.55

export const MINI_CHALLENGES: MiniChallenge[] = [
  {
    id: 'pickpocket',
    title: 'Borseggio',
    emoji: '🕵️',
    category: 'Crimine',
    eventIntro: 'Noti un portafogli che spunta dalla tasca di uno sconosciuto distratto. Il momento giusto è tutto…',
    Component: TimingBarGame,
    eligible: s => s.time.age >= 14 && !s.criminal.inPrison,
    reward: (score, s): ChallengeReward => ok(score)
      ? { effects: { money: Math.round(150 + score * 1200 + s.stats.intelligence * 3), karma: -2, happiness: 5 }, message: `Colpo riuscito! Hai sfilato €${Math.round(150 + score * 1200)} senza farti notare.`, emoji: '💰' }
      : { effects: { karma: -1, happiness: -6, reputation: -2 }, message: 'Ti hanno quasi beccato! Sei scappato a mani vuote.', emoji: '😰' },
    eventWeight: 3,
  },
  {
    id: 'sport_precision',
    title: 'Tiro perfetto',
    emoji: '🎯',
    category: 'Sport',
    eventIntro: 'Sei in campo e arriva il momento decisivo: concentrazione e tempismo per il colpo perfetto.',
    Component: TapTargetGame,
    eligible: s => s.time.age >= 8,
    reward: (score): ChallengeReward => ok(score)
      ? { effects: { happiness: 8, health: 5, reputation: 4, socialReputation: 3 }, message: 'Prestazione eccellente! Tutti ti applaudono.', emoji: '🏆' }
      : { effects: { happiness: -3, energy: -5 }, message: 'Non era la tua giornata migliore.', emoji: '😓' },
    eventWeight: 2,
  },
  {
    id: 'music_rhythm',
    title: 'A tempo di musica',
    emoji: '🎵',
    category: 'Hobby',
    eventIntro: 'Sul palco di un piccolo locale ti invitano a suonare. Segui il ritmo e conquista il pubblico!',
    Component: QuickTapGame,
    eligible: s => s.time.age >= 6,
    reward: (score): ChallengeReward => ok(score)
      ? { effects: { happiness: 9, socialReputation: 6, money: Math.round(score * 300) }, message: 'Il pubblico è in delirio! Esibizione memorabile.', emoji: '🎸' }
      : { effects: { happiness: 2, socialReputation: -2 }, message: 'Qualche stecca di troppo, ma ti sei divertito.', emoji: '🎤' },
    eventWeight: 2,
  },
  {
    id: 'study_quiz',
    title: 'Quiz lampo',
    emoji: '🧠',
    category: 'Studio',
    eventIntro: 'Interrogazione a sorpresa! Metti alla prova la tua cultura generale.',
    Component: QuizFlashGame,
    eligible: s => s.time.age >= 6 && s.time.age <= 75,
    reward: (score): ChallengeReward => score >= 0.6
      ? { effects: { intelligence: 4, happiness: 6, reputation: 2 }, message: 'Risposte brillanti! Hai fatto un figurone.', emoji: '🎓' }
      : { effects: { intelligence: 1, happiness: -3 }, message: 'Qualche risposta sbagliata. Studierai di più la prossima volta.', emoji: '📚' },
    eventWeight: 3,
  },
  {
    id: 'reflex',
    title: 'Riflessi pronti',
    emoji: '⚡',
    category: 'Sfida',
    eventIntro: 'Una situazione richiede riflessi fulminei. Reagisci al momento giusto!',
    Component: ReactionGame,
    eligible: s => s.time.age >= 10,
    reward: (score): ChallengeReward => ok(score)
      ? { effects: { happiness: 6, energy: 5, health: 2 }, message: 'Riflessi da campione!', emoji: '⚡' }
      : { effects: { happiness: -2 }, message: 'Un po\' lento oggi…', emoji: '🐌' },
    eventWeight: 2,
  },
  {
    id: 'safe_crack',
    title: 'Apri la cassaforte',
    emoji: '🔐',
    category: 'Crimine',
    eventIntro: 'Davanti a te una cassaforte. Memorizza la combinazione e non sbagliare un colpo.',
    Component: MemorySequenceGame,
    eligible: s => s.time.age >= 18 && !s.criminal.inPrison,
    reward: (score, s): ChallengeReward => score >= 0.99
      ? { effects: { money: Math.round(2000 + s.stats.intelligence * 20), karma: -4, happiness: 8 }, message: `Cassaforte aperta! Bottino: €${Math.round(2000 + s.stats.intelligence * 20)}.`, emoji: '💎' }
      : { effects: { karma: -2, happiness: -8, reputation: -3 }, message: 'Allarme scattato! Sei fuggito senza nulla.', emoji: '🚨' },
    eventWeight: 1,
  },
  {
    id: 'cooking',
    title: 'In cucina',
    emoji: '🍝',
    category: 'Cucina',
    eventIntro: 'Hai ospiti a cena! Ricorda l\'ordine degli ingredienti per il piatto perfetto.',
    Component: MemorySequenceGame,
    eligible: s => s.time.age >= 10,
    reward: (score): ChallengeReward => score >= 0.8
      ? { effects: { happiness: 7, socialReputation: 4, money: 0 }, message: 'Piatto da chef stellato! Tutti soddisfatti.', emoji: '👨‍🍳' }
      : { effects: { happiness: 1 }, message: 'Il piatto era… commestibile.', emoji: '🍳' },
    eventWeight: 2,
  },
]

export function getChallenge(id: string): MiniChallenge | undefined {
  return MINI_CHALLENGES.find(c => c.id === id)
}

// Pick a random eligible challenge weighted by eventWeight (for event posing).
export function pickRandomChallenge(s: GameState): MiniChallenge | null {
  const pool = MINI_CHALLENGES.filter(c => c.eligible(s))
  if (pool.length === 0) return null
  const total = pool.reduce((sum, c) => sum + c.eventWeight, 0)
  let r = Math.random() * total
  for (const c of pool) {
    r -= c.eventWeight
    if (r <= 0) return c
  }
  return pool[pool.length - 1]
}
