// =============================================
// LIFE SIMULATOR 2D — TypeScript Interfaces
// =============================================

// ---- Time ----

export interface TimeState {
  year: number
  month: number
  age: number
}

// ---- Core Stats ----

export interface CoreStats {
  health: number           // 0-100
  mentalHealth: number     // 0-100
  happiness: number        // 0-100
  intelligence: number     // 0-100
  looks: number            // 0-100 (aspetto)
  energy: number           // 0-100
  karma: number            // -100/+100
  reputation: number       // 0-100
  socialReputation: number // 0-100
}

// ---- Finance ----

export interface FinanceState {
  money: number
  bankBalance: number
  debt: number
  creditScore: number      // 300-850
  monthlyIncome: number
  monthlyExpenses: number
  investments: Investment[]
  assets: Asset[]
  healthInsurance: boolean
  homeInsurance: boolean
}

export interface Investment {
  id: string
  type: 'stock' | 'bond' | 'crypto' | 'fund'
  name: string
  amount: number
  currentValue: number
  purchaseDate: string
  symbol?: string
  shares?: number
  purchasePrice?: number
}

export type MarketSentiment = 'bear' | 'neutral' | 'bull' | 'mania' | 'crash'

export interface MarketAsset {
  symbol: string
  name: string
  emoji: string
  type: Investment['type']
  price: number
  previousPrice: number
  volatility: number
  expectedReturn: number
  risk: 'low' | 'medium' | 'high' | 'extreme'
  sector: string
}

export interface MarketEvent {
  id: string
  year: number
  title: string
  description: string
  emoji: string
  impact: number          // -1 to +1
}

export interface MarketState {
  sentiment: MarketSentiment
  assets: MarketAsset[]
  events: MarketEvent[]
}

export interface Asset {
  id: string
  type: 'house' | 'car' | 'luxury' | 'business' | 'other'
  name: string
  emoji?: string
  category?: 'vehicle' | 'property' | 'luxury' | 'watercraft' | 'collectible'
  value: number
  purchaseValue: number
  purchaseYear: number
  maintenanceCost: number
  insured?: boolean
  condition?: number
  statusBonus?: number
  theftRisk?: number
}

// ---- Identity ----

export type Gender = 'male' | 'female' | 'non_binary'
export type Nationality = string
export type FamilyBackground = 'poor' | 'lower_middle' | 'middle' | 'upper_middle' | 'rich' | 'elite'
export type SexualOrientation = 'heterosexual' | 'homosexual' | 'bisexual' | 'pansexual' | 'asexual'
export type Religion =
  | 'catholicism'
  | 'islam'
  | 'buddhism'
  | 'hinduism'
  | 'judaism'
  | 'protestantism'
  | 'orthodoxy'
  | 'atheism'
  | 'agnosticism'
  | 'other'

export type PoliticalOrientation = 'sinistra' | 'centro-sinistra' | 'centro' | 'centro-destra' | 'destra' | 'apolitico'

export interface NPCExtendedAttributes {
  craziness: number       // 0-100
  fertility: number       // 0-100
  willpower: number       // 0-100
  smarts: number          // 0-100
  sexuality: SexualOrientation
  politics: PoliticalOrientation
  religion: Religion
}

// ---- Avatar System ----

export type SkinTone = 'light' | 'medium_light' | 'medium' | 'medium_dark' | 'dark'
export type AvatarHairStyle = 'bald' | 'buzz' | 'short' | 'medium' | 'long' | 'wavy' | 'curly' | 'afro' | 'ponytail' | 'bun'
export type AvatarHairColor = 'black' | 'dark_brown' | 'brown' | 'light_brown' | 'blonde' | 'red' | 'auburn' | 'gray' | 'white' | 'blue' | 'pink'
export type EyeStyle = 'round' | 'almond' | 'wide' | 'narrow'
export type EyeColor = 'brown' | 'dark_brown' | 'blue' | 'green' | 'hazel' | 'gray' | 'amber'
export type BrowStyle = 'thin' | 'medium' | 'thick' | 'arched'
export type BeardStyle = 'none' | 'stubble' | 'short' | 'full' | 'goatee' | 'mustache'
export type AvatarClothesStyle = 'casual' | 'formal' | 'sporty' | 'elegant' | 'punk' | 'traditional'
export type AvatarAccessory = 'none' | 'glasses_round' | 'glasses_square' | 'sunglasses' | 'hat_cap' | 'hat_beanie' | 'hat_fedora'

export interface AvatarConfig {
  skinTone: SkinTone
  hairStyle: AvatarHairStyle
  hairColor: AvatarHairColor
  eyeStyle: EyeStyle
  eyeColor: EyeColor
  browStyle: BrowStyle
  beardStyle: BeardStyle
  clothesStyle: AvatarClothesStyle
  accessory?: AvatarAccessory
}

export interface PlayerIdentity {
  name: string
  surname: string
  gender: Gender
  nationality: Nationality
  birthYear: number
  familyBackground: FamilyBackground
  religion: Religion
  sexualOrientation: SexualOrientation
  emoji: string
  avatar?: AvatarConfig
}

// ---- Education ----

export type EducationLevel =
  | 'none'
  | 'kindergarten'
  | 'elementary'
  | 'middle'
  | 'highschool'
  | 'vocational'
  | 'bachelor'
  | 'master'
  | 'phd'
  | 'mba'
  | 'medical'
  | 'law'

