import type { GameState, Relationship, Effect } from '../store/types'

export type DatingApp = 'tinder' | 'bumble' | 'hinge' | 'okCupid'

interface DatingAppDef {
  id: DatingApp; name: string; emoji: string; premium: number
  ageRange: [number, number]; matchRate: number
}

const APPS: DatingAppDef[] = [
  { id: 'tinder',  name: 'Tinder',   emoji: '🔥', premium: 20, ageRange: [18, 40], matchRate: 0.25 },
  { id: 'bumble',  name: 'Bumble',   emoji: '🐝', premium: 25, ageRange: [20, 40], matchRate: 0.20 },
  { id: 'hinge',   name: 'Hinge',    emoji: '💎', premium: 30, ageRange: [22, 38], matchRate: 0.18 },
  { id: 'okCupid', name: 'OkCupid',  emoji: '💌', premium: 20, ageRange: [18, 45], matchRate: 0.15 },
]

const NAMES_MALE = ['Marco', 'Luca', 'Andrea', 'Matteo', 'Lorenzo', 'Davide', 'Riccardo', 'Francesco', 'Simone', 'Roberto']
const NAMES_FEMALE = ['Sofia', 'Chiara', 'Giulia', 'Anna', 'Elena', 'Laura', 'Valentina', 'Alice', 'Martina', 'Sara']

export interface DatingResult {
  success: boolean; message: string; effects: Effect
  newMatch?: Relationship
  updatedRelationship?: Partial<Relationship>
}

export class DatingEngine {
  static getApps() { return APPS }

  static swipe(appId: DatingApp, state: GameState): DatingResult {
    if (state.time.age < 18)
      return { success: false, message: 'Devi avere 18 anni per usare app di dating.', effects: {} }
    if (state.criminal.inPrison)
      return { success: false, message: 'Non puoi fare dating mentre sei in prigione.', effects: {} }

    const app = APPS.find(a => a.id === appId)
    if (!app) return { success: false, message: 'App non trovata.', effects: {} }

    const looks = state.stats.looks / 100
    const socialRep = state.stats.socialReputation / 100
    const matchChance = app.matchRate + (looks * 0.2) + (socialRep * 0.1)

    if (Math.random() > matchChance) {
      // Ghosting event (60% delle esperienze)
      if (Math.random() < 0.4)
        return { success: false, message: `${app.emoji} Nessun match su ${app.name} oggi. Continua a scorrere...`, effects: { happiness: -1 } }
      return { success: false, message: `${app.emoji} Hai fatto un match su ${app.name} ma ti ha ghostato. 👻`, effects: { happiness: -3, mentalHealth: -2 } }
    }

    // Generate NPC match
    const isOppositeGender = state.identity.sexualOrientation === 'heterosexual'
    const targetGender = isOppositeGender
      ? (state.identity.gender === 'male' ? 'female' : 'male')
      : state.identity.gender
    const names = targetGender === 'female' ? NAMES_FEMALE : NAMES_MALE
    const name = names[Math.floor(Math.random() * names.length)]
    const ageDiff = Math.floor(Math.random() * 10) - 3
    const matchAge = Math.max(18, state.time.age + ageDiff)

    const attraction = Math.floor(40 + Math.random() * 50)
    const trust = Math.floor(20 + Math.random() * 30)

    const match: Relationship = {
      id: `match_${Math.random().toString(36).slice(2)}`,
      npcId: `npc_dating_${Math.random().toString(36).slice(2)}`,
      name, age: matchAge,
      gender: targetGender as 'male' | 'female',
      emoji: targetGender === 'female' ? '👩' : '👨',
      type: 'acquaintance',
      stage: 'acquaintance',
      trust, jealousy: 10, attraction,
      love: 0, respect: 30,
      toxicityTag: Math.random() < 0.1,
      historyFlags: [`met_on_${appId}`],
      memoryLog: [],
      isAlive: true,
      nationality: state.identity.nationality,
    }

    return {
      success: true,
      message: `${app.emoji} Match su ${app.name}! Hai matchato con ${name}, ${matchAge} anni. 💫`,
      effects: { happiness: 8, socialReputation: 1 },
      newMatch: match,
    }
  }

