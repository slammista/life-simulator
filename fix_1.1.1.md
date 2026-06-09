# Fix 1.1.1 — Feature Backlog & Bug Fixes

## Bug Fix: Stat cap overflow sul tick annuale
**Problema**: Quando si avanza di un anno, le statistiche possono salire/scendere di più di ±3 per azione ordinaria.  
**Fix richiesto**: Ogni effetto ordinario (non evento speciale) deve applicare clamp a ±3 per stat per source.  
**Stato**: ⏳ Da fare

---

## Bug Fix: Barra studio parte da 3/4
**Problema**: La barra del progresso educativo parte da 0% invece che da 3/4 (75%) come da aspettativa.  
**Fix richiesto**: La progress bar di education (GPA/progresso) deve iniziare a 75% per riflettere che l'iscrizione implica già un percorso avanzato.  
**Stato**: ⏳ Da fare

---

## Bug Fix: Diminishing returns hard block
**Problema**: Il messaggio "hai già fatto questa azione più volte" riduce solo l'efficacia ma non blocca l'azione.  
**Fix richiesto**: Quando scatta il cap delle azioni ripetute, l'azione deve essere completamente bloccata (pulsante disabled + messaggio), e sbloccarsi all'anno successivo.  
**Stato**: ⏳ Da fare

---

## Feature: Event pop-up modal system
**Descrizione**: Gli eventi devono apparire come modal overlay (stile BitLife) con:
- Header colorato per categoria (Justice=rosso, Illness=verde, Prison=grigio scuro, Career=arancio, ecc.)
- Avatar/emoji dell'NPC coinvolto (se presente)
- Titolo in grassetto
- Descrizione dell'evento
- 4 pulsanti di scelta (o OK se evento informativo)
- Link "Surprise me!" opzionale
- Overlay su tutto lo schermo, bloccante
- Funziona per **tutti** gli eventi, non solo epici/leggendari
**Stato**: ⏳ Da fare

---

## Feature: Più NPC per scuola e lavoro

### Scuola
- **20 studenti** per classe (elementare, medie, liceo, università)
- **6 professori/maestri** in sezione separata "Professori"
- Sezione UI separata per studenti vs professori

### Lavoro
- **10 colleghi** dello stesso livello
- **5 superiori** (manager/responsabile)
- **1 CEO** (unico, visibile come figura separata)
- Sezione UI separata per livelli gerarchici

**Stato**: ⏳ Da fare

---

## Feature: Sistema ore/effort settimanale

### Regole
- Ogni persona ha **80 ore/settimana** di autonomia
- A **60 ore** occupate → stress al 98%
- Sopra 60 ore per troppo tempo → salute scende, problemi psicologici
- Lavoro full-time = 40 ore/settimana
- Scuola = 40 ore/settimana
- Attività scolastiche extra:
  - Sport completo: 8 ore/settimana
  - Drama club: 8 ore/settimana
  - Gruppo musicale: 8 ore/settimana
  - Altre attività: 4 ore/settimana ciascuna
- Il giocatore a scuola (40h) può aggiungere:
  - 1 lavoro part-time (≈20h) 
  - OPPURE fino a 3 attività extra (8+8+4 = 20h)

### UI
- Barra visiva "ore occupate / 80" nel profilo
- Colore verde → giallo → rosso al superare le soglie
- Avviso quando si supera 60 ore

**Stato**: ⏳ Da fare

---

## Feature: Psicologo preventivo
**Descrizione**: Si può andare dallo psicologo anche senza disturbi psicologici diagnosticati. Il trattamento preventivo:
- Aumenta `resilience` e `mentalHealth`
- Riduce la probabilità di sviluppare disturbi futuri
- Costa la stessa tariffa delle sessioni normali

**Stato**: ⏳ Da fare

---

## Feature: Social media esteso
**Piattaforme da aggiungere** (in aggiunta/sostituzione di quelle esistenti):
- Facebook
- Instagram
- Twitch
- YouTube
- Podcast
- OnlyFans
- Twitter/X

### Azioni per piattaforma
Ogni piattaforma ha azioni specifiche (post, live, video, contenuto, ecc.) con conseguenze sulla vita reale:

| Piattaforma | Conseguenze particolari |
|---|---|
| OnlyFans | Genitori, partner, amici si arrabbiano; reputazione -; guadagno + |
| Twitter/X | Post politici generano reazioni da NPC con orientamento opposto |
| YouTube | Build lento, guadagno nel tempo |
| Twitch | Richiede molte ore (peso sul sistema ore/settimana) |
| Podcast | Build lento, credibilità + |
| Instagram | Looks-dependent, influisce su socialReputation |
| Facebook | Più anziani, genitori reagiscono; privacy concerns |

**Stato**: ⏳ Da fare

---

## Feature: Attributi NPC estesi

### Orientamento politico
Valori: `sinistra` | `centro-sinistra` | `centro` | `centro-destra` | `destra` | `apolitico`
- Influenza affinità con player e altri NPC
- Post sui social generano reazioni basate su orientamento politico

### Religione NPC
Valori: (già esistente nel sistema ma da aggiungere agli NPC)
- Stessa influenza sull'affinità

### Attributi carattere (stile BitLife)
Ogni NPC (Relationship, WorkNPC, SchoolNPC) deve avere:
- `craziness`: 0-100 — impulsività e comportamento imprevedibile
- `fertility`: 0-100 — rilevante per partner/spouse
- `willpower`: 0-100 — resilienza e capacità di mantenere impegni
- `smarts`: 0-100 — intelligenza dell'NPC
- `sexuality`: orientamento sessuale

### Regola affinità/soldi/look
- Alta differenza di ricchezza o look → riduce stabilità della relazione
- Se affinità bassa + bassa cura della relazione → la relazione va verso rovina

**Stato**: ⏳ Da fare

---

## Feature: God Mode a pagamento — €5.99
**Descrizione**: Le funzioni God Mode (modifica attributi, stat illimitate, ecc.) devono essere protette da paywall a €5.99 con:
- Schermata di acquisto in-app
- Pulsante "Sblocca God Mode — €5.99"
- Dopo acquisto: accesso permanente a tutte le opzioni god mode

**Stato**: ⏳ Da fare

---

# Stato implementazione

| Feature | Priorità | Stato |
|---|---|---|
| Fix stat cap overflow | Critica | ⏳ |
| Fix barra studio 3/4 | Alta | ⏳ |
| Diminishing returns hard block | Alta | ⏳ |
| Event pop-up modal | Alta | ⏳ |
| NPCs scuola 20+6 | Alta | ⏳ |
| NPCs lavoro 10+5+1 | Alta | ⏳ |
| Sistema ore/effort settimanale | Media | ⏳ |
| Psicologo preventivo | Media | ⏳ |
| Social media esteso (7 piattaforme) | Media | ⏳ |
| Attributi NPC estesi (politics, religion, craziness, fertility, willpower, smarts) | Media | ⏳ |
| God Mode €5.99 | Bassa | ⏳ |

**Progresso sessione attuale: 0% — implementazione in corso**
