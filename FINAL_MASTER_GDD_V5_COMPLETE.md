# MASTER GDD: Life Simulator 2D (Competitor BitLife)

## 1. Visione del Prodotto

Creare un simulatore di vita 2D cross-platform, in stile life-sim testuale con elementi visivi leggeri, pensato per web e mobile. L’obiettivo è superare BitLife con una struttura più profonda, un sistema relazionale più forte, una simulazione più credibile e una UI più pulita e reattiva.

## 2. Principi Fondamentali

- Architettura React-centric
- Zustand come stato globale principale
- Phaser 3 solo per micro-animazioni isolate
- Dati iniziali in JSON locale, con migrazione futura a Supabase
- Nessuna UI monolitica
- Ogni scelta deve avere effetti misurabili sulle statistiche
- Ogni sistema deve essere bilanciato con regole chiare di sopravvivenza e progressione

## 3. Stack Tecnologico

- React 18
- TypeScript
- Vite
- Zustand
- Capacitor 6
- Tailwind CSS oppure CSS puro
- Phaser 3 solo per singoli elementi animati
- JSON locale per il data layer iniziale
- Supabase come evoluzione futura

## 4. Architettura UI

La UI deve essere separata in componenti modulari:

- HUD
- EventDisplay
- ChoiceButtons
- ActionMenu
- CareerScreen
- RelationshipScreen
- GoalsScreen
- NationScreen

Phaser 3 deve essere usato solo per:

- bottone `Invecchia`
- popup evento
- piccole animazioni di feedback

## 5. Sistema Dati

Il file `db.json` deve essere strutturato come un database relazionale piatto, con tabelle separate:

- `stats`
- `jobs`
- `characters`
- `events`
- `choices`
- `requirements`
- `goals`
- `random_events`
- `nations`

Ogni `choice` deve avere:

- `id`
- `event_id`
- `testo`
- `effetti`

Ogni `effetti` deve mappare direttamente le chiavi dello store Zustand.

## 6. Architettura Relazionale

Ogni entità deve avere relazioni esplicite con le altre:

- gli eventi puntano alle scelte
- le scelte modificano lo stato
- le requirements filtrano la disponibilità
- i goals si attivano su condizioni dello stato
- le nations influenzano salari, tasse e recupero salute

## 6.1 Glossario Tecnico

Definizioni dei termini ricorrenti nel documento e nel codice. Queste definizioni sono vincolanti: il codice deve rispettarle esattamente.

|Termine             |Tipo         |Definizione                                                                                                                                                      |
|--------------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`history_flags`     |`string[]`   |Array di stringhe che registrano eventi passati unici per una relazione (es. `["has_cheated", "saved_life", "married"]`). Influenza eventi futuri e dialoghi NPC.|
|`toxicity_tag`      |`boolean`    |Segna una relazione come tossica. Abilita eventi negativi (abuso, manipolazione) e blocca percorsi positivi.                                                     |
|`diminishingReturns`|meccanica    |Efficacia ridotta del 10% a ogni uso consecutivo nello stesso anno. Reset annuale. Es: studiare 5 volte → +5, +4.5, +4, +3.5, +3 di intelligenza.                |
|`pack_id`           |`string`     |ID del pacchetto di espansione. `"base"` = core sempre attivo. Es: `"pack_mafia_001"`.                                                                           |
|`ironMan`           |`boolean`    |Flag nel save per Modalità Hardcore. Immutabile dopo creazione.                                                                                                  |
|`relationship_stage`|enum         |`stranger → acquaintance → friend → close_friend → partner → spouse`                                                                                             |
|`memory_log`        |`NPCMemory[]`|Memorie dell’NPC sul player. Influenza trust/hate/love/respect. Cap: 200 entry.                                                                                  |
|`trigger_condition` |DSL string   |Valutata dal TriggerEngine. Es: `"age >= 18 && criminal_record == 0"`.                                                                                           |
|`effects`           |`Effect`     |`{ [stat_key]: delta }` applicato allo stato dopo una scelta. Tutti i delta sono numeri.                                                                         |
|`annualLimit`       |`number`     |Max utilizzi di un’azione in un anno in-game. Reset a ogni turno.                                                                                                |
|`cooldown`          |`number`     |Anni di attesa tra un uso e l’altro di un’azione.                                                                                                                |
|`legacy_score`      |0-1000       |Calcolato alla morte. Determina bonus per il personaggio figlio.                                                                                                 |
|`viral_score`       |0-100        |Punteggio post social media. Determina reach e follower gain.                                                                                                    |
|`world_event`       |macro-evento |Modifica nazioni via WorldEventEngine, indipendente dal player.                                                                                                  |

## 7. Bilanciamento Base

Il gioco deve evitare progressioni facili o infinite.
Le azioni ripetute devono avere:

- `maxUses`
- `cooldown`
- `annualLimit`
- `relationshipLimit`
- `diminishingReturns`

Esempi:

- studiare troppe volte in un anno riduce l’efficacia
- tradire la stessa persona troppe volte aumenta il rischio di rottura
- chiedere aiuto economico ripetuto abbassa fiducia e reputazione

## 8. Sistema di Sopravvivenza

Il gioco deve prevedere:

- decadimento naturale della salute con l’età
- decadimento della felicità se il personaggio è in condizioni negative
- soglie di morte, depressione e fallimento economico
- effetti della nazione e del costo della vita
- impatto della carriera sullo stress e sulla salute mentale

## 9. Sistema Nazioni

Ogni nazione deve influenzare:

- tasse
- recupero salute
- costo della vita
- eventi esclusivi
- accesso a lavori e carriere
- possibilità burocratiche e legali

## 10. Game Loop

### 10.1 Gestione del Tempo e Timeline Storica

**Formato data in-game:** anno (integer) + mese (integer 1-12). Entrambi nello stato Zustand.

```typescript
interface TimeState {
  year: number   // es: 2001
  month: number  // 1-12
  age: number    // years lived
}
```

**Calcolo anno di nascita:** `birth_year = current_real_year - player_start_age`. Il player sceglie l’anno di nascita in Character Creation (slider 1950–2020).

**Avanzamento:** ogni `handleInvecchia()` incrementa l’età di 1 anno e avanza il calendario di 12 mesi, con possibilità di eventi mensili se implementati in futuro.

**Trigger eventi storici:**

```typescript
// In TriggerEngine.evaluate() — cases aggiuntivi per eventi storici
if (condition.startsWith('year ==')) {
  const targetYear = parseInt(condition.split('==')[1].trim())
  return stats.year === targetYear
}
if (condition.startsWith('year >=')) {
  return stats.year >= parseInt(condition.split('>=')[1].trim())
}
```

**Timeline eventi storici (trigger automatici):**

|Anno|Evento               |Trigger condition                         |Effetti                                      |
|----|---------------------|------------------------------------------|---------------------------------------------|
|1969|Moon Landing         |`year == 1969`                            |+optimism globale, +interesse scientifico    |
|1986|Chernobyl            |`year == 1986 && nationality == 'ukraine'`|-salute nazione, eventi radiation            |
|1989|Caduta Muro Berlino  |`year == 1989 && nationality == 'germany'`|+libertà movimento Europa                    |
|2001|11 Settembre         |`year == 2001`                            |+sicurezza aeroporti, -viaggio internazionale|
|2007|Lancio iPhone        |`year == 2007`                            |Sblocca social media e app dating            |
|2008|Crisi Finanziaria    |`year == 2008`                            |Salari -20%, case -30%, disoccupazione +     |
|2020|COVID-19             |`year == 2020`                            |Lockdown, remote work, morti NPC di massa    |
|2022|Guerra Russia-Ucraina|`year == 2022`                            |+costo energia, coscrizione possibile        |
|2023|AI Revolution        |`year == 2023`                            |Nuovi lavori, vecchi obsoleti, +automazione  |

Il loop principale deve:

1. incrementare l’età
1. consumare energia
1. applicare salario se il personaggio lavora
1. applicare decadimento naturale
1. applicare effetti nazione
1. controllare eventi casuali
1. filtrare gli eventi validi
1. mostrare l’evento corrente
1. applicare la scelta del giocatore
1. verificare goals, morte e salvataggio

## 11. Zustand Store

Il file `gameStore.ts` deve contenere:

- stato globale
- relazioni
- evento corrente
- azioni giornaliere
- goals completati
- inventario
- stato game over

Azioni richieste:

- `handleInvecchia()`
- `handleChoice(choiceId)`
- `aggiornaStats(effetti)`
- `salvaGioco()`
- `caricaGioco()`
- `resetGiorno()`
- `checkGoals()`
- `checkMorte()`
- `checkEventRequirements(event, stats)`
- `applyNazioneEffect()`

## 12. UI/UX

### 12.1 Wireframe Mobile (Schermata Principale)

Layout fisso per schermi 375-430px (iPhone SE → iPhone 16 Pro Max).

```
┌─────────────────────────────────────────┐
│ ❤️ 85  🧠 70  😊 65  ⚡80  💰€500  🔢25y │  ← HUD sticky top
│ ████░░  ██████░  ████░░  ██████░        │  ← progress bars
├─────────────────────────────────────────┤
│                                         │
│  📢 Hai trovato €50 sul pavimento.      │  ← EventDisplay (card)
│  Cosa fai?                              │
│                                         │
│  ┌─────────────┐  ┌─────────────┐       │
│  │  💰 Prendi  │  │  🌟 Lascia  │       │  ← ChoiceButtons
│  └─────────────┘  └─────────────┘       │
│                                         │
│  ────── Accaduto di recente ─────────   │
│  🏥 Età 24: visita medico (+20 salute)  │  ← EventLog
│  💼 Età 23: promosso a Supervisor      │    (scrollabile)
│  ❤️ Età 22: prima relazione seria       │
│                                         │
├─────────────────────────────────────────┤
│ [💼Carriera] [❤️Relazioni] [🎯Goals] [⚙️] │  ← BottomTabs fisso
├─────────────────────────────────────────┤
│                                         │
│    ┌───────────────────────────────┐    │
│    │   👴  INVECCHIA +1 ANNO  👴   │    │  ← AgeButton (Phaser)
│    └───────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Specifiche layout:**

|Zona        |Altezza  |Comportamento                           |
|------------|---------|----------------------------------------|
|HUD         |60px     |Sticky top, sempre visibile             |
|EventDisplay|~150px   |Card centrata, testo + scelte           |
|EventLog    |flex-grow|Scrollabile, occupa spazio disponibile  |
|BottomTabs  |56px     |Sticky bottom, 4-5 tab                  |
|AgeButton   |80px     |Fixed bottom sopra tabs, sempre visibile|

**Palette colori base:**

|Elemento        |Colore   |Note                        |
|----------------|---------|----------------------------|
|Background      |`#1a1a2e`|Dark navy                   |
|Card evento     |`#16213e`|Slightly lighter            |
|AgeButton       |`#e94560`|Rosso acceso, CTA principale|
|Stat positiva   |`#0f9b58`|Verde                       |
|Stat negativa   |`#e94560`|Rosso                       |
|Testo primario  |`#eaeaea`|Off-white                   |
|Testo secondario|`#a0a0b0`|Gray                        |

La UI deve essere:

- mobile-first
- leggibile
- modulare
- rapida nei feedback
- accessibile con touch
- coerente con il tono del life sim

Requisiti visivi:

- HUD con 6 stat principali
- log eventi centrale
- pulsanti scelta in basso
- bottone `Invecchia` ben visibile
- menu secondario per carriera, relazioni, goals e nazione

## 13. Asset Compliance

Usare esclusivamente:

- Kenney RPG UI Pack
- Game-icons.net
- Google Font Inter

Phaser 3 deve restare limitato a:

- animazione del bottone `Invecchia`
- pop-up evento
- piccoli effetti di feedback

## 14. Roadmap di Implementazione

### Fase 1: Setup progetto

1. Creare progetto Vite React TypeScript
1. Installare Zustand, Capacitor e dipendenze base
1. Creare cartelle `src/assets`, `src/components`, `src/store`, `src/data`, `src/services`
1. Inserire i file JSON e lo store

### Fase 2: Motore di gioco

1. Implementare `gameStore.ts`
1. Implementare `handleInvecchia()`
1. Implementare `handleChoice()`
1. Implementare validazione eventi e goals
1. Implementare salvataggio

### Fase 3: UI

1. Creare `HUD`
1. Creare `EventDisplay`
1. Creare `ChoiceButtons`
1. Creare `ActionMenu`
1. Creare schermate secondarie

### Fase 4: Rifinitura

1. Aggiungere bilanciamento
1. Aggiungere nations
1. Aggiungere micro-animazioni Phaser
1. Integrare Capacitor
1. Testare su mobile

## 15. Prompt Operativo per AI Coding

Agisci come Senior Game Developer. Implementa il progetto seguendo questo GDD.

Priorità:

1. Crea `src/data/db.json` con tutte le tabelle
1. Crea `src/store/gameStore.ts` con stato completo e azioni
1. Crea il motore di validazione eventi e scelte
1. Crea UI modulare React
1. Integra Phaser 3 solo per micro-animazioni
1. Mantieni l’architettura React-centric
1. Assicurati che ogni scelta aggiorni lo stato in modo coerente
1. Implementa bilanciamento, sopravvivenza, goals, morte e salvataggio
1. Non creare file monolitici
1. Scrivi codice pronto per mobile e futuro porting Supabase

-----

## 16. Feature Map Compatta — Overview di Tutti i Sistemi

Indice rapido di tutti i 35 sistemi da implementare. Ogni sistema è espanso in dettaglio nelle sezioni successive.

### 16.1 Identità e statistiche base

salute, salute mentale, felicità, intelligenza, aspetto, energia, karma, età, genere, nazionalità, background familiare, reputazione, reputazione sociale

### 16.2 Sistema famiglia e relazioni

genitori, fratelli, partner, matrimonio, divorzio, figli, amici, ex partner, tradimenti, relazioni segrete, tossiche, compatibilità emotiva, fiducia, gelosia, attrazione — ogni relazione ha: `relationship_type`, `trust`, `jealousy`, `attraction`, `toxicity_tag`, `history_flags`, `relationship_stage`

### 16.3 Sistema educativo

scuola dell’infanzia, elementari, medie, liceo, università, master, scuole professionali, corsi specialistici, borse di studio, bocciature, abbandono scolastico, club scolastici, rapporti con insegnanti e compagni

### 16.4 Sistema lavoro e carriera

part-time, dipendenti, freelance, partita IVA, azienda propria, carriere specialistiche/creative/sportive/criminali, promozioni, licenziamenti, burnout, pensionamento, contributi, tasse, stipendio

### 16.5 Sistema criminale e legale

furto, frode, aggressione, rapina, omicidio, traffico illecito, arresto, processo, prigione, fuga, libertà vigilata, recidiva, fedina penale persistente

### 16.6 Sistema salute, corpo e chirurgia

visite mediche, malattie, farmaci, cure, fitness, dieta, meditazione, infortuni, dipendenze, chirurgia estetica, chirurgia correttiva, effetti permanenti

### 16.7 Sistema hobby e skill

strumenti musicali, sport, arti creative, lettura, danza, cucina, gaming, allenamento, lingue, collezionismo — ogni hobby ha livello skill, pratica, progressione, decadimento, possibilità monetizzazione

### 16.8 Sistema finanza e asset

soldi, conti bancari, debiti, investimenti, azioni, lotto, case, auto, oggetti di lusso, mutui, affitti, eredità, donazioni, fallimento finanziario

### 16.9 Sistema social e reputazione

social media, follower, fama, scandali, gossip, reputazione pubblica, cancel culture, interazioni pubbliche

### 16.10 Sistema gioco generale

eventi casuali, scelte multiple, outcome randomizzati, achievement, ribbon/trofei, challenges, personalizzazione, micro-eventi narrativi

### 16.11 Regola anti-abuso azioni

`maxUses`, `cooldown`, `annualLimit`, `relationshipLimit`, `diminishingReturns` — studiare troppo riduce efficacia, tradire troppo aumenta rischio rottura, aiuto economico ripetuto abbassa fiducia

### 16.12 Sistema emoji e stati facciali

felice, triste, arrabbiato, innamorato, geloso, imbarazzato, stanco, stressato, malato, ferito, vecchio, morto — sia per player che NPC, cambiano in base a età/salute/umore/relazione/evento

### 16.13 Sistema religione e spiritualità

Cattolicesimo, Islam, Buddismo, Induismo, Ebraismo, Protestantesimo, Ortodossia, Ateismo, Agnosticismo — pratiche religiose, conversione, matrimonio religioso, karma spirituale, goal religiosi (→ Sezione 18)

### 16.14 Sistema animali domestici

cani, gatti, conigli, uccelli, pesci, cavalli, animali esotici — adozione, cura, visite veterinarie, addestramento, legame emotivo, morte animale, animal influencer (→ Sezione 19)

### 16.15 Sistema viaggi e turismo

viaggi nazionali/internazionali, destinazioni esotiche, crociere, viaggi nozze/lavoro/scuola — costi, visti, turismo culturale/avventura/benessere, rischi, memoria di viaggio (→ Sezione 20)

### 16.16 Sistema politica e impegno civico

votare, campagne elettorali, candidarsi (consigliere → sindaco → deputato → presidente), lobbying, attivismo, proteste, scandali politici, corruzione (→ Sezione 21)

### 16.17 Sistema mini-games e intrattenimento

Casinò (slot, blackjack, roulette, poker, craps, baccarat), giochi di abilità (scacchi, go, jongkong, dadi), sport competitivi (tennis, golf, bowling, biliardo, fighting game), lotteria, gratta e vinci, scommesse (→ Sezione 22)

### 16.18 Sistema eventi unici e morte personalizzata

eventi rari basati su stats/percorso/storia — 12 tipi di morte dettagliati (naturale, malattia, incidente, omicidio, suicidio, esecuzione, guerra, disastro, pandemia, assassinio politico, incidente traffico, overdose) (→ Sezione 23)

### 16.19 Sistema sessualità e salute riproduttiva

attività sessuale, orientamento, contraccezione (9 metodi), MST (9 tipi), gravidanza trimestrale, aborto, fertilità, FIV, surrogacy (→ Sezione 24)

### 16.20 Sistema patente, guida e trasporti

patenti A1/A2/A/B/C/D/E, scuola guida, esami, infrazioni, incidenti, acquisto auto, assicurazione, trasporti pubblici (bus, metro, treno, aereo, bicicletta, monopattino) (→ Sezione 25)

### 16.21 Sistema adozione e parenting

adozione nazionale/internazionale/open/closed/foster — 4 stili genitoriali, interazioni quotidiane figlio, eventi evolutivi 0-30+ anni, stat figlio con big 5 personality (→ Sezione 26)

### 16.22 Sistema militare, prigionia e carriere speciali

rami militari, gradi, missioni, PTSD — tipi di prigione, gang, riabilitazione — licenze professionali (medico, avvocato, pilota, ingegnere) — sport pro (calcio, NBA, F1) — influencer/YouTuber (→ Sezione 27)

### 16.23 Sistema finanza personale e living situation

credit score 300-850 (5 fattori) — fasi living (genitori → dormitorio → roommate → indipendente → mutuo) — roommate dynamics — NPC autonomi con vita propria (→ Sezione 28)

### 16.24 Sistema educazione superiore avanzata

Medical School, Law School, PhD (4-7 anni), MBA, specializzazioni mediche — attività extracurriculari (sport, club, musica, leadership) — eventi scolastici (prom, graduation, senior trip) (→ Sezione 29)

### 16.25 Sistema piercing, tatuaggi e personalizzazione corpo

piercing (orecchie, naso, labbro, ombelico, intimo) — tatuaggi (taglia, stili, posizioni, costi) — dolore, infezione, guarigione, rimozione laser, impatto professionale/relazioni (→ Sezione 30)

### 16.26 Sistema sostanze, alcol e fumo

alcol (birra, vino, cocktails, hard liquor) — alcolismo, withdrawal, rehab, AA — fumo (sigarette, vape, marijuana) — dipendenze, metodi smettere, impatto salute/aspetto/finanze (→ Sezione 31)

### 16.27 Sistema dating moderno, proposta e matrimonio

app dating (Tinder, Bumble, Hinge, OkCupid) — ghosting, situationship — proposal (anello €500-€50000) — wedding planning (€15000-€50000) — matrimonio combinato — divorzio 40-50% (→ Sezione 32)

### 16.28 Sistema beauty routine, cura personale e abbigliamento

capelli, unghie (gel, acrylic), depilazione laser, skincare, makeup, barba — guardaroba economic/medium/luxury/ultra-luxury — brand luxury (Gucci, LV, Rolex) — impatto reputazione/dating (→ Sezione 33)

### 16.29 Sistema pensionamento e vita post-lavoro

pensionamento volontario/forzato/early/medical — Social Security €1000-€6000/mese — living (aging in place → nursing home) — dementia/Alzheimer’s — end-of-life (will, funeral €7000-€20000) (→ Sezione 34)

### 16.30 Sistema eventi storici, festività e manutenzione casa

eventi storici (11/9, COVID, iPhone, ChatGPT) — festività (Natale, Halloween, Ramadan, Diwali) — manutenzione casa (rotture, ristrutturazioni, costi regolari) (→ Sezione 35)

### 16.31 Modalità di gioco e cheat system

Normale, Difficile, Modalità Dio, Ghost Mode, Legacy Mode, Challenge Mode — cheat per testing: `addMoney()`, `immortal()`, `skipToAge()` — debug tools (→ Sezione 36)

### 16.32 Sistema Challenge (Eventi a Tempo)

challenge settimanali/mensili/stagionali/lifetime — categorie (career, financial, relational, educational, criminal, travel, special) — reward system (punti, ribbon, item) — streak bonus — community leaderboard (→ Sezione 36)

### 16.33 Sistema Generational Legacy (Dinastia Familiare)

tratti genetici trasmissibili (intelligenza 50%, aspetto 60%, salute 40%) — asset ereditati (soldi, casa, auto, business) — relazioni conservate — memoria familiare — bonus figli in base a legacy score — continuazione partita come figlio (→ Sezione 37)

### 16.34 Sistema Customization (Editor Contenuti)

scenario editor — event builder — character maker — job designer — item creator — goal workshop — sharing community (10k+ scenari) — rating/download system — validation AI per balance check (→ Sezione 38)

### 16.35 Sistema Medaglie Avanzato (Ribbons/Achievements)

100+ ribbon in categorie (career, financial, relational, educational, health, criminal, travel, special) — 5 tier (bronze/silver/gold/platinum/diamond) — progress tracking — showcase pubblico — completion bonus permanente (→ Sezione 39)

### 16.36 Sistema Social Media Dinamico (Influencer Simulator Avanzato)

algoritmo viralità con formula matematica — 8 tipi di post (foto/video/live/trending/controversial) — engagement variabile — algorithm multiplier giornaliero — social events (viral, cancel, endorsement, collab) — 6 stage di crescita (→ Sezione 40)

### 16.37 Sistema Espansioni (Job Packs Modulari)

architettura modulare con `pack_id` — job packs acquistabili (Mafia, Actor, Medical, Artistic, Business, Sports, Special) — formato JSON standard — activation/deactivation senza rompere save — community packs (→ Sezione 41)

### 16.38 Sistema Ricordi NPC (Memory System)

ogni NPC ha `Memory[]` con log interazioni — categorie (romantic, family, friendship, professional, financial, criminal) — decay factor per età memoria — weight by importance (1-5) — trigger memory events — unforgettable flag per azioni critiche (→ Sezione 42)

### 16.39 Sistema Scoperte e Segreti (Hidden Lore)

eventi rari procedurali basati su combinazioni uniche di stats/storia — easter eggs sbloccabili — community discussion driver — rarity scale (hidden/rare/legendary) (→ Sezione 43)

### 16.40 Sistema Global State (Mondo Dinamico)

WorldEventEngine modifica nations.json in tempo reale — crisi economica (salari -20%) — innovazione tecnologica (nuovi lavori) — cambiamenti legali (cannabis, aborto) — eventi macro che cambiano il contesto di gioco (→ Sezione 44)

### 16.41 Integrazione Asincrona (Notifiche Push)

notifiche basate su Memory System NPC — eventi di vita figli/familiari — re-engagement intelligente non aggressivo — “Tua figlia si è sposata, festeggi?” (→ Sezione 45)

### 16.42 Modalità Hardcore (Iron Man Mode)

`ironMan: true` nel save — salvataggio unico senza reload — decadimento salute +30% — scelte irreversibili — prestigio per completionist (→ Sezione 46)

-----

## 17. Sistemi Base — Feature Map Dettagliata

### 17.1 Identità e statistiche base

Variabili persistenti principali:

|Stat               |Range    |Note                                     |
|-------------------|---------|-----------------------------------------|
|salute             |0-100    |decade con età e malattie                |
|salute mentale     |0-100    |influenzata da eventi traumatici         |
|felicità           |0-100    |decade se in condizioni negative         |
|intelligenza       |0-100    |aumenta con studio e hobby cognitivi     |
|aspetto            |0-100    |influenzato da beauty routine e chirurgia|
|energia            |0-100    |si consuma ogni turno                    |
|karma              |-100/+100|influenza outcome casuali                |
|età                |0-120    |incrementa ogni turno                    |
|reputazione        |0-100    |influenzata da azioni pubbliche          |
|reputazione sociale|0-100    |separata dalla reputazione professionale |

Variabili fisse all’inizio partita: genere, nazionalità, background familiare.

### 17.2 Sistema famiglia e relazioni

Tipi relazione supportati: genitori, fratelli, partner, coniuge, figli, amici, ex partner, colleghi, rivali.

Dinamiche supportate: matrimonio, divorzio, tradimento, relazione segreta, relazione tossica, compatibilità emotiva, gelosia, attrazione.

Ogni relazione deve avere:

- `relationship_type`
- `trust` (0-100)
- `jealousy` (0-100)
- `attraction` (0-100)
- `toxicity_tag` (boolean)
- `history_flags` (array di eventi passati)
- `relationship_stage` (straniero → conoscente → amico → intimo → partner → coniuge)

### 17.3 Sistema educativo

Livelli scolastici in sequenza: scuola dell’infanzia → elementari → medie → liceo → università → master.
Percorsi alternativi: scuole professionali, corsi specialistici, borse di studio.
Rischi: bocciatura, abbandono scolastico.
Attività: club scolastici, rapporti con insegnanti e compagni.

Ogni livello deve avere:

- `requisiti_accesso`
- `probabilità_successo` (%)
- `rischio_bocciatura` (%)
- `effetti` (su intelligenza, reputazione, carriera futura)
- `durata` (anni)
- `costo` (tuition, materiali)

### 17.4 Sistema lavoro e carriera

Tipi di impiego: part-time, dipendente, freelance, partita IVA, azienda propria.
Categorie carriere: specialistiche, creative, sportive, criminali, pubbliche.
Meccaniche: promozioni, licenziamenti, burnout, pensionamento, contributi previdenziali.

Ogni lavoro deve avere:

- `requisiti_studio`
- `requisiti_reputazione`
- `requisiti_fedina` (penale)
- `requisiti_eta`
- `requisiti_licenza`
- `possibilità_promozione` (%)
- `tipo_contratto`
- `stipendio_range`
- `stress_level` (influenza salute mentale)

### 17.5 Sistema criminale e legale

Crimini disponibili: furto, frode, aggressione, rapina, omicidio, traffico illecito.
Conseguenze: arresto, processo, prigione, fuga, libertà vigilata, recidiva.
La fedina penale è persistente e influenza:

- accesso ai lavori e carriere pubbliche
- reputazione e relazioni
- possibilità di aprire azienda o ottenere licenze
- immigrazione e visti internazionali

### 17.6 Sistema salute, corpo e chirurgia

Meccaniche: visite mediche, malattie, farmaci, cure, fitness, dieta, meditazione, infortuni.
Dipendenze: droghe, alcol, gioco d’azzardo, social media.
Chirurgia estetica (ogni procedura deve avere):

- `costo`
- `rischio_complicazioni` (%)
- `tempo_recupero`
- `risultato_variabile` (range min-max)
- `possibili_complicazioni`

Chirurgia correttiva: effetti permanenti (aumento/perdita vista, mobilità, etc.).

### 17.7 Sistema hobby e skill

Hobby disponibili: strumenti musicali, sport, arti creative, lettura, danza, cucina, gaming, allenamento, lingue, collezionismo.

Ogni hobby deve avere:

- `skill_level` (0-100)
- `pratica_richiesta` (ore/settimana per mantenere)
- `progressione` (curva di apprendimento)
- `decadimento` (% perdita per anno di inattività)
- `monetizzazione` (possibilità → freelance → carriera)

### 17.8 Sistema finanza e asset

Asset supportati: soldi liquidi, conti bancari, azioni, case, auto, oggetti di lusso.
Debiti: mutuo, prestito personale, carta di credito, debiti illegali.
Meccaniche: investimenti (rendimento variabile), lotto, affitti (entrate passive), eredità.
Rischio: fallimento finanziario (soglia 0 soldi + debiti insostenibili).

### 17.9 Sistema social e reputazione

Meccaniche: profilo social media, follower (crescita organica o virale), sponsorizzazioni.
Rischi: scandali, gossip, cancel culture — un singolo evento può azzerare la reputazione.
Reputazione pubblica separata da reputazione professionale e relazionale.

### 17.10 Sistema gioco generale

- Ogni turno (`Invecchia`) genera 1-3 eventi casuali filtrati per eligibilità
- Scelte multiple con outcome parzialmente randomizzati entro range definiti
- Achievement sbloccabili per percorsi di vita insoliti
- Ribbon/trofei di fine partita (classifiche longevità, ricchezza, felicità)
- Challenges: obiettivi speciali con ricompense (es. “Milionario a 25 anni”)
- Micro-eventi narrativi: interazioni brevi senza scelte multiple

### 17.11 Regola anti-abuso azioni (dettaglio)

Ogni azione ripetibile deve implementare almeno uno dei seguenti limiti:

|Limite              |Descrizione                         |Esempio                        |
|--------------------|------------------------------------|-------------------------------|
|`maxUses`           |Numero massimo di utilizzi totali   |Chirurgia estetica max 5x      |
|`cooldown`          |Turni di attesa tra un uso e l’altro|Studiare: cooldown 1 turno     |
|`annualLimit`       |Max utilizzi per anno in-game       |Studio intensivo: 3x/anno      |
|`relationshipLimit` |Max utilizzi per la stessa relazione|Tradimento: 2x → rottura certa |
|`diminishingReturns`|Efficacia ridotta a ogni uso        |Allenamento: -10% per uso extra|

### 17.12 Sistema emoji e stati facciali

Le emoji cambiano dinamicamente in base a combinazioni di stato:

|Condizione         |Emoji|
|-------------------|-----|
|felicità > 70      |😊    |
|felicità < 30      |😢    |
|salute < 20        |🤒    |
|salute mentale < 20|😰    |
|partner attivo     |😍    |
|tradimento scoperto|😤    |
|energia < 20       |😴    |
|età > 70           |👴/👵  |
|salute = 0         |💀    |
|innamorato         |🥰    |
|geloso             |😒    |
|imbarazzato        |😳    |

Emoji applicate sia al player sia a tutti gli NPC con relazione attiva.

-----

## 18. Sistema Religione e Spiritualità

**Credenze supportate:**
Cattolicesimo, Islam, Buddismo, Induismo, Ebraismo, Protestantesimo, Ortodossia, Ateismo, Agnosticismo, Nuovi movimenti religiosi, Spiritismo.

**Meccaniche religiose:**

- Pratica religiosa (chiesa, moschea, tempio, meditazione)
- Conversione religiosa (possibile a qualsiasi età, effetti relazionali)
- Matrimonio religioso (requisiti specifici per credenza)
- Battesimo dei figli (scelta genitore)
- Digiuno e penitenza (effetti su salute e karma)
- Confessione e perdono (riduce karma negativo)
- Karma spirituale (influenza outcome casuali)
- Peccati e virtù (registro persistente)
- Vita dopo la morte (credenza influenza accettazione morte in-game)

**Impatto sulla gameplay:**

- Influisce su relazioni con familiari di fede diversa
- Modifica accesso a certi lavori (es. insegnante di religione, prete, imam)
- Sblocca eventi esclusivi (pellegrinaggi, festività religiose, cerimonie)
- Goal religiosi: “Diventa prete”, “Pellegrinaggio a Gerusalemme/Mecca”, “Costruisci una cappella”
- Karma spirituale bilancia outcome casuali favorevoli/sfavorevoli

Ogni pratica religiosa deve avere:

- `costo_tempo` (settimanale/mensile in turni)
- `benefici_stat` (felicità, salute mentale, karma)
- `requisiti` (credenza, regione, età minima)
- `conseguenze_sociali` (reputazione con certi gruppi NPC)

-----

## 19. Sistema Animali Domestici e Affettuosità

**Animali supportati:**

- Cani (razze: labrador, pastore tedesco, chihuahua, bulldog, golden retriever, etc.)
- Gatti (razze: persiano, siamese, maine coon, europeo, bengala, etc.)
- Conigli, Uccelli (pappagalli, canarini), Pesci
- Cavalli (richiede proprietà con terreno, élite)
- Animali esotici (serpenti, iguana, ratti — élite, requisiti legali per nazione)

**Meccaniche animali:**

- Adozione (canile/gattile gratuito) o acquisto (allevatore, €200-€5000)
- Cura base quotidiana: cibo, acqua, pulizia (se neglected → -bond, rischio malattia)
- Visite veterinarie (€50-€500, annuali obbligatorie)
- Malattie animali (costo cure €100-€5000, possibile morte)
- Morte animale → evento lutto per player (-felicità, -salute mentale)
- Addestramento (comandi base → tricks avanzati, livello 1-10)
- Riproduzione animale (cuccioli → adozione o vendita)
- Perdita animale (smarrimento 5%, furto 2%)

**Relazione con animali:**

- Legame emotivo `bond_level` (0-100%, cresce con cura e interazione)
- Comportamenti animali che cambiano in base a `happiness` e `health`
- Events speciali: cane salva padrone, gatto porta “doni”, animale che scappa
- Animale come “membro famiglia” (influenza umore casa)
- Animal influencer: cane/gatto su Instagram (follower, sponsorizzazioni pet food)

Ogni animale deve avere:

- `species`, `breed`, `name`, `age`, `health`, `happiness`
- `bond_level` (0-100)
- `cost_maintenance` (€/mese)
- `lifespan` (anni medi per specie/razza)
- `special_abilities` (es. cane da caccia, gatto cacciatore, cavallo da corsa)

-----

## 20. Sistema Viaggi e Turismo Internazionale

**Destinazioni:**

- Viaggi nazionali (entro la propria nazione, auto/treno)
- Viaggi internazionali per macro-area: Europa, Asia, Americhe, Africa, Oceania
- Destinazioni esotiche: Maldive, Bali, Safari africano, Patagonia, Islanda
- Crociere (Mediterraneo, Caraibi, Alaska, Norvegia)
- Viaggi di nozze (honeymoon package)
- Viaggi di lavoro (business trip — spese pagate dall’azienda)
- Viaggi scolastici (gita scolastica — effetti su relazioni coi compagni)

**Meccaniche viaggi:**

- Prenotazione volo/hotel (advance booking = -20% costo)
- Costi: classe economica (€200-€800), business (€800-€3000), first (€3000-€15000)
- Visti e passaporti (alcune nazioni richiedono visto, €50-€200, 2-4 settimane attesa)
- Dogana e controlli (rischio sequestro oggetti, +50% se fedina penale)
- Turismo culturale: musei, monumenti, siti UNESCO (+apertura mentale)
- Turismo avventura: sport estremi, trekking, immersioni (+felicità, +rischio infortuni)
- Turismo benessere: spa, resort, ritiri (+salute, +salute mentale)
- Rischi viaggio: furti (5-10% destinazioni ad alto rischio), incidenti, malattie tropicali
- Souvenir e ricordi: oggetti nell’inventario, memory flag persistente
- Foto di viaggio condivise su social media (+follower, +reputazione)

**Impatto sulla gameplay:**

- +apertura mentale (stat, sblocca opzioni di dialogo e scelte avanzate)
- Nuovi eventi e conoscenze (NPC stranieri, potenziali relazioni internazionali)
- Opportunità di lavoro all’estero (dopo 3+ viaggi in una regione)
- Possibilità di trasferirsi in un altro paese (richiede: soldi, visto, lingua)

Ogni viaggio deve avere:

- `destination`, `cost`, `duration` (giorni)
- `activity_type` (culturale/avventura/benessere/lavoro/scolastico)
- `risk_level` (1-5)
- `stat_benefits` (array di effetti)
- `random_events` (lista eventi possibili sul posto)
- `memory_flag` (sblocca dialoghi futuri)

-----

## 21. Sistema Politica e Impegno Civico

**Attività politiche:**

- Registrazione come elettore (18+)
- Votare: elezioni locali, nazionali, europee (ogni 4-5 anni in-game)
- Campagne elettorali: volantinaggio (€0), eventi pubblici (€500-€5000), pubblicità (€5000-€50000)
- Donare a partiti politici (€100-€100000, influenza accesso)
- Diventare membro di partito (quota annuale, eventi interni)
- Candidarsi: consigliere comunale → sindaco → deputato → senatore → premier/presidente
- Lobbying (€10000-€1000000, alta efficacia, rischio scandalo)
- Attivismo sociale (manifestazioni, petizioni, ONG)
- Proteste: pacifiche o violente (rischio arresto per le seconde)

**Meccaniche politiche:**

- Orientamento politico su spettro sinistra-destra (aggiornabile nel tempo)
- Ideologie disponibili: liberale, conservatore, socialista, ambientalista, nazionalista, libertario
- Dibattito pubblico (skill oratoria influenza esito)
- Scandali politici (riduzione reputazione -30 a -80%)
- Corruzione (guadagno immediato vs rischio prigione)
- Potere e influenza come stats separate
- Privilegi politici (auto blu, scorta, casa governativa)
- Impeachment (se corruzione scoperta a livello alto)
- Pensionamento politico con pensione vitalizi

**Impatto sulla gameplay:**

- Leggi della nazione modificabili se si raggiunge posizione di potere (es. tasse, aborto, cannabis)
- Influenza su tasse e welfare per tutti i player della nazione
- Accesso a reti di potere (sblocca eventi e NPC esclusivi)
- Rischi per la sicurezza crescenti con il ruolo (minacce, attentati)

Ogni ruolo politico deve avere:

- `requisiti_eta`, `requisiti_reputazione` (min), `requisiti_casellario` (pulito sì/no)
- `durata_mandato` (anni), `stipendio`, `potere` (1-10), `rischi` (lista)
- `corruzione_probability` (base %)

-----

## 22. Sistema Mini-Games e Intrattenimento

**Mini-games supportati:**

**Casinò:**

- Slot machine (house edge 5-10%, pura fortuna)
- Blackjack (house edge 0.5%, skill card counting possibile)
- Roulette (house edge 2.7% europea, 5.26% americana)
- Poker Texas Hold’em (skill + fortuna, tornei disponibili)
- Craps (house edge 1.4%)
- Baccarat (house edge 1.06%)

**Giochi di abilità:**

- Poker contro NPC (skill influenza win rate 20-80%)
- Scacchi (ELO system, tornei, coaching)
- Go, Jongkong, Dadi

**Sport competitivi:**

- Tennis mini-game (rally system, skill rallies)
- Golf (swing timing, skill approach)
- Bowling, Biliardo
- Fighting game arcade (combos, special moves)

**Giochi di fortuna:**

- Lotteria quotidiana (jackpot €1M-€100M, odds 1:14000000)
- Gratta e vinci (€2-€20, odds 1:4 su piccoli premi)
- Scommesse sportive (quote live, cap mensile anti-abuso)
- Betting su cavalli (ippodrome events stagionali)

**Meccaniche mini-games:**

- Skill del player influenza outcome (non solo fortuna pura)
- Bankroll management: se perdi tutto → evento “debiti da gioco”
- Rischio dipendenza: uso frequente → `addiction_flag` → mood negativo senza giocare
- Limiti di puntata: min bet e max bet per locale
- Tornei e competizioni (prize pool, ranking)
- Achievement esclusivi (es. “Royal Flush”, “10 win streak roulette”)

**Impatto sulla gameplay:**

- Guadagno/perdita rapida di soldi
- Dipendenza patologica → evento family intervention, rehab
- Relazioni con NPC (giocare contro amici rafforza bond)
- Scandali se professionista scoperto in casinò
- Prigione se sorpreso a barare

Ogni mini-game deve avere:

- `rules` (regole base), `skill_requirement` (0-100)
- `house_edge` (per casinò), `min_bet`, `max_bet`
- `win_probability` (base senza skill), `addiction_risk` (1-10), `time_cost`

-----

## 23. Sistema Dinamico di Eventi Unici e Morte Personalizzata

### 23.1 Eventi Unici “Cosa Ti Rende Unico”

**Trigger per eventi unici:**

- Combinazione rara di stats (es. intelligenza > 95 + aspetto < 30)
- Percorso di vita insolito (es. abbandona scuola → diventa milionario)
- Coincidenze temporali (es. nasce nello stesso giorno di una celebrità storica)
- Nascita durante eventi storici (pandemia, guerra, rivoluzione)
- Condizioni genetiche rare (progeria, gigantismo, visione a colori anomala)
- Talenti straordinari: savant syndrome (intelligenza 100 + aspetto 10), memoria eidetica
- Maledizioni/benedizioni familiari (passate da genitore con history_flag)
- Incontri casuali significativi (salva una vita → +karma 30, evento media)

**Caratteristiche eventi unici:**

- `rarity` (common 50%, rare 30%, epic 15%, legendary 5%)
- `permanenza` (temporanea 1-5 anni vs permanente)
- `narrativa_personalizzata` (testo generato dalla combinazione di flags)
- `conseguenze_a_lungo_termine` (sblocca o blocca percorsi futuri)
- `achievement_exclusivo` (ribbon univoco per quella run)

### 23.2 Sistema Morte Multipla Dettagliata

|Tipo di Morte          |Trigger                                 |Conseguenze                                 |
|-----------------------|----------------------------------------|--------------------------------------------|
|**Morte naturale**     |Età avanzata, salute < 5                |Normale, eredità ai familiari               |
|**Malattia**           |Salute bassa + malattia grave           |Dolore pre-morte, possibili cure fallite    |
|**Incidente**          |Random event + luck bassa               |Morte improvvisa, possibile sospetto        |
|**Omicidio**           |Nemici, criminalità, casuale            |Investigazione, vendetta familiari          |
|**Suicidio**           |Depressione estrema + salute mentale < 5|Trauma familiari, karma negativo            |
|**Esecuzione**         |Condanna a morte per crimine            |Famiglia stigmatizzata                      |
|**Guerra/Terrorismo**  |Nazione in guerra                       |Possibile eredità eroica                    |
|**Disastro naturale**  |Random event (terremoto, tsunami)       |Casualties di massa NPC                     |
|**Pandemia**           |Malattia globale                        |Morte simultanea di molti NPC               |
|**Assassinio politico**|Ruolo politico + nemici                 |Scandalo, instabilità politica              |
|**Incidente traffico** |Auto veloce + driving skill bassa       |Possibile sopravvivenza con danni permanenti|
|**Overdose**           |Dipendenza + dose alta                  |Morte dolorosa, familiari traumatizzati     |

**Meccaniche pre-morte:**

- Next-of-kin identificato automaticamente
- Testamento letto (automatico o contestato in tribunale)
- Eredità distribuita secondo regole o testamento
- Funerale: economico (€1500), medio (€7000), lusso (€25000+)
- Memoria del defunto persistente negli NPC (cambiano dialoghi)
- Effetti sui figli: trauma, crescita prematura, possibile disturbo post-traumatico
- Possibile “reincarnazione”: nuova partita con bonus basato su achievements precedenti

**Dopo la morte — Schermata Game Over:**

- Statistiche complete della vita (anni vissuti, soldi accumulati, figli avuti, crimini, achievement)
- Classifiche: longevità, ricchezza, felicità, karma
- Achievement completati in questa run
- Opzione “Eredità”: nuovo personaggio con bonus iniziale proporzionale alla ricchezza lasciata
- Opzione “Storia della Famiglia”: continua con un figlio/nipote del personaggio

Ogni tipo di morte deve avere:

- `trigger_conditions`, `probability` (base %)
- `pre_death_events` (lista), `death_animation` (emoji)
- `funeral_costs`, `inheritance_rules`
- `family_trauma_level` (1-10), `legacy_flags`

-----

## 24. Sistema Sessualità, Contraccezione e Salute Riproduttiva

### 24.1 Attività Sessuale

**Meccaniche sessuali:**

- Perdita della verginità (primo rapporto — evento narrativo)
- Rapporti sessuali protetti/non protetti (scelta consapevole con conseguenze)
- Orientamento sessuale: etero, omosessuale, bisessuale, pansexuale, asessuale
- Preferenze sessuali: vanilla, kink, BDSM (influenzano compatibilità con partner)
- Numero di partner sessuali (visibile in statistiche fine partita)
- Tradimento sessuale (rischio scoperta basato su trust del partner)
- Sesso occasionale / one-night stand (dopo eventi sociali, app dating)
- Sesso online: camsex, OnlyFans creator (entrate, rischio scandalo)
- Prostituzione (acquirente o professionista — crimini in molte nazioni)
- Group sex (richiede partner consensuali, influenza relazioni)
- Celibato volontario (religioso o personale — bonus karma per alcune credenze)

**Impatto sulla gameplay:**

- Aumenta intimità e `trust` con partner attivo
- Riduce stress (-10), aumenta felicità (+10) a breve termine
- Rischio MST (dipende da protezione usata)
- Rischio gravidanza non pianificata
- Influenza reputazione se scandalizzato (dipende da nazione e cultura)

### 24.2 Contraccezione e Prevenzione

|Metodo                  |Efficacia|Protezione MST|Costo       |Note            |
|------------------------|---------|--------------|------------|----------------|
|Preservativo maschile   |98%      |Sì            |€0.50-€2/uso|                |
|Preservativo femminile  |95%      |Parziale      |€2-€5/uso   |                |
|Pillola anticoncezionale|99%      |No            |€15-€30/mese|Prescrizione    |
|IUD (spirale)           |99.9%    |No            |€300-€500   |Dura 5-10 anni  |
|Cerotto contraccettivo  |99%      |No            |€20-€40/mese|                |
|Anello vaginale         |99%      |No            |€15-€30/mese|                |
|Diaframma               |88%      |No            |€50 + visita|                |
|Metodo calendario       |75%      |No            |€0          |Alto rischio    |
|Sterilizzazione         |99.9%    |No            |€1500-€3000 |Permanente      |
|Nessun metodo           |—        |No            |€0          |Rischio naturale|

### 24.3 Malattie Sessualmente Trasmissibili (MST)

|MST                |Curabile      |Sintomi               |Costo cura        |Complicazioni                |
|-------------------|--------------|----------------------|------------------|-----------------------------|
|HIV/AIDS           |No (gestibile)|Asintomatico → AIDS   |€15000-€30000/anno|Morte se non trattato        |
|Clamidia           |Sì            |Spesso asintomatica   |€50-€100          |Infertilità se non curata    |
|Gonorrea           |Sì            |Bruciore, perdite     |€50-€150          |Infertilità, resistenza AB   |
|Sifilide           |Sì            |Stadio 1-3 progressivo|€50-€200          |Danni neurologici se stadio 3|
|HPV                |No (gestibile)|Spesso asintomatica   |€0-€500           |Cancro cervicale             |
|Herpes genitale    |No (gestibile)|Episodi ricorrenti    |€50-€150/episodio |Cronicità                    |
|Epatite B          |No (gestibile)|Affaticamento, ittero |€5000-€15000/anno |Cirrosi                      |
|Tricomoniasi       |Sì            |Prurito, perdite      |€50               |Bassa se curata              |
|Mollusco contagioso|Sì (tempo)    |Lesioni cutanee       |€100-€300         |Bassa                        |

Meccaniche MST: test STD periodici (consigliati ogni 6 mesi se attivo), trasmissione a partner inconsapevole, stigma sociale variabile per nazione, trasmissione madre-figlio durante gravidanza.

### 24.4 Gravidanza e Aborto

**Meccaniche gravidanza:**

- Ciclo mestruale tracking (fertilità variabile per giorno)
- Test gravidanza (€5-€15, anche senza sintomi)
- Trimestre 1: nausea, stanchezza, rischio aborto spontaneo (15%)
- Trimestre 2: visibile, esami prenatali, ecografie
- Trimestre 3: parto imminente, preparazione
- Parto naturale o cesareo (costo €0-€5000 dipende da nazione)
- Complicazioni: pre-eclampsia (5%), diabete gestazionale (8%), parto prematuro (10%)
- Natimortalità (0.5% base)

**Opzioni gravidanza non desiderata:**

- Aborto legale (legale nei primi 90 giorni in molte nazioni)
- Aborto illegale (in nazioni pro-life — rischio medico, rischio legale/prigione)
- Aborto farmacologico RU-486 (efficace fino a 10 settimane)
- Aborto chirurgico: aspirazione o D&C (fino a 12-14 settimane)
- Portare a termine e dare in adozione
- Portare a termine e crescere il bambino

