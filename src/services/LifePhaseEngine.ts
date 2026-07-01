import type { GameState, LifePhaseId, PhaseRecap } from '../store/types'

export interface PhaseObjectiveDef {
  id: string
  label: string
  emoji: string
  check: (s: GameState) => boolean
}

export interface LifePhaseDef {
  id: LifePhaseId
  label: string
  emoji: string
  minAge: number
  maxAge: number
  tagline: string
  objectives: PhaseObjectiveDef[]
}

export const LIFE_PHASES: LifePhaseDef[] = [
  {
    id: 'infanzia', label: 'Infanzia', emoji: '🧸', minAge: 0, maxAge: 12,
    tagline: 'Gli anni che costruiscono chi sarai.',
    objectives: [
      { id: 'friend', label: 'Fatti un amico', emoji: '🤝', check: s => s.relationships.some(r => (r.type === 'friend' || r.type === 'best_friend') && r.isAlive) },
      { id: 'school', label: 'Vai bene a scuola', emoji: '📚', check: s => s.education.gpa >= 3.0 },
      { id: 'hobby', label: 'Scopri un hobby', emoji: '🎨', check: s => s.hobbies.length >= 1 },
      { id: 'family', label: 'Famiglia unita', emoji: '🏠', check: s => {
        const parents = s.relationships.filter(r => r.type === 'parent' && r.isAlive)
        if (parents.length === 0) return false
        return parents.reduce((sum, p) => sum + p.trust, 0) / parents.length >= 60
      } },
    ],
  },
  {
    id: 'adolescenza', label: 'Adolescenza', emoji: '🎒', minAge: 13, maxAge: 19,
    tagline: 'Chi sei davvero? È il momento di scoprirlo.',
    objectives: [
      { id: 'highschool', label: 'Frequenta il liceo', emoji: '🏫', check: s => s.education.currentLevel === 'highschool' || s.education.completedLevels.includes('highschool') },
      { id: 'love', label: 'Primo amore', emoji: '💘', check: s => s.relationships.some(r => r.stage === 'partner' || r.stage === 'spouse' || r.type === 'ex_partner') },
      { id: 'job', label: 'Primo lavoretto', emoji: '💪', check: s => s.career.currentJob !== null || s.career.jobHistory.length >= 1 },
      { id: 'clean', label: 'Fuori dai guai', emoji: '😇', check: s => !s.criminal.hasRecord },
    ],
  },
  {
    id: 'giovinezza', label: 'Giovinezza', emoji: '🚀', minAge: 20, maxAge: 39,
    tagline: 'Il mondo è tuo: costruisci le fondamenta.',
    objectives: [
      { id: 'independent', label: 'Vai a vivere da solo', emoji: '🔑', check: s => s.living.type !== 'parents' },
      { id: 'career', label: 'Carriera avviata', emoji: '📈', check: s => s.career.currentJob !== null && (s.career.promotions >= 1 || s.career.currentJob.salary >= 1800) },
      { id: 'stable_love', label: 'Amore stabile', emoji: '❤️', check: s => s.relationships.some(r => (r.stage === 'partner' || r.stage === 'spouse') && r.isAlive) },
      { id: 'savings', label: 'Risparmia €10.000', emoji: '💰', check: s => s.finance.money + s.finance.bankBalance >= 10000 },
    ],
  },
  {
    id: 'maturita', label: 'Maturità', emoji: '🏡', minAge: 40, maxAge: 64,
    tagline: 'Il raccolto di ciò che hai seminato.',
    objectives: [
      { id: 'wealth', label: 'Costruisci un patrimonio', emoji: '🏦', check: s => s.finance.money + s.finance.bankBalance >= 100000 || s.living.type === 'owning' },
      { id: 'family_own', label: 'Una famiglia tua', emoji: '👨‍👩‍👧', check: s => s.children.length >= 1 || s.relationships.some(r => r.stage === 'spouse' && r.isAlive) },
      { id: 'health', label: 'Salute sotto controllo', emoji: '🫀', check: s => s.stats.health >= 50 },
      { id: 'mark', label: 'Lascia un segno', emoji: '⭐', check: s => s.stats.reputation >= 70 || s.ribbons.length >= 8 },
    ],
  },
  {
    id: 'vecchiaia', label: 'Vecchiaia', emoji: '🌅', minAge: 65, maxAge: 200,
    tagline: 'Il tempo dei bilanci e dei tramonti sereni.',
    objectives: [
      { id: 'pension', label: 'Pensione serena', emoji: '🎗️', check: s => s.career.pensionContributions > 0 || s.finance.money + s.finance.bankBalance >= 50000 },
      { id: 'bonds', label: 'Legami ancora vivi', emoji: '🫂', check: s => s.relationships.filter(r => r.isAlive && r.trust >= 60).length >= 2 },
      { id: 'health_old', label: 'Salute che regge', emoji: '💪', check: s => s.stats.health >= 40 },
      { id: 'memories', label: 'Una vita di ricordi', emoji: '📖', check: s => s.lifeMemories.filter(m => m.isImportant).length >= 15 },
    ],
  },
]

const PHASE_END_TITLES: Record<LifePhaseId, string> = {
  infanzia:    'Fine dell\'Infanzia',
  adolescenza: 'Fine dell\'Adolescenza',
  giovinezza:  'Fine della Giovinezza',
  maturita:    'Fine della Maturità',
  vecchiaia:   'Gli ultimi capitoli',
}

export class LifePhaseEngine {
  static getPhase(age: number): LifePhaseDef {
    return LIFE_PHASES.find(p => age >= p.minAge && age <= p.maxAge) ?? LIFE_PHASES[LIFE_PHASES.length - 1]
  }

  static evaluate(state: GameState): { phase: LifePhaseDef; objectives: { def: PhaseObjectiveDef; done: boolean }[] } {
    const phase = this.getPhase(state.time.age)
    return {
      phase,
      objectives: phase.objectives.map(def => ({ def, done: def.check(state) })),
    }
  }

  static buildRecap(phaseId: LifePhaseId, state: GameState, year: number, age: number): PhaseRecap {
    const phase = LIFE_PHASES.find(p => p.id === phaseId) ?? LIFE_PHASES[0]
    const completed = phase.objectives.filter(o => o.check(state))
    const missed = phase.objectives.filter(o => !o.check(state))
    const n = completed.length
    const tot = phase.objectives.length

    let flavor: string
    if (n === tot)       flavor = 'Un capitolo perfetto: hai colto tutto ciò che questa fase poteva offrire.'
    else if (n >= tot - 1) flavor = missed[0] ? `Un ottimo capitolo, anche se l'obiettivo "${missed[0].label}" è rimasto in sospeso.` : 'Un ottimo capitolo.'
    else if (n >= 2)     flavor = 'Luci e ombre, come ogni vita vera.'
    else if (n === 1)    flavor = 'Un capitolo difficile, ma non vuoto.'
    else                 flavor = 'Un capitolo duro. Ma ogni nuova fase è una seconda possibilità.'

    return {
      phaseId,
      year,
      age,
      completedObjectives: completed.map(o => o.label),
      missedObjectives: missed.map(o => o.label),
      summary: `${PHASE_END_TITLES[phaseId]}: ${n} obiettivi su ${tot}. ${flavor}`,
    }
  }

  static phaseEndTitle(phaseId: LifePhaseId): string {
    return PHASE_END_TITLES[phaseId]
  }
}
