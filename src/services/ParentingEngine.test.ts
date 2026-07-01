import { describe, it, expect } from 'vitest'
import { ParentingEngine, PARENTING_ACTIONS, type ParentingAction } from './ParentingEngine'
import type { GameState, Child } from '../store/types'

function makeChild(overrides: Partial<Child> = {}): Child {
  return {
    id: 'child1', name: 'Ilaria', age: 5, gender: 'female',
    intelligence: 50, looks: 50, health: 80, happiness: 70,
    personalityTraits: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
    bondWithPlayer: 50, respectForPlayer: 50, schoolLevel: 'elementary',
    careerPath: null, relationshipStatus: 'child', specialNeeds: [], isAdopted: true,
    ...overrides,
  }
}

function makeState(child: Child): GameState {
  return {
    time: { age: 30, year: 2024, month: 1 },
    children: [child],
    diminishingReturns: {},
    finance: { money: 10000 },
  } as unknown as GameState
}

describe('ParentingEngine.interactWithChild — result message grammar', () => {
  // Regression test: every action's `label` is an imperative button prompt
  // ("Gioca insieme", "Punisci (timeout)") that used to be lower-cased and
  // concatenated straight after "Hai", producing broken Italian like
  // "Hai gioca insieme con Ilaria." Each action now has its own past-tense
  // phrasing for the confirmation message.
  it.each(PARENTING_ACTIONS.map(a => a.id))('produces grammatically valid past tense for "%s"', (actionId: ParentingAction) => {
    const child = makeChild()
    const state = makeState(child)
    const result = ParentingEngine.interactWithChild(child.id, actionId, state)
    expect(result.success).toBe(true)
    expect(result.message).toContain('Hai ')
    // None of the old broken imperative fragments should ever appear verbatim
    expect(result.message).not.toMatch(/Hai (gioca|leggi|aiuta|punisci|loda|fai|parla|insegna|attività) /i)
    expect(result.message).toContain(child.name)
  })

  it('reports a strengthening bond for a positive action', () => {
    const child = makeChild()
    const result = ParentingEngine.interactWithChild(child.id, 'play', makeState(child))
    expect(result.message).toBe('🎮 Hai giocato insieme a Ilaria. Il vostro legame si rafforza.')
  })

  it('reports a weakening bond for punishment', () => {
    const child = makeChild()
    const result = ParentingEngine.interactWithChild(child.id, 'punish', makeState(child))
    expect(result.message).toBe('⛔ Hai punito Ilaria (timeout). Il vostro legame si indebolisce.')
  })
})
