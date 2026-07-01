import type { GameState, Effect, PlayerContract, TransferOffer, SeasonStats } from '../store/types'
import { getSportDef } from './SportEngine'
import { CareerLifecycleEngine } from './CareerLifecycleEngine'

export type SpecialCareerType = 'actor' | 'musician' | 'pro_athlete' | 'politician' | 'criminal'

// Single source of truth for the minimum age of each special career — read by
// both the store's startSpecialCareer gate and the SpecialCareerScreen UI, so
// the two never drift apart (musician starts younger, politician needs 25+).
export const SPECIAL_CAREER_MIN_AGE: Record<SpecialCareerType, number> = {
  actor: 16,
  musician: 14,
  pro_athlete: 16,
  politician: 25,
  criminal: 16,
}

export type SpecialCareerPhase = 
  | 'aspiring'      // just starting, no recognition
  | 'emerging'      // small successes, building reputation  
  | 'established'   // regular work, decent income
  | 'successful'    // popular, good income
  | 'superstar'     // elite level, very high income/fame
  | 'declining'     // past peak, losing relevance
  | 'retired'       // ended career

export interface SpecialCareer {
  type: SpecialCareerType
  phase: SpecialCareerPhase
  fame: number        // 0-100
  reputation: number  // 0-100
  income: number      // monthly income from this career
  projectsCompleted: number
  projectsFailed: number
  startYear: number
  lastActionYear: number
  flags: Record<string, boolean | number | string>
  // Athlete-specific lifecycle fields (optional — filled progressively)
  professionalFame?: number          // industry/peer recognition
  publicFame?: number                // media & fan recognition
  contract?: PlayerContract
  seasonHistory?: SeasonStats[]
  pendingOffer?: TransferOffer       // in-career transfer offer
  careerLegacy?: 'dimenticato' | 'professionista' | 'leggenda_nazionale' | 'leggenda_mondiale'
}

export interface SpecialCareerAction {
  id: string
  label: string
  emoji: string
  description: string
  energyCost: number
  moneyCost: number
  minPhase: SpecialCareerPhase
  maxUsesPerYear: number
}

export interface SpecialCareerActionResult {
  success: boolean
  message: string
  effects: Effect
  phaseAdvanced?: boolean
  newPhase?: SpecialCareerPhase
  reputationChange: number
  fameChange: number
  incomeChange: number
}

// ---- Actor career ----

const ACTOR_ACTIONS: SpecialCareerAction[] = [
  { id: 'actor_audition',      label: 'Provino',            emoji: '🎭', description: 'Fai un provino per un ruolo',    energyCost: 15, moneyCost: 0,   minPhase: 'aspiring',    maxUsesPerYear: 4 },
  { id: 'actor_short_film',    label: 'Cortometraggio',     emoji: '🎬', description: 'Recita in un cortometraggio',    energyCost: 20, moneyCost: 0,   minPhase: 'aspiring',    maxUsesPerYear: 2 },
  { id: 'actor_tv_role',       label: 'Ruolo TV',           emoji: '📺', description: 'Audizione per ruolo in serie TV', energyCost: 25, moneyCost: 0,   minPhase: 'emerging',    maxUsesPerYear: 2 },
  { id: 'actor_film_role',     label: 'Film al Cinema',     emoji: '🎥', description: 'Audizione per film al cinema',   energyCost: 30, moneyCost: 0,   minPhase: 'established', maxUsesPerYear: 2 },
  { id: 'actor_award_circuit', label: 'Campagna Premio',    emoji: '🏆', description: 'Partecipa alla stagione premi',  energyCost: 20, moneyCost: 5000, minPhase: 'successful', maxUsesPerYear: 1 },
  { id: 'actor_scandal',       label: 'Gestisci Scandalo',  emoji: '📰', description: 'Gestisci uno scandalo mediatico', energyCost: 15, moneyCost: 2000, minPhase: 'emerging',   maxUsesPerYear: 1 },
]

// ---- Musician career ----

