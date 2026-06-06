import type { GameState, Effect } from '../store/types'

export interface PoliticsState {
  isRegisteredVoter: boolean
  partyMembership: string | null
  currentRole: PoliticalRole | null
  mandatesWon: number
  electionsCampaigns: number
  scandals: number
  politicalInfluence: number  // 0-100
  lastVotedYear: number
  corruptionLevel: number     // 0-100
}

export type PoliticalRole =
  | 'consigliere_comunale'
  | 'sindaco'
  | 'deputato'
  | 'senatore'
  | 'premier'

export interface RoleDef {
  name: string
  emoji: string
  salary: number
  minReputation: number
  minAge: number
  minCampaigns: number
  requiresCleanRecord: boolean
  minInfluence: number
}

export const POLITICAL_ROLES: Record<PoliticalRole, RoleDef> = {
  consigliere_comunale: { name: 'Consigliere Comunale', emoji: '🏛️', salary: 1500,  minReputation: 35, minAge: 18, minCampaigns: 0, requiresCleanRecord: false, minInfluence: 0  },
  sindaco:              { name: 'Sindaco',               emoji: '🏙️', salary: 4500,  minReputation: 55, minAge: 25, minCampaigns: 1, requiresCleanRecord: false, minInfluence: 20 },
  deputato:             { name: 'Deputato',              emoji: '🗳️', salary: 7500,  minReputation: 65, minAge: 25, minCampaigns: 2, requiresCleanRecord: true,  minInfluence: 40 },
  senatore:             { name: 'Senatore',              emoji: '🏛️', salary: 8500,  minReputation: 75, minAge: 40, minCampaigns: 3, requiresCleanRecord: true,  minInfluence: 55 },
  premier:              { name: 'Primo Ministro',        emoji: '👔', salary: 15000, minReputation: 88, minAge: 40, minCampaigns: 5, requiresCleanRecord: true,  minInfluence: 80 },
}

export const POLITICAL_PARTIES = [
  { id: 'left',         name: 'Partito di Sinistra',  emoji: '🔴', ideology: 'Socialista'    },
  { id: 'center_left',  name: 'Centro-Sinistra',       emoji: '🌹', ideology: 'Progressista'  },
  { id: 'center',       name: 'Movimento Centro',      emoji: '⚖️', ideology: 'Liberale'      },
  { id: 'center_right', name: 'Forza Democratica',     emoji: '🔵', ideology: 'Conservatore'  },
  { id: 'right',        name: 'Partito Nazionale',     emoji: '⚡', ideology: 'Nazionalista'  },
]

export interface PoliticsActionResult {
  success: boolean
  message: string
  effects: Effect
  updatedPolitics?: Partial<PoliticsState>
}

export class PoliticsEngine {
  static registerToVote(state: GameState): PoliticsActionResult {
    const { time, politics } = state
    if (time.age < 18) return { success: false, message: 'Devi avere almeno 18 anni per votare.', effects: {} }
    if (politics.isRegisteredVoter) return { success: false, message: 'Sei già registrato come elettore.', effects: {} }
    return {
      success: true,
      message: '🗳️ Ti sei registrato come elettore. Ora puoi partecipare alle elezioni!',
      effects: { karma: 3, reputation: 2 },
      updatedPolitics: { isRegisteredVoter: true },
    }
  }

  static vote(partyId: string, state: GameState): PoliticsActionResult {
    const { time, politics } = state
    if (!politics.isRegisteredVoter)
      return { success: false, message: 'Devi prima registrarti come elettore.', effects: {} }
    if (time.year - politics.lastVotedYear < 4)
      return { success: false, message: `Le prossime elezioni sono tra ${4 - (time.year - politics.lastVotedYear)} anni.`, effects: {} }

    const party = POLITICAL_PARTIES.find(p => p.id === partyId)
    if (!party) return { success: false, message: 'Partito non trovato.', effects: {} }

    return {
      success: true,
      message: `${party.emoji} Hai votato per ${party.name}. Il tuo contributo democratico è importante.`,
      effects: { karma: 5, mentalHealth: 2, happiness: 3 },
      updatedPolitics: { lastVotedYear: time.year },
    }
  }

  static joinParty(partyId: string, state: GameState): PoliticsActionResult {
    const { time, politics, finance } = state
    if (time.age < 18) return { success: false, message: 'Devi avere almeno 18 anni.', effects: {} }
    if (politics.partyMembership === partyId)
      return { success: false, message: 'Sei già membro di questo partito.', effects: {} }
    if (finance.money < 200) return { success: false, message: 'La quota annuale è €200.', effects: {} }

    const party = POLITICAL_PARTIES.find(p => p.id === partyId)
    if (!party) return { success: false, message: 'Partito non trovato.', effects: {} }

    return {
      success: true,
      message: `${party.emoji} Sei diventato membro di ${party.name} (ideologia: ${party.ideology}). Quota annuale €200 pagata.`,
      effects: { money: -200, reputation: 5, karma: 2 },
      updatedPolitics: { partyMembership: partyId },
    }
  }