export interface EducationState {
  currentLevel: EducationLevel
  completedLevels: EducationLevel[]
  gpa: number            // 0.0-4.0
  scholarships: string[]
  clubs: string[]
  dropOut: boolean
  studentLoan: number
  university: string | null
  major: string | null
  graduationYear: number | null
  classmates: SchoolNPC[]
  schoolReputation: SchoolReputationStatus
}

// ---- Career ----

export type ContractType = 'part_time' | 'full_time' | 'freelance' | 'business_owner' | 'unemployed' | 'retired' | 'student'

export interface Job {
  id: string
  title: string
  company: string
  salary: number
  stressLevel: number   // 0-100
  contractType: ContractType
  startYear: number
  promotionChance: number // 0-1
  packId: string
}

export interface CareerState {
  currentJob: Job | null
  jobHistory: Job[]
  promotions: number
  firings: number
  burnoutLevel: number   // 0-100
  pensionContributions: number
  licenses: string[]
  businessOwned: Business | null
  colleagues: WorkNPC[]
  workReputation: WorkReputationStatus
  lastRaiseYear?: number   // last year the player asked for a raise (one ask per year)
}

export type BusinessSector = 'tech' | 'food' | 'retail' | 'consulting' | 'fitness' | 'fashion'

export interface Business {
  id: string
  name: string
  type: string
  sector?: BusinessSector
  employees: number
  revenue: number
  expenses: number
  founded: number
  reputation: number
  // Extended fields for startup system
  capitalInvested?: number
  annualRevenue?: number
  annualProfit?: number
  valuation?: number
  isActive?: boolean
  lossYears?: number
}

export interface RentalProperty {
  id: string
  name: string
  purchasePrice: number
  monthlyRent: number
  maintenanceCost: number
  occupancyRate: number
  purchaseYear: number
  isActive: boolean
}

export interface Band {
  id: string
  name: string
  genre: string
  members: number
  popularity: number
  formed: number
  totalEarnings: number
  isActive: boolean
}

export interface WillBeneficiary {
  relId: string
  name: string
  share: number
}

export interface Will {
  beneficiaries: WillBeneficiary[]
  donationCharity: number
  funeralType: 'simple' | 'normal' | 'luxury'
  organDonor: boolean
  note: string
}

// ---- Relationships ----

export type RelationshipType =
  | 'parent'
  | 'sibling'
  | 'partner'
  | 'spouse'
  | 'ex_partner'
  | 'child'
  | 'friend'
  | 'best_friend'
  | 'colleague'
  | 'rival'
  | 'enemy'
  | 'acquaintance'

export type RelationshipStage =
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'partner'
  | 'spouse'

export type NPCPersonalityTrait =
  | 'introverso'
  | 'ambizioso'
  | 'geloso'
  | 'generoso'
  | 'sensibile'
  | 'sicuro'
  | 'avido'
  | 'leale'
  | 'empatico'
  | 'impulsivo'

export type NPCMood =
  | 'neutrale'
  | 'felice'
  | 'triste'
  | 'geloso'
  | 'arrabbiato'
  | 'nostalgico'
  | 'ansioso'
  | 'motivato'

export interface NPCMemory {
  id: string
  category: 'romantic' | 'family' | 'friendship' | 'professional' | 'financial' | 'criminal'
  description: string
  year: number
  weight: number          // 1-5 importance
  decayFactor: number     // 0-1
  unforgettable: boolean
}

export interface Relationship {
  id: string
  npcId: string
  name: string
  age: number
  gender: Gender
  emoji: string
  type: RelationshipType
  stage: RelationshipStage
  trust: number           // 0-100
  jealousy: number        // 0-100
  attraction: number      // 0-100
  love: number            // 0-100
  respect: number         // 0-100
  toxicityTag: boolean
  historyFlags: string[]
  personalityTraits: NPCPersonalityTrait[]
  mood: NPCMood
  memoryLog: NPCMemory[]
  isAlive: boolean
  nationality: Nationality
  extendedAttributes?: NPCExtendedAttributes
}

// ---- Work Ecosystem ----

export type WorkReputationStatus = 'nuovo' | 'affidabile' | 'ambizioso' | 'lecchino' | 'tossico' | 'genio' | 'pigro' | 'leader' | 'problematico'

export type WorkAction = 'talk' | 'socialize' | 'help' | 'compliment' | 'gossip' | 'fight'

export interface WorkNPC {
  id: string
  name: string
  age: number
  gender: Gender
  emoji: string
  role: string
  level: 'colleague' | 'superior' | 'ceo'
  personalityTraits: NPCPersonalityTrait[]
  mood: NPCMood
  affection: number      // 0-100
  status: 'neutral' | 'friendly' | 'tense' | 'hostile'
  promotedToRelId: string | null
  jobId: string
  extendedAttributes?: NPCExtendedAttributes
}

// ---- School Ecosystem ----

export type SchoolReputationStatus = 'invisibile' | 'popolare' | 'nerd' | 'atleta' | 'ribelle' | 'problematico' | 'leader' | 'artista'

export type SchoolAction = 'talk' | 'befriend' | 'study_together' | 'gossip' | 'fight' | 'copy_homework'

export type SchoolNPCRole = 'student' | 'professor' | 'coach'

