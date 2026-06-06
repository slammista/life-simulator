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
} from './types'
import db from '../../public/db.json'

// ---- helpers ----

const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val))

const uid = () => Math.random().toString(36).slice(2, 10)

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
  return '🙂'
}

function evaluateTrigger(condition: string, state: GameState): boolean {
  try {
    const { stats, time, career, criminal, relationships, education } = state
    const age = time.age
    const year = time.year
    const money = state.finance.money
    const health = stats.health
    const happiness = stats.happiness
    const intelligence = stats.intelligence
    const hasJob = career.currentJob !== null
    const hasRecord = criminal.hasRecord

    // Simple DSL evaluation
    if (condition.startsWith('year ==')) {
      const target = parseInt(condition.split('==')[1].trim())
      return year === target
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
      'age', 'year', 'money', 'health', 'happiness', 'intelligence',
      'hasJob', 'hasRecord',
      `return (${condition})`
    )
    return fn(age, year, money, health, happiness, intelligence, hasJob, hasRecord)
  } catch {
    return false
  }
}

function buildInitialState(): GameState {
  const now = new Date()
  return {
    isStarted: false,
    isGameOver: false,
    deathType: null,
    gameOverYear: null,
    settings: {
      mode: 'normal',
      ironMan: false,
      soundEnabled: true,
      notificationsEnabled: true,
      language: 'it',
      autoSave: true,
    },
    time: { year: now.getFullYear() - 20, month: 1, age: 0 },
    identity: {
      name: 'Giocatore',
      surname: 'Demo',
      gender: 'male',
      nationality: 'italy',
      birthYear: now.getFullYear() - 20,
      familyBackground: 'middle',
      religion: 'catholicism',
      sexualOrientation: 'heterosexual',
      emoji: '🙂',
    },
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

// ---- store ----

export const useGameStore = create<FullStore>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      // ----- newGame -----
      newGame: (identity: PlayerIdentity, nationId: string) => {
        const now = new Date()
        const initial = buildInitialState()
        const nation = (db.nations as Nation[]).find(n => n.id === nationId) ?? initial.nation
        set({
          ...initial,
          isStarted: true,
          identity: { ...identity, emoji: '👶' },
          time: { year: identity.birthYear, month: 1, age: 0 },
          nation,
          eventLog: [{
            id: uid(),
            year: identity.birthYear,
            age: 0,
            text: `${identity.name} è venuto/a al mondo.`,
            emoji: '👶',
            category: 'life',
            statChanges: {},
          }],
        })
      },

      // ----- handleInvecchia -----
      handleInvecchia: () => {
        const state = get()
        if (state.isGameOver) return

        const newAge = state.time.age + 1
        const newYear = state.time.year + 1
        const newTime = { ...state.time, age: newAge, year: newYear }

        // 1. Natural decay
        const decay: Effect = {
          energy: -5,
          health: newAge > 50 ? -(newAge - 50) * 0.3 : -1,
          happiness: state.finance.money < 500 ? -3 : 0,
        }

        // 2. Apply salary
        if (state.career.currentJob) {
          decay.money = state.career.currentJob.salary
        }

        // 3. Nation effect
        if (state.nation) {
          decay.health = (decay.health ?? 0) + state.nation.healthRecoveryBonus * 0.1
        }

        // 4. Pick random events
        const allEvents = db.events as unknown as GameEvent[]
        const eligible = allEvents.filter(ev => {
          if (ev.minAge > newAge || ev.maxAge < newAge) return false
          if (ev.isHistorical && ev.year !== newYear) return false
          if (!ev.isHistorical && Math.random() > ev.probability) return false
          if (!evaluateTrigger(ev.triggerCondition, { ...state, time: newTime })) return false
          return true
        })

        const picked = eligible[Math.floor(Math.random() * eligible.length)] ?? null

        // Build choices for picked event
        let choices: Choice[] = []
        if (picked) {
          const allChoices = db.choices as unknown as Choice[]
          choices = allChoices.filter(c => c.eventId === picked.id)
        }

        // Apply decay
        const s = state.stats
        const f = state.finance

        // Also apply random events without choices
        const randomEvs = db.random_events as unknown as Array<{ id: string; title: string; description: string; emoji: string; probability: number; effects: Effect; triggerCondition?: string }>
        let randomBonus: Effect = {}
        for (const rev of randomEvs) {
          if (Math.random() < rev.probability) {
            for (const [k, v] of Object.entries(rev.effects)) {
              randomBonus[k] = (randomBonus[k] ?? 0) + v
            }
          }
        }

        const allEffects = { ...decay, ...randomBonus }

        const newStats = {
          health: clamp(s.health + (allEffects.health ?? 0), 0, 100),
          mentalHealth: clamp(s.mentalHealth + (allEffects.mentalHealth ?? 0), 0, 100),
          happiness: clamp(s.happiness + (allEffects.happiness ?? 0), 0, 100),
          intelligence: clamp(s.intelligence + (allEffects.intelligence ?? 0), 0, 100),
          looks: clamp(s.looks + (allEffects.looks ?? 0), 0, 100),
          energy: clamp(s.energy + (allEffects.energy ?? 0), 0, 100),
          karma: clamp(s.karma + (allEffects.karma ?? 0), -100, 100),
          reputation: clamp(s.reputation + (allEffects.reputation ?? 0), 0, 100),
          socialReputation: clamp(s.socialReputation + (allEffects.socialReputation ?? 0), 0, 100),
        }

        const newMoney = f.money + (allEffects.money ?? 0)

        // Log entry
        const logEntry: LogEntry = {
          id: uid(),
          year: newYear,
          age: newAge,
          text: picked ? `${picked.emoji} ${picked.title}` : `Hai ${newAge} anni.`,
          emoji: picked?.emoji ?? '📅',
          category: 'year',
          statChanges: allEffects,
        }

        const newIdentity = { ...state.identity, emoji: getPlayerEmoji({ ...state, stats: newStats, time: newTime }) }

        set({
          time: newTime,
          stats: newStats,
          finance: { ...state.finance, money: newMoney },
          identity: newIdentity,
          currentEvent: picked,
          availableChoices: choices,
          eventLog: [logEntry, ...state.eventLog].slice(0, 100),
          diminishingReturns: {},
        })

        get().checkGoals()
        get().checkMorte()
      },

      // ----- handleChoice -----
      handleChoice: (choiceId: string) => {
        const state = get()
        const choice = state.availableChoices.find(c => c.id === choiceId)
        if (!choice) return

        // Check requirements
        if (!get().checkEventRequirements({ id: '', title: '', description: '', emoji: '', choices: [choice], triggerCondition: '', minAge: 0, maxAge: 999, probability: 1, packId: 'base', rarity: 'common', isHistorical: false }, state)) {
          // Check individual choice requirements
          const met = choice.requirements.every(req => {
            const val = (state.stats as unknown as Record<string, unknown>)[req.stat] ?? (state.finance as unknown as Record<string, unknown>)[req.stat] ?? (state.time as unknown as Record<string, unknown>)[req.stat]
            switch (req.operator) {
              case '>': return (val as number) > (req.value as number)
              case '<': return (val as number) < (req.value as number)
              case '>=': return (val as number) >= (req.value as number)
              case '<=': return (val as number) <= (req.value as number)
              case '==': return val === req.value
              case '!=': return val !== req.value
              default: return true
            }
          })
          if (!met) return
        }

        get().aggiornaStats(choice.effects)

        // Log
        const state2 = get()
        const logEntry: LogEntry = {
          id: uid(),
          year: state2.time.year,
          age: state2.time.age,
          text: `Hai scelto: ${choice.text}`,
          emoji: '✅',
          category: 'choice',
          statChanges: choice.effects,
        }

        set(s => ({
          currentEvent: null,
          availableChoices: [],
          eventLog: [logEntry, ...s.eventLog].slice(0, 100),
        }))

        get().checkGoals()
        get().checkMorte()
      },

      // ----- aggiornaStats -----
      aggiornaStats: (effects: Effect) => {
        set(state => {
          const s = state.stats
          const f = state.finance
          return {
            stats: {
              health: clamp(s.health + (effects.health ?? 0), 0, 100),
              mentalHealth: clamp(s.mentalHealth + (effects.mentalHealth ?? 0), 0, 100),
              happiness: clamp(s.happiness + (effects.happiness ?? 0), 0, 100),
              intelligence: clamp(s.intelligence + (effects.intelligence ?? 0), 0, 100),
              looks: clamp(s.looks + (effects.looks ?? 0), 0, 100),
              energy: clamp(s.energy + (effects.energy ?? 0), 0, 100),
              karma: clamp(s.karma + (effects.karma ?? 0), -100, 100),
              reputation: clamp(s.reputation + (effects.reputation ?? 0), 0, 100),
              socialReputation: clamp(s.socialReputation + (effects.socialReputation ?? 0), 0, 100),
            },
            finance: {
              ...f,
              money: f.money + (effects.money ?? 0),
            },
          }
        })
      },

      // ----- salvaGioco -----
      salvaGioco: () => {
        // Persist middleware handles this; manual trigger just forces sync
        const state = get()
        localStorage.setItem('lifesim2d_backup', JSON.stringify({
          identity: state.identity,
          time: state.time,
          stats: state.stats,
        }))
      },

      // ----- caricaGioco -----
      caricaGioco: () => {
        // Zustand persist auto-rehydrates; this can be used for manual import
      },

      // ----- resetGiorno -----
      resetGiorno: () => {
        set(state => ({
          stats: {
            ...state.stats,
            energy: clamp(state.stats.energy + 20, 0, 100),
          },
        }))
      },

      // ----- checkGoals -----
      checkGoals: () => {
        const state = get()
        const updated = state.goals.map(goal => {
          if (goal.completed) return goal
          try {
            const met = evaluateTrigger(goal.triggerCondition, state)
            if (met) {
              get().aggiornaStats(goal.reward)
              return { ...goal, completed: true, completedYear: state.time.year }
            }
          } catch {}
          return goal
        })
        const newCompleted = updated.filter(g => g.completed && !state.completedGoals.includes(g.id)).map(g => g.id)
        set(s => ({
          goals: updated,
          completedGoals: [...s.completedGoals, ...newCompleted],
        }))
      },

      // ----- checkMorte -----
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
          set({
            isGameOver: true,
            deathType,
            gameOverYear: state.time.year,
            currentEvent: null,
          })
        }
      },

      // ----- checkEventRequirements -----
      checkEventRequirements: (event: GameEvent, state: GameState) => {
        return evaluateTrigger(event.triggerCondition, state)
      },

      // ----- applyNazioneEffect -----
      applyNazioneEffect: () => {
        const state = get()
        if (!state.nation) return
        const bonus: Effect = {
          health: state.nation.healthRecoveryBonus * 0.1,
        }
        get().aggiornaStats(bonus)
      },

      // ----- setters -----
      setCurrentEvent: (event: GameEvent | null) => set({ currentEvent: event }),

      addLogEntry: (entry: Omit<LogEntry, 'id'>) => {
        set(s => ({
          eventLog: [{ ...entry, id: uid() }, ...s.eventLog].slice(0, 100),
        }))
      },

      addRelationship: (rel: Relationship) => {
        set(s => ({ relationships: [...s.relationships, rel] }))
      },

      updateRelationship: (id: string, updates: Partial<Relationship>) => {
        set(s => ({
          relationships: s.relationships.map(r => r.id === id ? { ...r, ...updates } : r),
        }))
      },

      removeRelationship: (id: string) => {
        set(s => ({ relationships: s.relationships.filter(r => r.id !== id) }))
      },
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
        eventLog: state.eventLog,
        settings: state.settings,
      }),
    }
  )
)
