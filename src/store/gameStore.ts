import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  FullStore,
  GameState,
  Effect,
  GameEvent,
  Choice,
  LogEntry,
  Relationship,
  PlayerIdentity,
  Nation,
  EducationLevel,
  ActionResult,
} from './types'
import db from '../../public/db.json'
import { CareerEngine, getAllJobs } from '../services/CareerEngine'
import { RelationshipEngine, type NPCContext, type NPCAction } from '../services/RelationshipEngine'
import { EducationEngine, getEducationLabel } from '../services/EducationEngine'
import { HealthEngine } from '../services/HealthEngine'
import { HobbyEngine } from '../services/HobbyEngine'
import { CriminalEngine } from '../services/CriminalEngine'
import { FinanceEngine, type AssetType } from '../services/FinanceEngine'
import { SocialMediaEngine, type SocialPlatform, type PostType } from '../services/SocialMediaEngine'
import { SubstanceEngine, type AlcoholType, type SmokeType } from '../services/SubstanceEngine'
import { PetEngine, type AdoptMethod } from '../services/PetEngine'
import { PetBattleEngine } from '../services/PetBattleEngine'
import { AdRewardEngine, adRewardToEffect } from '../services/AdRewardEngine'
import { TravelEngine, type TravelClass } from '../services/TravelEngine'
import { DatingEngine, type DatingApp } from '../services/DatingEngine'
import { VehicleEngine } from '../services/VehicleEngine'
import { ReligionEngine } from '../services/ReligionEngine'
import { PoliticsEngine, type PoliticalRole } from '../services/PoliticsEngine'
import { ParentingEngine, type ParentingAction } from '../services/ParentingEngine'
import { MilitaryEngine, type MilitaryBranch, type MissionType } from '../services/MilitaryEngine'
import { BodyModEngine } from '../services/BodyModEngine'
import { BeautyEngine, type HairStyle, type NailsStyle, type WardrobeTier, type SkincareLevel } from '../services/BeautyEngine'
import { RetirementEngine, type RetirementType, type SeniorLiving } from '../services/RetirementEngine'
import { LegacyEngine } from '../services/LegacyEngine'
import { GamblingEngine, type GamblingGame, type SportBetType } from '../services/GamblingEngine'
import { SexualHealthEngine, type ContraceptionMethod, type STIType } from '../services/SexualHealthEngine'
import { WorldEventsEngine } from '../services/WorldEventsEngine'
import { CosmeticSurgeryEngine } from '../services/CosmeticSurgeryEngine'
import { ChallengeEngine } from '../services/ChallengeEngine'
import { AchievementsEngine } from '../services/AchievementsEngine'
import { CreditScoreEngine } from '../services/CreditScoreEngine'
import { LivingEngine } from '../services/LivingEngine'
import { FamilyEngine } from '../services/FamilyEngine'
import { TraumaEngine } from '../services/TraumaEngine'
import { FameEngine } from '../services/FameEngine'
import { ChaosEngine } from '../services/ChaosEngine'
import { DailyQuestEngine } from '../services/DailyQuestEngine'
import { NPCAgencyEngine } from '../services/NPCAgencyEngine'
import { BalanceEngine } from '../services/BalanceEngine'
import { WorkSchoolEngine, type SocialLocation } from '../services/WorkSchoolEngine'
import type { WorkAction, SchoolAction, PlayerSkills, WorkNPC, SchoolNPC } from './types'
import type { Addiction, TravelMemory, Religion, Child, LivingType, AvatarConfig, AvatarAccessory } from './types'
import { getDefaultAvatar, getBarberServices, getAccessoryShop, wardrobeTierToClothesStyle, beautyHairToAvatarStyle, beautyHairToAvatarColor } from '../services/AvatarEngine'
import type { PoliticsState } from '../services/PoliticsEngine'
import type { MilitaryState } from '../services/MilitaryEngine'

// ---- helpers ----

export const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val))

export const uid = () => Math.random().toString(36).slice(2, 10)

function makeMemory(
  timeRef: { year: number; age: number },
  title: string,
  description: string,
  emoji: string,
  category: import('./types').LifeMemoryCategory,
  people: string[] = [],
  isImportant = true
): import('./types').LifeMemory {
  return { id: uid(), year: timeRef.year, age: timeRef.age, title, description, emoji, category, peopleInvolved: people, isImportant }
}

function getPlayerEmoji(state: GameState): string {
  const { stats, time } = state
  if (stats.health <= 0) return '💀'
  if (time.age > 70) return state.identity.gender === 'female' ? '👵' : '👴'
  if (stats.health < 20) return '🤒'
  if (stats.mentalHealth < 20) return '😰'
  if (stats.energy < 20) return '😴'
  if (stats.happiness > 70) return '😊'
  if (stats.happiness < 30) return '😢'
  if (stats.karma < -30) return '😈'
  const hasPartner = state.relationships.some(r => r.stage === 'partner' || r.stage === 'spouse')
  if (hasPartner) return '🥰'
  return '🙂'
}

function evaluateTrigger(condition: string, state: GameState): boolean {
  try {
    const age = state.time.age
    const year = state.time.year
    const money = state.finance.money
    const health = state.stats.health
    const happiness = state.stats.happiness
    const intelligence = state.stats.intelligence
    const hasJob = state.career.currentJob !== null
    const hasRecord = state.criminal.hasRecord

    if (condition.startsWith('year ==')) {
      return year === parseInt(condition.split('==')[1].trim())
    }
    if (condition.startsWith('year >=')) {
      return year >= parseInt(condition.split('>=')[1].trim())
    }
    if (condition === 'age == 0') return age === 0
    if (condition === 'age == 6') return age === 6
    if (condition.includes('&&')) {
      return condition.split('&&').every(c => evaluateTrigger(c.trim(), state))
    }

    const fn = new Function(
      'age', 'year', 'money', 'health', 'happiness', 'intelligence', 'hasJob', 'hasRecord',
      `return (${condition})`
    )
    return fn(age, year, money, health, happiness, intelligence, hasJob, hasRecord)
  } catch {
    return false
  }
}

function applyEffects(state: GameState, effects: Effect): Partial<GameState> {
  const s = state.stats
  const f = state.finance
  return {
    stats: {
      health:           clamp(s.health           + (effects.health           ?? 0), 0, 100),
      mentalHealth:     clamp(s.mentalHealth      + (effects.mentalHealth     ?? 0), 0, 100),
      happiness:        clamp(s.happiness         + (effects.happiness        ?? 0), 0, 100),
      intelligence:     clamp(s.intelligence      + (effects.intelligence     ?? 0), 0, 100),
      looks:            clamp(s.looks             + (effects.looks            ?? 0), 0, 100),
      energy:           clamp(s.energy            + (effects.energy           ?? 0), 0, 100),
      karma:            clamp(s.karma             + (effects.karma            ?? 0), -100, 100),
      reputation:       clamp(s.reputation        + (effects.reputation       ?? 0), 0, 100),
      socialReputation: clamp(s.socialReputation  + (effects.socialReputation ?? 0), 0, 100),
    },
    finance: { ...f, money: f.money + (effects.money ?? 0) },
  }
}

// Compute total weekly hours occupied by work + school + clubs
function computeWeeklyHours(state: Pick<GameState, 'career' | 'education'>): number {
  let hours = 0
  const ct = state.career.currentJob?.contractType
  if (ct === 'full_time') hours += 40
  else if (ct === 'part_time') hours += 20
  else if (ct === 'freelance') hours += 30
  else if (ct === 'business_owner') hours += 50
  if (state.education.currentLevel && state.education.currentLevel !== 'none') hours += 40
  for (const club of state.education.clubs) {
    const l = club.toLowerCase()
    if (l.includes('sport') || l.includes('calcio') || l.includes('basket') || l.includes('nuoto') || l.includes('atletica')) hours += 8
    else if (l.includes('musica') || l.includes('music') || l.includes('band') || l.includes('coro')) hours += 8
    else if (l.includes('drama') || l.includes('teatro')) hours += 8
    else hours += 4
  }
  return hours
}

export { computeWeeklyHours }

function buildInitialState(): GameState {
  return {
    isStarted: false,
    isGameOver: false,
    deathType: null,
    gameOverYear: null,
    settings: { mode: 'normal', ironMan: false, soundEnabled: true, notificationsEnabled: true, language: 'it', autoSave: true, godModeUnlocked: false },
    time: { year: 2000, month: 1, age: 0 },
    identity: { name: 'Giocatore', surname: 'Demo', gender: 'male', nationality: 'italy', birthYear: 2000, familyBackground: 'middle', religion: 'catholicism', sexualOrientation: 'heterosexual', emoji: '🙂', avatar: getDefaultAvatar('male') },
    stats: { health: 80, mentalHealth: 80, happiness: 70, intelligence: 50, looks: 50, energy: 80, karma: 0, reputation: 50, socialReputation: 50 },
    finance: { money: 1000, bankBalance: 0, debt: 0, creditScore: 650, monthlyIncome: 0, monthlyExpenses: 0, investments: [], assets: [] },
    market: FinanceEngine.initialMarketState(),
    education: { currentLevel: 'none', completedLevels: [], gpa: 0, scholarships: [], clubs: [], dropOut: false, studentLoan: 0, university: null, major: null, graduationYear: null, classmates: [], schoolReputation: 'invisibile' },
    career: { currentJob: null, jobHistory: [], promotions: 0, firings: 0, burnoutLevel: 0, pensionContributions: 0, licenses: [], businessOwned: null, colleagues: [], workReputation: 'nuovo' },
    relationships: [],
    family: {
      familyId: 'family_demo',
      dynastyName: 'Demo',
      members: [],
      links: [],
      favoredChildId: null,
      familyReputation: 50,
      familyWealthTier: 'middle',
      inheritedFlags: [],
    },
    children: [],
    pets: [],
    criminal: { crimes: [], inPrison: false, prisonSentence: 0, prisonServed: 0, parole: false, paroleDuration: 0, electronicBracelet: false, hasRecord: false },
    health: {
      diseases: [], addictions: [], disabilities: [],
      fitnessLevel: 50, bmi: 22, lastMedicalCheck: 0,
      mentalDisorders: [], ptsd: false,
      traumas: [], therapySessions: 0, resilience: 20,
    },
    hobbies: [],
    socialMedia: [],
    fame: FameEngine.initialState(),
    chaos: ChaosEngine.initialState(),
    travelHistory: [],
    living: { type: 'parents', location: 'Italy', monthlyCost: 0, mortgageRemaining: 0, propertyValue: 0, roommates: [] },
    nation: (db.nations as Nation[]).find(n => n.id === 'italy') ?? null,
    vehicle: { hasLicenseB: false, theoryPassed: false, studyHours: 0, licensePoints: 20, violations: [], ownedVehicles: [] },
    religion: { practiceLevel: 50, lastPracticeYear: 0 },
    politics: { isRegisteredVoter: false, partyMembership: null, currentRole: null, mandatesWon: 0, electionsCampaigns: 0, scandals: 0, politicalInfluence: 0, lastVotedYear: -99, corruptionLevel: 0 },
    military: { isEnlisted: false, branch: null, rank: null, rankIndex: 0, yearsOfService: 0, missions: 0, decorations: [], ptsd: false, discharged: false, honorableDischarge: false, pensionEligible: false },
    bodyMods: { items: [] },
    beauty: {
      hairStyle: 'none', hairLastUpdatedYear: 0,
      nailsStyle: 'none', nailsLastUpdatedYear: 0,
      wardrobeTier: 'none', wardrobeLastUpdatedYear: 0,
      skincareLevel: 'none', makeupLevel: 'none',
      hasLaserHairRemoval: false, hasBotox: false, botoxSessions: 0,
      luxuryItems: [],
    },
    retirement: {
      isRetired: false, retirementAge: null, retirementType: null,
      monthlyPension: 0, seniorConditions: [],
      cognitiveStatus: 'sharp', livingArrangement: 'own_home',
      hasMadeWill: false, funeralPrePlanned: false,
      alzheimersYear: null, alzheimersStage: 'none', volunteeringActive: false,
    },
    gambling: {
      totalWon: 0, totalLost: 0, gamesPlayed: 0,
      addictionLevel: 0, lastPlayedYear: 0,
      casinoBlacklisted: false, biggestWin: 0, jackpotWon: false,
    },
    sexualHealth: {
      isPregnant: false, pregnancyTrimester: 0, pregnancyPartnerName: null,
      contraceptionMethod: 'none', activeSTIs: [],
      sexualPartnersCount: 0, virginityLost: false,
      lastSTDTestYear: 0, isInfertile: false, ivfAttempts: 0,
    },
    worldEvents: {
      triggeredEvents: [],
      activeWorldModifiers: [],
    },
    cosmeticSurgery: {
      surgeries: [],
      totalSurgeries: 0,
      totalLooksBonus: 0,
      hasActiveComplication: false,
    },
    challengeEngine: {
      activeChallenges: [],
      completedChallengeIds: [],
      failedChallengeIds: [],
      totalPoints: 0,
      streak: 0,
    },
    dailyQuests: DailyQuestEngine.initialState(),
    npcAgency: NPCAgencyEngine.initialState(),
    npcEventQueue: [],
    currentEvent: null,
    availableChoices: [],
    pendingEffects: null,
    actionUsages: [],
    goals: db.goals.map(g => ({ ...g, reward: g.reward as unknown as Effect, completed: false, completedYear: null })),
    completedGoals: [],
    ribbons: [],
    challenges: [],
    inventory: [],
    eventLog: [],
    legacy: null,
    minigameStats: {
      hackingWins: 0, hackingPlayed: 0,
      drivingWins: 0, drivingPlayed: 0,
      prisonBreakWins: 0, prisonBreakPlayed: 0,
      lastPlayed: {},
    },
    adRewards: AdRewardEngine.initialState(),
    diminishingReturns: {},
    skills: { athleticism: 0, music: 0, acting: 0, creativity: 0, charisma: 0, discipline: 0, leadership: 0, academicSkill: 0, socialSkill: 0 },
    lifeMemories: [],
  }
}

