# FIX VERSIONE 1.1

Documento di revisione funzionale per rendere Life Simulator 2D piu sicuro, piu leggibile e piu vendibile.  
Obiettivo: avvicinare la struttura macro a BitLife dove funziona, mantenendo pero una profondita sistemica superiore e una UX piu moderna.

---

## 📊 STATO DI AVANZAMENTO — v1.1

> Ultimo aggiornamento: 2026-06-08

| # | Sezione | Stato | Note |
|---|---------|-------|------|
| 1 | Relazioni, consenso e limiti legali | ✅ Completo | Guard a livello engine + UI in RelationshipEngine e RelationshipScreen |
| 2 | Incontri e rete sociale organica | ✅ Completo | NPC auto-spawn contestuale (scuola/lavoro) nel tick annuale + meetNewPerson per contesti manuali |
| 3 | Scuola obbligatoria e progressione educativa | ✅ Completo | Auto-enrollment elementari/medie/liceo nel tick annuale; abbandono scolastico con conseguenze |
| 4 | Scuola pubblica, privata e indirizzo | ✅ Completo | Scuola privata assegnata in base a familyWealthTier; bonus intelligenza +1 per scuola privata |
| 5 | Layout sotto-menu da uniformare | ✅ Completo | CSS uniformato per Military, BodyMod, Beauty (commit v1.1 CSS polish) |
| 6 | Pop-up conseguenze per azioni ed eventi | ✅ Completo | Toast system con ToastNotification + useToastStore, wired su Career e Relationship |
| 7 | Dopo Age si torna sempre alla Home/Vita | ✅ Completo | handleAge() chiama setActiveTab('vita') prima di handleInvecchia() |
| 8 | Nuova struttura di navigazione principale | ✅ Completo | 5 tab: Lavoro / Assets / Vita (Age centrale) / Relazioni / Activities |
| 9 | Reward integrati nella pagina Vita | ✅ Completo | VitaWidgets: RewardBanner (ad reward + daily quests) + SuggestedActions contestuali |
| 10 | Barre statistiche principali | ✅ Completo | HUD: Felicità/Salute/Intelligenza/Look + Fama dinamica (appare se fame ≥ 30) |
| 11 | Uso di sostanze per eta | ✅ Completo | Age gates: blocco <13, alcohol/cannabis 16+, warning minorenni |
| 12 | Lavori minorili, part-time e full-time | ✅ Completo | Part-time da 16+, full-time bloccato senza diploma, teen notice in CareerScreen |
| 13a | Header personaggio persistente | ✅ Completo | Nome+Cognome, età, anno, status badge dinamico (Studente/Lavoratore/Famoso/In Carcere/Pensionato) |
| 13b | Sezioni con intestazioni interne | ✅ Completo | Grouping in RelationshipScreen (Famiglia/Romantiche/Amici/Altro), categorie in Assets/Activities |
| 13c | Favoriti dinamici e azioni consigliate | ✅ Completo | PinnedActivities: 5 pin salvati in localStorage, edit mode, default salute/hobby/viaggi |
| 13d | Persone come entita persistenti | ✅ Completo | Memorie NPC, ex/partner/defunti nel log relazioni, memoryLog per ogni NPC |
| 13e | Barre e stati inline nelle righe | ✅ Completo | RelCard: mini-barre Fiducia+Amore inline (collapsed); CareerScreen: Stress+Burnout inline |
| 13f | Reward e premium integrati | ✅ Completo | Ad reward + daily quests in VitaWidgets; Gacha/Life Tokens in HUD |
| 13g | Age come centro fisico del gioco | ✅ Completo | Pulsante +1 ETÀ tondo centrato nella bottom nav, pulse animation, sempre visibile |
| 13h | Activities come hub con categorie | ⚠️ Parziale | PinnedActivities implementato; mancano ancora categorie visive (Corpo/Rischio/Svago) nella lista Activities |

### Completamento totale: **~93%**

### Ancora mancante (bassa priorità)