export interface SchoolNPC {
  id: string
  name: string
  age: number
  gender: Gender
  emoji: string
  role: SchoolNPCRole
  subject?: string
  personalityTraits: NPCPersonalityTrait[]
  mood: NPCMood
  affection: number      // 0-100
  status: 'neutral' | 'friendly' | 'tense' | 'hostile'
  promotedToRelId: string | null
  educationLevel: EducationLevel
  extendedAttributes?: NPCExtendedAttributes
}

// ---- Player Skills ----

export interface PlayerSkills {
  athleticism: number    // 0-100
  music: number
  acting: number
  creativity: number
  charisma: number
  discipline: number
  leadership: number
  academicSkill: number
  socialSkill: number
}

// ---- Life Memories ----

export type LifeMemoryCategory = 'life' | 'school' | 'work' | 'relationship' | 'health' | 'crime' | 'finance' | 'achievement'

export interface LifeMemory {
  id: string
  year: number
  age: number
  title: string
  description: string
  emoji: string
  category: LifeMemoryCategory
  peopleInvolved: string[]
  isImportant: boolean
}

// ---- Family Tree ----

export type FamilyRelationToPlayer =
  | 'mother'
  | 'father'
  | 'sibling'
  | 'child'
  | 'spouse'
  | 'grandparent'

export interface FamilyMember {
  id: string
  relationshipId: string | null
  name: string
  gender: Gender
  birthYear: number
  deathYear: number | null
  relationToPlayer: FamilyRelationToPlayer
  biological: boolean
  familyBranch: 'maternal' | 'paternal' | 'direct'
  notes: string[]
}

export interface FamilyLink {
  id: string
  fromMemberId: string
  toMemberId: string
  relation: 'parent_of' | 'sibling_of' | 'spouse_of'
}

export interface FamilyState {
  familyId: string
  dynastyName: string
  members: FamilyMember[]
  links: FamilyLink[]
  favoredChildId: string | null
  familyReputation: number
  familyWealthTier: FamilyBackground
  inheritedFlags: string[]
}

// ---- Children ----

export interface PersonalityBigFive {
  openness: number        // 0-100
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
}

export interface Child {
  id: string
  name: string
  age: number
  gender: Gender
  intelligence: number
  looks: number
  health: number
  happiness: number
  personalityTraits: PersonalityBigFive
  bondWithPlayer: number  // 0-100
  respectForPlayer: number // 0-100
  schoolLevel: EducationLevel
  careerPath: string | null
  relationshipStatus: string
  specialNeeds: string[]
  isAdopted: boolean
}

// ---- Pets ----

export interface Pet {
  id: string
  species: 'dog' | 'cat' | 'rabbit' | 'bird' | 'fish' | 'horse' | 'exotic'
  breed: string
  name: string
  age: number
  health: number          // 0-100
  happiness: number       // 0-100
  bondLevel: number       // 0-100
  costMaintenance: number // per month
  lifespan: number        // avg years
  specialAbilities: string[]
  isAlive: boolean
  acquiredYear: number
  // Battle system (optional — defaults to 0/false if absent)
  battleWins?: number
  battleLosses?: number
  isRare?: boolean
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary'
}

export interface MinigameStats {
  hackingWins: number
  hackingPlayed: number
  drivingWins: number
  drivingPlayed: number
  prisonBreakWins: number
  prisonBreakPlayed: number
  lastPlayed: Record<string, number>  // gameType → year last played
}

// ---- Criminal Record ----

export interface Crime {
  id: string
  type: string
  year: number
  convicted: boolean
  sentence: number        // years
  served: number          // years served
}

export interface CriminalRecord {
  crimes: Crime[]
  inPrison: boolean
  prisonSentence: number
  prisonServed: number
  parole: boolean
  paroleDuration: number
  electronicBracelet: boolean
  hasRecord: boolean
}

// ---- Health Extended ----

export interface Disease {
  id: string
  name: string
  severity: 1 | 2 | 3 | 4 | 5
  curable: boolean
  treatmentCost: number
  yearContracted: number
  isTreated: boolean
  chronic: boolean
}

export interface Addiction {
  substance: string
  level: number           // 0-100
  yearStarted: number
  inRehab: boolean
}

export interface HealthState {
  diseases: Disease[]
  addictions: Addiction[]
  disabilities: string[]
  fitnessLevel: number    // 0-100
  bmi: number
  lastMedicalCheck: number
  mentalDisorders: string[]
  ptsd: boolean
  traumas: TraumaEvent[]
  therapySessions: number
  resilience: number      // 0-100, reduces future trauma impact
}

export type TraumaType = 'grief' | 'divorce' | 'betrayal' | 'bankruptcy' | 'illness' | 'violence' | 'imprisonment'

export interface TraumaEvent {
  id: string
  type: TraumaType
  source: string
  description: string
  year: number
  severity: number        // 1-5
  intensity: number       // 0-100 current emotional load
  triggers: string[]
  resolved: boolean
}

// ---- Hobbies & Skills ----

export interface Hobby {
  id: string
  name: string
  skillLevel: number      // 0-100
  practiceHoursPerWeek: number
  monetizable: boolean
  monthlyIncome: number
  yearStarted: number
  packId: string
}

// ---- Sports ----
// Separate from Hobby. Designed for future expansion: training, competitions,
// championships, prizes, injuries, professional careers and sport fame.

