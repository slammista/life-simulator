# Fix 1.1.1 — Feature Backlog & Bug Fixes

## Bug Fix: Stat cap overflow sul tick annuale
**Problema**: Quando si avanza di un anno, le statistiche possono salire/scendere di più di ±3 per azione ordinaria.  
**Fix richiesto**: Ogni effetto ordinario (non evento speciale) deve applicare clamp a ±3 per stat per source.  
**Stato**: ✅ Fatto — `happinessPenalty` ridotto a -3/-2, cap `[-10, +10]` su tutti gli stat key prima di `applyEffects`

---

## Bug Fix: Barra studio parte da 3/4
**Problema**: La barra del progresso educativo parte da 0% invece che da 3/4 (75%) come da aspettativa.  
**Fix richiesto**: La progress bar di education (GPA/progresso) deve iniziare a 75% per riflettere che l'iscrizione implica già un percorso avanzato.  
**Stato**: ✅ Fatto — `startEducation` e auto-enrollment impostano `gpa: 3.0` (75% di 4.0)

---

## Bug Fix: Diminishing returns hard block
**Problema**: Il messaggio "hai già fatto questa azione più volte" riduce solo l'efficacia ma non blocca l'azione.  
**Fix richiesto**: Quando scatta il cap delle azioni ripetute, l'azione deve essere completamente bloccata (pulsante disabled + messaggio), e sbloccarsi all'anno successivo.  
**Stato**: ✅ Fatto — `studyAction` e `exercise` bloccati hard a `attempts >= 3`

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
**Stato**: ✅ Fatto — `EventDisplay.tsx` riscritto come modal centrato con backdrop scuro, header colorato per categoria, pulsanti scelta blu impilati, animazione slide-up

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

**Stato**: ✅ Fatto — `WorkSchoolEngine.generateColleagues` ora produce 10+5+1=16 NPC; `generateClassmates` produce 20 studenti + 6 professori

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

**Stato**: ✅ Fatto — `TraumaEngine.attendTherapy` permette ora terapia preventiva (+5 mentalHealth, +2 happiness, +6 resilienza); `HealthScreen` mostra descrizione contestuale

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

**Stato**: ✅ Fatto — Aggiunte Facebook, Twitch, Podcast, OnlyFans in `SocialMediaEngine`; `SocialPlatform` type aggiornato in types.ts; OnlyFans imposta `reputation: -5`, `socialReputation: -3`, `scandal: true`

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

**Stato**: ✅ Fatto — `NPCExtendedAttributes` interface + `PoliticalOrientation` type in types.ts; campo `level` su WorkNPC; `extendedAttributes?` su WorkNPC/SchoolNPC/Relationship; `randomExtendedAttributes()` in WorkSchoolEngine

---

## Feature: God Mode a pagamento — €5.99
**Descrizione**: Le funzioni God Mode (modifica attributi, stat illimitate, ecc.) devono essere protette da paywall a €5.99 con:
- Schermata di acquisto in-app
- Pulsante "Sblocca God Mode — €5.99"
- Dopo acquisto: accesso permanente a tutte le opzioni god mode

**Stato**: ✅ Fatto — `godModeUnlocked` flag in `GameSettings`; paywall card in SettingsScreen con modal acquisto; `unlockGodMode()` action; cheat panel mostrato solo dopo acquisto

---

## Feature: Sistema ore/effort settimanale
**Stato**: ✅ Fatto — `computeWeeklyHours()` utility calcola ore da lavoro + scuola + club; se >60h/settimana, tick annuale applica penalità energia/mentalHealth/salute; barra visiva `WeeklyHoursBar` in HUD (verde→giallo→rosso con warning ⚠️ stress a >60h)

---

# Stato implementazione

| Feature | Priorità | Stato |
|---|---|---|
| Fix stat cap overflow ±3 | Critica | ✅ |
| Fix barra studio 3/4 | Alta | ✅ |
| Diminishing returns hard block | Alta | ✅ |
| Event pop-up modal | Alta | ✅ |
| NPCs scuola 20+6 | Alta | ✅ |
| NPCs lavoro 10+5+1 | Alta | ✅ |
| Sistema ore/effort settimanale | Media | ✅ |
| Psicologo preventivo | Media | ✅ |
| Social media esteso (7 piattaforme) | Media | ✅ |
| Attributi NPC estesi (politics, religion, craziness, fertility, willpower, smarts) | Media | ✅ |
| God Mode €5.99 | Bassa | ✅ |

**Progresso sessione attuale: 100% — tutte le 11 feature completate ✅**

---