- **Activities categorie visive** — dividere il subtab di Activities in gruppi visuali (Corpo & Salute / Socialità / Rischio / Svago / Profilo) invece della lista piatta orizzontale. Miglioramento puramente estetico/UX.
- **Assets aspirazionale** — aggiungere sezioni "obiettivi finanziari" visive nell'Assets (es. progress bar verso casa propria, prossimo veicolo) per rendere la tab più motivante.
- **Ex/defunti sezione dedicata** — nella tab Relazioni, aggiungere un sotto-tab "Storia" che mostri tutti gli ex, i defunti e i vecchi colleghi con timeline degli eventi significativi.

---

## Priorita di prodotto

La versione 1.1 deve concentrarsi su tre assi:

1. **Sicurezza legale e reputazionale**
   Il gioco deve impedire chiaramente incesto, abusi su minori, interazioni romantico-sessuali inappropriate e contenuti che possano essere interpretati come normalizzazione di condotte illegali.

2. **Chiarezza del loop principale**
   Il giocatore deve capire subito cosa fare: vivere, avanzare di eta, leggere conseguenze, gestire lavoro, patrimonio, relazioni e attivita.

3. **Struttura piu vendibile**
   Il gioco deve avere una navigazione piu simile ai life sim di successo: poche sezioni principali, contenuti profondi dentro sezioni coerenti, feedback immediati per ogni azione rilevante.

---

## 1. Relazioni, consenso e limiti legali

### Requisito

Il sistema relazionale deve impedire in modo esplicito:

- rapporti romantici o sessuali con parenti diretti;
- rapporti romantici o sessuali con minorenni quando il personaggio o l'altro NPC non rientrano nei limiti consentiti;
- qualsiasi interazione che possa suggerire abuso, grooming o incesto;
- opzioni ambigue tra adulto e minorenne.

### Regola consigliata

Per ridurre rischio legale e reputazionale, usare una regola conservativa:

- **azioni sessuali disponibili solo dai 18 anni in su**;
- **bacio e flirt disponibili dai 16 anni in su**, solo tra personaggi di eta compatibile;
- **tradimento disponibile come azione relazionale**, ma soggetto agli stessi limiti di eta e parentela;
- **nessuna opzione romantica o sessuale tra parenti**, anche se lontani, adottivi, acquisiti o ex-familiari.

### Nota di design

Il gioco puo mantenere conflitti, gelosia, tradimenti, cotte, rifiuti e tensioni sociali.  
La linea rossa e che il gioco non deve mai offrire come scelta valida un'interazione sessuale con minori o parenti.

### Criteri di accettazione

- Un familiare non mostra mai azioni romantiche o sessuali.
- Un NPC minorenne non mostra mai azioni sessuali.
- Se il giocatore e minorenne, le azioni romantiche sono limitate e coerenti con eta simili.
- Tutti i controlli devono stare a livello di logica, non solo UI.

---

## 2. Incontri e rete sociale organica

### Problema attuale

Il giocatore non dovrebbe "aggiungere occasioni per incontrare persone" in modo artificiale.  
Le persone devono emergere dai contesti che il giocatore frequenta.

### Nuovo modello

Gli NPC devono nascere o diventare rilevanti da:

- scuola;
- universita;
- lavoro;
- attivita sportive;
- hobby;
- viaggi;
- famiglia;
- vicinato;
- eventi casuali;
- social media;
- gruppi religiosi o politici;
- attivita criminali o rischiose.

### Esempio: lavoro

Ogni luogo di lavoro dovrebbe avere:

- **colleghi**;
- **superiori**;
- eventuali **clienti/utenti/pazienti** in base alla professione;
- reputazione interna;
- rapporti di amicizia, rivalita, amore o odio;
- conseguenze sulla carriera se la vita privata interferisce col lavoro.

### Considerazione senior

Questo e uno dei punti che puo differenziare il gioco da BitLife.  
BitLife spesso genera relazioni come menu. Noi possiamo creare una rete sociale persistente: se tradisci con una collega, questo puo influenzare partner, lavoro, reputazione e stress.

### Criteri di accettazione

