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
import { CareerEngine } from '../services/CareerEngine'
import { RelationshipEngine, type NPCContext, type NPCAction } from '../services/RelationshipEngine'
import { EducationEngine } from '../services/EducationEngine'
import { HealthEngine } from '../services/HealthEngine'
import { HobbyEngine } from '../services/HobbyEngine'
import { CriminalEngine } from '../services/CriminalEngine'
import { FinanceEngine, type AssetType } from '../services/FinanceEngine'

// ---- helpers ----

export const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val))

export const uid = () => Math.random().toString(36).slice(2, 10)

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

    // eslint-disable-next-line no-new-func
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

function buildInitialState(): GameState {
  return {
    isStarted: false,
    isGameOver: false,
    deathType: null,
    gameOverYear: null,
    settings: { mode: 'normal', ironMan: false, soundEnabled: true, notificationsEnabled: true, language: 'it', autoSave: true },
    time: { year: 2000, month: 1, age: 0 },
    identity: { name: 'Giocatore', surname: 'Demo', gender: 'male', nationality: 'italy', birthYear: 2000, familyBackground: 'middle', religion: 'catholicism', sexualOrientation: 'heterosexual', emoji: '🙂' },
    stats: { health: 80, mentalHealth: 80, happiness: 70, intelligence: 50, looks: 50, energy: 80, karma: 0, reputation: 50, socialReputation: 50 },
    finance: { money: 1000, bankBalance: 0, debt: 0, creditScore: 650, monthlyIncome: 0, monthlyExpenses: 0, investments: [], assets: [] },
    education: { currentLevel: 'none', completedLevels: [], gpa: 0, scholarships: [], clubs: [], dropOut: false, studentLoan: 0, university: null, major: null, graduationYear: null },
    career: { currentJob: null, jobHistory: [], promotions: 0, firings: 0, burnoutLevel: 0, pensionContributions: 0, licenses: [], businessOwned: null },
    relationships: [],
    children: [],
    pets: [],
    criminal: { crimes: [], inPrison: false, prisonSentence: 0, prisonServed: 0, parole: false, paroleDuration: 0, electronicBracelet: false, hasRecord: false },
    health: { diseases: [], addictions: [], disabilities: [], fitnessLevel: 50, bmi: 22, lastMedicalCheck: 0, mentalDisorders: [], ptsd: false },
    hobbies: [],
    socialMedia: [],
    travelHistory: [],
    living: { type: 'parents', location: 'Italy', monthlyCost: 0, mortgageRemaining: 0, propertyValue: 0, roommates: [] },
    nation: (db.nations as Nation[]).find(n => n.id === 'italy') ?? null,
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
    diminishingReturns: {},
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
      newGame: (identity: PlayerIdentity, nationId: string) => {
        const initial = buildInitialState()
        const nation = (db.nations as Nation[]).find(n => n.id === nationId) ?? initial.nation
        const startMoney = BACKGROUND_MONEY[identity.familyBackground] ?? 1000

        set({
          ...initial,
          isStarted: true,
          identity: { ...identity, emoji: '👶' },
          time: { year: identity.birthYear, month: 1, age: 0 },
          nation,
          finance: { ...initial.finance, money: startMoney },
          eventLog: [{
            id: uid(), year: identity.birthYear, age: 0,
            text: `${identity.name} ${identity.surname} è venuto/a al mondo in ${nation?.name ?? 'Italia'}.`,
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
        let combined: Effect = {}
        const messages: string[] = []

        const merge = (e: Effect) => {
          for (const [k, v] of Object.entries(e)) combined[k] = (combined[k] ?? 0) + v
        }

        // 1. Natural energy/health decay
        merge({
          energy: -5,
          health: newAge > 50 ? -(newAge - 50) * 0.3 : -1,
          happiness: state.finance.money < 500 ? -3 : 0,
        })

        // 2. Monthly salary (12x in one year tick)
        if (state.career.currentJob) {
          merge({ money: state.career.currentJob.salary * 12 })
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

        // 8. Hobby annual tick
        const { effects: hobbyFx, updates: hobbyUpdates } = HobbyEngine.annualTick(state)
        merge(hobbyFx)

        // 9. Criminal annual tick (prison sentence)
        const { effects: criminalFx, freedThisYear, message: criminalMsg, updatedCriminal } =
          CriminalEngine.annualTick(state)
        merge(criminalFx)
        if (criminalMsg) messages.push(criminalMsg)

        // 10. Finance annual tick (investments + assets)
        const { effects: financeFx, updatedInvestments, updatedAssets } = FinanceEngine.annualTick(state)
        merge(financeFx)

        // 11. Random events (background micro-events without choices)
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
          }
        } else {
          careerUpdate = {
            ...careerUpdate,
            burnoutLevel: clamp(careerUpdate.burnoutLevel + burnoutDelta, 0, 100),
            pensionContributions: state.career.currentJob
              ? careerUpdate.pensionContributions + state.career.currentJob.salary * 12 * 0.03
              : careerUpdate.pensionContributions,
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
        eduUpdate = { ...eduUpdate, gpa: parseFloat(newGpa.toFixed(2)) }

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

        set({
          time: newTime,
          stats: newStats,
          finance: financeWithInvestments,
          identity: newIdentity,
          career: careerUpdate,
          health: healthUpdate,
          education: eduUpdate,
          relationships: updatedRelationships,
          criminal: updatedCriminal,
          hobbies: updatedHobbies,
          currentEvent: picked,
          availableChoices: choices,
          eventLog: [logEntry, ...state.eventLog].slice(0, 150),
          diminishingReturns: {}, // reset annual counters
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
          set(s => ({
            ...partial,
            career: {
              ...s.career,
              currentJob: result.newJob!,
              jobHistory: oldJob ? [...s.career.jobHistory, oldJob] : s.career.jobHistory,
            },
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
          set(s => ({
            ...partial,
            career: {
              ...s.career,
              currentJob: { ...s.career.currentJob!, salary: s.career.currentJob!.salary + result.salaryIncrease! },
              promotions: s.career.promotions + 1,
            },
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

      // ==================== Relationship actions ====================
      meetNewPerson: (context: NPCContext): ActionResult => {
        const state = get()
        const result = RelationshipEngine.meetNewPerson(context, state)
        const key = `meet_${state.time.year}`
        const partial = applyEffects(state, result.effects)

        if (result.success) {
          const npc = RelationshipEngine.generateNPC(context, state)
          set(s => ({
            ...partial,
            relationships: [...s.relationships, npc],
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
        const partial = applyEffects(state, result.effects)
        const key = `interact_${npcId}_${state.time.year}`

        const updatedRel: Relationship = {
          ...rel,
          ...(result.updatedRel ?? {}),
          memoryLog: result.memoryEntry
            ? [...rel.memoryLog, { ...result.memoryEntry, id: uid(), year: state.time.year }].slice(-200)
            : rel.memoryLog,
        }

        if (result.relationshipEnded) {
          set(s => ({
            ...partial,
            relationships: s.relationships.map(r => r.id === npcId ? updatedRel : r),
            diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '💔', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }))
        } else {
          set(s => ({
            ...partial,
            relationships: s.relationships.map(r => r.id === npcId ? updatedRel : r),
            diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
            eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.stageAdvanced ? '⭐' : '💬', category: 'social', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
          }))
        }
        get().checkGoals()
        return { success: result.success, message: result.message, effects: result.effects }
      },

      // ==================== Education actions ====================
      startEducation: (level: EducationLevel): ActionResult => {
        const state = get()
        const result = EducationEngine.startEducation(level, state)
        if (!result.success) return { success: false, message: result.message, effects: {} }

        const partial = applyEffects(state, result.effects)
        set(s => ({
          ...partial,
          education: { ...s.education, currentLevel: result.newLevel ?? s.education.currentLevel },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: '📚', category: 'education', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: true, message: result.message, effects: result.effects }
      },

      studyAction: (): ActionResult => {
        const state = get()
        const result = EducationEngine.study(state)
        const partial = applyEffects(state, result.effects)
        const key = `study_${state.time.year}`

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
        const result = HealthEngine.exercise(state)
        const partial = applyEffects(state, result.effects)
        const key = `exercise_${state.time.year}`
        const fitnessGain = result.success ? 8 : 0

        set(s => ({
          ...partial,
          health: { ...s.health, fitnessLevel: clamp(s.health.fitnessLevel + fitnessGain, 0, 100) },
          diminishingReturns: { ...s.diminishingReturns, [key]: (s.diminishingReturns[key] ?? 0) + 1 },
          eventLog: [{ id: uid(), year: state.time.year, age: state.time.age, text: result.message, emoji: result.success ? '🏋️' : '😴', category: 'health', statChanges: result.effects }, ...s.eventLog].slice(0, 150),
        }))
        return { success: result.success, message: result.message, effects: result.effects }
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
          } catch {}
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

        if (state.stats.health <= 0) {
          deathType = state.time.age > 70 ? 'natural' : 'disease'
        } else if (state.stats.mentalHealth <= 0) {
          deathType = 'suicide'
        } else if (state.time.age >= 120) {
          deathType = 'natural'
        }

        if (deathType) {
          set({ isGameOver: true, deathType, gameOverYear: state.time.year, currentEvent: null })
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
      partialize: (state) => ({
        isStarted: state.isStarted,
        isGameOver: state.isGameOver,
        deathType: state.deathType,
        time: state.time,
        identity: state.identity,
        stats: state.stats,
        finance: state.finance,
        education: state.education,
        career: state.career,
        relationships: state.relationships,
        children: state.children,
        pets: state.pets,
        criminal: state.criminal,
        health: state.health,
        hobbies: state.hobbies,
        socialMedia: state.socialMedia,
        travelHistory: state.travelHistory,
        living: state.living,
        nation: state.nation,
        goals: state.goals,
        completedGoals: state.completedGoals,
        ribbons: state.ribbons,
        inventory: state.inventory,
        eventLog: state.eventLog.slice(0, 50),
        settings: state.settings,
      }),
    }
  )
)
