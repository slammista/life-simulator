# Gameplay Upgrade Plan — Scuola, Lavoro, Relazioni e Progressione Naturale

## Obiettivo

Portare il gioco da semplice life simulator a esperienza più viva, sociale e rigiocabile, mantenendo la struttura generale già esistente.

Il focus non è rifare l'app, ma rendere scuola, lavoro, relazioni e attività molto più simili a ecosistemi narrativi, dove il giocatore sente che ogni scelta ha conseguenze leggere, naturali e progressive.

## Regole fondamentali

- Non modificare la struttura principale dell'app.
- Non trasformare il gioco in un clone diretto di BitLife.
- Non aggiungere complessità inutile.
- Ogni modifica deve aumentare game feel, immersione e replayability.
- Le nuove feature devono restare mobile-first, semplici e veloci da usare.
- Prima di creare nuovi componenti, verificare se esistono già componenti equivalenti e rifinirli invece di duplicarli.

---

# 1. Statistiche più naturali

## Problema attuale

Le statistiche possono cambiare troppo rapidamente e in modo troppo “videogioco artificiale”. Questo rende meno credibile la progressione della vita.

## Modifica richiesta

Ogni interazione o azione ordinaria deve modificare le statistiche con valori piccoli:

- massimo `+3`
- minimo `-3`

Esempi:

- Studia di più → Intelligenza `+1/+2`, Felicità `-1`
- Fai sport → Salute `+1/+2`, Energia `-1`
- Litiga con un collega → Felicità `-1/-3`, Reputazione lavoro `-1`
- Esci con amici → Felicità `+1/+3`, Energia `-1`

## Eccezioni

Eventi rari o importanti possono superare questo limite, ma devono essere trattati come eventi speciali:

- incidente grave;
- matrimonio;
- nascita figlio;
- licenziamento;
- vincita importante;
- malattia seria;
- arresto;
- morte di un familiare.

## Acceptance criteria

- Le azioni comuni non modificano mai una stat oltre `+3` o `-3`.
- Gli eventi speciali possono avere impatto maggiore ma devono essere chiaramente classificati come tali.
- Le variazioni devono essere mostrate con micro-feedback visivo: `+1`, `-2`, glow, mini animazione o toast.

---

# 2. Scuola e lavoro come ecosistemi separati

## Problema attuale

Scuola e lavoro sono troppo simili a tab statiche. Devono diventare mondi sociali con persone, attività, performance, status e conseguenze.

## Obiettivo

Creare due sezioni distinte:

- `Scuola`
- `Lavoro`

Ognuna deve avere logiche proprie, NPC propri e attività proprie.

---

# 3. Sistema Lavoro

## Struttura schermata lavoro

Quando il giocatore ha un lavoro attivo, la schermata lavoro deve mostrare:

- ruolo attuale;
- azienda/ente;
- salario;
- performance;
- stress;
- reputazione lavorativa;
- colleghi;
- responsabile/boss;
- attività lavorative.

## Azioni lavoro

Aggiungere operazioni lavorative tipo:

- Lavora di più;
- Chiedi promozione;
- Chiedi aumento;
- Socializza con colleghi;
- Interagisci con il boss;
- Fai networking;
- Denuncia a HR;
- Cambia orario;
- Dimettiti;
- Cerca nuovo lavoro.

## Colleghi

Ogni lavoro deve generare NPC persistenti:

- colleghi;
- superiori;
- eventuali sottoposti;
- clienti o contatti importanti se utile.

Ogni collega deve avere:

- nome;
- età;
- ruolo;
- relazione con il giocatore;
- personalità base;
- possibile compatibilità;
- eventuale stato: amichevole, neutrale, ostile, rivale.

## Interazioni con colleghi

Esempi:

- Conversa;
- Fai amicizia;
- Complimentati;
- Invita fuori;
- Flirta;
- Aiuta sul lavoro;
- Fai gossip;
- Litiga;
- Insulta;
- Segnala a HR;
- Chiedi favore.

## Promozione da collega a relazione

Un collega NON deve apparire subito nel tab Relazioni.

Regola:

- collega sconosciuto → resta solo nella schermata lavoro;
- collega con relazione alta → diventa conoscente;
- collega con legame stabile → può diventare amico;
- solo da amico in poi appare nel tab Relazioni.

## Acceptance criteria

