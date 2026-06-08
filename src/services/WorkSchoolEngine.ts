import type {
  WorkNPC,
  SchoolNPC,
  WorkAction,
  SchoolAction,
  WorkReputationStatus,
  SchoolReputationStatus,
  Gender,
  NPCPersonalityTrait,
  NPCMood,
  EducationLevel,
  Effect,
  Relationship,
  PlayerSkills,
} from '../store/types'

// ---- name pools ----

const MALE_NAMES = ['Marco', 'Luca', 'Andrea', 'Matteo', 'Francesco', 'Alessandro', 'Davide', 'Simone', 'Riccardo', 'Stefano', 'Giovanni', 'Paolo', 'Roberto', 'Giorgio', 'Antonio', 'Lorenzo', 'Federico', 'Nicola', 'Filippo', 'Enrico']
const FEMALE_NAMES = ['Sara', 'Giulia', 'Martina', 'Valentina', 'Alessia', 'Chiara', 'Federica', 'Silvia', 'Laura', 'Elena', 'Francesca', 'Michela', 'Roberta', 'Paola', 'Monica', 'Ilaria', 'Serena', 'Daniela', 'Elisa', 'Sofia']
const SURNAMES = ['Rossi', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Fontana', 'Giordano', 'Russo', 'Barbieri', 'Ferrara']

const PERSONALITY_TRAITS: NPCPersonalityTrait[] = [
  'introverso', 'ambizioso', 'geloso', 'generoso', 'sensibile',
  'sicuro', 'avido', 'leale', 'empatico', 'impulsivo',
]

const MOODS: NPCMood[] = ['neutrale', 'felice', 'triste', 'geloso', 'arrabbiato', 'nostalgico', 'ansioso', 'motivato']

const GENDER_EMOJIS: Record<Gender, string[]> = {
  male: ['👨', '👦', '🧑', '👴'],
  female: ['👩', '👧', '🧑', '👵'],
  non_binary: ['🧑'],
}

const SCHOOL_SUBJECTS = ['Matematica', 'Storia', 'Scienze', 'Letteratura', 'Inglese', 'Fisica', 'Chimica', 'Educazione Fisica', 'Arte', 'Musica', 'Informatica', 'Economia']

// ---- public result types ----

export interface WorkInteractResult {
  success: boolean
  message: string
  effects: Effect
  updatedColleague: WorkNPC
  promotedRel?: Relationship
  skillDeltas?: Partial<PlayerSkills>
}

export interface SchoolInteractResult {
  success: boolean
  message: string
  effects: Effect
  updatedNPC: SchoolNPC
  promotedRel?: Relationship
  skillDeltas?: Partial<PlayerSkills>
}

export type SocialLocation = 'bar' | 'quartiere' | 'palestra' | 'festa' | 'app_dating' | 'evento' | 'volontariato' | 'club'

export interface SocializeResult {
  success: boolean
  message: string
  effects: Effect
  newRelationship?: Relationship
  skillDeltas?: Partial<PlayerSkills>
}

// ---- helper ----

function uid() { return Math.random().toString(36).slice(2, 10) }

function randomName(gender: Gender): string {
  const pool = gender === 'male' ? MALE_NAMES : FEMALE_NAMES
  return `${pool[Math.floor(Math.random() * pool.length)]} ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`
}

function randomGender(): Gender {
  return Math.random() < 0.5 ? 'male' : 'female'
}

function randomTraits(): NPCPersonalityTrait[] {
  const shuffled = [...PERSONALITY_TRAITS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2 + Math.floor(Math.random() * 2))
}

function randomMood(traits: NPCPersonalityTrait[]): NPCMood {
  if (traits.includes('ambizioso')) return 'motivato'
  if (traits.includes('geloso')) return 'ansioso'
  if (traits.includes('introverso')) return 'neutrale'
  return MOODS[Math.floor(Math.random() * MOODS.length)]
}

function traitBonus(traits: NPCPersonalityTrait[], action: string): number {
  if (action === 'talk' && traits.includes('empatico')) return 5
  if (action === 'help' && traits.includes('generoso')) return 8
  if (action === 'socialize' && traits.includes('introverso')) return -10
  if (action === 'gossip' && traits.includes('leale')) return -15
  if (action === 'compliment' && traits.includes('sensibile')) return 8
  if (action === 'fight' && traits.includes('impulsivo')) return 10
  if (action === 'fight' && traits.includes('leale')) return -5
  return 0
}

// Convert WorkNPC/SchoolNPC to a full Relationship when promoted
function buildPromoRel(name: string, age: number, gender: Gender, emoji: string, traits: NPCPersonalityTrait[], mood: NPCMood, year: number): Relationship {
  return {
    id: uid(),
    npcId: uid(),
    name,
    age,
    gender,
    emoji,
    type: 'acquaintance',
    stage: 'acquaintance',
    trust: 40,
    jealousy: 5,
    attraction: 20,
    love: 0,
    respect: 35,
    toxicityTag: false,
    historyFlags: ['chain_warmth'],
    personalityTraits: traits,
    mood,
    memoryLog: [{
      id: uid(),
      category: 'friendship',
      description: 'Siamo diventati amici.',
      year,
      weight: 2,
      decayFactor: 0.1,
      unforgettable: false,
    }],
    isAlive: true,
    nationality: 'italy',
  }
}

// ---- Work Engine ----

const WORK_ROLES_BY_CATEGORY: Record<string, string[]> = {
  tech:       ['Sviluppatore', 'Designer UX', 'QA Tester', 'Project Manager', 'DevOps'],
  medical:    ['Infermiere', 'Tecnico di laboratorio', 'Receptionist', 'Specialista'],
  retail:     ['Cassiere', 'Addetto vendite', 'Magazziniere', 'Supervisore'],
  education:  ['Insegnante', 'Assistente', 'Coordinatore', 'Tutor'],
  finance:    ['Analista', 'Contabile', 'Consulente', 'Assistente'],
  legal:      ['Paralegal', 'Segretario', 'Ricercatore legale'],
  default:    ['Collega', 'Responsabile', 'Assistente', 'Coordinatore'],
}

export class WorkSchoolEngine {
  static generateColleagues(jobId: string, category: string, count = 3): WorkNPC[] {
    const roles = WORK_ROLES_BY_CATEGORY[category] ?? WORK_ROLES_BY_CATEGORY.default
    return Array.from({ length: count }, () => {
      const gender = randomGender()
      const traits = randomTraits()
      const mood = randomMood(traits)
      const age = 20 + Math.floor(Math.random() * 30)
      return {
        id: uid(),
        name: randomName(gender),
        age,
        gender,
        emoji: GENDER_EMOJIS[gender][age > 50 ? 3 : age > 30 ? 2 : 1],
        role: roles[Math.floor(Math.random() * roles.length)],
        personalityTraits: traits,
        mood,
        affection: 20 + Math.floor(Math.random() * 20),
        status: 'neutral' as const,
        promotedToRelId: null,
        jobId,
      }
    })
  }

  static workInteract(colleague: WorkNPC, action: WorkAction, playerLooks: number, year: number): WorkInteractResult {
    const bonus = traitBonus(colleague.personalityTraits, action)
    const base = 0.55 + (playerLooks / 400)
    const roll = Math.random()

    let affectionDelta = 0
    let effects: Effect = {}
    let message = ''
    let success = true
    let skillDeltas: Partial<PlayerSkills> = {}

    switch (action) {
      case 'talk':
        affectionDelta = 2 + Math.floor(Math.random() * 2)
        effects = { happiness: 1, energy: -1 }
        skillDeltas = { socialSkill: 1 }
        message = `Hai fatto due chiacchiere con ${colleague.name}.`
        break

      case 'socialize':
        if (roll < base + bonus / 100) {
          affectionDelta = 5 + Math.floor(Math.random() * 3)
          effects = { happiness: 2, energy: -2 }
          skillDeltas = { socialSkill: 2, charisma: 1 }
          message = `Uscita riuscita con ${colleague.name}. Buona serata!`
        } else {
          affectionDelta = 1
          effects = { happiness: 1, energy: -1 }
          message = `${colleague.name} aveva impegni, ma hai passato del tempo insieme.`
        }
        break

      case 'help':
        affectionDelta = 3
        effects = { reputation: 1, energy: -1 }
        skillDeltas = { leadership: 1 }
        message = `Hai aiutato ${colleague.name} con un compito. Apprezza il gesto.`
        break

      case 'compliment':
        if (roll < base + bonus / 100) {
          affectionDelta = 3
          effects = { happiness: 1 }
          skillDeltas = { socialSkill: 1 }
          message = `${colleague.name} ha apprezzato il complimento.`
        } else {
          affectionDelta = 1
          message = `${colleague.name} ha sorriso educatamente.`
        }
        break

      case 'gossip':
        if (colleague.personalityTraits.includes('leale')) {
          affectionDelta = -5
          effects = { reputation: -2 }
          message = `${colleague.name} non apprezza i pettegolezzi. Atmosfera tesa.`
          success = false
        } else {
          affectionDelta = 2
          effects = { happiness: 1, socialReputation: -1 }
          message = `Tu e ${colleague.name} avete sparlato un po'. Divertente, ma rischioso.`
          skillDeltas = { socialSkill: 1 }
        }
        break

      case 'fight':
        affectionDelta = -10
        effects = { happiness: -3, mentalHealth: -2, reputation: -2 }
        message = `Litigata con ${colleague.name}. L'atmosfera in ufficio è pesante.`
        success = false
        break
    }

    const newAffection = Math.min(100, Math.max(0, colleague.affection + affectionDelta + bonus))
    const newStatus: WorkNPC['status'] =
      newAffection >= 65 ? 'friendly'
      : newAffection <= 15 ? 'hostile'
      : newAffection <= 30 ? 'tense'
      : 'neutral'

    const updatedColleague: WorkNPC = { ...colleague, affection: newAffection, status: newStatus }

    // Promote to full Relationship if affection high enough and not already promoted
    let promotedRel: Relationship | undefined
    if (newAffection >= 65 && !colleague.promotedToRelId) {
      promotedRel = buildPromoRel(colleague.name, colleague.age, colleague.gender, colleague.emoji, colleague.personalityTraits, colleague.mood, year)
      updatedColleague.promotedToRelId = promotedRel.id
      message += ` ${colleague.name} è ora un tuo amico/a!`
    }

    return { success, message, effects, updatedColleague, promotedRel, skillDeltas }
  }

  // ---- School Engine ----

  static generateClassmates(level: EducationLevel, playerAge: number, count = 4): SchoolNPC[] {
    const isUniversity = ['bachelor', 'master', 'phd', 'mba', 'medical', 'law'].includes(level)
    const isProfessor = (i: number) => i >= count - 1 // last NPC is a professor
    return Array.from({ length: count + 1 }, (_, i) => {
      const isProf = isProfessor(i)
      const gender = randomGender()
      const traits = randomTraits()
      const mood = randomMood(traits)
      const age = isProf
        ? 35 + Math.floor(Math.random() * 25)
        : playerAge + Math.floor(Math.random() * 3) - 1
      return {
        id: uid(),
        name: randomName(gender),
        age: Math.max(6, age),
        gender,
        emoji: GENDER_EMOJIS[gender][isProf ? 2 : 1],
        role: (isProf ? 'professor' : 'student') as SchoolNPC['role'],
        subject: isProf ? SCHOOL_SUBJECTS[Math.floor(Math.random() * SCHOOL_SUBJECTS.length)] : undefined,
        personalityTraits: traits,
        mood,
        affection: 15 + Math.floor(Math.random() * 20),
        status: 'neutral' as const,
        promotedToRelId: null,
        educationLevel: level,
      }
    })
  }

  static schoolInteract(npc: SchoolNPC, action: SchoolAction, playerIntelligence: number, year: number): SchoolInteractResult {
    const bonus = traitBonus(npc.personalityTraits, action)
    const base = 0.5 + (playerIntelligence / 400)
    const roll = Math.random()

    let affectionDelta = 0
    let effects: Effect = {}
    let message = ''
    let success = true
    let skillDeltas: Partial<PlayerSkills> = {}

    const isProf = npc.role === 'professor'

    switch (action) {
      case 'talk':
        affectionDelta = 2
        effects = { happiness: 1 }
        skillDeltas = { socialSkill: 1 }
        message = isProf
          ? `Hai parlato brevemente con ${npc.name}. Docente interessante.`
          : `Hai scambiato due parole con ${npc.name}.`
        break

      case 'befriend':
        if (isProf) {
          affectionDelta = 3
          effects = { intelligence: 1, mentalHealth: 1 }
          skillDeltas = { academicSkill: 2 }
          message = `${npc.name} ti ha preso in simpatia. Potrebbe aiutarti.`
        } else if (roll < base + bonus / 100) {
          affectionDelta = 6 + Math.floor(Math.random() * 4)
          effects = { happiness: 2, socialReputation: 1 }
          skillDeltas = { socialSkill: 2 }
          message = `Amicizia in corso con ${npc.name}! Buona sintonia.`
        } else {
          affectionDelta = 2
          effects = { happiness: 1 }
          message = `${npc.name} è ancora un po' riservato/a. Ci vuole tempo.`
        }
        break

      case 'study_together':
        if (roll < base + bonus / 100) {
          affectionDelta = 3
          effects = { intelligence: 2, energy: -1 }
          skillDeltas = { academicSkill: 3, discipline: 1 }
          message = `Sessione di studio produttiva con ${npc.name}. Intelligenza migliorata.`
        } else {
          affectionDelta = 1
          effects = { intelligence: 1, energy: -2 }
          skillDeltas = { academicSkill: 1 }
          message = `Studio con ${npc.name} andato discretamente. Potreste fare di meglio.`
        }
        break

      case 'gossip':
        if (npc.personalityTraits.includes('leale')) {
          affectionDelta = -6
          effects = { socialReputation: -2 }
          message = `${npc.name} non apprezza i pettegolezzi. Ti ha gelato/a.`
          success = false
        } else {
          affectionDelta = 2
          effects = { happiness: 1 }
          skillDeltas = { socialSkill: 1 }
          message = `Pettegolezzo scolastico con ${npc.name}. Divertente ma rischioso.`
        }
        break

      case 'fight':
        affectionDelta = -12
        effects = { happiness: -3, socialReputation: -3, mentalHealth: -2 }
        message = isProf
          ? `Lite con ${npc.name}. Conseguenze potenziali sui voti!`
          : `Scontro con ${npc.name}. Atmosfera tesa in classe.`
        success = false
        break

      case 'copy_homework':
        if (isProf) {
          affectionDelta = -8
          effects = { reputation: -3, intelligence: -1 }
          message = `${npc.name} ti ha beccato a copiare. Brutta situazione!`
          success = false
        } else if (roll < 0.6) {
          affectionDelta = -2
          effects = { intelligence: -1, reputation: -1 }
          message = `Hai copiato i compiti di ${npc.name}. Scorciatoia rischiosa.`
        } else {
          affectionDelta = 1
          effects = { energy: 2 }
          message = `Hai copiato i compiti di ${npc.name} senza conseguenze.`
        }
        break
    }

    const newAffection = Math.min(100, Math.max(0, npc.affection + affectionDelta + bonus))
    const newStatus: SchoolNPC['status'] =
      newAffection >= 65 ? 'friendly'
      : newAffection <= 15 ? 'hostile'
      : newAffection <= 30 ? 'tense'
      : 'neutral'

    const updatedNPC: SchoolNPC = { ...npc, affection: newAffection, status: newStatus }

    let promotedRel: Relationship | undefined
    if (newAffection >= 65 && !npc.promotedToRelId && npc.role === 'student') {
      promotedRel = buildPromoRel(npc.name, npc.age, npc.gender, npc.emoji, npc.personalityTraits, npc.mood, year)
      updatedNPC.promotedToRelId = promotedRel.id
      message += ` ${npc.name} è ora un tuo amico/a!`
    }

    return { success, message, effects, updatedNPC, promotedRel, skillDeltas }
  }

  // ---- Social Engine (outside work/school) ----

  static readonly LOCATION_LABELS: Record<SocialLocation, string> = {
    bar:         '🍺 Bar',
    quartiere:   '🏘️ Quartiere',
    palestra:    '💪 Palestra',
    festa:       '🎉 Festa',
    app_dating:  '📱 App dating',
    evento:      '🎭 Evento locale',
    volontariato:'🤝 Volontariato',
    club:        '🎸 Club/Hobby',
  }

  static socializeOutside(
    location: SocialLocation,
    playerAge: number,
    looks: number,
    happiness: number,
    year: number,
  ): SocializeResult {
    const meetChance = 0.45 + (looks / 300) + (happiness / 400)
    const met = Math.random() < meetChance

    const effects: Effect = { energy: -2, happiness: met ? 2 : 1 }
    const skillDeltas: Partial<PlayerSkills> = { socialSkill: 1 }

    if (location === 'palestra') {
      effects.health = 2
      skillDeltas.athleticism = 2
    }
    if (location === 'volontariato') {
      effects.karma = 2
      skillDeltas.charisma = 1
    }
    if (location === 'club') {
      skillDeltas.creativity = 1
      skillDeltas.music = 1
    }

    if (!met) {
      const msgs: Record<SocialLocation, string> = {
        bar: 'Serata tranquilla al bar. Nessun incontro interessante.',
        quartiere: 'Una passeggiata nel quartiere. Nulla di nuovo.',
        palestra: 'Ottima sessione in palestra. Ti senti in forma.',
        festa: 'La festa era piena ma non hai legato con nessuno.',
        app_dating: 'Nessun match interessante stasera.',
        evento: 'Evento piacevole ma nessuna connessione nuova.',
        volontariato: 'Giornata di volontariato utile, ma lavoro individuale.',
        club: 'Sessione al club. Hai praticato il tuo hobby.',
      }
      return { success: false, message: msgs[location], effects, skillDeltas }
    }

    const gender = randomGender()
    const traits = randomTraits()
    const mood = randomMood(traits)
    const ageDiff = Math.floor(Math.random() * 10) - 3
    const npcAge = Math.max(18, playerAge + ageDiff)
    const name = randomName(gender)
    const emoji = GENDER_EMOJIS[gender][npcAge > 50 ? 3 : npcAge > 30 ? 2 : 1]

    const contextToRelType = (): Relationship['type'] => {
      if (location === 'app_dating') return 'acquaintance'
      if (location === 'volontariato') return 'acquaintance'
      return 'acquaintance'
    }

    const newRel: Relationship = {
      id: uid(),
      npcId: uid(),
      name,
      age: npcAge,
      gender,
      emoji,
      type: contextToRelType(),
      stage: 'acquaintance',
      trust: 20,
      jealousy: 0,
      attraction: location === 'app_dating' ? 30 + Math.floor(Math.random() * 20) : 10,
      love: 0,
      respect: 25,
      toxicityTag: false,
      historyFlags: [],
      personalityTraits: traits,
      mood,
      memoryLog: [{
        id: uid(),
        category: 'friendship',
        description: `Ci siamo conosciuti ${WorkSchoolEngine.LOCATION_LABELS[location].toLowerCase()}.`,
        year,
        weight: 1,
        decayFactor: 0.3,
        unforgettable: false,
      }],
      isAlive: true,
      nationality: 'italy',
    }

    const msgs: Record<SocialLocation, string> = {
      bar: `Hai conosciuto ${name} al bar. Buona serata!`,
      quartiere: `Hai incontrato ${name} nel quartiere. Simpatia immediata.`,
      palestra: `Hai legato con ${name} in palestra. Interessi in comune.`,
      festa: `${name} ti ha avvicinato/a alla festa. Ottima energia!`,
      app_dating: `Match con ${name}! Prima impressione positiva.`,
      evento: `Hai conosciuto ${name} all'evento. Conversazione interessante.`,
      volontariato: `${name} condivide la tua visione. Connessione genuina.`,
      club: `${name} fa parte del club. Hai trovato un compagno/a.`,
    }

    return {
      success: true,
      message: msgs[location],
      effects: { ...effects, happiness: (effects.happiness ?? 0) + 1 },
      newRelationship: newRel,
      skillDeltas,
    }
  }

  // ---- Annual passive affection tick ----

  static annualColleagueTick(colleagues: WorkNPC[]): WorkNPC[] {
    return colleagues.map(c => ({
      ...c,
      affection: Math.max(0, c.affection - 2), // slight decay without interaction
    }))
  }

  static annualClassmateTick(classmates: SchoolNPC[]): SchoolNPC[] {
    return classmates.map(c => ({
      ...c,
      affection: Math.max(0, c.affection - 1),
    }))
  }

  // ---- Work reputation helper ----

  static computeWorkReputation(
    current: WorkReputationStatus,
    promotions: number,
    burnout: number,
    hasRecord: boolean,
  ): WorkReputationStatus {
    if (hasRecord) return 'problematico'
    if (burnout >= 80) return 'tossico'
    if (promotions >= 5) return 'leader'
    if (promotions >= 3) return 'genio'
    if (promotions >= 1) return 'ambizioso'
    if (burnout >= 50) return 'pigro'
    return current === 'nuovo' ? 'affidabile' : current
  }

  // ---- School reputation helper ----

  static computeSchoolReputation(
    gpa: number,
    clubs: string[],
    happiness: number,
  ): SchoolReputationStatus {
    const hasSport = clubs.some(c => c.toLowerCase().includes('sport') || c.toLowerCase().includes('calcio') || c.toLowerCase().includes('basket'))
    const hasArt = clubs.some(c => c.toLowerCase().includes('teatro') || c.toLowerCase().includes('musica') || c.toLowerCase().includes('arte'))
    const hasAcademic = clubs.some(c => c.toLowerCase().includes('debate') || c.toLowerCase().includes('scienze') || c.toLowerCase().includes('math'))
    if (gpa >= 3.5 && hasAcademic) return 'nerd'
    if (hasSport) return 'atleta'
    if (hasArt) return 'artista'
    if (gpa >= 3.7) return 'leader'
    if (happiness < 25) return 'ribelle'
    if (gpa < 1.5) return 'problematico'
    if (gpa >= 3.0) return 'popolare'
    return 'invisibile'
  }
}
