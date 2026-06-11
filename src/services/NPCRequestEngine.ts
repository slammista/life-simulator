import type {
  GameState, Effect, GameEvent, Choice, Relationship, PendingConsequence, NPCRequestRecord,
} from '../store/types'

// NPC requests flow through the normal event modal as synthetic events.
// event.id = 'npcreq_<type>', meta stashed on the event; choice ids 'npcreq_accept'/'npcreq_refuse'.

export interface NPCRequestMeta {
  npcId: string
  npcName: string
  requestType: string
  amount: number
}

export type NPCRequestEvent = GameEvent & { npcReqMeta: NPCRequestMeta; npcName: string }

const uid = () => Math.random().toString(36).slice(2, 10)

function kinship(rel: Relationship): string {
  switch (rel.type) {
    case 'parent':  return rel.gender === 'female' ? 'tua madre' : 'tuo padre'
    case 'sibling': return rel.gender === 'female' ? 'tua sorella' : 'tuo fratello'
    case 'spouse':  return rel.gender === 'female' ? 'tua moglie' : 'tuo marito'
    case 'partner': return rel.gender === 'female' ? 'la tua compagna' : 'il tuo compagno'
    case 'best_friend': return rel.gender === 'female' ? 'la tua migliore amica' : 'il tuo migliore amico'
    case 'child':   return rel.gender === 'female' ? 'tua figlia' : 'tuo figlio'
    default:        return rel.gender === 'female' ? 'la tua amica' : 'il tuo amico'
  }
}

function firstName(rel: Relationship): string {
  return rel.name.split(' ')[0]
}

interface RequestOutcome {
  effects: Effect
  logText: string
  relDelta: { trust?: number; love?: number; respect?: number }
  consequence?: (age: number, meta: NPCRequestMeta) => PendingConsequence | null
  karmaNote?: string
}

interface NPCRequestDef {
  type: string
  minPlayerAge: number
  eligible: (rel: Relationship, state: GameState) => boolean
  build: (rel: Relationship, state: GameState, amount: number) => { title: string; description: string; emoji: string; acceptText: string; refuseText: string }
  amount: (state: GameState) => number
  accept: (amount: number) => RequestOutcome
  refuse: () => RequestOutcome
}