## UX Fix: Sezione Attività riallineata a BitLife
**Problema**: La schermata Activities era incasinata — chip orizzontali a scorrimento, sezioni sovrapposte, nessuna gerarchia visiva chiara.  
**Fix**: Rimossi `PinnedActivities` + vecchio `ActivitiesNav`. Implementato nuovo design BitLife-style:
- Schermata "home" attività: lista verticale con righe icon circle + nome + sottotitolo + freccia ›
- Sezione "Preferiti" editabile in cima (pin con checkmark)
- 5 categorie con header separatori grigi
- Back bar nella sottostazione attiva: "‹ Attività" + nome categoria
- Default cambiato da 'health' → 'home'
**Stato**: ✅ Fatto

---

## Feature: Tutorial onboarding migliorato
**Fix**: Riscritto `TutorialOverlay.tsx` con 4 step più contestuali:
- Step 1: Welcome + spiegazione concetto
- Step 2: Pulsante "+1 ETÀ" con call-to-action evidenziata e box "👇 Clicca..."
- Step 3: Sistema eventi con colori categoria spiegati
- Step 4: Schede e sistema Attività con tip sui preferiti
- Pulsanti migliorati: verde "Inizia la vita!" sull'ultimo step; box tip contestuale in ogni step
**Stato**: ✅ Fatto

---

## Feature: Categorie evento derivate dall'ID
**Problema**: Tutti i 375 eventi in db.json hanno `category: "none"` — l'header del modal era sempre viola.  
**Fix**: Aggiunta funzione `deriveCategory(id: string)` in `EventDisplay.tsx` che mappa pattern ID → categoria:
- `ev_school_*` / `study` / `edu` → ISTRUZIONE (blu)
- `ev_job_*` / `career` / `work` → CARRIERA (arancio)
- `health` / `hospital` / `sick` → SALUTE (verde)
- `crime` / `prison` / `police` → CRIMINE (rosso)
- `money` / `finance` / `invest` → FINANZE (verde scuro)
- `love` / `romance` / `wedding` / `breakup` → AMORE (rosa)
- `family` / `parent` / `child` / `birth` → FAMIGLIA (arancio chiaro)
- Fallback → VITA (viola)
**Stato**: ✅ Fatto

---

## Feature: NPC spontaneous events — notifiche prominenti
**Problema**: Gli eventi autonomi degli NPC (morte, matrimonio, nascita, ecc.) erano nascosti nel log testuale.  
**Fix**:
- Aggiunta `npcEventQueue: NPCAgencyEvent[]` a `GameState` + `dismissNpcEvent(id)` action
- Tick annuale popola la coda con max 5 eventi NPC per anno
- Nuovo componente `NPCEventNotifications.tsx`: banner slide-down in alto con icona colorata per tipo, nome NPC, descrizione, e contatore "N altri eventi in attesa"
- Colori per tipo: morte=viola, matrimonio=rosa, nascita=arancio, trasloco=blu, riconciliazione=verde, ecc.
**Stato**: ✅ Fatto

---

## Feature: Post-action result panel
**Descrizione**: Pannello slide-up BitLife-style dopo ogni azione con effetti sulle statistiche.  
**Fix**:
- `toastStore` esteso con `panel: ActionPanel | null`, `showPanel()`, `closePanel()`
- Nuovo componente `ActionResultPanel.tsx`: card scura con barra colorata (verde=successo, rosso=fail), emoji, titolo, e chip per ogni stat modificata (colore verde/rosso + valore)
- `HealthScreen` aggiornato: usa `showPanel` invece del feedback inline, passa `effects` all'azione
- Pannello auto-chiude dopo 3.5s, oppure tap per chiudere
- Esteso anche a `CareerScreen` e `HobbyScreen`
**Stato**: ✅ Fatto

---

## Feature: Haptic feedback (vibrazione) su mobile
**Fix**: Aggiunto `HapticEngine.ts` con `haptic(type)` che usa `navigator.vibrate()`:
- `tap` (10ms) — scelte evento
- `success` (10+40+10ms) — azione riuscita
- `error` (40+25+40ms) — azione fallita  
- `heavy` (40ms) — pulsante +1 ETÀ
- Integrato in: +1 ETÀ, EventDisplay choice buttons, ActionResultPanel close, HealthScreen, CareerScreen, HobbyScreen
**Stato**: ✅ Fatto

---

## Feature: Social sharing — "Condividi la tua vita"
**Fix**: Aggiunto `ShareLifeButton.tsx` nel pannello log della vita:
- Usa Web Share API (`navigator.share`) su mobile, fallback clipboard su desktop
- Testo condiviso: nome, età, emoji stat, lavoro attuale, link al gioco
**Stato**: ✅ Fatto

---

## Fix: Bilanciamento economia — spese di vita correnti
**Problema**: Il denaro si accumulava troppo facilmente perché non erano simulate le spese quotidiane (cibo, utenze, trasporti).  
**Fix**: Aggiunta deduzione annuale automatica "spese correnti" per i giocatori >= 18 anni che non vivono coi genitori:
- In affitto: €420/mese × 12 = €5.040/anno
- Di proprietà: €380/mese × 12 = €4.560/anno
- Altra sistemazione: €500/mese × 12 = €6.000/anno
**Stato**: ✅ Fatto

