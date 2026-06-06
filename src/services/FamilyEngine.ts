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

const MALE_NAMES = ['Marco', 'Luca', 'Andrea', 'Matteo', 'Francesco', 'Alessandro', 'Davide', 'Riccardo', 'Stefano', 'Lorenzo']
const FEMALE_NAMES = ['Sara', 'Giulia', 'Martina', 'Valentina', 'Alessia', 'Chiara', 'Federica', 'Laura', 'Elena', 'Sofia']

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

export interface StartingFamilyResult {
  family: FamilyState
  relationships: Relationship[]
}

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
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
  }
}

export class FamilyEngine {
  static createStartingFamily(identity: PlayerIdentity): StartingFamilyResult {
    const familyId = uid('family')
    const birthYear = identity.birthYear
    const surname = identity.surname
    const background = identity.familyBackground

    const motherAgeAtBirth = 22 + Math.floor(Math.random() * 16)
    const fatherAgeAtBirth = motherAgeAtBirth + Math.floor(Math.random() * 8) - 2
    const motherTraits = randomTraits(['empatico'])
    const fatherTraits = randomTraits(background === 'rich' || background === 'elite' ? ['ambizioso'] : ['leale'])

    const mother = makeRelationship({
      name: `${pick(FEMALE_NAMES)} ${surname}`,
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
      name: `${pick(MALE_NAMES)} ${surname}`,
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

    const relationships = [mother, father]
    const members = [
      makeMember({ relationship: mother, relationToPlayer: 'mother', birthYear: birthYear - mother.age, biological: true, familyBranch: 'maternal' }),
      makeMember({ relationship: father, relationToPlayer: 'father', birthYear: birthYear - father.age, biological: true, familyBranch: 'paternal' }),
    ]
    const links: FamilyLink[] = [{
      id: uid('link'),
      fromMemberId: members[0].id,
      toMemberId: members[1].id,
      relation: 'spouse_of',
    }]

    const siblings = siblingCount(background)
    for (let i = 0; i < siblings; i += 1) {
      const gender: Gender = Math.random() < 0.5 ? 'male' : 'female'
      const age = 1 + Math.floor(Math.random() * 9)
      const traits = randomTraits()
      const sibling = makeRelationship({
        name: `${pick(gender === 'female' ? FEMALE_NAMES : MALE_NAMES)} ${surname}`,
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
      links.push(
        { id: uid('link'), fromMemberId: members[0].id, toMemberId: member.id, relation: 'parent_of' },
        { id: uid('link'), fromMemberId: members[1].id, toMemberId: member.id, relation: 'parent_of' },
      )
    }

    return {
      relationships,
      family: {
        familyId,
        dynastyName: surname,
        members,
        links,
        favoredChildId: siblings > 0 && Math.random() < 0.25 ? members[2]?.id ?? null : null,
        familyReputation: BACKGROUND_FAMILY_REPUTATION[background],
        familyWealthTier: background,
        inheritedFlags: [`origin_${background}`, `dynasty_${surname.toLowerCase()}`],
      },
    }
  }
}