const REQUEST_DEFS: NPCRequestDef[] = [
  {
    type: 'money_loan',
    minPlayerAge: 18,
    eligible: (rel) => ['sibling', 'friend', 'best_friend', 'parent'].includes(rel.type) && rel.trust > 40,
    amount: (state) => {
      const base = 300 + Math.floor(Math.random() * 1700)
      return Math.min(base, Math.max(300, Math.floor(state.finance.money * 0.4)))
    },
    build: (rel, _s, amount) => ({
      title: 'Una richiesta difficile',
      description: `${firstName(rel)}, ${kinship(rel)}, ti chiama con la voce rotta: «Ho perso il lavoro. Mi servono ${amount}€ per arrivare a fine mese. Non saprei a chi altro chiedere.»`,
      emoji: '💶',
      acceptText: `Aiutalo/a (−€${amount})`,
      refuseText: 'Rifiuta: non puoi permettertelo',
    }),
    accept: (amount) => ({
      effects: { money: -amount, karma: 3, happiness: 2 },
      logText: `Hai prestato €${amount} a una persona cara in difficoltà.`,
      relDelta: { trust: 12, love: 5 },
      consequence: (age, meta) => Math.random() < 0.6
        ? {
            id: uid(), triggerAge: age + 2,
            title: 'Il debito ripagato',
            description: `${meta.npcName.split(' ')[0]} ti restituisce i soldi prestati, con gli interessi della gratitudine.`,
            emoji: '💶', effects: { money: Math.round(meta.amount * 1.1), happiness: 3 } as Effect, category: 'relationship' as const,
          }
        : {
            id: uid(), triggerAge: age + 2,
            title: 'Il prestito dimenticato',
            description: `${meta.npcName.split(' ')[0]} non ti ha mai restituito i soldi. Meglio non parlarne più.`,
            emoji: '🙄', effects: { happiness: -2 } as Effect, category: 'relationship' as const,
          },
    }),
    refuse: () => ({
      effects: { mentalHealth: -1 },
      logText: 'Hai rifiutato di prestare soldi a una persona cara. Il silenzio dopo il no pesava.',
      relDelta: { trust: -15, respect: -5 },
    }),
  },
  {
    type: 'emotional_support',
    minPlayerAge: 14,
    eligible: (rel) => rel.trust > 50,
    amount: () => 0,
    build: (rel) => ({
      title: 'Un momento difficile',
      description: `${firstName(rel)}, ${kinship(rel)}, ti scrive a notte fonda: «Non sto bene. Ho bisogno di parlare con qualcuno. Puoi venire?»`,
      emoji: '🌙',
      acceptText: 'Vai subito, costi quel che costi',
      refuseText: 'Inventa una scusa',
    }),
    accept: () => ({
      effects: { energy: -3, karma: 3, happiness: 2 },
      logText: 'Hai passato la notte a sostenere una persona cara. Le parole giuste al momento giusto.',
      relDelta: { trust: 10, love: 8 },
    }),
    refuse: () => ({
      effects: { karma: -2 },
      logText: 'Hai inventato una scusa per non esserci. Certe assenze non si dimenticano.',
      relDelta: { trust: -10, love: -5 },
    }),
  },
  {
    type: 'job_recommendation',
    minPlayerAge: 22,
    eligible: (rel, state) => ['friend', 'best_friend', 'sibling'].includes(rel.type) && state.career.currentJob !== null,
    amount: () => 0,
    build: (rel) => ({
      title: 'Una parola buona',
      description: `${firstName(rel)}, ${kinship(rel)}, sa che dove lavori cercano gente: «Puoi raccomandarmi? Garantisco io, non ti farò fare brutta figura.»`,
      emoji: '💼',
      acceptText: 'Mettici una buona parola',
      refuseText: 'Meglio di no: lavoro e amicizia non si mischiano',
    }),
    accept: () => {
      const goesWell = Math.random() < 0.7
      return {
        effects: (goesWell ? { reputation: 3, karma: 2 } : { reputation: -5 }) as Effect,
        logText: goesWell
          ? 'La tua raccomandazione ha funzionato: assunto/a! Il capo ha apprezzato il tuo fiuto.'
          : 'La persona che hai raccomandato ha fatto una figuraccia. E la figuraccia è anche tua.',
        relDelta: goesWell ? { trust: 10, respect: 5 } : { trust: 3 },
      }
    },
    refuse: () => ({
      effects: {},
      logText: 'Hai preferito non mischiare lavoro e rapporti personali.',
      relDelta: { trust: -8 },
    }),
  },
  {
    type: 'wedding_invite',
    minPlayerAge: 22,
    eligible: (rel) => ['friend', 'best_friend'].includes(rel.type) && rel.love > 40,
    amount: () => 150,
    build: (rel) => ({
      title: 'Partecipazione di nozze',
      description: `${firstName(rel)}, ${kinship(rel)}, si sposa! «Devi assolutamente esserci. E... ti andrebbe di fare un discorso al ricevimento?»`,
      emoji: '💒',
      acceptText: 'Partecipa con regalo e discorso (−€150)',
      refuseText: 'Manda solo gli auguri',
    }),
    accept: () => ({
      effects: { money: -150, happiness: 6 },
      logText: 'Il matrimonio è stato bellissimo e il tuo discorso ha fatto piangere mezza sala.',
      relDelta: { trust: 12, love: 10 },
    }),
    refuse: () => ({
      effects: { happiness: -2 },
      logText: 'Hai saltato il matrimonio di una persona cara. Gli auguri via messaggio non sono la stessa cosa.',
      relDelta: { trust: -12, love: -8 },
    }),
  },
  {
    type: 'babysit',
    minPlayerAge: 16,
    eligible: (rel) => ['sibling', 'friend', 'best_friend'].includes(rel.type) && rel.historyFlags.includes('has_child'),
    amount: () => 0,
    build: (rel) => ({
      title: 'SOS babysitter',
      description: `${firstName(rel)}, ${kinship(rel)}, ti chiama nel panico: «Mi è saltata la babysitter e ho un impegno che non posso spostare. Me lo tieni tu il bimbo, solo per stasera?»`,
      emoji: '👶',
      acceptText: 'Accetta: serata da babysitter',
      refuseText: 'Stasera proprio non puoi',
    }),
    accept: () => ({
      effects: { energy: -5, happiness: 2, karma: 2 },
      logText: 'Serata da babysitter: stanchezza assicurata, ma anche risate e gratitudine.',
      relDelta: { trust: 10 },
    }),
    refuse: () => ({
      effects: {},
      logText: 'Non hai potuto fare da babysitter. Capita.',
      relDelta: { trust: -6 },
    }),
  },
  {
    type: 'cover_lie',
    minPlayerAge: 16,
    eligible: (rel) => ['friend', 'best_friend', 'sibling'].includes(rel.type) && rel.trust > 60,
    amount: () => 0,
    build: (rel) => ({
      title: 'Una copertura',
      description: `${firstName(rel)}, ${kinship(rel)}, ti supplica: «Se qualcuno chiede, ieri sera ero con te. Ti spiego tutto dopo, promesso. Mi copri?»`,
      emoji: '🤫',
      acceptText: 'Copri la bugia',
      refuseText: 'No: non mentire per nessuno',
    }),
    accept: () => ({
      effects: { karma: -8 },
      logText: 'Hai coperto la bugia. La lealtà a volte ha un prezzo morale.',
      relDelta: { trust: 15 },
      consequence: (age, meta) => Math.random() < 0.25
        ? {
            id: uid(), triggerAge: age + 1,
            title: 'La bugia viene a galla',
            description: `La copertura per ${meta.npcName.split(' ')[0]} è stata scoperta. La tua parola ora vale meno.`,
            emoji: '🫢', effects: { reputation: -5 }, category: 'relationship',
          }
        : null,
    }),
    refuse: () => ({
      effects: { karma: 5 },
      logText: 'Ti sei rifiutato di mentire. La coerenza ha un costo, e l\'hai pagato.',
      relDelta: { trust: -18 },
    }),
  },
  {
    type: 'help_move',
    minPlayerAge: 18,
    eligible: (rel) => ['friend', 'best_friend', 'sibling'].includes(rel.type),
    amount: () => 0,
    build: (rel) => ({
      title: 'Il trasloco',
      description: `${firstName(rel)}, ${kinship(rel)}, sta traslocando: «Sabato, ore 8, scatoloni e divano del quinto piano senza ascensore. Posso contare su di te? Pizza e birra offerte.»`,
      emoji: '📦',
      acceptText: 'Presente! (addio schiena)',
      refuseText: 'Sabato hai già un impegno',
    }),
    accept: () => ({
      effects: { energy: -6, happiness: 2 },
      logText: 'Trasloco completato: la schiena protesta, l\'amicizia ringrazia. La pizza era buonissima.',
      relDelta: { trust: 8 },
    }),
    refuse: () => ({
      effects: {},
      logText: 'Hai saltato il trasloco. Il divano del quinto piano se lo ricorderanno.',
      relDelta: { trust: -6 },
    }),
  },
]