- Lavoro e scuola non usano la stessa UI identica.
- I colleghi sono persistenti finché il lavoro esiste.
- Un collega non appare nel tab Relazioni finché non diventa almeno amico.
- Le interazioni lavorative modificano performance, stress, felicità, reputazione e relazioni con variazioni piccole.

---

# 4. Sistema Scuola

## Struttura schermata scuola

Quando il giocatore è iscritto a scuola/università, la schermata scuola deve mostrare:

- scuola o università attuale;
- classe/corso;
- voti;
- popolarità;
- stress;
- compagni/studenti;
- professori;
- attività scolastiche;
- club o sport disponibili.

## Azioni scuola

Aggiungere operazioni scolastiche tipo:

- Studia di più;
- Salta lezione;
- Partecipa in classe;
- Fai amicizia con compagni;
- Parla con professori;
- Chiedi aiuto;
- Copia compiti;
- Fai gossip;
- Entra in un club;
- Pratica sport;
- Partecipa a teatro/musica/arte.

## Studenti e professori

La scuola deve generare NPC persistenti:

- compagni di classe;
- studenti dello stesso corso;
- professori;
- allenatori;
- tutor.

Ogni NPC deve avere:

- nome;
- età;
- ruolo;
- relazione con il giocatore;
- popolarità;
- personalità base;
- possibile rivalità o amicizia.

## Promozione da studente a relazione

Uno studente NON deve apparire subito nel tab Relazioni.

Regola:

- compagno sconosciuto → resta solo nella schermata scuola;
- relazione media → conoscente;
- relazione alta → amico;
- solo da amico in poi appare nel tab Relazioni.

## Acceptance criteria

- Scuola ha una UI e azioni diverse dal lavoro.
- Gli studenti sono persistenti durante il percorso scolastico.
- I professori possono influenzare voti, opportunità e borse di studio.
- Gli studenti entrano nel tab Relazioni solo dopo aver raggiunto un legame sufficiente.

---

# 5. Rimozione “Incontra persone” dal tab Relazioni

## Problema attuale

Il tab Relazioni permette di incontrare persone in modo troppo diretto e artificiale.

## Modifica richiesta

Rimuovere dal tab Relazioni la funzione generica di incontro persone.

Il tab Relazioni deve mostrare solo persone con cui il giocatore ha già un legame reale:

- famiglia;
- amici;
- partner;
- figli;
- ex;
- persone importanti;
- colleghi/studenti solo se diventati amici.

## Nuova posizione della funzione incontro

Spostare la possibilità di incontrare nuove persone nelle Attività.

Nuova attività suggerita:

## Esci / Socializza

Possibili luoghi:

- quartiere;
- bar;
- palestra;
- festa;
- viaggio;
- app dating;
- evento locale;
- volontariato;
- club/hobby.

Non includere scuola e lavoro in questa attività, perché scuola e lavoro devono avere sistemi sociali separati.

## Probabilità di incontro

L'incontro con nuove persone deve dipendere da:

- età;
- paese;
- status sociale;
- look;
- felicità;
- popolarità;
- attività scelta;
- casualità.

Esempio:

- App dating → più probabilità di interesse romantico;
- Bar → più probabilità di conoscenze casuali;
- Volontariato → più probabilità di persone positive;
- Viaggio → possibilità di incontri internazionali;
- Festa → più possibilità di flirt o drama.

## Acceptance criteria

- Il tab Relazioni non genera più persone casuali direttamente.
- Le nuove conoscenze arrivano da attività contestuali.
- Le persone incontrate non appaiono subito come relazioni principali.
- Solo legami consolidati entrano nel tab Relazioni.

---

# 6. Attività scolastiche e abilità

## Obiettivo

Aggiungere attività scolastiche che permettano di costruire abilità future e rendere ogni run diversa.

## Club e attività

Esempi di attività:

### Sport

- Calcio;
- Basket;
- Atletica;
- Nuoto;
- Tennis;
- Arti marziali.

Effetti:

- aumenta abilità atletica;
- aumenta salute;
- aumenta popolarità;
- può ridurre energia;
- può creare rischio infortuni.

### Arti performative

- Teatro;
- Musica;
- Danza;
- Canto;
- Cinema scolastico.

Effetti:

- aumenta carisma;
- aumenta creatività;
- aumenta abilità attoriale/musicale;
- può aprire carriere artistiche.

