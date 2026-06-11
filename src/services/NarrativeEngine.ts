import type {
  GameState, Effect, NarrativeState, NarrativeTraitId, PlayerIdentity, Relationship,
} from '../store/types'

// ---- Trait definitions ----

export interface NarrativeTraitDef {
  id: NarrativeTraitId
  label: string
  emoji: string
  color: string
  description: string
  startEffects: Effect
  startMusicSkill?: number
  annualTick: (state: GameState, newAge: number) => {
    effects: Effect
    message?: string
    musicSkillDelta?: number
    parentTrustDelta?: number
    siblingTrustDelta?: number
  } | null
}

export const TRAIT_DEFS: Record<NarrativeTraitId, NarrativeTraitDef> = {
  bambino_prodigio: {
    id: 'bambino_prodigio', label: 'Bambino Prodigio', emoji: '🧠', color: '#3b82f6',
    description: 'Una mente fuori dal comune, e tutte le aspettative che ne derivano.',
    startEffects: { intelligence: 20 },
    annualTick: (state, newAge) => {
      if (newAge > 18) return null
      const effects: Effect = { intelligence: 1 }
      if (state.stats.happiness < 50) {
        effects.mentalHealth = -1
        return { effects, message: '🧠 La pressione delle aspettative pesa su di te.' }
      }
      return { effects }
    },
  },
  famiglia_instabile: {
    id: 'famiglia_instabile', label: 'Famiglia Instabile', emoji: '⛈️', color: '#6b7280',
    description: 'A casa tua la serenità non è mai durata a lungo.',
    startEffects: { mentalHealth: -5 },
    annualTick: (_state, newAge) => {
      if (newAge >= 18) return null
      if (Math.random() < 0.15) {
        return {
          effects: { happiness: -2 },
          message: '⛈️ I tuoi genitori litigano ancora. La casa non è un porto sicuro.',
          parentTrustDelta: -2,
        }
      }
      return null
    },
  },
  nato_in_poverta: {
    id: 'nato_in_poverta', label: 'Nato in Povertà', emoji: '🏚️', color: '#f97316',
    description: 'Ogni euro conta, e tu lo sai da sempre.',
    startEffects: { money: -500 },
    annualTick: (state, newAge) => {
      if (newAge < 18) return { effects: { money: -300 } as Effect }
      // One-shot redemption memory handled in gameStore (needs makeMemory)
      if (state.finance.money >= 100000 && !state.narrative?.arcs.some(a => a.flags['riscatto'])) {
        return { effects: { happiness: 10 } as Effect, message: '🏚️→🏰 Da dove sei partito a dove sei arrivato: il riscatto è realtà.' }
      }
      return null
    },
  },
  genitori_famosi: {
    id: 'genitori_famosi', label: 'Genitori Famosi', emoji: '📸', color: '#ec4899',
    description: 'Tutti conoscono il tuo cognome prima ancora di conoscere te.',
    startEffects: { reputation: 20, socialReputation: 15 },
    annualTick: (_state, newAge) => {
      const effects: Effect = { socialReputation: 1 }
      if (newAge >= 6 && newAge <= 30 && Math.random() < 0.10) {
        effects.mentalHealth = -1
        return { effects, message: '📸 I paparazzi ti aspettano fuori. La privacy è un lusso che non hai.' }
      }
      return { effects }
    },
  },
  malattia_cronica: {
    id: 'malattia_cronica', label: 'Malattia Cronica', emoji: '💊', color: '#ef4444',
    description: 'Il tuo corpo combatte una battaglia silenziosa ogni giorno.',
    startEffects: { health: -10 },
    annualTick: () => {
      const effects: Effect = { health: -1, money: -200 }
      if (Math.random() < 0.12) {
        effects.energy = -2
        return { effects, message: '💊 Una ricaduta ti costringe a letto per settimane.' }
      }
      return { effects }
    },
  },
  famiglia_religiosa: {
    id: 'famiglia_religiosa', label: 'Famiglia Religiosa', emoji: '✝️', color: '#a78bfa',
    description: 'Sei cresciuto tra messe, precetti e valori non negoziabili.',
    startEffects: { karma: 10 },
    annualTick: (state) => {
      if (state.stats.karma < -20) {
        return { effects: { happiness: -1 }, message: '✝️ Il senso di colpa verso la tua educazione ti tormenta.' }
      }
      return null
    },
  },
  quartiere_pericoloso: {
    id: 'quartiere_pericoloso', label: 'Quartiere Pericoloso', emoji: '🌃', color: '#dc2626',
    description: 'Le strade dove sei cresciuto insegnano lezioni dure.',
    startEffects: {},
    annualTick: (_state, newAge) => {
      if (newAge < 10 || newAge > 25) return null
      if (Math.random() < 0.10) {
        const isFight = Math.random() < 0.5
        return isFight
          ? { effects: { health: -1 } as Effect, message: '🌃 Una rissa nel quartiere ti lascia il segno.' }
          : { effects: { karma: -1 } as Effect, message: '🌃 La strada offre scorciatoie. Oggi ne hai presa una piccola.' }
      }
      return null
    },
  },
  talento_musicale: {
    id: 'talento_musicale', label: 'Talento Musicale', emoji: '🎸', color: '#f59e0b',
    description: 'La musica ti scorre nelle vene da quando sei nato.',
    startEffects: {},
    startMusicSkill: 25,
    annualTick: (_state, newAge) => {
      if (newAge > 25) return null
      return { effects: {}, musicSkillDelta: 1 }
    },
  },
  fratello_rivale: {
    id: 'fratello_rivale', label: 'Fratello Rivale', emoji: '⚔️', color: '#8b5cf6',
    description: 'Con tuo fratello è sempre stata una gara, fin dal primo giorno.',
    startEffects: {},
    annualTick: (state) => {
      const arcDone = state.narrative?.arcs.some(a => a.arcId === 'rivale_di_sangue' && a.status !== 'active')
      if (arcDone) return null
      return { effects: {}, siblingTrustDelta: -1 }
    },
  },
}