Impatto gravidanza dipende dalla nazione: leggi abortive, congedo maternità/paternità, costi sanitari (gratuiti vs privati), disponibilità asili nido.

### 24.5 Fertilità e Ausili Riproduttivi

**Tecnologie riproduttive:**

- FIV (fecondazione in vitro): €3000-€6000/ciclo, 30-40% successo/ciclo
- Inseminazione artificiale: €800-€2000/tentativo
- Donazione ovuli/spermatozoi (anonima o conosciuta)
- Surrogacy/grembo in affitto: €30000-€100000 totale
- Freezing ovuli/spermatozoi: €1500-€3000 + €500/anno conservazione
- PGD (diagnosi genetica pre-impianto): +€2000 su FIV

Fertilità diminuisce con: età (donne 35+, uomini 50+), fumo, alcol, stress cronico, alcune MST non curate.
Gravidanze multiple (gemelli: 3%, tripletti: 0.1% — aumenta con FIV).

Ogni procedura deve avere:

- `costo`, `success_rate` (%), `requisiti_eta`, `requisiti_legali` (per nazione)
- `effetti_collaterali`, `time_cost`

-----

## 25. Sistema Patente, Guida e Trasporti

### 25.1 Patente di Guida

|Patente|Veicolo          |Età minima|Costo totale|
|-------|-----------------|----------|------------|
|A1     |Moto 125cc       |16 anni   |€1000-€1500 |
|A2     |Moto 35kW        |18 anni   |€1200-€1800 |
|A      |Moto potenti     |20 anni   |€1500-€2000 |
|B      |Auto             |18 anni   |€1500-€3000 |
|B96    |Auto + rimorchio |18 anni   |+€300       |
|C      |Camion           |21 anni   |€3000-€5000 |
|D      |Autobus          |21 anni   |€4000-€6000 |
|E      |Rimorchio pesante|21 anni   |+€500       |

**Percorso patente B:**

1. Iscrizione scuola guida + libretto teoria (€200-€400)
1. Lezioni teoria (20-30 ore, €40-€60/ora)
1. Esame teoria: 40 domande, max 4 errori (pass rate 65%)
1. Esame pratica: guida con esaminatore (pass rate 55%)
1. Bocciatura → ripetere esame (costo aggiuntivo €100-€200 per tentativo)
1. Patente provvisoria: prima 3 anni, limite 0.5 BAC, max 100 km/h

### 25.2 Guida e Infrazioni

**Driving skill (0-100):** cresce con pratica (+1 per turno guidato), decade con età avanzata (-1/anno dopo 75), si azzera temporaneamente sotto effetto alcol/droghe.

**Infrazioni e conseguenze:**

|Infrazione                 |Multa                    |Punti persi|
|---------------------------|-------------------------|-----------|
|Eccesso velocità lieve     |€50-€200                 |2          |
|Eccesso velocità grave     |€500-€2000               |6          |
|Semaforo rosso             |€200-€500                |4          |
|Uso cellulare              |€165-€660                |5          |
|Parcheggio irregolare      |€30-€100                 |0          |
|Guida ubriaco (BAC 0.5-0.8)|€500-€2000               |10         |
|Guida ubriaco (BAC > 0.8)  |€1000-€3000 + sospensione|10         |
|Fuga da posto di blocco    |Arresto                  |Revoca     |

Punti patente: 20 iniziali, perde per infrazioni. A 0 → revoca, ripetere esame da capo.

### 25.3 Incidenti e Conseguenze

**Probabilità incidente** basata su: driving skill, velocità, alcol, stanchezza, meteo.

**Tipi e conseguenze:**

|Tipo                |Probabilità base|Conseguenze principali                  |
|--------------------|----------------|----------------------------------------|
|Tamponamento lieve  |5%              |Danni auto €500-€2000                   |
|Sbandata            |2%              |Danni auto €1000-€5000                  |
|Incidente con feriti|1%              |Risarcimento €10000+, assicurazione sale|
|Investimento pedone |0.1%            |Arresto, prigione 1-5 anni              |
|Incidente mortale   |0.05%           |Omicidio colposo, prigione 2-7 anni     |

Assicurazione post-incidente: +50-200% premio annuale per 5 anni.

### 25.4 Acquisto e Gestione Auto

|Categoria|Prezzo acquisto |Manutenzione/anno|Assicurazione/anno|
|---------|----------------|-----------------|------------------|
|Economica|€5000-€15000    |€500-€1000       |€300-€600         |
|Media    |€15000-€30000   |€800-€1500       |€600-€1200        |
|Lusso    |€30000-€100000  |€2000-€5000      |€1500-€4000       |
|Supercar |€100000-€500000+|€5000-€20000     |€5000-€20000      |
|Moto     |€3000-€20000    |€300-€800        |€200-€600         |

Meccaniche auto: acquisto nuovo/usato, finanziamento 3-5 anni, RC obbligatoria, Kasko/Furto opzionale, vendita con depreciation 10-15%/anno.

### 25.5 Trasporti Pubblici e Alternativi

|Mezzo          |Costo                                  |Impatto stress|Note                    |
|---------------|---------------------------------------|--------------|------------------------|
|Autobus urbano |€1-€2/viaggio, €30-€60/mese abbonamento|Neutro        |Disponibile in città    |
|Metro          |€1.50-€2.50/viaggio, €40-€80/mese      |Basso stress  |Solo grandi città       |
|Treno regionale|€5-€30/tratta                          |Basso stress  |Lettura/lavoro durante  |
|Aereo economia |€50-€800/tratta                        |Medio         |Richiede 3h di anticipo |
|Taxi/Uber      |€10-€100/tratta                        |Nessuno       |Costo alto, comodità max|
|Bicicletta     |€200-€3000 acquisto, €0 uso            |+salute       |Ecologica, -tempo       |
|Monopattino    |€300-€800 acquisto                     |Neutro        |Solo percorsi brevi     |

Ogni veicolo deve avere: `costo_acquisto`, `costo_manutenzione_annuo`, `consumo_carburante`, `assicurazione_annua`, `valore_residuo` (dopo 5 anni), `safety_rating`, `insurance_group`.

-----

## 26. Sistema Adozione e Parenting

### 26.1 Adozione

|Tipo                                 |Costo        |Attesa        |Note                   |
|-------------------------------------|-------------|--------------|-----------------------|
|Nazionale (Italia)                   |€5000-€15000 |1-3 anni      |Tribunale minori       |
|Internazionale (Cina, Ethiopia, etc.)|€20000-€50000|2-5 anni      |Viaggio richiesto      |
|Open                                 |€10000-€25000|1-2 anni      |Contatto bio-genitori  |
|Closed                               |€8000-€20000 |1-3 anni      |Nessun contatto        |
|Foster/Affido                        |€0-€500      |2-6 mesi      |Temporaneo, reversibile|
|Single (genitore solo)               |+20% costo   |+6 mesi attesa|Requisiti più rigidi   |

**Meccaniche adozione:**

- Requisiti base: età 18-45, reddito minimo (>€1500/mese netto), casa propria o affitto stabile
- Assessment psicologico (2-4 sessioni, €200-€500)
- Home visit (controllo abitazione, €0)
- Procedura legale (tribunale minori, avvocato specializzato €1000-€3000)
- Bonding iniziale basso con bambino adottato (bond_level 20% — cresce con interazione)
- Crisi adozione: il bambino rifiuta o ha problemi comportamentali (20% probabilità, +stress, -bond)

### 26.2 Stili Genitoriali

|Stile          |Caratteristiche                                   |Outcome figlio a 25 anni                                         |
|---------------|--------------------------------------------------|-----------------------------------------------------------------|
|**Autoritario**|Regole rigide, punizioni severe, poche spiegazioni|Rispettoso ma ribelle, bassa autostima, possibile distanza adulta|
|**Permissivo** |Poche regole, molto amore, nessuna conseguenza    |Creativo ma indisciplinato, difficoltà con autorità              |
|**Democratico**|Regole chiare, spiegazioni, punizioni ragionevoli |Equilibrato, alta autostima, buon successo professionale         |
|**Negligente** |Poche regole, poco amore, assenza emotiva         |Problemi gravi, criminalità, drop-out, dipendenze                |

### 26.3 Meccaniche Parenting Quotidiane

|Azione               |Costo Tempo|Effetto Figlio        |Effetto Genitore|
|---------------------|-----------|----------------------|----------------|
|Leggere libro insieme|30 min     |+Intelligenza, +Bond  |+Felicità       |
|Giocare insieme      |1h         |+Felicità, +Bond      |+Felicità       |
|Aiutare compiti      |1h         |+Intelligenza, +Voto  |+Stress         |
|Punire (timeout)     |15 min     |-Felicità, +Disciplina|+Stress         |
|Rimproverare         |5 min      |-Felicità, +Rispetto  |+Stress         |
|Lodare               |1 min      |+Felicità, +Autostima |+Felicità       |
|Dare regalo          |0 min      |+Felicità (breve)     |-Soldi          |
|Parlare emozioni     |30 min     |+Salute mentale, +Bond|+Stress         |
|Insegnare valori     |1h         |+Karma, +Moralità     |0               |
|Ignorare figlio      |0 min      |-Bond, -Felicità      |0               |

**Eventi parenting per età:**

- 1 anno: primo passo, prime parole
- 3 anni: scuola dell’infanzia
- 6 anni: prima elementare
- 11-14 anni: pubertà
- 12-16 anni: prima cotta
- 14-18 anni: ribellione adolescenziale
- 16+ anni: primo lavoro part-time
- 18 anni: patente, voto
- 18-22 anni: università
- 18-25 anni: lasciare casa
- 30+ anni (del figlio): primo nipote per il player

### 26.4 Educazione e Valori

Choices del genitore: religione insegnata, scuola religiosa vs laica, educazione sessuale aperta vs conservatrice, orientamento politico trasmesso, lingue insegnate a casa, discipline praticate (sport, musica, arte).

Impatto: 80% probabilità che il figlio erediti la religione del genitore, conflitto generazionale se il figlio diverge, relazione con nonni condizionata da differenze religiose/politiche.

### 26.5 Relazione Genitore-Figlio Evolutiva

|Fase            |Età figlio|Dinamica                                          |
|----------------|----------|--------------------------------------------------|
|Dipendenza      |0-3       |Bonding fondamentale, ogni azione conta doppio    |
|Esplorazione    |3-6       |Gioco, curiosità, insegnamento base               |
|Scolastica      |6-12      |Performance scolastica, attività extracurriculari |
|Ribellione      |12-18     |Indipendenza, segreti, conflitti normali          |
|Emergente adulto|18-25     |Negoziazione genitore-figlio come pari            |
|Adulto          |25+       |Supporto reciproco, possibile dipendenza economica|

Ogni figlio deve avere:

- `name`, `age`, `gender`, `intelligence`, `aspect`, `health`
- `personality_traits`: Big Five (apertura, coscienziosità, estroversione, gradevolezza, nevroticismo)
- `bond_with_each_parent` (0-100%), `rispetto_genitore` (0-100%)
- `school_level`, `career_path`, `relationship_status`
- `special_needs` (disabilità, disturbi — influenza parenting)

-----

## 27. Sistema Militare, Prigionia e Carriere Speciali

### 27.1 Carriera Militare

**Rami militari:** Esercito, Marina Militare, Aeronautica, Carabinieri, Guardia di Finanza.

**Gradi (Esercito, dal basso):**
Recluta → Soldato → Caporale → Sergente → Tenente → Capitano → Maggiore → Tenente Colonnello → Colonnello → Generale di Brigata → Generale di Divisione → Generale di Corpo d’Armata

**Meccaniche militari:**

- Arruolamento: 18+ anni, fedina penale pulita, fitness test (health > 60)
- Addestramento base: 12 settimane, 10% dropout (health/mental test)
- Specializzazione: fanteria, artiglieria, carri armati, forze speciali, intelligence
- Missioni: peacekeeping (+reputazione, +stipendio), zona di guerra (+rischio PTSD, +decorazioni)
- Decorazioni: Medaglia al Valore, Croce al Merito Guerra (influenzano reputazione)
- Promozione: per merito (missioni successo) o anzianità (tempo servizio)
- Pensione militare: dopo 20 anni servizio (50-70% stipendio base)

**Impatto militare:**

- Stipendio per grado: Soldato €1500/mese → Generale €5000+/mese
- Benefici: sanità gratuita, casa sussidiata, buoni pasto
- PTSD: 20-30% veterani da zona di guerra (salute mentale -30, eventi flashback)
- Ferite di guerra: disabilità permanente possibile (mobility stat)
- Morte in missione: evento con funerale di Stato
- Skills trasferibili: leadership (+stat), disciplina (self-control buff)

**Eventi militari:**

- Guerra dichiarata dalla nazione (coscrizione possibile in alcune nazioni)
- Diserzione: prigione militare 1-5 anni, fedina penale
- Crimini di guerra: corte marziale, prigione, disonore permanente
- Colpo di stato militare (paesi instabili): evento macro che altera la nazione

### 27.2 Prigionia Dettagliata

|Tipo                  |Security level|Violenza rate|Gang     |Costo/giorno|
|----------------------|--------------|-------------|---------|------------|
|Carcere preventivo    |Low           |10%          |No       |€0          |
|Carcere comune        |Medium        |25%          |Possibile|€0          |
|Carcere alta sicurezza|High          |40%          |Sì       |€0          |
|Prigione federale     |High          |35%          |Sì       |€0          |
|Prigione privata      |Medium        |15%          |No       |€80-€150    |
|Casa di reclusione    |Low           |5%           |No       |€0          |

**Meccaniche prigione:**

- Cella singola (privato o buona condotta) vs condivisa 2-4 persone
- Lavoro in prigione: €2-€5/ora (fabbriche, cucina, pulizie, officina)
- Gang in prigione: dominano certi blocchi — unirsi garantisce protezione (-karma, +sicurezza)
- Violenza tra detenuti: aggressione (30-40%), rischio stupro (10-20% statistico)
- Programmi riabilitazione: istruzione (+intelligenza), terapia (+salute mentale), lavoro esterno
- Buona condotta: sconto 30% sulla pena
- Visita familiare: 1-2 ore/settimana (mantiene o deteriora relazioni)
- Telefoni: €0.50/min (chiamate costose, relazioni a rischio)

**Rischi prigione:**

- Aggressione: 30-40% nei carceri ad alta sicurezza (salute -10 a -30)
- Morte in prigione: suicidio, omicidio, overdose (0.5-2%/anno)
- Crimini imparati: recidiva aumentata del 40% dopo il primo periodo
- Trauma psicologico: PTSD, depressione cronica, paranoia

**Uscita di prigione:**

- Libertà vigilata: 1-3 anni monitoraggio (non puoi lasciare nazione/regione)
- Braccialetto elettronico (alternativa per pene < 3 anni)
- Difficoltà trovare lavoro: 40% ex-detenuti disoccupati a 1 anno
- Alloggio sussidiato (strutture semi-liberi)
- Supporto riabilitazione (terapia dipendenze, reinserimento lavorativo)

Ogni prigione deve avere:

- `security_level` (low/medium/high)
- `violence_rate` (%)
- `gang_presence` (sì/no)
- `programs_available` (lista)
- `visitation_rules`, `work_opportunities`, `cost_per_day` (privato)

### 27.3 Carriere Professionali Specializzate

|Professione      |Esame                 |Costo esame|Rinnovo|Stipendio annuo|
|-----------------|----------------------|-----------|-------|---------------|
|Medico           |USMLE (3 step)        |€5000      |5 anni |€150k-€500k    |
|Avvocato         |Bar Exam / Esame Stato|€3000      |Annuale|€80k-€500k     |
|Pilota           |FAA / EASA License    |€10000     |Annuale|€80k-€400k     |
|Ingegnere        |PE License            |€1000      |5 anni |€70k-€200k     |
|Real Estate Agent|Broker License        |€500       |2 anni |€40k-€300k     |
|Cosmetologo      |Beauty License        |€300       |Annuale|€25k-€100k     |
|Idraulico        |Journeyman            |€500       |Annuale|€40k-€100k     |
|Elettricista     |Journeyman            |€500       |Annuale|€45k-€120k     |
|Farmacista       |NAPLEX                |€2000      |2 anni |€120k-€200k    |
|Psicologo        |EPPP                  |€1500      |2 anni |€70k-€150k     |

Meccaniche licenze: studio 200-500 ore, esame (pass rate 60-80%), bocciatura con costo aggiuntivo, possibile licenza temporanea durante studio, revoca per malpractice o crimini.

### 27.4 Sport Professionisti

**Sport supportati:** Calcio (Serie A, Premier League), Basket (NBA, EuroLeague), Football americano (NFL), Tennis (ATP/WTA), Golf (PGA), Formula 1, MotoGP, Boxe, UFC/MMA, Nuoto, Atletica leggera.

**Percorso carriera:**

1. Scout sportivo (14-18 anni, skill > 70 richiesta)
1. Circuiti giovanili/accademia (15-18 anni)
1. Draft o contratto diretto (NBA Draft, contratto pro)
1. Contratto rookie: €500k-€10M/anno
1. Picco carriera: endorsement Nike/Adidas (€1M-€50M/anno)
1. Infortuni (10-20%/anno): carriera finita in caso gravi
1. Retirement (30-40 anni per sport fisici, 40-50 per golf/tennis)
1. Hall of Fame (carriera eccezionale, achievement esclusivo)
1. Post-carriera: coaching, commentatore, business

### 27.5 Carriera Influencer/Content Creator

**Piattaforme:** YouTube, TikTok, Instagram, Twitch, OnlyFans, Patreon.

**Meccaniche:**

- Creazione profilo (0 follower, niche choice: gaming, beauty, finance, comedy, etc.)
- Crescita organica: 0.1-10%/mese basata su qualità + skill
- Viral video: evento casuale (1M+ views in 1 giorno, probabilità 0.5-2%)
- Sponsorizzazioni: €100-€1M per post, richiede follower minimi
- Monetizzazione Adsense: €1-€5/1000 views
- Merchandise, libri, reality TV appearances, talk show guest
- Cancellazione: scandalo → -50-80% follower, possibile fine carriera

|Follower|Monetizzazione |Stipendio mensile|
|--------|---------------|-----------------|
|0-1.000 |Nessuna        |€0               |
|1k-10k  |Adsense base   |€50-€200         |
|10k-100k|Sponsor piccoli|€500-€5.000      |
|100k-1M |Sponsor medi   |€5k-€50k         |
|1M-10M  |Sponsor grandi |€50k-€500k       |
|10M+    |Celebrity      |€500k-€5M        |

Ogni carriera speciale deve avere:

- `requisiti_entrata`, `probabilità_successo`, `stipendio_range`
- `rischi` (infortuni, burnout, scandali)
- `durata_media_carriera`, `pensione` (se applicabile), `achievement_exclusivi`

-----

## 28. Sistema Finanza Personale, Living Situation e NPC Autonomi

### 28.1 Credit Score e Finanza Personale

|Score  |Categoria|Accesso credito    |Tasso interesse|
|-------|---------|-------------------|---------------|
|300-579|Poor     |Nessun credito     |20%+           |
|580-669|Fair     |Credito limitato   |15-20%         |
|670-739|Good     |Credito standard   |8-12%          |
|740-799|Very Good|Condizioni buone   |5-8%           |
|800-850|Excellent|Migliori condizioni|3-5%           |

**Fattori credit score:**

- Payment history (35%): pagamenti puntuali = +, default = -
- Credit utilization (30%): uso carta < 30% limite = +
- Length of credit history (15%): credito vecchio = +
- Credit mix (10%): diversità tipologie = +
- New credit (10%): troppe applicazioni recenti = -

**Strumenti finanziari:**

- Conto bancario (requisito per lavoro dipendente e mutuo)
- Carta di credito: secured (€500 limite) → regular (€1000-€20000)
- Prestito personale: €1000-€50000, tasso dipende da credit score
- Mutuo casa: €100000-€1000000, 15-30 anni, tasso 2-6%
- Default su pagamento: -100 a -200 punti score
- Raccolta debiti (debt collector): evento stressante, -relazioni familiari
- Bankruptcy Capitolo 7: azzera debiti, -400 score, 7-10 anni su report
- Financial advisor: €200-€500/ora, consiglio su investimenti

### 28.2 Living Situation e Roommates

|Età tipica|Situazione                  |Costo mensile   |
|----------|----------------------------|----------------|
|0-18      |Con genitori                |€0              |
|18-22     |Dormitorio universitario    |€500-€1000      |
|22-25     |Roommate (affitto condiviso)|€600-€1200      |
|25-30     |Indipendente (affitto solo) |€1000-€2500     |
|30+       |Casa propria (mutuo)        |€1200-€4000     |
|50+       |Casa senza mutuo            |Costi fissi solo|

**Tipi di housing:**

- Stanza condivisa: €400-€800/mese
- Appartamento 1 bedroom: €800-€2000/mese
- Appartamento 2-3 bedroom: €1200-€3000/mese
- Mansion: €5M-€50M acquisto, €10000-€50000/mese manutenzione
- Casa vacanze (seconda proprietà, affitto passivo)
- Casa completamente pagata (zero mutuo, costo fisso only)

**Roommate dynamics:**

- Trovare roommate: app, amici, annunci (compatibilità random)
- Conflitti possibili: pulizia, rumore, ospiti, cibo
- Esiti: roommate diventa amico (+bond), diventa partner (raro), lascia senza preavviso (-stress), non paga affitto (conflitto legale)

**Costi mensili fissi proprietà:**

- Utilities (luce, gas, acqua, internet): €150-€300/mese
- Manutenzione preventiva: €80-€200/mese accantonamento
- Assicurazione casa: €50-€150/mese
- Apprezzamento medio: +3-5%/anno (compensato da inflazione)

### 28.3 NPC Autonomi (Vita Propria)

Ogni NPC ha vita indipendente dal player:

|Comportamento NPC                 |Frequenza in-game|Impatto player                         |
|----------------------------------|-----------------|---------------------------------------|
|Si sposano                        |Mensile          |Parenti cambiano stato civile          |
|Divorziano                        |Mensile          |Ex-suoceri cambiano ruolo              |
|Si trasferiscono                  |Settimanale      |Evento non disponibile con NPC lontano |
|Cambiano lavoro                   |Mensile          |Network professionale NPC si aggiorna  |
|Hanno figli                       |Mensile          |Nipoti del player appaiono             |
|Muoiono                           |Settimanale      |Player perde relazione permanentemente |
|Sviluppano relazioni con altri NPC|Continuo         |Rete sociale si espande e intreccia    |
|Ricordano interazioni col player  |Continuo         |Trattamento diverso in base alla storia|
|Si arrabbiano per tradimento      |Continuo         |Relazione peggiora in modo permanente  |
|Scelgono partner autonomamente    |Continuo         |Fratelli/sorelle hanno partner diversi |

**Meccaniche NPC autonomia:**

- Ogni NPC ha `daily_schedule`: lavoro 8h, casa, hobby, social
- Ogni NPC ha `relationship_graph`: relazioni con altri NPC (non solo col player)
- Ogni NPC ha `personal_goals`: cerca lavoro, cerca partner, studia
- Ogni NPC ha `memory_log`: tutte le interazioni con il player
- Gli eventi NPC avvengono **indipendentemente** dal player (es. il fratello si sposa senza invitarti)
- Il player può **mancare eventi importanti** con conseguenze relazionali

**Impatto NPC autonomi:**

- Mondo vivo e realistico, non in “pausa” quando il player non interagisce
- Il player deve **mantenere relazioni attivamente** (NPC si allontanano se neglected)
- Sorprese emotive (NPC che non si vedeva da anni ricompare con cambiamenti)
- Perdita reale e irreversibile (morte NPC)
- Rete sociale dinamica (gli amici del player si conoscono tra loro)

### 28.4 Cheat System, Debug Mode e Modalità Speciali

|Modalità          |Descrizione         |Effetti                                                         |
|------------------|--------------------|----------------------------------------------------------------|
|**Normale**       |Standard            |Tutte le regole attive                                          |
|**Difficile**     |Survival            |Salario -30%, Costo vita +50%, Morte precoce aumentata          |
|**Modalità Dio**  |Immortale           |Salute 100%, Felicità 100%, Soldi infiniti, Morte disabilitata  |
|**Ghost Mode**    |Manipolazione libera|Stats modificabili manualmente, nessun effetto collaterale      |
|**Legacy Mode**   |Eredità potenziata  |Bonus basati su vita precedente (soldi, relazioni, achievements)|
|**Challenge Mode**|Obiettivi vincolati |Es. “Milionario a 25”, “Zero crimini”, “10 figli”               |

