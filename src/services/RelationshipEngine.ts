import type {
  GameState,
  Relationship,
  RelationshipType,
  RelationshipStage,
  Gender,
  Effect,
  NPCMemory,
  NPCMood,
  NPCPersonalityTrait,
} from '../store/types'
import { ChainReactionEngine } from './ChainReactionEngine'
import { NameEngine } from './NameEngine'

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
  | 'spend_time'
  | 'ask_money'
  | 'make_peace'
  | 'thank'
  | 'surprise'
  | 'romantic_outing'
  | 'vacation_together'
  | 'propose_cohabitation'
  | 'do_activity'
  | 'lend_money'

export interface RelActionResult {
  success: boolean
  message: string
  effects: Effect
  stageAdvanced?: boolean
  newStage?: RelationshipStage
  relationshipEnded?: boolean
  memoryEntry?: Omit<NPCMemory, 'id'>
  newRelationship?: Relationship
}

const GENDER_EMOJIS: Record<Gender, string[]> = {
  male: ['👨', '👦', '🧑', '👴'],
  female: ['👩', '👧', '🧑', '👵'],
  non_binary: ['🧑'],
}

const STAGE_ORDER: RelationshipStage[] = [
  'stranger', 'acquaintance', 'friend', 'close_friend', 'partner', 'spouse',
]

const PERSONALITY_TRAITS: NPCPersonalityTrait[] = [
  'introverso',
  'ambizioso',
  'geloso',
  'generoso',
  'sensibile',
  'sicuro',
  'avido',
  'leale',
  'empatico',
  'impulsivo',
]

const MOODS: NPCMood[] = ['neutrale', 'felice', 'triste', 'geloso', 'arrabbiato', 'nostalgico', 'ansioso', 'motivato']

// ---- engine ----

export class RelationshipEngine {
  private static _randomTraits(): NPCPersonalityTrait[] {
    const shuffled = [...PERSONALITY_TRAITS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 2 + Math.floor(Math.random() * 2))
  }

  private static _initialMood(traits: NPCPersonalityTrait[]): NPCMood {
    if (traits.includes('ambizioso')) return 'motivato'
    if (traits.includes('geloso')) return 'ansioso'
    if (traits.includes('introverso')) return 'neutrale'
    return MOODS[Math.floor(Math.random() * MOODS.length)]
  }

  private static _inferMood(rel: Relationship): NPCMood {
    if (!rel.isAlive) return 'triste'
    if (rel.jealousy >= 70) return 'geloso'
    if (rel.trust <= 20) return 'arrabbiato'
    if (rel.love >= 70 || rel.trust >= 80) return 'felice'
    if (rel.memoryLog.some(mem => mem.unforgettable && mem.category === 'romantic')) return 'nostalgico'
    if ((rel.personalityTraits ?? []).includes('ambizioso')) return 'motivato'
    return rel.mood ?? 'neutrale'
  }