export interface NPCRequestResult {
  effects: Effect
  logText: string
  relationshipPatch: { npcId: string; trust?: number; love?: number; respect?: number }
  consequence: PendingConsequence | null
  record: NPCRequestRecord
}

export class NPCRequestEngine {
  /** Builds a synthetic NPC-request event if an eligible NPC exists. */
  static maybeBuildRequest(state: GameState, newAge: number): { event: NPCRequestEvent; choices: Choice[] } | null {
    const candidates: { def: NPCRequestDef; rel: Relationship }[] = []
    for (const def of REQUEST_DEFS) {
      if (newAge < def.minPlayerAge) continue
      for (const rel of state.relationships) {
        if (!rel.isAlive || rel.type === 'enemy' || rel.type === 'rival') continue
        if (def.eligible(rel, state)) candidates.push({ def, rel })
      }
    }
    if (candidates.length === 0) return null

    const { def, rel } = candidates[Math.floor(Math.random() * candidates.length)]
    const amount = def.amount(state)
    const built = def.build(rel, state, amount)
    const eventId = `npcreq_${def.type}`
    const meta: NPCRequestMeta = { npcId: rel.id, npcName: rel.name, requestType: def.type, amount }

    const choices: Choice[] = [
      {
        id: 'npcreq_accept', eventId, text: built.acceptText, effects: {},
        requirements: amount > 0 && def.type === 'money_loan'
          ? [{ stat: 'money', operator: '>=', value: amount }]
          : [],
        packId: 'narrative',
      },
      { id: 'npcreq_refuse', eventId, text: built.refuseText, effects: {}, requirements: [], packId: 'narrative' },
    ]

    return {
      event: {
        id: eventId,
        title: built.title,
        description: built.description,
        emoji: built.emoji,
        choices: [],
        triggerCondition: '',
        minAge: 0, maxAge: 120,
        probability: 1,
        packId: 'narrative',
        rarity: 'rare',
        isHistorical: false,
        npcReqMeta: meta,
        npcName: rel.name,
      },
      choices,
    }
  }

  /** Resolve a request choice ('npcreq_accept' | 'npcreq_refuse'). */
  static applyChoice(state: GameState, choiceId: string): NPCRequestResult | null {
    const meta = (state.currentEvent as NPCRequestEvent | null)?.npcReqMeta
    if (!meta) return null
    const def = REQUEST_DEFS.find(d => d.type === meta.requestType)
    if (!def) return null

    const accepted = choiceId === 'npcreq_accept'
    const outcome = accepted ? def.accept(meta.amount) : def.refuse()

    return {
      effects: outcome.effects,
      logText: outcome.logText,
      relationshipPatch: { npcId: meta.npcId, ...outcome.relDelta },
      consequence: outcome.consequence ? outcome.consequence(state.time.age, meta) : null,
      record: {
        id: uid(),
        npcId: meta.npcId,
        npcName: meta.npcName,
        requestType: meta.requestType,
        year: state.time.year,
        age: state.time.age,
        accepted,
      },
    }
  }
}