**Cheat commands per testing:**

- `addMoney(n)` — aggiunge n euro
- `setMaxStats()` — tutte le stat a 100
- `immortal(true/false)` — toggle morte
- `unlockAllAchievements()` — tutti gli achievement
- `skipToAge(n)` — avanza all’età n
- `addRelation("name", n)` — imposta relazione a n
- `addJob("job_id")` — assegna lavoro immediatamente
- `removeCriminalRecord()` — pulisce fedina penale
- `randomizeLife()` — genera percorso di vita casuale
- `editCharacter()` — modifica nome/aspetto/genere

**Debug tools:**

- Game state viewer (tutte le stat in real-time)
- Event log (cronologia completa eventi)
- NPC relationship graph (visualizzazione grafica rete NPC)
- Savegame editor (modifica diretta del salvataggio)
- Probability viewer (probabilità degli eventi disponibili nel turno corrente)
- Action counter (utilizzi correnti di ogni azione)

Ogni cheat deve avere:

- `nome_comando`, `descrizione`, `effetti`
- `disabilita_achievements` (sì/no)
- Warning: “Usare cheat disabilita gli achievement per questa partita”

-----

## 29. Sistema Educazione Superiore Avanzata e Attività Extracurriculari

**Titoli post-laurea:**

- Medical School (4 anni post-laurea)
- Law School (3 anni post-laurea)
- PhD/Dottorato (4-7 anni, ricerca + dissertazione)
- MBA — Master in Business Administration (2 anni)
- Specializzazioni mediche: cardiologia, neurologia, chirurgia (3-7 anni)

**Meccaniche PhD/Specializzazione:**

- Ammissione competitiva (GPA, test MCAT/LSAT/GRE richiesti)
- Finanziamento: borsa di studio full (rara), teaching assistant (€15000-€25000/anno), research assistant
- Qualifying exams (dopo anno 2: promuovere o abbandono)
- Proposal defense (difesa proposta ricerca)
- Dissertation defense (difesa finale)
- Abbandono “ABD” (all but dissertation): frequente, 40% abbandona
- Pubblicazione su rivista peer-reviewed obbligatoria per laurearsi in molti programmi

**Attività extracurriculari scolastiche:**

|Categoria       |Esempi                                     |Benefici                                     |
|----------------|-------------------------------------------|---------------------------------------------|
|Sport scolastici|Basketball, football, soccer, tennis, nuoto|+salute, +reputazione scuola, possibile scout|
|Club            |Debate, chess, drama, robotics, coding     |+intelligenza, +college application          |
|Musicali        |Band, orchestra, choir, jazz band          |+skill musicale, +creatività                 |
|Accademici      |Math team, science olympiad, model UN      |+intelligenza, +borse di studio              |
|Leadership      |Student council (president, VP, secretary) |+carisma, +reputazione                       |
|Media           |School newspaper, TV, radio                |+comunicazione, +follower iniziali           |

**Eventi scolastici speciali:**

- **Prom** (ballo fine anno, 17-18 anni): data, outfit, regina/re del prom
- **Homecoming**: partita football + ballo
- **Graduation** (laurea): cerimonia, cap and gown, foto famiglia
- **Senior trip**: viaggio di classe, eventi con compagni
- **Sweet 16**: festa compleanno americana (16 anni)
- **Quinceañera**: festa latina 15 anni (se background latino)

Ogni attività extracurriculare deve avere:

- `requirements` (GPA minimo, skill minima)
- `time_commitment` (ore/settimana)
- `cost` (tesseramento, attrezzatura)
- `benefits` (effetti su stat e college application)
- `skill_progression` (livello 1-5)
- `competition_opportunities` (tornei, competizioni regionali)

-----

## 30. Sistema Piercing, Tatuaggi e Personalizzazione Corpo

**Piercing supportati:**

|Area        |Esempi                        |Dolore|Guarigione    |
|------------|------------------------------|------|--------------|
|Orecchie    |Lob, helix, tragus, industrial|2-4/10|6-12 settimane|
|Naso        |Ala, septum                   |3-5/10|4-6 mesi      |
|Sopracciglio|Vertical, horizontal          |3/10  |6-9 mesi      |
|Bocca       |Labret, Monroe, lingua        |5-7/10|4-8 settimane |
|Corpo       |Ombelico, petto, capezzolo    |5-7/10|6-12 mesi     |
|Stretching  |Tunnel lobi (2-16mm+)         |3-5/10|Permanente    |

**Tatuaggi:**

|Taglia     |Dimensione      |Costo       |Durata sessione|
|-----------|----------------|------------|---------------|
|Piccolo    |< 5cm           |€50-€150    |30-60 min      |
|Medio      |5-15cm          |€200-€600   |1-3h           |
|Grande     |15-30cm         |€800-€3000  |3-6h           |
|Full sleeve|Braccio completo|€3000-€8000 |15-30h totale  |
|Back piece |Schiena completa|€5000-€15000|30-50h totale  |

Stili disponibili: traditional, realism, watercolor, geometric, tribal, Japanese, blackwork, minimal, neo-traditional.

**Meccaniche modificazioni corporee:**

- Dolore durante procedura (scala 1-10 per posizione)
- Infezione: rischio 5-10% — antibiotici €100-€300 — se non trattata → sepsi
- Reazione allergica a tinta: 2-5% popolazione — rimozione necessaria
- Guarigione: 2-6 settimane per piercing, 2-4 settimane per tatuaggio
- Aftercare obbligatorio (crema, pulizia, no nuoto, no sole diretto)
- Sbiadimento tatuaggio: -10-20% qualità ogni 10 anni (richiede touch-up €50-€200)
- Copertura: nuovo tatuaggio su vecchio (costo +50%, limitazioni stile)
- Rimozione laser: 5-10 sessioni, €200-€500/sessione, non sempre completa

**Impatto sulla gameplay:**

- Tatuaggi visibili (mano, collo, faccia): -reputazione professionale per certi lavori
- Piercing multipli/tatuaggi estremi: -attrazione per NPC conservatori, +per NPC alternativi
- Stigma generazionale: NPC anziani reagiscono negativamente
- Aspetto: +5 a -10 dipende dall’NPC che valuta
- Rimpianto (20% giocatori statisticamente): evento disponibile a 30+ anni

Ogni piercing/tatuaggio deve avere:

- `name`, `body_location`, `pain_level`, `cost`
- `healing_time`, `infection_risk`, `visibility` (hidden/partial/full)
- `professional_stigma` (0-5), `removal_cost` (se tatuaggio)

-----

## 31. Sistema Sostanze, Alcol e Fumo

### 31.1 Alcol

|Tipo                 |Costo   |BAC per unità|Effetti                |
|---------------------|--------|-------------|-----------------------|
|Birra (330ml, 5%)    |€3-€8   |+0.02%       |Rilassamento lieve     |
|Vino (150ml, 12%)    |€5-€20  |+0.03%       |Euforico, chiacchieroso|
|Cocktail             |€12-€25 |+0.03-0.05%  |Variabile              |
|Shot vodka/whiskey   |€5-€15  |+0.05%       |Effetto rapido         |
|Bottiglia hard liquor|€20-€200|—            |Sessione lunga         |

**Scala BAC e effetti:**

- 0.02-0.05%: rilassamento, lieve euforia
- 0.06-0.10%: compromissione guidare, coordinazione ridotta
- 0.11-0.20%: ubriachezza evidente, vomito possibile
- 0.21-0.30%: blackout (perdita memoria), 0.25%+ vomito riflesso compromesso
- 0.30%: alcohol poisoning — emergenza medica, possibile morte

**Alcolismo (probabilità dipendenza 30% bevitori pesanti):**

- Withdrawal: tremori, ansia, sudorazione (inizia 6-24h dopo ultima bevuta)
- Withdrawal grave: crisi epilettica, delirium tremens — rischio vita senza detox medico
- Trattamenti: AA meetings (gratuito, +motivazione), rehab residenziale (€5000-€50000/30-90 gg)
- Sobriety milestones: 30 giorni, 1 anno, 5 anni, 10 anni (+salute mentale, +relazioni)
- Relapse probability: 50% entro 1 anno dopo trattamento

**Impatto a lungo termine:**

- Salute: liver disease, cirrosi, cancro orale/esofago, cardiomiopatia (-30% salute cronica)
- Aspetto: pelle arrossata, gonfiore, invecchiamento precoce (-15% aspetto)
- Finanze: €2000-€10000/anno su alcol in fase dipendenza
- Relazioni: violenza domestica +30%, separazioni più frequenti
- Lavoro: performance -30%, assenteismo +50%, rischio licenziamento

### 31.2 Fumo

|Tipo                    |Costo                           |Nicotina  |Note                     |
|------------------------|--------------------------------|----------|-------------------------|
|Sigarette (pacchetto 20)|€10-€15                         |Alta      |Dipendenza fisica rapida |
|Sigaro                  |€10-€50/pezzo                   |Alta      |Uso occasionale, status  |
|Vape/e-cigarette        |€30-€100 device + €20-€40/liquid|Media-Alta|Meno danni polmonari     |
|Marijuana (grammo)      |€10-€30                         |Nessuna   |THC, legalità per nazione|

**Dipendenza da nicotina (80% fumatori):**

- Withdrawal: ansia, irritabilità, difficoltà concentrazione (picco 24-72h dopo)

**Metodi smettere di fumare:**

|Metodo                       |Costo/mese        |Successo a 1 anno|
|-----------------------------|------------------|-----------------|
|Cold turkey                  |€0                |5%               |
|Nicotine patch               |€30-€60           |15%              |
|Nicotine gum                 |€20-€40           |12%              |
|Vape sostituzione            |€50-€100          |20%              |
|Chantix/Zyban                |€100-€300         |25%              |
|Terapia comportamentale      |€100-€200/sessione|18%              |
|Combinazione (meds + therapy)|€200-€500         |35%              |

**Marijuana:**

- Legale ricreativo in: Canada, Uruguay, 24 stati USA, Paesi Bassi, Germania (2024+)
- Legale medico in: 38 stati USA, molti paesi EU
- Effetti: rilassamento, aumento appetito, memoria a breve termine compromessa (-10% intelligenza temporaneo), paranoia possibile a dosi alte
- Dipendenza psicologica: 9% utenti regolari
- Uso a lungo termine: memoria compromessa (-5 intelligenza permanente se uso pesante precoce)

**Impatto fumo:**

- Salute: cancro polmone (40% fumatori pesanti), BPCO (30%), malattia cardiaca (2x risk) — (-30% salute cronica)
- Aspetto: denti gialli, pelle invecchiata +10 anni, alito (-10% aspetto)
- Finanze: €2000-€5000/anno su sigarette
- Relazioni: partner non fumatori possono rifiutarsi

Ogni sostanza deve avere:

- `cost_per_use`, `addiction_probability`, `withdrawal_severity` (1-10)
- `health_impact_short_term`, `health_impact_long_term`
- `legal_status` (per nazione), `social_stigma` (1-10), `quit_difficulty` (1-10)

-----

## 32. Sistema Dating Moderno, Proposta e Matrimonio

### 32.1 Dating Moderno

**App di dating:**

|App      |Meccanica                                   |Demographic|Costo premium|
|---------|--------------------------------------------|-----------|-------------|
|Tinder   |Swipe left/right                            |18-35 anni |€15-€30/mese |
|Bumble   |Women message first, 24h window             |20-35 anni |€20-€35/mese |
|Hinge    |Prompts e risposte, “designed to be deleted”|22-35 anni |€25-€35/mese |
|OkCupid  |Questionario dettagliato, matching %        |25-40 anni |€20-€30/mese |
|Match.com|Profilo dettagliato                         |30-50 anni |€40-€60/mese |
|eHarmony |Focus matrimonio                            |28-55 anni |€55-€65/mese |

**Meccaniche dating app:**

- Profile: foto (aspetto influenza +30% match rate), bio, interessi
- Swiping: 10-50 right/giorno gratuito, illimitato con premium
- Match rate: 10-30% dei right swipe diventano match
- Ghosting: 60% delle esperienze — sparisce senza spiegazione (evento emotivo negativo)
- Situationship: relazione indefinita 6+ mesi (event di confronto disponibile)
- Breadcrumbing: messaggi sporadici senza intenzione seria (riconoscibile con intelligence alta)
- Orbiting: guarda storie ma non manda messaggi

**Status relazione progressivo:**
Nessuno → Talking stage → Dating (non esclusivo) → Exclusive → Partner → Fidanzati → Sposati

**Tipi di appuntamento:**

- First date: caffè (€10-€20), drink (€20-€40), cena (€50-€150)
- Activity date: museo, concerto, bowling (€30-€80)
- Date disasters: 20% delle prime uscite — -50% probabilità secondo appuntamento
- Overnight: disponibile dopo 3+ appuntamenti positivi

### 32.2 Proposta e Fidanzamento

**Anello di fidanzamento:**

|Tipo             |Prezzo range|Note                         |
|-----------------|------------|-----------------------------|
|Diamond solitaire|€2000-€50000|Classico, valore mantiene    |
|Moissanite       |€500-€3000  |Alternativa etica e economica|
|Colored stones   |€1000-€20000|Rubino, smeraldo, zaffiro    |
|Custom design    |€3000-€30000|Progettato su misura         |

Karat consigliati: 0.5ct (€1500), 1ct (€4000-€8000), 2ct (€12000-€25000).

**Momento della proposta:**

- Privato (casa, natura): 50% preferisce questo
- Romantico (ristorante, spiaggia, panorama): 35%
- Pubblico (stadio, flash mob): 15% — rischio imbarazzo se rifiutata

**Fidanzamento:**

- Durata media: 15 mesi (range 6 mesi - 3 anni)
- Wedding planning inizia immediatamente dopo (stress meter aumenta)

### 32.3 Wedding Planning e Cerimonia

**Tipi di matrimonio:**

|Tipo                |Costo totale |Invitati|Note                          |
|--------------------|-------------|--------|------------------------------|
|Religiosa (chiesa)  |€15000-€30000|80-200  |Requisiti credenza            |
|Secolare (outdoor)  |€20000-€50000|60-150  |Venue e officiant             |
|Destination wedding |€25000-€80000|20-60   |Bali, Italia, Grecia          |
|Micro wedding       |€5000-€15000 |< 20    |Intimo e informale            |
|Elopement           |€1000-€5000  |0-5     |Solo coppia + testimoni       |
|Matrimonio combinato|Variabile    |100-300 |Cultura asiatica/mediorientale|

**Budget breakdown medio (€30000):**

- Venue: 30% (€9000)
- Catering: 35% (€10500) — €50-€150/persona
- Photographer + video: 15% (€4500)
- Fiori, decorazioni: 8% (€2400)
- Abito sposa + abito sposo: 7% (€2100)
- Music/DJ: 5% (€1500)

**Timeline eventi:**

- 12+ mesi prima: venue, catering, fotografo
- 6 mesi prima: abiti, inviti, luna di miele
- 3 mesi prima: prova abito, menu definitivo
- 1 mese prima: bachelor/bachelorette party (€500-€3000)
- 1 giorno prima: rehearsal dinner (50-100 invitati)
- Giorno: ceremony (30-60 min) + reception (4-6h)
- 1-2 settimane dopo: honeymoon (€3000-€15000)

**Meccaniche matrimonio post-cerimonia:**

- Compatibilità iniziale calcolata da stats condivise e valori
- Felicità matrimoniale (0-100%): decade naturalmente, aumenta con interazioni positive
- Crisi matrimoniali: anno 1 (“adjustment”), anno 7 (“seven-year itch”), anno 15
- Divorzio probability: 40-50% primo matrimonio, 60% secondo, 70% terzo

-----

## 33. Sistema Beauty Routine, Cura Personale e Abbigliamento

### 33.1 Beauty Routine e Cura Personale

**Capelli:**

|Servizio           |Frequenza         |Costo    |
|-------------------|------------------|---------|
|Taglio uomo        |Ogni 3-4 settimane|€30-€60  |
|Taglio donna       |Ogni 6-8 settimane|€50-€150 |
|Colorazione        |Ogni 6-8 settimane|€100-€400|
|Highlights/Balayage|Ogni 3 mesi       |€150-€600|
|Keratin treatment  |Ogni 4-6 mesi     |€200-€500|

**Unghie:**

|Servizio     |Frequenza           |Costo   |
|-------------|--------------------|--------|
|Manicure base|Ogni 2 settimane    |€25-€50 |
|Pedicure     |Ogni 4 settimane    |€40-€80 |
|Gel nails    |Ogni 3 settimane    |€40-€80 |
|Acrylic nails|Ogni 4 settimane    |€50-€100|
|Nail art     |Ad ogni appuntamento|+€10-€50|

**Depilazione:**

- Rasatura fai-da-te: €0, richiede 5-10 min/giorno
- Cera salone: €30-€80 full body, ogni 4 settimane
- Laser hair removal: €200-€500/sessione × 6-8 sessioni = €1500-€4000 totale (permanente)

**Skincare routine:**

- Base: cleanser (€20-€50), toner (€20-€50), moisturizer (€30-€100), SPF (€20-€60)
- Advanced: serum vitamina C (€40-€150), retinolo (€30-€100), acido ialuronico (€30-€80)
- Trattamenti clinici: peeling (€100-€300), microneedling (€200-€500), botox (€300-€600)
- Tempo routine: mattina 5-10 min, sera 10-20 min

**Makeup:**

- Base look: foundation + mascara + lip (€75-€190, 10 min)
- Full glam: foundation + contour + eyeshadow + lashes (€150-€400, 30-45 min)
- Makeup professionale (evento): €80-€200/occasione

**Barba (uomo):**

- Rasatura quotidiana: 5-10 min, €0 fai-da-te
- Barbiere: €30-€60, ogni 3-4 settimane
- Beard oil + trimmer: €15-€150 acquisto una tantum

**Impatto complessivo beauty:**

- Routine regolare: +5 a +20% aspetto (dipende da base)
- Self-esteem: +5-15% felicità cronica
- Costo mensile: €100-€1000 (lifestyle economico → lusso)
- Time cost: 30-90 min/giorno

### 33.2 Abbigliamento e Moda

|Tier        |Budget/anno   |Brand                 |Occasioni              |
|------------|--------------|----------------------|-----------------------|
|Economy     |€500-€2000    |H&M, Zara, Primark    |Quotidiano             |
|Medium      |€2000-€8000   |Gap, COS, Nordstrom   |Lavoro + casual        |
|Luxury      |€10000-€50000 |Gucci, Prada, Dior    |Lavoro premium + eventi|
|Ultra luxury|€50000-€500000|Hermès, custom couture|Élite, eventi esclusivi|

**Guardaroba necessario per occasioni:**

- Work clothes (business/business casual): richiesto per lavori professionali
- Casual wear (weekend, relax)
- Party clothes (eventi sociali, club)
- Formal (matrimoni, gala, eventi ufficiali)
- Lutto (nero/conservatore)
- Sportswear (gym, outdoor)

**Mode stagionali:**

- Collezioni SS (primavera/estate): gennaio-febbraio
- Collezioni FW (autunno/inverno): settembre-ottobre
- Capi outdated (5+ anni senza aggiornamento): -10% aspetto

**Accessori di lusso:**

- Orologi: Rolex (€8000-€50000), Patek Philippe (€20000-€1000000)
- Borse: Hermès Birkin (€8000-€50000), Chanel Classic Flap (€7000-€10000)
- Scarpe: Christian Louboutin (€600-€2000), Nike Jordan Limited (€200-€5000+)

**Impatto abbigliamento:**

- Reputazione professionale: +10-20% con abbigliamento appropriato
- Job interview success: +20% se ben vestito
- Dating match rate: +30% con look curato
- Status sociale percepito: visibilità brand = classe alta percepita

Ogni outfit deve avere:

- `occasion`, `style`, `brand_tier`, `cost`
- `quality` (1-10, durabilità), `trendiness` (current/outdated)
- `aspect_bonus` (+0 a +20%)

-----

## 34. Sistema Pensionamento e Vita Post-Lavoro

### 34.1 Pensionamento

|Tipo                 |Età      |Requisiti             |Note                    |
|---------------------|---------|----------------------|------------------------|
|Volontario (early)   |55-60    |€2M+ savings          |FIRE movement           |
|Volontario (standard)|62-67    |40+ anni contributi   |Benefit pieno a 67      |
|Forzato              |70-75    |—                     |Policy aziendale o legge|
|Medical retirement   |Qualsiasi|Disabilità certificata|Pensione di invalidità  |

**Benefit pensionistici:**

- **Social Security / Pensione INPS:**
  - Early (62-65): 70-85% del benefit pieno
  - Full (67): 100% del benefit
  - Delayed (70+): 130-132% del benefit
  - Range: €1000-€6000/mese (dipende da storico contributivo)
- **Pensione aziendale (defined benefit):** €2000-€8000/mese garantiti
- **Pensione integrativa (401k / fondi pensione):** €200000-€5M accumulati
- **Investimenti personali:** portfolio azionario + immobili

### 34.2 Vita Post-Pensionamento

**Sistemazioni abitative senior:**

|Opzione             |Costo/mese   |Autonomia|Note                                 |
|--------------------|-------------|---------|-------------------------------------|
|Aging in place      |€0-€500 extra|Totale   |Casa di proprietà, mods accessibility|
|Downsizing          |€800-€1500   |Totale   |Appartamento più piccolo             |
|Retirement community|€2000-€5000  |Alta     |Servizi comuni, attività             |
|Assisted living     |€4000-€8000  |Parziale |Aiuto ADL (activit. daily living)    |
|Nursing home        |€6000-€12000 |Minima   |Assistenza H24                       |
|Con i figli         |€0           |Variabile|Comune in culture latine/asiatiche   |

**Condizioni mediche comuni (età 65+):**

|Condizione       |Prevalenza         |Costo mensile cure|
|-----------------|-------------------|------------------|
|Artrite          |50%                |€200-€500         |
|Ipertensione     |60%                |€50-€200          |
|Diabete tipo 2   |25%                |€100-€400         |
|Malattia cardiaca|30%                |€500-€2000        |
|Problemi visivi  |40%                |€100-€300         |
|Problemi udito   |35%                |€200-€500         |
|Demenza/Alzheimer|5% a 65+, 30% a 85+|€5000-€10000/mese |

**Alzheimer’s timeline:**

- Mild (anni 1-3): dimenticanza, confusione occasionale
- Moderate (anni 4-7): assist needed for daily tasks, identity confusion
- Severe (anni 8-10): non riconosce familiari, assistenza H24
- Costo totale assistenza: €500000-€1M per ciclo completo

**Attività post-pensionamento:**

- Viaggi: 3-4/anno, €5000-€20000 totale
- Hobby: giardinaggio, painting, cucina, knitting, golf (€200-€1000/mese)
- Part-time work: 10-20h/settimana (€1000-€3000/mese extra)
- Volunteering: +felicità, +scopo, +connessioni sociali
- Grandparenting: cura nipoti (+bond multigenerazionale)

**End-of-life planning:**

- Testamento: €300-€1500 (redatto 70-80 anni)
- Direttive anticipate di trattamento (DAT): preferenze mediche fine vita
- Delega/Power of attorney: chi gestisce finanze e decisioni mediche
- Funerale pre-pianificato: €5000-€30000
- Cremazione: €1000-€3000 (in crescita, 50% in USA)
- Sepoltura tradizionale: €7000-€20000 (loculo, bara, cerimonia)

**Legacy:**

- Eredità ai figli: €100k-€10M (dipende da assets accumulati)
- Donazioni charity
- Heirlooms: gioielli, arte, documenti storici
- Memoriale digitale (foto, video, messaggi lasciati)

Ogni senior deve avere:

- `health_status` (good/fair/poor/critical)
- `mobility` (independent/assistive device/wheelchair/bedridden)
- `cognitive_status` (sharp/mild impairment/dementia/severe dementia)
- `living_situation`, `monthly_expenses`, `savings_remaining`, `life_expectancy`

-----

## 35. Sistema Eventi Storici, Festività e Manutenzione Casa

### 35.1 Eventi Storici Reali

Gli eventi storici si attivano automaticamente se il personaggio ha l’età appropriata e si trova nella nazione corretta:

|Anno|Evento               |Effetti gameplay                                                 |
|----|---------------------|-----------------------------------------------------------------|
|1969|Moon Landing         |+ottimismo globale, +interesse scientifico                       |
|1986|Chernobyl (USSR)     |+radiation risk in area, -salute nazione                         |
|1989|Caduta Muro Berlino  |+libertà di movimento Europa                                     |
|1991|Dissoluzione URSS    |Nazioni nuove disponibili, instabilità                           |
|2001|11 Settembre         |+sicurezza aeroporti, +islamofobia event, -viaggio internazionale|
|2007|Lancio iPhone        |Sblocca social media e app dating                                |
|2008|Crisi finanziaria    |-salario 20%, -valore case 30%, +disoccupazione                  |
|2011|Fukushima (Japan)    |-turismo Giappone, +dibattito nucleare                           |
|2020|COVID-19 Pandemia    |Lockdown, remote work, +morti NPC, mascherine obbligatorie       |
|2022|Guerra Russia-Ucraina|+costo energia, rifugiati, possibile coscrizione                 |
|2022|ChatGPT / AI boom    |+automazione lavori, -certi ruoli disponibili                    |

**Leader reali come NPC:**

- Presidenti USA, premier europei appaiono come NPC di sfondo nei news events
- Tech CEO (Musk, Bezos, Zuckerberg) nei tech events
- Sportivi famosi (Ronaldo, Messi, LeBron) nei sport events

Ogni evento storico deve avere:

- `date` (anno/mese), `trigger_conditions` (età player, nazione)
- `effects` (array stat changes, events unlocked)
- `duration` (anni in cui l’evento è attivo)
- `historical_accuracy` flag

### 35.2 Festività e Calendario

**Festività nazionali (Italia):**

- Capodanno (1 gennaio): party, resoluzioni anno nuovo
- Pasqua (data mobile): famiglia, uova, pranzo tradizionale
- Festa dei Lavoratori (1 maggio): manifestazioni, giorno libero
- Festa della Repubblica (2 giugno): parata militare
- Ferragosto (15 agosto): vacanze, spiaggia, città deserta
- Natale (25 dicembre): regali, famiglia, cena tradizionale

**Festività religiose per credenza:**

- Cattolica/Cristiana: Natale (25/12), Pasqua, Ognissanti (1/11), Epifania (6/1)
- Musulmana: Ramadan (30 giorni digiuno), Eid al-Fitr, Eid al-Adha
- Ebraica: Rosh Hashanah, Yom Kippur, Hanukkah (8 giorni), Pesach
- Induista: Diwali (festival luci, ottobre/novembre), Holi (festival colori, marzo)
- Buddista: Vesak (nascita/illuminazione/morte del Buddha)

**Festività culturali globali:**

- San Valentino (14 febbraio): regali, date, fiori
- Halloween (31 ottobre): costumi, feste, trick-or-treat
- Festa della Mamma (seconda domenica maggio): regali, fiori
- Festa del Papà (terza domenica giugno / 19 marzo): regali
- Capodanno cinese (data lunare): +contesto nazione asiatica

**Impatto festività:**

- Giorni festivi = no lavoro (stipendio non perso per dipendenti)
- Spese regalo: €20-€500 per festività (estate, natale)
- Gathering famiglia: +bond relazioni familiari, possibili tensioni
- Festività religiose seguite con pratica attiva: +karma spirituale

Ogni festività deve avere:

- `name`, `date` (fixed o floating), `religious` (sì/no)
- `national_holiday` (sì/no), `traditions`, `gift_giving` (sì/no, costo medio)
- `family_gathering` (sì/no), `effects` (array)

### 35.3 Manutenzione Casa e Riparazioni

**Rotture improvvise (eventi casuali in casa propria):**

|Guasto               |Costo riparazione|Costo sostituzione|Urgenza               |
|---------------------|-----------------|------------------|----------------------|
|Frigorifero          |€200-€600        |€1500-€3000       |Alta                  |
|Lavatrice            |€150-€400        |€800-€1500        |Alta                  |
|Scaldabagno          |€300-€600        |€1000-€2500       |Alta                  |
|HVAC (condizionatore)|€300-€1000       |€5000-€15000      |Stagionale            |
|Perdita tetto        |€2000-€10000     |—                 |Alta (pioggia)        |
|Tubatura rotta       |€500-€5000       |—                 |Critica (alluvione)   |
|Problema elettrico   |€500-€5000       |—                 |Alta (incendio risk)  |
|Infestazione roditori|€500-€2000       |—                 |Media                 |
|Infestazione termiti |€2000-€10000     |—                 |Alta (danni struttura)|
|Cimici               |€1000-€5000      |—                 |Alta                  |

**Ristrutturazioni (investimento con ROI):**

|Ristrutturazione     |Costo        |ROI vendita|Durata cantiere|
|---------------------|-------------|-----------|---------------|
|Cucina               |€15000-€60000|70%        |4-8 settimane  |
|Bagno                |€8000-€30000 |65%        |2-4 settimane  |
|Basement finishing   |€20000-€50000|70%        |6-10 settimane |
|Pavimenti nuovi      |€5000-€20000 |50%        |1-2 settimane  |
|Tinteggiatura interna|€3000-€10000 |50%        |1 settimana    |
|Esterno/giardino     |€5000-€20000 |75%        |2-4 settimane  |

**Manutenzione regolare (costi annuali):**

- Taglio erba/giardino: €3000-€8000/anno (Aprile-Ottobre)
- Manutenzione piscina: €5000-€10000/anno
- HVAC check: €150-€300 × 2/anno (primavera e autunno)
- Pulizia grondaie: €150-€300 × 2/anno
- Ispezione termiti: €100-€300/anno
- Cambio batterie rilevatori: €50/anno

**Regola costi emergenza vs pianificazione:**

- Riparazione pianificata: costo base
- Riparazione emergenza (weekend/notte): +50-100% su manodopera
- Neglecting manutenzione: valore casa -10%/anno, rischio guasti catastrofici +30%

Ogni evento casa deve avere:

- `trigger_probability` (%), `severity` (1-5), `cost_range`
- `urgency` (immediata/settimana/stagionale), `DIY_possible` (sì/no, sconto 50%)

-----

-----

## 36. Sistema Challenge (Eventi a Tempo)

### 36.1 ChallengeEngine

Il gioco include sfide temporali che creano motivazione per tornare a giocare:

**Tipi di Challenge:**

|Categoria     |Esempio                     |Durata       |Reward                             |
|--------------|----------------------------|-------------|-----------------------------------|
|**Weekly**    |“Diventa re entro i 40 anni”|1 settimana  |5000 pt, Ribbon “Regale”           |
|**Monthly**   |“Vivi in 5 paesi diversi”   |1 mese       |10000 pt, Achievement “Esploratore”|
|**Seasonal**  |“Guadagna €1M in estate”    |3 mesi       |25000 pt, Item “Tesoro”            |
|**Lifetime**  |“Non commettere crimini”    |Vita completa|50000 pt, Ribbon “Eroe”            |
|**Difficulty**|“Da homeless a milionario”  |3 anni       |100000 pt, Achievement “Rinascita” |

**Challenge Categories:**

- **Career:** “CEO a 35 anni”, “Medico in 8 anni”
- **Financial:** “Raggiungi €10M”, “Mai un debito”
- **Relational:** “Matrimonio 50 anni”, “10 figli sani”
- **Educational:** “PhD in 3 materie”, “0 bocciature”
- **Criminal:** “Evita prigione 40 anni”, “Capo mafia a 30”
- **Health:** “100 anni in salute”, “0 malattie gravi”
- **Travel:** “Visita tutti i paesi”, “50 crociere”
- **Special:** “Nasce e muori stesso giorno”, “Gemelli identici”

**Schema dati Challenge:**

```typescript
interface Challenge {
  id: string
  name: string
  description: string
  category: string
  duration: "weekly" | "monthly" | "seasonal" | "lifetime"
  start_date: string
  end_date: string
  conditions: Condition[]
  reward_points: number
  reward_ribbons: string[]
  reward_items: string[]
  difficulty: "easy" | "medium" | "hard" | "legendary"
  success_rate: number
}

interface Condition {
  type: string
  value: number
  threshold: number
  comparison: ">" | "<" | "=="
}
```

**Meccaniche Challenge:**

- Nuove challenge appaiono ogni settimana (Monday 00:00 UTC)
- 3-5 challenge attive simultaneamente
- Player può accettare 1-3 challenge contemporaneamente
- Streak bonus: challenge consecutive completate +10% punti per streak
- Challenge expire automaticamente a `end_date`
- Fallimento: challenge scompare, -5% reputation

**Impatto Gameplay:**

- Retention: +40% frequenza sessioni settimanali
- Variety: impone percorsi di vita diversi
- Community: leaderboard challenge competitive
- Monetization: premium challenge (€5-€20, reward rari)

-----

## 37. Sistema Generational Legacy (Dinastia Familiare)

### 37.1 Tratti Genetici Trasmissibili

|Trait                    |Genetica|Ambiente             |Effetto gameplay             |
|-------------------------|--------|---------------------|-----------------------------|
|Intelligenza             |50%     |50% (educazione)     |Career success, income       |
|Aspetto                  |60%     |40% (cura personale) |Dating success, job interview|
|Salute                   |40%     |60% (fitness, dieta) |Lifespan, malattia risk      |
|Predisposizione criminale|30%     |70% (famiglia, amici)|Crime probability            |
|Estroversione            |45%     |55% (socializzazione)|Social skills, leadership    |
|Conscienziosità          |50%     |50% (educazione)     |Discipline, career progress  |
|Apertura mentale         |40%     |60% (esperienze)     |Creatività, travel           |
|Gelosia                  |35%     |65% (relazioni)      |Relationship stability       |
|Resistenza alcol         |70%     |30% (uso)            |Addiction risk               |
|Tendenza depressiva      |55%     |45% (stress)         |Mental health                |

### 37.2 Eredità Asset

|Asset        |% Ereditato|Note                                      |
|-------------|-----------|------------------------------------------|
|Soldi liquidi|100%       |Meno tasse ereditarie (10-40% per nazione)|
|Casa         |100%       |Valore mercato corrente                   |
|Auto         |100%       |Valore residuo                            |
|Investimenti |100%       |Stocks, bonds                             |
|Business     |70%        |Success probability 50% per il figlio     |
|Debiti       |100%       |Net worth calculation                     |

### 37.3 Eredità Relazioni e Memorie

|Tipo              |% Conservato|Note                             |
|------------------|------------|---------------------------------|
|Parenti           |100%        |Nonni, fratelli, coniugi         |
|Amici             |70%         |Memoria interazioni              |
|Ex partner        |30%         |Solo se relationship positiva    |
|Colleghi          |50%         |Network professionale            |
|Nemici            |40%         |Rischio vendetta sulla famiglia  |
|Memorie importanti|100%        |Tramandati come “storia famiglia”|
|Achievement       |100%        |Ribbon family                    |
|Traumi            |80%         |Se impatto psicologico alto      |
|Tradizioni        |90%         |Cultural preservation            |

**Schema dati Legacy:**

```typescript
interface Legacy {
  player_id: string
  death_date: string
  children: ChildInheritance[]
  assets_transferred: Asset[]
  traits_inherited: Trait[]
  relationships_maintained: Relationship[]
  memories_preserved: Memory[]
  family_ties: number  // 0-100
  legacy_score: number // 0-1000
  ribbons_family: string[]
}

interface ChildInheritance {
  id: string
  age: number
  intelligence: number
  aspect: number
  health: number
  criminal_tendency: number
  personality: PersonalityBigFive
  starting_money: number
  starting_relationships: Relationship[]
  parent_memory: string
}
```

**Legacy Bonus:**

- Family Ties > 80%: figlio +10% intelligenza, +10% felicità
- Legacy Score > 700: figlio +15% income, +5% soldi iniziali
- Ribbon Family: achievement parzialmente completati all’inizio
- Trauma basso: figlio -5% rischio depressione, +5% autostima

**Continuazione Partita:**

- Prompt: “Vuoi continuare come [nome figlio]?” (10 secondi timeout)
- Skip: nuova partita, legacy conservato in background
- Con più figli: player sceglie quale continuare
- Il figlio parte all’età attuale (18-25 per indipendenza)

-----

## 38. Sistema Customization (Editor Contenuti)

### 38.1 Formato Standard JSON Custom Content

```json
{
  "custom_scenario": {
    "id": "scenario_001",
    "name": "Vita da Milionario",
    "description": "Comincia con €10M, mantieni lo status",
    "author": "PlayerName",
    "created_date": "2026-06-06",
    "starting_stats": {
      "money": 10000000,
      "intelligence": 80,
      "aspect": 90,
      "health": 95,
      "age": 25,
      "occupation": "investor"
    },
    "starting_relationships": [
      { "name": "Padre Ricco", "type": "parent", "trust": 100, "money": 50000000 }
    ],
    "custom_events": [
      {
        "id": "event_001",
        "trigger": "age == 30",
        "text": "Padre ti offre un business da €5M",
        "choices": [
          { "text": "Accetta", "effects": { "money": -5000000, "business_income": 500000 } },
          { "text": "Rifiuta", "effects": { "relationship_padre": -30, "self_esteem": 10 } }
        ]
      }
    ],
    "custom_goals": [
      {
        "id": "goal_001",
        "name": "Preserva il Milionato",
        "condition": "money >= 10000000 && age == 50",
        "reward": "Ribbon 'Milionato Permanente'"
      }
    ]
  }
}
```

**Tipi di Contenuto Personalizzabile:**

|Tipo      |Cosa modifica                            |Complessità|
|----------|-----------------------------------------|-----------|
|Scenarios |Starting stats, eventi                   |Media      |
|Characters|NPC custom                               |Bassa      |
|Events    |Eventi personalizzati con trigger/effects|Media      |
|Jobs      |Lavori custom con requisiti              |Alta       |
|Items     |Oggetti con effetti stat                 |Bassa      |
|Goals     |Obiettivi con condizioni                 |Media      |
|Ribbons   |Medaglie custom                          |Bassa      |
|Nations   |Nazioni custom                           |Alta       |

**Tool di Creazione:**

- Scenario Editor: GUI per starting conditions
- Event Builder: creatore eventi drag-and-drop
- Character Maker: aspetto, personality, history
- Job Designer: requisiti, salary, promotion chain
- Item Creator: nome, costo, effetti
- Goal Workshop: condizioni, reward, difficoltà

**Sharing System:**

- Upload su community (10.000+ scenari disponibili)
- Rating 1-5 stelle + commenti
- Trending weekly (scenari più scaricati)
- Validation AI: syntax check + balance check + content filter
- Compatibilità: check versione gioco prima del caricamento

-----

## 39. Sistema Medaglie Avanzato (Ribbons/Achievements)

### 39.1 Ribbon Categories

|Categoria  |Esempi                                                             |Quantità|
|-----------|-------------------------------------------------------------------|--------|
|Career     |“CEO a 30”, “Mafia Boss”, “Premio Oscar”                           |20      |
|Financial  |“Milionario”, “Billionario”, “Bancarotta”                          |15      |
|Relational |“Matrimonio 50 anni”, “10 figli”, “Traditore”                      |18      |
|Educational|“PhD Tripla”, “0 bocciature”, “IQ 180”                             |12      |
|Health     |“100 anni sano”, “Atleta Olimpico”, “Drug Addict”                  |15      |
|Criminal   |“Inafferrabile”, “10 anni di prigione”, “Esecuzione”               |10      |
|Travel     |“195 paesi”, “50 crociere”, “Tourist Homeless”                     |8       |
|Special    |“Gemelli Identici”, “Nasce e muori stesso giorno”, “Reincarnazione”|12      |

**Ribbon Tiers:**

|Tier    |Difficoltà     |% Player|Esempi                            |
|--------|---------------|--------|----------------------------------|
|Bronze  |Facile         |30%     |“Primo lavoro”, “Primo amore”     |
|Silver  |Media          |15%     |“CEO”, “€1M savings”              |
|Gold    |Difficile      |5%      |“Billionario”, “PhD tripla”       |
|Platinum|Molto difficile|1%      |“100 anni sano”, “195 paesi”      |
|Diamond |Legendary      |0.1%    |“Perfect life” (0 eventi negativi)|

**Schema dati:**

```typescript
interface Ribbon {
  id: string
  name: string
  description: string
  category: string
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
  condition: string
  difficulty: number  // 0-100%
  players_earned: number
  reward_points: number
  icon: string
  color: string
}
```

**Achievement System:**

- Progress tracking: player vede % completamento per ogni achievement
- Hints: “Quasi completato: 8/10 figli”
- Notifications: alert quando achievement a < 10% dal completamento
- Leaderboard: top players per count totale ribbon
- Showcase pubblico: profilo con ribbon sbloccati visibili ad altri

**Collection Bonuses:**

- 100 ribbon totali: badge “Master Player” (+20% punti permanenti)
- 20 ribbon in una categoria: “Expert [Categoria]” (+10% punti settore)
- 10 Diamond ribbon: “Legendary” (+15% punti permanenti)

-----

## 40. Sistema Social Media Dinamico (Influencer Simulator Avanzato)

### 40.1 Algoritmo Viralità

```
ViralScore = (
  base_quality     × 0.30 +
  follower_reach   × 0.20 +
  trendiness       × 0.20 +
  randomness       × 0.10 +
  engagement_hist  × 0.20
) × algorithm_multiplier

dove:
  follower_reach   = log10(followers) / 1000
  algorithm_multiplier = 0.5–2.0 (cambia ogni giorno)
  randomness       = 0–50 (fortuna casuale)
```

**Tipi di Post e Performance:**

|Tipo Post       |Quality Min|Viral Chance|Engagement range|
|----------------|-----------|------------|----------------|
|Foto normale    |30         |5%          |1-5% followers  |
|Foto qualità    |60         |15%         |5-15% followers |
|Video corto     |40         |10%         |3-10% followers |
|Video lungo     |70         |25%         |10-25% followers|
|Live stream     |50         |20%         |15-30% followers|
|Trending topic  |50         |40%         |20-40% followers|
|Controversiale  |40         |35%         |25-50% followers|
|Emotivo/toccante|80         |30%         |30-60% followers|

**Engagement Metrics:**

- Likes: 1-60% followers (basato su ViralScore)
- Comments: 0.1-5% followers
- Shares: 0.05-2% followers
- Followers Gain: `likes × 0.01`
- Followers Loss: post negativo = -0.5% followers

**Variabilità Algoritmo:**

- Daily multiplier: 0.5-2.0 cambia ogni giorno (simula algoritmo reale)
- Platform bias: TikTok favorisce video brevi, Instagram favorisce foto
- Time bias: post 18:00-21:00 = +30% engagement
- Trend bias: topic trend corrente = +40% viralità
- Random surge: 5% probabilità post diventa super-viral (10× likes normali)

**Social Events:**

|Evento           |Trigger                     |Effetto                          |
|-----------------|----------------------------|---------------------------------|
|Viral post       |ViralScore > 90             |+10000 followers, +€50000        |
|Cancel culture   |Contenuto offensivo scoperto|-5000 followers, -30 reputation  |
|Sponsorship offer|Followers > 10000           |+income fisso mensile            |
|Hate comments    |Post controversiale         |-10 happiness                    |
|Fan letter       |Bond fan alto               |+20 happiness                    |
|Celebrity collab |Follower > 100K             |+5000 followers, evento esclusivo|

**Stage di Crescita:**

|Followers|Status   |Earnings/post|Opportunità              |
|---------|---------|-------------|-------------------------|
|0-1K     |Nobody   |€0           |Nessuna                  |
|1K-10K   |Beginner |€50-€200     |Brand piccoli            |
|10K-100K |Mid-tier |€500-€5K     |Brand medi               |
|100K-1M  |Famous   |€5K-€50K     |Brand grandi, TV         |
|1M-10M   |Celebrity|€50K-€500K   |Film, endorsement globale|
|10M+     |Icon     |€500K-€5M    |Tutto                    |

-----

## 41. Sistema Espansioni (Job Packs Modulari)

### 41.1 Architettura Modulare

Ogni Job Pack è un file JSON autonomo con struttura standard:

```json
{
  "job_pack": {
    "id": "pack_mafia_001",
    "name": "Mafia Pack",
    "version": "1.0",
    "description": "Carriera criminale completa: piccola mafia → capo",
    "jobs": [
      {
        "id": "mafioso",
        "name": "Mafioso",
        "level": 1,
        "salary_monthly": 3000,
        "requirements": { "age_min": 18, "criminal_tendency": 50 },
        "promotion_to": "scerato"
      },
      {
        "id": "scerato",
        "name": "Scerato",
        "level": 2,
        "salary_monthly": 8000,
        "requirements": { "age_min": 25, "mafia_level": 2 },
        "promotion_to": "capo_mafia"
      },
      {
        "id": "capo_mafia",
        "name": "Capo Mafia",
        "level": 3,
        "salary_monthly": 50000,
        "requirements": { "age_min": 40, "mafia_level": 5 },
        "promotion_to": null
      }
    ],
    "events": [ ... ],
    "goals": [ ... ],
    "items": [ ... ]
  }
}
```

**Catalogo Pack Disponibili:**

|Pack         |Contenuto                             |Jobs|Events|Prezzo|
|-------------|--------------------------------------|----|------|------|
|Mafia Pack   |Carriera criminale completa           |5   |10+   |€10   |
|Actor Pack   |Carriera attore Hollywood             |5   |12+   |€12   |
|Medical Pack |Chirurgo, Ricercatore, Psicologo      |6   |15+   |€10   |
|Artistic Pack|Artista, Musicista Grammy, Scrittore  |5   |10+   |€8    |
|Business Pack|CEO Tech, Crypto Investor, Real Estate|6   |12+   |€12   |
|Sports Pack  |Atleta Olimpico, NFL, F1 Driver       |5   |10+   |€10   |
|Special Pack |Re/Regina, scenari fantasy            |5   |15+   |€15   |

**Integrazione Database:**

- Ogni record in `jobs`, `events`, `items`, `goals` ha colonna `pack_id`
- Query filtrata: `SELECT * FROM jobs WHERE pack_id = 'base' OR pack_id IN (active_packs[])`
- Activation/deactivation senza toccare il save corrente
- Conflict check automatico prima di attivare pack incompatibili

**Impatto Gameplay:**

- Scalabilità: developer rilascia nuovi pack senza rework del core
- Revenue: pack = monetization principale stimata €50K-€200K/mese
- Variety: player sceglie percorsi di vita diversi per ogni run
- Future-proof: architettura pronta per espansioni infinite

-----

## 42. Sistema Ricordi NPC (Memory System)

### 42.1 Struttura Memoria NPC

```typescript
interface NPCMemory {
  id: string
  date: string
  interaction_type: string
  player_action: string
  npc_reaction: string
  emotional_impact: number   // -100 a +100
  importance: number         // 1-5 (5 = critico)
  unforgettable: boolean     // se importance >= 5
  category: MemoryCategory
}

interface NPC {
  id: string
  name: string
  memories: NPCMemory[]
  trust_player: number       // 0-100
  hate_player: number        // 0-100
  love_player: number        // 0-100
  respect_player: number     // 0-100
}
```

**Categorie Memoria e Impatti:**

|Categoria   |Esempi                                |Impact Range|Persistenza         |
|------------|--------------------------------------|------------|--------------------|
|Romantic    |Primo rapporto, tradimento, matrimonio|-100 / +100 |100% (unforgettable)|
|Family      |Nascita figlio, supporto, abbandono   |-80 / +90   |90%                 |
|Friendship  |Aiuto, tradimento, festa              |-60 / +80   |70%                 |
|Professional|Promozione, licenziamento             |-50 / +70   |50%                 |
|Financial   |Aiuto soldi, truffa, prestito         |-70 / +60   |60%                 |
|Criminal    |Crimine insieme, arresto, bugia       |-90 / +40   |80%                 |
|Health      |Visita medico, aiuto malattia         |-40 / +70   |40%                 |
|Social      |Scandalo pubblico, supporto           |-60 / +50   |50%                 |

**Formula Peso Memoria:**

```
TotalImpact = Σ(memory.impact × memory.importance) / Σ(memory.importance) × decay

decay = {
  0-1 anno:    1.0,
  1-5 anni:    0.8,
  5-10 anni:   0.6,
  10-20 anni:  0.4,
  20+ anni:    0.2
}
```

**Esempi Memory Events:**

|Scenario                |NPC dice                                     |Effetto Player              |
|------------------------|---------------------------------------------|----------------------------|
|Tradimento 20 anni fa   |“Ancora ricordo quando mi tradisti…”         |-30 trust, -20 happiness NPC|
|Aiuto economico dato    |“Sei stato generoso quando ero in difficoltà”|+40 trust, +20 love         |
|Lavoro condiviso 10 anni|“Ricordo bene quel periodo insieme”          |+25 respect, +15 friendship |
|Scandalo 2015           |“La gente parla ancora di quello scandalo”   |-20 reputation, -10 trust   |
|Nascita nipote          |“Grazie per la nostra famiglia”              |+60 love, +50 respect       |

