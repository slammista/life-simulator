import { describe, it, expect, vi, afterEach } from 'vitest'
import { RomanticDynamicsEngine } from './RomanticDynamicsEngine'
import type { GameState, Relationship, RelationshipModel } from '../store/types'

function makeState(opts: { age?: number; year?: number; money?: number } = {}): GameState {
  return {
    time: { age: opts.age ?? 30, year: opts.year ?? 2024, month: 1 },
    stats: {
      health: 80, mentalHealth: 70, happiness: 60, intelligence: 65, looks: 60,
      energy: 70, karma: 10, reputation: 55, socialReputation: 50,
    },
    skills: { charisma: 50, leadership: 40, discipline: 45, socialSkill: 50, academicSkill: 40, athleticism: 30, music: 0, acting: 0, creativity: 20 },
    identity: { religion: 'catholicism', nationality: 'IT', sexualOrientation: 'heterosexual', gender: 'male' },
    finance: { money: opts.money ?? 5000 },
    children: [],
  } as unknown as GameState
}

function makeRel(overrides: Partial<Relationship> = {}): Relationship {
  return {
    id: 'rel_' + (overrides.id ?? 'a1b2c3'),
    npcId: overrides.npcId ?? 'npc_a1b2c3',
    name: 'Giulia Rossi',
    age: 29,
    gender: 'female',
    emoji: '👩',
    type: 'partner',
    stage: 'partner',
    trust: 60, jealousy: 30, attraction: 65, love: 70, respect: 60,
    toxicityTag: false,
    historyFlags: [],
    personalityTraits: ['empatico', 'leale'],
    mood: 'felice',
    memoryLog: [],
    isAlive: true,
    nationality: 'IT',
    ...overrides,
  }
}

afterEach(() => vi.restoreAllMocks())

describe('ensureProfile', () => {
  it('produces all 15 stats within 0..100 and is deterministic', () => {
    const rel = makeRel()
    const p1 = RomanticDynamicsEngine.ensureProfile(rel)
    const p2 = RomanticDynamicsEngine.ensureProfile(rel)
    expect(p1).toEqual(p2) // stable across calls for same NPC
    for (const v of Object.values(p1)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('reflects personality traits (leale → higher fidelity than impulsivo)', () => {
    const loyal = RomanticDynamicsEngine.ensureProfile(makeRel({ npcId: 'npc_loyal', personalityTraits: ['leale'] }))
    const impulsive = RomanticDynamicsEngine.ensureProfile(makeRel({ npcId: 'npc_loyal', personalityTraits: ['impulsivo'] }))
    expect(loyal.fidelity).toBeGreaterThan(impulsive.fidelity)
  })
})

describe('computeCompatibility', () => {
  it('returns four axes + overall, all bounded 0..100', () => {
    const state = makeState()
    const rel = makeRel()
    const player = RomanticDynamicsEngine.playerProfile(state)
    const npc = RomanticDynamicsEngine.ensureProfile(rel)
    const compat = RomanticDynamicsEngine.computeCompatibility(player, npc, rel, state)
    for (const v of [compat.mental, compat.affective, compat.sexual, compat.projectual, compat.overall]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('penalises a large age gap on the projectual axis', () => {
    const state = makeState({ age: 25 })
    const player = RomanticDynamicsEngine.playerProfile(state)
    const near = makeRel({ age: 26 })
    const far = makeRel({ age: 55 })
    const cNear = RomanticDynamicsEngine.computeCompatibility(player, RomanticDynamicsEngine.ensureProfile(near), near, state)
    const cFar = RomanticDynamicsEngine.computeCompatibility(player, RomanticDynamicsEngine.ensureProfile(far), far, state)
    expect(cNear.projectual).toBeGreaterThan(cFar.projectual)
  })
})

describe('classifyModel', () => {
  it('returns a valid model and is deterministic for the same inputs', () => {
    const state = makeState()
    const rel = makeRel()
    const player = RomanticDynamicsEngine.playerProfile(state)
    const npc = RomanticDynamicsEngine.ensureProfile(rel)
    const compat = RomanticDynamicsEngine.computeCompatibility(player, npc, rel, state)
    const valid: RelationshipModel[] = ['serious', 'dating', 'casual', 'fwb', 'open', 'poly']
    const m1 = RomanticDynamicsEngine.classifyModel(player, npc, compat, rel, state)
    const m2 = RomanticDynamicsEngine.classifyModel(player, npc, compat, rel, state)
    expect(valid).toContain(m1)
    expect(m1).toBe(m2)
  })
})

describe('annualTick', () => {
  it('never crashes and keeps relationship metrics bounded over many years', () => {
    let rels = [makeRel(), makeRel({ id: 'b', npcId: 'npc_b', name: 'Marco Bianchi', gender: 'male', personalityTraits: ['impulsivo', 'geloso'], type: 'spouse', stage: 'spouse' })]
    let state = makeState()
    for (let y = 0; y < 40; y++) {
      state = { ...state, time: { ...state.time, year: 2024 + y, age: 30 + y } }
      const res = RomanticDynamicsEngine.annualTick(state, rels)
      rels = res.relationships
      for (const r of rels) {
        for (const k of ['trust', 'love', 'respect', 'jealousy', 'attraction'] as const) {
          expect(r[k]).toBeGreaterThanOrEqual(0)
          expect(r[k]).toBeLessThanOrEqual(100)
        }
        if (r.bond) {
          for (const v of Object.values(r.bond)) {
            expect(v).toBeGreaterThanOrEqual(0)
            expect(v).toBeLessThanOrEqual(100)
          }
        }
      }
    }
  })

  it('caps romantic log messages to at most 3 per year', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.001) // force many events to fire
    const rels = Array.from({ length: 6 }, (_, i) =>
      makeRel({ id: 'r' + i, npcId: 'npc_' + i, love: 20, trust: 20, personalityTraits: ['impulsivo'] }))
    const res = RomanticDynamicsEngine.annualTick(makeState(), rels)
    expect(res.messages.length).toBeLessThanOrEqual(3)
  })

  it('leaves non-romantic relationships untouched in metrics', () => {
    const friend = makeRel({ type: 'friend', stage: 'friend', npcId: 'npc_friend' })
    const res = RomanticDynamicsEngine.annualTick(makeState(), [friend])
    const out = res.relationships[0]
    expect(out.trust).toBe(friend.trust)
    expect(out.love).toBe(friend.love)
  })

  it('open relationships rarely produce hidden, harmful infidelity', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.02)
    const open = makeRel({ relationshipModel: 'open', npcId: 'npc_open' })
    const res = RomanticDynamicsEngine.annualTick(makeState(), [open])
    const out = res.relationships[0]
    // an open partner does not get flagged as betraying the player
    expect(out.historyFlags).not.toContain('cheated_on_player')
  })
})