const MUSICIAN_ACTIONS: SpecialCareerAction[] = [
  { id: 'musician_demo',       label: 'Registra Demo',      emoji: '🎙️', description: 'Registra un demo musicale',      energyCost: 15, moneyCost: 500,   minPhase: 'aspiring',    maxUsesPerYear: 3 },
  { id: 'musician_gig',        label: 'Concerto Locale',    emoji: '🎵', description: 'Suona in un locale della città', energyCost: 20, moneyCost: 0,    minPhase: 'aspiring',    maxUsesPerYear: 4 },
  { id: 'musician_album',      label: 'Incidi Album',       emoji: '💿', description: 'Registra e pubblica un album',   energyCost: 30, moneyCost: 3000, minPhase: 'emerging',    maxUsesPerYear: 1 },
  { id: 'musician_tour',       label: 'Tour Nazionale',     emoji: '🎤', description: 'Organizza un tour in Italia',    energyCost: 35, moneyCost: 5000, minPhase: 'established', maxUsesPerYear: 1 },
  { id: 'musician_collab',     label: 'Collaborazione',     emoji: '🤝', description: 'Collabora con artista famoso',   energyCost: 20, moneyCost: 0,    minPhase: 'emerging',    maxUsesPerYear: 2 },
  { id: 'musician_world_tour', label: 'Tour Mondiale',      emoji: '🌍', description: 'Parti per un tour mondiale',     energyCost: 40, moneyCost: 20000, minPhase: 'successful', maxUsesPerYear: 1 },
]

// ---- Pro Athlete career ----

const PRO_ATHLETE_ACTIONS: SpecialCareerAction[] = [
  { id: 'athlete_tryout',      label: 'Provino Squadra',    emoji: '⚽', description: 'Fai un provino per squadra pro', energyCost: 25, moneyCost: 0,    minPhase: 'aspiring',    maxUsesPerYear: 3 },
  { id: 'athlete_contract',    label: 'Firma Contratto',    emoji: '📝', description: 'Firma un contratto professionistico', energyCost: 10, moneyCost: 0, minPhase: 'emerging',   maxUsesPerYear: 1 },
  { id: 'athlete_transfer',    label: 'Trattativa Transfer', emoji: '🏆', description: 'Negozia trasferimento a squadra più grande', energyCost: 15, moneyCost: 0, minPhase: 'established', maxUsesPerYear: 1 },
  { id: 'athlete_sponsorship', label: 'Sponsorizzazione',   emoji: '💰', description: 'Firma accordo di sponsorizzazione', energyCost: 10, moneyCost: 0,  minPhase: 'emerging',    maxUsesPerYear: 2 },
  { id: 'athlete_retirement',  label: 'Ritiro Sportivo',    emoji: '🏅', description: "Annuncia il ritiro dall'agonismo", energyCost: 5, moneyCost: 0,   minPhase: 'established', maxUsesPerYear: 1 },
]

// ---- Politician career ----

const POLITICIAN_ACTIONS: SpecialCareerAction[] = [
  { id: 'politician_campaign',  label: 'Campagna Elettorale', emoji: '🏛️', description: 'Lancia campagna elettorale',    energyCost: 30, moneyCost: 5000,  minPhase: 'aspiring',    maxUsesPerYear: 1 },
  { id: 'politician_rally',     label: 'Comizio',             emoji: '🎙️', description: 'Organizza un comizio pubblico', energyCost: 20, moneyCost: 1000, minPhase: 'aspiring',    maxUsesPerYear: 3 },
  { id: 'politician_election',  label: 'Elezioni',            emoji: '🗳️', description: 'Partecipa alle elezioni',       energyCost: 35, moneyCost: 10000, minPhase: 'emerging',   maxUsesPerYear: 1 },
  { id: 'politician_scandal',   label: 'Gestisci Scandalo',   emoji: '📰', description: 'Gestisci scandalo politico',    energyCost: 20, moneyCost: 2000, minPhase: 'emerging',    maxUsesPerYear: 1 },
  { id: 'politician_law',       label: 'Proposta di Legge',   emoji: '📜', description: 'Presenta una proposta di legge', energyCost: 25, moneyCost: 0,   minPhase: 'established', maxUsesPerYear: 2 },
  { id: 'politician_minister',  label: 'Candidatura Ministro', emoji: '🏅', description: 'Candidati a ruolo ministeriale', energyCost: 30, moneyCost: 20000, minPhase: 'successful', maxUsesPerYear: 1 },
]

// ---- Criminal career (organized crime) ----

