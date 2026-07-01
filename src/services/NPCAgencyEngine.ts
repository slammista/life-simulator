import type { Effect, GameState, NPCAgencyEvent, NPCAgencyState, NPCMemory, Relationship } from '../store/types'

export interface NPCAgencyTickResult {
  relationships: Relationship[]
  agency: NPCAgencyState
  effects: Effect
  messages: string[]
  newEvents: NPCAgencyEvent[]
}

const CAREER_FLAGS = ['npc_teacher', 'npc_artist', 'npc_nurse', 'npc_founder', 'npc_manager', 'npc_freelancer']

const uid = () => `npc_agency_${Math.random().toString(36).slice(2, 10)}`

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function createEvent(params: Omit<NPCAgencyEvent, 'id'>): NPCAgencyEvent {
  return { ...params, id: uid() }
}

function appendMemory(rel: Relationship, description: string, year: number): Relationship {
  const category: NPCMemory['category'] = rel.type === 'colleague'
    ? 'professional'
    : rel.type === 'parent' || rel.type === 'sibling' || rel.type === 'child'
      ? 'family'
      : 'friendship'
  return {
    ...rel,
    memoryLog: [{
      id: Math.random().toString(36).slice(2, 10),
      category,
      description,
      year,
      weight: 2,
      decayFactor: 0.08,
      unforgettable: false,
    }, ...rel.memoryLog].slice(0, 200),
  }
}

export class NPCAgencyEngine {
  static initialState(): NPCAgencyState {
    return { events: [], totalEvents: 0 }
  }

  static ensure(state: Partial<NPCAgencyState> | undefined): NPCAgencyState {
    return {
      events: state?.events ?? [],
      totalEvents: state?.totalEvents ?? 0,
    }
  }