// ---- Random trait assignment ----

const SCENARIO_IMPLIED: Record<string, NarrativeTraitId | null> = {
  poor: 'nato_in_poverta',
  prodigy: 'bambino_prodigio',
  celebrity: 'genitori_famosi',
  normal: null,
  rich: null,
  athlete: null,
}

export function rollTraits(scenarioId: string): NarrativeTraitId[] {
  const traits: NarrativeTraitId[] = []
  const implied = SCENARIO_IMPLIED[scenarioId] ?? null
  if (implied) traits.push(implied)

  const pool = (Object.keys(TRAIT_DEFS) as NarrativeTraitId[]).filter(t => !traits.includes(t))
  const randomOne = pool[Math.floor(Math.random() * pool.length)]
  traits.push(randomOne)

  // If scenario implied nothing, 50% chance of a second random trait
  if (!implied && Math.random() < 0.5) {
    const pool2 = pool.filter(t => t !== randomOne)
    traits.push(pool2[Math.floor(Math.random() * pool2.length)])
  }
  return traits
}

// ---- Origin story generation ----

const CITY_BY_BACKGROUND: Record<string, string[]> = {
  poor:         ['Napoli', 'Palermo', 'Catania'],
  lower_middle: ['Bari', 'Genova', 'Taranto'],
  middle:       ['Bologna', 'Torino', 'Firenze'],
  upper_middle: ['Verona', 'Padova', 'Brescia'],
  rich:         ['Milano', 'Roma'],
  elite:        ['Milano', 'Roma', 'Portofino'],
}

const SCENARIO_OPENING: Record<string, (city: string) => string> = {
  poor:      city => `Sei nato/a a ${city}, in una famiglia che conta ogni euro. L'ascensore è rotto da anni e nessuno verrà a ripararlo.`,
  rich:      city => `Sei nato/a a ${city}, in una casa dove non è mai mancato niente. Il tuo futuro sembra già scritto — ma sarà davvero il TUO futuro?`,
  prodigy:   city => `Sei nato/a a ${city}. A pochi mesi già fissavi i libri sugli scaffali. I tuoi genitori lo hanno capito subito: questo bambino è diverso.`,
  celebrity: city => `Sei nato/a a ${city}, sotto i flash dei fotografi. Il tuo primo vagito ha fatto notizia. Essere figlio/a di persone famose è un dono... e una condanna.`,
  athlete:   city => `Sei nato/a a ${city}, con gambe che non vogliono stare ferme. Tuo padre giura che hai dato il primo calcio prima ancora del primo respiro.`,
  normal:    city => `Sei nato/a a ${city}, in una famiglia come tante. Nessun privilegio, nessuna tragedia: solo una vita tutta da scrivere.`,
}

