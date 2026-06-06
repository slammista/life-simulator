import type {
  GameState,
  Relationship,
  RelationshipType,
  RelationshipStage,
  Gender,
  Effect,
  NPCMemory,
} from '../store/types'

// ---- public types ----

export type NPCContext =
  | 'school'
  | 'work'
  | 'neighborhood'
  | 'dating_app'
  | 'bar'
  | 'travel'
  | 'family'
  | 'random'

export type NPCAction =
  | 'greet'
  | 'hang_out'
  | 'compliment'
  | 'confess_feelings'
  | 'ask_date'
  | 'kiss'
  | 'propose'
  | 'break_up'
  | 'divorce'
  | 'cheat'
  | 'fight'
  | 'apologize'
  | 'gift'
  | 'insult'

export interface RelActionResult {
  success: boolean
  message: string
  effects: Effect
  stageAdvanced?: boolean
  newStage?: RelationshipStage
  relationshipEnded?: boolean
  memoryEntry?: Omit<NPCMemory, 'id'>
}

// ---- name pools ----

const MALE_NAMES = ['Marco', 'Luca', 'Andrea', 'Matteo', 'Francesco', 'Alessandro', 'Davide', 'Simone', 'Riccardo', 'Stefano', 'Giovanni', 'Emanuele', 'Christian', 'Fabio', 'Paolo', 'Roberto', 'Giorgio', 'Antonio', 'Mario', 'Lorenzo']
const FEMALE_NAMES = ['Sara', 'Giulia', 'Martina', 'Valentina', 'Alessia', 'Chiara', 'Federica', 'Silvia', 'Laura', 'Elena', 'Francesca', 'Michela', 'Roberta', 'Paola', 'Monica', 'Ilaria', 'Serena', 'Daniela', 'Elisa', 'Sofia']
const SURNAMES = ['Rossi', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Fontana', 'Giordano', 'Russo', 'Barbieri', 'Ferrara']

const GENDER_EMOJIS: Record<Gender, string[]> = {
  male: ['👨', '👦', '🧑', '👴'],
  female: ['👩', '👧', '🧑', '👵'],
  non_binary: ['🧑'],
}

const STAGE_ORDER: RelationshipStage[] = [
  'stranger', 'acquaintance', 'friend', 'close_friend', 'partner', 'spouse',
]

// ---- engine ----

export class RelationshipEngine {
  static generateNPC(context: NPCContext, state: GameState): Relationship {
    const uid = () => Math.random().toString(36).slice(2, 10)
    const playerAge = state.time.age

    // Age range based on context
    const ageOffset = context === 'school' ? [-4, 4] :
                      context === 'work'   ? [-10, 15] :
                      context === 'dating_app' ? [-8, 8] :
                      [-15, 15]
    const age = Math.max(6, Math.min(80,
      playerAge + ageOffset[0] + Math.floor(Math.random() * (ageOffset[1] - ageOffset[0]))
    ))

    // Gender (50/50 unless orientation set)
    const gender: Gender = Math.random() < 0.5 ? 'male' : 'female'
    const ageGroup = age < 18 ? 0 : age < 40 ? 1 : age < 65 ? 2 : 3
    const emoji = GENDER_EMOJIS[gender][Math.min(ageGroup, GENDER_EMOJIS[gender].length - 1)]

    const namePool = gender === 'male' ? MALE_NAMES : FEMALE_NAMES
    const name = `${namePool[Math.floor(Math.random() * namePool.length)]} ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`

    const type: RelationshipType = context === 'family' ? 'sibling' : 'acquaintance'

    // Initial stats based on context
    const baseTrust = context === 'family' ? 70 : 20 + Math.floor(Math.random() * 20)
    const attraction = context === 'dating_app'
      ? 40 + Math.floor(Math.random() * 40)
      : 10 + Math.floor(Math.random() * 30)

    return {
      id: uid(),
      npcId: uid(),
      name,
      age,
      gender,
      emoji,
      type,
      stage: context === 'family' ? 'friend' : 'stranger',
      trust: baseTrust,
      jealousy: 0,
      attraction,
      love: 0,
      respect: 30 + Math.floor(Math.random() * 30),
      toxicityTag: Math.random() < 0.08,
      historyFlags: [`met_via_${context}`],
      memoryLog: [],
      isAlive: true,
      nationality: state.identity.nationality,
    }
  }

  static meetNewPerson(context: NPCContext, state: GameState): RelActionResult {
    // Anti-abuse: max 3 new meetings per year
    const key = `meet_${state.time.year}`
    const count = state.diminishingReturns[key] ?? 0
    if (count >= 3) {
      return {
        success: false,
        message: 'Hai già incontrato molte persone quest\'anno.',
        effects: {},
      }
    }

    const npc = this.generateNPC(context, state)
    const contextLabels: Record<NPCContext, string> = {
      school: 'a scuola',
      work: 'al lavoro',
      neighborhood: 'nel quartiere',
      dating_app: 'su un\'app di dating',
      bar: 'in un bar',
      travel: 'durante un viaggio',
      family: 'in famiglia',
      random: 'per caso',
    }

    return {
      success: true,
      message: `Hai incontrato ${npc.name} (${npc.age}y) ${contextLabels[context]}.`,
      effects: { happiness: 3, socialReputation: 1 },
      memoryEntry: {
        category: 'friendship',
        description: `Hai conosciuto ${npc.name} ${contextLabels[context]}`,
        year: state.time.year,
        weight: 1,
        decayFactor: 0.05,
        unforgettable: false,
      },
      // New relationship returned separately — store action handles it
    }
  }

  static interact(
    rel: Relationship,
    action: NPCAction,
    state: GameState
  ): RelActionResult & { updatedRel?: Partial<Relationship> } {
    // Anti-abuse: diminishing returns per NPC per year
    const key = `interact_${rel.id}_${state.time.year}`
    const count = state.diminishingReturns[key] ?? 0
    const dr = Math.max(0.3, 1 - count * 0.15)

    switch (action) {
      case 'greet':
        return this._greet(rel, dr, state)
      case 'hang_out':
        return this._hangOut(rel, dr, state)
      case 'compliment':
        return this._compliment(rel, dr, state)
      case 'gift':
        return this._gift(rel, dr, state)
      case 'confess_feelings':
        return this._confess(rel, state)
      case 'ask_date':
        return this._askDate(rel, state)
      case 'kiss':
        return this._kiss(rel, state)
      case 'propose':
        return this._propose(rel, state)
      case 'break_up':
        return this._breakUp(rel, state)
      case 'divorce':
        return this._divorce(rel, state)
      case 'cheat':
        return this._cheat(rel, state)
      case 'fight':
        return this._fight(rel, dr, state)
      case 'apologize':
        return this._apologize(rel, state)
      case 'insult':
        return this._insult(rel, state)
      default:
        return { success: false, message: 'Azione non riconosciuta.', effects: {} }
    }
  }

  /** Annual decay: all relationships drift apart if not maintained */
  static annualDecay(relationships: Relationship[], state: GameState): Relationship[] {
    return relationships.map(rel => {
      // Family decays much slower
      const decayRate = rel.type === 'parent' || rel.type === 'sibling' || rel.type === 'child'
        ? 1
        : rel.stage === 'spouse' ? 1 : 3

      const newTrust = Math.max(0, rel.trust - decayRate)
      const newLove = rel.stage === 'partner' || rel.stage === 'spouse'
        ? Math.max(0, rel.love - 1)
        : rel.love

      // Toxicity escalation
      const jealousyIncrease = rel.toxicityTag ? 3 : 0

      // Age NPC
      return {
        ...rel,
        age: rel.age + 1,
        trust: newTrust,
        love: newLove,
        jealousy: Math.min(100, rel.jealousy + jealousyIncrease),
      }
    })
  }

  // ---- private actions ----

  private static _greet(rel: Relationship, dr: number, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const trustGain = Math.round(3 * dr)
    const { advanced, newStage } = this._checkStageAdvance(rel, trustGain)
    return {
      success: true,
      message: `Hai salutato ${rel.name}. ${advanced ? `Siete diventati ${newStage}!` : ''}`,
      effects: { happiness: 1 },
      stageAdvanced: advanced,
      newStage,
      updatedRel: { trust: Math.min(100, rel.trust + trustGain), stage: newStage ?? rel.stage },
    }
  }

  private static _hangOut(rel: Relationship, dr: number, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const cost = 30 + Math.floor(Math.random() * 50)
    if (state.finance.money < cost) {
      return { success: false, message: 'Non hai abbastanza soldi.', effects: {} }
    }
    const trustGain = Math.round(8 * dr)
    const loveGain = rel.stage === 'partner' ? Math.round(5 * dr) : 0
    const { advanced, newStage } = this._checkStageAdvance(rel, trustGain)
    return {
      success: true,
      message: `Hai passato del tempo con ${rel.name}. ${advanced ? `Siete diventati ${newStage}!` : ''}`,
      effects: { happiness: 6, money: -cost },
      stageAdvanced: advanced,
      newStage,
      updatedRel: {
        trust: Math.min(100, rel.trust + trustGain),
        love: Math.min(100, rel.love + loveGain),
        stage: newStage ?? rel.stage,
      },
      memoryEntry: {
        category: 'friendship',
        description: `Uscita con ${rel.name}`,
        year: 0, // filled by store
        weight: 1,
        decayFactor: 0.1,
        unforgettable: false,
      },
    }
  }

  private static _compliment(rel: Relationship, dr: number, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const attractionGain = Math.round(5 * dr)
    const trustGain = Math.round(3 * dr)
    return {
      success: true,
      message: `Hai fatto un complimento a ${rel.name}. Sorride.`,
      effects: { happiness: 2 },
      updatedRel: {
        attraction: Math.min(100, rel.attraction + attractionGain),
        trust: Math.min(100, rel.trust + trustGain),
      },
    }
  }

  private static _gift(rel: Relationship, dr: number, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const cost = 20 + Math.floor(Math.random() * 80)
    if (state.finance.money < cost) {
      return { success: false, message: 'Non hai abbastanza soldi per un regalo.', effects: {} }
    }
    const loveGain = Math.round(10 * dr)
    const trustGain = Math.round(8 * dr)
    return {
      success: true,
      message: `Hai regalato qualcosa a ${rel.name} (€${cost}). È felice!`,
      effects: { happiness: 5, money: -cost },
      updatedRel: {
        love: Math.min(100, rel.love + loveGain),
        trust: Math.min(100, rel.trust + trustGain),
      },
    }
  }

  private static _confess(rel: Relationship, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    if (rel.stage !== 'acquaintance' && rel.stage !== 'friend' && rel.stage !== 'close_friend') {
      return { success: false, message: `Non puoi confessare i tuoi sentimenti a ${rel.name} in questa fase.`, effects: {} }
    }
    const accepted = rel.attraction >= 40 && rel.trust >= 35 && Math.random() < (rel.attraction / 100)
    if (!accepted) {
      return {
        success: false,
        message: `${rel.name} ha gentilmente rifiutato. Ti senti imbarazzato/a.`,
        effects: { happiness: -8, mentalHealth: -5 },
        updatedRel: { trust: Math.max(0, rel.trust - 5) },
      }
    }
    return {
      success: true,
      message: `${rel.name} ha ricambiato i tuoi sentimenti! 💕`,
      effects: { happiness: 20, mentalHealth: 5 },
      stageAdvanced: true,
      newStage: 'partner',
      updatedRel: { stage: 'partner', love: 60, type: 'partner' },
      memoryEntry: {
        category: 'romantic',
        description: `Confessione dei sentimenti a ${rel.name}`,
        year: 0,
        weight: 3,
        decayFactor: 0.01,
        unforgettable: true,
      },
    }
  }

  private static _askDate(rel: Relationship, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    if (rel.stage === 'stranger') {
      return { success: false, message: 'Non conosci abbastanza questa persona.', effects: {} }
    }
    const cost = 50 + Math.floor(Math.random() * 100)
    if (state.finance.money < cost) {
      return { success: false, message: 'Non hai abbastanza soldi per un appuntamento.', effects: {} }
    }
    const chance = (rel.attraction / 100) * 0.7 + (rel.trust / 100) * 0.3
    const accepted = Math.random() < chance
    if (!accepted) {
      return {
        success: false,
        message: `${rel.name} non era disponibile per un appuntamento.`,
        effects: { happiness: -4, money: -cost / 2 },
      }
    }
    const loveGain = 15 + Math.floor(Math.random() * 10)
    const trustGain = 10
    const { newStage } = this._checkStageAdvance({ ...rel, trust: rel.trust + trustGain, love: rel.love + loveGain }, 0)
    return {
      success: true,
      message: `Appuntamento con ${rel.name} andato benissimo! 💑`,
      effects: { happiness: 15, money: -cost },
      updatedRel: {
        love: Math.min(100, rel.love + loveGain),
        trust: Math.min(100, rel.trust + trustGain),
        attraction: Math.min(100, rel.attraction + 5),
        stage: newStage ?? rel.stage,
      },
    }
  }

  private static _kiss(rel: Relationship, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    if (rel.stage !== 'partner' && rel.stage !== 'spouse' && rel.stage !== 'close_friend') {
      return { success: false, message: 'Non è il momento giusto.', effects: {} }
    }
    const accepted = rel.love >= 40 && Math.random() < 0.75
    if (!accepted) {
      return {
        success: false,
        message: `${rel.name} non era pronto/a.`,
        effects: { happiness: -3 },
        updatedRel: { trust: Math.max(0, rel.trust - 3) },
      }
    }
    return {
      success: true,
      message: `Un bacio con ${rel.name}. 😘`,
      effects: { happiness: 10, mentalHealth: 5 },
      updatedRel: {
        love: Math.min(100, rel.love + 8),
        attraction: Math.min(100, rel.attraction + 5),
      },
    }
  }

  private static _propose(rel: Relationship, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    if (rel.stage !== 'partner') {
      return { success: false, message: 'Puoi proporre solo al tuo/a partner.', effects: {} }
    }
    if (state.time.age < 18) {
      return { success: false, message: 'Sei troppo giovane per sposarti.', effects: {} }
    }
    if (!state.nation?.sameMarriageLegal && rel.gender === state.identity.gender) {
      return { success: false, message: 'Il matrimonio same-sex non è legale nel tuo paese.', effects: {} }
    }
    const ringCost = 1000 + Math.floor(Math.random() * 4000)
    if (state.finance.money < ringCost) {
      return { success: false, message: `Non hai abbastanza soldi per l'anello (€${ringCost.toLocaleString('it-IT')}).`, effects: {} }
    }
    const chance = (rel.love / 100) * 0.6 + (rel.trust / 100) * 0.4
    const accepted = Math.random() < Math.min(0.9, chance)
    if (!accepted) {
      return {
        success: false,
        message: `${rel.name} non si sente ancora pronto/a. Il cuore è a pezzi.`,
        effects: { happiness: -20, mentalHealth: -15, money: -ringCost },
      }
    }
    return {
      success: true,
      message: `${rel.name} ha detto SÌ! 💍 Siete fidanzati!`,
      effects: { happiness: 30, mentalHealth: 15, money: -ringCost },
      stageAdvanced: true,
      newStage: 'spouse',
      updatedRel: {
        stage: 'spouse',
        type: 'spouse',
        love: Math.min(100, rel.love + 15),
        historyFlags: [...rel.historyFlags, 'married'],
      },
      memoryEntry: {
        category: 'romantic',
        description: `Proposta di matrimonio accettata`,
        year: 0,
        weight: 5,
        decayFactor: 0,
        unforgettable: true,
      },
    }
  }

  private static _breakUp(rel: Relationship, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    if (rel.stage !== 'partner') {
      return { success: false, message: 'Non sei in una relazione con questa persona.', effects: {} }
    }
    return {
      success: true,
      message: `Hai lasciato ${rel.name}. È una decisione difficile.`,
      effects: { happiness: -10, mentalHealth: -8 },
      relationshipEnded: true,
      updatedRel: { type: 'ex_partner', stage: 'acquaintance', love: 0, historyFlags: [...rel.historyFlags, 'broken_up'] },
      memoryEntry: {
        category: 'romantic',
        description: `Rottura con ${rel.name}`,
        year: 0,
        weight: 3,
        decayFactor: 0.02,
        unforgettable: false,
      },
    }
  }

  private static _divorce(rel: Relationship, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    if (rel.stage !== 'spouse') {
      return { success: false, message: 'Non sei sposato/a con questa persona.', effects: {} }
    }
    const cost = 2000 + Math.floor(Math.random() * 8000)
    return {
      success: true,
      message: `Hai divorziato da ${rel.name}. Costo legale: €${cost.toLocaleString('it-IT')}.`,
      effects: { happiness: -20, mentalHealth: -15, money: -cost, reputation: -5 },
      relationshipEnded: true,
      updatedRel: {
        type: 'ex_partner', stage: 'acquaintance',
        love: 0, trust: Math.max(0, rel.trust - 30),
        historyFlags: [...rel.historyFlags, 'divorced'],
      },
      memoryEntry: {
        category: 'romantic',
        description: `Divorzio da ${rel.name}`,
        year: 0,
        weight: 4,
        decayFactor: 0.01,
        unforgettable: true,
      },
    }
  }

  private static _cheat(rel: Relationship, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    // Find current spouse/partner
    const spouse = state.relationships.find(r => r.stage === 'spouse' || r.stage === 'partner')
    if (!spouse) return { success: false, message: 'Non hai un partner da tradire.', effects: {} }

    const cheats = rel.historyFlags.filter(f => f === 'cheated').length
    if (cheats >= 2) {
      return { success: false, message: `${rel.name} non si fida più di te per questo.`, effects: {} }
    }

    // Detection chance increases with each cheat and low trust
    const detectionChance = 0.2 + cheats * 0.2 + (1 - spouse.trust / 100) * 0.1
    const discovered = Math.random() < detectionChance

    if (discovered) {
      return {
        success: false,
        message: `${spouse.name} ha scoperto il tradimento con ${rel.name}! La relazione è in crisi.`,
        effects: { happiness: -25, mentalHealth: -15, karma: -10, reputation: -8 },
        updatedRel: {
          historyFlags: [...rel.historyFlags, 'cheated'],
        },
        memoryEntry: {
          category: 'romantic',
          description: `Tradimento scoperto con ${rel.name}`,
          year: 0,
          weight: 5,
          decayFactor: 0,
          unforgettable: true,
        },
      }
    }

    return {
      success: true,
      message: `Hai tradito ${spouse.name} con ${rel.name}. Nessuno lo ha scoperto... per ora.`,
      effects: { happiness: 5, karma: -15 },
      updatedRel: {
        love: Math.min(100, rel.love + 10),
        historyFlags: [...rel.historyFlags, 'cheated'],
      },
    }
  }

  private static _fight(rel: Relationship, dr: number, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const trustLoss = Math.round(10 * dr)
    return {
      success: true,
      message: `Hai litigato con ${rel.name}. I rapporti si sono raffreddati.`,
      effects: { happiness: -5, mentalHealth: -3 },
      updatedRel: {
        trust: Math.max(0, rel.trust - trustLoss),
        jealousy: Math.min(100, rel.jealousy + 5),
      },
    }
  }

  private static _apologize(rel: Relationship, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    if (rel.trust > 60) {
      return { success: false, message: `${rel.name} non ha nulla da perdonarti.`, effects: {} }
    }
    const trustGain = 8 + Math.floor(Math.random() * 10)
    return {
      success: true,
      message: `Hai chiesto scusa a ${rel.name}. ${rel.trust + trustGain > 50 ? 'Ha accettato le scuse.' : 'Ci vorrà tempo.'}`,
      effects: { happiness: 3, karma: 2 },
      updatedRel: { trust: Math.min(100, rel.trust + trustGain) },
    }
  }

  private static _insult(rel: Relationship, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const newTrust = Math.max(0, rel.trust - 20)
    const broken = newTrust < 10 && rel.type !== 'parent' && rel.type !== 'sibling'
    return {
      success: true,
      message: broken
        ? `${rel.name} ha tagliato i ponti con te dopo l'insulto.`
        : `Hai insultato ${rel.name}. È ferito/a.`,
      effects: { karma: -5 },
      relationshipEnded: broken,
      updatedRel: { trust: newTrust, stage: broken ? 'stranger' : rel.stage },
    }
  }

  // ---- stage advance helper ----

  private static _checkStageAdvance(
    rel: Relationship,
    _trustGain: number
  ): { advanced: boolean; newStage?: RelationshipStage } {
    const currentIdx = STAGE_ORDER.indexOf(rel.stage)
    if (currentIdx >= 3) return { advanced: false } // won't auto-advance to partner/spouse

    const thresholds: Record<RelationshipStage, number> = {
      stranger: 20,
      acquaintance: 45,
      friend: 65,
      close_friend: 80,
      partner: 90,
      spouse: 100,
    }

    const next = STAGE_ORDER[currentIdx + 1] as RelationshipStage
    if (next && rel.trust >= thresholds[rel.stage]) {
      return { advanced: true, newStage: next }
    }

    return { advanced: false }
  }
}