  private static _withHumanReaction(
    rel: Relationship,
    action: NPCAction,
    result: RelActionResult & { updatedRel?: Partial<Relationship> }
  ): RelActionResult & { updatedRel?: Partial<Relationship> } {
    if (!result.success) return result

    const traits = rel.personalityTraits ?? []
    const updatedRel: Partial<Relationship> = { ...(result.updatedRel ?? {}) }
    const notes: string[] = []

    const addTrust = (delta: number) => {
      updatedRel.trust = Math.max(0, Math.min(100, (updatedRel.trust ?? rel.trust) + delta))
    }
    const addLove = (delta: number) => {
      updatedRel.love = Math.max(0, Math.min(100, (updatedRel.love ?? rel.love) + delta))
    }
    const addRespect = (delta: number) => {
      updatedRel.respect = Math.max(0, Math.min(100, (updatedRel.respect ?? rel.respect) + delta))
    }
    const addJealousy = (delta: number) => {
      updatedRel.jealousy = Math.max(0, Math.min(100, (updatedRel.jealousy ?? rel.jealousy) + delta))
    }

    if (action === 'compliment') {
      if (traits.includes('sensibile')) addLove(3)
      if (traits.includes('introverso')) notes.push(`${rel.name} sembra un po' imbarazzato/a.`)
      updatedRel.mood = traits.includes('introverso') ? 'ansioso' : 'felice'
    }

    if (action === 'gift') {
      if (traits.includes('avido')) {
        addLove(4)
        addRespect(-2)
        notes.push(`${rel.name} apprezza molto il valore del regalo.`)
      }
      if (traits.includes('generoso')) addTrust(3)
      updatedRel.mood = 'felice'
    }

    if (action === 'hang_out') {
      if (traits.includes('introverso')) addTrust(-2)
      if (traits.includes('empatico')) addTrust(3)
      if (traits.includes('ambizioso')) addRespect(2)
      updatedRel.mood = traits.includes('introverso') ? 'neutrale' : 'felice'
    }

    if (action === 'fight' || action === 'insult') {
      if (traits.includes('sensibile')) {
        addTrust(-8)
        updatedRel.mood = 'triste'
        notes.push(`${rel.name} se la prende molto sul personale.`)
      } else if (traits.includes('impulsivo')) {
        addJealousy(8)
        updatedRel.mood = 'arrabbiato'
        notes.push(`${rel.name} reagisce d'istinto e la tensione sale.`)
      } else {
        updatedRel.mood = 'arrabbiato'
      }
    }

    if (action === 'apologize') {
      if (traits.includes('empatico') || traits.includes('generoso')) addTrust(5)
      if (traits.includes('leale')) addRespect(2)
      updatedRel.mood = 'neutrale'
    }

    if (action === 'cheat') {
      if (traits.includes('geloso')) addJealousy(12)
      if (traits.includes('leale')) addTrust(-8)
      updatedRel.mood = 'ansioso'
    }

    const previewRel = { ...rel, ...updatedRel }
    updatedRel.mood = updatedRel.mood ?? this._inferMood(previewRel)
    // New actions not in ChainReactionEngine — map them to the closest chain action
    const NEW_ACTIONS = new Set(['spend_time', 'ask_money', 'make_peace', 'thank', 'surprise', 'romantic_outing', 'vacation_together', 'propose_cohabitation', 'do_activity', 'lend_money'])
    const chainAction = NEW_ACTIONS.has(action) ? 'greet' : action
    const chainedRel = ChainReactionEngine.applyAction(rel, chainAction as import('./ChainReactionEngine').RelationshipChainAction, updatedRel)

    return {
      ...result,
      message: notes.length > 0 ? `${result.message} ${notes.join(' ')}` : result.message,
      updatedRel: chainedRel,
    }
  }