**Logica di Attivazione:**

- 20% probabilità: NPC menziona una memoria casuale all’incontro
- 10% probabilità: NPC dice spontaneamente “Ancora ricordo quando…”
- 100% per azioni critiche: tradimento, matrimonio, morte familiare, nascita figlio
- Azioni di importanza 4-5: trigger guaranteed memory event

**Impatto Gameplay:**

- Realismo: NPC sembrano persone vere (+80% immersione)
- Conseguenze a lungo termine: piccole scelte hanno effetti anni dopo
- Tensione narrativa: “Questo NPC ricorda il tradimento di 10 anni fa?”
- Relazioni evolutive: non statiche, cambiano nel tempo

-----

## 43. Sistema Scoperte e Segreti (Hidden Lore & Easter Eggs)

- **Trigger procedurali:** combinazioni uniche di stats/storia/nazione sblocano eventi nascosti
- **Esempio “Mappa del Tesoro”:** viaggia in 5 nazioni tropicali + stringi amicizia con un archeologo → evento esclusivo con ricompensa rara
- **Rarità:** hidden (comune), rare (1%), legendary (0.1%)
- **Impatto community:** easter egg generano discussioni e teoria collettiva → marketing virale organico
- **Achievement esclusivi:** ribbon unici non documentati (il player li scopre da solo o via community)
- **Lore familiare:** alcune scoperte sono legate a `history_flags` dei genitori (continuità cross-generazionale)

-----

## 44. Sistema Global State (Mondo Dinamico)

Il `WorldEventEngine` modifica `nations.json` in tempo reale durante la partita:

**Tipi di Macro-Eventi Globali:**

|Evento                 |Trigger                       |Effetti su tutte le nazioni                             |
|-----------------------|------------------------------|--------------------------------------------------------|
|Crisi economica        |Random ogni 15-20 anni in-game|Salari -20%, disoccupazione +15%, case -30%             |
|Boom economico         |Dopo crisi (10-15 anni)       |Salari +15%, opportunità lavoro +20%                    |
|Pandemia globale       |Random 0.5%/anno              |Lockdown, lavoro remoto, morti NPC di massa             |
|Innovazione tecnologica|Ogni 10 anni                  |Nuovi lavori (es. AI Trainer), vecchi scompaiono        |
|Guerra regionale       |Paesi instabili               |Coscrizione possibile, fuga rifugiati, prezzi energia + |
|Cambiamento legale     |Giocatore politico o random   |Marijuana legale, aborto vietato, matrimonio egualitario|
|Rivoluzione culturale  |Movimento sociale forte       |Cancel culture intensificata, nuove norme sociali       |

**Impatto sul Player:**

- Le leggi cambiate nel mondo influenzano azioni disponibili (es. aborto diventa illegale)
- Crisi economica cambia salari, costi, opportunità lavorative
- Innovazioni sblocano nuove carriere e chiudono quelle obsolete
- Il player politico può **causare** questi cambiamenti con le proprie azioni

-----

## 45. Integrazione Asincrona (Notifiche Push Intelligenti)

Le notifiche sono generate dal Memory System e dagli eventi NPC autonomi:

**Esempi di Notifiche:**

- “Tua figlia [Nome] si è sposata oggi. Vuoi festeggiarla?” → tap → evento relazionale
- “Il tuo amico [Nome] è stato ricoverato in ospedale.” → tap → evento salute NPC
- “Un’offerta di lavoro ti aspetta in [Nazione].” → tap → evento carriera
- “[Nome] ti ricorda: ‘Hai una promessa da mantenere.’” → tap → evento memoria
- “La tua azienda ha raggiunto €1M di fatturato!” → tap → achievement

**Policy Re-engagement:**

- Max 2 notifiche/giorno (non aggressivo)
- Notifiche basate su eventi reali nel gioco (non random marketing)
- Player può personalizzare frequenza e categorie
- Silenzio automatico 22:00-08:00 (rispetto orario utente)

-----

## 46. Modalità Hardcore (Iron Man Mode)

**Regole Modalità Hardcore:**

- Flag `ironMan: true` nel salvataggio (non modificabile)
- **Salvataggio unico:** niente reload, niente undo — ogni scelta è definitiva
- Decadimento salute +30% più rapido
- Tutte le scelte sono irreversibili (niente secondo tentativo)
- Morte permanente: niente continuazione come figlio (game over totale)
- Eventi negativi +20% probabilità

**Reward Modalità Hardcore:**

- Ribbon esclusivo “Sopravvissuto” (solo da Hardcore)
- Moltiplicatore punti ×2 per tutta la run
- Leaderboard separata Hardcore (top 100 globale)
- Badge profilo pubblico “Ironman”
- Achievement “Leggenda” se si raggiunge 80 anni in Hardcore

**Schema salvataggio:**

```typescript
interface SaveGame {
  // ... altri campi ...
  ironMan: boolean              // immutabile dopo creazione
  ironMan_death_count: number   // sempre 0 (non c'è reload)
  ironMan_started: string       // data inizio
}
```

-----

-----

## Appendice A — Struttura `src/data/db.json`

```json
{
  "stats": [
    { "id": "health", "name": "Salute", "min": 0, "max": 100, "default": 75, "decay_per_year": 1, "death_threshold": 0 },
    { "id": "mental_health", "name": "Salute Mentale", "min": 0, "max": 100, "default": 70, "decay_per_year": 0.5, "depression_threshold": 20, "suicide_threshold": 5 },
    { "id": "happiness", "name": "Felicità", "min": 0, "max": 100, "default": 65, "decay_negative_conditions": 2 },
    { "id": "intelligence", "name": "Intelligenza", "min": 0, "max": 200, "default": 100, "genetic_inheritance": 0.5, "school_bonus_per_year": 2 },
    { "id": "aspect", "name": "Aspetto", "min": 0, "max": 100, "default": 50, "genetic_inheritance": 0.6, "aging_decay_per_year": 0.5 },
    { "id": "energy", "name": "Energia", "min": 0, "max": 100, "default": 80, "sleep_refill": 100, "work_decay_per_hour": 5 },
    { "id": "karma", "name": "Karma", "min": -1000, "max": 1000, "default": 0 },
    { "id": "age", "name": "Età", "min": 0, "max": 120, "default": 0, "death_avg_age": 75 },
    { "id": "money", "name": "Soldi", "min": 0, "max": 9999999999, "default": 0, "currency": "EUR" },
    { "id": "debt", "name": "Debiti", "min": 0, "max": 9999999999, "default": 0, "interest_rate": 0.08 },
    { "id": "credit_score", "name": "Credit Score", "min": 300, "max": 850, "default": 650 },
    { "id": "criminal_record", "name": "Fedina Penale", "min": 0, "max": 1000, "default": 0 },
    { "id": "reputation", "name": "Reputazione", "min": 0, "max": 100, "default": 50 }
  ],

  "jobs": [
    {
      "id": "unemployed", "name": "Disoccupato", "level": 0, "salary_monthly": 0, "pack_id": "base",
      "requirements": { "age_min": 0 }, "promotion_to": null, "stress_level": 0, "work_hours_per_week": 0
    },
    {
      "id": "cleaner", "name": "Addetto alle Pulizie", "level": 1, "salary_monthly": 1200, "pack_id": "base",
      "requirements": { "age_min": 16, "education": "none" }, "promotion_to": "cleaner_supervisor",
      "skills_required": [], "stress_level": 10, "work_hours_per_week": 35
    },
    {
      "id": "retail_worker", "name": "Venditore", "level": 1, "salary_monthly": 1400, "pack_id": "base",
      "requirements": { "age_min": 16, "education": "highschool" }, "promotion_to": "retail_manager",
      "skills_required": ["customer_service"], "stress_level": 15, "work_hours_per_week": 38
    },
    {
      "id": "teacher", "name": "Professore", "level": 1, "salary_monthly": 2200, "pack_id": "base",
      "requirements": { "age_min": 22, "education": "university", "degree": "education", "criminal_record_max": 0 },
      "promotion_to": "teacher_principal", "skills_required": ["teaching", "communication"],
      "stress_level": 20, "work_hours_per_week": 35
    },
    {
      "id": "lawyer", "name": "Avvocato", "level": 1, "salary_monthly": 6000, "pack_id": "base",
      "requirements": { "age_min": 24, "education": "law_school", "degree": "law", "license": "Bar_Exam", "criminal_record_max": 0, "intelligence_min": 110 },
      "promotion_to": "lawyer_senior", "skills_required": ["law", "communication", "negotiation"],
      "stress_level": 45, "work_hours_per_week": 50
    },
    {
      "id": "doctor", "name": "Medico", "level": 1, "salary_monthly": 8000, "pack_id": "base",
      "requirements": { "age_min": 26, "education": "medical_school", "degree": "medicine", "license": "USMLE", "criminal_record_max": 0, "intelligence_min": 120 },
      "promotion_to": "doctor_specialist", "skills_required": ["medicine", "healthcare"],
      "stress_level": 50, "work_hours_per_week": 50
    }
  ],

  "events": [
    {
      "id": "event_random_001", "pack_id": "base", "trigger_condition": "random_chance 0.1",
      "text": "Hai trovato €50 sul pavimento.",
      "choices": [
        { "text": "Prendi", "effects": { "money": 50, "karma": 0 } },
        { "text": "Metti da parte per il proprietario", "effects": { "karma": 10, "reputation": 1 } }
      ]
    },
    {
      "id": "event_health_001", "pack_id": "base", "trigger_condition": "health < 30",
      "text": "Ti senti malato. Vuoi visitare il medico?",
      "choices": [
        { "text": "Visita medico (€100)", "effects": { "money": -100, "health": 20, "energy": 10 } },
        { "text": "Rimani a casa", "effects": { "health": -5, "energy": -10 } }
      ]
    },
    {
      "id": "event_relationship_001", "pack_id": "base", "trigger_condition": "relationship_partner_trust < 50",
      "text": "Il tuo partner è sospettoso. Vuoi parlare?",
      "choices": [
        { "text": "Spieghi e rassicuri", "effects": { "relationship_partner_trust": 15, "relationship_partner_love": 5 } },
        { "text": "Ignori", "effects": { "relationship_partner_trust": -10, "relationship_partner_love": -5 } }
      ]
    },
    {
      "id": "event_job_001", "pack_id": "base", "trigger_condition": "job_id == 'cleaner'",
      "text": "Il supervisore ti offre una promozione se lavori domenica.",
      "choices": [
        { "text": "Accetti", "effects": { "energy": -20, "job_seniority": 1 } },
        { "text": "Rifiuti", "effects": {} }
      ]
    },
    {
      "id": "event_educational_001", "pack_id": "base", "trigger_condition": "job_id == 'student_highschool'",
      "text": "Esame finale. Vuoi studiare intensamente?",
      "choices": [
        { "text": "Studi 5 ore", "effects": { "intelligence": 3, "energy": -25, "exam_pass_probability": 90 } },
        { "text": "Non studi", "effects": { "exam_pass_probability": 50 } }
      ]
    }
  ],

  "goals": [
    { "id": "goal_money_million", "name": "Milionario", "condition": "savings >= 1000000", "reward": { "ribbon": "Milionario", "points": 1000 }, "difficulty": "hard" },
    { "id": "goal_degree_triple", "name": "PhD Tripla", "condition": "degrees_completed >= 3", "reward": { "ribbon": "Genio Accademico", "points": 2000 }, "difficulty": "legendary" },
    { "id": "goal_marriage_50years", "name": "Matrimonio Perfetto", "condition": "marriage_duration_years >= 50 && relationship_partner_love >= 80", "reward": { "ribbon": "Amore Eterno", "points": 1500 }, "difficulty": "legendary" },
    { "id": "goal_clean_record", "name": "Fedina Pulita", "condition": "criminal_record == 0", "reward": { "ribbon": "Eroe", "points": 500 }, "difficulty": "medium" },
    { "id": "goal_age_100", "name": "Centenario", "condition": "age >= 100 && health >= 80", "reward": { "ribbon": "Longevo", "points": 3000 }, "difficulty": "legendary" }
  ],

  "characters": [
    { "id": "char_parent_mom", "name": "Mamma", "type": "parent", "gender": "female", "relationship_base": { "trust": 80, "love": 90, "respect": 70 } },
    { "id": "char_parent_dad", "name": "Papà", "type": "parent", "gender": "male", "relationship_base": { "trust": 80, "love": 90, "respect": 70 } },
    { "id": "char_sibling", "name": "Fratello", "type": "sibling", "gender": "male", "relationship_base": { "trust": 60, "love": 70, "respect": 50 } },
    { "id": "char_spouse_default", "name": "Partner", "type": "spouse", "gender": "female", "relationship_base": { "trust": 50, "love": 60, "attraction": 70 } },
    { "id": "char_friend_default", "name": "Amico", "type": "friend", "gender": "male", "relationship_base": { "trust": 50, "love": 40, "friendship": 60 } }
  ],

  "nations": [
    {
      "id": "italy", "name": "Italia", "currency": "EUR", "tax_rate": 0.25, "healthcare_cost": 0.05,
      "avg_salary": 2500, "unemployment_rate": 0.08, "life_expectancy": 83, "crime_rate": 0.05,
      "legal_drug": false, "legal_gay": true, "legal_abortion": true, "language": "italian"
    },
    {
      "id": "usa", "name": "Stati Uniti", "currency": "USD", "tax_rate": 0.22, "healthcare_cost": 0.15,
      "avg_salary": 5500, "unemployment_rate": 0.05, "life_expectancy": 79, "crime_rate": 0.08,
      "legal_drug": true, "legal_gay": true, "legal_abortion": true, "language": "english"
    },
    {
      "id": "japan", "name": "Giappone", "currency": "JPY", "tax_rate": 0.28, "healthcare_cost": 0.03,
      "avg_salary": 4000, "unemployment_rate": 0.03, "life_expectancy": 85, "crime_rate": 0.02,
      "legal_drug": false, "legal_gay": false, "legal_abortion": true, "language": "japanese"
    }
  ],

  "skills": [
    { "id": "leadership", "name": "Leadership", "max_level": 100 },
    { "id": "customer_service", "name": "Customer Service", "max_level": 100 },
    { "id": "driving", "name": "Guida", "max_level": 100 },
    { "id": "medicine", "name": "Medicina", "max_level": 100 },
    { "id": "law", "name": "Legge", "max_level": 100 },
    { "id": "teaching", "name": "Insegnamento", "max_level": 100 },
    { "id": "communication", "name": "Comunicazione", "max_level": 100 },
    { "id": "negotiation", "name": "Negoziazione", "max_level": 100 },
    { "id": "music", "name": "Musica", "max_level": 100 },
    { "id": "art", "name": "Arte", "max_level": 100 },
    { "id": "cooking", "name": "Cucina", "max_level": 100 },
    { "id": "programming", "name": "Programmazione", "max_level": 100 }
  ],

  "packs": [
    { "id": "base", "name": "Gioco Base", "active": true, "jobs_count": 10, "events_count": 5, "price": 0 },
    { "id": "pack_mafia_001", "name": "Mafia Pack", "active": false, "jobs_count": 5, "events_count": 10, "price": 10 },
    { "id": "pack_actor_001", "name": "Actor Pack", "active": false, "jobs_count": 5, "events_count": 12, "price": 12 },
    { "id": "pack_medical_001", "name": "Medical Pack", "active": false, "jobs_count": 6, "events_count": 15, "price": 10 },
    { "id": "pack_sports_001", "name": "Sports Pack", "active": false, "jobs_count": 5, "events_count": 10, "price": 10 }
  ],

  "random_events": [
    { "id": "random_001", "trigger": "random_chance 0.05", "text": "Un'offerta di lavoro interessante arriva.", "category": "job" },
    { "id": "random_002", "trigger": "random_chance 0.03", "text": "Incontri un vecchio amico.", "category": "relationship" },
    { "id": "random_003", "trigger": "random_chance 0.02", "text": "Hai vinto €100 alla lotteria!", "category": "money" },
    { "id": "random_004", "trigger": "random_chance 0.01", "text": "Sei testimone di un crimine.", "category": "criminal" }
  ],

  "meta": {
    "version": "2.0",
    "created_date": "2026-06-06",
    "description": "MASTER GDD Life Simulator 2D — Database base. Espandi con Job Packs.",
    "tables_count": 9,
    "pack_architecture": "ogni tabella ha pack_id per filtraggio modulare"
  }
}
```

-----

## Appendice B — TypeScript Types (`src/store/gameStore.ts`)

```typescript
// ============================================================
// TIPI BASE
// ============================================================

export type Gender = "male" | "female" | "non-binary" | "transgender_male" | "transgender_female" | "other"
export type RelationshipStage = "stranger" | "acquaintance" | "friend" | "close_friend" | "partner" | "spouse"
export type PackId = string
export type JobId = string
export type EventId = string

// ============================================================
// STATS E DEFINIZIONI
// ============================================================

export interface StatDefinition {
  id: string
  name: string
  min: number
  max: number
  default: number
  decay_per_year?: number
}

export interface PlayerStats {
  health: number
  mental_health: number
  happiness: number
  intelligence: number
  aspect: number
  energy: number
  karma: number
  age: number
  money: number
  debt: number
  credit_score: number
  criminal_record: number
  reputation: number
  [key: string]: number | string  // permette effetti dinamici
}

// ============================================================
// RELAZIONI E NPC
// ============================================================

export interface NPCMemory {
  id: string
  date: string
  interaction_type: string
  player_action: string
  emotional_impact: number    // -100 a +100
  importance: number          // 1-5
  unforgettable: boolean
  category: "romantic" | "family" | "friendship" | "professional" | "financial" | "criminal" | "health" | "social"
}

export interface Relationship {
  npc_id: string
  relationship_type: string
  trust: number
  jealousy: number
  attraction: number
  love: number
  respect: number
  toxicity_tag: boolean
  history_flags: string[]
  relationship_stage: RelationshipStage
  memories: NPCMemory[]
}

export interface NPC {
  id: string
  name: string
  gender: Gender
  age: number
  occupation: string
  personality_traits: PersonalityBigFive
  daily_schedule: string[]
  personal_goals: string[]
  memories: NPCMemory[]
  trust_player: number
  hate_player: number
  love_player: number
  respect_player: number
}

export interface PersonalityBigFive {
  openness: number          // 0-100
  conscientiousness: number // 0-100
  extraversion: number      // 0-100
  agreeableness: number     // 0-100
  neuroticism: number       // 0-100
}

// ============================================================
// LAVORO E CARRIERA
// ============================================================

export interface Requirement {
  age_min?: number
  age_max?: number
  education?: string | null
  degree?: string
  license?: string
  criminal_record_max?: number
  reputation_min?: number
  intelligence_min?: number
  seniority_years?: number
  [key: string]: unknown
}

export interface Job {
  id: JobId
  name: string
  level: number
  salary_monthly: number
  requirements: Requirement
  promotion_to: JobId | null
  skills_required: string[]
  pack_id: PackId
  stress_level: number
  work_hours_per_week: number
}

export interface Skill {
  id: string
  name: string
  level: number   // 0-100, valore attuale del player
  max_level: number
}

// ============================================================
// EVENTI E SCELTE
// ============================================================

export interface Effect {
  [key: string]: number  // es: { "money": 5000, "health": -10, "relationship_partner_trust": 15 }
}

export interface Choice {
  id: string
  event_id: EventId
  text: string
  effects: Effect
  requirements?: Requirement
}

export interface GameEvent {
  id: EventId
  pack_id: PackId
  trigger_condition: string
  text: string
  choices: Choice[]
  category?: string
}

// ============================================================
// GOALS E ACHIEVEMENTS
// ============================================================

export interface Goal {
  id: string
  name: string
  description: string
  condition: string
  reward: { ribbon?: string; points?: number; items?: string[] }
  difficulty: "easy" | "medium" | "hard" | "legendary"
  completed: boolean
  progress?: number  // 0-100%
}

export interface Ribbon {
  id: string
  name: string
  description: string
  category: string
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
  earned: boolean
  earned_date?: string
  icon: string
}

// ============================================================
// CHALLENGE SYSTEM
// ============================================================

export interface Condition {
  type: string
  value: number
  threshold: number
  comparison: ">" | "<" | "==" | ">=" | "<="
}

export interface Challenge {
  id: string
  name: string
  description: string
  category: string
  duration: "weekly" | "monthly" | "seasonal" | "lifetime"
  start_date: string
  end_date: string
  conditions: Condition[]
  reward_points: number
  reward_ribbons: string[]
  reward_items: string[]
  difficulty: "easy" | "medium" | "hard" | "legendary"
  active: boolean
  completed: boolean
}

// ============================================================
// LEGACY SYSTEM
// ============================================================

export interface ChildInheritance {
  id: string
  name: string
  age: number
  intelligence: number
  aspect: number
  health: number
  criminal_tendency: number
  personality: PersonalityBigFive
  starting_money: number
  starting_relationships: Relationship[]
  parent_memory: string
}

export interface Legacy {
  player_id: string
  death_date: string
  children: ChildInheritance[]
  assets_transferred: { type: string; value: number }[]
  traits_inherited: { trait: string; value: number }[]
  family_ties: number    // 0-100
  legacy_score: number   // 0-1000
  ribbons_family: string[]
}

// ============================================================
// SAVE GAME
// ============================================================

export interface SaveGame {
  version: string
  save_date: string
  player_id: string
  stats: PlayerStats
  relationships: Relationship[]
  current_event: GameEvent | null
  completed_goals: string[]
  earned_ribbons: string[]
  active_challenges: Challenge[]
  inventory: string[]
  game_over: boolean
  current_job: JobId
  skills: Record<string, number>
  nation: string
  active_packs: PackId[]
  ironMan: boolean
  legacy?: Legacy
}

// ============================================================
// ZUSTAND STORE
// ============================================================

export interface GameStore {
  // Stato
  stats: PlayerStats
  relationships: Relationship[]
  currentEvent: GameEvent | null
  dailyActions: string[]
  completedGoals: string[]
  earnedRibbons: Ribbon[]
  activeChallenges: Challenge[]
  inventory: string[]
  isGameOver: boolean
  activePacks: PackId[]
  currentJob: Job | null
  nation: string
  ironMan: boolean
  legacy: Legacy | null

  // Azioni principali
  handleInvecchia: () => void
  handleChoice: (choiceId: string) => void
  aggiornaStats: (effects: Effect) => void
  resetGiorno: () => void

  // Persistenza
  salvaGioco: () => void
  caricaGioco: () => void

  // Sistemi
  checkGoals: () => void
  checkMorte: () => void
  checkEventRequirements: (event: GameEvent, stats: PlayerStats) => boolean
  applyNazioneEffect: () => void
  checkChallenges: () => void
  applyLegacy: (legacy: Legacy) => void
  updateNPCMemory: (npcId: string, memory: NPCMemory) => void
}
```

-----

-----

## Appendice C — Services Layer (`src/services/`)

I services incapsulano la logica di gioco separandola dallo store Zustand. Ogni service è stateless e riceve i dati come parametri.

### `EventService.ts`

```typescript
import db from '../data/db.json'
import { GameEvent, PlayerStats, Relationship } from '../store/types'

export const EventService = {

  // Filtra tutti gli eventi eligibili per lo stato corrente
  filterValidEvents(stats: PlayerStats, relationships: Relationship[], activePacks: string[]): GameEvent[] {
    return db.events
      .filter(e => activePacks.includes(e.pack_id))
      .filter(e => EventService.evaluateTrigger(e.trigger_condition, stats, relationships))
  },

  // Valuta la stringa trigger_condition → boolean
  evaluateTrigger(condition: string, stats: PlayerStats, _relationships: Relationship[]): boolean {
    return TriggerEngine.evaluate(condition, stats)
  },

  // Seleziona 1 evento random tra quelli eligibili (peso per rarità)
  pickRandom(events: GameEvent[]): GameEvent | null {
    if (events.length === 0) return EventService.getFallbackEvent()
    const idx = Math.floor(Math.random() * events.length)
    return events[idx]
  },

  // Evento di fallback quando nessun trigger è valido
  getFallbackEvent(): GameEvent {
    return {
      id: 'event_fallback',
      pack_id: 'base',
      trigger_condition: 'always',
      text: 'Un anno tranquillo. Nulla di particolare è accaduto.',
      choices: [{ id: 'c_ok', event_id: 'event_fallback', text: 'Avanti', effects: { happiness: -1 } }]
    }
  },

  getById(id: string): GameEvent | undefined {
    return db.events.find(e => e.id === id)
  }
}
```

### `TriggerEngine.ts`