### Club accademici

- Debate club;
- Club scienze;
- Club matematica;
- Giornalino scolastico;
- Scacchi.

Effetti:

- aumenta intelligenza;
- aumenta disciplina;
- può aiutare borse di studio;
- può aprire carriere in legge, politica, ricerca, giornalismo.

### Attività sociali

- Comitato studenti;
- Volontariato;
- Organizzazione eventi;
- Club fotografia;
- Club tecnologia.

Effetti:

- aumenta popolarità;
- aumenta reputazione;
- può creare nuove amicizie;
- può generare eventi speciali.

## Skill system

Aggiungere o preparare un sistema di abilità leggere, ad esempio:

- Athleticism;
- Acting;
- Music;
- Creativity;
- Charisma;
- Discipline;
- Leadership;
- Academic Skill;
- Social Skill.

Le skill devono crescere lentamente e influenzare opportunità future.

## Acceptance criteria

- Le attività scolastiche influenzano skill future.
- Le skill non devono essere troppo visibili o complesse all'inizio.
- Ogni attività deve avere piccoli effetti su stats e relazioni.
- Le attività possono generare eventi casuali.

---

# 7. Personalità dinamica

## Obiettivo

Aggiungere profondità al personaggio e agli NPC tramite tratti personali.

## Traits possibili

Esempi:

- Ambizioso;
- Pigro;
- Romantico;
- Impulsivo;
- Timido;
- Estroverso;
- Geloso;
- Leale;
- Manipolatore;
- Creativo;
- Ribelle;
- Nerd;
- Sportivo.

## Funzione

I traits devono influenzare:

- probabilità degli eventi;
- successo delle interazioni;
- compatibilità romantica;
- amicizie;
- rendimento scolastico;
- lavoro;
- rischio di drama.

## Regola UX

Non mostrare tutto subito in modo tecnico. I traits possono emergere tramite eventi, descrizioni e comportamenti.

## Acceptance criteria

- Ogni NPC può avere almeno 1-2 traits.
- I traits influenzano probabilità e outcome.
- I traits non devono rendere l'interfaccia più complicata.

---

# 8. Reputazione sociale

## Obiettivo

Aggiungere uno strato di reputazione contestuale.

## Reputazione a scuola

Possibili status:

- Invisibile;
- Popolare;
- Nerd;
- Atleta;
- Ribelle;
- Problematico;
- Leader;
- Artista.

## Reputazione al lavoro

Possibili status:

- Affidabile;
- Ambizioso;
- Lecchino;
- Tossico;
- Genio;
- Pigro;
- Leader;
- Problematico.

## Effetti

La reputazione deve influenzare:

- probabilità di promozione;
- qualità delle relazioni;
- inviti sociali;
- eventi casuali;
- opportunità speciali;
- rischio conflitti.

## Acceptance criteria

- La reputazione cambia lentamente.
- Le azioni sociali impattano reputazione con valori piccoli.
- La reputazione deve essere contestuale: scuola e lavoro hanno reputazioni separate.

---

# 9. Memorie importanti

## Obiettivo

Creare attachment emotivo salvando gli eventi più importanti della vita.

## Esempi di memorie

- nascita;
- primo amico;
- primo amore;
- primo bacio;
- primo lavoro;
- laurea;
- promozione;
- matrimonio;
- nascita figlio;
- tradimento;
- licenziamento;
- incidente;
- arresto;
- morte familiare;
- grande successo.

## Uso in UI

Le memorie possono apparire in:

- cronaca di vita;
- profilo personaggio;
- recap annuale;
- timeline vita;
- eventi nostalgia.

Esempio:

> Ricordi quando hai conosciuto Giulia al liceo?

## Acceptance criteria

- Gli eventi importanti vengono salvati come memorie.
- Le memorie non devono intasare la cronaca normale.
- Le memorie possono essere usate per recap e storytelling futuro.

---

# 10. Eventi cinematici rari

## Obiettivo

Aggiungere momenti speciali che interrompono il flusso normale e creano emozione.

## Esempi

- arresto;
- proposta di matrimonio;
- incidente;
- grande opportunità lavorativa;
- casting importante;
- borsa di studio;
- rivalità;
- tradimento;
- dichiarazione d'amore;
- vincita;
- perdita importante.

## UI suggerita

Gli eventi rari devono avere:

- overlay;
- icona grande;
- titolo forte;
- scelta multipla se necessario;
- effetto su stats;
- possibilità di creare memoria.

## Acceptance criteria

- Gli eventi rari sono visivamente diversi dagli eventi normali.
- Non devono apparire troppo spesso.
- Devono poter influenzare relazioni, stats, reputazione e memorie.

---

# 11. Status sociale visivo

## Obiettivo

Rendere visibile la progressione di vita anche attraverso avatar, outfit e stile.

## Esempi

- studente → outfit scolastico;
- atleta → elementi sportivi;
- poliziotto → uniforme;
- medico → camice;
- ricco → outfit premium;
- criminale → look più losco;
- anziano → capelli bianchi/rughe leggere.

## Acceptance criteria

- Lo status visivo non deve essere obbligatorio in tutte le schermate.
- Deve essere compatibile con il sistema avatar modulare.
- Deve rafforzare immersione e progressione.

---

# 12. Timeline della vita

## Obiettivo

Migliorare la cronaca rendendola più memorabile e meno simile a un log tecnico.

## Struttura suggerita

La timeline può contenere:

- anno;
- età;
- evento principale;
- icona;
- impatto;
- persone coinvolte;
- memoria se evento importante.

## Tipi di eventi

- vita;
- scuola;
- lavoro;
- relazioni;
- salute;
- crimine;
- finanze;
- successo;
- fallimento.

## Acceptance criteria

- La timeline è leggibile e mobile-first.
- Gli eventi importanti sono distinguibili dagli eventi minori.
- La cronaca deve sembrare racconto, non debug log.

---

# 13. Eventi regionali e culturali

## Obiettivo

Rendere diverse le vite in base a paese, cultura e contesto.

## Esempi

- scuola diversa per paese;
- carriere più comuni in alcune nazioni;
- eventi culturali locali;
- sistema sanitario diverso;
- costo della vita diverso;
- opportunità sportive/artistiche diverse.

## Acceptance criteria

- Non serve implementare tutto subito.
- Preparare la struttura dati per paese/cultura.
- Gli eventi regionali possono essere aggiunti gradualmente.

---

# Roadmap consigliata

## PR 1 — Stat tuning e relazioni contestuali ✅ COMPLETATO

- ✅ Limitare modifiche stat comuni a `+3/-3` — tutte le nuove azioni usano valori piccoli.
- ✅ Separare persone casuali da relazioni vere — colleghi/studenti in ecosistemi separati.
- ✅ Rimuovere “Incontra persone” dal tab Relazioni.
- ✅ Spostare incontri casuali nelle Attività (nuova schermata Socializza).

## PR 2 — Lavoro come ecosistema ✅ COMPLETATO

- ✅ Schermata lavoro dedicata con tab Colleghi.
- ✅ Colleghi persistenti generati all'assunzione (tipo WorkNPC).
- ✅ Interazioni lavorative: Parla, Esci, Aiuta, Complimenta, Gossip, Litiga.
- ✅ Reputazione lavorativa (Nuovo, Affidabile, Ambizioso, Leader, etc.).
- ✅ Promozione collega → Relazione reale quando affinità ≥ 65.
- ✅ Colleghi rimossi al licenziamento/dimissioni.

## PR 3 — Scuola come ecosistema ✅ COMPLETATO

- ✅ Studenti e professori persistenti generati all'iscrizione (tipo SchoolNPC).
- ✅ Interazioni scolastiche: Parla, Amicizia, Studia, Gossip, Litigate, Copia.
- ✅ Reputazione scolastica (Invisibile, Popolare, Nerd, Atleta, Ribelle, etc.).
- ✅ Studenti entrano nelle Relazioni solo dopo affinità ≥ 65.
- ✅ Club/sport/arti che modificano skill — UI club in EducationScreen completata.

## PR 4 — Skill e attività scolastiche ✅ COMPLETATO

- ✅ Sistema skill leggero (PlayerSkills: socialSkill, charisma, academicSkill, atletismo, etc.).
- ✅ Skill crescono con interazioni scuola/lavoro e attività sociali.
- ✅ Skill visibili nel SocializeScreen.
- ✅ Skill panel in EducationScreen con barre di progresso per tutte le 8 abilità.
- ✅ Club scolastici: 5 club (Sport, Musicale, Accademico, Arte, Dibattito) ognuno con bonus skill specifici, UI nella scheda Info.
- ✅ joinClub() action nel gameStore.
- ⏳ Collegare skill esplicitamente a requisiti carriera.

