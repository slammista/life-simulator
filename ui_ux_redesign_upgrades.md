# Life Simulator 2D — UI/UX Redesign Upgrade Plan

## Obiettivo

Rifinire in modo significativo il front end per trasformare il gioco da “web app React premium” a “mobile life simulator moderno, juicy e competitivo con BitLife”, senza modificare la struttura generale, il flow principale o la logica di gioco esistente.

Il redesign deve mantenere:

- stessa navigazione principale;
- stesso loop basato sul bottone `+1 Età`;
- stesse sezioni principali: Lavoro, Assets, Relazioni, Attività;
- stessa impostazione a tab e card;
- mobile-first come priorità assoluta.

Il focus non è rifare l’app. Il focus è aumentare game feel, attachment emotivo, chiarezza, ritmo e qualità percepita.

---

## Direzione generale

### Target visuale

Il gioco deve sembrare un life simulator mobile moderno, non una dashboard.

Direzione consigliata:

- cozy arcade;
- dark premium;
- cartoon;
- morbido;
- veloce;
- colorato ma non infantile;
- semplice da capire in 2 secondi;
- piacevole da toccare ripetutamente.

### Da evitare

- redesign totale;
- cyberpunk pesante;
- UI troppo SaaS;
- card tutte identiche;
- copia diretta di BitLife;
- animazioni lente;
- editor avatar troppo complessi;
- nuova logica gameplay dentro le PR di polish.

---

# PR 1 — Visual Foundation

## Obiettivo

Creare una base visiva coerente che tolga subito la sensazione “React-basic”.

## Task

### 1. Design tokens globali

Centralizzare:

- colori;
- spacing;
- radius;
- shadow;
- typography;
- z-index;
- motion duration;
- easing;
- safe area variables.

Esempio categorie token:

```css
--bg-base;
--bg-elevated;
--surface-card;
--surface-glass;
--text-primary;
--text-secondary;
--accent-primary;
--accent-success;
--accent-danger;
--accent-warning;
--radius-card;
--radius-pill;
--shadow-soft;
--shadow-glow;
--motion-fast;
--motion-normal;
```

### 2. Background ambientale

Aggiungere profondità senza sporcare:

- radial gradient dietro header;
- glow leggero dietro AgeButton;
- noise texture quasi invisibile;
- sfondo meno piatto;
- separatori più morbidi.

### 3. Tipografia

Rendere la gerarchia più da gioco:

- titoli più forti;
- numeri più grandi;
- label secondarie più leggere;
- spacing verticale più arioso;
- peso maggiore per soldi, età, salario, stats.

Font consigliati:

- Plus Jakarta Sans;
- Outfit;
- Satoshi;
- Inter solo se molto customizzato nei pesi.

### 4. Componenti base

Prima di creare nuovi componenti, verificare se esistono già componenti equivalenti e rifinirli invece di duplicarli.

Rifinire o creare solo se necessario:

- Button;
- Card;
- Badge;
- Pill;
- Tab;
- StatBar;
- BottomNavItem;
- Modal;
- Toast;
- EmptyState;
- LockedState.

## Acceptance criteria

- La UI resta identica nella struttura.
- I componenti usano token globali.
- Nessuna duplicazione inutile di componenti.
- Il look è più coerente su tutte le schermate.
- Nessuna regressione mobile.
- Safe area rispettata su iPhone.

---

# PR 2 — Player Card Header + Avatar Base

## Obiettivo

Trasformare l’header da barra informazioni a vera scheda personaggio.

## Task

### 1. Header come Player Card

L’header deve comunicare subito:

- chi è il personaggio;
- età;
- anno;
- stato/lavoro;
- soldi;
- mood generale;
- stats principali.

Il personaggio deve essere il centro emotivo della UI.

### 2. Avatar più protagonista

L’avatar deve diventare più grande e riconoscibile:

- bordo glow morbido;
- stato emotivo visibile;
- eventuale outfit futuro;
- coerenza con relazioni, eventi e profilo.

### 3. Stat bars più gamey

Le stat devono sembrare “life vitals”, non semplici progress bar.

Migliorie:

- animazione quando cambiano;
- colore coerente per stat;
- glow leggero quando aumentano;
- feedback visivo quando diminuiscono;
- valori leggibili ma non ingombranti.

### 4. Wallet chip

I soldi devono stare in una chip premium:

- contrasto alto;
- count-up animation quando cambiano;
- formato compatto: `€2.1M`, `€400`, `€1.9B`.

## Acceptance criteria

- L’header è più riconoscibile e meno dashboard.
- Avatar, nome, età e soldi sono leggibili al primo colpo.
- Le stats restano compatte.
- Nessun cambio strutturale alla navigazione.

---

# PR 3 — AgeButton + Event Flow

## Obiettivo

Rendere il bottone `+1 Età` il cuore dopaminico del gioco.

## Task

### 1. AgeButton juicy

Il bottone deve sembrare il pulsante principale del gioco.

Stato normale:

- glow controllato;
- micro pulse lento;
- bordo luminoso;
- label chiara;
- pressione visivamente soddisfacente.

Al tap:

- scale down/up;
- flash radial leggero;
- haptic se supportato;
- sound hook opzionale;
- micro particles opzionali;
- blocco anti double tap se necessario.

### 2. Overlay cambio anno

Dopo il tap, mostrare una micro sequenza:

```txt
1970
Età 20
```

Poi far entrare gli eventi uno alla volta.

### 3. Event cards animate

Il feed eventi deve diventare più narrativo.

Esempi:

```txt
🎂 Compleanno
Hai compiuto 20 anni.
```

```txt
💼 Nuove opportunità
Sono disponibili nuovi lavori part-time.
```

```txt
❤️ Relazione migliorata
Laura ti ha scritto.
```

Ogni evento può avere:

- icona;
- categoria;
- titolo;
- descrizione breve;
- impatto sulle stats;
- colore positivo/negativo/neutro;
- eventuale CTA.

### 4. Reduced motion

Se l’utente ha `prefers-reduced-motion`, ridurre:

- particles;
- scale animation;
- overlay troppo dinamici;
- transizioni lunghe.

## Acceptance criteria

- Premere `+1 Età` è più soddisfacente.
- Gli eventi sono più leggibili e narrativi.
- Le animazioni non rallentano il loop.
- Reduced motion rispettato.
- Nessun cambiamento alla logica principale del gioco.

---

# PR 4 — Game Cards Redesign

## Obiettivo

Trasformare le card da blocchi informativi a oggetti da gioco.

## Principio

Ogni card deve rispondere a tre domande:

1. Che cos’è?
2. Perché mi interessa?
3. Cosa posso fare adesso?

## Task

### 1. Job cards

Rendere le offerte lavoro più narrative.

Da evitare:

```txt
Babysitter
Care
Stress 25%
Part-time
Candidati
```

Meglio:

```txt
👶 Babysitter
Tieni d’occhio piccoli terremoti dopo scuola.

€400–800 / mese
Stress basso · Part-time
Richiede: fedina pulita

[Candidati]
```

Migliorie visuali:

- icona lavoro più forte;
- salario più evidente;
- badge meno pesanti;
- CTA più juicy;
- background leggermente differenziato per categoria;
- tap feedback su tutta la card.

### 2. Activity cards

Ogni attività deve sembrare una scelta di gameplay.

Aggiungere:

- payoff previsto;
- rischio se presente;
- costo;
- impatto potenziale;
- lock state se non disponibile.

### 3. Relationship cards

Le relazioni devono sembrare vive.

Aggiungere:

- avatar persona;
- mood;
- relazione attuale;
- barra affetto;
- ultimo evento/nota breve;
- CTA rapida.

### 4. Asset cards

Rendere finanze e assets più premium:

- numeri più forti;
- mini trend/sparkline se utile;
- stato portfolio;
- empty state più chiaro;
- CTA contestuale.

### 5. Empty states

Sostituire testi freddi con copy più narrativo ma universale.

Esempi:

```txt
Sei ancora piccolo per il mercato serio. Cresci o sblocca nuove skill.
```

```txt
Nessun investimento attivo. A 18 anni potrai iniziare a far crescere il capitale.
```

```txt
Poche relazioni attive. Esci, incontra persone e costruisci legami.
```

## Acceptance criteria

- Le card sembrano più da gioco e meno da dashboard.
- Le informazioni restano più leggibili di prima.
- La struttura delle schermate non cambia.
- Le CTA principali sono sempre chiare.
- Nessuna card introduce gameplay non previsto.

---

# PR 5 — Avatar System & Character Customization

## Obiettivo

Aumentare attachment emotivo creando un avatar modulare riconoscibile e customizzabile.

## Principio

L’avatar non deve essere un clone di BitLife. Deve prendere il concetto di personaggio semplice e customizzabile, ma con stile originale.

## Requisiti tecnici

Costruire un sistema modulare con layer separati.

Layer consigliati:

- Head;
- Skin;
- Eyes;
- Brows;
- Hair;
- Beard;
- Accessories;
- Clothes;
- Mood expression.

Preferire SVG modulari a PNG quando possibile.

Motivi:

- scalabilità;
- peso basso;
- colori dinamici;
- facile aggiunta nuove varianti;
- migliore resa su mobile.

### Regole

- Non creare editor realistico.
- Non usare slider complessi.
- Non mostrare troppe opzioni insieme.
- Ogni modifica deve essere immediata e visibile.
- Il sistema deve essere leggero.
- Riutilizzare componenti esistenti dove possibile.

## Creazione personaggio iniziale

Alla creazione della vita, permettere personalizzazione semplice:

- nome;
- genere;
- paese;
- avatar base;
- capelli;
- pelle;
- occhi;
- sopracciglia.

Il processo deve durare pochi secondi.

## Customizzazione durante il gameplay

### Barbiere

Permette di modificare:

- capelli;
- barba;
- sopracciglia.

Regole gameplay:

- costo in denaro;
- possibile effetto su Look;
- preview live;
- conferma chiara.

### Estetista / Beauty

Permette di modificare:

- makeup;
- pelle;
- accessori;
- piercing;
- tattoo;
- dettagli estetici.

Regole gameplay:

- costo;
- effetto potenziale su Look;
- possibilità di espandere in futuro con cosmetici speciali.

## Evoluzione con l’età

L’avatar deve cambiare leggermente nel tempo.

Esempi:

- bambino: volto più morbido, occhi più grandi;
- adolescente: acne opzionale, primi baffi;
- adulto: barba, stile più maturo;
- anziano: capelli bianchi, rughe leggere.

I cambiamenti devono essere stilizzati e leggeri, non realistici o pesanti.

## Future-proofing

Il sistema deve supportare in futuro:

- outfit legati al lavoro;
- accessori rari;
- cosmetic rewards;
- skin pack;
- eventi speciali;
- stagioni;
- monetizzazione cosmetica non pay-to-win.

## Acceptance criteria

- Avatar renderizzato correttamente su mobile.
- Cambio look aggiornato in tempo reale.
- Avatar coerente in header, profilo e relazioni.
- Nessun impatto significativo sulle performance.
- Sistema compatibile con dark UI.
- Funzionamento corretto con safe area mobile.
- Reduced motion rispettato dove necessario.

---

# PR 6 — Motion, Feedback, Sound & Haptics

## Obiettivo

Aggiungere feedback sensoriale leggero per rendere ogni azione più soddisfacente.

## Task

### 1. Tap feedback globale

Applicare feedback a:

- card tappabili;
- tab;
- CTA;
- bottom nav;
- AgeButton;
- modal actions.

Pattern consigliato:

- scale `0.98` al press;
- ritorno spring;
- durata breve;
- nessun lag.

### 2. Stat change feedback

Quando una statistica cambia:

- count-up/count-down;
- colore temporaneo;
- delta visivo `+5`, `-3`;
- micro glow.

### 3. Money feedback

Quando i soldi cambiano:

- count-up;
- chip flash;
- delta temporaneo.

### 4. Toast system

Usare toast brevi per azioni rapide:

```txt
✅ Candidatura inviata
```

```txt
💰 Hai guadagnato €400
```

```txt
⚠️ Salute -5
```

### 5. Sound opzionale

Preparare hook per:

- tap principale;
- successo;
- errore;
- reward;
- level/year up.

I suoni devono poter essere disattivati.

### 6. Haptics

Se il browser/dispositivo supporta vibrazione:

- tap leggero su CTA;
- feedback medio su `+1 Età`;
- feedback diverso per evento negativo/positivo.

## Acceptance criteria

- Ogni azione importante ha feedback entro 100ms.
- Le animazioni non disturbano.
- Tutto funziona anche senza audio/haptics.
- Reduced motion rispettato.
- Nessun rallentamento percepibile.

---

# PR 7 — Polish Finale & QA Mobile

## Obiettivo

Ripulire tutto e validare il feeling finale su dispositivi reali.

## Checklist QA

### Mobile

- iPhone Safari;
- Android Chrome;
- viewport piccoli;
- safe area superiore/inferiore;
- scroll fluido;
- bottom nav sempre accessibile;
- nessun elemento coperto dalla barra browser.

### Accessibilità

- contrasto testi;
- target touch minimi;
- focus states;
- reduced motion;
- testi leggibili;
- colori non usati come unico segnale.

### Performance

- nessun jank su scroll;
- animazioni fluide;
- bundle non esploso per avatar;
- lazy load dove serve;
- immagini/SVG ottimizzati.

### Coerenza

- stessa lingua ovunque;
- niente mix casuale italiano/inglese;
- icone coerenti;
- spacing coerente;
- CTA primarie sempre riconoscibili.

## Acceptance criteria

- Il gioco sembra più mobile game che web app.
- Il loop `+1 Età` è più soddisfacente.
- L’avatar aumenta l’attaccamento al personaggio.
- Le card sembrano scelte di gioco.
- La struttura originale è rimasta invariata.

---

# Priorità assolute

Se bisogna tagliare scope, mantenere solo queste cinque priorità:

1. Avatar modulare grande e vivo.
2. AgeButton con overlay cambio anno.
3. Card redesign più narrativo e juicy.
4. Background ambientale premium.
5. Event feed animato.

Queste sono le modifiche che spostano davvero il prodotto da “React app” a “life simulator mobile moderno”.

---

# Regole finali per l’implementazione

- Non modificare la struttura principale dell’app.
- Non cambiare il gameplay core durante il redesign.
- Non introdurre feature fuori scope dentro PR di polish.
- Non duplicare componenti esistenti senza motivo.
- Non inseguire un redesign infinito.
- Ogni PR deve essere piccola, testabile e reversibile.
- Ogni modifica deve rendere il gioco più immediato, più leggibile o più soddisfacente da toccare.

Il target finale non è una UI “più bella”.

Il target finale è una UI più giocabile.