const CRIMINAL_ACTIONS: SpecialCareerAction[] = [
  { id: 'criminal_join_gang',  label: 'Entra nella Gang',    emoji: '🤝', description: 'Fatti accettare da una banda locale',      energyCost: 15, moneyCost: 0,     minPhase: 'aspiring',    maxUsesPerYear: 2 },
  { id: 'criminal_small_job',  label: 'Lavoretto Sporco',    emoji: '🕶️', description: 'Esegui un piccolo incarico per la banda',  energyCost: 20, moneyCost: 0,     minPhase: 'aspiring',    maxUsesPerYear: 4 },
  { id: 'criminal_racket',     label: 'Giro di Racket',      emoji: '💼', description: 'Gestisci un giro di protezione',           energyCost: 25, moneyCost: 1000,  minPhase: 'emerging',    maxUsesPerYear: 2 },
  { id: 'criminal_heist',      label: 'Colpo Grosso',        emoji: '💎', description: 'Pianifica una rapina di alto profilo',     energyCost: 35, moneyCost: 5000,  minPhase: 'established', maxUsesPerYear: 1 },
  { id: 'criminal_corruption', label: 'Corrompi Funzionari', emoji: '🤫', description: 'Compra protezione dalle autorità',         energyCost: 15, moneyCost: 10000, minPhase: 'established', maxUsesPerYear: 1 },
  { id: 'criminal_boss',       label: 'Scala al Vertice',    emoji: '👑', description: "Sfida il boss per il controllo dell'organizzazione", energyCost: 40, moneyCost: 20000, minPhase: 'successful', maxUsesPerYear: 1 },
]

const CAREER_ACTIONS: Record<SpecialCareerType, SpecialCareerAction[]> = {
  actor: ACTOR_ACTIONS,
  musician: MUSICIAN_ACTIONS,
  pro_athlete: PRO_ATHLETE_ACTIONS,
  politician: POLITICIAN_ACTIONS,
  criminal: CRIMINAL_ACTIONS,
}

const PHASE_ORDER: SpecialCareerPhase[] = ['aspiring', 'emerging', 'established', 'successful', 'superstar', 'declining', 'retired']

// Monthly income by career type and phase
const CAREER_INCOME: Record<SpecialCareerType, Partial<Record<SpecialCareerPhase, number>>> = {
  actor:       { aspiring: 0, emerging: 500, established: 3000, successful: 15000, superstar: 80000 },
  musician:    { aspiring: 0, emerging: 300, established: 2000, successful: 12000, superstar: 60000 },
  pro_athlete: { aspiring: 0, emerging: 2000, established: 8000, successful: 30000, superstar: 150000 },
  politician:  { aspiring: 0, emerging: 1500, established: 4000, successful: 7000, superstar: 12000 },
  criminal:    { aspiring: 0, emerging: 1000, established: 5000, successful: 20000, superstar: 100000 },
}

export function initialSpecialCareer(type: SpecialCareerType, year: number): SpecialCareer {
  return {
    type, phase: 'aspiring', fame: 0, reputation: 10,
    income: 0, projectsCompleted: 0, projectsFailed: 0,
    startYear: year, lastActionYear: year - 1,
    flags: {},
  }
}

export class SpecialCareerEngine {
  static getAvailableActions(career: SpecialCareer, state: GameState): SpecialCareerAction[] {
    const all = CAREER_ACTIONS[career.type]
    const phaseIdx = PHASE_ORDER.indexOf(career.phase)
    return all.filter(a => {
      const minIdx = PHASE_ORDER.indexOf(a.minPhase)
      if (phaseIdx < minIdx) return false
      if (career.phase === 'retired') return false
      const key = `sc_${a.id}_${state.time.year}`
      const uses = state.diminishingReturns[key] ?? 0
      return uses < a.maxUsesPerYear
    })
  }

  static performAction(career: SpecialCareer, actionId: string, state: GameState): SpecialCareerActionResult {
    const action = CAREER_ACTIONS[career.type].find(a => a.id === actionId)
    if (!action) return { success: false, message: 'Azione non trovata.', effects: {}, reputationChange: 0, fameChange: 0, incomeChange: 0 }

    const result = this._executeAction(career, action, state)
    return result
  }

  private static _executeAction(career: SpecialCareer, action: SpecialCareerAction, state: GameState): SpecialCareerActionResult {
    const effects: Effect = {
      energy: -action.energyCost,
      money: -action.moneyCost,
    }
    if (career.type === 'criminal') effects.karma = -3

    // Base success chance influenced by reputation, fame, relevant stats
    const successBase = this._successChance(career, action, state)
    const isSuccess = Math.random() < successBase

    let reputationChange: number
    let fameChange: number
    let incomeChange = 0
    let message: string
    let phaseAdvanced = false
    let newPhase: SpecialCareerPhase | undefined

    if (isSuccess) {
      const rewards = this._successRewards(career, action, state)
      reputationChange = rewards.reputation
      fameChange = rewards.fame
      incomeChange = rewards.income
      message = rewards.message
      effects.happiness = rewards.happiness
      effects.money = (effects.money ?? 0) + rewards.earnings

      // Check phase advance
      career.projectsCompleted++
      if (this._shouldAdvancePhase(career)) {
        const idx = PHASE_ORDER.indexOf(career.phase)
        if (idx < PHASE_ORDER.indexOf('superstar')) {
          newPhase = PHASE_ORDER[idx + 1] as SpecialCareerPhase
          phaseAdvanced = true
          message += career.type === 'criminal'
            ? ` Sei salito di grado: ora sei ${this._phaseLabel(newPhase, 'criminal')}!`
            : ` Sei passato/a alla fase: ${this._phaseLabel(newPhase)}!`
          incomeChange = (CAREER_INCOME[career.type][newPhase] ?? 0) - career.income
        }
      }
    } else {
      const penalties = this._failurePenalties(career, action)
      reputationChange = penalties.reputation
      fameChange = penalties.fame
      message = penalties.message
      effects.happiness = penalties.happiness
      career.projectsFailed++
    }

    return {
      success: isSuccess, message, effects,
      phaseAdvanced, newPhase,
      reputationChange, fameChange, incomeChange,
    }
  }

