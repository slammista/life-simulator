import { describe, it, expect, vi, afterEach } from 'vitest'
import { SpecialCareerEngine, initialSpecialCareer } from './SpecialCareerEngine'
import type { SpecialCareer, SpecialCareerType } from './SpecialCareerEngine'
import type { GameState } from '../store/types'

function makeState(opts: {
  age?: number
  year?: number
  diminishingReturns?: Record<string, number>
} = {}): GameState {
  return {
    time: { age: opts.age ?? 25, year: opts.year ?? 2024, month: 1 },
    stats: { health: 80, energy: 70, happiness: 60, socialReputation: 50 },
    diminishingReturns: opts.diminishingReturns ?? {},
  } as unknown as GameState
}

function makeCareer(type: SpecialCareerType, overrides: Partial<SpecialCareer> = {}): SpecialCareer {
  return { ...initialSpecialCareer(type, 2024), ...overrides }
}

afterEach(() => vi.restoreAllMocks())

describe('initialSpecialCareer', () => {
  it('starts every career in the aspiring phase with no income', () => {
    const c = initialSpecialCareer('actor', 2024)
    expect(c.phase).toBe('aspiring')
    expect(c.income).toBe(0)
    expect(c.projectsCompleted).toBe(0)
  })
})

describe('SpecialCareerEngine.getAvailableActions', () => {
  it('only exposes aspiring-phase actions to a new career', () => {
    const actions = SpecialCareerEngine.getAvailableActions(makeCareer('actor'), makeState())
    const ids = actions.map(a => a.id)
    expect(ids).toContain('actor_audition')
    expect(ids).not.toContain('actor_tv_role')      // emerging
    expect(ids).not.toContain('actor_film_role')    // established
  })

  it('unlocks higher-phase actions as the career advances', () => {
    const career = makeCareer('musician', { phase: 'established' })
    const ids = SpecialCareerEngine.getAvailableActions(career, makeState()).map(a => a.id)
    expect(ids).toContain('musician_album')
    expect(ids).toContain('musician_tour')
    expect(ids).not.toContain('musician_world_tour') // successful only
  })

  it('hides actions that hit their annual usage cap', () => {
    const state = makeState({ diminishingReturns: { sc_actor_audition_2024: 4 } })
    const ids = SpecialCareerEngine.getAvailableActions(makeCareer('actor'), state).map(a => a.id)
    expect(ids).not.toContain('actor_audition')
  })

  it('offers nothing to a retired career', () => {
    const career = makeCareer('pro_athlete', { phase: 'retired' })
    expect(SpecialCareerEngine.getAvailableActions(career, makeState())).toHaveLength(0)
  })
})

describe('SpecialCareerEngine.performAction', () => {
  it('rejects unknown action ids', () => {
    const r = SpecialCareerEngine.performAction(makeCareer('actor'), 'nonexistent', makeState())
    expect(r.success).toBe(false)
  })

  it('grants reputation, fame and earnings on success', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // force success
    const r = SpecialCareerEngine.performAction(makeCareer('actor'), 'actor_audition', makeState())
    expect(r.success).toBe(true)
    expect(r.reputationChange).toBeGreaterThan(0)
    expect(r.fameChange).toBeGreaterThan(0)
    expect(r.effects.energy).toBeLessThan(0)
  })

  it('applies penalties on failure', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999) // force failure
    const r = SpecialCareerEngine.performAction(makeCareer('musician'), 'musician_gig', makeState())
    expect(r.success).toBe(false)
    expect(r.reputationChange).toBeLessThan(0)
    expect(r.effects.happiness).toBeLessThan(0)
  })

  it('advances the phase once enough projects are completed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const career = makeCareer('actor', { projectsCompleted: 1 }) // aspiring threshold = 2
    const r = SpecialCareerEngine.performAction(career, 'actor_audition', makeState())
    expect(r.phaseAdvanced).toBe(true)
    expect(r.newPhase).toBe('emerging')
  })
})

describe('SpecialCareerEngine.annualTick', () => {
  it('pays a year of passive income for an established career', () => {
    const career = makeCareer('musician', { phase: 'established' })
    const { effects } = SpecialCareerEngine.annualTick(career, makeState())
    expect(effects.money).toBe(2000 * 12)
  })

  it('decays fame when the player takes no career actions', () => {
    const career = makeCareer('actor', { fame: 50, reputation: 40 })
    const { updatedCareer } = SpecialCareerEngine.annualTick(career, makeState())
    expect(updatedCareer.fame).toBe(47)
    expect(updatedCareer.reputation).toBe(39)
  })

  it('moves an athlete past 35 into decline', () => {
    const career = makeCareer('pro_athlete', { phase: 'successful' })
    const { updatedCareer } = SpecialCareerEngine.annualTick(career, makeState({ age: 36 }))
    expect(updatedCareer.phase).toBe('declining')
  })
})