export type SportCategory =
  | 'team' | 'individual' | 'combat' | 'water' | 'winter' | 'racket' | 'extreme'

export interface Sport {
  id: string
  name: string
  skillLevel: number               // 0-100
  practiceHoursPerWeek: number
  yearStarted: number
  // Forward-looking fields (scaffolding for future systems)
  competitionsEntered: number      // competitions / championships
  competitionsWon: number          // prizes / titles
  injuries: number                 // injury history count
  isProfessional: boolean          // pro career flag
  fame: number                     // 0-100 sport fame
  packId: string
}

// ---- Social Media ----

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook' | 'twitch' | 'podcast' | 'onlyfans'
export type ViralStage = 'unknown' | 'micro' | 'rising' | 'influencer' | 'macro' | 'mega'

export interface SocialMediaProfile {
  platform: SocialPlatform
  username: string
  followers: number
  viralScore: number      // 0-100
  stage: ViralStage
  monthlyIncome: number
  postCount: number
  engagementRate: number
}

// ---- Travel ----

export interface TravelMemory {
  destination: string
  year: number
  activityType: 'cultural' | 'adventure' | 'wellness' | 'work' | 'school' | 'honeymoon'
  cost: number
  memoryFlag: string
  photosOnSocial: boolean
}

// ---- Living Situation ----

export type LivingType = 'parents' | 'dormitory' | 'roommate' | 'renting' | 'owning' | 'homeless' | 'prison'

export interface LivingState {
  type: LivingType
  location: string
  monthlyCost: number
  mortgageRemaining: number
  propertyValue: number
  roommates: string[]
}

// ---- Action Limits (anti-abuse) ----

export interface ActionUsage {
  actionId: string
  usesThisYear: number
  totalUses: number
  lastUsedYear: number
  cooldownRemaining: number
}

// ---- Events & Choices ----

export interface Effect {
  [statKey: string]: number
}

export interface Choice {
  id: string
  eventId: string
  text: string
  effects: Effect
  requirements: Requirement[]
  packId: string
}

export interface Requirement {
  stat: string
  operator: '>' | '<' | '>=' | '<=' | '==' | '!='
  value: number | string | boolean
}

export interface GameEvent {
  id: string
  title: string
  description: string
  emoji: string
  choices: Choice[]
  triggerCondition: string
  minAge: number
  maxAge: number
  probability: number     // 0-1
  packId: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  isHistorical: boolean
  year?: number
}

// ---- Goals ----

export interface Goal {
  id: string
  name: string
  description: string
  category: string
  triggerCondition: string
  reward: Effect
  completed: boolean
  completedYear: number | null
  ribbonId: string | null
}

// ---- Ribbons / Achievements ----

export type RibbonTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface Ribbon {
  id: string
  name: string
  description: string
  category: string
  tier: RibbonTier
  unlocked: boolean
  unlockedYear: number | null
  icon: string
}

// ---- Challenges ----

export interface Condition {
  type: string
  value: number
  threshold: number
  comparison: '>' | '<' | '=='
}

export interface Challenge {
  id: string
  name: string
  description: string
  category: string
  duration: 'weekly' | 'monthly' | 'seasonal' | 'lifetime'
  startDate: string
  endDate: string
  conditions: Condition[]
  rewardPoints: number
  rewardRibbons: string[]
  rewardItems: string[]
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  successRate: number
  accepted: boolean
  completed: boolean
  failed: boolean
}

// ---- Nations ----

export interface Nation {
  id: string
  name: string
  flag: string
  taxRate: number         // 0-1
  healthRecoveryBonus: number
  costOfLiving: number    // multiplier
  minWage: number
  avgSalary: number
  crimeRate: number       // 0-1
  corruptionIndex: number // 0-1
  abortionLegal: boolean
  cannabisLegal: boolean
  sameMarriageLegal: boolean
  conscription: boolean
  healthcarePublic: boolean
  exclusiveEvents: string[]
}

// ---- Inventory ----

export interface InventoryItem {
  id: string
  name: string
  type: 'clothing' | 'vehicle' | 'luxury' | 'book' | 'souvenir' | 'weapon' | 'document' | 'other'
  value: number
  quantity: number
  acquired: number        // year
  description: string
}

// ---- Vehicle ----

export interface VehicleViolation {
  year: number
  type: string
  fine: number
  pointsLost: number
}

export interface OwnedVehicle {
  id: string
  category: 'economy' | 'medium' | 'luxury' | 'supercar' | 'moto'
  name: string
  emoji: string
  purchaseYear: number
  purchasePrice: number
  currentValue: number
  annualInsurance: number
  annualMaintenance: number
}

export interface VehicleState {
  hasLicenseB: boolean
  theoryPassed: boolean
  studyHours: number
  licensePoints: number   // 0-20
  violations: VehicleViolation[]
  ownedVehicles: OwnedVehicle[]
}

// ---- Religion ----

export interface ReligionState {
  practiceLevel: number   // 0-100
  lastPracticeYear: number
}

// ---- Politics ----
// (full PoliticsState lives in PoliticsEngine; re-exported here for store typing)
export type { PoliticsState } from '../services/PoliticsEngine'

// ---- Military ----
// (full MilitaryState lives in MilitaryEngine)
export type { MilitaryState } from '../services/MilitaryEngine'