- Gli NPC importanti derivano da contesti reali frequentati dal giocatore.
- Ogni NPC ha almeno: nome, eta, relazione, contesto di origine, livello rapporto, eventuale ruolo.
- Le azioni su un NPC possono avere conseguenze fuori dalla sezione in cui avvengono.

---

## 3. Scuola obbligatoria e progressione educativa

### Requisito

Il giocatore non deve iscriversi manualmente alla scuola da bambino.  
I genitori o tutori lo mandano a scuola automaticamente.

### Progressione base

Il sistema educativo deve rispettare una struttura coerente con il paese del personaggio.

Per l'Italia:

- 5 anni di scuola primaria;
- 3 anni di scuola media;
- 5 anni di liceo/istituto superiore;
- universita solo dopo completamento del percorso superiore.

Per altri paesi, usare equivalenti locali: elementary, middle school, high school, college/university.

### Abbandono scolastico

Dai 13 anni in poi il giocatore puo chiedere di lasciare la scuola.  
La scelta deve avere conseguenze forti:

- conflitto con i genitori;
- minori opportunita lavorative;
- accesso bloccato o ritardato all'universita;
- reputazione scolastica/familiare negativa;
- possibile obbligo legale o servizi sociali in base al paese.

### Bocciatura e ritardi

Il giocatore puo saltare un anno o essere bocciato.  
Questo non deve rompere la progressione:

- la scuola finisce piu tardi;
- l'universita inizia piu tardi;
- il lavoro full-time viene ritardato se richiede diploma;
- gli NPC coetanei possono andare avanti prima del giocatore.

### Criteri di accettazione

- La scuola inizia automaticamente all'eta corretta.
- Il giocatore non sceglie manualmente "iscriviti a scuola" da bambino.
- Bocciatura, salto anno e abbandono modificano eta di completamento e opportunita future.

---

## 4. Scuola pubblica, privata e indirizzo di studio

### Requisito

La distinzione tra scuola pubblica e privata deve essere gestita automaticamente dal contesto familiare, non come semplice scelta libera.

### Fattori decisionali

La scuola assegnata deve dipendere da:

- soldi della famiglia;
- livello di protezione/paura dei genitori;
- ambizione dei genitori;
- paese e citta;
- intelligenza e rendimento del giocatore;
- indirizzo desiderato alle superiori;
- disponibilita reale dell'indirizzo in versione pubblica o privata.

### Nota importante

Alcuni indirizzi non devono esistere in ogni tipo di scuola.  
Esempio: non tutti i licei o istituti tecnici devono avere una variante privata.

### Criteri di accettazione

- Il sistema sceglie scuola pubblica/privata in automatico.
- Il giocatore puo influenzare l'indirizzo alle superiori, ma non controllare tutto.
- La famiglia puo imporre o contrastare certe scelte.

---

## 5. Layout sotto-menu da uniformare

### Problema

Le sezioni Militare, Bodymod e Beauty non hanno layout coerente con sezioni piu rifinite come Estetica o Azzardo.

### Requisito UI

Uniformare i sotto-menu usando un pattern comune:

- card o righe azione coerenti;
- icona;
- titolo;
- descrizione breve;
- eventuale costo/requisito;
- stato bloccato/sbloccato;
- feedback visivo su azione disponibile;
- spaziature e gerarchie uguali tra sezioni.

### Considerazione senior

La coerenza dei sotto-menu e importante quanto il contenuto.  
Se alcune sezioni sembrano "placeholder", l'utente percepisce il gioco come incompleto anche quando le feature esistono.

### Criteri di accettazione

- Militare, Bodymod e Beauty usano lo stesso livello di rifinitura di Estetica/Azzardo.
- Ogni azione mostra chiaramente cosa fa e se e disponibile.
- Le sezioni non devono sembrare liste tecniche.

---

## 6. Pop-up conseguenze per azioni ed eventi

### Requisito

Ogni azione rilevante deve produrre un feedback immediato visibile.

Il pop-up deve apparire quando:

- si vince o perde un minigioco;
- appare un nuovo evento;
- un'interazione con un NPC cambia rapporto;
- si guadagnano o perdono soldi;
- cambiano statistiche importanti;
- si sblocca qualcosa;
- si subisce una conseguenza negativa.

