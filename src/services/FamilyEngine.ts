import type {
  FamilyBackground,
  FamilyLink,
  FamilyMember,
  FamilyState,
  Gender,
  NPCMood,
  NPCPersonalityTrait,
  PlayerIdentity,
  Relationship,
} from '../store/types'
import { NameEngine } from './NameEngine'

const TRAITS: NPCPersonalityTrait[] = [
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

const BACKGROUND_FAMILY_REPUTATION: Record<FamilyBackground, number> = {
  poor: 30,
  lower_middle: 42,
  middle: 55,
  upper_middle: 68,
  rich: 82,
  elite: 92,
}

// Plausible occupations per wealth tier — used to flavour parents & grandparents
const OCCUPATION_POOLS: Record<FamilyBackground, string[]> = {
  poor:         ['Operaio', 'Bracciante agricolo', 'Addetto pulizie', 'Cassiere', 'Disoccupato', 'Magazziniere'],
  lower_middle: ['Operaio specializzato', 'Commesso', 'Autista', 'Cuoco', 'Idraulico', 'Parrucchiere'],
  middle:       ['Impiegato', 'Insegnante', 'Infermiere', 'Elettricista', 'Contabile', 'Poliziotto'],
  upper_middle: ['Ingegnere', 'Medico di base', 'Avvocato', 'Architetto', 'Manager', 'Farmacista'],
  rich:         ['Imprenditore', 'Chirurgo', 'Notaio', 'Dirigente d\'azienda', 'Commercialista', 'Pilota'],
  elite:        ['Magnate', 'Politico di rilievo', 'CEO', 'Investitore', 'Produttore cinematografico', 'Ereditiere'],
}

function pickOccupation(background: FamilyBackground): string {
  const pool = OCCUPATION_POOLS[background]
  return pool[Math.floor(Math.random() * pool.length)]
}

// Grandparents are typically from a slightly humbler tier than the parents'
const PREVIOUS_TIER: Record<FamilyBackground, FamilyBackground> = {
  poor: 'poor',
  lower_middle: 'poor',
  middle: 'lower_middle',
  upper_middle: 'middle',
  rich: 'upper_middle',
  elite: 'rich',
}

export interface StartingFamilyResult {
  family: FamilyState
  relationships: Relationship[]
}

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function randomTraits(preferred: NPCPersonalityTrait[] = []): NPCPersonalityTrait[] {
  const pool = [...new Set([...preferred, ...TRAITS].sort(() => Math.random() - 0.5))]
  return pool.slice(0, 2 + Math.floor(Math.random() * 2))
}

function initialMood(traits: NPCPersonalityTrait[]): NPCMood {
  if (traits.includes('ambizioso')) return 'motivato'
  if (traits.includes('empatico') || traits.includes('generoso')) return 'felice'
  if (traits.includes('introverso')) return 'neutrale'
  return 'neutrale'
}

function parentTrust(background: FamilyBackground) {
  const base: Record<FamilyBackground, number> = {
    poor: 64,
    lower_middle: 68,
    middle: 72,
    upper_middle: 70,
    rich: 62,
    elite: 58,
  }
  return clamp(base[background] + Math.floor(Math.random() * 13) - 6, 35, 95)
}

function siblingCount(background: FamilyBackground) {
  const roll = Math.random()
  if (background === 'elite' || background === 'rich') return roll < 0.55 ? 0 : roll < 0.85 ? 1 : 2
  if (background === 'poor' || background === 'lower_middle') return roll < 0.2 ? 0 : roll < 0.65 ? 1 : roll < 0.9 ? 2 : 3
  return roll < 0.35 ? 0 : roll < 0.75 ? 1 : 2
}

function makeRelationship(params: {
  name: string
  age: number
  gender: Gender
  type: 'parent' | 'sibling'
  identity: PlayerIdentity
  trust: number
  respect: number
  traits: NPCPersonalityTrait[]
  flags: string[]
  birthYear: number
}): Relationship {
  const relId = uid('rel')
  return {
    id: relId,
    npcId: uid('npc'),
    name: params.name,
    age: params.age,
    gender: params.gender,
    emoji: params.gender === 'female' ? (params.age < 18 ? '👧' : '👩') : (params.age < 18 ? '👦' : '👨'),
    type: params.type,
    stage: params.type === 'parent' ? 'close_friend' : 'friend',
    trust: params.trust,
    jealousy: params.type === 'sibling' ? Math.floor(Math.random() * 24) : 0,
    attraction: 0,
    love: params.type === 'parent' ? 85 : 55,
    respect: params.respect,
    toxicityTag: Math.random() < (params.type === 'parent' ? 0.04 : 0.07),
    historyFlags: params.flags,
    personalityTraits: params.traits,
    mood: initialMood(params.traits),
    memoryLog: [{
      id: uid('mem'),
      category: 'family',
      description: `${params.name} fa parte della tua famiglia dalla nascita.`,
      year: params.birthYear,
      weight: 5,
      decayFactor: 0,
      unforgettable: true,
    }],
    isAlive: true,
    nationality: params.identity.nationality,
  }
}

function makeMember(params: {
  relationship: Relationship
  relationToPlayer: FamilyMember['relationToPlayer']
  birthYear: number
  biological: boolean
  familyBranch: FamilyMember['familyBranch']
  occupation?: string
}): FamilyMember {
  return {
    id: uid('fam'),
    relationshipId: params.relationship.id,
    name: params.relationship.name,
    gender: params.relationship.gender,
    birthYear: params.birthYear,
    deathYear: null,
    relationToPlayer: params.relationToPlayer,
    biological: params.biological,
    familyBranch: params.familyBranch,
    notes: params.relationship.historyFlags,
    occupation: params.occupation,
  }
}

// Ancestors exist only in the genealogy (no interactive Relationship needed)
function makeAncestor(params: {
  name: string
  gender: Gender
  birthYear: number
  deathYear: number | null
  relationToPlayer: FamilyMember['relationToPlayer']
  familyBranch: FamilyMember['familyBranch']
  occupation: string
}): FamilyMember {
  return {
    id: uid('fam'),
    relationshipId: null,
    name: params.name,
    gender: params.gender,
    birthYear: params.birthYear,
    deathYear: params.deathYear,
    relationToPlayer: params.relationToPlayer,
    biological: true,
    familyBranch: params.familyBranch,
    notes: [],
    occupation: params.occupation,
  }
}

export class FamilyEngine {
  static createStartingFamily(identity: PlayerIdentity, opts?: { forceSibling?: boolean }): StartingFamilyResult {
    const familyId = uid('family')
    const birthYear = identity.birthYear
    const surname = identity.surname
    const background = identity.familyBackground

    const motherAgeAtBirth = 22 + Math.floor(Math.random() * 16)
    const fatherAgeAtBirth = motherAgeAtBirth + Math.floor(Math.random() * 8) - 2
    const motherTraits = randomTraits(['empatico'])
    const fatherTraits = randomTraits(background === 'rich' || background === 'elite' ? ['ambizioso'] : ['leale'])

    // Mother keeps her maiden surname (realistic — different from father's)
    let motherMaidenSurname = NameEngine.surname(identity.nationality)
    while (motherMaidenSurname === surname) motherMaidenSurname = NameEngine.surname(identity.nationality)

    const mother = makeRelationship({
      name: `${NameEngine.firstName('female', identity.nationality)} ${motherMaidenSurname}`,
      age: motherAgeAtBirth,
      gender: 'female',
      type: 'parent',
      identity,
      trust: parentTrust(background),
      respect: 62 + Math.floor(Math.random() * 24),
      traits: motherTraits,
      flags: ['family_parent', 'biological_mother', `family_background_${background}`],
      birthYear,
    })

    const father = makeRelationship({
      name: `${NameEngine.firstName('male', identity.nationality)} ${surname}`,
      age: Math.max(18, fatherAgeAtBirth),
      gender: 'male',
      type: 'parent',
      identity,
      trust: parentTrust(background),
      respect: 58 + Math.floor(Math.random() * 28),
      traits: fatherTraits,
      flags: ['family_parent', 'biological_father', `family_background_${background}`],
      birthYear,
    })

    const motherOccupation = pickOccupation(background)
    const fatherOccupation = pickOccupation(background)

    const relationships = [mother, father]
    const motherMember = makeMember({ relationship: mother, relationToPlayer: 'mother', birthYear: birthYear - mother.age, biological: true, familyBranch: 'maternal', occupation: motherOccupation })
    const fatherMember = makeMember({ relationship: father, relationToPlayer: 'father', birthYear: birthYear - father.age, biological: true, familyBranch: 'paternal', occupation: fatherOccupation })
    const members = [motherMember, fatherMember]
    const links: FamilyLink[] = [{
      id: uid('link'),
      fromMemberId: members[0].id,
      toMemberId: members[1].id,
      relation: 'spouse_of',
    }]

    // ── Grandparents (ancestry) ──
    // Four biological grandparents from a slightly humbler tier. Some may have
    // already passed away depending on their age — this is the root of the tree.
    const ancestorTier = PREVIOUS_TIER[background]
    const grandparentSpecs: Array<{
      gender: Gender
      branch: 'maternal' | 'paternal'
      surname: string
      parentMember: FamilyMember
      parentAge: number
    }> = [
      { gender: 'female', branch: 'maternal', surname: motherMaidenSurname, parentMember: motherMember, parentAge: mother.age },
      { gender: 'male',   branch: 'maternal', surname: motherMaidenSurname, parentMember: motherMember, parentAge: mother.age },
      { gender: 'female', branch: 'paternal', surname: NameEngine.surname(identity.nationality), parentMember: fatherMember, parentAge: father.age },
      { gender: 'male',   branch: 'paternal', surname: surname, parentMember: fatherMember, parentAge: father.age },
    ]
    for (const spec of grandparentSpecs) {
      const gpAgeAtParentBirth = 22 + Math.floor(Math.random() * 14)
      const gpBirthYear = birthYear - spec.parentAge - gpAgeAtParentBirth
      // Current age (relative to player's birth year as game start); chance of death rises with age
      const gpCurrentAge = birthYear - gpBirthYear
      const deathYear = gpCurrentAge > 70 && Math.random() < 0.5
        ? gpBirthYear + 65 + Math.floor(Math.random() * 20)
        : null
      const gp = makeAncestor({
        name: `${NameEngine.firstName(spec.gender, identity.nationality)} ${spec.surname}`,
        gender: spec.gender,
        birthYear: gpBirthYear,
        deathYear: deathYear && deathYear < birthYear ? deathYear : null,
        relationToPlayer: 'grandparent',
        familyBranch: spec.branch,
        occupation: pickOccupation(ancestorTier),
      })
      members.push(gp)
      links.push({ id: uid('link'), fromMemberId: gp.id, toMemberId: spec.parentMember.id, relation: 'parent_of' })
    }

    const siblings = Math.max(opts?.forceSibling ? 1 : 0, siblingCount(background))
    let firstSiblingMemberId: string | null = null
    for (let i = 0; i < siblings; i += 1) {
      const gender: Gender = Math.random() < 0.5 ? 'male' : 'female'
      const age = 1 + Math.floor(Math.random() * 9)
      const traits = randomTraits()
      const sibling = makeRelationship({
        name: `${NameEngine.firstName(gender, identity.nationality)} ${surname}`,
        age,
        gender,
        type: 'sibling',
        identity,
        trust: clamp(58 + Math.floor(Math.random() * 28), 35, 95),
        respect: clamp(45 + Math.floor(Math.random() * 28), 20, 85),
        traits,
        flags: ['family_sibling', 'older_sibling', `family_background_${background}`],
        birthYear,
      })
      relationships.push(sibling)
      const member = makeMember({
        relationship: sibling,
        relationToPlayer: 'sibling',
        birthYear: birthYear - age,
        biological: true,
        familyBranch: 'direct',
      })
      members.push(member)
      if (firstSiblingMemberId === null) firstSiblingMemberId = member.id
      links.push(
        { id: uid('link'), fromMemberId: motherMember.id, toMemberId: member.id, relation: 'parent_of' },
        { id: uid('link'), fromMemberId: fatherMember.id, toMemberId: member.id, relation: 'parent_of' },
      )
    }

    return {
      relationships,
      family: {
        familyId,
        dynastyName: surname,
        members,
        links,
        favoredChildId: siblings > 0 && Math.random() < 0.25 ? firstSiblingMemberId : null,
        familyReputation: BACKGROUND_FAMILY_REPUTATION[background],
        familyWealthTier: background,
        inheritedFlags: [`origin_${background}`, `dynasty_${surname.toLowerCase()}`],
      },
    }
  }
}