const TRAIT_STORY_LINE: Record<NarrativeTraitId, string> = {
  bambino_prodigio:    'C\'è qualcosa nei tuoi occhi: una scintilla che gli altri bambini non hanno.',
  famiglia_instabile:  'Ma le mura di casa tremano spesso: le urla dei tuoi genitori sono la tua ninna nanna.',
  nato_in_poverta:     'Il frigorifero è spesso mezzo vuoto, ma tua madre riesce sempre a inventare una cena.',
  genitori_famosi:     'Ovunque andiate, la gente sussurra e indica. Il vostro cognome arriva sempre prima di voi.',
  malattia_cronica:    'I medici hanno trovato qualcosa, fin dai primi mesi. Dovrai conviverci per tutta la vita.',
  famiglia_religiosa:  'Ogni domenica, messa. Ogni pasto, una preghiera. La fede è il pilastro della tua casa.',
  quartiere_pericoloso:'Di notte si sentono le sirene. Tua madre ti stringe forte quando passate davanti a certi portoni.',
  talento_musicale:    'Quando piangevi, solo la musica ti calmava. Il nonno dice che è un segno del destino.',
  fratello_rivale:     'E poi c\'è tuo fratello: dal primo giorno vi guardate come due galli nello stesso pollaio.',
}

export function buildOriginStory(
  identity: PlayerIdentity,
  scenarioId: string,
  traits: NarrativeTraitId[],
  relationships: Relationship[],
): string {
  const cities = CITY_BY_BACKGROUND[identity.familyBackground] ?? ['Roma']
  const city = cities[Math.floor(Math.random() * cities.length)]
  const opening = (SCENARIO_OPENING[scenarioId] ?? SCENARIO_OPENING.normal)(city)

  const mother = relationships.find(r => r.type === 'parent' && r.gender === 'female')
  const father = relationships.find(r => r.type === 'parent' && r.gender === 'male')
  const parentLines: string[] = []
  if (father) parentLines.push(`Tuo padre ${father.name.split(' ')[0]} ${identity.familyBackground === 'poor' ? 'lavora dall\'alba al tramonto per portare a casa quel che serve' : identity.familyBackground === 'rich' || identity.familyBackground === 'elite' ? 'gestisce affari di cui parla solo a mezza voce' : 'fa il possibile per non far mancare niente'}.`)
  if (mother) parentLines.push(`Tua madre ${mother.name.split(' ')[0]} ti guarda e sogna in grande per te.`)

  const traitLines = traits.map(t => TRAIT_STORY_LINE[t]).filter(Boolean)

  return [opening, ...parentLines, ...traitLines, 'Cosa farai della tua vita?'].join('\n\n')
}

// ---- Engine ----

export class NarrativeEngine {
  static initialState(): NarrativeState {
    return {
      traits: [],
      originStory: null,
      arcs: [],
      npcRequestHistory: [],
      lastNpcRequestAge: 0,
      phaseRecaps: [],
    }
  }

  /** Migration-safe hydration for old saves */
  static ensure(partial: unknown): NarrativeState {
    const p = (partial ?? {}) as Partial<NarrativeState>
    return {
      traits: Array.isArray(p.traits) ? p.traits : [],
      originStory: p.originStory ?? null,
      arcs: Array.isArray(p.arcs) ? p.arcs : [],
      npcRequestHistory: Array.isArray(p.npcRequestHistory) ? p.npcRequestHistory : [],
      lastNpcRequestAge: typeof p.lastNpcRequestAge === 'number' ? p.lastNpcRequestAge : 0,
      phaseRecaps: Array.isArray(p.phaseRecaps) ? p.phaseRecaps : [],
    }
  }

  static applyStartEffects(traits: NarrativeTraitId[]): Effect {
    const out: Effect = {}
    for (const t of traits) {
      const def = TRAIT_DEFS[t]
      if (!def) continue
      for (const [k, v] of Object.entries(def.startEffects)) {
        out[k] = (out[k] ?? 0) + v
      }
    }
    return out
  }

  static startMusicSkill(traits: NarrativeTraitId[]): number {
    return traits.reduce((sum, t) => sum + (TRAIT_DEFS[t]?.startMusicSkill ?? 0), 0)
  }

  static annualTick(state: GameState, newAge: number): {
    effects: Effect
    messages: string[]
    musicSkillDelta: number
    parentTrustDelta: number
    siblingTrustDelta: number
  } {
    const effects: Effect = {}
    const messages: string[] = []
    let musicSkillDelta = 0
    let parentTrustDelta = 0
    let siblingTrustDelta = 0

    for (const traitId of state.narrative?.traits ?? []) {
      const def = TRAIT_DEFS[traitId]
      if (!def) continue
      const res = def.annualTick(state, newAge)
      if (!res) continue
      for (const [k, v] of Object.entries(res.effects)) {
        effects[k] = (effects[k] ?? 0) + v
      }
      if (res.message) messages.push(res.message)
      musicSkillDelta += res.musicSkillDelta ?? 0
      parentTrustDelta += res.parentTrustDelta ?? 0
      siblingTrustDelta += res.siblingTrustDelta ?? 0
    }

    return { effects, messages, musicSkillDelta, parentTrustDelta, siblingTrustDelta }
  }
}