  private static _successChance(career: SpecialCareer, action: SpecialCareerAction, state: GameState): number {
    let base = 0.45 + (career.reputation / 100) * 0.3 + (career.fame / 100) * 0.2
    // Stats contributions
    if (career.type === 'actor' || career.type === 'musician') {
      base += (state.stats.happiness / 100) * 0.05
    }
    if (career.type === 'politician') {
      base += (state.stats.socialReputation ?? 0) / 100 * 0.1
    }
    if (career.type === 'pro_athlete') {
      base += (state.stats.health / 100) * 0.1
      base += this._linkedSportBonus(career, action, state)
      // Age-based performance multiplier (prime vs decline)
      const linkedSportId = career.flags.linkedSportId
      const sportId = typeof linkedSportId === 'string' ? linkedSportId : ''
      const discipline = (state.stats as unknown as Record<string, number>).discipline ?? 50
      const perfMult = this._athletePerformanceMult(state.time.age, sportId, discipline, state.stats.health)
      base *= perfMult
    }
    if (career.type === 'criminal') {
      // A darker past (negative karma) means more underworld experience.
      base += Math.min(0.1, Math.max(0, -(state.stats.karma ?? 0)) / 100 * 0.1)
    }
    return Math.min(0.9, Math.max(0.1, base))
  }

  // Real-sport integration: sport skill + youth exp boost tryouts and contract negotiations (up to +25%).
  private static _linkedSportBonus(career: SpecialCareer, action: SpecialCareerAction, state: GameState): number {
    if (career.type !== 'pro_athlete') return 0
    if (action.id !== 'athlete_tryout' && action.id !== 'athlete_contract') return 0
    const linkedSportId = career.flags.linkedSportId
    if (typeof linkedSportId !== 'string') return 0
    const sport = (state.sports ?? []).find(s => s.id === linkedSportId)
    if (!sport) return 0
    const skillBonus = (sport.skillLevel / 100) * 0.15
    // Youth experience: each session (age 10-17) adds up to +10% extra
    const youthBonus = Math.min(0.10, (sport.youthExp ?? 0) * 0.01)
    return skillBonus + youthBonus
  }

