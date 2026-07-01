import { describe, it, expect } from 'vitest'
import { LifePhaseEngine } from './LifePhaseEngine'
import type { GameState } from '../store/types'

function makeState(overrides: Partial<{ hasFriend: boolean; gpa: number; hobbies: unknown[]; parentTrust: number }> = {}): GameState {
  const hasFriend = overrides.hasFriend ?? true
  return {
    relationships: [
      ...(hasFriend ? [{ type: 'friend', isAlive: true, trust: 50 }] : []),
      { type: 'parent', isAlive: true, trust: overrides.parentTrust ?? 80 },
    ],
    education: { gpa: overrides.gpa ?? 3.5 },
    hobbies: overrides.hobbies ?? [],
  } as unknown as GameState
}

describe('LifePhaseEngine.buildRecap — missed-objective message grammar', () => {
  // Regression test: the "one objective missed" flavor text used to lower-case
  // an imperative button-style label ("Scopri un hobby") and drop it straight
  // into a sentence as if it were a noun phrase, producing broken Italian
  // ("...anche se scopri un hobby è rimasto in sospeso."). It's now quoted as
  // a named objective instead of being grammatically bent to fit.
  it('quotes the missed objective label instead of conjugating it', () => {
    const state = makeState({ hobbies: [] }) // friend + school + family met, hobby missed
    const recap = LifePhaseEngine.buildRecap('infanzia', state, 2012, 12)
    expect(recap.missedObjectives).toEqual(['Scopri un hobby'])
    expect(recap.summary).toContain('l\'obiettivo "Scopri un hobby" è rimasto in sospeso')
    expect(recap.summary).not.toMatch(/anche se scopri un hobby/i)
  })

  it('uses the perfect-chapter flavor when every objective is met', () => {
    const state = makeState({ hobbies: [{ id: 'reading' }] })
    const recap = LifePhaseEngine.buildRecap('infanzia', state, 2012, 12)
    expect(recap.missedObjectives).toEqual([])
    expect(recap.summary).toContain('Un capitolo perfetto')
  })
})
