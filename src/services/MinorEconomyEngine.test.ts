import { describe, it, expect, vi, afterEach } from 'vitest'
import { MinorEconomyEngine } from './MinorEconomyEngine'
import type { GameState, Relationship } from '../store/types'

function makeParent(overrides: Partial<Relationship> = {}): Relationship {
  return {
    id: 'p1',
    name: 'Mamma',
    type: 'parent',
    isAlive: true,
    trust: 70,
    love: 70,
    respect: 70,
    stage: 'family',
    age: 45,
    gender: 'female',
    personalityTraits: [],
    historyFlags: [],
    memoryLog: [],
    mood: 'neutro',
    ...overrides,
  } as unknown as Relationship
}

function makeState(age: number, opts: { parents?: Relationship[]; tier?: string; karma?: number } = {}): GameState {
  return {
    time: { age, year: 2020, month: 1 },
    relationships: opts.parents ?? [],
    family: { familyWealthTier: opts.tier ?? 'middle' },
    stats: { karma: opts.karma ?? 0 },
  } as unknown as GameState
}

afterEach(() => vi.restoreAllMocks())

describe('MinorEconomyEngine.isMinor', () => {
  it('treats under-18 as minor', () => {
    expect(MinorEconomyEngine.isMinor(makeState(17))).toBe(true)
    expect(MinorEconomyEngine.isMinor(makeState(18))).toBe(false)
    expect(MinorEconomyEngine.isMinor(makeState(30))).toBe(false)
  })
})

describe('MinorEconomyEngine.evaluateExpense', () => {
  it('lets adults pay themselves and never marks parent payment', () => {
    const r = MinorEconomyEngine.evaluateExpense(makeState(25), 500, 'Tennis')
    expect(r.isMinor).toBe(false)
    expect(r.approved).toBe(true)
    expect(r.paidByParents).toBe(false)
  })

  it('approves a free action for a minor without needing payment', () => {
    const r = MinorEconomyEngine.evaluateExpense(makeState(12, { parents: [makeParent()] }), 0, 'Corsa')
    expect(r.approved).toBe(true)
    expect(r.paidByParents).toBe(false)
  })

  it('refuses a paid action for a minor with no living parents', () => {
    const r = MinorEconomyEngine.evaluateExpense(makeState(12, { parents: [] }), 100, 'Calcio')
    expect(r.approved).toBe(false)
    expect(r.reason).toBe('no_parents')
  })

  it('refuses when the cost exceeds the household budget', () => {
    const state = makeState(14, { parents: [makeParent()], tier: 'poor' })
    const r = MinorEconomyEngine.evaluateExpense(state, 5000, 'Equitazione')
    expect(r.approved).toBe(false)
    expect(r.reason).toBe('insufficient_parent_funds')
  })

  it('approves and bills the parents when they say yes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // force approval
    const state = makeState(10, { parents: [makeParent({ trust: 90 })], tier: 'rich' })
    const r = MinorEconomyEngine.evaluateExpense(state, 120, 'Nuoto')
    expect(r.approved).toBe(true)
    expect(r.paidByParents).toBe(true)
  })

  it('refuses when the parents are not convinced', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999) // force refusal
    const state = makeState(10, { parents: [makeParent({ trust: 30 })], tier: 'poor' })
    const r = MinorEconomyEngine.evaluateExpense(state, 300, 'Sci')
    expect(r.approved).toBe(false)
    expect(r.paidByParents).toBe(false)
  })
})

describe('MinorEconomyEngine.adjustEffects', () => {
  it('removes the negative money cost when parents pay', () => {
    const out = MinorEconomyEngine.adjustEffects({ money: -200, happiness: 5, energy: -5 }, true)
    expect(out.money).toBeUndefined()
    expect(out.happiness).toBe(5)
    expect(out.energy).toBe(-5)
  })

  it('keeps effects intact when the character pays themselves', () => {
    const out = MinorEconomyEngine.adjustEffects({ money: -200, happiness: 5 }, false)
    expect(out.money).toBe(-200)
    expect(out.happiness).toBe(5)
  })

  it('never strips positive money (e.g. winnings)', () => {
    const out = MinorEconomyEngine.adjustEffects({ money: 100 }, true)
    expect(out.money).toBe(100)
  })
})