// ---- Body Mods ----
export type { BodyMod, BodyModState } from '../services/BodyModEngine'

// ---- Beauty ----
export type { BeautyState, HairStyle, NailsStyle, WardrobeTier, SkincareLevel } from '../services/BeautyEngine'

// ---- Retirement ----
export type { RetirementState, RetirementType, SeniorLiving, SeniorCondition } from '../services/RetirementEngine'

// ---- Gambling ----
export type { GamblingState, GamblingGame, GamblingResult, SportBetType } from '../services/GamblingEngine'

// ---- Sexual Health ----
export type { SexualHealthState, ContraceptionMethod, STI, STIType, SexualHealthResult } from '../services/SexualHealthEngine'

// ---- World Events ----
export type { WorldEventsState, WorldModifier, HistoricalEvent, HomeRepairEvent } from '../services/WorldEventsEngine'

// ---- Cosmetic Surgery ----
export type { CosmeticSurgeryState, PerformedSurgery, CosmeticProcedure } from '../services/CosmeticSurgeryEngine'

// ---- Challenges ----
export type { ChallengeEngineState, ActiveChallenge, ChallengeDefinition } from '../services/ChallengeEngine'

// ---- Fame ----

export type FameTier = 'unknown' | 'local' | 'rising' | 'famous' | 'celebrity' | 'icon'

export interface FameState {
  fame: number            // 0-100
  tier: FameTier
  fanbase: number
  publicImage: number     // 0-100
  scandals: number
  verified: boolean
  sponsorships: number
  lastInterviewYear: number
}

// ---- Extreme Chaos ----

export type ChaosEventType =
  | 'alien_encounter'
  | 'cult_escape'
  | 'kidnapping'
  | 'absurd_accident'
  | 'serial_killer'
  | 'millionaire_scam'
  | 'survival_scenario'
  | 'overnight_fame'

export interface ChaosEventRecord {
  id: string
  type: ChaosEventType
  year: number
  age: number
  title: string
  description: string
  severity: number        // 1-5
  survived: boolean
  effects: Effect
}

export interface ChaosState {
  triggeredEvents: ChaosEventRecord[]
  chaosScore: number      // 0-100, rough measure of how absurd the run became
}

// ---- Daily Quests ----

export type DailyQuestType =
  | 'age_up'
  | 'earn_money'
  | 'improve_health'
  | 'social_post'
  | 'relationship_action'
  | 'practice_hobby'
  | 'complete_challenge'

export interface DailyQuest {
  id: string
  type: DailyQuestType
  title: string
  description: string
  emoji: string
  target: number
  reward: Effect
  claimed: boolean
}

export interface DailyQuestState {
  currentDate: string
  quests: DailyQuest[]
  completedQuestIds: string[]
  streak: number
  lastClaimDate: string | null
  totalClaimed: number
}

// ---- Pending Consequences (delayed event effects) ----

export type PendingConsequenceCategory = 'health' | 'work' | 'finance' | 'relationship' | 'life'

export interface PendingConsequence {
  id: string
  triggerAge: number
  title: string
  description: string
  emoji: string
  effects: Effect
  category: PendingConsequenceCategory
}

// ---- Narrative (traits, story arcs, NPC requests, life phases) ----

export type NarrativeTraitId =
  | 'bambino_prodigio' | 'famiglia_instabile' | 'nato_in_poverta'
  | 'genitori_famosi' | 'malattia_cronica' | 'famiglia_religiosa'
  | 'quartiere_pericoloso' | 'talento_musicale' | 'fratello_rivale'

export type LifePhaseId = 'infanzia' | 'adolescenza' | 'giovinezza' | 'maturita' | 'vecchiaia'

export interface StoryArcState {
  arcId: string
  stageIndex: number
  flags: Record<string, boolean | number | string>
  npcId: string | null
  status: 'active' | 'completed' | 'abandoned'
  startedYear: number
}

export interface NPCRequestRecord {
  id: string
  npcId: string
  npcName: string
  requestType: string
  year: number
  age: number
  accepted: boolean
}

export interface PhaseRecap {
  phaseId: LifePhaseId
  year: number
  age: number
  completedObjectives: string[]
  missedObjectives: string[]
  summary: string
}

// Loan taken from a relative or friend — must be repaid or the relationship sours
export interface NpcLoan {
  id: string
  npcId: string        // Relationship id of the lender
  npcName: string
  amount: number
  yearBorrowed: number
  dueYear: number
  repaid: boolean
  direction?: 'player_borrowed' | 'player_lent'  // undefined/'player_borrowed' = player owes NPC; 'player_lent' = NPC owes player
}

export interface NarrativeState {
  traits: NarrativeTraitId[]
  originStory: { scenarioId: string; text: string; seen: boolean } | null
  arcs: StoryArcState[]
  npcRequestHistory: NPCRequestRecord[]
  lastNpcRequestAge: number
  phaseRecaps: PhaseRecap[]
}

// ---- NPC Agency ----

export type NPCAgencyEventType =
  | 'married'
  | 'child_born'
  | 'moved_away'
  | 'career_change'
  | 'reconciled'
  | 'relationship_broke'
  | 'death'

export interface NPCAgencyEvent {
  id: string
  npcId: string
  npcName: string
  type: NPCAgencyEventType
  year: number
  age: number
  description: string
  effects: Effect
}

