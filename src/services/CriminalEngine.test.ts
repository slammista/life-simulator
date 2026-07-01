import { describe, it, expect, vi, afterEach } from 'vitest'
import { CriminalEngine } from './CriminalEngine'
import type { GameState } from '../store/types'

function makeState(overrides: Partial<{ age: number; inPrison: boolean; crimes: unknown[] }> = {}): GameState {
  return {
    time: { age: overrides.age ?? 25, year: 2024, month: 1 },
    stats: { intelligence: 50 },
    criminal: { inPrison: overrides.inPrison ?? false, crimes: overrides.crimes ?? [], prisonServed: 0, prisonSentence: 0 },
  } as unknown as GameState
}

afterEach(() => vi.restoreAllMocks())

describe('CriminalEngine.commitCrime — sentence pluralization', () => {
  // Regression test: "pickpocket" and "vandalism" both carry a 1-year sentence.
  // The arrest message used to read "Sentenza: 1 anni." (incorrect Italian
  // plural) for every crime with sentence === 1.
  it('uses the singular "anno" for a 1-year sentence', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // forces arrest (0 < arrestChance)
    const result = CriminalEngine.commitCrime('pickpocket', makeState())
    expect(result.arrested).toBe(true)
    expect(result.message).toContain('Sentenza: 1 anno.')
    expect(result.message).not.toContain('1 anni')
  })

  it('uses the plural "anni" for a multi-year sentence', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // forces arrest
    const result = CriminalEngine.commitCrime('burglary', makeState()) // sentence: 3
    expect(result.arrested).toBe(true)
    expect(result.message).toContain('Sentenza: 3 anni.')
  })
})