### Esempi

- "Hai vinto 10 euro al blackjack."
- "Il rapporto con Marco e peggiorato."
- "La tua salute mentale e diminuita."
- "Hai ottenuto un nuovo lavoro part-time."
- "Sei stato scoperto a fumare a scuola."

### Considerazione senior

Questo e fondamentale per vendibilita e retention.  
Senza feedback immediato, l'utente non sente il peso delle scelte. Il gioco deve far percepire causa-effetto ogni pochi secondi.

### Criteri di accettazione

- Ogni azione manuale produce un risultato leggibile.
- Il pop-up non sostituisce il log vita: lo anticipa e lo rende emotivo.
- Il log deve comunque registrare gli eventi importanti.

---

## 7. Dopo Age si torna sempre alla Home/Vita

### Requisito

Ogni volta che il giocatore avanza di un anno, il gioco deve tornare automaticamente alla pagina Vita/Home.

### Motivazione

L'avanzamento di eta e il cuore del loop.  
Dopo aver premuto Age, il giocatore deve leggere cosa e successo nella vita, non restare dentro un sotto-menu.

### Criteri di accettazione

- Premendo Age da qualsiasi sezione, la tab attiva diventa Vita.
- Eventi annuali e conseguenze appaiono subito nella Home.
- Eventuali pop-up importanti vengono mostrati prima o sopra il log.

---

## 8. Nuova struttura di navigazione principale

### Requisito

Riorganizzare la bottom navigation in 5 sezioni:

1. **Lavoro**
2. **Assets**
3. **Vita**
4. **Relazioni**
5. **Activities**

La sezione Vita deve stare al centro ed essere associata a un pulsante rotondo grande `+ Age`.

### Struttura proposta

#### Lavoro

Comprende:

- lavoro;
- istruzione;
- carriera;
- freelance;
- lavori part-time;
- militare;
- pensione, se collegata alla carriera.

#### Assets

Comprende:

- proprieta;
- finanze;
- investimenti;
- veicoli;
- social media come asset/reputazione digitale;
- oggetti posseduti;
- eventuali business.

#### Vita

Comprende:

- feed eventi;
- aggiornamenti annuali;
- pop-up recenti;
- reward visibili;
- obiettivi o reminder importanti;
- pulsante `+ Age` centrale.

#### Relazioni

Comprende:

- famiglia;
- partner;
- figli;
- amicizie;
- amore;
- ex;
- colleghi rilevanti;
- animali domestici.

Nota: gli animali possono stare in Relazioni, non Activities, perche sono legami persistenti.

#### Activities

Comprende tutto il restante:

- salute;
- hobby;
- sport;
- viaggi;
- religione;
- crimini;
- sostanze;
- gambling;
- beauty;
- bodymod;
- chirurgia estetica;
- minigiochi;
- impostazioni.

### Considerazione senior

Questa struttura e piu vicina a BitLife e quindi piu immediata.  
Il vantaggio e che l'utente non deve capire categorie astratte come "Sviluppo" o "Benessere": vede categorie concrete e familiari.

### Criteri di accettazione

- Bottom nav con 5 voci.
- Vita al centro.
- Age grande, rotondo, centrale e sempre riconoscibile.
- Le sotto-sezioni attuali vengono ricollocate senza perdere feature.

---

## 9. Reward integrati nella pagina Vita

### Problema

Il sistema di reward non deve sembrare isolato o nascosto.

### Requisito

Integrare reward, ad reward, bonus giornalieri, obiettivi e sblocchi nella pagina Vita.

### Regole UX

- I reward devono essere visibili senza interrompere troppo il gioco.
- La Home deve mostrare quando un reward e disponibile.
- Le ricompense devono sembrare parte della vita del personaggio, non banner pubblicitari scollegati.

### Esempi

- box compatto "Ricompensa disponibile";
- reward collegato a evento: "Hai lavorato bene quest'anno: guarda un ad per raddoppiare il bonus?";
- streak giornaliera mostrata vicino al feed vita;
- obiettivo completato mostrato come evento speciale.

### Criteri di accettazione