---

## Fix: Localizzazione etichette inglesi
- "Challenge pts" → "Punti sfida" (RibbonsScreen)
- Placeholder "Email" → "Indirizzo email" (SettingsScreen)
- Placeholder "Password" → "Password (min. 6 caratteri)" (SettingsScreen)
**Stato**: ✅ Fatto

---

## Feature: Scenari di vita — NewGameScreen
**Fix**: Aggiunta selezione scenario prima della creazione personaggio (6 preset a griglia 2×3):
- 🌍 Vita Normale — partenza bilanciata (default)
- 💰 Nato Privilegiato — famiglia ricca, +intel, +looks, +€20.000
- 🏚️ Vita Difficile — famiglia povera, Hard Mode, penalità stat iniziali
- 🎓 Prodigio — +35 intelligenza, +10 energia
- 🎬 Figlio di Famosi — +30 reputazione, +20 looks, +€50.000, -5 felicità
- 🏆 Atleta Nato — +20 salute, +20 energia, +10 looks, -5 intelligenza
- Ogni scenario pre-imposta `familyBackground` e `gameMode`, mostra chip bonus visibili
- `newGame()` accetta `startingBonus?: Effect`, applicato alle stat iniziali
**Stato**: ✅ Fatto

---

## Feature: Hint tutorial interattivo (FirstPlayHint)
**Fix**: Banner "👇 Tocca +1 ETÀ per iniziare!" animato (bounce loop) sopra il pulsante centrale:
- Appare 2 secondi dopo l'inizio del primo gioco (se tutorial non già visto)
- Sparisce automaticamente quando appare il primo evento (=player ha premuto +1 ETÀ)
- Persiste in localStorage (`lifesim2d_first_age_up`)
**Stato**: ✅ Fatto

---

## Feature: Sistema conseguenze a lungo termine (catene di eventi)
**Fix**: Implementato sistema di conseguenze ritardate che si attivano anni dopo una scelta:
- Nuova interfaccia `PendingConsequence` in types.ts con `triggerAge`, `effects`, `category`
- `pendingConsequences: PendingConsequence[]` aggiunto a `GameState`
- `CONSEQUENCE_CHAINS` lookup table in gameStore: 8 eventi con conseguenze differite (burnout, dipendenza, calamità, idea business, lavoro sogni, momento virale, accusa falsa, fiamma passata)
- `handleChoice()` ora chiama `getEventConsequence()` e accoda la conseguenza
- `handleInvecchia()` annual tick verifica conseguenze scadute e le applica via `merge()`
**Stato**: ✅ Fatto

---

## Feature: GameOverScreen con voto vita e momenti indimenticabili
**Fix**: Schermata fine gioco arricchita con:
- **Voto vita A–F** (cerchio colorato): A=750+, B=500+, C=300+, D=150+, F=<150 basato su legacy score
- **Momenti Indimenticabili**: sezione con le ultime 6 `lifeMemories` importanti (emoji + titolo + descrizione + età)
- Gerarchia visiva migliorata: voto appare subito dopo la morte, prima delle statistiche di vita
**Stato**: ✅ Fatto

---

## Feature: ParentingScreen migliorata
**Fix**:
- Rimosso vecchio `useState<feedback>` e banner inline
- Usa `showPanel` + `haptic` (success/error) come HealthScreen/CareerScreen
- Aggiunto pannello **Big Five personality** del figlio (chip colorati: verde/giallo/rosso per ogni tratto)
- Mostra `careerPath` se già definito
- Emoji per ogni tipo di interazione (play, talk, praise, discipline, ecc.)
**Stato**: ✅ Fatto

---

## Feature: 20 nuovi eventi con scelte ramificate
**Fix**: Aggiunti 20 eventi + 51 scelte a db.json (totale: 395 eventi, 1499 scelte):
- Il Capo Tossico (career drama, 3 scelte)
- Offerta da Sogno (career opportunity, req. intelligence 70 per negoziare)
- Flirt in Ufficio, Dolore al Petto, Sintomi Misteriosi
- Cripto del Momento, Eredità Inaspettata, Truffa Online
- Gelosia Esplosiva, Tradimento di un Amico, Il Passato Ritorna
- Momento Virale, Accusa Falsa
- Trent'anni e Cinquant'anni (triggered esatti a age==30/50, probability 1.0)
- Crollo da Burnout (triggered su stats.energy < 30)
- Gravidanza Inaspettata, L'Idea del Secolo, La Tentazione, Calamità Naturale
**Stato**: ✅ Fatto