  static propose(npcId: string, ringValue: number, state: GameState): DatingResult {
    const rel = state.relationships.find(r => r.id === npcId)
    if (!rel) return { success: false, message: 'Persona non trovata.', effects: {} }
    if (rel.stage !== 'partner')
      return { success: false, message: `${rel.name} non è ancora il/la tuo/a partner.`, effects: {} }
    if (state.finance.money < ringValue)
      return { success: false, message: `Non hai abbastanza soldi per l'anello.`, effects: {} }

    const loveScore = rel.love / 100
    const trustScore = rel.trust / 100
    const ringBonus = Math.min(0.2, ringValue / 25000)
    const acceptChance = (loveScore * 0.5 + trustScore * 0.3 + ringBonus + 0.1)

    const effects: Effect = { money: -ringValue }

    if (Math.random() < acceptChance) {
      effects.happiness = 30
      effects.mentalHealth = 10
      return {
        success: true,
        message: `💍 ${rel.name} ha detto SÌ! Siete fidanzati! Anello: €${ringValue.toLocaleString()}`,
        effects,
        updatedRelationship: { stage: 'partner', historyFlags: [...rel.historyFlags, 'engaged'], love: Math.min(100, rel.love + 20) },
      }
    }
    effects.happiness = -20
    effects.mentalHealth = -15
    return {
      success: false,
      message: `💔 ${rel.name} ha rifiutato la proposta. È un momento difficile.`,
      effects,
    }
  }

  static marry(npcId: string, weddingBudget: number, state: GameState): DatingResult {
    const rel = state.relationships.find(r => r.id === npcId)
    if (!rel) return { success: false, message: 'Persona non trovata.', effects: {} }
    if (!rel.historyFlags.includes('engaged'))
      return { success: false, message: 'Devi prima fidanzarti prima di sposarti.', effects: {} }
    if (state.finance.money < weddingBudget)
      return { success: false, message: `Il matrimonio costa €${weddingBudget.toLocaleString()}. Non hai fondi sufficienti.`, effects: {} }

    const effects: Effect = {
      money: -weddingBudget,
      happiness: 25,
      mentalHealth: 10,
      socialReputation: 8,
    }

    return {
      success: true,
      message: `💒 Ti sei sposato/a con ${rel.name}! Budget matrimonio: €${weddingBudget.toLocaleString()}. Benvenuto/a nella vita coniugale! 🎊`,
      effects,
      updatedRelationship: {
        type: 'spouse', stage: 'spouse',
        historyFlags: [...rel.historyFlags, 'married'],
        love: Math.min(100, rel.love + 15),
        trust: Math.min(100, rel.trust + 10),
      },
    }
  }

  static divorce(npcId: string, state: GameState): DatingResult {
    const rel = state.relationships.find(r => r.id === npcId)
    if (!rel || rel.type !== 'spouse')
      return { success: false, message: 'Non sei sposato/a con questa persona.', effects: {} }

    const assetSplit = Math.floor(state.finance.money * 0.3)
    const lawyerCost = 2000 + Math.floor(Math.random() * 3000)

    return {
      success: true,
      message: `📜 Divorzio completato da ${rel.name}. Costi legali: €${lawyerCost.toLocaleString()}. Vita nuova.`,
      effects: { money: -(assetSplit + lawyerCost), happiness: -20, mentalHealth: -15, socialReputation: -5 },
      updatedRelationship: {
        type: 'ex_partner', stage: 'acquaintance',
        historyFlags: [...rel.historyFlags, 'divorced'],
        trust: Math.max(0, rel.trust - 40),
        love: Math.max(0, rel.love - 50),
      },
    }
  }
}