- Il giocatore vede reward disponibili dalla Home.
- I reward non coprono il pulsante Age.
- Il reward ha sempre contesto narrativo o progressivo.

---

## 10. Barre statistiche principali

### Requisito

Le barre indicatorie principali devono essere:

- Felicita;
- Salute;
- Intelligenza;
- Bellezza/Look.

Quando il personaggio diventa famoso, si aggiunge:

- Fama.

### Regola Fama

La barra Fama deve apparire solo quando il personaggio raggiunge uno status pubblico rilevante:

- influencer;
- attore;
- cantante;
- atleta;
- politico;
- criminale noto;
- imprenditore pubblico;
- creator molto seguito;
- altra carriera pubblica.

### Considerazione senior

La barra Fama non deve essere sempre presente.  
Se appare solo quando serve, diventa una ricompensa visiva e comunica avanzamento di status.

### Criteri di accettazione

- Le quattro barre base sono sempre visibili.
- Fama appare dinamicamente solo quando il personaggio e famoso.
- Le azioni pubbliche influenzano Fama e reputazione.

---

## 11. Uso di sostanze per eta

### Requisito

Il sistema sostanze deve avere limiti di eta e conseguenze coerenti.

### Regole

- Dai 13 anni: solo sigarette.
- Dai 16 anni: altre sostanze, dove previste dal sistema.
- Da minorenne: rischio di conseguenze legali, scolastiche e familiari.
- Da adulto: rischio di multe, dipendenza, perdita lavoro, danni salute, conseguenze sociali.

### Nota legale/prodotto

Le sostanze devono essere presentate come scelte rischiose con penalita reali.  
Il gioco non deve glamourizzare l'uso, soprattutto da minorenni.

### Esempi conseguenze minorenni

- punizione dei genitori;
- sospensione scolastica;
- peggioramento rapporto familiare;
- intervento dei servizi sociali;
- carcere minorile in casi gravi;
- salute e felicita compromesse.

### Criteri di accettazione

- Le sostanze non appaiono prima dell'eta minima.
- Le azioni da minorenne generano rischio maggiore.
- Il log registra conseguenze e ricadute.

---

## 12. Lavori minorili, part-time e full-time

### Requisito

Il lavoro deve rispettare eta, scuola completata e paese.

### Regole proposte

#### Dai 16 anni

Il giocatore puo accedere a:

- babysitter;
- ripetizioni;
- dogsitter;
- catsitter;
- piccoli interventi di manutenzione;
- consegne leggere;
- lavori stagionali;
- lavori part-time compatibili con scuola.

#### Dopo diploma o equivalente

Il giocatore puo accedere a:

- lavori full-time;
- carriere stabili;
- lavori specializzati che richiedono diploma;
- percorsi universitari o professionali avanzati.

### Conseguenze

Lavorare mentre si studia deve avere trade-off:

- piu soldi;
- meno energia;
- piu stress;
- possibile peggioramento rendimento scolastico;
- maggiore indipendenza;
- conflitti familiari se i genitori non approvano.

### Criteri di accettazione

- Nessun full-time prima del completamento del liceo/high school, salvo casi speciali da abbandono scolastico con forti penalita.
- Lavori part-time disponibili dai 16 anni.
- Il paese puo modificare eta minima e opportunita.

---

## 13. Principi UI/UX da BitLife da mantenere e migliorare

### Obiettivo

Usare BitLife come riferimento per chiarezza e immediatezza, non come modello grafico da copiare.  
La struttura deve essere familiare per chi conosce i life simulator, ma il nostro gioco deve sembrare piu moderno, piu dinamico e piu sistemico.

### Header personaggio persistente

BitLife mantiene sempre visibili identita e stato del personaggio. Questo aiuta l'utente a non perdere mai il contesto della vita.

Nel nostro gioco l'header dovrebbe mostrare sempre:

- avatar o emoji del personaggio;
- nome;
- eta;
- anno corrente;
- lavoro, scuola o status principale;
- saldo disponibile;
- eventuale status speciale: famoso, criminale, studente, pensionato, in carcere, malato, in burnout.

### Criteri di accettazione

