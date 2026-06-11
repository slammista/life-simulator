import type { GameState } from '../store/types'

export interface Regret {
  id: string
  emoji: string
  text: string
  weight: number
}

interface RegretRule {
  id: string
  emoji: string
  text: string
  weight: number
  applies: (s: GameState) => boolean
}

const arcFlag = (s: GameState, flag: string): boolean =>
  (s.narrative?.arcs ?? []).some(a => a.flags[flag] === true)

const REGRET_RULES: RegretRule[] = [
  {
    id: 'died_young', emoji: '🕯️', weight: 100,
    text: 'Tanta vita ancora da vivere. Il tempo non te l\'ha concesso.',
    applies: s => s.time.age < 40,
  },
  {
    id: 'never_married', emoji: '💍', weight: 60,
    text: 'Non hai mai detto "sì" davanti a un altare. L\'amore vero è rimasto un appuntamento mancato.',
    applies: s => !s.relationships.some(r => r.stage === 'spouse') &&
      !s.lifeMemories.some(m => m.emoji === '💒') && s.time.age >= 40,
  },
  {
    id: 'no_children', emoji: '👶', weight: 55,
    text: 'Nessun figlio ha portato avanti la tua storia. La casa è rimasta silenziosa.',
    applies: s => s.children.length === 0 && s.time.age >= 45,
  },
  {
    id: 'never_traveled', emoji: '✈️', weight: 45,
    text: 'Il mondo era là fuori, e tu non sei mai andato a vederlo.',
    applies: s => s.travelHistory.length === 0 && s.time.age >= 35,
  },
  {
    id: 'died_in_debt', emoji: '💳', weight: 50,
    text: 'Te ne sei andato lasciando debiti. I conti, alla fine, non sono mai tornati.',
    applies: s => s.finance.debt > 0 || s.finance.money < 0,
  },
  {
    id: 'never_owned_home', emoji: '🏠', weight: 35,
    text: 'Una casa tutta tua è rimasta un sogno appeso alle vetrine delle agenzie.',
    applies: s => s.living.type !== 'owning' && s.time.age >= 50,
  },
  {
    id: 'estranged_family', emoji: '🥀', weight: 65,
    text: 'La tua famiglia è diventata un gruppo di estranei. Il sangue non è bastato.',
    applies: s => {
      if (arcFlag(s, 'fratello_perduto')) return true
      const parents = s.relationships.filter(r => r.type === 'parent')
      return parents.length > 0 && parents.reduce((sum, p) => sum + p.trust, 0) / parents.length < 30
    },
  },
  {
    id: 'abandoned_dream', emoji: '🎭', weight: 70,
    text: 'C\'era un sogno, una volta. L\'hai lasciato in un cassetto e non l\'hai più riaperto.',
    applies: s => arcFlag(s, 'musica_abbandonata') || arcFlag(s, 'what_if_musica') || arcFlag(s, 'sogno_di_mamma_infranto'),
  },
  {
    id: 'no_close_friend', emoji: '🫥', weight: 40,
    text: 'Nessun amico ti ha conosciuto davvero. Tanta gente intorno, nessuno vicino.',
    applies: s => !s.relationships.some(r => (r.type === 'friend' || r.type === 'best_friend') && r.trust >= 70) && s.time.age >= 30,
  },
  {
    id: 'joyless_grind', emoji: '⚙️', weight: 45,
    text: 'Hai lavorato tanto, sorriso poco. Gli anni migliori se li è presi l\'ufficio.',
    applies: s => s.career.jobHistory.length >= 3 && s.stats.happiness < 40,
  },
  {
    id: 'criminal_record', emoji: '⚖️', weight: 40,
    text: 'La fedina sporca ti ha seguito fino alla fine. Certi errori non si cancellano.',
    applies: s => s.criminal.hasRecord && s.stats.karma < 0,
  },
  {
    id: 'never_generous', emoji: '🪙', weight: 35,
    text: 'Ogni volta che qualcuno ha chiesto aiuto, hai detto no. Nessuno piangerà a lungo.',
    applies: s => {
      const reqs = s.narrative?.npcRequestHistory ?? []
      return reqs.length >= 3 && reqs.every(r => !r.accepted)
    },
  },
]

const EPITAPHS = {
  family:  (name: string) => `«Qui riposa ${name}, che amò la sua famiglia sopra ogni cosa.»`,
  wealth:  (name: string) => `«Qui riposa ${name}, che costruì un impero partendo da niente.»`,
  fame:    (name: string) => `«Qui riposa ${name}, il cui nome risuonò ben oltre queste mura.»`,
  kind:    (name: string) => `«Qui riposa ${name}, che amò molto e rimpianse poco.»`,
  troubled:(name: string) => `«Qui riposa ${name}, che lottò contro la vita fino all'ultimo round.»`,
  young:   (name: string) => `«Qui riposa ${name}, andato via troppo presto, come le canzoni più belle.»`,
}

export class RegretEngine {
  static computeRegrets(state: GameState): Regret[] {
    return REGRET_RULES
      .filter(rule => {
        try { return rule.applies(state) } catch { return false }
      })
      .map(({ id, emoji, text, weight }) => ({ id, emoji, text, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
  }

  static computeEpitaph(state: GameState): string {
    const name = `${state.identity.name} ${state.identity.surname}`
    if (state.time.age < 40) return EPITAPHS.young(name)
    const regretCount = this.computeRegrets(state).length
    const wealth = state.finance.money + state.finance.bankBalance
    const familyScore = state.children.length * 2 +
      (state.relationships.some(r => r.stage === 'spouse') ? 3 : 0) +
      state.relationships.filter(r => r.type === 'parent' && r.trust >= 60).length

    if (regretCount >= 4) return EPITAPHS.troubled(name)
    if (state.fame.fame > 400) return EPITAPHS.fame(name)
    if (wealth >= 500000) return EPITAPHS.wealth(name)
    if (familyScore >= 4) return EPITAPHS.family(name)
    return EPITAPHS.kind(name)
  }
}
