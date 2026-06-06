import type { GameState, Effect, Child, Gender, EducationLevel } from '../store/types'

export type ParentingAction =
  | 'read_book'
  | 'play'
  | 'homework'
  | 'punish'
  | 'praise'
  | 'gift'
  | 'talk_emotions'
  | 'teach_values'
  | 'sport_activity'

export type ParentingStyle = 'authoritarian' | 'permissive' | 'democratic' | 'neglectful'

export interface ParentingActionDef {
  id: ParentingAction
  label: string
  emoji: string
  playerEffects: Effect
  childEffects: { bondDelta: number; happinessDelta: number; intelligenceDelta: number; healthDelta: number }
  annualLimit: number
}

export const PARENTING_ACTIONS: ParentingActionDef[] = [
  { id: 'read_book',      label: 'Leggi un libro insieme',  emoji: '📖', playerEffects: { happiness: 3 },          childEffects: { bondDelta: 5,  happinessDelta: 3,  intelligenceDelta: 4,  healthDelta: 0  }, annualLimit: 4 },
  { id: 'play',           label: 'Gioca insieme',           emoji: '🎮', playerEffects: { happiness: 5, energy: -3 }, childEffects: { bondDelta: 8,  happinessDelta: 8,  intelligenceDelta: 0,  healthDelta: 2  }, annualLimit: 4 },
  { id: 'homework',       label: 'Aiuta con i compiti',     emoji: '✏️', playerEffects: { happiness: -1, energy: -2 }, childEffects: { bondDelta: 2,  happinessDelta: 1,  intelligenceDelta: 6,  healthDelta: 0  }, annualLimit: 4 },
  { id: 'punish',         label: 'Punisci (timeout)',       emoji: '⛔', playerEffects: { happiness: -2, energy: -1 }, childEffects: { bondDelta: -5, happinessDelta: -6, intelligenceDelta: 0,  healthDelta: 0  }, annualLimit: 3 },
  { id: 'praise',         label: 'Loda e incoraggia',      emoji: '⭐', playerEffects: { happiness: 4 },          childEffects: { bondDelta: 6,  happinessDelta: 7,  intelligenceDelta: 1,  healthDelta: 1  }, annualLimit: 4 },
  { id: 'gift',           label: 'Fai un regalo',          emoji: '🎁', playerEffects: { money: -200 },           childEffects: { bondDelta: 3,  happinessDelta: 10, intelligenceDelta: 0,  healthDelta: 0  }, annualLimit: 3 },
  { id: 'talk_emotions',  label: 'Parla delle emozioni',   emoji: '💬', playerEffects: { happiness: 2, energy: -2 }, childEffects: { bondDelta: 7,  happinessDelta: 4,  intelligenceDelta: 2,  healthDelta: 3  }, annualLimit: 3 },
  { id: 'teach_values',   label: 'Insegna valori',         emoji: '🌟', playerEffects: { karma: 2 },             childEffects: { bondDelta: 4,  happinessDelta: 2,  intelligenceDelta: 3,  healthDelta: 0  }, annualLimit: 2 },
  { id: 'sport_activity', label: 'Attività sportiva',      emoji: '⚽', playerEffects: { health: 2, energy: -3 }, childEffects: { bondDelta: 6,  happinessDelta: 6,  intelligenceDelta: 0,  healthDelta: 5  }, annualLimit: 3 },
]

const SCHOOL_LEVELS_BY_AGE: Array<{ minAge: number; maxAge: number; level: EducationLevel }> = [
  { minAge: 3,  maxAge: 5,  level: 'kindergarten' },
  { minAge: 6,  maxAge: 10, level: 'elementary'   },
  { minAge: 11, maxAge: 13, level: 'middle'        },
  { minAge: 14, maxAge: 18, level: 'highschool'    },
  { minAge: 19, maxAge: 23, level: 'bachelor'      },
]

const MALE_NAMES = ['Luca', 'Marco', 'Andrea', 'Matteo', 'Davide', 'Francesco', 'Lorenzo', 'Simone', 'Gabriele', 'Riccardo']
const FEMALE_NAMES = ['Sofia', 'Emma', 'Giulia', 'Martina', 'Sara', 'Valentina', 'Chiara', 'Alice', 'Giorgia', 'Laura']

export interface ParentingResult {
  success: boolean
  message: string
  effects: Effect
  newChild?: Child
  updatedChild?: Partial<Child>
  devEvent?: string
}

export class ParentingEngine {
  static getActionDef(action: ParentingAction): ParentingActionDef | undefined {
    return PARENTING_ACTIONS.find(a => a.id === action)
  }