  static conductCampaign(state: GameState): PoliticsActionResult {
    const { politics, finance, stats } = state
    if (!politics.partyMembership)
      return { success: false, message: 'Devi essere membro di un partito per fare campagna elettorale.', effects: {} }
    if (finance.money < 1500)
      return { success: false, message: 'Servono €1.500 per organizzare una campagna elettorale.', effects: {} }

    const successChance = Math.min(0.85, 0.35 + stats.reputation * 0.004 + stats.intelligence * 0.002)
    const won = Math.random() < successChance
    const influenceGain = won ? 18 : 6

    if (won) {
      return {
        success: true,
        message: '🎉 La campagna ha riscosso ampio consenso! Il tuo profilo politico è cresciuto notevolmente.',
        effects: { money: -1500, reputation: 12, socialReputation: 8, happiness: 10 },
        updatedPolitics: {
          electionsCampaigns: politics.electionsCampaigns + 1,
          politicalInfluence: Math.min(100, politics.politicalInfluence + influenceGain),
        },
      }
    }
    return {
      success: false,
      message: '😔 La campagna non ha raggiunto i risultati sperati. Continua a costruire la tua reputazione.',
      effects: { money: -1500, happiness: -5 },
      updatedPolitics: {
        electionsCampaigns: politics.electionsCampaigns + 1,
        politicalInfluence: Math.min(100, politics.politicalInfluence + influenceGain),
      },
    }
  }

  static runForOffice(role: PoliticalRole, state: GameState): PoliticsActionResult {
    const { politics, stats, time, criminal } = state
    const def = POLITICAL_ROLES[role]
    if (!def) return { success: false, message: 'Ruolo non trovato.', effects: {} }
    if (!politics.partyMembership) return { success: false, message: 'Devi essere membro di un partito.', effects: {} }
    if (time.age < def.minAge)
      return { success: false, message: `Devi avere almeno ${def.minAge} anni per candidarti a ${def.name}.`, effects: {} }
    if (stats.reputation < def.minReputation)
      return { success: false, message: `Servono almeno ${def.minReputation} punti di reputazione (hai ${Math.round(stats.reputation)}).`, effects: {} }
    if (def.requiresCleanRecord && criminal.hasRecord)
      return { success: false, message: 'Questo ruolo richiede fedina penale pulita.', effects: {} }
    if (politics.electionsCampaigns < def.minCampaigns)
      return { success: false, message: `Devi aver fatto almeno ${def.minCampaigns} campagna/e elettorale/i.`, effects: {} }
    if (politics.politicalInfluence < def.minInfluence)
      return { success: false, message: `Influenza politica insufficiente (hai ${Math.round(politics.politicalInfluence)}, servono ${def.minInfluence}).`, effects: {} }

    const successChance = Math.max(0.1, Math.min(0.8, 0.25 + politics.politicalInfluence * 0.006 + (stats.reputation - def.minReputation) * 0.01))
    const elected = Math.random() < successChance

    if (elected) {
      return {
        success: true,
        message: `🎉 Sei stato eletto ${def.name}! Stipendio mensile: €${def.salary.toLocaleString()}.`,
        effects: { reputation: 22, socialReputation: 18, happiness: 30, money: def.salary * 12 },
        updatedPolitics: {
          currentRole: role,
          mandatesWon: politics.mandatesWon + 1,
          politicalInfluence: Math.min(100, politics.politicalInfluence + 20),
        },
      }
    }
    return {
      success: false,
      message: `😔 Non sei stato eletto ${def.name}. Risultato: ${Math.round(successChance * 100)}% di possibilità. Continua a impegnarti.`,
      effects: { happiness: -10 },
    }
  }

  static engageInCorruption(state: GameState): PoliticsActionResult {
    const { politics } = state
    if (!politics.currentRole) return { success: false, message: 'Devi avere un ruolo politico per farlo.', effects: {} }

    const caughtChance = Math.min(0.9, 0.2 + politics.corruptionLevel * 0.007)
    const caught = Math.random() < caughtChance

    if (caught) {
      return {
        success: false,
        message: '🚔 Sei stato scoperto! Scandalo politico: perdi il tuo mandato e la reputazione crolla.',
        effects: { reputation: -45, socialReputation: -35, karma: -25, happiness: -40 },
        updatedPolitics: {
          currentRole: null,
          scandals: politics.scandals + 1,
          corruptionLevel: Math.min(100, politics.corruptionLevel + 20),
        },
      }
    }
    const gain = Math.floor(4000 + politics.corruptionLevel * 120)
    return {
      success: true,
      message: `💰 Hai ricevuto una tangente di €${gain.toLocaleString()}. Il rischio di essere scoperto cresce…`,
      effects: { money: gain, karma: -15, reputation: -3 },
      updatedPolitics: { corruptionLevel: Math.min(100, politics.corruptionLevel + 12) },
    }
  }

  static leaveParty(state: GameState): PoliticsActionResult {
    if (!state.politics.partyMembership)
      return { success: false, message: 'Non sei membro di nessun partito.', effects: {} }
    return {
      success: true,
      message: '🚪 Hai lasciato il partito. Sei ora un politico indipendente.',
      effects: { reputation: -3 },
      updatedPolitics: { partyMembership: null, currentRole: null },
    }
  }
}