  private static _successRewards(
    career: SpecialCareer, action: SpecialCareerAction, _state: GameState
  ): { reputation: number; fame: number; income: number; earnings: number; happiness: number; message: string } {
    void _state
    const phaseMultiplier = PHASE_ORDER.indexOf(career.phase) + 1
    const messages: Record<string, Record<string, string>> = {
      actor: {
        actor_audition: 'Il provino è andato benissimo! Hai ottenuto il ruolo! 🎭',
        actor_short_film: 'Il cortometraggio ha ricevuto ottime recensioni! 🎬',
        actor_tv_role: 'Hai ottenuto un ruolo ricorrente nella serie TV! 📺',
        actor_film_role: 'Il film è un successo: la critica ti ama! 🎥🌟',
        actor_award_circuit: 'Nominato/a per il premio! La stagione va a gonfie vele! 🏆',
        actor_scandal: 'Hai gestito lo scandalo con eleganza. La reputazione si riprende! 📰',
      },
      musician: {
        musician_demo: "Il demo ha attirato l'attenzione di alcune etichette! 🎙️",
        musician_gig: 'Concerto sold out! Il pubblico ti adora! 🎵🔥',
        musician_album: "L'album è entrato in classifica! 💿✨",
        musician_tour: 'Tour nazionale con sold out in 5 città! 🎤🌟',
        musician_collab: 'La collaborazione ha raddoppiato la tua visibilità! 🤝',
        musician_world_tour: 'World tour leggendario! Il tuo nome risuona nel mondo! 🌍🏆',
      },
      pro_athlete: {
        athlete_tryout: 'Impressionato/a il selezionatore! Hai superato il provino! ⚽',
        athlete_contract: 'Contratto firmato! Benvenuto/a nel professionismo! 📝',
        athlete_transfer: 'Trasferimento in una squadra di alto livello! 🏆',
        athlete_sponsorship: 'Accordo di sponsorizzazione firmato! 💰',
        athlete_retirement: 'Un addio da leggenda! La folla ti applaude! 🏅',
      },
      politician: {
        politician_campaign: "La campagna decolla! L'elettorato risponde positivamente! 🏛️",
        politician_rally: 'Comizio emozionante! Migliaia di persone ti sostengono! 🎙️',
        politician_election: 'ELETTO/A! Hai vinto le elezioni! 🗳️🎉',
        politician_scandal: 'Hai respinto lo scandalo con abilità. Reputazione intatta! 📰',
        politician_law: 'La tua proposta di legge è stata approvata! 📜✅',
        politician_minister: 'Nominato/a Ministro/a! Il tuo potere cresce! 🏅🏛️',
      },
      criminal: {
        criminal_join_gang: 'La banda ti ha accettato. Ora sei uno di loro. 🤝',
        criminal_small_job: "L'incarico è andato liscio. La banda inizia a fidarsi. 🕶️",
        criminal_racket: 'Il giro di protezione frutta bene. Il quartiere ti rispetta (e ti teme). 💼',
        criminal_heist: 'Colpo perfetto! Nessuna traccia, bottino enorme. 💎',
        criminal_corruption: 'I funzionari giusti ora chiudono un occhio. 🤫',
        criminal_boss: "Hai preso il controllo dell'organizzazione. Sei il nuovo boss. 👑",
      },
    }
    return {
      reputation: 5 + phaseMultiplier * 2,
      fame: 3 + phaseMultiplier * 3,
      income: phaseMultiplier * 100,
      earnings: phaseMultiplier * 500 + Math.round(Math.random() * phaseMultiplier * 1000),
      happiness: 10 + phaseMultiplier,
      message: messages[career.type]?.[action.id] ?? 'Ottimo risultato! 🌟',
    }
  }

  private static _failurePenalties(career: SpecialCareer, action: SpecialCareerAction): {
    reputation: number; fame: number; happiness: number; message: string
  } {
    const failMessages: Record<string, Record<string, string>> = {
      actor: {
        actor_audition: 'Il provino non è andato bene. "Non sei adatto/a per questo ruolo."',
        actor_short_film: 'Il cortometraggio è passato inosservato.',
        actor_tv_role: 'Non hai superato il casting per la serie TV.',
        actor_film_role: 'Il film è stato un flop al botteghino. Critica negativa. 😞',
        actor_award_circuit: 'Campagna premi conclusa senza nomination.',
        actor_scandal: 'Lo scandalo è esploso! La reputazione crolla! 📰💥',
      },
      musician: {
        musician_demo: 'Le etichette non hanno mostrato interesse per il demo.',
        musician_gig: 'Concerto deludente. Sala quasi vuota.',
        musician_album: "L'album non ha venduto bene. Critiche negative. 💿",
        musician_tour: 'Tour cancellato per scarsa vendita biglietti.',
        musician_collab: 'La collaborazione non ha funzionato. Tensioni creative.',
        musician_world_tour: 'Il world tour è stato un disastro organizzativo. 🌍❌',
      },
      pro_athlete: {
        athlete_tryout: 'Non sei riuscito/a a superare il provino. Torna ad allenarti.',
        athlete_contract: 'Trattativa fallita. Le condizioni non erano favorevoli.',
        athlete_transfer: 'Il trasferimento non si è concretizzato.',
        athlete_sponsorship: 'Lo sponsor ha scelto un altro atleta.',
        athlete_retirement: 'Il ritiro è stato accolto con indifferenza.',
      },
      politician: {
        politician_campaign: 'La campagna non ha convinto gli elettori.',
        politician_rally: 'Comizio con scarsa partecipazione. Pochi si presentano.',
        politician_election: 'SCONFITTA ELETTORALE. Gli avversari festeggiano. 🗳️❌',
        politician_scandal: 'Lo scandalo ti ha travolto! Reputazione in caduta libera! 📰💥',
        politician_law: 'La proposta di legge è stata bocciata in Parlamento.',
        politician_minister: 'La candidatura a ministro è stata respinta.',
      },
      criminal: {
        criminal_join_gang: 'La banda non si fida di te. "Torna quando avrai dimostrato qualcosa."',
        criminal_small_job: "L'incarico è andato male. Per poco non ti beccavano. 🚔",
        criminal_racket: 'Un commerciante ha denunciato. Il giro è saltato.',
        criminal_heist: 'Il colpo è fallito! Sei dovuto fuggire a mani vuote. 🚨',
        criminal_corruption: 'Il funzionario ha preso i soldi ed è sparito. Beffato.',
        criminal_boss: 'Il boss ha scoperto il tuo piano. Sei fortunato a essere ancora vivo. ☠️',
      },
    }
    return {
      reputation: -4,
      fame: -1,
      happiness: -6,
      message: failMessages[career.type]?.[action.id] ?? 'Non è andata come speravi.',
    }
  }