  static haveChild(state: GameState, isAdopted = false): ParentingResult {
    const { time, stats, relationships, finance } = state

    if (time.age < 18)
      return { success: false, message: 'Devi avere almeno 18 anni per avere figli.', effects: {} }
    if (time.age > 50 && !isAdopted)
      return { success: false, message: 'Sei troppo grande per avere figli biologici (max 50 anni).', effects: {} }
    if (state.children.length >= 8)
      return { success: false, message: 'Non puoi avere più di 8 figli.', effects: {} }

    if (isAdopted) {
      if (finance.money < 10000)
        return { success: false, message: 'L\'adozione richiede almeno €10.000.', effects: {} }
    } else {
      const hasPartner = relationships.some(r => r.stage === 'partner' || r.stage === 'spouse')
      if (!hasPartner)
        return { success: false, message: 'Hai bisogno di un partner per avere figli biologici.', effects: {} }
    }

    const gender: Gender = Math.random() < 0.51 ? 'female' : 'male'
    const names = gender === 'female' ? FEMALE_NAMES : MALE_NAMES
    const name = names[Math.floor(Math.random() * names.length)]

    // Genetics: child inherits from player
    const intelligenceBase = Math.round(stats.intelligence * 0.5 + Math.random() * 30 + 10)
    const looksBase = Math.round(stats.looks * 0.6 + Math.random() * 25 + 5)

    const newChild: Child = {
      id: Math.random().toString(36).slice(2, 10),
      name,
      age: isAdopted ? Math.floor(Math.random() * 8) + 1 : 0,
      gender,
      intelligence: Math.min(100, intelligenceBase),
      looks: Math.min(100, looksBase),
      health: Math.round(70 + Math.random() * 20),
      happiness: 80,
      personalityTraits: {
        openness: Math.round(40 + Math.random() * 40),
        conscientiousness: Math.round(40 + Math.random() * 40),
        extraversion: Math.round(30 + Math.random() * 50),
        agreeableness: Math.round(50 + Math.random() * 40),
        neuroticism: Math.round(20 + Math.random() * 40),
      },
      bondWithPlayer: isAdopted ? 30 : 80,
      respectForPlayer: 70,
      schoolLevel: isAdopted ? 'elementary' : 'none',
      careerPath: null,
      relationshipStatus: 'single',
      specialNeeds: Math.random() < 0.05 ? ['developmental_delay'] : [],
      isAdopted,
    }

    const emoji = gender === 'female' ? '👶🏻' : '👶'
    const adoptCost = isAdopted ? -10000 : 0
    return {
      success: true,
      newChild,
      message: isAdopted
        ? `${emoji} Hai adottato ${name}! Benvenuto in famiglia. Costo adozione: €10.000.`
        : `${emoji} È nato/a ${name}! La tua famiglia si allarga. Auguri!`,
      effects: { happiness: 20, mentalHealth: 10, money: adoptCost, health: isAdopted ? 0 : -5 },
    }
  }

  static interactWithChild(childId: string, action: ParentingAction, state: GameState): ParentingResult {
    const child = state.children.find(c => c.id === childId)
    if (!child) return { success: false, message: 'Figlio non trovato.', effects: {} }
    if (child.age > 18 && action !== 'talk_emotions' && action !== 'teach_values')
      return { success: false, message: `${child.name} è ormai adulto/a. Le interazioni da bambino non sono più appropriate.`, effects: {} }

    const def = PARENTING_ACTIONS.find(a => a.id === action)
    if (!def) return { success: false, message: 'Azione non valida.', effects: {} }

    const key = `parenting_${childId}_${action}_${state.time.year}`
    const uses = state.diminishingReturns[key] ?? 0
    if (uses >= def.annualLimit)
      return { success: false, message: `Hai già fatto questa attività con ${child.name} abbastanza volte quest'anno.`, effects: {} }

    // Apply gift cost check
    if (action === 'gift' && state.finance.money < 200)
      return { success: false, message: 'Non hai abbastanza soldi per fare un regalo (€200).', effects: {} }

    const { childEffects, playerEffects } = def
    const bondDelta = childEffects.bondDelta * (uses === 0 ? 1 : 0.7)

    return {
      success: true,
      message: `${def.emoji} Hai ${def.label.toLowerCase()} con ${child.name}. Il vostro legame ${bondDelta > 0 ? 'si rafforza' : 'si indebolisce'}.`,
      effects: playerEffects,
      updatedChild: {
        bondWithPlayer: Math.min(100, Math.max(0, child.bondWithPlayer + Math.round(bondDelta))),
        happiness: Math.min(100, Math.max(0, child.happiness + childEffects.happinessDelta)),
        intelligence: Math.min(100, child.intelligence + childEffects.intelligenceDelta),
        health: Math.min(100, Math.max(0, child.health + childEffects.healthDelta)),
      },
    }
  }

  static annualTick(state: GameState): { updatedChildren: Child[]; events: string[] } {
    const events: string[] = []
    const updatedChildren = state.children.map(child => {
      const newAge = child.age + 1

      // Developmental milestone events
      const milestones: Record<number, string> = {
        1:  `${child.name} ha fatto i primi passi! 👶`,
        3:  `${child.name} inizia la scuola dell'infanzia. 🏫`,
        6:  `${child.name} inizia le elementari. 📚`,
        11: `${child.name} inizia le medie. 📖`,
        14: `${child.name} ha iniziato il liceo. 🎒`,
        16: `${child.name} si è innamorato/a per la prima volta! 💕`,
        18: `${child.name} è maggiorenne! Ha ottenuto la maturità. 🎓`,
        22: `${child.name} si è laureato/a. 🎓`,
        25: `${child.name} ha lasciato casa. 🏠`,
      }
      if (milestones[newAge]) events.push(milestones[newAge])

      // School level progression
      const levelForAge = SCHOOL_LEVELS_BY_AGE.find(l => newAge >= l.minAge && newAge <= l.maxAge)
      const newSchoolLevel = newAge >= 18 ? ('bachelor' as EducationLevel) : (levelForAge?.level ?? child.schoolLevel)

      // Natural bond decay if no interaction (very slight)
      const bondDecay = newAge <= 18 ? -2 : -1
      // Natural happiness: depends on bond level
      const happinessShift = child.bondWithPlayer > 60 ? 2 : child.bondWithPlayer < 30 ? -3 : 0

      return {
        ...child,
        age: newAge,
        schoolLevel: newSchoolLevel,
        bondWithPlayer: Math.max(0, child.bondWithPlayer + bondDecay),
        happiness: Math.min(100, Math.max(0, child.happiness + happinessShift)),
        health: Math.max(0, child.health - 0.5),
      }
    })

    return { updatedChildren, events }
  }
}