```typescript
import { PlayerStats } from '../store/types'

// DSL supportato per trigger_condition:
// "always"                          → sempre true
// "random_chance 0.1"               → 10% probabilità
// "age >= 18"                       → comparazione numerica
// "age >= 18 && health < 30"        → AND logico
// "job_id == 'doctor'"              → confronto stringa
// "criminal_record > 0 || age > 65" → OR logico
// "health < 30 && age >= 60"        → combinazione

export const TriggerEngine = {

  evaluate(condition: string, stats: PlayerStats): boolean {
    if (!condition || condition === 'always') return true

    // random_chance
    if (condition.startsWith('random_chance')) {
      const prob = parseFloat(condition.split(' ')[1])
      return Math.random() < prob
    }

    // Tokenizza e valuta espressioni composte
    try {
      const sanitized = condition
        .replace(/(\w+)/g, (match) => {
          // Sostituisce nomi stat con il valore numerico/stringa
          if (match in stats) {
            const val = stats[match as keyof PlayerStats]
            return typeof val === 'string' ? `'${val}'` : String(val)
          }
          return match
        })
      // eslint-disable-next-line no-new-func
      return Boolean(new Function(`return ${sanitized}`)())
    } catch {
      console.warn(`TriggerEngine: condizione non valutabile: "${condition}"`)
      return false
    }
  }
}
```

### `GameEngine.ts`

```typescript
import { PlayerStats, Effect } from '../store/types'

// Limiti stat (min/max dal db.json)
const STAT_LIMITS: Record<string, [number, number]> = {
  health: [0, 100], mental_health: [0, 100], happiness: [0, 100],
  intelligence: [0, 200], aspect: [0, 100], energy: [0, 100],
  karma: [-1000, 1000], money: [0, 9_999_999_999],
  debt: [0, 9_999_999_999], credit_score: [300, 850],
  criminal_record: [0, 1000], reputation: [0, 100]
}

export const GameEngine = {

  // Applica effects al PlayerStats corrente
  applyEffects(stats: PlayerStats, effects: Effect): PlayerStats {
    const next = { ...stats }
    for (const [key, delta] of Object.entries(effects)) {
      if (typeof delta === 'number' && key in next) {
        const current = next[key as keyof PlayerStats] as number
        const [min, max] = STAT_LIMITS[key] ?? [-Infinity, Infinity]
        next[key as keyof PlayerStats] = Math.min(max, Math.max(min, current + delta)) as never
      }
    }
    return next
  },

  // Decadimento naturale a fine turno (un anno)
  applyAnnualDecay(stats: PlayerStats): PlayerStats {
    return GameEngine.applyEffects(stats, {
      health:        -(stats.age > 60 ? 2 : 1),
      energy:        -5,
      happiness:     stats.happiness < 40 ? -2 : 0,
      mental_health: stats.mental_health < 30 ? -1 : 0,
      aspect:        stats.age > 30 ? -0.5 : 0,
    })
  },

  // Controlla condizioni di morte
  checkDeath(stats: PlayerStats): { isDead: boolean; cause: string } {
    if (stats.health <= 0)        return { isDead: true, cause: 'natural' }
    if (stats.mental_health <= 5) return { isDead: true, cause: 'suicide' }
    if (stats.age >= 100 && Math.random() < 0.3) return { isDead: true, cause: 'old_age' }
    return { isDead: false, cause: '' }
  },

  // Calcola salario netto dopo tasse
  applyNationTaxes(grossSalary: number, taxRate: number): number {
    return Math.floor(grossSalary * (1 - taxRate))
  }
}
```

### `NationService.ts`

```typescript
import db from '../data/db.json'

export const NationService = {

  getById(id: string) {
    return db.nations.find(n => n.id === id)
  },

  getTaxRate(nationId: string): number {
    return NationService.getById(nationId)?.tax_rate ?? 0.25
  },

  getCostOfLiving(nationId: string): number {
    return NationService.getById(nationId)?.cost_of_living ?? 1200
  },

  getHealthcareModifier(nationId: string): number {
    // Restituisce il costo sanità come frazione del salario
    return NationService.getById(nationId)?.healthcare_cost ?? 0.05
  },

  isLegalAction(nationId: string, action: string): boolean {
    const nation = NationService.getById(nationId)
    if (!nation) return false
    const legalMap: Record<string, boolean> = {
      abortion:  nation.legal_abortion,
      gay:       nation.legal_gay,
      cannabis:  nation.legal_drug,
      guns:      (nation as any).legal_guns ?? false,
    }
    return legalMap[action] ?? true
  }
}
```

### `SaveService.ts`

```typescript
import { SaveGame } from '../store/types'

const SAVE_KEY = 'lifeSim2D_save_v2'
const MAX_SAVE_SIZE_BYTES = 500_000  // 500KB hard limit

export const SaveService = {

  save(state: SaveGame): void {
    try {
      const json = JSON.stringify(state)
      if (json.length > MAX_SAVE_SIZE_BYTES) {
        // Pruning: rimuovi le memorie NPC più vecchie
        const pruned = SaveService.pruneOldMemories(state)
        localStorage.setItem(SAVE_KEY, JSON.stringify(pruned))
      } else {
        localStorage.setItem(SAVE_KEY, json)
      }
    } catch (e) {
      console.error('SaveService: impossibile salvare', e)
    }
  },

  load(): SaveGame | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as SaveGame
    } catch {
      return null
    }
  },

  exportJSON(state: SaveGame): void {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lifesim2d_save_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  importJSON(file: File): Promise<SaveGame> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try { resolve(JSON.parse(e.target!.result as string)) }
        catch  { reject(new Error('File non valido')) }
      }
      reader.readAsText(file)
    })
  },

  // Rimuove memorie NPC con importance < 3 e più vecchie di 20 anni
  pruneOldMemories(state: SaveGame): SaveGame {
    const pruned = { ...state }
    pruned.relationships = state.relationships.map(rel => ({
      ...rel,
      memories: rel.memories.filter(m =>
        m.importance >= 3 || m.unforgettable ||
        (state.stats.age - parseInt(m.date)) < 20
      )
    }))
    return pruned
  }
}
```

-----

## Appendice D — Event Trigger Engine (DSL completo)

### Grammatica supportata

```
trigger_condition ::= "always"
                    | "random_chance" FLOAT
                    | expr

expr ::= term (("&&" | "||") term)*
term ::= stat_key OP value
       | "!" stat_key

stat_key ::= "age" | "health" | "mental_health" | "happiness"
           | "intelligence" | "aspect" | "energy" | "karma"
           | "money" | "criminal_record" | "reputation"
           | "job_id" | "nationality" | "credit_score"

OP    ::= "==" | "!=" | ">" | "<" | ">=" | "<="
value ::= NUMBER | STRING_LITERAL | BOOLEAN
```

### Esempi trigger completi

```json
"trigger_condition": "always"
"trigger_condition": "random_chance 0.05"
"trigger_condition": "age >= 18"
"trigger_condition": "age >= 18 && criminal_record == 0"
"trigger_condition": "job_id == 'doctor' && age >= 30"
"trigger_condition": "health < 20 || mental_health < 20"
"trigger_condition": "money >= 1000000 && age < 40"
"trigger_condition": "criminal_record > 0 && reputation < 30"
"trigger_condition": "age >= 65 && health < 50 && money < 10000"
```

### Fallback quando nessun evento è eligibile

Se `filterValidEvents()` restituisce un array vuoto (nessun trigger valido), il motore usa automaticamente `event_fallback`. Se il player ha accumulato molti vincoli (fedina sporca + salute bassa + età avanzata), vengono iniettati 2-3 eventi “crisi” dedicati a quella combinazione, pre-definiti in db.json con trigger combinati.

-----

## Appendice E — gameStore.ts: Implementazione Core Actions

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GameStore, SaveGame } from './types'
import { EventService } from '../services/EventService'
import { GameEngine } from '../services/GameEngine'
import { NationService } from '../services/NationService'
import { SaveService } from '../services/SaveService'

const INITIAL_STATS = {
  health: 75, mental_health: 70, happiness: 65, intelligence: 100,
  aspect: 50, energy: 80, karma: 0, age: 0, money: 0, debt: 0,
  credit_score: 650, criminal_record: 0, reputation: 50
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      stats: { ...INITIAL_STATS },
      relationships: [],
      currentEvent: null,
      dailyActions: [],
      completedGoals: [],
      earnedRibbons: [],
      activeChallenges: [],
      inventory: [],
      isGameOver: false,
      activePacks: ['base'],
      currentJob: null,
      nation: 'italy',
      ironMan: false,
      legacy: null,

      // ─────────────────────────────────────
      // AZIONE PRINCIPALE: INVECCHIA +1 ANNO
      // ─────────────────────────────────────
      handleInvecchia: () => {
        const { stats, relationships, activePacks, nation, currentJob } = get()

        // 1. Incrementa età
        let next = { ...stats, age: stats.age + 1 }

        // 2. Applica salario (netto dopo tasse)
        if (currentJob) {
          const taxRate = NationService.getTaxRate(nation)
          const netSalary = GameEngine.applyNationTaxes(currentJob.salary_monthly * 12, taxRate)
          next = GameEngine.applyEffects(next, { money: netSalary })
        }

        // 3. Sottrai costo della vita annuale
        const costOfLiving = NationService.getCostOfLiving(nation) * 12
        next = GameEngine.applyEffects(next, { money: -costOfLiving })

        // 4. Applica decadimento naturale
        next = GameEngine.applyAnnualDecay(next)

        // 5. Applica debito (interessi 8%)
        if (next.debt > 0) {
          const interest = Math.floor(next.debt * 0.08)
          next = GameEngine.applyEffects(next, { money: -interest })
        }

        // 6. Seleziona evento casuale
        const validEvents = EventService.filterValidEvents(next, relationships, activePacks)
        const event = EventService.pickRandom(validEvents)

        set({ stats: next, currentEvent: event, dailyActions: [] })

        // 7. Controlla morte e goals
        get().checkMorte()
        get().checkGoals()
        get().checkChallenges()
      },

      // ─────────────────────────────────────
      // APPLICA SCELTA DEL PLAYER
      // ─────────────────────────────────────
      handleChoice: (choiceId: string) => {
        const { currentEvent, stats } = get()
        if (!currentEvent) return

        const choice = currentEvent.choices.find(c => c.id === choiceId)
        if (!choice) return

        // Verifica requirements (soldi sufficienti, età, ecc.)
        if (choice.requirements) {
          if (choice.requirements.money_min && stats.money < choice.requirements.money_min) {
            // Feedback: "Soldi insufficienti"
            return
          }
        }

        const next = GameEngine.applyEffects(stats, choice.effects)
        set({ stats: next, currentEvent: null })

        get().checkMorte()
        get().checkGoals()
        get().salvaGioco()
      },

      // ─────────────────────────────────────
      // APPLICA EFFETTI ARBITRARI
      // ─────────────────────────────────────
      aggiornaStats: (effects) => {
        const next = GameEngine.applyEffects(get().stats, effects)
        set({ stats: next })
      },

      // ─────────────────────────────────────
      // CHECK MORTE
      // ─────────────────────────────────────
      checkMorte: () => {
        const { isDead, cause } = GameEngine.checkDeath(get().stats)
        if (isDead) {
          set({ isGameOver: true, currentEvent: {
            id: 'death_' + cause,
            pack_id: 'base',
            trigger_condition: 'always',
            text: `Sei morto. Causa: ${cause}.`,
            choices: []
          }})
        }
      },

      // ─────────────────────────────────────
      // CHECK GOALS
      // ─────────────────────────────────────
      checkGoals: () => {
        // Implementazione: itera db.goals, valuta condition, aggiorna completedGoals
        // (usa TriggerEngine.evaluate() con stats correnti)
      },

      checkChallenges: () => {
        // Itera activeChallenges, valuta conditions, marca completed
      },

      checkEventRequirements: (event, stats) => {
        return TriggerEngine.evaluate(event.trigger_condition, stats)
      },

      applyNazioneEffect: () => {
        // Applicato già in handleInvecchia via NationService
      },

      updateNPCMemory: (npcId, memory) => {
        set(state => ({
          relationships: state.relationships.map(rel =>
            rel.npc_id === npcId
              ? { ...rel, memories: [...rel.memories, memory].slice(-200) } // cap 200 memorie
              : rel
          )
        }))
      },

      applyLegacy: (legacy) => {
        set(state => ({
          stats: GameEngine.applyEffects(state.stats, {
            money: legacy.assets_transferred
              .filter(a => a.type === 'money')
              .reduce((sum, a) => sum + a.value, 0)
          }),
          legacy
        }))
      },

      resetGiorno: () => set({ dailyActions: [], currentEvent: null }),

      salvaGioco: () => SaveService.save(get() as unknown as SaveGame),

      caricaGioco: () => {
        const saved = SaveService.load()
        if (saved) set(saved as any)
      }
    }),
    { name: 'lifeSim2D-store', partialize: (s) => s }
  )
)
```

-----

## Appendice F — Monetizzazione e In-App Purchases

### Modello di Revenue

|Canale             |Piattaforma|Strumento          |Margine                      |
|-------------------|-----------|-------------------|-----------------------------|
|Pack acquisto unico|Web        |Stripe Checkout    |~97% (3% commissione Stripe) |
|Pack acquisto unico|iOS        |Apple IAP          |~85% (15% commissione Apple) |
|Pack acquisto unico|Android    |Google Play Billing|~85% (15% commissione Google)|
|Premium challenge  |Tutti      |Stesso sistema     |Stesso margine               |
|Supporto volontario|Web        |Stripe Tip Jar     |~97%                         |

### Prezzi consigliati

|Pack                 |Web (Stripe)|iOS/Android (IAP)|
|---------------------|------------|-----------------|
|Mafia Pack           |€9.99       |€9.99            |
|Actor Pack           |€11.99      |€11.99           |
|Medical Pack         |€9.99       |€9.99            |
|Sports Pack          |€9.99       |€9.99            |
|Special Pack         |€14.99      |€14.99           |
|Bundle (tutti i pack)|€39.99      |€39.99           |

### Implementazione Web (Stripe)

```typescript
// src/services/PurchaseService.ts
export const PurchaseService = {

  async purchasePack(packId: string): Promise<void> {
    // 1. Chiama il tuo backend (o Vercel Edge Function) per creare session Stripe
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId })
    })
    const { url } = await res.json()
    // 2. Redirect a Stripe Checkout
    window.location.href = url
  },

  // Vercel Edge Function: /api/create-checkout-session.ts
  // import Stripe from 'stripe'
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const session = await stripe.checkout.sessions.create({...})
  // return Response.json({ url: session.url })
}
```

### Implementazione Mobile (Capacitor + RevenueCat)

```bash
# RevenueCat gestisce Apple IAP + Google Play Billing con un'unica API
npm install @revenuecat/purchases-capacitor
```

```typescript
import { Purchases } from '@revenuecat/purchases-capacitor'

await Purchases.configure({ apiKey: 'YOUR_REVENUECAT_KEY' })

// Acquisto pack
const { customerInfo } = await Purchases.purchasePackage({ aPackage: selectedPackage })
if (customerInfo.entitlements.active['mafia_pack']) {
  // Attiva pack nel save
  useGameStore.getState().activePacks.push('pack_mafia_001')
}
```

**Note importanti:**

- Apple e Google richiedono che gli acquisti in-app usino il loro sistema (non Stripe) su mobile
- RevenueCat (gratuito fino a $2500 MRR) sincronizza acquisti cross-platform
- Il server deve verificare la receipt prima di attivare il pack (anti-cheat)

-----

## Appendice G — i18n e Localizzazione

### Setup react-i18next

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

```typescript
// src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import it from './locales/it.json'
import en from './locales/en.json'
import es from './locales/es.json'
import pt from './locales/pt.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: { it: { translation: it }, en: { translation: en }, es: { translation: es }, pt: { translation: pt } },
    interpolation: { escapeValue: false }
  })

export default i18n
```

### Struttura chiavi (`src/i18n/locales/it.json`)

```json
{
  "ui": {
    "age_button": "INVECCHIA +1 ANNO",
    "stats": {
      "health": "Salute",
      "mental_health": "Salute Mentale",
      "happiness": "Felicità",
      "intelligence": "Intelligenza",
      "aspect": "Aspetto",
      "energy": "Energia",
      "karma": "Karma",
      "money": "Soldi"
    },
    "screens": {
      "career": "Carriera",
      "relationships": "Relazioni",
      "goals": "Goals",
      "nation": "Nazione",
      "finance": "Finanza"
    }
  },
  "events": {
    "event_random_001": {
      "text": "Hai trovato €50 sul pavimento.",
      "choices": {
        "choice_001": "Prendi",
        "choice_002": "Metti da parte per il proprietario"
      }
    }
  },
  "game_over": {
    "title": "Vita Conclusa",
    "age_lived": "Hai vissuto {{age}} anni",
    "play_again": "Gioca di nuovo",
    "legacy": "Continua come figlio"
  },
  "errors": {
    "not_enough_money": "Soldi insufficienti",
    "requirement_not_met": "Requisiti non soddisfatti",
    "no_events": "Anno tranquillo, niente di speciale"
  }
}
```

**Lingue prioritarie (per mercato life-sim):**

1. Italiano (lingua di sviluppo)
1. Inglese (mercato principale)
1. Spagnolo (80M+ speaker)
1. Portoghese brasiliano (BitLife molto popolare in Brasile)

Tutti i testi degli eventi in db.json diventano chiavi i18n (`events.{event_id}.text`). Il testo del db è solo il fallback italiano.

-----

## Appendice H — Supabase Migration Plan

### Quando migrare

Migrare da localStorage a Supabase quando:

- La base utenti supera 1000 player attivi
- Si vuole aggiungere leaderboard globali reali
- Si abilita il sistema challenge con server-side validation
- Si vuole cross-device sync (salvataggio su più dispositivi)

### Schema SQL (PostgreSQL/Supabase)

```sql
-- Utenti
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salvataggi
CREATE TABLE saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  save_data JSONB NOT NULL,           -- tutto il SaveGame serializzato
  save_version TEXT NOT NULL,         -- "2.0" per migration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)                     -- 1 save per user (espandibile a slot multipli)
);

-- Leaderboard
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  score INTEGER NOT NULL,
  category TEXT NOT NULL,             -- "longevity" | "wealth" | "happiness" | "karma"
  age_reached INTEGER,
  ribbons_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge completate (server-validated)
CREATE TABLE challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  challenge_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  save_snapshot JSONB                 -- snapshot del save al momento del completamento
);

-- Pack acquistati
CREATE TABLE user_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  pack_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_session_id TEXT,
  UNIQUE(user_id, pack_id)
);
```

### Modifiche al codice per migrazione

```typescript
// SaveService.ts — versione Supabase
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

export const SaveService = {
  async save(state: SaveGame, userId: string): Promise<void> {
    await supabase.from('saves').upsert({
      user_id: userId,
      save_data: state,
      save_version: '2.0',
      updated_at: new Date().toISOString()
    })
  },
  async load(userId: string): Promise<SaveGame | null> {
    const { data } = await supabase.from('saves').select('save_data').eq('user_id', userId).single()
    return data?.save_data ?? null
  }
}
```

-----

## Appendice I — Character Creation & New Game Flow

### Schermata 1: Benvenuto

```
┌─────────────────────────────────┐
│  🌍 LIFE SIMULATOR 2D           │
│                                 │
│  La tua storia inizia adesso.   │
│                                 │
│  [NUOVA PARTITA]                │
│  [CARICA PARTITA]               │
│  [CONTINUA COME FIGLIO]         │
│  [Impostazioni]                 │
└─────────────────────────────────┘
```

### Schermata 2: Identità

```
Campo 1: Nome  →  [Input testo, max 20 char]
Campo 2: Cognome → [Input testo, max 20 char]
Campo 3: Genere → [♂ Maschio] [♀ Femmina] [⚧ Altro]
Campo 4: Anno di nascita → [Slider 1950–2020]
```

### Schermata 3: Nazione di Nascita

```
Griglia di 50+ nazioni con bandiera emoji
Ordinamento: continente → alfabetico
Ricerca: [input "cerca nazione..."]
Effetti mostrati: Salario medio | Costo vita | Aspettativa vita
```

### Schermata 4: Background Familiare

```
[💰 Famiglia Ricca]        [🏠 Famiglia Media]        [🍞 Famiglia Povera]
Soldi iniziali: €50K       Soldi iniziali: €0          Soldi iniziali: -€5K
Intelligenza: +10           Intelligenza: base          Intelligenza: -5
Relazioni fam: +20          Relazioni fam: base         Relazioni fam: -10
Accesso istruzione: Alto    Accesso istruzione: Medio   Accesso istruzione: Basso
```

### Schermata 5: Riepilogo e Conferma

```
Mostra: Nome, Genere, Anno nascita, Nazione, Background
Statistiche iniziali calcolate con barre colorate
[INIZIA LA TUA VITA →]
```

-----

## Appendice J — Onboarding & Tutorial System

### Prima partita: Tutorial overlay (5 turni guidati)

**Turno 1 (Age 0):**

- Overlay: “Benvenuto! Sei appena nato. Clicca INVECCHIA per avanzare di un anno.”
- Freccia animata → bottone INVECCHIA

**Turno 2 (Age 1):**

- Overlay: “Il tuo primo evento! Scegli una risposta. Ogni scelta cambia le tue statistiche.”
- Highlight sull’EventDisplay

**Turno 3 (Age 5):**

- Overlay: “Guarda le tue statistiche in alto. Tienile alte per vivere a lungo.”
- Highlight sull’HUD con spiegazione di ogni stat

**Turno 4 (Age 10):**

- Overlay: “Esplora i menu in basso: Carriera, Relazioni, Finanza, Goals.”
- Highlight su BottomTabs

**Turno 5 (Age 15):**

- Overlay: “Tutorial completato! La tua vita è nelle tue mani.”
- [Ho capito, inizia!]

### Tooltip contestuali (sempre attivi)

```typescript
// Appaiono solo alla prima occorrenza di ogni meccanica
const CONTEXTUAL_TIPS: Record<string, string> = {
  first_job:          "Hai trovato lavoro! Lo stipendio arriva ogni anno con INVECCHIA.",
  first_relationship: "Hai una relazione! La fiducia si costruisce nel tempo.",
  first_crime:        "Attento! La fedina penale influenza lavoro e reputazione.",
  first_death_risk:   "La salute è critica! Visita il medico prima che sia troppo tardi.",
  first_million:      "Sei milionario! Considera di investire per proteggerti.",
}
```

-----

## Appendice K — Audio & Sound Design

### Struttura Audio

```
src/assets/audio/
├── music/
│   ├── menu_theme.mp3        # Menu principale (ambient, calmo)
│   ├── life_young.mp3        # 0-25 anni (energico)
│   ├── life_adult.mp3        # 26-60 anni (medio)
│   ├── life_old.mp3          # 61+ anni (malinconico)
│   └── game_over.mp3         # Fine vita (cinematico)
│
└── sfx/
    ├── age_button.wav         # Click INVECCHIA (whoosh)
    ├── choice_select.wav      # Selezione scelta (click soft)
    ├── stat_up.wav            # Stat aumenta (+)
    ├── stat_down.wav          # Stat diminuisce (-)
    ├── achievement.wav        # Ribbon sbloccato (fanfare)
    ├── money_gain.wav         # Guadagno soldi (coin)
    ├── money_loss.wav         # Perdita soldi (negative)
    ├── death.wav              # Game over (dark chord)
    ├── relationship_new.wav   # Nuova relazione (warm chime)
    └── event_alert.wav        # Evento importante (bell)
```

### Implementazione

```typescript
// src/services/AudioService.ts
export const AudioService = {
  context: new (window.AudioContext || (window as any).webkitAudioContext)(),
  muted: false,

  play(soundId: string, volume = 0.7): void {
    if (this.muted) return
    const audio = new Audio(`/audio/sfx/${soundId}.wav`)
    audio.volume = volume
    audio.play().catch(() => {}) // Ignora autoplay policy
  },

  playMusic(trackId: string, loop = true): void {
    // Usa Howler.js per gestione music + crossfade
  }
}
```

**Libreria consigliata:** `howler.js` (2KB, gestisce tutti i formati, loop, fade)

```bash
npm install howler
npm install -D @types/howler
```

-----

## Appendice L — Error Handling & Edge Cases

### Casi limite e gestione

|Scenario                                   |Comportamento atteso                                                       |
|-------------------------------------------|---------------------------------------------------------------------------|
|`money < costo_azione`                     |Choice disabilitata + tooltip “Soldi insufficienti (€X mancanti)”          |
|Nessun evento eligibile                    |`event_fallback` + log “Anno tranquillo”                                   |
|Tutti i requisiti bloccano tutte le choices|Inietta choice “Lascia perdere” con effects `{}`                           |
|`health = 0` durante handleInvecchia       |Blocca il turno → mostra death event immediato                             |
|Save corrotto/null                         |Mostra “Salvataggio non trovato” → New Game                                |
|Pack non attivo ma evento ha pack_id       |Evento silenziosamente filtrato, mai mostrato                              |
|NPC morto tenta di dare memoria            |Ignora updateNPCMemory per NPC con `is_dead: true`                         |
|Età > 120                                  |Hard cap: triggera morte naturale forzata                                  |
|Debito > 10x assets totali                 |Evento “Bancarotta imminente” iniettato obbligatoriamente                  |
|IronMan + tentativo reload                 |Intercetta `beforeunload`, mostra warning “Non puoi ricaricare in Hardcore”|

### Guards nel codice

```typescript
// In handleChoice — guard money
if (choice.requirements?.money_min && stats.money < choice.requirements.money_min) {
  useToastStore.getState().show('error', t('errors.not_enough_money'))
  return
}