  private static _shouldAdvancePhase(career: SpecialCareer): boolean {
    const thresholds: Record<SpecialCareerPhase, number> = {
      aspiring: 2, emerging: 5, established: 8, successful: 12, superstar: 999, declining: 999, retired: 999,
    }
    return career.projectsCompleted >= thresholds[career.phase]
  }

  static _phaseLabel(phase: SpecialCareerPhase, type?: SpecialCareerType): string {
    // The criminal ladder reads as a gang hierarchy instead of showbiz fame.
    if (type === 'criminal') {
      const gangRanks: Record<SpecialCareerPhase, string> = {
        aspiring:    'Recluta',
        emerging:    'Soldato',
        established: 'Capo-zona',
        successful:  'Luogotenente',
        superstar:   'Boss',
        declining:   'In Disgrazia',
        retired:     'Fuori dal giro',
      }
      return gangRanks[phase]
    }
    const labels: Record<SpecialCareerPhase, string> = {
      aspiring:    'Aspirante',
      emerging:    'Emergente',
      established: 'Affermato/a',
      successful:  'Popolare',
      superstar:   'Superstar',
      declining:   'In Declino',
      retired:     'Ritirato/a',
    }
    return labels[phase]
  }

  // ---- Sport career phase system ----

  // [primeStart, primeEnd] by sport id. Outside this window performance decays.
  private static PRIME_AGES: Record<string, [number, number]> = {
    calcio:     [23, 31],
    basket:     [24, 33],
    tennis:     [22, 31],
    mma:        [25, 34],
    boxe:       [24, 35],
    judo:       [23, 33],
    karate:     [23, 34],
    taekwondo:  [22, 31],
    ping_pong:  [24, 36],
    badminton:  [22, 31],
    nuoto:      [18, 28],
    atletica:   [22, 32],
    ginnastica: [15, 25],
    ciclismo:   [24, 34],
    sci:        [22, 33],
    default:    [22, 32],
  }

  // Performance multiplier for athletes (0.3–1.15) based on age vs prime window.
  // discipline (0-100) and health (0-100) can extend the prime by up to 3 years.
  private static _athletePerformanceMult(age: number, sportId: string, discipline: number, health: number): number {
    const [ps, pe] = this.PRIME_AGES[sportId] ?? this.PRIME_AGES.default
    const extension = Math.round(((discipline + health) / 200) * 3)   // 0-3 years
    const effectivePeEnd = pe + extension

    if (age < 16) return 0.40
    if (age < ps) {
      // Rising phase: 0.65 at 16 → 1.0 at primeStart
      return Math.min(1.0, 0.65 + (age - 16) / Math.max(1, ps - 16) * 0.35)
    }
    if (age <= effectivePeEnd) return 1.05  // prime (slight boost)
    if (age <= effectivePeEnd + 4) {
      // Early decline: -8% per year past prime
      return Math.max(0.55, 1.05 - (age - effectivePeEnd) * 0.08)
    }
    // Advanced decline: -11% per year
    return Math.max(0.25, 1.05 - (age - effectivePeEnd) * 0.11)
  }

  // Map SpecialCareer phase to a biological label for events.
  private static _bioPhaseLabel(age: number, sportId: string): string {
    const [ps, pe] = this.PRIME_AGES[sportId] ?? this.PRIME_AGES.default
    if (age < ps) return 'Giovane Promessa'
    if (age <= pe) return 'Picco di Carriera'
    if (age <= pe + 4) return 'Primo Declino'
    return 'Declino Avanzato'
  }

  // Youth bonus: youthExp (practice sessions age 10-17) → bonus skill at pro start.
  static youthBonus(career: SpecialCareer, state: GameState): number {
    if (career.type !== 'pro_athlete') return 0
    const linkedSportId = career.flags.linkedSportId
    if (typeof linkedSportId !== 'string') return 0
    const sport = (state.sports ?? []).find(s => s.id === linkedSportId)
    const exp = sport?.youthExp ?? 0
    // Each youth practice session = +0.5 bonus skill (max 20)
    return Math.min(20, exp * 0.5)
  }

