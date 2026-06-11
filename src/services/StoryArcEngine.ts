import type {
  GameState, Effect, GameEvent, Choice, Relationship, StoryArcState,
  NarrativeTraitId, PendingConsequence,
} from '../store/types'

// Synthetic arc events flow through the normal event modal:
// event.id = 'arc_<arcId>_s<stage>', choices id = 'arc_c1'... + arcMeta stashed on the event.

export interface ArcEventMeta {
  arcId: string
  stageIndex: number
}

export type ArcGameEvent = GameEvent & { arcMeta: ArcEventMeta; npcName?: string }

export interface ArcOutcome {
  effects: Effect
  logText: string
  setFlags?: Record<string, boolean | number | string>
  relDelta?: { trust?: number; love?: number; respect?: number }
  relTypeChange?: Relationship['type']
  memory?: { title: string; description: string; emoji: string }
  consequence?: (age: number) => PendingConsequence
  createFriendNpc?: { name: string }
  abandon?: boolean
}

interface ArcStageDef {
  ageMin: number
  ageMax: number
  build: (state: GameState, arc: StoryArcState, npc: Relationship | null) => {
    title: string; description: string; emoji: string
    choices: { suffix: string; text: string; moneyReq?: number; intReq?: number }[]
  }
  outcomes: (arc: StoryArcState, state: GameState) => Record<string, ArcOutcome>
  defaultChoice: string
}

export interface StoryArcDef {
  id: string
  title: string
  emoji: string
  requiresTrait?: NarrativeTraitId
  bindNpc?: 'sibling' | 'mother'
  stages: ArcStageDef[]
}

const uid = () => Math.random().toString(36).slice(2, 10)

// ─────────────────────────────────────────────────────────────────
// Arc definitions
// ─────────────────────────────────────────────────────────────────