## PR 5 — Memorie, eventi rari e timeline ✅ COMPLETATO

- ✅ Struttura LifeMemory definita nei tipi.
- ✅ Salvare memorie importanti automaticamente: primo lavoro, promozione, matrimonio, divorzio, nascita figlio, laurea, milestone età (18/30/40/50/65).
- ✅ Aggiungere eventi cinematici rari con overlay speciale: epic/legendary → full-screen overlay con glow, shimmer bar, pop-in animation.
- ✅ CausalityTimelineScreen: aggiunto tab "Ricordi" con LifeMemory[] filtrabili per categoria.

## PR 6 — Polish visuale e game feel ⏳ DA FARE

- ⏳ Micro-feedback per stat delta visivo.
- ⏳ Event cards più narrative.
- ⏳ Avatar/status visivo legato al lavoro.
- ⏳ Animazioni leggere.
- ⏳ Reduced motion.

---

# Priorità assoluta

Se bisogna scegliere cosa implementare prima, partire da:

1. ✅ Stat changes `+3/-3` per azioni comuni.
2. ✅ Rimozione incontri casuali dal tab Relazioni.
3. ✅ Lavoro con colleghi persistenti.
4. ✅ Scuola con studenti persistenti.
5. ✅ Attività scolastiche che aumentano skill.
6. ⏳ Timeline/memorie.

Queste modifiche spostano il gioco da menu simulator a vero life simulator sociale.

---

# Stato implementazione — aggiornamento 2026-06-08 (sessione 2)

## Completato nella sessione 1

- **WorkSchoolEngine.ts** — nuovo motore per colleghi, compagni, socialità esterna
- **Tipi estesi**: WorkNPC, SchoolNPC, PlayerSkills, LifeMemory, WorkReputationStatus, SchoolReputationStatus
- **CareerState** aggiornato con `colleagues[]` e `workReputation`
- **EducationState** aggiornato con `classmates[]` e `schoolReputation`
- **GameState** aggiornato con `skills` e `lifeMemories`
- **CareerScreen** — tab Colleghi con interazioni e reputazione lavorativa
- **EducationScreen** — tab Persone con compagni/professori e reputazione scolastica
- **RelationshipScreen** — rimosso bottone “Incontra”, aggiunto hint su dove incontrare gente
- **SocializeScreen** — nuova schermata Socializza nelle Attività (8 location, skill hints)
- **ActivitiesNav** — aggiunta voce “Socializza” nella categoria Socialità
- **App.tsx** — wired up SocializeScreen
- **gameStore** — nuove azioni: `workInteract`, `schoolInteract`, `socializeOutside`

## Completato nella sessione 2

- **Life Memories auto-save**: `makeMemory()` helper + hook in applyForJob, attemptPromotion, getMarried, getDivorced, haveChild; milestone età (18/30/40/50/65) e laurea in handleInvecchia; cap 200 entries
- **CausalityTimelineScreen**: tab “Ricordi” con LifeMemory[] filtrabili per 8 categorie (vita, scuola, lavoro, amore, salute, crimini, finanze, successi)
- **EducationScreen**: skills panel con barre di progresso per 8 PlayerSkills; sezione Club con 5 club joinabili (Sport, Musicale, Accademico, Arte, Dibattito) con bonus skill
- **EventDisplay**: overlay cinematico full-screen per eventi epici/leggendari (glow, shimmer bar, pop-in animation); effetto glow sul card e barra colorata
- **gameStore**: azione `joinClub()` con 5 club e relativi bonus skill/stat; importato `getEducationLabel`
- **types.ts**: `joinClub` aggiunto a GameActions

## Manca ancora (bassa priorità)

- Collegare skill esplicitamente a requisiti carriera (label “richiede X skill”)
- Micro-feedback visivo per stat delta migliorato (HUD già ha floating deltas)
- Event cards più narrative (testo più storytelling nel log)
- Avatar/status visivo legato al job/reputazione (outfit per job)
- Personalità dinamica del giocatore (tratti che influenzano outcome)
- Reputazione contestuale avanzata (effetti su NPC e opportunità)
- Status sociale visivo (outfit per job/status)