  // ---- Decisive event system ----

  // Guaranteed decisive events per career (hybrid: fires when condition met OR falls back at threshold).
  private static _checkDecisiveEvent(career: SpecialCareer, sportId: string, state: GameState): string | null {
    const age = state.time.age
    const [ps, pe] = this.PRIME_AGES[sportId] ?? this.PRIME_AGES.default
    const sportName = getSportDef(sportId)?.name ?? 'sport'

    // Decisive event 1: first major title (guaranteed once, at/after prime start)
    if (!career.flags.decisive_first_title && age >= ps && (Math.random() < 0.4 || career.projectsCompleted >= 5)) {
      career.flags.decisive_first_title = true
      return `🏆 MOMENTO STORICO! Hai vinto il tuo primo titolo importante in ${sportName}! Una pietra miliare della tua carriera.`
    }

    // Decisive event 2: rivalry (guaranteed once, in prime)
    if (!career.flags.decisive_rivalry && career.flags.decisive_first_title && age >= ps + 2 && (Math.random() < 0.35 || career.projectsCompleted >= 9)) {
      career.flags.decisive_rivalry = true
      return `⚔️ GRANDE RIVALITÀ! La tua sfida epica con un altro campione di ${sportName} tiene tutto il paese col fiato sospeso.`
    }

    // Decisive event 3: career-defining championship (at established+ phase)
    if (!career.flags.decisive_championship && career.phase === 'established' && age <= pe && (Math.random() < 0.3 || career.projectsCompleted >= 12)) {
      career.flags.decisive_championship = true
      return `🥇 CAMPIONATO MONDIALE! Trionfi nella competizione più importante di ${sportName}. Sei nell'Olimpo degli atleti!`
    }

    // Decisive event 4: comeback from injury (fires if injuries >= 2 and still active)
    const sport = (state.sports ?? []).find(s => s.id === sportId)
    if (!career.flags.decisive_comeback && (sport?.injuries ?? 0) >= 2 && career.reputation >= 60 && (Math.random() < 0.45)) {
      career.flags.decisive_comeback = true
      return `💪 GRANDE RITORNO! Dopo i tuoi infortuni, la tua rimonta è diventata fonte d'ispirazione in tutto il mondo.`
    }

    return null
  }

  // ---- Legendary event system ----

  private static _checkLegendaryEvent(career: SpecialCareer, sportId: string, state: GameState): string | null {
    const fame = career.fame
    const age = state.time.age
    const year = state.time.year
    const sportName = getSportDef(sportId)?.name ?? 'sport'

    // Pallone d'Oro / MVP (fame >= 85, superstar, once)
    if (!career.flags.legend_mvp && fame >= 85 && career.phase === 'superstar' && Math.random() < 0.25) {
      career.flags.legend_mvp = true
      return `🌟 PALLONE D'ORO! Eletto/a miglior atleta del mondo in ${sportName}. Il tuo nome è nella storia.`
    }

    // Hall of Fame (fame >= 90, age >= 35, once)
    if (!career.flags.legend_hof && fame >= 90 && age >= 35 && (career.phase === 'declining' || career.phase === 'superstar') && Math.random() < 0.4) {
      career.flags.legend_hof = true
      return `🏛️ HALL OF FAME! Sei stato/a introdotto/a nella Hall of Fame di ${sportName}. Un riconoscimento eterno.`
    }

    // Olympics (fame >= 70, every 4 years, max 3 times)
    const olympicCount = (career.flags.legend_olympic_count as number) ?? 0
    if (fame >= 70 && year % 4 === 0 && olympicCount < 3 && Math.random() < 0.5) {
      career.flags.legend_olympic_count = olympicCount + 1
      const medals = ['bronzo 🥉', 'argento 🥈', 'oro 🥇']
      const medal = olympicCount < medals.length ? medals[olympicCount] : 'oro 🥇'
      return `🏅 OLIMPIADI! Rappresenti il tuo paese e conquisti la medaglia di ${medal} in ${sportName}.`
    }

    // Farewell match (retiring with fame >= 75)
    if (!career.flags.legend_farewell && career.phase === 'declining' && age >= 35 && fame >= 75 && Math.random() < 0.3) {
      career.flags.legend_farewell = true
      return `👑 PARTITA D'ADDIO! Uno stadio gremito ti tributa un'ovazione commovente. La tua carriera in ${sportName} lascia un'impronta indelebile.`
    }

    return null
  }