export interface NPCAgencyState {
  events: NPCAgencyEvent[]
  totalEvents: number
}

// ---- Credit Score ----
export type { CreditScoreResult, CreditTier } from '../services/CreditScoreEngine'

// ---- Legacy ----

export interface Legacy {
  playerId: string
  deathDate: string
  children: ChildInheritance[]
  assetsTransferred: Asset[]
  traitsInherited: Trait[]
  relationshipsMaintained: Relationship[]
  memoriesPreserved: NPCMemory[]
  familyTies: number      // 0-100
  legacyScore: number     // 0-1000
  ribbonsFamily: string[]
}

export interface ChildInheritance {
  id: string
  age: number
  intelligence: number
  looks: number
  health: number
  criminalTendency: number
  personality: PersonalityBigFive
  startingMoney: number
  startingRelationships: Relationship[]
  parentMemory: string
}

export interface Trait {
  name: string
  value: number
  inherited: boolean
  geneticFactor: number   // 0-1
}

// ---- Game Modes ----

export type GameMode = 'normal' | 'hard' | 'god' | 'ghost' | 'legacy' | 'challenge'

export interface GameSettings {
  mode: GameMode
  ironMan: boolean        // hardcore mode — immutable after creation
  soundEnabled: boolean
  notificationsEnabled: boolean
  language: string
  autoSave: boolean
  godModeUnlocked: boolean
}

// ---- Event Log ----

export interface LogEntry {
  id: string
  year: number
  age: number
  text: string
  emoji: string
  category: string
  statChanges: Effect
}

// ---- Full Game State (Zustand) ----

export interface GameState {
  // Meta
  isStarted: boolean
  isGameOver: boolean
  deathType: string | null
  gameOverYear: number | null
  settings: GameSettings

  // Time
  time: TimeState

  // Identity
  identity: PlayerIdentity

  // Core stats
  stats: CoreStats

  // Finance
  finance: FinanceState

  // Stock market
  market: MarketState

  // Education
  education: EducationState

  // Career
  career: CareerState

  // Relationships
  relationships: Relationship[]

  // Family tree
  family: FamilyState

  // Children
  children: Child[]

  // Pets
  pets: Pet[]

  // Criminal
  criminal: CriminalRecord

  // Health
  health: HealthState

  // Hobbies
  hobbies: Hobby[]

  // Sports (separate category from hobbies)
  sports: Sport[]

  // Social media
  socialMedia: SocialMediaProfile[]

  // Fame
  fame: FameState

  // Extreme chaos history
  chaos: ChaosState

  // Travel
  travelHistory: TravelMemory[]

  // Living
  living: LivingState

  // Current nation
  nation: Nation | null

  // Vehicle & driving
  vehicle: VehicleState

  // Religion
  religion: ReligionState

  // Politics
  politics: import('../services/PoliticsEngine').PoliticsState

  // Military
  military: import('../services/MilitaryEngine').MilitaryState

  // Body modifications
  bodyMods: import('../services/BodyModEngine').BodyModState

  // Beauty & personal care
  beauty: import('../services/BeautyEngine').BeautyState

  // Retirement & senior life
  retirement: import('../services/RetirementEngine').RetirementState

  // Gambling
  gambling: import('../services/GamblingEngine').GamblingState

  // Sexual health
  sexualHealth: import('../services/SexualHealthEngine').SexualHealthState

  // World events
  worldEvents: import('../services/WorldEventsEngine').WorldEventsState

  // Cosmetic surgery
  cosmeticSurgery: import('../services/CosmeticSurgeryEngine').CosmeticSurgeryState

  // Challenge engine
  challengeEngine: import('../services/ChallengeEngine').ChallengeEngineState

  // Daily quests
  dailyQuests: DailyQuestState

  // Autonomous NPC life simulation
  npcAgency: NPCAgencyState
  npcEventQueue: NPCAgencyEvent[]

  // Delayed event consequence queue (choices that have future ripple effects)
  pendingConsequences: PendingConsequence[]

  // Narrative layer: traits, origin story, story arcs, NPC requests, life phases
  narrative: NarrativeState

  // Outstanding loans from relatives/friends (unpaid past due = relationship damage)
  npcLoans: NpcLoan[]

  // Events
  currentEvent: GameEvent | null
  availableChoices: Choice[]
  pendingEffects: Effect | null

  // Action limits
  actionUsages: ActionUsage[]

  // Goals
  goals: Goal[]
  completedGoals: string[]

  // Ribbons
  ribbons: Ribbon[]

  // Challenges
  challenges: Challenge[]

  // Inventory
  inventory: InventoryItem[]

  // Event log
  eventLog: LogEntry[]

  // Legacy
  legacy: Legacy | null

  // Minigame stats
  minigameStats: MinigameStats

  // Ad rewards (rewarded ads system)
  adRewards: import('../services/AdRewardEngine').AdRewardState

  // Anti-abuse: diminishing returns tracking per action per year
  diminishingReturns: Record<string, number>

  // Player skills built through activities
  skills: PlayerSkills

  // Life memories (important events)
  lifeMemories: LifeMemory[]

  // Rental investment properties
  rentalProperties: RentalProperty[]

  // Music band
  band: Band | null

  // Last will & testament
  will: Will | null

