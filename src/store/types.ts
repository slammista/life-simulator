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
}

export interface Investment {
  id: string
  type: 'stock' | 'bond' | 'crypto' | 'fund'
  name: string
  amount: number
  currentValue: number
  purchaseDate: string
}

export interface Asset {
  id: string
  type: 'house' | 'car' | 'luxury' | 'business' | 'other'
  name: string
  value: number
  purchaseValue: number
  purchaseYear: number
  maintenanceCost: number
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
}

export interface Business {
  id: string
  name: string
  type: string
  employees: number
  revenue: number
  expenses: number
  founded: number
  reputation: number
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
  memoryLog: NPCMemory[]
  isAlive: boolean
  nationality: Nationality
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

// ---- Social Media ----

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'onlyfans'
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

  // Education
  education: EducationState

  // Career
  career: CareerState

  // Relationships
  relationships: Relationship[]

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

  // Social media
  socialMedia: SocialMediaProfile[]

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

  // Anti-abuse: diminishing returns tracking per action per year
  diminishingReturns: Record<string, number>
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
  newGame: (identity: PlayerIdentity, nationId: string) => void

  // Career engine actions
  applyForJob: (jobId: string) => ActionResult
  quitJob: () => ActionResult
  attemptPromotion: () => ActionResult

  // Relationship engine actions
  meetNewPerson: (context: import('../services/RelationshipEngine').NPCContext) => ActionResult
  interactWithNPC: (npcId: string, action: import('../services/RelationshipEngine').NPCAction) => ActionResult

  // Education engine actions
  startEducation: (level: EducationLevel) => ActionResult
  studyAction: () => ActionResult

  // Health engine actions
  medicalCheck: () => ActionResult
  treatDisease: (diseaseId: string) => ActionResult
  exercise: () => ActionResult

  // Hobby engine actions
  addHobby: (hobbyId: string) => ActionResult
  practiceHobby: (hobbyId: string) => ActionResult

  // Criminal engine actions
  commitCrime: (crimeId: string) => ActionResult

  // Finance engine actions
  investMoney: (defId: string, amount: number) => ActionResult
  sellInvestment: (investmentId: string) => ActionResult
  buyAsset: (assetType: string) => ActionResult
  takeLoan: (amount: number) => ActionResult

  // Social media actions
  createSocialProfile: (platform: string) => ActionResult
  postContent: (platform: string, postType: string) => ActionResult

  // Substance actions
  drinkAlcohol: (type: string) => ActionResult
  smokeCigarette: (type: string) => ActionResult
  quitSubstance: (substance: string) => ActionResult

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

  // Parenting actions
  haveChild: () => ActionResult
  adoptChild: () => ActionResult
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
