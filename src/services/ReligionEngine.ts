import type { GameState, Effect, Religion } from '../store/types'

interface ReligionInfo {
  name: string
  emoji: string
  practice: string
  effects: Effect
}

const RELIGION_INFO: Record<string, ReligionInfo> = {
  catholicism:   { name: 'Cattolicesimo', emoji: '⛪', practice: 'Messa domenicale e confessione',    effects: { happiness: 5, mentalHealth: 5, karma: 3 } },
  islam:         { name: 'Islam',         emoji: '🕌', practice: 'Preghiera del venerdì (Jumu\'ah)', effects: { happiness: 5, mentalHealth: 5, karma: 3 } },
  buddhism:      { name: 'Buddismo',      emoji: '🧘', practice: 'Meditazione e contemplazione zen',  effects: { happiness: 8, mentalHealth: 10, karma: 5, health: 2 } },
  hinduism:      { name: 'Induismo',      emoji: '🕉️', practice: 'Puja al tempio',                   effects: { happiness: 6, mentalHealth: 6, karma: 3 } },
  judaism:       { name: 'Ebraismo',      emoji: '✡️', practice: 'Shabbat settimanale',              effects: { happiness: 6, mentalHealth: 5, karma: 3, intelligence: 1 } },
  protestantism: { name: 'Protestantesimo', emoji: '✝️', practice: 'Servizio domenicale',            effects: { happiness: 5, mentalHealth: 5, karma: 3 } },
  orthodoxy:     { name: 'Ortodossia',    emoji: '☦️', practice: 'Liturgia e icone sacre',           effects: { happiness: 5, mentalHealth: 6, karma: 3 } },
  atheism:       { name: 'Ateismo',       emoji: '🔭', practice: 'Riflessione razionalista',         effects: { intelligence: 3, mentalHealth: 2 } },
  agnosticism:   { name: 'Agnosticismo',  emoji: '🤔', practice: 'Meditazione filosofica',           effects: { intelligence: 2, mentalHealth: 3, happiness: 2 } },
  other:         { name: 'Spiritualità',  emoji: '🌟', practice: 'Pratica spirituale personale',     effects: { happiness: 4, mentalHealth: 4, karma: 2 } },
}

export interface ReligionActionResult {
  success: boolean
  message: string
  effects: Effect
  newReligion?: Religion
}

export class ReligionEngine {
  static getInfo(religion: string): ReligionInfo {
    return RELIGION_INFO[religion] ?? RELIGION_INFO['other']
  }

  static getAllReligions(): { id: string; info: ReligionInfo }[] {
    return Object.entries(RELIGION_INFO).map(([id, info]) => ({ id, info }))
  }

  static practiceReligion(state: GameState): ReligionActionResult {
    const { identity, time, diminishingReturns } = state
    const info = RELIGION_ENGINE_getInfo(identity.religion)

    const key = `religion_${time.year}`
    const uses = diminishingReturns[key] ?? 0
    if (uses >= 4)
      return { success: false, message: '🙏 Hai già praticato abbastanza la tua fede quest\'anno.', effects: {} }

    // Diminishing returns: -20% each use
    const modifier = Math.max(0.2, 1 - uses * 0.2)
    const scaledEffects: Effect = Object.fromEntries(
      Object.entries(info.effects).map(([k, v]) => [k, Math.max(1, Math.round((v as number) * modifier))])
    )

    return {
      success: true,
      message: `${info.emoji} Hai praticato ${info.name}: ${info.practice}. Ti senti più sereno interiormente.`,
      effects: scaledEffects,
    }
  }

  static convertReligion(newReligion: Religion, state: GameState): ReligionActionResult {
    const { identity, time } = state
    if (identity.religion === newReligion)
      return { success: false, message: 'Appartieni già a questa religione.', effects: {} }
    if (time.age < 16)
      return { success: false, message: 'La conversione religiosa richiede almeno 16 anni di età.', effects: {} }

    const newInfo = RELIGION_ENGINE_getInfo(newReligion)
    const oldInfo = RELIGION_ENGINE_getInfo(identity.religion)

    return {
      success: true, newReligion,
      message: `${newInfo.emoji} Ti sei convertito da ${oldInfo.name} a ${newInfo.name}. Un momento di svolta spirituale nella tua vita.`,
      effects: { happiness: -3, mentalHealth: 8, karma: 3 },
    }
  }
}

// module-level helper to avoid `this` inside static methods with closures
function RELIGION_ENGINE_getInfo(religion: string): ReligionInfo {
  return RELIGION_INFO[religion] ?? RELIGION_INFO['other']
}