  // Citizenships (nation IDs)
  citizenships: string[]

  // Special career (actor, musician, pro_athlete, politician)
  specialCareer: import('../services/SpecialCareerEngine').SpecialCareer | null
}

// ---- Action Result (shared) ----

export interface ActionResult {
  success: boolean
  message: string
  effects: Effect
}

// ---- Store Actions ----

export interface GameActions {
  // Core game loop
  handleInvecchia: () => void
  handleChoice: (choiceId: string) => void
  aggiornaStats: (effects: Effect) => void

  // Game management
  salvaGioco: () => void
  caricaGioco: () => void
  resetGiorno: () => void
  newGame: (identity: PlayerIdentity, nationId: string, mode?: import('./types').GameMode, ironMan?: boolean, startingBonus?: Effect, scenarioId?: string) => void
  markOriginStorySeen: () => void

  // Career engine actions
  applyForJob: (jobId: string) => ActionResult
  quitJob: () => ActionResult
  attemptPromotion: () => ActionResult

  // Work ecosystem actions
  workInteract: (colleagueId: string, action: WorkAction) => ActionResult

  // Relationship engine actions
  meetNewPerson: (context: import('../services/RelationshipEngine').NPCContext) => ActionResult
  interactWithNPC: (npcId: string, action: import('../services/RelationshipEngine').NPCAction) => ActionResult

  // Education engine actions
  startEducation: (level: EducationLevel) => ActionResult
  studyAction: () => ActionResult

  // School ecosystem actions
  schoolInteract: (npcId: string, action: SchoolAction) => ActionResult
  joinClub: (clubId: string) => ActionResult
  leaveClub: (clubId: string) => ActionResult
  requestMoneyFromParents: (amount: number, reason: string) => ActionResult

  // NPC money exchange + loans from relatives/friends
  giveMoneyToNpc: (relId: string, amount: number) => ActionResult
  askMoneyFromNpc: (relId: string, amount: number) => ActionResult
  repayNpcLoan: (loanId: string) => ActionResult

  // BitLife-style extras
  askForRaise: () => ActionResult
  emigrate: (nationId: string) => ActionResult
  playLottery: () => ActionResult
  writeBook: () => ActionResult
  terminatePregnancy: () => ActionResult
  adoptOutPregnancy: () => ActionResult

  // Social activities outside work/school
  socializeOutside: (location: import('../services/WorkSchoolEngine').SocialLocation) => ActionResult

  // Health engine actions
  medicalCheck: () => ActionResult
  treatDisease: (diseaseId: string) => ActionResult
  exercise: () => ActionResult
  attendTherapy: () => ActionResult

  // Hobby engine actions
  addHobby: (hobbyId: string) => ActionResult
  practiceHobby: (hobbyId: string) => ActionResult

  // Sport engine actions
  startSport: (sportId: string) => ActionResult
  practiceSport: (sportId: string) => ActionResult
  quitSport: (sportId: string) => ActionResult
  enterSportCompetition: (sportId: string) => ActionResult

  // Special career actions
  startSpecialCareer: (type: import('../services/SpecialCareerEngine').SpecialCareerType) => ActionResult
  performSpecialCareerAction: (actionId: string) => ActionResult

  // Criminal engine actions
  commitCrime: (crimeId: string) => ActionResult

  // Finance engine actions
  investMoney: (defId: string, amount: number) => ActionResult
  sellInvestment: (investmentId: string) => ActionResult
  buyAsset: (assetType: string) => ActionResult
  insureAsset: (assetId: string) => ActionResult
  maintainAsset: (assetId: string) => ActionResult
  takeLoan: (amount: number) => ActionResult
  buyHealthInsurance: () => ActionResult
  cancelHealthInsurance: () => ActionResult

  // Social media actions
  createSocialProfile: (platform: string) => ActionResult
  postContent: (platform: string, postType: string) => ActionResult

  // Substance actions
  drinkAlcohol: (type: string) => ActionResult
  smokeCigarette: (type: string) => ActionResult
  quitSubstance: (substance: string) => ActionResult
  enterRehab: () => ActionResult

  // Pet actions
  adoptPet: (petDefId: string, method: 'adopt' | 'buy') => ActionResult
  careForPet: (petId: string) => ActionResult
  vetVisit: (petId: string) => ActionResult

  // Travel actions
  bookTrip: (destId: string, travelClass: 'economy' | 'business' | 'luxury') => ActionResult

  // Dating/Marriage actions
  swipe: (appId: string) => ActionResult
  proposeToPartner: (npcId: string, ringValue: number) => ActionResult
  getMarried: (npcId: string, weddingBudget: number) => ActionResult
  getDivorced: (npcId: string) => ActionResult
  fileForDivorce: () => ActionResult

  // Parenting actions
  haveChild: () => ActionResult
  adoptChild: (gender?: 'male' | 'female', age?: number) => ActionResult
  adoptInternational: (country: string, gender: 'male' | 'female') => ActionResult
  interactWithChild: (childId: string, action: string) => ActionResult

  // Military actions
  enlistMilitary: (branch: string) => ActionResult
  goOnMission: (missionType: string) => ActionResult
  requestMilitaryPromotion: () => ActionResult
  dischargeMilitary: () => ActionResult