// In handleInvecchia — hard age cap
if (stats.age >= 120) {
  set({ isGameOver: true })
  return
}

// Guard per salvataggio troppo grande
if (JSON.stringify(state).length > 500_000) {
  SaveService.pruneOldMemories(state)
}
```

-----

## Appendice M — Performance Budget & Memory Management

### Limiti hard

|Risorsa                       |Limite|Azione se superato                                             |
|------------------------------|------|---------------------------------------------------------------|
|Memorie NPC per relazione     |200   |Pruning: rimuovi le più vecchie con importance < 3             |
|Relazioni totali              |100   |Non aggiungere nuove relazioni: mostra “Rete sociale al limite”|
|Dimensione save (localStorage)|500KB |Pruning automatico + avviso al player                          |
|Events pool caricati          |500   |Carica solo eventi del pack attivo                             |
|NPC attivi in memoria         |50    |NPC non interagiti da 10+ anni vanno in “background”           |
|Dimensione db.json            |2MB   |Suddividi in chunks se necessario (lazy load pack)             |

### Strategia React performance

```typescript
// Componenti costosi con memo
const HUD = React.memo(({ stats }) => ...)
const RelationshipCard = React.memo(({ rel }) => ...)

// Selector granulari (evita re-render inutili)
const health = useGameStore(s => s.stats.health)         // ✅ solo health
const stats  = useGameStore(s => s.stats)                 // ⚠️ ricalcola per ogni cambio

// Heavy compute con useMemo
const eligibleEvents = useMemo(
  () => EventService.filterValidEvents(stats, relationships, activePacks),
  [stats.age, stats.health, stats.job_id] // deps minime
)
```

-----

## Appendice N — Esperienza 0-18 Anni (Childhood Events)

### Fasi infanzia con eventi dedicati

**0-2 anni — Neonato/Toddler**

```
Events: primo sorriso, prime parole, primo passo, malattia infantile
Choices: poche (narrate dai genitori)
Meccaniche: bonding con genitori, salute base, intelligenza iniziale
```

**3-5 anni — Età prescolare**

```
Events: scuola dell'infanzia, primo amico, litigio fratello
Choices: semplici (2 opzioni)
Meccaniche: intelligenza +1-2/anno, happiness influenzata da famiglia
```

**6-11 anni — Scuola elementare/media**

```
Events: primo voto, bully, migliore amico, sport scolastico, gita scolastica
Choices: 2-3 opzioni, conseguenze moderate
Meccaniche: intelligence +2-3/anno, prime skill hobby, relazioni compagni
```

**12-15 anni — Adolescenza precoce**

```
Events: pubertà, prima cotta, primo telefonino, ribellione leggera
Choices: 3 opzioni, prime scelte con conseguenze reali
Meccaniche: aspetto +/-, prime dipendenze possibili (gaming, social media)
```

**16-17 anni — Pre-adulto**

```
Events: patente A1, primo lavoro part-time, prom, prima sigaretta/alcol possibile
Choices: 3-4 opzioni, conseguenze significative
Meccaniche: sblocco prime carriere base, relazioni romantiche, possibile gravidanza
```

**18 anni — Maggiore età**

```
Event speciale: "Hai compiuto 18 anni. Cosa fai?"
Choices: università / lavoro / militare / anno sabbatico / criminale
Meccaniche: sblocco TUTTE le meccaniche adulte, lasciare casa
```

### Age gates nel codice

```typescript
// Events filtrati per età
const AGE_GATES: Record<string, [number, number]> = {
  'events_infant':    [0, 5],
  'events_child':     [6, 11],
  'events_teen':      [12, 17],
  'events_adult':     [18, 64],
  'events_senior':    [65, 120],
  'events_criminal':  [16, 120],    // no crimini sotto i 16
  'events_sexual':    [18, 120],    // no contenuto sessuale sotto i 18
  'events_gambling':  [18, 120],    // no gioco d'azzardo sotto i 18
}
```

-----

## Appendice O — Content Rating & Age Gate

### Classificazioni di contenuto

|Sistema              |Rating    |Motivo                                 |
|---------------------|----------|---------------------------------------|
|**PEGI** (Europa)    |PEGI 18   |Violenza, sesso, droghe, crimini       |
|**ESRB** (USA/Canada)|Mature 17+|Same reasons                           |
|**App Store**        |17+       |Apple richiede 17+ per contenuti simili|
|**Play Store**       |Mature 17+|Google Play policy                     |

### Age Gate — Prima apertura

```typescript
// src/components/AgeGate.tsx
export const AgeGate = () => {
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed || localStorage.getItem('age_confirmed')) return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Verifica età</h1>
      <p className="text-gray-300 text-center mb-8">
        Life Simulator 2D contiene contenuti per adulti (violenza, temi maturi, linguaggio esplicito).
        Conferma di avere almeno 18 anni per continuare.
      </p>
      <button onClick={() => {
        localStorage.setItem('age_confirmed', 'true')
        setConfirmed(true)
      }} className="bg-white text-black px-8 py-3 rounded-lg font-bold">
        Ho 18+ anni, entra
      </button>
      <button onClick={() => window.location.href = 'https://www.google.com'}
        className="mt-4 text-gray-500 text-sm">
        Non ho 18 anni, esci
      </button>
    </div>
  )
}
```

### Privacy Policy (obbligatoria per App Store)

Obbligatoria per Apple App Store. Usa `iubenda.com` o `privacypolicygenerator.info` per generarla gratis. Deve coprire:

- Dati raccolti (salvataggio locale, analytics anonimi)
- Dati condivisi con terze parti (Stripe se presente, RevenueCat)
- Diritti dell’utente (cancellazione dati)
- Contatto per richieste privacy

-----

## Appendice P — Deployment Web (Vercel + PWA)

### Setup rapido (15 minuti)

```bash
# 1. Installa PWA plugin
npm install -D vite-plugin-pwa

# 2. vercel.json
echo '{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}' > vercel.json

# 3. Build e deploy
npm run build
npx vercel --prod
```

**`vite.config.ts` con PWA:**

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Life Simulator 2D',
        short_name: 'LifeSim2D',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'] }
    })
  ]
})
```

**Deploy automatico:** ogni `git push main` → Vercel rebuilda e pubblica in ~40 secondi.

**Installazione PWA:**

- Android (Chrome): Menu → “Aggiungi alla schermata home”
- iOS (Safari): Condividi → “Aggiungi alla schermata Home”

**Performance attese:** FCP < 1s, TTI < 2s, bundle ~200KB, PWA Lighthouse score > 90.

-----

## Appendice Q — Deployment Mobile (iOS/Android con Capacitor 6)

### Setup (10 minuti)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/splash-screen @capacitor/haptics
npx cap init LifeSim2D com.lifesim2d.app
npx cap add ios
npx cap add android
```

**`capacitor.config.json`:**

```json
{
  "appId": "com.lifesim2d.app",
  "appName": "Life Simulator 2D",
  "webDir": "dist",
  "server": { "androidScheme": "https" },
  "plugins": {
    "SplashScreen": { "launchAutoHide": true, "splashFullScreen": true },
    "StatusBar": { "style": "DARK" }
  }
}
```

**Workflow di sviluppo:**

```bash
npm run build && npx cap sync   # Dopo ogni modifica
npx cap open ios                # Apre Xcode
npx cap open android            # Apre Android Studio
npx cap run android --livereload  # Test con hot reload
```

### Pubblicazione

|Store                |Costo         |Tempo review|Note                        |
|---------------------|--------------|------------|----------------------------|
|Google Play          |$25 una tantum|1-3 giorni  |AAB signed da Android Studio|
|Apple App Store      |$99/anno      |3-7 giorni  |IPA signed da Xcode Archive |
|TestFlight (beta iOS)|Incluso in $99|~24h        |Max 100 tester gratis       |
|APK diretto (Android)|Gratis        |Immediato   |Condividi file, niente store|

**Haptic feedback (mobile):**

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics'
// Nel handleChoice:
await Haptics.impact({ style: ImpactStyle.Medium })
```

-----

## Appendice R — Struttura Cartelle Progetto

```
life-sim-2d/
├── public/
│   ├── db.json                  # Database completo
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── apple-touch-icon.png
│
├── src/
│   ├── data/
│   │   └── db.json              # Mirror (import TypeScript)
│   │
│   ├── store/
│   │   ├── types.ts             # Tutte le interfacce TypeScript
│   │   └── gameStore.ts         # Zustand store completo
│   │
│   ├── services/
│   │   ├── EventService.ts
│   │   ├── TriggerEngine.ts
│   │   ├── GameEngine.ts
│   │   ├── NationService.ts
│   │   ├── SaveService.ts
│   │   ├── AudioService.ts
│   │   └── PurchaseService.ts
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── HUD.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── EmojiAvatar.tsx
│   │   │   └── Button.tsx
│   │   ├── game/
│   │   │   ├── EventDisplay.tsx
│   │   │   ├── ChoiceButtons.tsx
│   │   │   ├── EventLog.tsx
│   │   │   └── AgeButton.tsx
│   │   ├── screens/
│   │   │   ├── CharacterCreation.tsx
│   │   │   ├── CareerScreen.tsx
│   │   │   ├── RelationshipScreen.tsx
│   │   │   ├── GoalsScreen.tsx
│   │   │   ├── NationScreen.tsx
│   │   │   └── FinanceScreen.tsx
│   │   ├── navigation/
│   │   │   └── BottomTabs.tsx
│   │   └── feedback/
│   │       ├── Toast.tsx
│   │       ├── StatChange.tsx
│   │       ├── AgeGate.tsx
│   │       └── Modal.tsx
│   │
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── it.json
│   │       ├── en.json
│   │       ├── es.json
│   │       └── pt.json
│   │
│   ├── hooks/
│   │   ├── useGameLoop.ts
│   │   └── useTutorial.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── ios/                         # Generato da Capacitor
├── android/                     # Generato da Capacitor
├── vercel.json
├── capacitor.config.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

-----

## Obiettivo Finale

Costruire un life simulator 2D più profondo, più leggibile, più modulare e più strategico di BitLife.

Il gioco deve eccellere in:

- **Profondità relazionale:** NPC con memoria, vita propria e relazioni tra loro
- **Bilanciamento credibile:** ogni azione ha costo e limite realistico
- **Progressione non lineare:** infinite combinazioni di percorsi di vita
- **Accessibilità mobile:** UI ottimizzata per touch, sessioni brevi o lunghe
- **Coerenza narrativa:** ogni evento si sente plausibile nel contesto del personaggio
- **Espandibilità tecnica:** architettura modulare pronta per job packs, nuove nazioni, nuove lingue e migrazione a Supabase senza refactoring del core

**Il gioco non compete con BitLife per quantità di feature, ma per qualità delle conseguenze di ogni scelta.**



# 🚀 ESTENSIONE GDD — HUMANITY SYSTEM + MONETIZATION + LIVEOPS

## 🎭 Humanity Systems (Da "Stat Simulator" a "Esseri Umani")

### 1. FamilyEngine
- Generazione automatica genitori all'avvio partita
- Possibilità fratelli/sorelle
- Albero genealogico persistente
- Parentela ereditabile per eventi futuri
- Eredità, conflitti familiari, favoritismi

### 2. TraitSystem
Ogni NPC possiede 2-3 traits persistenti.

Esempi:
- Introverso
- Ambizioso
- Geloso
- Generoso
- Sensibile
- Sicuro
- Avido
- Leale

Effetti:
- Reazioni diverse agli eventi
- Modifica comportamento sociale
- Influenza relazioni e carriera
- Influenza rischio tradimenti/divorzi

### 3. ReactionEngine
Sistema di feedback narrativo immediato.

Esempi:
- Complimento → reazione emotiva diversa in base ai trait
- Critica → rabbia, tristezza, motivazione
- Tradimento → perdita fiducia persistente

Obiettivo:
- Far sentire gli NPC vivi
- Dare feedback immediato al player
- Evitare gameplay puramente numerico

### 4. MemoryLog
Gli NPC ricordano eventi passati.

Caratteristiche:
- Ultimi 5 eventi importanti
- Decadimento memoria nel tempo
- Eventi traumatici permanenti
- Memorie influenzano dialoghi e scelte future

Esempi:
- Ricorda un tradimento
- Ricorda un regalo importante
- Ricorda abbandono o supporto emotivo

### 5. ChainReactions
Effetti a catena persistenti nel tempo.

Esempi:
- Insulto → trust decay progressivo
- Supporto emotivo → amore aumenta lentamente
- Tradimento → gelosia futura
- Aiuto economico → gratitudine persistente

---

# 💰 Monetization System

## Filosofia Monetizzazione
Monetizzazione etica:
- Nessun pay-to-win aggressivo
- Gameplay principale sempre giocabile gratis
- Ads opzionali e reward controllati
- Focus su retention e cosmetics

---

## 📺 Rewarded Ads System

### Rewarded Ads Engine
L'utente può guardare ads volontariamente per ottenere ricompense leggere.

Premi possibili:
- Soldi bonus
- Energia bonus
- Skip cooldown
- Reroll eventi
- Lucky spin
- Boost temporanei
- Premium currency limitata

### Regole Anti-Abuso
- Max ads giornaliere
- Cooldown ads
- Reward diminishing returns
- Tracking exploit prevention

### AdService
Supporto:
- AdMob
- Unity Ads
- AppLovin

Eventi:
- ad_started
- ad_completed
- ad_failed
- reward_granted

Fallback:
- Web version senza ads invasive
- Graceful fallback se ads unavailable

---

## 💎 Soft Currency System

Nuova valuta:
- life_tokens

Utilizzo:
- Reroll eventi
- Personalizzazione avatar
- Cosmetics
- Retry challenge
- Boost sociali temporanei

Obiettivo:
Separare economia gameplay dalla monetizzazione reale.

---

## 🛍️ Premium Shop

Contenuti acquistabili:
- Cosmetic packs
- UI themes
- Background speciali
- Story packs
- Career packs
- Historical scenarios
- Celebrity scenarios

NO:
- Stat boost permanenti pay-to-win

---

## 🔄 Restore Purchases
Funzionalità obbligatoria:
- Ripristino acquisti cross-platform
- Sync account
- Sync entitlement
- Gestione offline temporanea

---

## 🎁 Daily Rewards & Streak

Sistema retention:
- Login giornaliero
- Reward progressivi
- Streak bonus
- Calendario premi
- Premium reward opzionale via ads

Possibile:
- Streak saver tramite rewarded ad

---

# 🌍 LiveOps System

## Eventi Settimanali
Esempi:
- Fashion Week
- Election Season
- Economic Crisis
- Zombie Meme Event
- Celebrity Drama

Reward:
- Cosmetics esclusivi
- Badge
- Titoli

---

## Seasonal Challenges
Challenge limitate:
- Sopravvivi senza lavoro
- Diventa milionario entro 30 anni
- Famiglia perfetta
- Criminal mastermind

---

## Remote Config
Configurazioni modificabili server-side:
- Frequenza eventi
- Reward balancing
- Economy tuning
- Drop rates
- Event activation

Obiettivo:
Bilanciare gioco senza update store.

---

# 🧠 Emotional AI Layer

## Emotional State System

Ogni NPC possiede mood temporaneo:
- Felice
- Depresso
- Geloso
- Arrabbiato
- Nostalgico
- Ansioso
- Motivato

Effetti:
- Dialoghi dinamici
- Decisioni differenti
- Maggiore imprevedibilità

---

## AI Narrative Director

Sistema regista invisibile:
- Analizza vita player
- Analizza trauma
- Analizza relazioni
- Genera eventi coerenti

Esempio:
- Player tradisce partner → aumenta probabilità drammi relazionali
- Player povero → eventi economici più frequenti

---

# 💬 Dynamic Dialogue System

Dialoghi influenzati da:
- Traits
- Memorie
- Mood
- Relazione corrente
- Eventi recenti

Esempi:
- NPC ricorda insulto di anni prima
- Partner cita vecchi tradimenti
- Genitore ricorda aiuti ricevuti

---

# ⚰️ Trauma & Grief System

Eventi traumatici:
- Lutto
- Divorzio
- Tradimento
- Bancarotta
- Malattia

Effetti:
- Debuff mentali persistenti
- Nuove paure
- Cambiamenti personalità
- Trigger emotivi

Possibile terapia:
- Psicologo
- Supporto amici
- Tempo
- Self-care

---

# 🌐 Reputation System

Due reputazioni separate:

## Public Reputation
- Fama
- Immagine pubblica
- Social status

## Private Reputation
- Famiglia
- Partner
- Amici
- Colleghi

Possibile:
- Celebre ma odiato dalla famiglia
- Povero ma amatissimo

---

# ☁️ Cloud Save & Account System

Feature obbligatorie:
- Cloud save
- Multi-device sync
- Guest mode
- Account linking
- Backup automatici

---

# 📊 Analytics System

Tracking:
- Retention D1/D7/D30
- Scelte più usate
- Eventi più ignorati
- Funnel monetizzazione
- Rage quit points

Obiettivo:
Bilanciare esperienza reale utenti.

---

# 🛡️ Moderation & Safety

Necessario se presenti contenuti community:
- Filtri testo
- Moderazione scenari
- Report utenti
- Ban system
- Content review pipeline

---

# ⚖️ Privacy & Compliance

## GDPR / CCPA
Obbligatorio:
- Consenso tracking
- Gestione cookie
- Export dati
- Delete account

## Minori
- Age rating corretto
- Ads compliance
- Protezione dati

---

# 🧱 Technical Fixes & Refactor Notes

## Fix MemoryLog
Problema:
```ts
const decay = Math.pow(0.9, yearsAgo);
if (memory.urgency > 80) decay = 1;
```

Corretto:
```ts
let decay = Math.pow(0.9, yearsAgo);

if (memory.urgency > 80) {
  decay = 1;
}
```

---

## Fix Threshold Mismatch

Se urgency usa range 0-100:
```ts
critical_threshold: 80
```

Oppure convertire urgency in range 0-1.

---

## Zustand Store Fix

Evitare:
```ts
this.aggiornaStats(...)
```

Usare:
```ts
get().aggiornaStats(...)
```

---

# ✅ Nuovi Pilastri Totali

1. FamilyEngine
2. TraitSystem
3. ReactionEngine
4. MemoryLog
5. ChainReactions
6. Rewarded Ads System
7. Emotional AI Layer
8. Dynamic Dialogue
9. Trauma & Grief
10. Reputation System
11. LiveOps
12. Cloud Save
13. Analytics
14. Moderation & Compliance

Obiettivo finale:
Creare un life simulator che sembri vivo, umano, imprevedibile e altamente rigiocabile.



# 🎮 V5 — EMERGENT LIFE UPDATE

## Visione
La V5 trasforma il gioco da semplice life simulator a generatore di storie emergenti.

---

# 🧬 1. GENERATIONAL LEGACY SYSTEM

## Obiettivo
Permettere al giocatore di continuare la partita come figlio/erede dopo la morte.

## Features
- Continua come figlio
- Sistema eredità
- Dinastie familiari
- Cognome legacy
- Wealth inheritance
- Family reputation
- Family fame
- Family scandals
- Albero genealogico
- Successioni

## Gameplay
Ogni generazione modifica:
- status sociale
- ricchezza
- reputazione
- opportunità future

---

# 🌟 2. FAME SYSTEM

## Features
- Fanbase
- Paparazzi
- Interviste TV
- Sponsorizzazioni
- Verified status
- Scandali
- Cancel culture
- Fame decay
- Public image

## Fame Sources
- Social media
- Streaming
- Sport
- Musica
- Politica
- Cinema
- Criminalità famosa

---

# ❤️ 3. RELATIONSHIP DRAMA ENGINE

## NPC Personality System
Ogni NPC possiede:
- Gelosia
- Fedeltà
- Aggressività
- Ambizione
- Empatia
- Manipolazione
- Stabilità mentale

## Features
- Tradimenti
- Divorzi
- Figli segreti
- Gelosia
- Stalking
- Litigi
- Manipolazione emotiva
- Relazioni abusive
- Partner opportunisti

## Memory System
Gli NPC ricordano:
- tradimenti
- promesse
- aiuti ricevuti
- soldi prestati
- insulti

---

# 🧨 4. EXTREME CHAOS ENGINE

## Formula
Bassissima probabilità + enorme impatto emotivo.

## Eventi Possibili
- Alien encounter
- Cults
- Viral fame overnight
- Rapimenti
- Incidenti assurdi
- Tiger attack
- Serial killer
- Truffe milionarie
- Survival scenarios

---

# 🏆 5. RIBBONS SYSTEM

## Obiettivo
Ricompensare lo stile di vita del giocatore.

## Esempi
- Criminal
- Hero
- Rich
- Miserable
- Famous
- Genius
- Lucky

---

# 🏅 6. ACHIEVEMENTS & COLLECTIONS

## Features
- Achievement permanenti
- Collection meta
- Career completion
- Death collection
- Rare endings
- Hidden achievements

---

# 📈 7. STOCK MARKET SYSTEM

## Features
- Buy/Sell stocks
- Crypto
- Economic crashes
- Insider events
- Passive income

---

# 📅 8. DAILY QUESTS SYSTEM

## Features
- Quest giornaliere
- Streak rewards
- Weekly challenges
- XP rewards

---

# 🎨 9. EMOTIONAL UI SYSTEM

## UI dinamica
- Felice → colori caldi
- Depresso → colori freddi
- Stressato → UI tremolante
- Ricco → effetti premium
- Malato → UI desaturata

---

# 🤖 10. NPC AGENCY SYSTEM

## Features
Gli NPC possono:
- sposarsi
- morire
- trasferirsi
- avere figli
- cambiare carriera
- fallire
- diventare criminali

---

# 🧠 11. CAUSALITY TRACEBACK SYSTEM

## Features
Timeline visuale:
- decisioni
- conseguenze
- traumi
- relazioni
- successi

---

# 🚗 12. CONSUMERISM & ASSETS SYSTEM

## Features
- Auto
- Ville
- Yacht
- Orologi
- Deprezzamento
- Maintenance
- Furti
- Investimenti immobiliari

---

# 🧩 13. MINIGAMES SYSTEM

## Possibili Minigiochi
- Escape prison
- Puzzle hacking
- Pet battles
- Casino
- Driving test

---

# 🐾 14. PET BATTLES

## Features
- Stats animali
- Combattimenti randomici
- Breeding
- Rare pets

---

# 🎲 15. GACHA EVENTS

## Features
- Lucky draws
- Cosmetic unlocks
- Luxury rewards

---

# 🌐 16. SOCIAL CHALLENGES

## Features
- Leaderboard
- Community goals
- Weekly runs
- Viral challenges

---

# 🎬 17. CINEMATIC CAREERS

## Careers
- Actor
- Singer
- Influencer
- Athlete
- Politician
- Astronaut
- Streamer
- Criminal mastermind
- Celebrity CEO

---

# 🚀 ROADMAP FINALE

## FASE 1 — CORE EMOTION UPDATE
- Legacy System
- Fame System
- Drama Engine
- Chaos Engine

## FASE 2 — RETENTION UPDATE
- Ribbons
- Achievements
- Daily Quests
- Emotional UI
- Stock Market

## FASE 3 — WORLD SIMULATION
- NPC Agency
- Causality Timeline
- Assets System

## FASE 4 — EXPANSION CONTENT
- Minigames
- Pet Battles
- Cinematic Careers

## FASE 5 — LIVE SERVICE
- Social Challenges
- Gacha
- Eventi stagionali

---

# 🏆 OBIETTIVO FINALE

Creare:
- storie emergenti
- drama umano
- legacy familiare
- fama
- caos memorabile
- vite assurde e uniche

Il giocatore deve poter dire:
“Non posso credere a cosa sia successo nella mia run.”