- L'header resta visibile nelle sezioni principali.
- Le informazioni sono leggibili anche su mobile.
- Lo status principale cambia dinamicamente in base alla vita del personaggio.

---

### Sezioni interne con intestazioni chiare

Negli screenshot BitLife funzionano bene intestazioni come:

- Favorites;
- All;
- Premium Activities;
- Vehicles;
- Possessions;
- Late Relationships.

Nel nostro gioco usare intestazioni simili, ma contestuali:

#### Relazioni

- Partner;
- Famiglia;
- Amici;
- Ex;
- Defunti;
- Animali.

#### Assets

- Finanze;
- Proprieta;
- Veicoli;
- Investimenti;
- Oggetti;
- Business.

#### Activities

- Preferiti;
- Corpo e Salute;
- Socialita;
- Rischio;
- Svago;
- Viaggi;
- Impostazioni.

#### Lavoro

- Tu;
- Scuola/Universita;
- Colleghi;
- Superiori;
- Opportunita.

### Criteri di accettazione

- Ogni sezione lunga deve essere divisa in blocchi leggibili.
- Le intestazioni devono aiutare la scansione, non decorare.
- L'utente deve capire dove si trova senza leggere istruzioni.

---

### Favoriti dinamici e azioni consigliate

BitLife usa i preferiti in Activities. Noi dovremmo migliorare il concetto: non solo preferiti manuali, ma anche azioni consigliate in base allo stato del personaggio.

Esempi:

- se stress alto: terapia, riposo, parla con un amico;
- se soldi bassi: cerca lavoretto, chiedi prestito, riduci spese;
- se partner arrabbiato: chiarisci, fai un regalo, prenditi distanza;
- se salute bassa: visita medica, riposo, dieta migliore;
- se scuola va male: studia, chiedi aiuto, parla coi genitori.

### Considerazione senior

Questo riduce la sensazione di menu infinito.  
L'utente vede subito cosa puo fare adesso, senza dover ricordare tutte le sezioni.

### Criteri di accettazione

- La Home o Activities mostra azioni consigliate contestuali.
- I preferiti possono essere manuali, ma il gioco puo suggerire azioni utili.
- Le azioni consigliate non devono sembrare tutorial, ma opportunita naturali.

---

### Persone come entita persistenti

BitLife conserva ex, defunti e relazioni importanti. Questa e una delle sue parti migliori per creare memoria emotiva.

Nel nostro gioco ogni NPC rilevante dovrebbe avere:

- nome;
- eta;
- ruolo;
- contesto di origine;
- rapporto attuale;
- memoria degli eventi principali;
- eventuale stato: vivo, morto, ex, collega, familiare, rivale, amico stretto.

### Regola di design

Gli NPC importanti non devono sparire quando cambia la sezione.  
Un collega puo diventare amico, rivale, partner o ex. Un ex puo restare nella memoria. Un defunto puo restare nella timeline.

### Criteri di accettazione

- Ex, defunti e vecchi rapporti restano consultabili.
- Ogni relazione importante conserva almeno un minimo di storia.
- Le azioni su un NPC possono generare conseguenze in altre sezioni.

---

### Barre e stati dentro le righe

BitLife mostra stati direttamente nelle righe: performance lavoro, stress, relationship, condition veicoli.  
Questo e molto utile per comunicare profondita senza aprire una schermata.

Nel nostro gioco usare barre o indicatori compatti per:

- partner: amore, fiducia, tensione;
- amici: affinita, fiducia, rivalita;
- colleghi: rapporto, competizione, rischio gossip;
- lavoro: performance, stress, rischio licenziamento;
- scuola: rendimento, stress, reputazione;
- auto/casa: condizione, valore, debito;
- animali: affetto, salute, eta;
- social: follower, reputazione, rischio scandalo.

### Criteri di accettazione

- Le righe importanti mostrano almeno uno stato visivo.
- Le barre non devono appesantire la lettura.
- Lo stato deve aggiornarsi dopo azioni ed eventi.

---

### Reward e premium integrati con eleganza

BitLife monetizza in modo molto visibile. Noi dobbiamo monetizzare, ma senza dare l'impressione di un gioco paywall-first.