const AMICO_INFANZIA: StoryArcDef = {
  id: 'amico_infanzia',
  title: "L'Amico d'Infanzia",
  emoji: '🧒',
  stages: [
    {
      ageMin: 6, ageMax: 7,
      build: () => ({
        title: 'Un nuovo amico al parco',
        description: 'Al parco c\'è un bambino che non hai mai visto. Si chiama Luca, ha la tua età e una palla sotto il braccio. «Ehi! Vuoi giocare con me?»',
        emoji: '⚽',
        choices: [
          { suffix: 'c1', text: 'Certo! Gioca con lui' },
          { suffix: 'c2', text: 'Ignoralo e vai per la tua strada' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { happiness: 3 },
          logText: 'Hai conosciuto Luca al parco. Sembra l\'inizio di una bella amicizia.',
          createFriendNpc: { name: 'Luca' },
          memory: { title: 'Il primo amico', description: 'Hai conosciuto Luca al parco. Una palla, due bambini, un\'amicizia.', emoji: '⚽' },
        },
        c2: {
          effects: {},
          logText: 'Hai ignorato il bambino al parco. Chissà cosa sarebbe potuto essere.',
          abandon: true,
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 11, ageMax: 13,
      build: (_s, _arc, npc) => ({
        title: 'Luca nei guai',
        description: `All'uscita di scuola, tre ragazzi più grandi hanno preso di mira ${npc?.name ?? 'Luca'}. Lo spintonano contro il muro mentre gli svuotano lo zaino. Lui ti guarda, sperando in un aiuto.`,
        emoji: '😡',
        choices: [
          { suffix: 'c1', text: 'Intervieni e difendilo' },
          { suffix: 'c2', text: 'Corri a chiamare un professore' },
          { suffix: 'c3', text: 'Abbassa lo sguardo e vattene' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { karma: 5, health: -2, happiness: 2 },
          logText: 'Hai difeso Luca dai bulli. Qualche livido, ma l\'amicizia ne esce blindata.',
          setFlags: { defended: true },
          relDelta: { trust: 15, respect: 10 },
          memory: { title: 'Spalla contro spalla', description: 'Hai difeso Luca dai bulli, senza pensarci due volte.', emoji: '🛡️' },
        },
        c2: {
          effects: { karma: 2 },
          logText: 'Hai chiamato un professore per aiutare Luca. Non un eroe, ma nemmeno un codardo.',
          setFlags: { defended: 'indirect' },
          relDelta: { trust: 5 },
        },
        c3: {
          effects: { karma: -5, mentalHealth: -2 },
          logText: 'Hai fatto finta di niente mentre Luca veniva bullizzato. Lui ti ha visto andartene.',
          setFlags: { defended: false },
          relDelta: { trust: -15, respect: -10 },
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 15, ageMax: 17,
      build: (_s, _arc, npc) => ({
        title: 'La richiesta di Luca',
        description: `${npc?.name ?? 'Luca'} ti prende da parte: «La mia famiglia è in crisi. Se non pago la rata, perdo il motorino con cui faccio le consegne. Mi servono 200€. Te li ridò, promesso.»`,
        emoji: '🛵',
        choices: [
          { suffix: 'c1', text: 'Prestagli i 200€', moneyReq: 200 },
          { suffix: 'c2', text: 'Digli che non puoi aiutarlo' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { money: -200, karma: 4 },
          logText: 'Hai prestato 200€ a Luca. Ti ha abbracciato senza dire una parola.',
          setFlags: { helped: true },
          relDelta: { trust: 12, respect: 8 },
        },
        c2: {
          effects: {},
          logText: 'Hai detto no a Luca. Ha annuito, ma qualcosa nei suoi occhi si è spento.',
          setFlags: { helped: false },
          relDelta: { trust: -10 },
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 24, ageMax: 27,
      build: (_s, arc, npc) => {
        const name = npc?.name ?? 'Luca'
        const defended = arc.flags['defended'] === true
        const helped = arc.flags['helped'] === true
        if (defended && helped) {
          return {
            title: 'La proposta di Luca',
            description: `${name} ti invita a cena. Ha fondato una startup di logistica partita proprio da quel motorino. «Sei l'unico che c'è sempre stato. Voglio che tu sia mio socio: ti offro una quota.»`,
            emoji: '🤝',
            choices: [
              { suffix: 'c1', text: 'Accetta la quota della società' },
              { suffix: 'c2', text: 'Declina con gratitudine' },
            ],
          }
        }
        if (arc.flags['defended'] === false) {
          return {
            title: 'Vecchi conti in sospeso',
            description: `Incontri ${name} a un evento. È diventato un avvocato di successo. Ti guarda dall'alto in basso: «Ricordo bene chi c'era... e chi ha girato lo sguardo.» Ti volta le spalle davanti a tutti.`,
            emoji: '🥶',
            choices: [
              { suffix: 'c1', text: 'Incassa il colpo' },
            ],
          }
        }
        return {
          title: 'Un caffè con Luca',
          description: `Rivedi ${name} dopo anni. Un caffè, due chiacchiere, tanti ricordi. Le strade si sono separate, ma il passato resta un posto caldo.`,
          emoji: '☕',
          choices: [
            { suffix: 'c1', text: 'Goditi il momento' },
          ],
        }
      },
      outcomes: (arc): Record<string, ArcOutcome> => {
        const defended = arc.flags['defended'] === true
        const helped = arc.flags['helped'] === true
        if (defended && helped) {
          return {
            c1: {
              effects: { money: 15000, happiness: 8 },
              logText: 'Sei diventato socio di Luca! La lealtà di una vita ripagata con gli interessi.',
              relDelta: { trust: 20, respect: 15 },
              relTypeChange: 'best_friend',
              memory: { title: 'Socio di Luca', description: 'L\'amicizia nata su un campetto è diventata una società. La lealtà paga.', emoji: '🤝' },
            },
            c2: {
              effects: { happiness: 3, karma: 2 },
              logText: 'Hai declinato l\'offerta di Luca, ma l\'amicizia resta più solida che mai.',
              relDelta: { trust: 10 },
              relTypeChange: 'best_friend',
            },
          }
        }
        if (arc.flags['defended'] === false) {
          return {
            c1: {
              effects: { happiness: -4, mentalHealth: -2 },
              logText: 'Luca non ha dimenticato il tuo tradimento. Ora è un nemico influente.',
              relDelta: { trust: -30, respect: -20 },
              relTypeChange: 'rival',
              memory: { title: 'Il prezzo del silenzio', description: 'Luca non ha mai dimenticato quel giorno. Ora te lo fa pesare.', emoji: '🥶' },
              consequence: (age) => ({
                id: uid(), triggerAge: age + 2,
                title: 'La voce gira',
                description: 'Luca ha raccontato in giro chi eri davvero da ragazzo. La tua reputazione ne risente.',
                emoji: '🗣️', effects: { reputation: -5 }, category: 'relationship' as const,
              }),
            },
          }
        }
        return {
          c1: {
            effects: { happiness: 3 },
            logText: 'Un caffè con Luca: le strade si dividono, i bei ricordi restano.',
            memory: { title: 'Il caffè con Luca', description: 'Non tutte le amicizie durano per sempre. Alcune restano semplicemente belle.', emoji: '☕' },
          },
        }
      },
      defaultChoice: 'c1',
    },
  ],
}

const RIVALE_DI_SANGUE: StoryArcDef = {
  id: 'rivale_di_sangue',
  title: 'Il Rivale di Sangue',
  emoji: '⚔️',
  requiresTrait: 'fratello_rivale',
  bindNpc: 'sibling',
  stages: [
    {
      ageMin: 8, ageMax: 10,
      build: (_s, _arc, npc) => ({
        title: 'Il giocattolo rotto',
        description: `Il modellino preferito di papà è in mille pezzi sul pavimento. ${npc?.name?.split(' ')[0] ?? 'Tuo fratello'} giura che sei stato tu. I tuoi genitori vi fissano entrambi: «Chi è stato?»`,
        emoji: '🧸',
        choices: [
          { suffix: 'c1', text: 'Di\' la verità' },
          { suffix: 'c2', text: 'Dai la colpa a lui' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { karma: 3 },
          logText: 'Hai detto la verità sul giocattolo rotto. I tuoi genitori l\'hanno apprezzato.',
          setFlags: { framed: false },
          relDelta: { respect: 5 },
        },
        c2: {
          effects: { karma: -5 },
          logText: 'Hai incolpato tuo fratello. Lui è stato punito al posto tuo... e non lo dimenticherà.',
          setFlags: { framed: true },
          relDelta: { trust: -15, respect: -10 },
        },
      }),
      defaultChoice: 'c1',
    },
    {
      ageMin: 14, ageMax: 16,
      build: (_s, _arc, npc) => ({
        title: 'La sfida',
        description: `Tu e ${npc?.name?.split(' ')[0] ?? 'tuo fratello'} siete finiti nella stessa gara: stesso torneo, stessa finale. Tutta la famiglia è sugli spalti. Stavolta non si scappa.`,
        emoji: '🏁',
        choices: [
          { suffix: 'c1', text: 'Vinci con ogni mezzo, anche scorretto' },
          { suffix: 'c2', text: 'Gioca pulito e dai il massimo' },
          { suffix: 'c3', text: 'Lascialo vincere' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { happiness: 3, karma: -8 },
          logText: 'Hai vinto la sfida con tuo fratello... barando. La vittoria ha un retrogusto amaro.',
          setFlags: { cheated: true },
          relDelta: { trust: -12, respect: -8 },
        },
        c2: {
          effects: { happiness: 4, karma: 3 },
          logText: 'Hai dato il massimo contro tuo fratello, alla pari. Comunque sia andata, è stato un bel duello.',
          setFlags: { cheated: false },
          relDelta: { respect: 8 },
        },
        c3: {
          effects: { happiness: -2, karma: 5 },
          logText: 'Hai lasciato vincere tuo fratello. Lui non lo sa, ma tu sì.',
          setFlags: { yielded: true, cheated: false },
          relDelta: { trust: 8, respect: 10 },
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 22, ageMax: 26,
      build: (_s, _arc, npc) => ({
        title: 'Il favorito',
        description: `I tuoi genitori hanno aiutato ${npc?.name?.split(' ')[0] ?? 'tuo fratello'} con un grosso prestito per la sua nuova casa. A te non hanno mai offerto niente del genere. La vecchia ferita brucia ancora.`,
        emoji: '🏠',
        choices: [
          { suffix: 'c1', text: 'Pretendi lo stesso trattamento' },
          { suffix: 'c2', text: 'Accetta in silenzio' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { money: 3000, mentalHealth: 2 },
          logText: 'Hai preteso parità di trattamento dai tuoi genitori. Hanno capito, e hanno rimediato.',
          setFlags: { stood_up: true },
        },
        c2: {
          effects: { mentalHealth: -3, happiness: -2 },
          logText: 'Hai ingoiato il rospo sul favoritismo dei tuoi genitori. Il rancore cresce in silenzio.',
          setFlags: { stood_up: false },
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 30, ageMax: 35,
      build: (_s, _arc, npc) => ({
        title: 'La resa dei conti',
        description: `${npc?.name?.split(' ')[0] ?? 'Tuo fratello'} ti chiama dopo mesi di silenzio: «Dobbiamo parlare. Di tutto. Una volta per tutte.» Vi date appuntamento al bar sotto casa dei vostri genitori.`,
        emoji: '🤜🤛',
        choices: [
          { suffix: 'c1', text: 'Tendi la mano: è ora di fare pace' },
          { suffix: 'c2', text: 'Digli che per te è morto' },
        ],
      }),
      outcomes: (arc) => {
        const cleanPast = arc.flags['framed'] !== true && arc.flags['cheated'] !== true
        return {
          c1: {
            effects: { happiness: 8, mentalHealth: 6, karma: 5 },
            logText: cleanPast
              ? 'Pace fatta con tuo fratello. Una vita di rivalità si scioglie in un abbraccio.'
              : 'Avete fatto pace, anche se le vecchie ferite lasciano cicatrici.',
            relDelta: { trust: cleanPast ? 40 : 25, love: 20, respect: 15 },
            relTypeChange: 'sibling',
            memory: { title: 'Pace con tuo fratello', description: 'Dopo una vita di rivalità, vi siete ritrovati. Il sangue è più forte.', emoji: '🤝' },
            consequence: (age) => ({
              id: uid(), triggerAge: age + 3,
              title: 'Il sostegno di tuo fratello',
              description: 'Tuo fratello ti aiuta in un momento difficile: la pace fatta anni fa porta i suoi frutti.',
              emoji: '💶', effects: { money: 5000, happiness: 3 }, category: 'relationship',
            }),
          },
          c2: {
            effects: { mentalHealth: -5, happiness: -4 },
            logText: 'Hai chiuso per sempre con tuo fratello. Una porta che non si riaprirà.',
            setFlags: { fratello_perduto: true },
            relDelta: { trust: -40, love: -30 },
            relTypeChange: 'enemy',
            memory: { title: 'La rottura', description: 'Tuo fratello e te: due estranei con lo stesso cognome.', emoji: '💔' },
          },
        }
      },
      defaultChoice: 'c1',
    },
  ],
}

const SOGNO_DI_MAMMA: StoryArcDef = {
  id: 'sogno_di_mamma',
  title: 'Il Sogno di Mamma',
  emoji: '🩺',
  requiresTrait: 'nato_in_poverta',
  bindNpc: 'mother',
  stages: [
    {
      ageMin: 13, ageMax: 14,
      build: (_s, _arc, npc) => ({
        title: 'La vetrina',
        description: `Tua madre ${npc?.name?.split(' ')[0] ?? ''} si ferma davanti a una vetrina con un camice bianco esposto. «Un giorno sarai tu a indossarlo. Un medico in famiglia. Promettimelo.»`,
        emoji: '🩺',
        choices: [
          { suffix: 'c1', text: 'Promettiglielo' },
          { suffix: 'c2', text: 'Sii sincero: non sai cosa vuoi' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { happiness: 2 },
          logText: 'Hai promesso a tua madre che diventerai medico. I suoi occhi si sono illuminati.',
          setFlags: { promised: true },
          relDelta: { love: 8, trust: 5 },
        },
        c2: {
          effects: { karma: 2 },
          logText: 'Sei stato sincero con tua madre: il tuo futuro lo scrivi tu. Ha sorriso, un po\' triste.',
          setFlags: { promised: false },
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 18, ageMax: 19,
      build: () => ({
        title: 'Il bivio',
        description: 'Il modulo di iscrizione all\'università è davanti a te. Medicina, come sogna tua madre... o la strada che senti davvero tua?',
        emoji: '📋',
        choices: [
          { suffix: 'c1', text: 'Iscriviti a Medicina', intReq: 60 },
          { suffix: 'c2', text: 'Scegli la TUA strada' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { happiness: 2, energy: -3 },
          logText: 'Ti sei iscritto a Medicina. Tua madre ha pianto di gioia al telefono.',
          setFlags: { path: 'medicina' },
          relDelta: { love: 10, trust: 8 },
        },
        c2: {
          effects: { happiness: 4, mentalHealth: 3 },
          logText: 'Hai scelto la tua strada, non quella di tua madre. Servirà tempo perché capisca.',
          setFlags: { path: 'altro' },
          relDelta: { trust: -10, love: -5 },
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 26, ageMax: 30,
      build: (state, arc) => {
        const medPath = arc.flags['path'] === 'medicina'
        const completedMed = state.education.completedLevels.includes('medical') || state.education.currentLevel === 'medical'
        const richEnough = state.finance.money > 50000
        if (medPath && completedMed) {
          return {
            title: 'Il camice bianco',
            description: 'Il giorno della tua prima visita in corsia, tua madre è lì fuori dall\'ospedale. Ti guarda nel camice bianco, quello della vetrina di tanti anni fa. Non riesce a parlare.',
            emoji: '🥹',
            choices: [{ suffix: 'c1', text: 'Abbracciala forte' }],
          }
        }
        if (!medPath && richEnough) {
          return {
            title: 'A modo tuo',
            description: 'Porti tua madre a cena nel ristorante più bello della città — pagato con i TUOI soldi, guadagnati a modo tuo. «Avevi ragione tu», ti dice guardando il mare.',
            emoji: '🌅',
            choices: [{ suffix: 'c1', text: 'Brinda con lei' }],
          }
        }
        return {
          title: 'Il sogno infranto',
          description: 'Tua madre non ne parla mai, ma ogni volta che in TV c\'è un dottore, abbassa lo sguardo. Quel camice in vetrina è rimasto un sogno.',
          emoji: '🌧️',
          choices: [{ suffix: 'c1', text: 'Conviverci' }],
        }
      },
      outcomes: (arc, state): Record<string, ArcOutcome> => {
        const medPath = arc.flags['path'] === 'medicina'
        const completedMed = state.education.completedLevels.includes('medical') || state.education.currentLevel === 'medical'
        const richEnough = state.finance.money > 50000
        if (medPath && completedMed) {
          return {
            c1: {
              effects: { happiness: 10, mentalHealth: 5 },
              logText: 'Il sogno di tua madre è realtà: sei un medico. L\'abbraccio fuori dall\'ospedale vale tutto.',
              relDelta: { love: 20, trust: 15 },
              memory: { title: 'L\'orgoglio di mamma', description: 'Il camice bianco della vetrina ora è tuo. La promessa è stata mantenuta.', emoji: '🩺' },
            },
          }
        }
        if (!medPath && richEnough) {
          return {
            c1: {
              effects: { happiness: 6 },
              logText: 'Tua madre ha accettato la tua strada: il successo parla da solo.',
              relDelta: { love: 12, trust: 10 },
              memory: { title: 'A modo mio', description: 'Non il camice bianco, ma una vita costruita con le tue mani. Mamma ha capito.', emoji: '🌅' },
            },
          }
        }
        return {
          c1: {
            effects: { mentalHealth: -5, happiness: -3 },
            logText: 'Il sogno di tua madre è rimasto in vetrina. Il senso di colpa, invece, è venuto a casa con te.',
            setFlags: { sogno_di_mamma_infranto: true },
            memory: { title: 'Il sogno infranto', description: 'Il camice bianco è rimasto nella vetrina. Certe promesse pesano per sempre.', emoji: '🌧️' },
          },
        }
      },
      defaultChoice: 'c1',
    },
  ],
}

const VOCE_DEL_QUARTIERE: StoryArcDef = {
  id: 'voce_del_quartiere',
  title: 'La Voce del Quartiere',
  emoji: '🎸',
  requiresTrait: 'talento_musicale',
  stages: [
    {
      ageMin: 8, ageMax: 9,
      build: () => ({
        title: 'La chitarra del nonno',
        description: 'In cantina, sotto un telo impolverato, trovi la vecchia chitarra del nonno. Le corde sono arrugginite, ma quando la sfiori... qualcosa dentro di te vibra.',
        emoji: '🎸',
        choices: [
          { suffix: 'c1', text: 'Imparare a suonarla' },
          { suffix: 'c2', text: 'Lasciarla in cantina' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { happiness: 4 },
          logText: 'Hai iniziato a suonare la chitarra del nonno. Le dita fanno male, il cuore no.',
          memory: { title: 'La chitarra del nonno', description: 'Una chitarra impolverata in cantina ha acceso qualcosa che non si spegnerà più.', emoji: '🎸' },
        },
        c2: {
          effects: {},
          logText: 'Hai lasciato la chitarra del nonno in cantina. La musica può aspettare... forse per sempre.',
          setFlags: { musica_abbandonata: true },
          abandon: true,
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 15, ageMax: 17,
      build: () => ({
        title: 'Il garage o i libri',
        description: 'I ragazzi del quartiere stanno mettendo su una band e vogliono te alla chitarra. Le prove sono tre sere a settimana... proprio nelle ore in cui dovresti studiare per il diploma.',
        emoji: '🥁',
        choices: [
          { suffix: 'c1', text: 'Entra nella band' },
          { suffix: 'c2', text: 'Concentrati sullo studio' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { happiness: 6, intelligence: -2 },
          logText: 'Sei entrato nella band del quartiere. Il garage profuma di sogni e birra economica.',
          setFlags: { band: true },
          memory: { title: 'La prima band', description: 'Tre accordi in un garage. Per qualche ora, siete rockstar.', emoji: '🥁' },
        },
        c2: {
          effects: { intelligence: 2, happiness: -2 },
          logText: 'Hai scelto i libri invece della band. La testa ringrazia, il cuore un po\' meno.',
          setFlags: { band: false },
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 20, ageMax: 24,
      build: () => ({
        title: 'Il talent scout',
        description: 'Dopo un\'esibizione, un uomo in giacca ti porge un biglietto da visita: «Ho un\'etichetta a Milano. Tu hai qualcosa. Vieni a registrare un demo — ma devi trasferirti, e subito.»',
        emoji: '🎤',
        choices: [
          { suffix: 'c1', text: 'Parti per Milano' },
          { suffix: 'c2', text: 'Resta: la tua vita è qui' },
        ],
      }),
      outcomes: () => ({
        c1: {
          effects: { money: 3000, happiness: 5, energy: -3 },
          logText: 'Sei partito per Milano a inseguire la musica. La famiglia non l\'ha presa benissimo.',
          setFlags: { pro: true },
          memory: { title: 'Il biglietto per Milano', description: 'Una valigia, una chitarra, un sogno. Milano ti aspetta.', emoji: '🚂' },
        },
        c2: {
          effects: { happiness: -3, mentalHealth: 2 },
          logText: 'Hai detto no al talent scout. Le radici hanno vinto sulle ali.',
          setFlags: { pro: false },
        },
      }),
      defaultChoice: 'c2',
    },
    {
      ageMin: 28, ageMax: 32,
      build: (state, arc) => {
        const madeIt = arc.flags['pro'] === true && state.skills.music >= 60
        if (madeIt) {
          return {
            title: 'Il palco è tuo',
            description: 'Il singolo è esploso. Stasera apri il concerto di un big al Forum di Assago. Dietro le quinte, ripensi alla chitarra impolverata del nonno. Ce l\'hai fatta.',
            emoji: '🌟',
            choices: [{ suffix: 'c1', text: 'Sali sul palco' }],
          }
        }
        return {
          title: 'La canzone alla radio',
          description: 'In macchina, alla radio, parte una canzone. È bella. È il tuo vecchio stile. La canta uno che conoscevi dai tempi del garage. Avrebbe potuto essere la tua voce.',
          emoji: '📻',
          choices: [{ suffix: 'c1', text: 'Alza il volume e lascia andare' }],
        }
      },
      outcomes: (arc, state): Record<string, ArcOutcome> => {
        const madeIt = arc.flags['pro'] === true && state.skills.music >= 60
        if (madeIt) {
          return {
            c1: {
              effects: { money: 20000, happiness: 10, reputation: 8 },
              logText: 'Il palco del Forum, le luci, il boato: la musica ti ha ripagato di tutto.',
              memory: { title: 'Il palco è tuo', description: 'Dalla cantina del nonno al Forum di Assago. La musica era davvero il tuo destino.', emoji: '🌟' },
            },
          }
        }
        return {
          c1: {
            effects: { happiness: -3, mentalHealth: -2 },
            logText: 'La tua canzone, cantata da un altro. Certe sliding doors fanno male.',
            setFlags: { what_if_musica: true },
            memory: { title: 'La canzone degli altri', description: 'Quella canzone alla radio avrebbe potuto essere tua. Il "che sarebbe successo se" resterà per sempre.', emoji: '📻' },
          },
        }
      },
      defaultChoice: 'c1',
    },
  ],
}

export const ARC_DEFS: StoryArcDef[] = [AMICO_INFANZIA, RIVALE_DI_SANGUE, SOGNO_DI_MAMMA, VOCE_DEL_QUARTIERE]
const ARC_MAP = Object.fromEntries(ARC_DEFS.map(a => [a.id, a])) as Record<string, StoryArcDef>

// ─────────────────────────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────────────────────────

export interface ArcChoiceResult {
  effects: Effect
  logText: string
  memory: { title: string; description: string; emoji: string } | null
  relationshipPatch: { npcId: string; trust?: number; love?: number; respect?: number; typeChange?: Relationship['type'] } | null
  newRelationship: Relationship | null
  consequence: PendingConsequence | null
  updatedArc: StoryArcState
}

export class StoryArcEngine {
  /** Initialize arcs at newGame. A1 always; trait arcs bound to family NPCs. Max 3. */
  static initArcs(
    traits: NarrativeTraitId[],
    relationships: Relationship[],
    startYear: number,
  ): StoryArcState[] {
    const arcs: StoryArcState[] = []
    for (const def of ARC_DEFS) {
      if (def.requiresTrait && !traits.includes(def.requiresTrait)) continue
      let npcId: string | null = null
      if (def.bindNpc === 'sibling') {
        npcId = relationships.find(r => r.type === 'sibling')?.id ?? null
        if (!npcId) continue
      } else if (def.bindNpc === 'mother') {
        npcId = relationships.find(r => r.type === 'parent' && r.gender === 'female')?.id ?? null
      }
      arcs.push({ arcId: def.id, stageIndex: 0, flags: {}, npcId, status: 'active', startedYear: startYear })
      if (arcs.length >= 3) break
    }
    return arcs
  }

  /**
   * Returns the arc event due this year (if any) and the arc list with
   * skipped stages auto-resolved. Call every annual tick.
   */
  static getDueEvent(state: GameState, newAge: number): {
    updatedArcs: StoryArcState[]
    due: { event: ArcGameEvent; choices: Choice[] } | null
  } {
    const arcs = (state.narrative?.arcs ?? []).map(a => ({ ...a, flags: { ...a.flags } }))
    let due: { event: ArcGameEvent; choices: Choice[] } | null = null

    for (const arc of arcs) {
      if (arc.status !== 'active') continue
      const def = ARC_MAP[arc.arcId]
      if (!def) { arc.status = 'abandoned'; continue }

      // Auto-resolve stages whose window closed without firing
      while (arc.stageIndex < def.stages.length && def.stages[arc.stageIndex].ageMax < newAge) {
        const stage = def.stages[arc.stageIndex]
        const outcome = stage.outcomes(arc, state)[stage.defaultChoice]
        if (outcome?.setFlags) Object.assign(arc.flags, outcome.setFlags)
        if (outcome?.abandon) { arc.status = 'abandoned'; break }
        arc.stageIndex += 1
      }
      if (arc.status !== 'active') continue
      if (arc.stageIndex >= def.stages.length) { arc.status = 'completed'; continue }

      // Fire the first due stage (one arc event per year max)
      const stage = def.stages[arc.stageIndex]
      if (!due && stage.ageMin <= newAge && newAge <= stage.ageMax) {
        const npc = arc.npcId ? state.relationships.find(r => r.id === arc.npcId) ?? null : null
        const built = stage.build(state, arc, npc)
        const eventId = `arc_${arc.arcId}_s${arc.stageIndex}`
        const choices: Choice[] = built.choices.map(c => ({
          id: `arc_${c.suffix}`,
          eventId,
          text: c.text,
          effects: {},
          requirements: [
            ...(c.moneyReq ? [{ stat: 'money', operator: '>=' as const, value: c.moneyReq }] : []),
            ...(c.intReq ? [{ stat: 'intelligence', operator: '>=' as const, value: c.intReq }] : []),
          ],
          packId: 'narrative',
        }))
        due = {
          event: {
            id: eventId,
            title: built.title,
            description: built.description,
            emoji: built.emoji,
            choices: [],
            triggerCondition: '',
            minAge: stage.ageMin,
            maxAge: stage.ageMax,
            probability: 1,
            packId: 'narrative',
            rarity: 'epic',
            isHistorical: false,
            arcMeta: { arcId: arc.arcId, stageIndex: arc.stageIndex },
            npcName: npc?.name,
          },
          choices,
        }
      }
    }

    return { updatedArcs: arcs, due }
  }

  /** Resolve an arc choice. choiceId = 'arc_c1' etc.; arcMeta read from currentEvent. */
  static applyChoice(state: GameState, choiceId: string): ArcChoiceResult | null {
    const meta = (state.currentEvent as ArcGameEvent | null)?.arcMeta
    if (!meta) return null
    const arc = (state.narrative?.arcs ?? []).find(a => a.arcId === meta.arcId)
    const def = ARC_MAP[meta.arcId]
    if (!arc || !def) return null
    const stage = def.stages[meta.stageIndex]
    if (!stage) return null

    const suffix = choiceId.replace('arc_', '')
    const outcome = stage.outcomes(arc, state)[suffix]
    if (!outcome) return null

    const updatedArc: StoryArcState = {
      ...arc,
      flags: { ...arc.flags, ...(outcome.setFlags ?? {}) },
      stageIndex: meta.stageIndex + 1,
      status: outcome.abandon
        ? 'abandoned'
        : meta.stageIndex + 1 >= def.stages.length ? 'completed' : 'active',
    }

    let newRelationship: Relationship | null = null
    if (outcome.createFriendNpc) {
      const relId = uid()
      newRelationship = {
        id: relId,
        npcId: uid(),
        name: outcome.createFriendNpc.name,
        age: state.time.age,
        gender: 'male',
        emoji: '👦',
        type: 'friend',
        stage: 'friend',
        trust: 60,
        jealousy: 0,
        attraction: 0,
        love: 30,
        respect: 55,
        toxicityTag: false,
        historyFlags: ['childhood_friend', `arc_${arc.arcId}`],
        personalityTraits: ['leale'],
        mood: 'felice',
        memoryLog: [{
          id: uid(), category: 'friendship',
          description: `Vi siete conosciuti da bambini al parco.`,
          year: state.time.year, weight: 5, decayFactor: 0, unforgettable: true,
        }],
        isAlive: true,
        nationality: state.identity.nationality,
      }
      updatedArc.npcId = relId
    }

    return {
      effects: outcome.effects,
      logText: outcome.logText,
      memory: outcome.memory ?? null,
      relationshipPatch: (outcome.relDelta || outcome.relTypeChange) && arc.npcId
        ? { npcId: arc.npcId, ...outcome.relDelta, typeChange: outcome.relTypeChange }
        : null,
      newRelationship,
      consequence: outcome.consequence ? outcome.consequence(state.time.age) : null,
      updatedArc,
    }
  }
}
