import { describe, it, expect } from 'vitest'
import { SportEngine, getAllSportDefs, getSportDef } from './SportEngine'
import type { GameState, Sport } from '../store/types'

function makeState(opts: { age?: number; sports?: Sport[]; energy?: number; dr?: Record<string, number> } = {}): GameState {
  return {
    time: { age: opts.age ?? 25, year: 2020, month: 1 },
    sports: opts.sports ?? [],
    stats: { energy: opts.energy ?? 80 },
    diminishingReturns: opts.dr ?? {},
  } as unknown as GameState
}

describe('SportEngine catalog', () => {
  it('exposes a broad catalog of sports', () => {
    const defs = getAllSportDefs()
    expect(defs.length).toBeGreaterThanOrEqual(20)
  })

  it('has no duplicate sport ids', () => {
    const ids = getAllSportDefs().map(d => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes the migrated legacy sports', () => {
    expect(getSportDef('nuoto')).toBeTruthy()
    expect(getSportDef('atletica')).toBeTruthy()
    expect(getSportDef('arti_marziali')).toBeTruthy()
  })
})

describe('SportEngine.startSport', () => {
  it('starts a new sport with a fresh instance', () => {
    const r = SportEngine.startSport('calcio', makeState({ age: 12 }))
    expect(r.success).toBe(true)
    expect(r.newSport?.id).toBe('calcio')
    expect(r.newSport?.skillLevel).toBe(5)
    expect(r.newSport?.competitionsWon).toBe(0)
    expect(r.effects.money).toBeLessThan(0)
  })

  it('rejects an unknown sport', () => {
    const r = SportEngine.startSport('quidditch', makeState())
    expect(r.success).toBe(false)
  })

  it('rejects a sport already practiced', () => {
    const existing = SportEngine.startSport('tennis', makeState({ age: 20 })).newSport!
    const r = SportEngine.startSport('tennis', makeState({ age: 20, sports: [existing] }))
    expect(r.success).toBe(false)
  })

  it('enforces the minimum starting age', () => {
    const r = SportEngine.startSport('mma', makeState({ age: 10 })) // mma minAge 14
    expect(r.success).toBe(false)
  })
})

describe('SportEngine.practiceSport', () => {
  const owned = SportEngine.startSport('nuoto', makeState({ age: 20 })).newSport!

  it('rejects practising a sport you do not have', () => {
    const r = SportEngine.practiceSport('nuoto', makeState({ age: 20 }))
    expect(r.success).toBe(false)
  })

  it('trains an owned sport, costing energy and money', () => {
    const r = SportEngine.practiceSport('nuoto', makeState({ age: 20, sports: [owned] }))
    expect(r.success).toBe(true)
    expect(r.effects.energy).toBeLessThan(0)
    expect(r.effects.money).toBeLessThan(0)
    expect((r.skillGain ?? 0)).toBeGreaterThan(0)
  })

  it('blocks over-training after the annual limit', () => {
    const dr = { 'sport_nuoto_2020': 4 }
    const r = SportEngine.practiceSport('nuoto', makeState({ age: 20, sports: [owned], dr }))
    expect(r.success).toBe(false)
  })
})

describe('SportEngine.annualTick', () => {
  it('decays skill when a sport was not practised', () => {
    const owned = SportEngine.startSport('boxe', makeState({ age: 20 })).newSport!
    const { updates } = SportEngine.annualTick(makeState({ age: 21, sports: [owned] }))
    const u = updates.find(x => x.id === 'boxe')
    expect(u).toBeTruthy()
    expect(u!.skillDelta).toBeLessThan(0)
  })

  it('grows skill when a sport was practised this year', () => {
    const owned = SportEngine.startSport('tennis', makeState({ age: 20 })).newSport!
    const dr = { 'sport_tennis_2020': 2 }
    const { updates } = SportEngine.annualTick(makeState({ age: 20, sports: [owned], energy: 80, dr }))
    const u = updates.find(x => x.id === 'tennis')
    expect(u!.skillDelta).toBeGreaterThanOrEqual(0)
  })
})