Regole:

- reward visibili dalla Home;
- reward contestuali agli eventi;
- contenuti premium separati con label chiara;
- nessun banner che copra Age o il log vita;
- reward collegati a progressione, non solo pubblicita.

Esempi:

- "Hai ricevuto un bonus lavoro: guarda un ad per raddoppiarlo";
- "Ricompensa giornaliera disponibile";
- "Obiettivo completato: ritira premio";
- "Sblocca pacchetto premium" in una sezione dedicata e non invasiva.

### Criteri di accettazione

- Il reward e sempre raggiungibile dalla Home.
- Il reward ha contesto narrativo o progressivo.
- Le parti premium non interrompono il loop base.

---

### Age come centro fisico e mentale del gioco

Il pulsante `+ Age` deve essere il cuore dell'interfaccia.

Regole:

- sta al centro della bottom navigation;
- e piu grande degli altri tab;
- ha una micro-animazione quando e disponibile;
- dopo il click porta sempre a Vita;
- genera eventi, popup, log e conseguenze;
- non deve essere coperto da reward, modali o banner non essenziali.

### Criteri di accettazione

- L'utente capisce subito che `+ Age` e l'azione principale.
- Ogni avanzamento produce feedback visibile.
- La Home/Vita diventa il punto di rientro dopo ogni anno.

---

### Activities come hub, non lista piatta

BitLife usa una lista molto leggibile, ma visivamente datata.  
Noi dobbiamo mantenere la leggibilita, ma rendere Activities piu moderno.

Struttura consigliata:

1. azioni consigliate;
2. preferiti;
3. categorie compatte;
4. righe azione stile BitLife dentro ogni categoria;
5. ricerca/filtro solo se le attivita diventano troppe.

### Criteri di accettazione

- Activities non deve diventare un elenco infinito senza gerarchia.
- Le categorie devono essere riconoscibili in pochi secondi.
- Le azioni piu rilevanti devono emergere prima.

---

## 14. Sintesi delle modifiche da implementare

### Alta priorita

- Bloccare incesto, abusi su minori e interazioni sessuali inappropriate.
- Riorganizzare la navigazione principale in stile BitLife: Lavoro, Assets, Vita, Relazioni, Activities.
- Rendere Age centrale e riportare sempre alla Home.
- Aggiungere pop-up conseguenze per azioni, eventi e minigiochi.
- Aggiornare barre principali: Felicita, Salute, Intelligenza, Bellezza/Look, Fama dinamica.
- Aggiungere header personaggio persistente con status dinamico.
- Dividere sezioni lunghe con intestazioni interne chiare.

### Media priorita

- Rendere scuola automatica e coerente con paese/famiglia.
- Spostare incontri NPC dentro contesti reali.
- Integrare reward nella Home.
- Uniformare layout di Militare, Bodymod e Beauty.
- Aggiungere favoriti dinamici e azioni consigliate.
- Mostrare barre/stati direttamente nelle righe importanti.

### Bassa priorita, ma strategica

- Rafforzare rete sociale persistente.
- Rendere Assets piu aspirazionale.
- Rendere Relazioni una vera memoria sociale della vita del personaggio.
- Dare ad Activities una struttura piu moderna e meno lista piatta.
- Rendere ex, defunti, vecchi colleghi e vecchi amici consultabili nel tempo.
- Integrare premium/reward in modo visibile ma non invasivo.

---

## Direzione consigliata

La scelta migliore non e copiare BitLife, ma usare la sua struttura dove e chiaramente superiore:

- poche sezioni principali;
- Home centrale;
- Age come azione dominante;
- relazioni e patrimonio sempre visibili come pilastri della vita.

La nostra differenza deve essere:

- NPC piu persistenti;
- conseguenze piu interconnesse;
- eventi moderni e piu realistici;
- UI piu dinamica;
- reward piu integrati;
- maggiore profondita senza rendere la navigazione piu complicata.

Obiettivo finale: **un life simulator immediato come BitLife, ma piu moderno, piu sistemico e piu vendibile nel 2026**.