// ---- starting money by family background ----

const BACKGROUND_MONEY: Record<string, number> = {
  poor: 200,
  lower_middle: 500,
  middle: 1000,
  upper_middle: 3000,
  rich: 10000,
  elite: 50000,
}

// ---- store ----

export const useGameStore = create<FullStore>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      // ==================== newGame ====================
      newGame: (identity: PlayerIdentity, nationId: string, mode = 'normal' as import('./types').GameMode, ironMan = false) => {
        const initial = buildInitialState()
        const nation = (db.nations as Nation[]).find(n => n.id === nationId) ?? initial.nation
        const startMoney = BACKGROUND_MONEY[identity.familyBackground] ?? 1000
        const startingFamily = FamilyEngine.createStartingFamily(identity)
        const siblingCount = startingFamily.relationships.filter(rel => rel.type === 'sibling').length

        set({
          ...initial,
          isStarted: true,
          identity: { ...identity, emoji: '👶' },
          time: { year: identity.birthYear, month: 1, age: 0 },
          nation,
          settings: { ...initial.settings, mode, ironMan },
          finance: { ...initial.finance, money: startMoney },
          relationships: startingFamily.relationships,
          family: startingFamily.family,
          eventLog: [{
            id: uid(), year: identity.birthYear, age: 0,
            text: `${identity.name} ${identity.surname} è venuto/a al mondo in ${nation?.name ?? 'Italia'} con ${startingFamily.relationships.length - siblingCount} genitori e ${siblingCount} fratelli/sorelle già registrati nell'albero familiare.`,
            emoji: '👶', category: 'life', statChanges: {},
          }],
        })
      },

      // ==================== handleInvecchia ====================
      handleInvecchia: () => {
        const state = get()
        if (state.isGameOver) return

        const newAge = state.time.age + 1
        const newYear = state.time.year + 1
        const newTime = { ...state.time, age: newAge, year: newYear }

        // Accumulate all effects
        const combined: Effect = {}
        const messages: string[] = []

        const merge = (e: Effect) => {
          for (const [k, v] of Object.entries(e)) combined[k] = (combined[k] ?? 0) + v
        }

        // 1. Natural energy/health decay
        const ironManMultiplier = state.settings.ironMan ? 1.3 : 1.0
        const hardModeMultiplier = state.settings.mode === 'hard' ? 1.2 : 1.0
        const decayMult = ironManMultiplier * hardModeMultiplier
        // Energy: -2/year natural decay (was -5 — too aggressive).
        // Happiness penalty scales with poverty level and living situation.
        const happinessPenalty = state.finance.money < 200 ? -3
          : state.finance.money < 500 ? -2
          : state.living.type === 'homeless' ? -5
          : 0
        merge({
          energy: Math.round(-2 * decayMult),
          health: Math.round((newAge > 50 ? -(newAge - 50) * 0.3 : -1) * decayMult),
          happiness: happinessPenalty,
        })

        // 2. Monthly salary (12x in one year tick)
        if (state.career.currentJob) {
          const salaryMultiplier = state.settings.mode === 'hard' ? 0.7 : 1.0
          merge({ money: Math.round(state.career.currentJob.salary * 12 * salaryMultiplier) })
        }

        // 2b. Hobby passive income (monthly income from monetized hobbies)
        const hobbyIncome = state.hobbies.reduce((sum, h) => sum + (h.monthlyIncome ?? 0), 0)
        if (hobbyIncome > 0) merge({ money: hobbyIncome * 12 })

        // 2c. Living costs — rent or mortgage (monthly × 12 per year)
        if (state.living.monthlyCost > 0) {
          merge({ money: -(state.living.monthlyCost * 12) })
          // Warn player if rent is more than 40% of annual income
          const annualIncome = (state.career.currentJob?.salary ?? 0) * 12 + hobbyIncome * 12
          if (annualIncome > 0 && state.living.monthlyCost * 12 > annualIncome * 0.4) {
            merge({ mentalHealth: -2, happiness: -2 })
          }
        }

        // 2d. Basic living expenses (food, utilities, transport) — excluded if living with parents
        if (newAge >= 18 && state.living.type !== 'parents') {
          const baseExpenses = state.living.type === 'renting' ? 420 : state.living.type === 'owning' ? 380 : 500
          merge({ money: -(baseExpenses * 12) })
        }

        // 3. Nation effect
        if (state.nation) {
          merge({ health: state.nation.healthRecoveryBonus * 0.1 })
        }

        // 4. Career annual tick
        const { effects: careerFx, fired, fireMessage, burnoutDelta } = CareerEngine.annualTick(state)
        merge(careerFx)
        if (fired) messages.push(fireMessage)

        // 5. Health annual tick
        const { effects: healthFx, newDisease, messages: healthMsgs } = HealthEngine.annualTick(state)
        merge(healthFx)
        messages.push(...healthMsgs)

        // 6. Education annual tick
        const eduTick = EducationEngine.annualTick(state)
        merge(eduTick.effects)
        if (eduTick.message) messages.push(eduTick.message)

        // 7. Relationship decay
        const updatedRelationships = RelationshipEngine.annualDecay(state.relationships, state)

        // 7a. Autonomous NPC agency
        const npcAgencyTick = NPCAgencyEngine.annualTick(state, updatedRelationships)
        merge(npcAgencyTick.effects)
        messages.push(...npcAgencyTick.messages)
        const newNpcEvents = npcAgencyTick.agency.events.slice(0, 5) // max 5 queued per year

        // 7b. Trauma & grief annual burden
        const traumaTick = TraumaEngine.annualTick(state)
        merge(traumaTick.effects)
        messages.push(...traumaTick.messages)

        // 7c. Annual passive affection tick for colleagues/classmates
        const updatedColleagues = WorkSchoolEngine.annualColleagueTick(state.career.colleagues ?? [])
        const updatedClassmates = WorkSchoolEngine.annualClassmateTick(state.education.classmates ?? [])
        const autoSpawnedRelationship: import('./types').Relationship | null = null

        // 8. Hobby annual tick
        const { effects: hobbyFx, updates: hobbyUpdates } = HobbyEngine.annualTick(state)
        merge(hobbyFx)

        // 9. Criminal annual tick (prison sentence)
        const { effects: criminalFx, message: criminalMsg, updatedCriminal } =
          CriminalEngine.annualTick(state)
        merge(criminalFx)
        if (criminalMsg) messages.push(criminalMsg)

        // 10. Finance annual tick (investments + assets)
        const { effects: financeFx, updatedInvestments, updatedAssets, updatedMarket, marketMessages, assetMessages } = FinanceEngine.annualTick(state)
        merge(financeFx)
        messages.push(...marketMessages)
        messages.push(...assetMessages)

        // 11. Social media annual tick
        const { updatedProfiles, effects: socialFx } = SocialMediaEngine.annualTick(state)
        merge(socialFx)

        // 11b. Fame annual tick (fanbase, sponsors, public image decay)
        const fameTick = FameEngine.annualTick({
          ...state,
          socialMedia: updatedProfiles.length > 0 ? updatedProfiles : state.socialMedia,
        })
        merge(fameTick.effects)
        messages.push(...fameTick.messages)

        // 12. Pet annual tick
        const { updatedPets, effects: petFx, deathMessages } = PetEngine.annualTick(state)
        merge(petFx)
        messages.push(...deathMessages)

        // 13. Substance annual tick
        const { updatedAddictions, effects: substanceFx } = SubstanceEngine.annualTick(state)
        merge(substanceFx)

        // 15. Vehicle annual tick (insurance, maintenance, depreciation, violations)
        const { effects: vehicleFx, updatedVehicles, newViolations } = VehicleEngine.annualTick(state)
        merge(vehicleFx)

        // 16. Military annual tick (salary, PTSD, years of service)
        const { effects: militaryFx, updatedMilitary: militaryTickUpdate } = MilitaryEngine.annualTick(state)
        merge(militaryFx)

        // 17. Parenting annual tick (children age, developmental events)
        const { updatedChildren, events: parentingEvents } = ParentingEngine.annualTick(state)
        messages.push(...parentingEvents)

        // 18. Beauty annual tick (aging decay, outdated wardrobe)
        const { effects: beautyFx } = BeautyEngine.annualTick(state)
        merge(beautyFx)

        // 19. Retirement annual tick (pension, senior conditions, Alzheimer)
        const { effects: retirementFx, updatedRetirement: retirementTickUpdate, newConditions } = RetirementEngine.annualTick(state)
        merge(retirementFx)
        if (newConditions.length > 0) {
          messages.push(...newConditions.map(c => `${c.emoji} Nuova condizione: ${c.name}. Costo mensile: €${c.monthlyCost.toLocaleString()}.`))
        }

        // 20. Gambling annual tick (addiction toll)
        const { effects: gamblingFx, updatedGambling: gamblingTickUpdate } = GamblingEngine.annualTick(state)
        merge(gamblingFx)

        // 21. Sexual health annual tick (pregnancy progression, STI costs)
        const { effects: sexFx, updatedSexualHealth: sexTickUpdate } = SexualHealthEngine.annualTick(state)
        merge(sexFx)

        // 22. World events annual tick (historical events, home repairs)
        const worldResult = WorldEventsEngine.annualTick(state)
        merge(worldResult.effects)
        for (const ev of worldResult.triggeredHistorical) {
          messages.push(`${ev.emoji} ${ev.name}: ${ev.description}`)
        }
        for (const repair of worldResult.homeRepairs) {
          messages.push(`${repair.emoji} ${repair.name}: riparazione urgente!`)
        }

        // 22b. Extreme chaos engine (very rare, high-impact story events)
        const chaosTick = ChaosEngine.annualTick(state)
        merge(chaosTick.effects)
        messages.push(...chaosTick.messages)

        // 23b. Credit score annual update
        const creditResult = CreditScoreEngine.annualTick(state)
        const dailyQuestState = DailyQuestEngine.ensure(state.dailyQuests)

        // 23c. Polishing/balance pass
        const balanceTick = BalanceEngine.annualTick(state)
        merge(balanceTick.effects)
        messages.push(...balanceTick.messages)

        // 23. Achievement check (ribbon auto-unlock)
        const { newRibbons, messages: achievementMsgs } = AchievementsEngine.checkAndUnlock(state)
        messages.push(...achievementMsgs)

        // 24. Challenge progress check
        const challengeResult = ChallengeEngine.checkChallenges(state)
        merge(challengeResult.effects)
        for (const ch of challengeResult.newlyCompleted) {
          messages.push(`🏆 Challenge completata: ${ch.emoji} ${ch.name}! +${challengeResult.bonusPoints} punti`)
        }

        // 14. Random events (background micro-events without choices)
        const randomEvs = db.random_events as unknown as Array<{
          id: string; title: string; description: string; emoji: string; probability: number; effects: Effect
        }>
        for (const rev of randomEvs) {
          if (Math.random() < rev.probability) {
            merge(rev.effects)
          }
        }

        // 12. Pick main event (with choices)
        const allEvents = db.events as unknown as GameEvent[]
        const eligible = allEvents.filter(ev => {
          if (ev.minAge > newAge || ev.maxAge < newAge) return false
          if (ev.isHistorical && ev.year !== newYear) return false
          if (!ev.isHistorical && Math.random() > ev.probability) return false
          return evaluateTrigger(ev.triggerCondition, { ...state, time: newTime })
        })
        const picked = eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : null
        const choices = picked
          ? (db.choices as unknown as Choice[]).filter(c => c.eventId === picked.id)
          : []

        // Weekly hours overload stress
        const weeklyHours = computeWeeklyHours(state)
        if (weeklyHours > 60) {
          const over = weeklyHours - 60
          merge({ energy: -Math.round(over * 0.3), mentalHealth: -Math.round(over * 0.2), health: -1 })
        }

        // Cap ordinary stat swings per annual tick (non-financial)
        const ANNUAL_STAT_KEYS = ['health', 'happiness', 'intelligence', 'looks', 'energy', 'mentalHealth', 'karma', 'reputation', 'socialReputation'] as const
        for (const key of ANNUAL_STAT_KEYS) {
          if (combined[key] !== undefined) {
            combined[key] = Math.max(-3, Math.min(3, combined[key]))
          }
        }

        // Apply all effects
        const partial = applyEffects(state, combined)

        // Update career after firing
        let careerUpdate = state.career
        if (fired) {
          careerUpdate = {
            ...careerUpdate,
            jobHistory: careerUpdate.currentJob
              ? [...careerUpdate.jobHistory, careerUpdate.currentJob]
              : careerUpdate.jobHistory,
            currentJob: null,
            firings: careerUpdate.firings + 1,
            burnoutLevel: clamp(careerUpdate.burnoutLevel + burnoutDelta, 0, 100),
            colleagues: [],
          }
        } else {
          careerUpdate = {
            ...careerUpdate,
            burnoutLevel: clamp(careerUpdate.burnoutLevel + burnoutDelta, 0, 100),
            pensionContributions: state.career.currentJob
              ? careerUpdate.pensionContributions + state.career.currentJob.salary * 12 * 0.03
              : careerUpdate.pensionContributions,
            colleagues: updatedColleagues,
            workReputation: WorkSchoolEngine.computeWorkReputation(
              careerUpdate.workReputation,
              careerUpdate.promotions,
              clamp(careerUpdate.burnoutLevel + burnoutDelta, 0, 100),
              state.criminal.hasRecord,
            ),
          }
        }

        // Update health with new disease
        const healthUpdate = newDisease
          ? { ...state.health, diseases: [...state.health.diseases, newDisease] }
          : state.health

        // Update education
        let eduUpdate = state.education
        if (eduTick.graduated && state.education.currentLevel !== 'none') {
          eduUpdate = {
            ...eduUpdate,
            completedLevels: [...eduUpdate.completedLevels, eduUpdate.currentLevel],
            currentLevel: 'none',
            gpa: 0,
            graduationYear: newYear,
          }
        }
        if (eduTick.droppedOut) {
          eduUpdate = { ...eduUpdate, dropOut: true, currentLevel: 'none' }
        }
        const newGpa = clamp(eduUpdate.gpa + eduTick.gpaDelta, 0.0, 4.0)
        eduUpdate = {
          ...eduUpdate,
          gpa: parseFloat(newGpa.toFixed(2)),
          classmates: updatedClassmates,
          schoolReputation: WorkSchoolEngine.computeSchoolReputation(newGpa, eduUpdate.clubs, state.stats.happiness),
        }

        // Auto-enrollment in mandatory schooling (Italy: elementary 6, middle 11, highschool 14)
        // School quality depends on family wealth tier
        const wealthTier = state.family?.familyWealthTier ?? 'middle'
        const isPrivateSchool = ['wealthy', 'ultra_wealthy', 'upper_middle'].includes(wealthTier)
          || (['middle'].includes(wealthTier) && Math.random() < 0.35)
        if (!eduUpdate.dropOut && eduUpdate.currentLevel === 'none') {
          const mandatory = [
            { level: 'elementary' as const, minAge: 6,  maxAge: 10, prereq: null as string | null,   label: 'Scuola Elementare' },
            { level: 'middle'     as const, minAge: 11, maxAge: 13, prereq: 'elementary',             label: 'Scuola Media' },
            { level: 'highschool' as const, minAge: 14, maxAge: 18, prereq: 'middle',                 label: 'Liceo' },
          ]
          for (const s of mandatory) {
            if (newAge >= s.minAge && newAge <= s.maxAge &&
                !eduUpdate.completedLevels.includes(s.level) &&
                (s.prereq === null || eduUpdate.completedLevels.includes(s.prereq as import('./types').EducationLevel))) {
              const autoClassmates = WorkSchoolEngine.generateClassmates(s.level, newAge)
              eduUpdate = {
                ...eduUpdate,
                currentLevel: s.level,
                gpa: 3.0,
                classmates: autoClassmates,
                schoolReputation: 'invisibile',
              }
              const schoolType = isPrivateSchool ? 'privata' : 'pubblica'
              messages.push(`📚 Inizio anno scolastico: ${s.label} (${schoolType}).`)
              // Private school gives a small extra intelligence bonus
              if (isPrivateSchool) merge({ intelligence: 1 })
              break
            }
          }
        }

        // Build life memories for major milestones this year
        const yearMemories: import('./types').LifeMemory[] = []
        const ageMilestones: Record<number, string> = {
          18: 'Sei diventato/a maggiorenne. Il mondo si apre davanti a te.',
          30: 'Trenta anni. La vita adulta è pienamente iniziata.',
          40: 'Quaranta anni. Un bilancio della prima metà della vita.',
          50: 'Cinquanta anni. Metà secolo vissuto.',
          65: 'Sessantacinque anni. Hai raggiunto l\'età pensionabile.',
          80: 'Ottanta anni. Una lunga vita ricca di esperienze.',
        }
        if (ageMilestones[newAge]) {
          yearMemories.push(makeMemory({ year: newYear, age: newAge }, `${newAge} anni`, ageMilestones[newAge], '🎂', 'life', [], true))
        }
        if (eduTick.graduated && state.education.currentLevel !== 'none') {
          const lvlLabel = getEducationLabel(state.education.currentLevel)
          yearMemories.push(makeMemory({ year: newYear, age: newAge }, `Diploma: ${lvlLabel}`, `Hai completato ${lvlLabel} con GPA ${state.education.gpa.toFixed(2)}/4.00.`, '🎓', 'school', [], true))
        }

        // Build log entry
        const eventText = picked ? `${picked.emoji} ${picked.title}` : `Hai compiuto ${newAge} anni.`
        const allMessages = messages.filter(Boolean)
        const fullText = [eventText, ...allMessages].join(' · ')

        const logEntry: LogEntry = {
          id: uid(), year: newYear, age: newAge,
          text: fullText, emoji: picked?.emoji ?? '📅',
          category: 'year', statChanges: combined,
        }

        const newStats = (partial.stats ?? state.stats)
        const newIdentity = { ...state.identity, emoji: getPlayerEmoji({ ...state, stats: newStats, time: newTime }) }

        // Update hobbies skill
        const updatedHobbies = state.hobbies.map(h => {
          const upd = hobbyUpdates.find(u => u.id === h.id)
          if (!upd) return h
          return {
            ...h,
            skillLevel: clamp(h.skillLevel + upd.skillDelta, 0, 100),
            monthlyIncome: upd.income,
          }
        })

        const baseFinance = partial.finance ?? state.finance
        const financeWithInvestments = {
          ...baseFinance,
          investments: updatedInvestments.length > 0 ? updatedInvestments : baseFinance.investments,
          assets: updatedAssets.length > 0 ? updatedAssets : baseFinance.assets,
        }
        const currentFame = FameEngine.ensure(fameTick.fame)
        const fameWithChaos = FameEngine.ensure({
          ...currentFame,
          fame: currentFame.fame + chaosTick.fameDelta.fame,
          fanbase: currentFame.fanbase + chaosTick.fameDelta.fanbase,
          publicImage: currentFame.publicImage + chaosTick.fameDelta.publicImage,
          scandals: currentFame.scandals + chaosTick.fameDelta.scandals,
          verified: currentFame.verified || chaosTick.fameDelta.fame >= 10,
        })
        const traumaWithChaos = chaosTick.trauma
          ? [...traumaTick.updatedTraumas, chaosTick.trauma].slice(-50)
          : traumaTick.updatedTraumas

        set({
          time: newTime,
          stats: newStats,
          identity: newIdentity,
          career: careerUpdate,
          health: {
            ...healthUpdate,
            addictions: updatedAddictions,
            traumas: traumaWithChaos,
            ptsd: traumaTick.ptsd || healthUpdate.ptsd,
          },
          education: eduUpdate,
          relationships: autoSpawnedRelationship
            ? [...npcAgencyTick.relationships, autoSpawnedRelationship]
            : npcAgencyTick.relationships,
          npcAgency: npcAgencyTick.agency,
          npcEventQueue: [...(state.npcEventQueue ?? []), ...newNpcEvents].slice(-10),
          criminal: updatedCriminal,
          hobbies: updatedHobbies,
          socialMedia: updatedProfiles.length > 0 ? updatedProfiles : state.socialMedia,
          fame: fameWithChaos,
          chaos: chaosTick.chaos,
          pets: updatedPets,
          vehicle: {
            ...state.vehicle,
            ownedVehicles: updatedVehicles.length > 0 ? updatedVehicles : state.vehicle.ownedVehicles,
            violations: newViolations.length > 0 ? [...state.vehicle.violations, ...newViolations] : state.vehicle.violations,
          },
          military: militaryTickUpdate && Object.keys(militaryTickUpdate).length > 0
            ? { ...state.military, ...militaryTickUpdate }
            : state.military,
          children: updatedChildren.length > 0 ? updatedChildren : state.children,
          retirement: {
            ...state.retirement,
            ...retirementTickUpdate,
            seniorConditions: newConditions.length > 0
              ? [...state.retirement.seniorConditions, ...newConditions]
              : state.retirement.seniorConditions,
          },
          currentEvent: picked,
          availableChoices: choices,
          eventLog: [logEntry, ...state.eventLog].slice(0, 150),
          diminishingReturns: {}, // reset annual counters
          gambling: Object.keys(gamblingTickUpdate).length > 0 ? { ...state.gambling, ...gamblingTickUpdate } : state.gambling,
          sexualHealth: Object.keys(sexTickUpdate).length > 0 ? { ...state.sexualHealth, ...sexTickUpdate } : state.sexualHealth,
          worldEvents: {
            triggeredEvents: worldResult.updatedWorld.triggeredEvents ?? state.worldEvents.triggeredEvents,
            activeWorldModifiers: worldResult.updatedWorld.activeWorldModifiers ?? state.worldEvents.activeWorldModifiers,
          },
          finance: {
            ...(partial.finance ?? state.finance),
            ...financeWithInvestments,
            creditScore: creditResult.updatedScore,
          },
          living: state.living.mortgageRemaining > 0 ? {
            ...state.living,
            // Reduce outstanding principal by estimated annual principal portion (~35% of payment)
            mortgageRemaining: Math.max(0, state.living.mortgageRemaining - state.living.monthlyCost * 12 * 0.35),
          } : state.living,
          market: updatedMarket,
          challengeEngine: { ...state.challengeEngine, ...challengeResult.updatedState },
          dailyQuests: dailyQuestState,
          ribbons: newRibbons.length > 0
            ? [
                ...state.ribbons,
                ...newRibbons.map(def => AchievementsEngine.buildRibbonRecord(def, newYear)),
              ]
            : state.ribbons,
          lifeMemories: yearMemories.length > 0 ? [...state.lifeMemories, ...yearMemories].slice(-200) : state.lifeMemories,
        })

        get().checkGoals()
        get().checkMorte()
      },

      // ==================== handleChoice ====================
      handleChoice: (choiceId: string) => {
        const state = get()
        const choice = state.availableChoices.find(c => c.id === choiceId)
        if (!choice) return

        // Validate requirements
        const requirementsMet = choice.requirements.every(req => {
          const val =
            (state.stats as unknown as Record<string, unknown>)[req.stat] ??
            (state.finance as unknown as Record<string, unknown>)[req.stat] ??
            (state.time as unknown as Record<string, unknown>)[req.stat]
          switch (req.operator) {
            case '>':  return (val as number) >  (req.value as number)
            case '<':  return (val as number) <  (req.value as number)
            case '>=': return (val as number) >= (req.value as number)
            case '<=': return (val as number) <= (req.value as number)
            case '==': return val === req.value
            case '!=': return val !== req.value
            default:   return true
          }
        })
        if (!requirementsMet) return

        const partial = applyEffects(state, choice.effects)
        const logEntry: LogEntry = {
          id: uid(), year: state.time.year, age: state.time.age,
          text: `Scelta: ${choice.text}`,
          emoji: '✅', category: 'choice', statChanges: choice.effects,
        }

        set(s => ({
          ...partial,
          currentEvent: null,
          availableChoices: [],
          eventLog: [logEntry, ...s.eventLog].slice(0, 150),
        }))

        get().checkGoals()
        get().checkMorte()
      },

      // ==================== aggiornaStats ====================
      aggiornaStats: (effects: Effect) => {
        set(state => applyEffects(state, effects))
      },

      // ==================== salvaGioco ====================
      salvaGioco: () => {
        const s = get()
        localStorage.setItem('lifesim2d_backup', JSON.stringify({ identity: s.identity, time: s.time, stats: s.stats }))
      },
      caricaGioco: () => {},
      resetGiorno: () => {
        set(s => ({ stats: { ...s.stats, energy: clamp(s.stats.energy + 20, 0, 100) } }))
      },

      // ==================== Career actions ====================
      applyForJob: (jobId: string): ActionResult => {
        const state = get()
        const result = CareerEngine.applyForJob(jobId, state)
        const partial = applyEffects(state, result.effects)

        if (result.success && result.newJob) {
          const oldJob = state.career.currentJob
          const newJobDef = getAllJobs().find(j => j.id === jobId)
          const newColleagues = WorkSchoolEngine.generateColleagues(jobId, newJobDef?.category ?? 'default')
          const jobMemory = makeMemory(state.time, `Nuovo lavoro: ${result.newJob.title}`, `Hai iniziato a lavorare come ${result.newJob.title} in ${result.newJob.company}.`, '💼', 'work', [], true)
          set(s => ({
            ...partial,
            career: {
              ...s.career,
              currentJob: result.newJob!,
              jobHistory: oldJob ? [...s.career.jobHistory, oldJob] : s.career.jobHistory,
              colleagues: newColleagues,
              workReputation: 'nuovo',
            },
            lifeMemories: [...s.lifeMemories, jobMemory].slice(-200),
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💼', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }))
        } else {
          set(s => ({
            ...partial,
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '💼' : '❌', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }))
        }
        get().checkGoals()
        return { success: result.success, message: result.message, effects: result.effects }
      },

      quitJob: (): ActionResult => {
        const state = get()
        const result = CareerEngine.quitJob(state)
        if (result.success) {
          const partial = applyEffects(state, result.effects)
          set(s => ({
            ...partial,
            career: {
              ...s.career,
              jobHistory: s.career.currentJob ? [...s.career.jobHistory, s.career.currentJob] : s.career.jobHistory,
              currentJob: null,
              colleagues: [],
            },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🚪', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }))
        }
        return { success: result.success, message: result.message, effects: result.effects }
      },

      attemptPromotion: (): ActionResult => {
        const state = get()
        const result = CareerEngine.attemptPromotion(state)
        const partial = applyEffects(state, result.effects)
        const key = `promo_${state.time.year}`

        if (result.success && result.salaryIncrease && state.career.currentJob) {
          const promoMemory = makeMemory(state.time, 'Promozione!', `Sei stato/a promosso/a in ${state.career.currentJob.company}. Nuovo stipendio: €${(state.career.currentJob.salary + result.salaryIncrease).toLocaleString()}/mese.`, '📈', 'work', [], true)
          set(s => ({
            ...partial,
            career: {
              ...s.career,
              currentJob: { ...s.career.currentJob!, salary: s.career.currentJob!.salary + result.salaryIncrease! },
              promotions: s.career.promotions + 1,
            },
            lifeMemories: [...s.lifeMemories, promoMemory].slice(-200),
            diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📈', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }))
        } else {
          set(s => ({
            ...partial,
            diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '❌', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }))
        }
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Work ecosystem actions ====================
      workInteract: (colleagueId: string, action: WorkAction): ActionResult => {
        const state = get()
        const colleague = state.career.colleagues.find(c => c.id === colleagueId)
        if (!colleague) return { success: false, message: 'Collega non trovato.', effects: {} }

        const skillBonus = (state.skills.charisma + state.skills.leadership) / 2
        const result = WorkSchoolEngine.workInteract(colleague, action, state.stats.looks, state.time.year, state.career.workReputation, skillBonus)
        const partial = applyEffects(state, result.effects)

        // Apply skill deltas
        const sd = result.skillDeltas ?? {}
        const newSkills: PlayerSkills = {
          ...state.skills,
          socialSkill:  Math.min(100, state.skills.socialSkill  + (sd.socialSkill  ?? 0)),
          charisma:     Math.min(100, state.skills.charisma     + (sd.charisma     ?? 0)),
          leadership:   Math.min(100, state.skills.leadership   + (sd.leadership   ?? 0)),
        }

        const updatedColleagues = state.career.colleagues.map(c =>
          c.id === colleagueId ? result.updatedColleague : c
        )

        const newWorkRep = WorkSchoolEngine.computeWorkReputation(
          state.career.workReputation,
          state.career.promotions,
          state.career.burnoutLevel,
          state.criminal.hasRecord,
        )

        set(s => ({
          ...partial,
          skills: newSkills,
          career: {
            ...s.career,
            colleagues: updatedColleagues,
            workReputation: newWorkRep,
          },
          relationships: result.promotedRel
            ? [...s.relationships, result.promotedRel]
            : s.relationships,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💼', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== School ecosystem actions ====================
      schoolInteract: (npcId: string, action: SchoolAction): ActionResult => {
        const state = get()
        const npc = state.education.classmates.find(c => c.id === npcId)
        if (!npc) return { success: false, message: 'Persona non trovata.', effects: {} }

        const skillBonus = (state.skills.academicSkill + state.skills.socialSkill) / 2
        const result = WorkSchoolEngine.schoolInteract(npc, action, state.stats.intelligence, state.time.year, state.education.schoolReputation, skillBonus)
        const partial = applyEffects(state, result.effects)

        const sd = result.skillDeltas ?? {}
        const newSkills: PlayerSkills = {
          ...state.skills,
          socialSkill:   Math.min(100, state.skills.socialSkill   + (sd.socialSkill   ?? 0)),
          academicSkill: Math.min(100, state.skills.academicSkill + (sd.academicSkill ?? 0)),
          discipline:    Math.min(100, state.skills.discipline    + (sd.discipline    ?? 0)),
          charisma:      Math.min(100, state.skills.charisma      + (sd.charisma      ?? 0)),
        }

        const updatedClassmates = state.education.classmates.map(c =>
          c.id === npcId ? result.updatedNPC : c
        )

        const newSchoolRep = WorkSchoolEngine.computeSchoolReputation(
          state.education.gpa,
          state.education.clubs,
          state.stats.happiness,
        )

        set(s => ({
          ...partial,
          skills: newSkills,
          education: {
            ...s.education,
            classmates: updatedClassmates,
            schoolReputation: newSchoolRep,
          },
          relationships: result.promotedRel
            ? [...s.relationships, result.promotedRel]
            : s.relationships,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📚', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Club actions ====================
      joinClub: (clubId: string): ActionResult => {
        const state = get()
        if (state.education.currentLevel === 'none') return { success: false, message: 'Devi essere iscritto/a a una scuola per entrare in un club.', effects: {} }
        if (state.education.clubs.includes(clubId)) return { success: false, message: 'Sei già membro di questo club.', effects: {} }

        const CLUB_EFFECTS: Record<string, { skills: Partial<PlayerSkills>; statEffects: Record<string, number>; emoji: string; label: string }> = {
          sport:    { skills: { athleticism: 2, discipline: 1 }, statEffects: { health: 2, happiness: 1 }, emoji: '⚽', label: 'Club Sportivo' },
          music:    { skills: { music: 2, creativity: 1 },       statEffects: { happiness: 2 },            emoji: '🎸', label: 'Club Musicale' },
          academic: { skills: { academicSkill: 2, discipline: 1 }, statEffects: { intelligence: 2 },       emoji: '📚', label: 'Club Accademico' },
          art:      { skills: { creativity: 2, charisma: 1 },    statEffects: { happiness: 1 },            emoji: '🎨', label: 'Club Arte' },
          debate:   { skills: { charisma: 2, leadership: 1 },    statEffects: { intelligence: 1 },         emoji: '🗣️', label: 'Club Dibattito' },
        }

        const cfg = CLUB_EFFECTS[clubId]
        if (!cfg) return { success: false, message: 'Club non trovato.', effects: {} }

        const newSkills: PlayerSkills = { ...state.skills }
        for (const [k, v] of Object.entries(cfg.skills)) {
          (newSkills as unknown as Record<string, number>)[k] = Math.min(100, ((newSkills as unknown as Record<string, number>)[k] ?? 0) + v)
        }

        const partial = applyEffects(state, cfg.statEffects)
        set(s => ({
          ...partial,
          skills: newSkills,
          education: { ...s.education, clubs: [...s.education.clubs, clubId] },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: `Ti sei iscritto/a al ${cfg.label}!`, emoji: cfg.emoji, category: 'education', statChanges: cfg.statEffects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: `Ti sei iscritto/a al ${cfg.label}!`, effects: cfg.statEffects }
      },

      // ==================== Social activities (outside work/school) ====================
      socializeOutside: (location: SocialLocation): ActionResult => {
        const state = get()
        const result = WorkSchoolEngine.socializeOutside(
          location,
          state.time.age,
          state.stats.looks,
          state.stats.happiness,
          state.time.year,
          state.skills,
        )
        const partial = applyEffects(state, result.effects)

        const sd = result.skillDeltas ?? {}
        const newSkills: PlayerSkills = {
          ...state.skills,
          socialSkill:  Math.min(100, state.skills.socialSkill  + (sd.socialSkill  ?? 0)),
          athleticism:  Math.min(100, state.skills.athleticism  + (sd.athleticism  ?? 0)),
          charisma:     Math.min(100, state.skills.charisma     + (sd.charisma     ?? 0)),
          creativity:   Math.min(100, state.skills.creativity   + (sd.creativity   ?? 0)),
          music:        Math.min(100, state.skills.music        + (sd.music        ?? 0)),
        }

        set(s => ({
          ...partial,
          skills: newSkills,
          relationships: result.newRelationship
            ? [...s.relationships, result.newRelationship]
            : s.relationships,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🎉', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Relationship actions ====================
      meetNewPerson: (context: NPCContext): ActionResult => {
        const state = get()
        const result = RelationshipEngine.meetNewPerson(context, state)
        const key = `meet_${state.time.year}`
        const partial = applyEffects(state, result.effects)

        if (result.success && result.newRelationship) {
          set(s => ({
            ...partial,
            relationships: [...s.relationships, result.newRelationship!],
            diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '👋', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }))
        }
        return { success: result.success, message: result.message, effects: result.effects }
      },

      interactWithNPC: (npcId: string, action: NPCAction): ActionResult => {
        const state = get()
        const rel = state.relationships.find(r => r.id === npcId)
        if (!rel) return { success: false, message: 'Persona non trovata.', effects: {} }

        const result = RelationshipEngine.interact(rel, action, state)
        const traumaResult = TraumaEngine.fromRelationshipAction(action, rel, state)
        const combinedEffects: Effect = { ...result.effects }
        if (result.success || action === 'cheat') {
          for (const [k, v] of Object.entries(traumaResult.effects)) {
            combinedEffects[k] = (combinedEffects[k] ?? 0) + v
          }
        }

        // Career cross-effects: colleague/rival interactions ripple into work
        let careerBurnoutDelta = 0
        let careerCrossMsg = ''
        const isWorkNPC = rel.type === 'colleague' || rel.type === 'rival'
        if (isWorkNPC && state.career.currentJob) {
          if (action === 'fight') {
            careerBurnoutDelta = 10
            combinedEffects.reputation = (combinedEffects.reputation ?? 0) - 5
            careerCrossMsg = ' Tensione in ufficio — stress lavorativo aumentato.'
          } else if (action === 'cheat' && result.success) {
            if (Math.random() < 0.40) {
              careerBurnoutDelta = 15
              combinedEffects.reputation = (combinedEffects.reputation ?? 0) - 15
              careerCrossMsg = ' Scandalo in ufficio — reputazione professionale danneggiata!'
            }
          } else if (action === 'insult') {
            careerBurnoutDelta = 6
            combinedEffects.reputation = (combinedEffects.reputation ?? 0) - 8
          } else if (['hang_out', 'gift', 'compliment'].includes(action) && result.success) {
            careerBurnoutDelta = -3
          } else if (result.stageAdvanced) {
            careerBurnoutDelta = -5
            careerCrossMsg = ' Buon clima in ufficio — stress ridotto.'
          }
        }

        const partial = applyEffects(state, combinedEffects)
        const key = `interact_${npcId}_${state.time.year}`
        const currentTraumas = state.health.traumas ?? []
        const nextTraumas = (result.success || action === 'cheat') && traumaResult.trauma
          ? [...currentTraumas, traumaResult.trauma].slice(-50)
          : currentTraumas
        const baseMsg = traumaResult.message && (result.success || action === 'cheat')
          ? `${result.message} ${traumaResult.message}`
          : result.message
        const resultMessage = careerCrossMsg ? `${baseMsg}${careerCrossMsg}` : baseMsg

        const updatedRel: Relationship = {
          ...rel,
          ...(result.updatedRel ?? {}),
          memoryLog: result.memoryEntry
            ? [...rel.memoryLog, { ...result.memoryEntry, id: uid(), year: state.time.year }].slice(-200)
            : rel.memoryLog,
        }

        const careerUpdate = careerBurnoutDelta !== 0
          ? (s: GameState) => ({ career: { ...s.career, burnoutLevel: clamp(s.career.burnoutLevel + careerBurnoutDelta, 0, 100) } })
          : null

        if (result.relationshipEnded) {
          set(s => ({
            ...partial,
            ...(careerUpdate ? careerUpdate(s) : {}),
            health: { ...(partial.health ?? s.health), traumas: nextTraumas },
            relationships: s.relationships.map(r => r.id === npcId ? updatedRel : r),
            diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: resultMessage, emoji: '💔', category: 'social', statChanges: combinedEffects }, ...s.eventLog].slice(0, 150),
          }))
        } else {
          set(s => ({
            ...partial,
            ...(careerUpdate ? careerUpdate(s) : {}),
            health: { ...(partial.health ?? s.health), traumas: nextTraumas },
            relationships: s.relationships.map(r => r.id === npcId ? updatedRel : r),
            diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: resultMessage, emoji: traumaResult.trauma ? '🧠' : result.stageAdvanced ? '⭐' : '💬', category: 'social', statChanges: combinedEffects }, ...s.eventLog].slice(0, 150),
          }))
        }
        get().checkGoals()
        return { success: result.success, message: resultMessage, effects: combinedEffects }
      },

      // ==================== Education actions ====================
      startEducation: (level: EducationLevel): ActionResult => {
        const state = get()
        const result = EducationEngine.startEducation(level, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }

        const newClassmates = WorkSchoolEngine.generateClassmates(result.newLevel ?? level, state.time.age)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          education: {
            ...s.education,
            currentLevel: result.newLevel ?? s.education.currentLevel,
            gpa: 3.0,
            classmates: newClassmates,
            schoolReputation: 'invisibile',
          },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📚', category: 'education', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      studyAction: (): ActionResult => {
        const state = get()
        const key = `study_${state.time.year}`
        const attempts = state.diminishingReturns[key] ?? 0
        if (attempts >= 3) {
          return { success: false, message: 'Hai già studiato molto quest\'anno. Riprova l\'anno prossimo!', effects: {} }
        }
        const result = EducationEngine.study(state)
        const partial = applyEffects(state, result.effects)

        set(s => ({
          ...partial,
          education: { ...s.education, gpa: clamp(s.education.gpa + 0.1, 0, 4.0) },
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '📖' : '😴', category: 'education', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Health actions ====================
      medicalCheck: (): ActionResult => {
        const state = get()
        const result = HealthEngine.medicalCheck(state)
        const partial = applyEffects(state, result.effects)

        const healthUpdate = result.newDisease
          ? { ...state.health, diseases: [...state.health.diseases, result.newDisease], lastMedicalCheck: state.time.year }
          : { ...state.health, lastMedicalCheck: state.time.year }

        set(s => ({
          ...partial,
          health: healthUpdate,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏥', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      treatDisease: (diseaseId: string): ActionResult => {
        const state = get()
        const result = HealthEngine.treatDisease(diseaseId, state)
        const partial = applyEffects(state, result.effects)

        if (result.success) {
          const updatedDiseases = result.diseaseCured
            ? state.health.diseases.filter(d => d.id !== result.diseaseCured)
            : state.health.diseases.map(d => d.id === diseaseId ? { ...d, isTreated: true } : d)

          set(s => ({
            ...partial,
            health: { ...s.health, diseases: updatedDiseases },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💊', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }))
        }
        return { success: result.success, message: result.message, effects: result.effects }
      },

      exercise: (): ActionResult => {
        const state = get()
        const key = `exercise_${state.time.year}`
        const attempts = state.diminishingReturns[key] ?? 0
        if (attempts >= 3) {
          return { success: false, message: 'Hai già fatto abbastanza esercizio quest\'anno. Riprova l\'anno prossimo!', effects: {} }
        }
        const result = HealthEngine.exercise(state)
        const partial = applyEffects(state, result.effects)
        const fitnessGain = result.success ? 8 : 0

        set(s => ({
          ...partial,
          health: { ...s.health, fitnessLevel: clamp(s.health.fitnessLevel + fitnessGain, 0, 100) },
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '🏋️' : '😴', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      attendTherapy: (): ActionResult => {
        const state = get()
        const result = TraumaEngine.attendTherapy(state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          health: {
            ...(partial.health ?? s.health),
            traumas: result.updatedTraumas ?? (s.health.traumas ?? []),
            therapySessions: (s.health.therapySessions ?? 0) + 1,
            resilience: clamp((s.health.resilience ?? 20) + (result.resilienceGain ?? 0), 0, 100),
            ptsd: (result.updatedTraumas ?? (s.health.traumas ?? [])).some(t => !t.resolved && t.severity >= 5 && t.intensity >= 70),
          },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🧠', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Hobby actions ====================
      addHobby: (hobbyId: string): ActionResult => {
        const state = get()
        const result = HobbyEngine.addHobby(hobbyId, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          hobbies: result.newHobby ? [...s.hobbies, result.newHobby] : s.hobbies,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🎯', category: 'hobby', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      practiceHobby: (hobbyId: string): ActionResult => {
        const state = get()
        const result = HobbyEngine.practiceHobby(hobbyId, state)
        const partial = applyEffects(state, result.effects)
        const key = `hobby_${hobbyId}_${state.time.year}`
        const gain = result.skillGain ?? 0
        set(s => ({
          ...partial,
          hobbies: s.hobbies.map(h => h.id === hobbyId ? { ...h, skillLevel: clamp(h.skillLevel + gain, 0, 100) } : h),
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '🎯' : '😴', category: 'hobby', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Criminal actions ====================
      commitCrime: (crimeId: string): ActionResult => {
        const state = get()
        const result = CriminalEngine.commitCrime(crimeId, state)
        const partial = applyEffects(state, result.effects)

        set(s => ({
          ...partial,
          criminal: result.arrested ? {
            ...s.criminal,
            inPrison: true,
            prisonSentence: result.crimeRecord?.sentence ?? 0,
            prisonServed: 0,
            hasRecord: true,
            crimes: result.crimeRecord ? [...s.criminal.crimes, result.crimeRecord] : s.criminal.crimes,
          } : {
            ...s.criminal,
            crimes: result.crimeRecord ? [...s.criminal.crimes, result.crimeRecord] : s.criminal.crimes,
          },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.arrested ? '🚔' : result.success ? '😈' : '❌', category: 'criminal', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        get().checkGoals()
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Finance actions ====================
      investMoney: (defId: string, amount: number): ActionResult => {
        const state = get()
        const result = FinanceEngine.invest(defId, amount, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          finance: { ...((partial.finance ?? s.finance)), investments: result.newInvestment ? [...(partial.finance ?? s.finance).investments, result.newInvestment] : (partial.finance ?? s.finance).investments },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📈', category: 'finance', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      sellInvestment: (investmentId: string): ActionResult => {
        const state = get()
        const result = FinanceEngine.sellInvestment(investmentId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          finance: { ...(partial.finance ?? s.finance), investments: s.finance.investments.filter(i => i.id !== investmentId) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💰', category: 'finance', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      buyAsset: (assetType: string): ActionResult => {
        const state = get()
        const result = FinanceEngine.buyAsset(assetType as AssetType, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          finance: { ...(partial.finance ?? s.finance), assets: result.newAsset ? [...s.finance.assets, result.newAsset] : s.finance.assets },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏠', category: 'finance', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      insureAsset: (assetId: string): ActionResult => {
        const state = get()
        const result = FinanceEngine.insureAsset(assetId, state)
        if (!result.success || !result.updatedAsset) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          finance: {
            ...(partial.finance ?? s.finance),
            assets: s.finance.assets.map(asset => asset.id === assetId ? result.updatedAsset! : asset),
          },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🛡️', category: 'finance', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      maintainAsset: (assetId: string): ActionResult => {
        const state = get()
        const result = FinanceEngine.maintainAsset(assetId, state)
        if (!result.success || !result.updatedAsset) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          finance: {
            ...(partial.finance ?? s.finance),
            assets: s.finance.assets.map(asset => asset.id === assetId ? result.updatedAsset! : asset),
          },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🛠️', category: 'finance', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      takeLoan: (amount: number): ActionResult => {
        const state = get()
        const result = FinanceEngine.takeLoan(amount, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          finance: { ...(partial.finance ?? s.finance), debt: s.finance.debt + amount },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏦', category: 'finance', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Social Media actions ====================
      createSocialProfile: (platform: string): ActionResult => {
        const state = get()
        const result = SocialMediaEngine.createProfile(platform as SocialPlatform, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          socialMedia: result.newProfile ? [...s.socialMedia, result.newProfile] : s.socialMedia,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📱', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      postContent: (platform: string, postType: string): ActionResult => {
        const state = get()
        const result = SocialMediaEngine.post(platform as SocialPlatform, postType as PostType, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const fameResult = FameEngine.fromSocialPost({
          state,
          followerGain: result.followerGain ?? 0,
          viralEvent: result.viralEvent,
          scandal: result.scandal,
        })
        const combinedEffects: Effect = { ...result.effects }
        for (const [key, value] of Object.entries(fameResult.effects)) {
          combinedEffects[key] = (combinedEffects[key] ?? 0) + value
        }
        const partial = applyEffects(state, combinedEffects)
        const resultMessage = fameResult.message ? `${result.message} ${fameResult.message}` : result.message
        set(s => ({
          ...partial,
          socialMedia: result.updatedProfile
            ? s.socialMedia.map(p => p.platform === platform ? { ...p, ...result.updatedProfile } : p)
            : s.socialMedia,
          fame: fameResult.fame,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: resultMessage, emoji: result.scandal ? '📰' : result.viralEvent ? '🚀' : '📤', category: 'social', statChanges: combinedEffects }, ...s.eventLog].slice(0, 150),
        }))
        get().checkGoals()
        return { success: true, message: resultMessage, effects: combinedEffects }
      },

      // ==================== Substance actions ====================
      drinkAlcohol: (type: string): ActionResult => {
        const state = get()
        const result = SubstanceEngine.drink(type as AlcoholType, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        set(s => {
          let addictions = [...s.health.addictions]
          if (result.updatedAddiction) {
            const idx = addictions.findIndex(a => a.substance === result.updatedAddiction!.substance)
            if (idx >= 0) {
              addictions[idx] = { ...addictions[idx], level: clamp(addictions[idx].level + result.updatedAddiction.levelDelta, 0, 100) }
            } else if (result.updatedAddiction.levelDelta > 0) {
              const newAdd: Addiction = { substance: result.updatedAddiction.substance, level: result.updatedAddiction.levelDelta, yearStarted: s.time.year, inRehab: false }
              addictions = [...addictions, newAdd]
            }
          }
          return {
            ...partial,
            health: { ...s.health, addictions },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🍺', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }
        })
        return { success: true, message: result.message, effects: result.effects }
      },

      smokeCigarette: (type: string): ActionResult => {
        const state = get()
        const result = SubstanceEngine.smoke(type as SmokeType, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        set(s => {
          let addictions = [...s.health.addictions]
          if (result.updatedAddiction) {
            const idx = addictions.findIndex(a => a.substance === result.updatedAddiction!.substance)
            if (idx >= 0) {
              addictions[idx] = { ...addictions[idx], level: clamp(addictions[idx].level + result.updatedAddiction.levelDelta, 0, 100) }
            } else {
              const newAdd: Addiction = { substance: result.updatedAddiction.substance, level: result.updatedAddiction.levelDelta, yearStarted: s.time.year, inRehab: false }
              addictions = [...addictions, newAdd]
            }
          }
          return {
            ...partial,
            health: { ...s.health, addictions },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🚬', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }
        })
        return { success: true, message: result.message, effects: result.effects }
      },

      quitSubstance: (substance: string): ActionResult => {
        const state = get()
        const result = SubstanceEngine.quitSubstance(substance, state)
        const partial = applyEffects(state, result.effects)
        set(s => {
          let addictions = [...s.health.addictions]
          if (result.updatedAddiction) {
            addictions = addictions.map(a => a.substance === substance
              ? { ...a, level: clamp(a.level + result.updatedAddiction!.levelDelta, 0, 100) }
              : a
            ).filter(a => a.level > 0)
          }
          return {
            ...partial,
            health: { ...s.health, addictions },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💪', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }
        })
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Pet actions ====================
      adoptPet: (petDefId: string, method: 'adopt' | 'buy'): ActionResult => {
        const state = get()
        const result = PetEngine.adoptPet(petDefId, method as AdoptMethod, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          pets: result.newPet ? [...s.pets, result.newPet] : s.pets,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🐾', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      careForPet: (petId: string): ActionResult => {
        const state = get()
        const result = PetEngine.careForPet(petId, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          pets: result.updatedPet ? s.pets.map(p => p.id === petId ? { ...p, ...result.updatedPet } : p) : s.pets,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🐾', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      vetVisit: (petId: string): ActionResult => {
        const state = get()
        const result = PetEngine.vetVisit(petId, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          pets: result.updatedPet ? s.pets.map(p => p.id === petId ? { ...p, ...result.updatedPet } : p) : s.pets,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏥', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Pet Battle actions ====================
      petBattle: (petId: string): ActionResult => {
        const state = get()
        const result = PetBattleEngine.battle(petId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const br = result.battleResult!
        const partial = applyEffects(state, br.effects)
        set(s => ({
          ...partial,
          pets: s.pets.map(p => p.id === petId ? { ...p, ...br.petUpdates } : p),
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '⚔️', category: 'life', statChanges: br.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: br.effects }
      },

      petBreed: (pet1Id: string, pet2Id: string): ActionResult => {
        const state = get()
        const result = PetBattleEngine.breed(pet1Id, pet2Id, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          pets: result.newPet ? [...s.pets, result.newPet] : s.pets,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🍼', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Minigame actions ====================
      recordMinigameResult: (gameType: string, won: boolean): ActionResult => {
        const state = get()
        const winsKey = `${gameType}Wins` as keyof typeof state.minigameStats
        const playedKey = `${gameType}Played` as keyof typeof state.minigameStats
        set(s => ({
          minigameStats: {
            ...s.minigameStats,
            [winsKey]:   typeof s.minigameStats[winsKey] === 'number' ? (s.minigameStats[winsKey] as number) + (won ? 1 : 0) : 0,
            [playedKey]: typeof s.minigameStats[playedKey] === 'number' ? (s.minigameStats[playedKey] as number) + 1 : 1,
            lastPlayed: { ...s.minigameStats.lastPlayed, [gameType]: state.time.year },
          },
        }))
        return { success: true, message: won ? 'Hai vinto!' : 'Ci riproverai!', effects: {} }
      },

      claimAdReward: () => {
        const state = get()
        const check = AdRewardEngine.canWatch(state.adRewards)
        if (!check.ok) return { reward: { id: '', label: '', emoji: '', description: '', effects: {} }, ok: false, reason: check.reason }
        const { reward, newState } = AdRewardEngine.claimReward(state.adRewards)
        const effects = adRewardToEffect(reward, state)
        const partial = applyEffects(state, effects)
        set(s => ({
          ...partial,
          adRewards: newState,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: `Premio annuncio: ${reward.label} — ${reward.description}`, emoji: reward.emoji, category: 'life', statChanges: effects }, ...s.eventLog].slice(0, 150),
        }))
        return { reward, ok: true }
      },

      // ==================== Travel actions ====================
      bookTrip: (destId: string, travelClass: 'economy' | 'business' | 'luxury'): ActionResult => {
        const state = get()
        const result = TravelEngine.bookTrip(destId, travelClass as TravelClass, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          travelHistory: result.newMemory ? [...s.travelHistory, result.newMemory as TravelMemory] : s.travelHistory,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '✈️', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        get().checkGoals()
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Dating/Marriage actions ====================
      swipe: (appId: string): ActionResult => {
        const state = get()
        const result = DatingEngine.swipe(appId as DatingApp, state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          relationships: result.newMatch ? [...s.relationships, result.newMatch] : s.relationships,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '💫' : '👻', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      proposeToPartner: (npcId: string, ringValue: number): ActionResult => {
        const state = get()
        const result = DatingEngine.propose(npcId, ringValue, state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          relationships: result.updatedRelationship
            ? s.relationships.map(r => r.id === npcId ? { ...r, ...result.updatedRelationship } : r)
            : s.relationships,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '💍' : '💔', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      getMarried: (npcId: string, weddingBudget: number): ActionResult => {
        const state = get()
        const result = DatingEngine.marry(npcId, weddingBudget, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        const spouseName = state.relationships.find(r => r.id === npcId)?.name ?? 'il tuo partner'
        const marriageMemory = makeMemory(state.time, `Matrimonio con ${spouseName}`, `Hai sposato ${spouseName} con un budget di €${weddingBudget.toLocaleString()}.`, '💒', 'relationship', [spouseName], true)
        set(s => ({
          ...partial,
          relationships: result.updatedRelationship
            ? s.relationships.map(r => r.id === npcId ? { ...r, ...result.updatedRelationship } : r)
            : s.relationships,
          lifeMemories: [...s.lifeMemories, marriageMemory].slice(-200),
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💒', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        get().checkGoals()
        return { success: true, message: result.message, effects: result.effects }
      },

      getDivorced: (npcId: string): ActionResult => {
        const state = get()
        const result = DatingEngine.divorce(npcId, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        const exName = state.relationships.find(r => r.id === npcId)?.name ?? 'il tuo ex'
        const divorceMemory = makeMemory(state.time, `Divorzio da ${exName}`, `Il matrimonio con ${exName} è finito.`, '📜', 'relationship', [exName], true)
        set(s => ({
          ...partial,
          relationships: result.updatedRelationship
            ? s.relationships.map(r => r.id === npcId ? { ...r, ...result.updatedRelationship } : r)
            : s.relationships,
          lifeMemories: [...s.lifeMemories, divorceMemory].slice(-200),
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📜', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Parenting actions ====================
      haveChild: (): ActionResult => {
        const state = get()
        const result = ParentingEngine.haveChild(state, false)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        const childName = result.newChild?.name ?? 'tuo figlio/a'
        const childMemory = makeMemory(state.time, `Nascita di ${childName}`, `${childName} è venuto/a al mondo. La tua vita è cambiata per sempre.`, '👶', 'life', [childName], true)
        set(s => ({
          ...partial,
          children: result.newChild ? [...s.children, result.newChild] : s.children,
          lifeMemories: [...s.lifeMemories, childMemory].slice(-200),
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '👶', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        get().checkGoals()
        return { success: true, message: result.message, effects: result.effects }
      },

      adoptChild: (): ActionResult => {
        const state = get()
        const result = ParentingEngine.haveChild(state, true)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          children: result.newChild ? [...s.children, result.newChild] : s.children,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏠', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        get().checkGoals()
        return { success: true, message: result.message, effects: result.effects }
      },

      interactWithChild: (childId: string, action: string): ActionResult => {
        const state = get()
        const result = ParentingEngine.interactWithChild(childId, action as ParentingAction, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        const key = `parenting_${childId}_${action}_${state.time.year}`
        set(s => ({
          ...partial,
          children: result.updatedChild
            ? s.children.map(c => c.id === childId ? { ...c, ...result.updatedChild } as Child : c)
            : s.children,
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '👨‍👧', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Military actions ====================
      enlistMilitary: (branch: string): ActionResult => {
        const state = get()
        const result = MilitaryEngine.enlist(branch as MilitaryBranch, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          military: { ...s.military, ...(result.updatedMilitary as Partial<MilitaryState>) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🪖', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      goOnMission: (missionType: string): ActionResult => {
        const state = get()
        const result = MilitaryEngine.goOnMission(missionType as MissionType, state)
        const partial = applyEffects(state, result.effects)
        const key = `mission_${state.time.year}`
        set(s => ({
          ...partial,
          military: result.updatedMilitary ? { ...s.military, ...(result.updatedMilitary as Partial<MilitaryState>) } : s.military,
          health: result.died ? { ...s.health, diseases: [...s.health.diseases] } : (partial.stats ? s.health : s.health),
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.died ? '💀' : result.success ? '🎖️' : '🏥', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        if (result.died) get().checkMorte()
        get().checkGoals()
        return { success: result.success, message: result.message, effects: result.effects }
      },

      requestMilitaryPromotion: (): ActionResult => {
        const state = get()
        const result = MilitaryEngine.requestPromotion(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          military: result.updatedMilitary ? { ...s.military, ...(result.updatedMilitary as Partial<MilitaryState>) } : s.military,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '🎖️' : '❌', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      dischargeMilitary: (): ActionResult => {
        const state = get()
        const result = MilitaryEngine.discharge(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          military: result.updatedMilitary ? { ...s.military, ...(result.updatedMilitary as Partial<MilitaryState>) } : s.military,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🎗️', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Body mod actions ====================
      getTattoo: (tattooId: string): ActionResult => {
        const state = get()
        const result = BodyModEngine.getTattoo(tattooId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          bodyMods: result.newItem ? { ...s.bodyMods, items: [...s.bodyMods.items, result.newItem!] } : s.bodyMods,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🎨', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      getPiercing: (piercingId: string): ActionResult => {
        const state = get()
        const result = BodyModEngine.getPiercing(piercingId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          bodyMods: result.newItem ? { ...s.bodyMods, items: [...s.bodyMods.items, result.newItem!] } : s.bodyMods,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💎', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      removeTattoo: (modId: string): ActionResult => {
        const state = get()
        const result = BodyModEngine.removeTattoo(modId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          bodyMods: { ...s.bodyMods, items: s.bodyMods.items.filter(m => m.id !== modId) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🔬', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Beauty actions ====================
      getHaircut: (style: string): ActionResult => {
        const state = get()
        const result = BeautyEngine.getHaircut(style as HairStyle, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        const key = `beauty_hair_${state.time.year}`
        const newHairStyle = beautyHairToAvatarStyle(style)
        const newHairColor = beautyHairToAvatarColor(style)
        const curAvatar = state.identity.avatar ?? getDefaultAvatar(state.identity.gender)
        const updatedAvatar = {
          ...curAvatar,
          ...(newHairStyle ? { hairStyle: newHairStyle } : {}),
          ...(newHairColor ? { hairColor: newHairColor } : {}),
        }
        set(s => ({
          ...partial,
          beauty: { ...s.beauty, ...(result.updatedBeauty ?? {}) },
          identity: { ...s.identity, avatar: updatedAvatar },
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '✂️', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      doNails: (style: string): ActionResult => {
        const state = get()
        const result = BeautyEngine.doNails(style as NailsStyle, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        const key = `beauty_nails_${state.time.year}`
        set(s => ({
          ...partial,
          beauty: { ...s.beauty, ...(result.updatedBeauty ?? {}) },
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💅', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      upgradeWardrobe: (tier: string): ActionResult => {
        const state = get()
        const result = BeautyEngine.upgradeWardrobe(tier as WardrobeTier, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        const newClothes = wardrobeTierToClothesStyle(tier)
        const curAvatar = state.identity.avatar ?? getDefaultAvatar(state.identity.gender)
        set(s => ({
          ...partial,
          beauty: { ...s.beauty, ...(result.updatedBeauty ?? {}) },
          identity: { ...s.identity, avatar: { ...curAvatar, clothesStyle: newClothes } },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '👗', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      doSkincare: (level: string): ActionResult => {
        const state = get()
        const result = BeautyEngine.doSkincare(level as SkincareLevel, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          beauty: { ...s.beauty, ...(result.updatedBeauty ?? {}) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🧴', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      getBotox: (): ActionResult => {
        const state = get()
        const result = BeautyEngine.getBotox(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          beauty: { ...s.beauty, ...(result.updatedBeauty ?? {}) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💉', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      getLaserHairRemoval: (): ActionResult => {
        const state = get()
        const result = BeautyEngine.getLaserHairRemoval(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          beauty: { ...s.beauty, ...(result.updatedBeauty ?? {}) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '⚡', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      buyLuxuryItem: (itemId: string): ActionResult => {
        const state = get()
        const result = BeautyEngine.buyLuxuryItem(itemId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          beauty: result.newItem
            ? { ...s.beauty, luxuryItems: [...s.beauty.luxuryItems, result.newItem!] }
            : s.beauty,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💎', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Avatar actions ====================
      updateAvatar: (config: Partial<AvatarConfig>) => {
        const state = get()
        const current = state.identity.avatar ?? getDefaultAvatar(state.identity.gender)
        set({ identity: { ...state.identity, avatar: { ...current, ...config } } })
      },

      visitBarber: (serviceId: string): ActionResult => {
        const state = get()
        if (state.time.age < 6) return { success: false, message: 'Sei troppo piccolo/a per andare dal barbiere.', effects: {} }
        const service = getBarberServices().find(s => s.id === serviceId)
        if (!service) return { success: false, message: 'Servizio non trovato.', effects: {} }
        if (state.finance.money < service.cost) return { success: false, message: `Non hai abbastanza soldi. Servono €${service.cost}.`, effects: {} }
        const badOutcome = Math.random() < 0.1
        const current = state.identity.avatar ?? getDefaultAvatar(state.identity.gender)
        const newAvatar = { ...current }
        if (service.changesStyle) newAvatar.hairStyle = service.changesStyle
        if (service.changesColor) newAvatar.hairColor = service.changesColor
        const looksChange = badOutcome ? -3 : service.looksBonus
        const msg = badOutcome
          ? `✂️ Taglio andato storto! Il barbiere ha esagerato. (-${Math.abs(looksChange)} look)`
          : `✂️ ${service.name} completato! Stai benissimo! (+${looksChange} look)`
        set(s => ({
          finance: { ...s.finance, money: s.finance.money - service.cost },
          identity: { ...s.identity, avatar: newAvatar },
          stats: { ...s.stats, looks: clamp(s.stats.looks + looksChange, 0, 100) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: msg, emoji: '✂️', category: 'beauty', statChanges: { looks: looksChange } }, ...s.eventLog].slice(0, 150),
        }))
        return { success: !badOutcome, message: msg, effects: { looks: looksChange } }
      },

      buyAccessory: (accessoryId: string): ActionResult => {
        const state = get()
        const shop = getAccessoryShop()
        const item = shop.find(a => a.id === accessoryId)
        if (!item) return { success: false, message: 'Accessorio non trovato.', effects: {} }
        if (state.finance.money < item.cost) return { success: false, message: `Non hai abbastanza soldi. Servono €${item.cost}.`, effects: {} }
        const current = state.identity.avatar ?? getDefaultAvatar(state.identity.gender)
        const msg = `🛍️ ${item.name} acquistato! (+${item.looksBonus} look)`
        set(s => ({
          finance: { ...s.finance, money: s.finance.money - item.cost },
          identity: { ...s.identity, avatar: { ...current, accessory: accessoryId as AvatarAccessory } },
          stats: { ...s.stats, looks: clamp(s.stats.looks + item.looksBonus, 0, 100) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: msg, emoji: item.emoji, category: 'beauty', statChanges: { looks: item.looksBonus } }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: msg, effects: { looks: item.looksBonus } }
      },

      removeAccessory: () => {
        const state = get()
        const current = state.identity.avatar ?? getDefaultAvatar(state.identity.gender)
        set({ identity: { ...state.identity, avatar: { ...current, accessory: 'none' as AvatarAccessory } } })
      },

      // ==================== Retirement actions ====================
      retire: (type: string): ActionResult => {
        const state = get()
        const result = RetirementEngine.retire(type as RetirementType, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          retirement: { ...s.retirement, ...(result.updatedRetirement ?? {}) },
          career: s.career.currentJob ? { ...s.career, currentJob: null, jobHistory: [...s.career.jobHistory] } : s.career,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🎗️', category: 'career', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      makeWill: (): ActionResult => {
        const state = get()
        const result = RetirementEngine.makeWill(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          retirement: { ...s.retirement, ...(result.updatedRetirement ?? {}) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📜', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      prePlanFuneral: (): ActionResult => {
        const state = get()
        const result = RetirementEngine.prePlanFuneral(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          retirement: { ...s.retirement, ...(result.updatedRetirement ?? {}) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '⚰️', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      doVolunteering: (): ActionResult => {
        const state = get()
        const result = RetirementEngine.doVolunteering(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        const key = `volunteer_${state.time.year}`
        set(s => ({
          ...partial,
          retirement: { ...s.retirement, volunteeringActive: true },
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🤝', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      changeLiving: (arrangement: string): ActionResult => {
        const state = get()
        const result = RetirementEngine.changeLiving(arrangement as SeniorLiving, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          retirement: { ...s.retirement, ...(result.updatedRetirement ?? {}) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏠', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Legacy action ====================
      continueAsChild: (childId: string): void => {
        const state = get()
        const child = state.children.find(c => c.id === childId)
        if (!child) return
        const score = LegacyEngine.calculateLegacyScore(state)
        const { identity, startingMoney, bonuses } = LegacyEngine.buildChildStartingState(child, state, score)

        // Start a new game as the child with inherited stats and bonuses
        const startAge = Math.max(18, child.age)
        const newState = {
          isStarted: true,
          isGameOver: false,
          deathType: null,
          gameOverYear: null,
          identity,
          time: { year: state.time.year + (startAge - child.age), month: 1, age: startAge },
          stats: {
            health: Math.min(100, child.health),
            mentalHealth: 70 + bonuses.happinessBonus,
            happiness: 60 + bonuses.happinessBonus,
            intelligence: Math.min(100, child.intelligence + bonuses.intelligenceBonus),
            looks: Math.min(100, child.looks + bonuses.looksBonus),
            energy: 80,
            karma: 0,
            reputation: 5 + bonuses.reputationBonus,
            socialReputation: 5 + bonuses.reputationBonus,
          },
          finance: {
            money: startingMoney,
            bankBalance: 0, debt: 0, creditScore: 650,
            monthlyIncome: 0, monthlyExpenses: 500,
            investments: [], assets: [],
          },
          market: FinanceEngine.initialMarketState(),
          relationships: state.relationships.filter(r => r.isAlive).slice(0, 3),
          children: [],
          socialMedia: [],
          fame: FameEngine.initialState(),
          chaos: ChaosEngine.initialState(),
          dailyQuests: DailyQuestEngine.initialState(),
          npcAgency: NPCAgencyEngine.initialState(),
          npcEventQueue: [],
          adRewards: AdRewardEngine.initialState(),
          legacy: state.legacy,
          diminishingReturns: {},
          eventLog: [{
            id: uid(),
            year: state.time.year + (startAge - child.age),
            age: startAge,
            text: `Nuova vita come ${identity.name} ${identity.surname}. Eredità da ${state.identity.name}: €${startingMoney.toLocaleString()}.`,
            emoji: '🔄',
            category: 'life',
            statChanges: {},
          }],
        }
        set(newState as Partial<typeof state>)
      },

      // ==================== Gambling actions ====================
      playCasinoGame: (game: GamblingGame, bet: number): ActionResult => {
        const state = get()
        const result = GamblingEngine.playCasinoGame(game, bet, state)
        if (!result.success && result.won === 0 && result.lost === 0 && !result.effects.money) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          gambling: { ...s.gambling, ...result.updatedGambling },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🎰', category: 'gambling', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      buyLotteryTicket: (): ActionResult => {
        const state = get()
        const result = GamblingEngine.buyLotteryTicket(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          gambling: { ...s.gambling, ...result.updatedGambling },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🎟️', category: 'gambling', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      buyScratchCard: (): ActionResult => {
        const state = get()
        const result = GamblingEngine.buyScratchCard(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          gambling: { ...s.gambling, ...result.updatedGambling },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📄', category: 'gambling', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      placeSportsBet: (sport: SportBetType, bet: number): ActionResult => {
        const state = get()
        const result = GamblingEngine.placeSportsBet(sport, bet, state)
        if (!result.success && result.won === 0 && result.lost === 0) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          gambling: { ...s.gambling, ...result.updatedGambling },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '⚽', category: 'gambling', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Sexual health actions ====================
      setContraception: (method: ContraceptionMethod): ActionResult => {
        const state = get()
        const result = SexualHealthEngine.setContraception(method, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          sexualHealth: { ...s.sexualHealth, ...result.updatedSexualHealth },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🩺', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      haveSex: (partnerHasSTI = false): ActionResult => {
        const state = get()
        const result = SexualHealthEngine.haveSex(state, partnerHasSTI)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          sexualHealth: { ...s.sexualHealth, ...result.updatedSexualHealth },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💕', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      takePregnancyTest: (): ActionResult => {
        const state = get()
        const result = SexualHealthEngine.takePregnancyTest(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🤰', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      getAbortion: (): ActionResult => {
        const state = get()
        const result = SexualHealthEngine.getAbortion(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          sexualHealth: { ...s.sexualHealth, ...result.updatedSexualHealth },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏥', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      getSTDTest: (): ActionResult => {
        const state = get()
        const result = SexualHealthEngine.getSTDTest(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          sexualHealth: { ...s.sexualHealth, ...result.updatedSexualHealth },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🔬', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      treatSTI: (stiType: STIType): ActionResult => {
        const state = get()
        const result = SexualHealthEngine.treatSTI(stiType, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          sexualHealth: { ...s.sexualHealth, ...result.updatedSexualHealth },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💊', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      doIVF: (): ActionResult => {
        const state = get()
        const result = SexualHealthEngine.doIVF(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          sexualHealth: { ...s.sexualHealth, ...result.updatedSexualHealth },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🌸', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Living / Housing actions ====================
      upgradeLiving: (targetType: LivingType): ActionResult => {
        const state = get()
        const result = LivingEngine.upgradeLiving(targetType, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          living: { ...s.living, ...(result.updatedLiving ?? {}) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏠', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      buyHouseWithMortgage: (houseId: string): ActionResult => {
        const state = get()
        const result = LivingEngine.buyHouse(houseId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          living: { ...s.living, ...(result.updatedLiving ?? {}) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏡', category: 'finance', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Cheat actions ====================
      cheatAddMoney: (amount: number) => {
        set(s => ({
          finance: { ...s.finance, money: s.finance.money + amount },
          settings: { ...s.settings, mode: 'god' },
          eventLog: [{ id: uid(), year: get().time.year, age: get().time.age, text: `💰 [CHEAT] +€${amount.toLocaleString()} aggiunti.`, emoji: '💰', category: 'cheat', statChanges: { money: amount } }, ...s.eventLog].slice(0, 150),
        }))
      },

      cheatSetMaxStats: () => {
        set(s => ({
          stats: { health: 100, mentalHealth: 100, happiness: 100, intelligence: 100, looks: 100, energy: 100, karma: 100, reputation: 100, socialReputation: 100 },
          settings: { ...s.settings, mode: 'god' },
          eventLog: [{ id: uid(), year: get().time.year, age: get().time.age, text: '⚡ [CHEAT] Tutte le statistiche al massimo.', emoji: '⚡', category: 'cheat', statChanges: {} }, ...s.eventLog].slice(0, 150),
        }))
      },

      cheatSetImmortal: () => {
        set(s => ({
          stats: { ...s.stats, health: 100 },
          settings: { ...s.settings, mode: 'god' },
          eventLog: [{ id: uid(), year: get().time.year, age: get().time.age, text: '☠️ [CHEAT] Modalità immortale attivata. Salute sempre al 100%.', emoji: '☠️', category: 'cheat', statChanges: {} }, ...s.eventLog].slice(0, 150),
        }))
      },

      cheatSkipToAge: (targetAge: number) => {
        const state = get()
        if (targetAge <= state.time.age) return
        const yearsToSkip = targetAge - state.time.age
        set(s => ({
          time: { ...s.time, age: targetAge, year: s.time.year + yearsToSkip },
          settings: { ...s.settings, mode: 'god' },
          eventLog: [{ id: uid(), year: state.time.year + yearsToSkip, age: targetAge, text: `⏩ [CHEAT] Saltato a ${targetAge} anni.`, emoji: '⏩', category: 'cheat', statChanges: {} }, ...s.eventLog].slice(0, 150),
        }))
      },

      unlockGodMode: () => {
        set(s => ({ settings: { ...s.settings, godModeUnlocked: true } }))
      },

      dismissNpcEvent: (id: string) => {
        set(s => ({ npcEventQueue: (s.npcEventQueue ?? []).filter(e => e.id !== id) }))
      },

      // ==================== Cosmetic Surgery actions ====================
      performSurgery: (procedureId: string): ActionResult => {
        const state = get()
        const result = CosmeticSurgeryEngine.performSurgery(procedureId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          cosmeticSurgery: result.updatedSurgery
            ? { ...s.cosmeticSurgery, ...result.updatedSurgery }
            : s.cosmeticSurgery,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💉', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        get().checkGoals()
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Challenge actions ====================
      acceptChallenge: (defId: string): ActionResult => {
        const state = get()
        const result = ChallengeEngine.acceptChallenge(defId, state)
        if (!result.success || !result.challenge) return { success: false, message: result.message, effects: {} }
        set(s => ({
          challengeEngine: {
            ...s.challengeEngine,
            activeChallenges: [...s.challengeEngine.activeChallenges, result.challenge!],
          },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏆', category: 'life', statChanges: {} }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: {} }
      },

      abandonChallenge: (defId: string): ActionResult => {
        const state = get()
        const updatedState = ChallengeEngine.abandonChallenge(defId, state)
        set(s => ({
          challengeEngine: { ...s.challengeEngine, ...updatedState },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: `❌ Challenge abbandonata.`, emoji: '❌', category: 'life', statChanges: {} }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: 'Challenge abbandonata.', effects: {} }
      },

      claimDailyQuest: (questId: string): ActionResult => {
        const state = get()
        const result = DailyQuestEngine.claimQuest(questId, state)
        if (!result.success) return { success: false, message: result.message, effects: result.effects }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          dailyQuests: result.dailyQuests,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: `📅 ${result.message}`, emoji: '📅', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Vehicle actions ====================
      studyDrivingTheory: (): ActionResult => {
        const state = get()
        const result = VehicleEngine.studyTheory(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          vehicle: { ...s.vehicle, studyHours: Math.min(30, s.vehicle.studyHours + 10) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📖', category: 'education', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      takeTheoryExam: (): ActionResult => {
        const state = get()
        const result = VehicleEngine.takeTheoryExam(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          vehicle: result.theoryPassed ? { ...s.vehicle, theoryPassed: true } : s.vehicle,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.theoryPassed ? '🎉' : '❌', category: 'education', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      takePracticalExam: (): ActionResult => {
        const state = get()
        const result = VehicleEngine.takePracticalExam(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          vehicle: result.licenseGranted ? { ...s.vehicle, hasLicenseB: true } : s.vehicle,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.licenseGranted ? '🪪' : '❌', category: 'education', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      buyVehicle: (vehicleId: string): ActionResult => {
        const state = get()
        const result = VehicleEngine.buyVehicle(vehicleId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          vehicle: result.newVehicle ? { ...s.vehicle, ownedVehicles: [...s.vehicle.ownedVehicles, result.newVehicle!] } : s.vehicle,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🚗', category: 'finance', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        get().checkGoals()
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Religion actions ====================
      practiceReligion: (): ActionResult => {
        const state = get()
        const result = ReligionEngine.practiceReligion(state)
        const partial = applyEffects(state, result.effects)
        const key = `religion_${state.time.year}`
        set(s => ({
          ...partial,
          religion: { ...s.religion, practiceLevel: clamp(s.religion.practiceLevel + 5, 0, 100), lastPracticeYear: state.time.year },
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🙏', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      convertReligion: (religion: Religion): ActionResult => {
        const state = get()
        const result = ReligionEngine.convertReligion(religion, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          identity: { ...s.identity, religion: result.newReligion! },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '✨', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      // ==================== Politics actions ====================
      registerToVote: (): ActionResult => {
        const state = get()
        const result = PoliticsEngine.registerToVote(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          politics: { ...s.politics, ...result.updatedPolitics },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🗳️', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      vote: (partyId: string): ActionResult => {
        const state = get()
        const result = PoliticsEngine.vote(partyId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          politics: { ...s.politics, ...result.updatedPolitics },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🗳️', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      joinParty: (partyId: string): ActionResult => {
        const state = get()
        const result = PoliticsEngine.joinParty(partyId, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          politics: { ...s.politics, ...result.updatedPolitics },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🏛️', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      leaveParty: (): ActionResult => {
        const state = get()
        const result = PoliticsEngine.leaveParty(state)
        if (!result.success) return { success: false, message: result.message, effects: {} }
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          politics: { ...s.politics, ...(result.updatedPolitics as Partial<PoliticsState>) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '🚪', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      conductCampaign: (): ActionResult => {
        const state = get()
        const result = PoliticsEngine.conductCampaign(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          politics: { ...s.politics, ...(result.updatedPolitics as Partial<PoliticsState>) },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '📢' : '😔', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      runForOffice: (role: string): ActionResult => {
        const state = get()
        const result = PoliticsEngine.runForOffice(role as PoliticalRole, state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          politics: result.updatedPolitics ? { ...s.politics, ...(result.updatedPolitics as Partial<PoliticsState>) } : s.politics,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '🎉' : '😔', category: 'life', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        get().checkGoals()
        return { success: result.success, message: result.message, effects: result.effects }
      },

      engageInCorruption: (): ActionResult => {
        const state = get()
        const result = PoliticsEngine.engageInCorruption(state)
        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          politics: result.updatedPolitics ? { ...s.politics, ...(result.updatedPolitics as Partial<PoliticsState>) } : s.politics,
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '💰' : '🚔', category: 'criminal', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Validation ====================
      checkGoals: () => {
        const state = get()
        const updated = state.goals.map(goal => {
          if (goal.completed) return goal
          try {
            if (evaluateTrigger(goal.triggerCondition, state)) {
              get().aggiornaStats(goal.reward)
              return { ...goal, completed: true, completedYear: state.time.year }
            }
          } catch {
            // Invalid goal trigger conditions are ignored so a bad goal cannot break the turn loop.
          }
          return goal
        })
        const newCompleted = updated
          .filter(g => g.completed && !state.completedGoals.includes(g.id))
          .map(g => g.id)
        set(s => ({ goals: updated, completedGoals: [...s.completedGoals, ...newCompleted] }))
      },

      checkMorte: () => {
        const state = get()
        if (state.isGameOver) return
        let deathType: string | null = null

        // Health-based deaths
        if (state.stats.health <= 0) {
          // Check overdose first
          const hasActiveAddiction = state.health.addictions.some(a => a.level > 70)
          if (hasActiveAddiction && Math.random() < 0.4) {
            deathType = 'overdose'
          } else if (state.retirement.seniorConditions.some(c => c.id === 'heart_disease') && state.time.age > 70) {
            deathType = 'disease'
          } else {
            deathType = state.time.age > 70 ? 'natural' : 'disease'
          }
        }

        // Mental health
        if (!deathType && state.stats.mentalHealth <= 0) {
          deathType = 'suicide'
        }

        // Old age
        if (!deathType && state.time.age >= 120) {
          deathType = 'natural'
        }

        // Alzheimer severe — gradual death
        if (!deathType && state.retirement.alzheimersStage === 'severe' && Math.random() < 0.3) {
          deathType = 'natural'
        }

        // Random death by crime/murder if high criminal record and enemies
        if (!deathType && state.criminal.hasRecord && state.criminal.crimes.length >= 3) {
          const enemyCount = state.relationships.filter(r => r.type === 'enemy').length
          if (enemyCount >= 2 && Math.random() < 0.03) deathType = 'murder'
        }

        // Execution: condemned prisoner
        if (!deathType && state.criminal.inPrison && state.criminal.prisonSentence >= 20 && Math.random() < 0.01) {
          deathType = 'execution'
        }

        // Traffic accident if own car + reckless
        if (!deathType && state.vehicle.ownedVehicles.length > 0 && state.vehicle.licensePoints <= 5 && Math.random() < 0.02) {
          deathType = 'accident'
        }

        if (deathType) {
          // Compute legacy score on death
          const legacyScore = LegacyEngine.calculateLegacyScore(state)
          set({
            isGameOver: true,
            deathType,
            gameOverYear: state.time.year,
            currentEvent: null,
            legacy: {
              playerId: state.identity.name,
              deathDate: `${state.time.year}`,
              children: state.children.map(c => LegacyEngine.buildInheritanceRecord(c, state)),
              assetsTransferred: state.finance.assets,
              traitsInherited: [],
              relationshipsMaintained: state.relationships.filter(r => r.isAlive),
              memoriesPreserved: [],
              familyTies: state.children.length > 0
                ? Math.round(state.children.reduce((s, c) => s + c.bondWithPlayer, 0) / state.children.length)
                : 0,
              legacyScore: legacyScore.total,
              ribbonsFamily: state.ribbons.filter(r => r.unlocked).map(r => r.id),
            },
          })
        }
      },

      checkEventRequirements: (event: GameEvent, state: GameState) =>
        evaluateTrigger(event.triggerCondition, state),

      applyNazioneEffect: () => {
        const s = get()
        if (s.nation) get().aggiornaStats({ health: s.nation.healthRecoveryBonus * 0.1 })
      },

      // ==================== Setters ====================
      setCurrentEvent: (event) => set({ currentEvent: event }),
      addLogEntry: (entry) => set(s => ({ eventLog: [{ ...entry, id: uid() }, ...s.eventLog].slice(0, 150) })),
      addRelationship: (rel) => set(s => ({ relationships: [...s.relationships, rel] })),
      updateRelationship: (id, updates) => set(s => ({ relationships: s.relationships.map(r => r.id === id ? { ...r, ...updates } : r) })),
      removeRelationship: (id) => set(s => ({ relationships: s.relationships.filter(r => r.id !== id) })),
    }),
    {
      name: 'lifesim2d-save',
      storage: createJSONStorage(() => localStorage),
      // Merge loaded state with current defaults to handle missing slices in old saves
      merge: (persistedState: unknown, currentState: FullStore): FullStore => {
        const ps = persistedState as Partial<FullStore>
        return {
          ...currentState,
          ...ps,
          // Guarantee new slices exist even in old saves
          minigameStats: ps.minigameStats ?? currentState.minigameStats,
          adRewards: ps.adRewards ?? currentState.adRewards,
        }
      },
      partialize: (state) => ({
        isStarted: state.isStarted,
        isGameOver: state.isGameOver,
        deathType: state.deathType,
        time: state.time,
        identity: state.identity,
        stats: state.stats,
        finance: state.finance,
        market: state.market,
        education: state.education,
        career: state.career,
        relationships: state.relationships,
        family: state.family,
        children: state.children,
        pets: state.pets,
        criminal: state.criminal,
        health: state.health,
        hobbies: state.hobbies,
        socialMedia: state.socialMedia,
        fame: state.fame,
        chaos: state.chaos,
        travelHistory: state.travelHistory,
        living: state.living,
        nation: state.nation,
        goals: state.goals,
        completedGoals: state.completedGoals,
        ribbons: state.ribbons,
        inventory: state.inventory,
        eventLog: state.eventLog.slice(0, 50),
        settings: state.settings,
        vehicle: state.vehicle,
        religion: state.religion,
        politics: state.politics,
        military: state.military,
        bodyMods: state.bodyMods,
        beauty: state.beauty,
        retirement: state.retirement,
        gambling: state.gambling,
        sexualHealth: state.sexualHealth,
        worldEvents: state.worldEvents,
        cosmeticSurgery: state.cosmeticSurgery,
        challengeEngine: state.challengeEngine,
        dailyQuests: state.dailyQuests,
        npcAgency: state.npcAgency,
        minigameStats: state.minigameStats,
        adRewards: state.adRewards,
      }),
    }
  )
)