  static annualTick(state: GameState, relationships: Relationship[], opts?: { divineProtection?: boolean }): NPCAgencyTickResult {
    const agency = NPCAgencyEngine.ensure(state.npcAgency)
    const messages: string[] = []
    const events: NPCAgencyEvent[] = []
    const effects: Effect = {}

    const updatedRelationships = relationships.map(rel => {
      if (!rel.isAlive) return rel
      let next = rel
      const isClose = rel.trust >= 55 || rel.love >= 50 || rel.stage === 'spouse' || rel.stage === 'partner'
      const traitAmbitious = rel.personalityTraits.includes('ambizioso')
      const traitImpulsive = rel.personalityTraits.includes('impulsivo')
      const traitLoyal = rel.personalityTraits.includes('leale')

      if (rel.age >= 75 && Math.random() < (rel.age - 72) * 0.012) {
        const event = createEvent({
          npcId: rel.id,
          npcName: rel.name,
          type: 'death',
          year: state.time.year,
          age: state.time.age,
          description: `${rel.name} è morto/a a ${rel.age} ${rel.age === 1 ? 'anno' : 'anni'}.`,
          effects: isClose ? { happiness: -10, mentalHealth: -8 } : {},
        })
        events.push(event)
        messages.push(`🕯️ ${event.description}`)
        for (const [key, value] of Object.entries(event.effects)) effects[key] = (effects[key] ?? 0) + value
        return { ...next, isAlive: false, mood: 'triste' as const }
      }

      if (rel.stage === 'partner' && rel.love >= 72 && rel.trust >= 65 && Math.random() < 0.04) {
        const event = createEvent({
          npcId: rel.id,
          npcName: rel.name,
          type: 'married',
          year: state.time.year,
          age: state.time.age,
          description: `${rel.name} parla seriamente di matrimonio e stabilità.`,
          effects: { happiness: 6 },
        })
        events.push(event)
        messages.push(`💍 ${event.description}`)
        next = appendMemory({ ...next, stage: 'spouse', type: 'spouse', love: clamp(next.love + 8), trust: clamp(next.trust + 4), historyFlags: [...next.historyFlags, 'npc_agency_marriage'] }, event.description, state.time.year)
      }

      if ((rel.stage === 'spouse' || rel.stage === 'partner') && rel.love >= 68 && rel.age >= 20 && rel.age <= 45 && Math.random() < 0.035) {
        const event = createEvent({
          npcId: rel.id,
          npcName: rel.name,
          type: 'child_born',
          year: state.time.year,
          age: state.time.age,
          description: `${rel.name} immagina una famiglia più grande.`,
          effects: { happiness: 5, money: -800 },
        })
        events.push(event)
        messages.push(`👶 ${event.description}`)
        next = appendMemory({ ...next, love: clamp(next.love + 5), historyFlags: [...next.historyFlags, 'npc_agency_family_talk'] }, event.description, state.time.year)
      }

      // One career change per NPC: any career flag already present blocks new ones,
      // so the banner appears only once instead of every year.
      if (rel.type !== 'parent' && rel.type !== 'child' && rel.stage !== 'spouse' &&
          !CAREER_FLAGS.some(f => next.historyFlags.includes(f)) &&
          Math.random() < (traitAmbitious ? 0.055 : 0.025)) {
        const flag = CAREER_FLAGS[Math.floor(Math.random() * CAREER_FLAGS.length)]
        if (!next.historyFlags.includes(flag)) {
          const event = createEvent({
            npcId: rel.id,
            npcName: rel.name,
            type: 'career_change',
            year: state.time.year,
            age: state.time.age,
            description: `${rel.name} cambia percorso lavorativo.`,
            effects: isClose ? { socialReputation: 1 } : {},
          })
          events.push(event)
          messages.push(`💼 ${event.description}`)
          next = appendMemory({ ...next, respect: clamp(next.respect + 5), mood: 'motivato', historyFlags: [...next.historyFlags, flag] }, event.description, state.time.year)
        }
      }

      if (rel.trust <= 18 && rel.type !== 'parent' && rel.type !== 'child' && Math.random() < (traitImpulsive ? 0.08 : 0.035)) {
        const event = createEvent({
          npcId: rel.id,
          npcName: rel.name,
          type: 'relationship_broke',
          year: state.time.year,
          age: state.time.age,
          description: `${rel.name} prende le distanze dalla tua vita.`,
          effects: isClose ? { happiness: -5 } : {},
        })
        events.push(event)
        messages.push(`🚪 ${event.description}`)
        next = appendMemory({ ...next, stage: 'stranger', type: 'acquaintance', mood: 'triste', historyFlags: [...next.historyFlags, 'npc_agency_distanced'] }, event.description, state.time.year)
      } else if (rel.trust >= 45 && rel.trust < 70 && traitLoyal && Math.random() < 0.03) {
        const event = createEvent({
          npcId: rel.id,
          npcName: rel.name,
          type: 'reconciled',
          year: state.time.year,
          age: state.time.age,
          description: `${rel.name} prova a ricucire il rapporto.`,
          effects: { happiness: 3 },
        })
        events.push(event)
        messages.push(`🤝 ${event.description}`)
        next = appendMemory({ ...next, trust: clamp(next.trust + 8), mood: 'nostalgico' }, event.description, state.time.year)
      }

      // An NPC moves away at most once — never re-announce the same move
      if (rel.type !== 'parent' && rel.stage !== 'spouse' &&
          !next.historyFlags.includes('npc_agency_moved_away') &&
          Math.random() < 0.018) {
        const event = createEvent({
          npcId: rel.id,
          npcName: rel.name,
          type: 'moved_away',
          year: state.time.year,
          age: state.time.age,
          description: `${rel.name} si trasferisce e sarà più distante.`,
          effects: isClose ? { happiness: -3 } : {},
        })
        events.push(event)
        messages.push(`📦 ${event.description}`)
        next = appendMemory({ ...next, trust: clamp(next.trust - 8), historyFlags: [...next.historyFlags, 'npc_agency_moved_away'] }, event.description, state.time.year)
      }

      return next
    })

    // "Vestito da Dio" perk: the divine outfit shields the player from any
    // negative fallout of NPC actions — hostile effects are neutralized.
    if (opts?.divineProtection) {
      for (const key of Object.keys(effects)) {
        if (effects[key] < 0) effects[key] = 0
      }
    }

    return {
      relationships: updatedRelationships,
      agency: {
        events: [...events, ...agency.events].slice(0, 80),
        totalEvents: agency.totalEvents + events.length,
      },
      effects,
      messages,
      newEvents: events,
    }
  }
}
