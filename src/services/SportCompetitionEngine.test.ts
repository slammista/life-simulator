import { describe, it, expect, vi, afterEach } from 'vitest'
import { SportCompetitionEngine } from './SportCompetitionEngine'
import type { GameState, Sport } from '../store/types'

function makeSport(overrides: Partial<Sport> = {}): Sport {
  return {
    id: 'calcio',
    name: 'Calcio',
    skillLevel: 40,
    practiceHoursPerWeek: 4,
    yearStarted: 2018,
    competitionsEntered: 0,
    competitionsWon: 0,
    injuries: 0,
    isProfessional: false,
    fame: 0,
    packId: 'base',
    ...overrides,
  }
}

function makeState(opts: {
  age?: number
  health?: number
  sports?: Sport[]
  diminishingReturns?: Record<string, number>
} = {}): GameState {
  return {
    time: { age: opts.age ?? 20, year: 2024, month: 1 },
    stats: { health: opts.health ?? 80, energy: 70, happiness: 60 },
    sports: opts.sports ?? [makeSport()],
    diminishingReturns: opts.diminishingReturns ?? {},
  } as unknown as GameState
}

afterEach(() => vi.restoreAllMocks())

describe('SportCompetitionEngine.getLevelForSkill', () => {
  it('maps skill brackets to competition levels', () => {
    expect(SportCompetitionEngine.getLevelForSkill(5)).toBe('locale')
    expect(SportCompetitionEngine.getLevelForSkill(30)).toBe('regionale')
    expect(SportCompetitionEngine.getLevelForSkill(50)).toBe('nazionale')
    expect(SportCompetitionEngine.getLevelForSkill(70)).toBe('internazionale')
    expect(SportCompetitionEngine.getLevelForSkill(85)).toBe('olimpico')
    expect(SportCompetitionEngine.getLevelForSkill(100)).toBe('olimpico')
  })
})

describe('SportCompetitionEngine.canEnter', () => {
  it('refuses a sport the player does not practice', () => {
    const r = SportCompetitionEngine.canEnter('tennis', makeState())
    expect(r.can).toBe(false)
    expect(r.reason).toContain('Non pratichi')
  })

  it('refuses after 2 competitions in the same year', () => {
    const state = makeState({ diminishingReturns: { competition_calcio_2024: 2 } })
    expect(SportCompetitionEngine.canEnter('calcio', state).can).toBe(false)
  })

  it('refuses when health is too low', () => {
    expect(SportCompetitionEngine.canEnter('calcio', makeState({ health: 15 })).can).toBe(false)
  })

  it('refuses when skill is below 10', () => {
    const state = makeState({ sports: [makeSport({ skillLevel: 5 })] })
    expect(SportCompetitionEngine.canEnter('calcio', state).can).toBe(false)
  })

  it('allows a healthy, skilled athlete with entries remaining', () => {
    expect(SportCompetitionEngine.canEnter('calcio', makeState()).can).toBe(true)
  })
})

describe('SportCompetitionEngine.enterCompetition', () => {
  it('returns an injury when the injury roll hits', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // below any injuryRisk * 0.3
    const r = SportCompetitionEngine.enterCompetition('calcio', makeState())
    expect(r.outcome).toBe('infortunio')
    expect(r.effects.health).toBeLessThan(0)
    expect(r.skillGain).toBe(0)
  })

  it('returns a defeat when every roll is unfavorable', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const r = SportCompetitionEngine.enterCompetition('calcio', makeState())
    expect(r.outcome).toBe('sconfitta')
    expect(r.effects.money).toBeLessThan(0) // entry fee, no prize
    expect(r.effects.fame).toBeUndefined()
  })

  it('produces a win with prize money and fame for a strong roll after the injury check', () => {
    // 1st call: injury check (must be >= risk*0.3) → 0.2 is safe for calcio (0.054)
    // 2nd call: outcome roll → small value lands in the win band
    // 3rd call: prize randomness
    const rolls = [0.2, 0.05, 0.5]
    let i = 0
    vi.spyOn(Math, 'random').mockImplementation(() => rolls[Math.min(i++, rolls.length - 1)])
    const state = makeState({ sports: [makeSport({ skillLevel: 60 })], age: 25, health: 90 })
    const r = SportCompetitionEngine.enterCompetition('calcio', state)
    expect(['vittoria', 'eccezionale']).toContain(r.outcome)
    expect(r.level).toBe('nazionale')
    expect(r.effects.money).toBeGreaterThan(0)
    expect(r.effects.fame).toBeGreaterThan(0)
    expect(r.skillGain).toBeGreaterThanOrEqual(4)
  })

  it('matches the competition level to the athlete skill', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const state = makeState({ sports: [makeSport({ skillLevel: 90 })] })
    const r = SportCompetitionEngine.enterCompetition('calcio', state)
    expect(r.level).toBe('olimpico')
  })
})