  static annualTick(career: SpecialCareer, state: GameState): { effects: Effect; updatedCareer: SpecialCareer; messages?: string[] } {
    const effects: Effect = {}
    const updated = { ...career, flags: { ...career.flags } }
    const messages: string[] = []

    // Passive income
    const monthlyIncome = CAREER_INCOME[career.type][career.phase] ?? 0
    if (monthlyIncome > 0) {
      effects.money = monthlyIncome * 12
    }

    // Natural fame decay if no actions taken
    const actionKey = `sc_action_${state.time.year}`
    const actionsThisYear = state.diminishingReturns[actionKey] ?? 0
    if (actionsThisYear === 0 && career.fame > 0) {
      updated.fame = Math.max(0, career.fame - 3)
      updated.reputation = Math.max(0, career.reputation - 1)
    }

    // ---- Pro athlete: realistic career arc + full lifecycle ----
    if (career.type === 'pro_athlete') {
      const linkedSportId = career.flags.linkedSportId
      const sportId = typeof linkedSportId === 'string' ? linkedSportId : ''
      const sport = (state.sports ?? []).find(s => s.id === sportId)
      const discipline = (state.stats as unknown as Record<string, number>).discipline ?? 50
      const age = state.time.age
      const [, pe] = this.PRIME_AGES[sportId] ?? this.PRIME_AGES.default

      const perfMult = this._athletePerformanceMult(age, sportId, discipline, state.stats.health)
      const bioPhase = this._bioPhaseLabel(age, sportId)

      // Youth bonus on first season
      if (!career.flags.youth_bonus_applied && sport) {
        const bonus = this.youthBonus(career, state)
        if (bonus > 0) {
          updated.reputation = Math.min(100, updated.reputation + Math.round(bonus * 0.6))
          updated.flags.youth_bonus_applied = true
          messages.push(`⭐ Il tuo talento giovanile in ${sport.name} ti dà un vantaggio d'inizio carriera!`)
        }
      }

      // Career phase flip (biological age gate)
      if (age > pe + 3 && career.phase !== 'declining' && career.phase !== 'retired') {
        updated.phase = 'declining'
        messages.push(`📉 ${bioPhase}: le prestazioni in ${sport?.name ?? 'sport'} calano con l'età. Il corpo non risponde più come prima.`)
      }

      // Performance penalty on legacy income for declining athletes
      if (career.phase === 'declining') {
        const incomeHit = Math.round(monthlyIncome * (1 - perfMult) * 0.5)
        effects.money = (effects.money ?? 0) - incomeHit * 12
      }

      // Age warning events
      const ageWarnings: Array<[number, string]> = [
        [pe, `⏳ Hai raggiunto la fine del tuo picco naturale in ${sport?.name ?? 'sport'}. È il momento di sfruttare al massimo la tua esperienza.`],
        [pe + 3, `⚠️ A ${age} anni il corpo inizia a sentire il peso degli anni. Pensa al tuo futuro dopo lo sport.`],
        [40, `🕰️ A 40 anni sei un veterano/a assoluto/a. Ogni partita potrebbe essere l'ultima.`],
      ]
      for (const [targetAge, msg] of ageWarnings) {
        if (age === targetAge && !career.flags[`age_warn_${targetAge}`]) {
          updated.flags[`age_warn_${targetAge}`] = true
          messages.push(msg)
        }
      }

      // Legendary events (high-fame athletes)
      if (sportId && updated.fame >= 70) {
        const legendary = this._checkLegendaryEvent(updated, sportId, state)
        if (legendary) {
          messages.push(legendary)
          updated.fame = Math.min(100, updated.fame + 5)
          effects.happiness = (effects.happiness ?? 0) + 20
          effects.money = (effects.money ?? 0) + 50000
        }
      }

      // Decisive events (keep from previous system)
      if (sportId && career.phase !== 'retired') {
        const decisive = this._checkDecisiveEvent(updated, sportId, state)
        if (decisive) {
          messages.push(decisive)
          updated.fame = Math.min(100, updated.fame + 8)
          updated.reputation = Math.min(100, updated.reputation + 6)
          effects.happiness = (effects.happiness ?? 0) + 15
        }
      }

      // ---- Full lifecycle tick: season stats, contracts, transfers ----
      const { updatedCareer: lc, effects: lcFx, messages: lcMsgs } =
        CareerLifecycleEngine.athleteAnnualTick(updated, state)
      // Merge lifecycle results
      Object.assign(updated, lc)
      for (const [k, v] of Object.entries(lcFx)) {
        effects[k] = ((effects[k] as number) ?? 0) + (v as number)
      }
      messages.push(...lcMsgs)
    }

    return { effects, updatedCareer: updated, messages: messages.length > 0 ? messages : undefined }
  }
}