  static generateNPC(context: NPCContext, state: GameState): Relationship {
    const uid = () => Math.random().toString(36).slice(2, 10)
    const playerAge = state.time.age
    const personalityTraits = this._randomTraits()

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

    const name = NameEngine.fullName(gender)

    const type: RelationshipType = context === 'family' ? 'sibling' : 'acquaintance'

    // Initial stats based on context
    const baseTrust = context === 'family' ? 70 : 20 + Math.floor(Math.random() * 20)
    const traitTrust = personalityTraits.includes('empatico') ? 8 : personalityTraits.includes('introverso') ? -4 : 0
    const traitJealousy = personalityTraits.includes('geloso') ? 18 : personalityTraits.includes('leale') ? -6 : 0
    const traitRespect = personalityTraits.includes('ambizioso') ? 10 : personalityTraits.includes('impulsivo') ? -4 : 0
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
      trust: Math.max(0, Math.min(100, baseTrust + traitTrust)),
      jealousy: Math.max(0, Math.min(100, traitJealousy)),
      attraction,
      love: 0,
      respect: Math.max(0, Math.min(100, 30 + Math.floor(Math.random() * 30) + traitRespect)),
      toxicityTag: Math.random() < 0.08,
      historyFlags: [`met_via_${context}`],
      personalityTraits,
      mood: this._initialMood(personalityTraits),
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
      newRelationship: npc,
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
    // ── Safety guards (legal & ethical) ──
    const ROMANTIC_ACTS: NPCAction[] = ['confess_feelings', 'ask_date', 'kiss', 'propose', 'cheat', 'break_up', 'divorce']
    const FAMILY_TYPES = ['parent', 'sibling', 'child']
    if (FAMILY_TYPES.includes(rel.type) && ROMANTIC_ACTS.includes(action)) {
      return { success: false, message: 'Non puoi avere un\'interazione romantica con un familiare.', effects: {} }
    }
    if (rel.age < 18 && ROMANTIC_ACTS.includes(action)) {
      return { success: false, message: 'Questa persona è minorenne. Interazione non consentita.', effects: {} }
    }
    if (state.time.age < 16 && ROMANTIC_ACTS.includes(action)) {
      return { success: false, message: 'Sei troppo giovane per questo tipo di interazione.', effects: {} }
    }

    // Anti-abuse: diminishing returns per NPC per year
    const key = `interact_${rel.id}_${state.time.year}`
    const count = state.diminishingReturns[key] ?? 0
    const dr = Math.max(0.3, 1 - count * 0.15)

    switch (action) {
      case 'greet':
        return this._withHumanReaction(rel, action, this._greet(rel, dr, state))
      case 'hang_out':
        return this._withHumanReaction(rel, action, this._hangOut(rel, dr, state))
      case 'compliment':
        return this._withHumanReaction(rel, action, this._compliment(rel, dr, state))
      case 'gift':
        return this._withHumanReaction(rel, action, this._gift(rel, dr, state))
      case 'confess_feelings':
        return this._withHumanReaction(rel, action, this._confess(rel, state))
      case 'ask_date':
        return this._withHumanReaction(rel, action, this._askDate(rel, state))
      case 'kiss':
        return this._withHumanReaction(rel, action, this._kiss(rel, state))
      case 'propose':
        return this._withHumanReaction(rel, action, this._propose(rel, state))
      case 'break_up':
        return this._withHumanReaction(rel, action, this._breakUp(rel, state))
      case 'divorce':
        return this._withHumanReaction(rel, action, this._divorce(rel, state))
      case 'cheat':
        return this._withHumanReaction(rel, action, this._cheat(rel, state))
      case 'fight':
        return this._withHumanReaction(rel, action, this._fight(rel, dr, state))
      case 'apologize':
        return this._withHumanReaction(rel, action, this._apologize(rel, state))
      case 'insult':
        return this._withHumanReaction(rel, action, this._insult(rel, state))
      case 'spend_time':
        return this._withHumanReaction(rel, action, this._spendTime(rel, dr, state))
      case 'ask_money':
        return this._withHumanReaction(rel, action, this._askMoney(rel, dr, state))
      case 'make_peace':
        return this._withHumanReaction(rel, action, this._makePeace(rel, state))
      case 'thank':
        return this._withHumanReaction(rel, action, this._thank(rel, state))
      case 'surprise':
        return this._withHumanReaction(rel, action, this._surprise(rel, state))
      case 'romantic_outing':
        return this._withHumanReaction(rel, action, this._romanticOuting(rel, state))
      case 'vacation_together':
        return this._withHumanReaction(rel, action, this._vacationTogether(rel, state))
      case 'propose_cohabitation':
        return this._withHumanReaction(rel, action, this._proposeCohabitation(rel, state))
      case 'do_activity':
        return this._withHumanReaction(rel, action, this._doActivity(rel, state))
      case 'lend_money':
        return this._withHumanReaction(rel, action, this._lendMoney(rel, state))
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

      // Toxicity escalation
      const jealousyIncrease = rel.toxicityTag ? 3 : 0

      // Age NPC
      const chainTick = ChainReactionEngine.annualTick(rel)
      const newLove = rel.stage === 'partner' || rel.stage === 'spouse'
        ? Math.max(0, chainTick.relationship.love - 1)
        : chainTick.relationship.love
      const chainMemory = chainTick.message
        ? [{
            id: Math.random().toString(36).slice(2, 10),
            category: 'friendship' as const,
            description: chainTick.message,
            year: state.time.year,
            weight: 2,
            decayFactor: 0.15,
            unforgettable: false,
          }]
        : []

      const updated = {
        ...rel,
        ...chainTick.relationship,
        age: rel.age + 1,
        trust: Math.max(0, chainTick.relationship.trust - decayRate),
        love: newLove,
        jealousy: Math.min(100, chainTick.relationship.jealousy + jealousyIncrease),
        memoryLog: [...chainMemory, ...rel.memoryLog]
          .map(mem => mem.unforgettable ? mem : { ...mem, weight: Math.max(0, mem.weight - mem.decayFactor) })
          .filter(mem => mem.unforgettable || mem.weight >= 0.5)
          .slice(0, 200),
      }
      return { ...updated, mood: this._inferMood(updated) }
    })
  }

  // ---- private actions ----

  private static _greet(rel: Relationship, dr: number, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    void _state
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
    void _state
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
    void _state
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
    void _state
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
    void _state
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
    void _state
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
    void _state
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
    void _state
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
    void _state
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
    void _trustGain
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

  // ---- new action methods ----

  private static _spendTime(rel: Relationship, dr: number, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    void state
    const chance = 0.7 + (rel.trust / 100) * 0.3
    const success = Math.random() < chance
    if (!success) {
      return { success: false, message: 'Troppo occupato/a.', effects: {} }
    }
    const trustGain = Math.round(8 * dr)
    return {
      success: true,
      message: `Hai trascorso del tempo di qualità con ${rel.name}. 💛`,
      effects: { happiness: 6, energy: -5 },
      updatedRel: { trust: Math.min(100, rel.trust + trustGain) },
    }
  }

  private static _askMoney(rel: Relationship, _dr: number, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    void _dr
    const validTypes: RelationshipType[] = ['parent', 'sibling', 'partner', 'spouse']
    if (!validTypes.includes(rel.type)) {
      return { success: false, message: `Non puoi chiedere soldi a ${rel.name}.`, effects: {} }
    }
    if (rel.trust < 40) {
      return { success: false, message: `${rel.name} non si fida abbastanza di te.`, effects: {} }
    }
    const isParent = rel.type === 'parent'
    const amount = isParent
      ? 100 + Math.floor(Math.random() * 400)
      : 50 + Math.floor(Math.random() * 150)
    const chance = 0.6
    const success = Math.random() < chance
    if (!success) {
      return {
        success: false,
        message: `${rel.name} non ha potuto aiutarti questa volta.`,
        effects: { happiness: -2 },
        updatedRel: { trust: Math.max(0, rel.trust - 8) },
      }
    }
    void state
    return {
      success: true,
      message: `${rel.name} ti ha prestato €${amount.toLocaleString('it-IT')}. 💰`,
      effects: { money: amount, happiness: 3 },
      updatedRel: { trust: Math.max(0, rel.trust - 5) },
    }
  }

  private static _makePeace(rel: Relationship, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    void _state
    if (rel.trust >= 50) {
      return { success: false, message: `Non c'è nulla da riconciliare con ${rel.name}.`, effects: {} }
    }
    const success = Math.random() < 0.7
    if (!success) {
      return {
        success: false,
        message: `${rel.name} non è ancora pronto/a a riconciliarsi.`,
        effects: {},
        updatedRel: { trust: Math.max(0, rel.trust - 5) },
      }
    }
    return {
      success: true,
      message: `Hai fatto pace con ${rel.name}. 🕊️`,
      effects: { happiness: 5 },
      updatedRel: {
        trust: Math.min(100, rel.trust + 15),
        love: Math.min(100, rel.love + 8),
      },
    }
  }

  private static _thank(rel: Relationship, _state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    void _state
    const isRomantic = rel.type === 'partner' || rel.type === 'spouse'
    return {
      success: true,
      message: `Hai espresso gratitudine a ${rel.name}. Si è sentito/a apprezzato/a. 🙏`,
      effects: { happiness: 4 },
      updatedRel: {
        trust: Math.min(100, rel.trust + 6),
        love: isRomantic ? Math.min(100, rel.love + 3) : rel.love,
      },
    }
  }

  private static _surprise(rel: Relationship, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const closeness = STAGE_ORDER.indexOf(rel.stage)
    const cost = 50 + Math.round(closeness * 30)
    if (state.finance.money < cost) {
      return { success: false, message: 'Non hai abbastanza soldi per una sorpresa.', effects: {} }
    }
    const success = Math.random() < 0.65
    if (!success) {
      return {
        success: false,
        message: `La sorpresa non è andata come pianificato con ${rel.name}.`,
        effects: { happiness: -3, money: -cost },
      }
    }
    return {
      success: true,
      message: `La sorpresa ha emozionato ${rel.name}! 🎁✨`,
      effects: { happiness: 10, money: -cost },
      updatedRel: {
        trust: Math.min(100, rel.trust + 12),
        love: Math.min(100, rel.love + 8),
      },
    }
  }

  private static _romanticOuting(rel: Relationship, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    if (rel.type !== 'partner' && rel.type !== 'spouse') {
      return { success: false, message: 'Questa azione è riservata al tuo partner o coniuge.', effects: {} }
    }
    const cost = 80 + Math.floor(Math.random() * 170)
    if (state.finance.money < cost) {
      return { success: false, message: `Non hai abbastanza soldi (servono ~€${cost}).`, effects: {} }
    }
    const chance = Math.min(0.9, 0.75 + (rel.love / 100) * 0.2)
    const success = Math.random() < chance
    if (!success) {
      return {
        success: false,
        message: `L'uscita romantica non è andata come speravi.`,
        effects: { happiness: -2, energy: -8, money: -cost },
      }
    }
    return {
      success: true,
      message: `Una serata romantica meravigliosa con ${rel.name}! 💕`,
      effects: { happiness: 12, energy: -8, money: -cost },
      updatedRel: {
        love: Math.min(100, rel.love + 10),
      },
      memoryEntry: {
        category: 'romantic',
        description: `Uscita romantica con ${rel.name}`,
        year: 0,
        weight: 2,
        decayFactor: 0.05,
        unforgettable: false,
      },
    }
  }

  private static _vacationTogether(rel: Relationship, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const allowed = rel.type === 'partner' || rel.type === 'spouse' || rel.stage === 'close_friend'
    if (!allowed) {
      return { success: false, message: 'Puoi fare vacanze con il partner, coniuge o amici stretti.', effects: {} }
    }
    const cost = 500 + Math.floor(Math.random() * 1500)
    if (state.finance.money < cost) {
      return { success: false, message: `Non hai abbastanza soldi per la vacanza (servono ~€${cost}).`, effects: {} }
    }
    const success = Math.random() < 0.8
    if (!success) {
      return {
        success: false,
        message: `La vacanza con ${rel.name} è stata deludente.`,
        effects: { happiness: -3, energy: -10, money: -cost },
      }
    }
    return {
      success: true,
      message: `Vacanza indimenticabile con ${rel.name}! 🌴✈️`,
      effects: { happiness: 20, energy: -10, money: -cost },
      updatedRel: {
        trust: Math.min(100, rel.trust + 10),
        love: Math.min(100, rel.love + 15),
      },
      memoryEntry: {
        category: 'romantic',
        description: `Vacanza insieme a ${rel.name}`,
        year: 0,
        weight: 4,
        decayFactor: 0.01,
        unforgettable: true,
      },
    }
  }

  private static _proposeCohabitation(rel: Relationship, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    void state
    if (rel.stage !== 'partner') {
      return { success: false, message: 'Puoi proporre la convivenza solo al tuo partner.', effects: {} }
    }
    if (rel.historyFlags.includes('cohabitation_proposed')) {
      return { success: false, message: `Hai già proposto la convivenza a ${rel.name}.`, effects: {} }
    }
    if (rel.love < 60) {
      return { success: false, message: `${rel.name} non si sente ancora pronto/a per convivere.`, effects: {} }
    }
    const chance = Math.min(0.85, 0.4 + (rel.love / 100) * 0.45 + (rel.trust / 100) * 0.2)
    const success = Math.random() < chance
    if (!success) {
      return {
        success: false,
        message: `${rel.name} ha declinato la proposta di convivenza. Ci vuole più tempo.`,
        effects: { happiness: -5 },
        updatedRel: {
          love: Math.max(0, rel.love - 5),
          historyFlags: [...rel.historyFlags, 'cohabitation_proposed'],
        },
      }
    }
    return {
      success: true,
      message: `${rel.name} ha accettato! Vivrete insieme! 🏠💑`,
      effects: { happiness: 15 },
      updatedRel: {
        historyFlags: [...rel.historyFlags, 'cohabitation_proposed', 'cohabiting'],
        love: Math.min(100, rel.love + 5),
        trust: Math.min(100, rel.trust + 8),
      },
    }
  }

  private static _doActivity(rel: Relationship, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const cost = 20 + Math.floor(Math.random() * 60)
    if (state.finance.money < cost) {
      return { success: false, message: 'Non hai abbastanza soldi per l\'attività.', effects: {} }
    }
    return {
      success: true,
      message: `Hai fatto un\'attività con ${rel.name}. Momenti piacevoli! 🎯`,
      effects: { happiness: 7, energy: -8, money: -cost },
      updatedRel: {
        trust: Math.min(100, rel.trust + 5),
      },
    }
  }

  private static _lendMoney(rel: Relationship, state: GameState): RelActionResult & { updatedRel?: Partial<Relationship> } {
    const amount = 100 + Math.floor(Math.random() * 400)
    if (state.finance.money < amount) {
      return { success: false, message: `Non hai abbastanza soldi da prestare (servono €${amount}).`, effects: {} }
    }
    const debtFlag = `debt_${rel.id}_${state.time.year}`
    return {
      success: true,
      message: `Hai prestato €${amount.toLocaleString('it-IT')} a ${rel.name}. 💸`,
      effects: { money: -amount, karma: 5 },
      updatedRel: {
        trust: Math.min(100, rel.trust + 15),
        historyFlags: [...rel.historyFlags, debtFlag],
      },
    }
  }
}