  // Body mod actions
  getTattoo: (tattooId: string) => ActionResult
  getPiercing: (piercingId: string) => ActionResult
  removeTattoo: (modId: string) => ActionResult

  // Beauty actions
  getHaircut: (style: string) => ActionResult
  doNails: (style: string) => ActionResult
  upgradeWardrobe: (tier: string) => ActionResult
  doSkincare: (level: string) => ActionResult
  getBotox: () => ActionResult
  getLaserHairRemoval: () => ActionResult
  buyLuxuryItem: (itemId: string) => ActionResult

  // Retirement actions
  retire: (type: string) => ActionResult
  makeWill: () => ActionResult
  prePlanFuneral: () => ActionResult
  doVolunteering: () => ActionResult
  changeLiving: (arrangement: string) => ActionResult

  // Legacy
  continueAsChild: (childId: string) => void

  // Living / housing actions
  upgradeLiving: (targetType: LivingType) => ActionResult
  buyHouseWithMortgage: (houseId: string) => ActionResult

  // Gambling actions
  playCasinoGame: (game: import('../services/GamblingEngine').GamblingGame, bet: number) => ActionResult
  buyLotteryTicket: () => ActionResult
  buyScratchCard: () => ActionResult
  placeSportsBet: (sport: import('../services/GamblingEngine').SportBetType, bet: number) => ActionResult

  // Sexual health actions
  setContraception: (method: import('../services/SexualHealthEngine').ContraceptionMethod) => ActionResult
  haveSex: (partnerHasSTI?: boolean) => ActionResult
  takePregnancyTest: () => ActionResult
  getAbortion: () => ActionResult
  getSTDTest: () => ActionResult
  treatSTI: (stiType: import('../services/SexualHealthEngine').STIType) => ActionResult
  doIVF: () => ActionResult

  // Cosmetic surgery actions
  performSurgery: (procedureId: string) => ActionResult

  // Challenge actions
  acceptChallenge: (defId: string) => ActionResult
  abandonChallenge: (defId: string) => ActionResult
  claimDailyQuest: (questId: string) => ActionResult

  // Avatar actions
  updateAvatar: (config: Partial<AvatarConfig>) => void
  visitBarber: (serviceId: string) => ActionResult
  buyAccessory: (accessoryId: string) => ActionResult
  removeAccessory: () => void

  // Cheat actions
  cheatAddMoney: (amount: number) => void
  cheatSetMaxStats: () => void
  cheatSetImmortal: () => void
  cheatSkipToAge: (targetAge: number) => void
  unlockGodMode: () => void
  dismissNpcEvent: (id: string) => void

  // Pet battle actions
  petBattle: (petId: string) => ActionResult
  petBreed: (pet1Id: string, pet2Id: string) => ActionResult

  // Minigame actions
  recordMinigameResult: (gameType: string, won: boolean) => ActionResult

  // Ad reward actions
  claimAdReward: () => { reward: import('../services/AdRewardEngine').AdReward; ok: boolean; reason?: string }

  // Vehicle/driving actions
  studyDrivingTheory: () => ActionResult
  takeTheoryExam: () => ActionResult
  takePracticalExam: () => ActionResult
  buyVehicle: (vehicleId: string) => ActionResult

  // Religion actions
  practiceReligion: () => ActionResult
  convertReligion: (religion: Religion) => ActionResult

  // Politics actions
  registerToVote: () => ActionResult
  vote: (partyId: string) => ActionResult
  joinParty: (partyId: string) => ActionResult
  leaveParty: () => ActionResult
  conductCampaign: () => ActionResult
  runForOffice: (role: string) => ActionResult
  engageInCorruption: () => ActionResult

  // Business actions
  foundBusiness: (sector: BusinessSector, name: string) => ActionResult
  hireBizEmployee: () => ActionResult
  fireBizEmployee: () => ActionResult
  sellBusiness: () => ActionResult

  // Cheating/jealousy
  cheatOnPartner: () => ActionResult
  confrontPartner: () => ActionResult

  // Criminal actions
  robSomeone: () => ActionResult
  muggingDefense: (action: 'fight' | 'comply' | 'flee') => ActionResult
  bribeOfficial: () => ActionResult
  workInPrison: () => ActionResult
  studyInPrison: () => ActionResult
  fightInPrison: () => ActionResult

  // Life actions
  volunteerCommunity: () => ActionResult
  changeLegalName: (newFirstName: string, newLastName?: string) => ActionResult
  toggleOrganDonor: () => void
  updateWill: (will: Will) => void
  applyForCitizenship: (nationId: string) => ActionResult

  // Band actions
  formBand: (name: string, genre: string) => ActionResult
  performConcert: () => ActionResult
  disbandBand: () => ActionResult

  // Rental property actions
  buyRentalProperty: (propertyId: string) => ActionResult
  sellRentalProperty: (propertyId: string) => ActionResult

  // Validation
  checkGoals: () => void
  checkMorte: () => void
  checkEventRequirements: (event: GameEvent, state: GameState) => boolean
  applyNazioneEffect: () => void

  // Setters
  setCurrentEvent: (event: GameEvent | null) => void
  addLogEntry: (entry: Omit<LogEntry, 'id'>) => void
  addRelationship: (rel: Relationship) => void
  updateRelationship: (id: string, updates: Partial<Relationship>) => void
  removeRelationship: (id: string) => void
}

export type FullStore = GameState & GameActions
