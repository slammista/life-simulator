import type { Effect, GameState } from '../store/types'

export type CausalityCategory = 'life' | 'finance' | 'relationship' | 'health' | 'career' | 'chaos' | 'legacy'

export interface CausalityEntry {
  id: string
  year: number
  age: number
  title: string
  description: string
  emoji: string
  category: CausalityCategory
  weight: number
  effects: Effect
  consequences: string[]
}

function effectWeight(effects: Effect) {
  return Object.values(effects).reduce((sum, value) => sum + Math.abs(Number(value) || 0), 0)
}

function categoryFromLog(category: string): CausalityCategory {
  if (category === 'finance' || category === 'gambling') return 'finance'
  if (category === 'social') return 'relationship'
  if (category === 'health') return 'health'
  if (category === 'career' || category === 'education') return 'career'
  return 'life'
}

function consequencesFromEffects(effects: Effect) {
  const consequences: string[] = []
  if ((effects.money ?? 0) !== 0) consequences.push(`${(effects.money ?? 0) > 0 ? 'Guadagno' : 'Perdita'} economica`)
  if ((effects.health ?? 0) < 0 || (effects.mentalHealth ?? 0) < 0) consequences.push('Impatto sul benessere')
  if ((effects.reputation ?? 0) !== 0 || (effects.socialReputation ?? 0) !== 0) consequences.push('Reputazione modificata')
  if ((effects.happiness ?? 0) !== 0) consequences.push('Umore influenzato')
  if ((effects.karma ?? 0) !== 0) consequences.push('Conseguenza morale')
  return consequences
}

export class CausalityEngine {
  static buildTimeline(state: GameState): CausalityEntry[] {
    const logEntries = state.eventLog.map(entry => {
      const weight = effectWeight(entry.statChanges)
      return {
        id: `log_${entry.id}`,
        year: entry.year,
        age: entry.age,
        title: entry.text.split(' · ')[0],
        description: entry.text,
        emoji: entry.emoji,
        category: categoryFromLog(entry.category),
        weight,
        effects: entry.statChanges,
        consequences: consequencesFromEffects(entry.statChanges),
      } satisfies CausalityEntry
    })

    const traumaEntries = (state.health.traumas ?? []).map(trauma => ({
      id: `trauma_${trauma.id}`,
      year: trauma.year,
      age: Math.max(0, trauma.year - state.identity.birthYear),
      title: trauma.description,
      description: trauma.resolved
        ? `${trauma.description} è stata elaborata nel tempo.`
        : `${trauma.description} resta un trigger emotivo attivo.`,
      emoji: trauma.resolved ? '🕊️' : '🧠',
      category: 'health' as const,
      weight: trauma.severity * 20 + trauma.intensity,
      effects: { mentalHealth: -trauma.severity },
      consequences: trauma.resolved ? ['Ferita emotiva elaborata'] : ['Trauma persistente', 'Trigger futuri possibili'],
    }))

    const chaosEntries = (state.chaos?.triggeredEvents ?? []).map(event => ({
      id: `chaos_${event.id}`,
      year: event.year,
      age: event.age,
      title: event.title,
      description: event.description,
      emoji: '🧨',
      category: 'chaos' as const,
      weight: event.severity * 35,
      effects: event.effects,
      consequences: ['Evento raro ad alto impatto', ...consequencesFromEffects(event.effects)],
    }))

    const investmentEntries = state.finance.investments.map(inv => {
      const gain = inv.currentValue - inv.amount
      return {
        id: `investment_${inv.id}`,
        year: Number(inv.purchaseDate) || state.time.year,
        age: Math.max(0, (Number(inv.purchaseDate) || state.time.year) - state.identity.birthYear),
        title: `Investimento in ${inv.name}`,
        description: `Capitale iniziale €${inv.amount.toLocaleString('it-IT')}, valore attuale €${inv.currentValue.toLocaleString('it-IT')}.`,
        emoji: gain >= 0 ? '📈' : '📉',
        category: 'finance' as const,
        weight: Math.min(100, Math.abs(gain) / 1000),
        effects: { money: gain },
        consequences: [gain >= 0 ? 'Capitale cresciuto' : 'Capitale ridotto'],
      }
    })

    const npcAgencyEntries = (state.npcAgency?.events ?? []).map(event => ({
      id: `npc_agency_${event.id}`,
      year: event.year,
      age: event.age,
      title: event.npcName,
      description: event.description,
      emoji: event.type === 'death' ? '🕯️' : event.type === 'married' ? '💍' : event.type === 'child_born' ? '👶' : '👤',
      category: 'relationship' as const,
      weight: event.type === 'death' ? 70 : event.type === 'relationship_broke' ? 45 : 25,
      effects: event.effects,
      consequences: ['Vita autonoma NPC', ...consequencesFromEffects(event.effects)],
    }))

    const legacyEntry = state.legacy ? [{
      id: 'legacy_current',
      year: Number(state.legacy.deathDate) || state.time.year,
      age: state.time.age,
      title: 'Eredità familiare',
      description: `Legacy score ${state.legacy.legacyScore}. Figli eredi: ${state.legacy.children.length}.`,
      emoji: '🧬',
      category: 'legacy' as const,
      weight: Math.min(100, state.legacy.legacyScore / 10),
      effects: {},
      consequences: ['Influenza la generazione successiva'],
    }] : []

    return [...logEntries, ...traumaEntries, ...chaosEntries, ...investmentEntries, ...npcAgencyEntries, ...legacyEntry]
      .sort((a, b) => b.year - a.year || b.weight - a.weight)
      .slice(0, 120)
  }

  static summarize(state: GameState) {
    const timeline = CausalityEngine.buildTimeline(state)
    const major = timeline.filter(entry => entry.weight >= 20).length
    const categories = timeline.reduce<Record<CausalityCategory, number>>((acc, entry) => {
      acc[entry.category] = (acc[entry.category] ?? 0) + 1
      return acc
    }, { life: 0, finance: 0, relationship: 0, health: 0, career: 0, chaos: 0, legacy: 0 })
    return { total: timeline.length, major, categories }
  }
}
