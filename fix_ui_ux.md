# fix_ui_ux.md

---
## 📊 STATO DI AVANZAMENTO — UI/UX

> Ultimo aggiornamento: 2026-06-08

| # | Sezione | Stato | Note |
|---|---------|-------|------|
| PR1 | Design tokens globali | ✅ Completo | index.css: --primary, --gold, --green, --red, --radius-*, --shadow-*, --transition-* + emotion-stable aggiornato |
| PR1 | `.card` enhanced | ✅ Completo | border-radius 16px, box-shadow, border-soft; varianti card-action/card-reward/card-warning/card-locked |
| PR1 | `.stat-bar` 6px | ✅ Completo | height 4px→6px, colore low-stat rosso semantico |
| PR2.1 | HUD / Player Card | ✅ Completo | Avatar con ring colorato per wellbeing, wallet pill verde, bank balance secondario, stat bar spesse |
| PR2.2 | AgeButton | ✅ Completo | Glow viola forte, border luminoso, tap-scale onPointerDown/Up, pulse aggiornato a purple |
| PR2.3 | BottomNav | ✅ Completo | Backdrop-blur, box-shadow elevated, active dot indicator, tab-btn.active → var(--primary) |
| PR2.4 | Card system CSS | ✅ Completo | Classi card-action/reward/warning/locked + tap-scale helper class |
| PR3.1 | Age Transition Overlay | ✅ Completo | AgeTransitionOverlay.tsx: overlay cinematico 1.2s con età/anno/tagline, prefers-reduced-motion respected |
| PR3.2 | Event Feed | ✅ Completo | EventLog.tsx: colori semantici per entry (positive/negative/social/career), empty state gamey |
| PR3.3 | Toast | ✅ Completo | ToastNotification.tsx: blur, shadow forte, dismiss × button, bottom safe-area aware |
| PR3.2b | EventDisplay | ✅ Completo | Choice buttons più gamey (primary tint per prima scelta), rarity badges colorati, empty state con emoji |
| PR3.4 | Empty states gamey | ✅ Completo | Tutti gli screen principali aggiornati: Career, Health, Hobby, Finance, EventLog, EventDisplay, Travel, Criminal |
| PR3.5 | Locked states | ✅ Completo | SubstanceScreen (<13), DatingScreen (<18), SocialMediaScreen (<13), PoliticsScreen (<18), PetScreen (<18), CriminalScreen (prigione) |
| PR3.6 | Tap-scale micro-interactions | ✅ Completo | GamblingScreen (Gioca, Scommetti), SubstanceScreen (alcol + fumo card-buttons) con .tap-scale |
| PR3.7 | Card-action class applicata | ✅ Completo | CareerScreen job offer cards → card-action class |
| PR2.1 HUD | Stat flash micro-animation | ✅ Completo | Stat values flash (scale 1.35×) quando cambiano; prefers-reduced-motion respected |
| QA mobile | Safe area, scroll, tap | ⚠️ Parziale | Safe area bottom rispettata in Toast e BottomNav; testare manualmente su mobile reale |
| AVATAR | Avatar System & Character Customization | ❌ Da fare | Nuovo sistema modulare SVG; barbiere, estetista, evoluzione con l'età, NewGame screen |

### Completamento totale: **~97%** (UI/UX polish originale) — **0%** avatar system (nuova feature roadmap)

### Ancora da fare

- **QA mobile fisico** su iPhone SE e iPhone Pro Max — test su device reale (non automatizzabile)
- **Avatar System** — intera nuova feature (vedi sezione dedicata in fondo al documento)

---

# Piano UI/UX — Life Simulator 2D

## Obiettivo
Modernizzare pesantemente il front end di **Life Simulator 2D** mantenendo invariata la struttura attuale dell'app.

Il risultato deve sembrare meno MVP e più mobile game top trend: semplice, diretto, universale, super leggibile e con un game feel molto più addictive.

Non modificare il gameplay core, il flow principale, la navigazione o la struttura logica delle schermate. Il lavoro è di polish, design system, componenti, animazioni leggere, microcopy e percezione premium.

---

## Vincoli fondamentali

- Non cambiare la struttura dell'app.
- Non spostare le sezioni principali.
- Non rimuovere schermate o feature esistenti.
- Non introdurre redesign invasivi.
- Non rompere la logica di gioco.
- Non appesantire il bundle con librerie grosse se non già presenti.
- Tutto deve restare mobile-first.
- Tutte le animazioni devono rispettare `prefers-reduced-motion`.
- Safe area iOS/Android sempre rispettata.

---

## Priorità assoluta

Queste sono le parti che cambiano subito la percezione da prototipo a gioco vero:

1. **AgeButton / bottone +1 età**
2. **Header profilo / player card**
3. **Card system**
4. **Bottom navigation**
5. **Micro-interazioni leggere**
6. **Empty states e copy più gamey**

---

# Strategia a PR

## PR 1 — Design system + componenti core

### Obiettivo
Creare le fondamenta visive senza toccare il flow.

### Task

- Creare o rifinire i design tokens globali.
- Centralizzare colori, radius, shadow, spacing, font size, z-index e transizioni.
- Definire un sistema coerente per:
  - card;
  - pill;
  - badge;
  - button;
  - stat bar;
  - section title;
  - empty state;
  - locked state;
  - reward banner;
  - warning banner.
- Ridurre la sensazione di UI piatta usando depth controllata:
  - card elevated;
  - gradienti leggeri;
  - border luminosi soft;
  - shadow interne o glow molto sottili.
- Uniformare radius e padding.
- Uniformare colori semantici:
  - primary = viola game/brand;
  - gold = CTA/reward;
  - green = soldi/successo;
  - red = rischio/perdita/salute critica;
  - muted = testo secondario.

### Design tokens suggeriti

```css
:root {
  --bg: #090B16;
  --bg-elevated: #0F1324;
  --surface: #121A2E;
  --surface-raised: #18233C;
  --surface-soft: rgba(255, 255, 255, 0.06);

  --primary: #7C5CFF;
  --primary-strong: #9B5CFF;
  --primary-soft: rgba(124, 92, 255, 0.18);

  --gold: #FFB020;
  --gold-soft: rgba(255, 176, 32, 0.18);

  --green: #18D39E;
  --green-soft: rgba(24, 211, 158, 0.16);

  --red: #FF4D6D;
  --red-soft: rgba(255, 77, 109, 0.16);

  --text: #F4F7FB;
  --text-muted: #9DA6BA;
  --text-faint: #687087;

  --border-soft: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.14);

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-xl: 28px;
  --radius-pill: 999px;

  --shadow-card: 0 14px 40px rgba(0, 0, 0, 0.28);
  --shadow-glow-primary: 0 0 28px rgba(124, 92, 255, 0.28);
  --shadow-glow-gold: 0 0 28px rgba(255, 176, 32, 0.22);

  --tap-scale: 0.97;
  --transition-fast: 140ms ease;
  --transition-med: 220ms ease;
}
```

### Acceptance criteria

- Esiste un set di token globale riutilizzabile.
- I componenti base usano token, non colori hardcoded sparsi.
- Nessuna schermata cambia flow.
- App ancora leggibile su schermi piccoli.

---

## PR 2 — Header, BottomNav, AgeButton, Card polish

### Obiettivo
Rendere subito l'app più premium e più giocosa senza cambiare navigazione o contenuti.

---

## 2.1 Header / Player Card

### Problema attuale
L'header è chiaro ma sembra molto dashboard/MVP. Serve più identità da gioco.

### Modifica richiesta
Trasformare l'header in una player card compatta.

### Task

- Avatar più importante, con glow o ring leggero.
- Nome, età e anno più leggibili.
- Badge fase vita più premium.
- Soldi come wallet pill separata.
- Stat bar più chunky e coerenti.
- Micro-animazione quando una stat cambia.
- Evitare overflow orizzontale su mobile stretto.

### Dettagli UI

- Header sticky o semi-sticky se già previsto, ma senza cambiare comportamento.
- Card con background gradient scuro.
- Bordo soft e shadow leggera.
- Stat bar con label breve + valore.
- Valori importanti più evidenti.

### Acceptance criteria

- L'header sembra una scheda personaggio, non una tabella.
- Le stats restano leggibili.
- Nessuna informazione attuale viene persa.

---

## 2.2 AgeButton / CTA centrale

### Problema attuale
Il bottone `+1 ETÀ` è importante, ma sembra ancora semplice.

### Modifica richiesta
Renderlo il bottone più soddisfacente dell'app.

### Task

- Rinforzare il bottone centrale con:
  - gradiente viola;
  - glow controllato;
  - bordo luminoso;
  - tap scale;
  - pulse leggero quando inattivo;
  - stato pressed bello netto.
- Valutare label più chiara: `Cresci` oppure mantenere `+1 ETÀ` ma con layout più premium.
- Aggiungere feedback visivo immediato al tap.
- Non cambiare la funzione del bottone.

### Micro-interazione

- On tap:
  - scale down rapido;
  - glow flash soft;
  - eventuale mini particles/confetti solo se già semplice da implementare.

### Acceptance criteria

- Il bottone sembra la CTA principale del gioco.
- Il tap dà soddisfazione immediata.
- Con reduced motion attivo, niente pulse/animazioni eccessive.

---

## 2.3 Bottom Navigation

### Problema attuale
La bottom nav funziona ma ha look un po' basic e le emoji sembrano poco uniformi.

### Modifica richiesta
Renderla più pulita, coerente e mobile game.

### Task

- Migliorare background della nav con surface elevated.
- Aggiungere safe area bottom corretta.
- Stato attivo più evidente ma non rumoroso.
- Icone più uniformi:
  - o emoji incapsulate in badge/circle;
  - o icone custom/outline se già disponibili.
- Migliorare spacing intorno al bottone centrale.
- Evitare che il bottone centrale copra contenuti importanti.

### Acceptance criteria

- Nav leggibile e pulita su mobile.
- Stato attivo immediatamente riconoscibile.
- CTA centrale resta dominante ma non invasiva.

---

## 2.4 Card System

### Problema attuale
Le card sono leggibili ma molto simili tra loro.

### Modifica richiesta
Creare un sistema card più ricco e riconoscibile.

### Tipi di card

1. **DefaultCard**
   - usata per contenuti normali.
2. **ActionCard**
   - usata per azioni come cerca lavoro, prenota viaggio, incontra persona.
3. **RewardCard**
   - usata per bonus, pubblicità, premi.
4. **WarningCard**
   - usata per messaggi di rischio o blocchi.
5. **LockedCard**
   - usata per feature non ancora disponibili.
6. **PersonCard**
   - usata per famiglia, amici, partner.
7. **FinanceCard**
   - usata per soldi, banca, patrimonio, investimenti.

### Task

- Card con background più profondo.
- Bordo soft coerente.
- Hover/tap mobile con scale leggero.
- Header card più chiaro.
- Badge sempre nello stesso stile.
- Numeri importanti più grandi.
- Icona principale più curata.
- Locked state più bello: blur soft, lock badge, testo breve.

### Acceptance criteria

- Le card non sembrano tutte uguali.
- Ogni card comunica subito il proprio tipo.
- Nessun contenuto esistente viene rimosso.

---

# PR 3 — Toast, overlay età, empty states, micro-interazioni

## Obiettivo
Aggiungere game feel e loop emotivo senza cambiare la struttura.

---

## 3.1 Age Transition Overlay

### Problema attuale
Premere `+1 età` aggiorna il gioco, ma la transizione può sembrare secca.

### Modifica richiesta
Aggiungere un piccolo overlay cinematico quando si avanza di anno.

### Comportamento

Quando il player preme il bottone età:

1. compare overlay breve con anno/età;
2. mostra frase tipo `Età 2 — Nuovo anno`;
3. fade out rapido;
4. eventi recenti entrano con animazione leggera.

### Esempio copy

- `🎂 Età 2`
- `Nuovo anno, nuova storia.`
- `1952`

### Acceptance criteria

- Overlay dura poco e non blocca troppo il gameplay.
- Non cambia la logica del turno.
- Reduced motion: overlay statico o disabilitato.

---

## 3.2 Event Feed più juicy

### Problema attuale
Gli eventi recenti sono leggibili ma poco emozionali.

### Modifica richiesta
Renderli più vivi e più scansionabili.

### Task

- Ogni evento deve avere:
  - icona;
  - testo breve;
  - eventuale delta stat;
  - colore semantico se positivo/negativo/neutro.
- Gli eventi appena generati entrano con stagger leggero.
- Separatore più soft.
- Highlight temporaneo sugli eventi nuovi.

### Esempio

```text
🎂 Hai compiuto 2 anni
❤️ Relazione con Laura +3
😊 Felicità +2
```

### Acceptance criteria

- Gli eventi nuovi si notano subito.
- Il feed resta leggibile.
- Nessun evento viene perso o alterato nella logica.

---

## 3.3 Toast e feedback rapidi

### Modifica richiesta
Aggiungere feedback brevi per azioni importanti.

### Casi utili

- Prenotazione viaggio completata.
- Lavoro trovato/non disponibile.
- Relazione migliorata/peggiorata.
- Soldi spesi/guadagnati.
- Feature bloccata.

### Stile

- Toast basso ma sopra bottom nav.
- Durata breve.
- Colore semantico.
- Icona + testo corto.

### Acceptance criteria

- L'utente capisce subito cosa è successo.
- I toast non coprono CTA centrali.

---

## 3.4 Empty states più gamey

### Problema attuale
Alcuni stati vuoti sembrano troppo secchi.

### Modifica richiesta
Rendere gli empty state più motivanti e coerenti col tono del gioco.

### Esempi copy

#### Lavoro
Prima:
`Nessuna offerta con le tue qualifiche attuali.`

Dopo:
`Ancora troppo baby per il mercato serio. Cresci o sblocca nuove skill.`

#### Relazioni
Prima:
`Poche relazioni attive.`

Dopo:
`La tua rubrica è mezza vuota. Vai a conoscere qualcuno.`

#### Investimenti
Prima:
`Nessun investimento.`

Dopo:
`Portafoglio ancora vergine. A 18 anni si comincia a giocare coi soldi veri.`

### Acceptance criteria

- Copy più memorabile.
- Non troppo cringe.
- Sempre chiaro cosa deve fare il player.

---

## 3.5 Stati locked più belli

### Modifica richiesta
Le feature non disponibili devono sembrare desiderabili, non rotte o morte.

### Task

- Card locked con:
  - icona lock;
  - requisito chiaro;
  - preview leggera;
  - CTA disabilitata ma bella.

### Esempi

- `🔒 Amore — sbloccato a 13 anni`
- `🔒 Investimenti — sbloccato a 18 anni`
- `🔒 Politica — sbloccata a 25 anni`

### Acceptance criteria

- Il player capisce quando sbloccherà la feature.
- Lo stato locked crea desiderio, non frizione.

---

# QA mobile e accessibilità

## Task obbligatori

- Testare su viewport piccoli tipo iPhone SE.
- Testare su viewport alti tipo iPhone Pro Max.
- Verificare safe area bottom/top.
- Verificare scroll con bottom nav e AgeButton.
- Verificare contrasto testo/sfondo.
- Verificare che i testi lunghi non rompano le card.
- Verificare `prefers-reduced-motion`.
- Verificare tap target minimi.
- Verificare performance con feed eventi lungo.

## Acceptance criteria

- Nessun contenuto importante viene coperto dalla bottom nav.
- Nessuna tab orizzontale rompe il layout.
- Nessuna card taglia testo essenziale.
- Animazioni fluide e leggere.

---

# Cosa NON fare

- Non rifare l'app da zero.
- Non cambiare struttura di navigazione.
- Non cambiare gameplay core.
- Non introdurre onboarding complesso.
- Non usare animazioni pesanti ovunque.
- Non trasformare l'app in un casino neon ingestibile.
- Non usare troppi colori senza gerarchia.
- Non mischiare icone con stili diversi senza contenitore coerente.

---

# Definition of Done finale

Il lavoro è completo quando:

- la struttura dell'app è invariata;
- il gioco sembra molto più premium;
- Header, AgeButton, BottomNav e Card system sono visivamente coerenti;
- le azioni principali danno feedback immediato;
- gli empty state sono più chiari e più memorabili;
- le feature locked creano desiderio;
- mobile e safe area sono solidi;
- reduced motion è rispettato;
- il codice resta manutenibile e diviso per componenti riutilizzabili.

---

# Ordine consigliato di implementazione

1. Design tokens globali.
2. Componenti base riutilizzabili.
3. Header / player card.
4. AgeButton.
5. BottomNav.
6. Card system.
7. Event feed.
8. Toast.
9. Empty states.
10. Locked states.
11. QA mobile finale.

---

# Nota finale

La direzione non è “fare più UI”. La direzione è far percepire ogni tap come parte di un gioco vivo.

Il player deve capire tutto al volo, ma sentire che ogni anno, card, reward e relazione hanno peso. L'app deve restare semplice, ma molto più succosa.

---

# AVATAR System & Character Customization

## Obiettivo

Creare un sistema avatar modulare che aumenti l'attaccamento emotivo al personaggio, migliori l'immersione e la retention, renda il personaggio riconoscibile e introduca una progressione visiva nel tempo.

Questa feature **NON** deve cambiare la struttura generale del gioco, **NON** deve rallentare il loop principale, **NON** deve introdurre complessità inutile. Deve aumentare attachment emotivo e game feel mantenendo il gameplay rapido e compulsivo.

---

## Vincoli

- Stessa struttura UI dell'app.
- Stesso flow di gameplay invariato.
- Mobile-first assoluto.
- Nessuna libreria pesante aggiuntiva.
- Leggero e performante anche su device lenti.
- Tutte le animazioni rispettano `prefers-reduced-motion`.
- Safe area iOS/Android sempre rispettata.
- Compatible con dark UI esistente.

---

## Architettura tecnica

### Formato

Preferire **SVG modulari** invece di PNG.

- Ogni layer è un componente SVG separato e sostituibile.
- I colori sono variabili CSS dinamiche, modificabili a runtime.
- Nessuna duplicazione di componenti: riutilizzare i layer esistenti con props diverse.
- Il sistema deve supportare facilmente nuove varianti future.

### Layer struttura

```
AvatarComponent
├── Background / frame (opzionale)
├── Body / silhouette
├── Skin (colore base)
├── Head (forma)
├── Eyes (forma + colore)
├── Brows (forma + colore)
├── Hair (stile + colore)
├── Beard (stile + colore, solo maschi/adulti)
├── Mouth
├── Accessories (occhiali, piercing, ecc.)
└── Clothes (outfit base)
```

Ogni layer:
- è un componente React separato (`<HairLayer />`, `<EyesLayer />`, ecc.);
- accetta props di stile (`color`, `variant`);
- è facilmente sostituibile senza toccare gli altri layer;
- il colore di skin, capelli, occhi e vestiti è modificabile via CSS custom properties.

### Integrazione HUD

L'avatar attuale nel HUD (emoji) viene sostituito progressivamente dal componente SVG modulare. L'emoji resta come fallback se il layer non è ancora definito.

---

## Direzione visuale

Lo stile deve essere:

- **Cartoon** — non realistico, non fotografico.
- **Pulito e morbido** — forme arrotondate, pochi dettagli.
- **Moderno e universalmente leggibile**.
- **Stylized** — identità visiva propria.
- **Mobile-first** — leggibile a 38×38px nel HUD fino a 120×120px nel profilo.

### Ispirazione

- BitLife (semplicità, chiarezza, immediacy) — **NON copiare direttamente**.
- Nintendo Mii (personalizzazione modulare, stile cartoon).
- Duolingo avatars (morbido, colorato, leggero).
- Emoji style moderni (universalmente riconoscibili).

### Da evitare

- Slider facciali complessi stile RPG.
- Editing realistico o fotorealistico.
- Troppe opzioni contemporaneamente visibili.
- UI di customizzazione lunga più di 2 scroll.

---

## UX Goals — Customizzazione

La customizzazione deve essere:

- **Veloce** — non più di 30 secondi per un look completo.
- **Semplice** — massimo 4-6 opzioni visibili per categoria.
- **Soddisfacente** — ogni cambio si vede subito in tempo reale.
- **”Toy-like”** — piacevole da usare anche senza uno scopo preciso.
- **Accessibile** — funziona anche per utenti casual, no glosse tecniche.

---

## Integrazione gameplay

### 1. Creazione personaggio iniziale (`NewGameScreen`)

La schermata di nuovo gioco include una sezione avatar rapida:

**Step flow:**
1. Inserisci nome
2. Scegli genere (influenza layer hair/beard disponibili)
3. Scegli paese
4. Personalizza avatar — max 3 step veloci:
   - Skin tone (5 varianti)
   - Capelli (8 stili, 6 colori)
   - Occhi (colore)
5. Inizia

Il player può saltare la personalizzazione e ottenere un avatar random. Il flusso non deve allungare l'onboarding.

---

### 2. Barbiere (`BarberScreen` — nuova activity)

Nuova attività accessibile dallo schermo attività esistente.

**Disponibile da:** 10 anni  
**Categoria:** Svago / Aspetto

**Modifiche disponibili:**

| Modifica | Costo | Effetto |
|----------|-------|---------|
| Cambio capelli | €15–€80 | +Looks variabile |
| Cambio colore capelli | €20–€120 | +Looks variabile |
| Rasatura / barba | €10–€40 | +Looks variabile |
| Sopracciglia | €15–€30 | +Looks lieve |
| Taglio buzz cut | €10 | +Looks lieve |
| Taglio luxury | €150 | +Looks forte |

**Outcome system:**
- Esito positivo (70%): look migliorato, stat Look +2/+5.
- Esito neutro (20%): cambiamento senza effetto stats.
- Esito negativo (10%): “Taglio sbagliato” — Look -2 per 1 anno, poi si normalizza.

---

### 3. Estetista / Beauty (`BeautyScreen` — espansione screen esistente)

Espansione dello schermo Beauty già esistente, o nuova sezione accessibile dallo screen attività.

**Disponibile da:** 13 anni  
**Categoria:** Svago / Aspetto

**Modifiche disponibili:**

| Modifica | Costo | Effetto |
|----------|-------|---------|
| Makeup leggero | €10–€30 | +Looks lieve |
| Makeup evento | €40–€100 | +Looks forte (temp.) |
| Skincare routine | €20/mese | +Looks nel tempo |
| Piercing | €30–€80 | +Looks / -Looks (casuale) |
| Rimozione piercing | €20 | Ripristino |
| Tattoo piccolo | €80–€200 | +Looks / neutro (casuale) |
| Tattoo grande | €300–€800 | +Looks / -Looks (casuale) |
| Rimozione tattoo | €500–€2.000 | Ripristino (lungo) |

Gli accessori visibili (piercing, tattoo) aggiornano il layer `Accessories` dell'avatar in tempo reale.

---

## Evoluzione automatica con l'età

Il personaggio cambia aspetto automaticamente nel tempo. I cambiamenti sono **leggeri, stilizzati e non pesanti**.

| Fascia d'età | Cambiamenti avatar |
|--------------|--------------------|
| 0–5 anni | Volto morbido, occhi grandi, no barba |
| 6–12 anni | Volto infantile, capelli più semplici |
| 13–17 anni | Acne lieve (layer spot opzionale), primi accenni peluria |
| 18–30 anni | Look adulto standard, barba possibile |
| 31–50 anni | Leggera stempiatura se geneticamente prevista |
| 51–65 anni | Prime rughe stilizzate (1-2 linee), capelli meno folti |
| 66+ anni | Capelli bianchi/grigi, rughe più marcate (sempre stylized) |

I cambiamenti avvengono automaticamente avanzando di anno. Nessuna azione richiesta al player.

Specificare nella codebase che:
- i cambiamenti sono gestiti da una funzione `getAvatarLayersForAge(age, identity)`;
- ogni fascia d'età ha un set di layer default che vengono applicati automaticamente;
- le personalizzazioni manuali del player sovrascrivono il default solo se compatibili con l'età.

---

## Future-proofing

Il sistema deve essere pensato per espansioni future senza refactor:

- **Outfit / vestiti** — layer `Clothes` già presente, varianti da aggiungere.
- **Accessori** — occhiali, cappelli, borse, orologi.
- **Skin pack** — temi visivi alternativi (es. “Anni '80”, “Cyberpunk”).
- **Reward cosmetici** — avatar item come premio per achievement.
- **Eventi speciali** — outfit natalizi, Halloween, ecc.
- **Personalizzazione tramite acquisti in-game** — vestiti comprati nel gameplay che aggiornano il layer clothes.

---

## Struttura file suggerita

```
src/
├── components/
│   └── avatar/
│       ├── AvatarRenderer.tsx       ← componente principale, compone i layer
│       ├── layers/
│       │   ├── SkinLayer.tsx
│       │   ├── HairLayer.tsx
│       │   ├── EyesLayer.tsx
│       │   ├── BrowsLayer.tsx
│       │   ├── BeardLayer.tsx
│       │   ├── AccessoriesLayer.tsx
│       │   └── ClothesLayer.tsx
│       └── avatarUtils.ts           ← getAvatarLayersForAge(), getRandomAvatar()
├── store/
│   └── types.ts                     ← estendere Identity con avatarConfig: AvatarConfig
└── screens/
    ├── NewGameScreen.tsx            ← aggiungere step avatar
    └── BarberScreen.tsx             ← nuova schermata
```

---

## Ordine di implementazione consigliato

1. Definire il tipo `AvatarConfig` in `types.ts` ed estendere `Identity`.
2. Creare `AvatarRenderer.tsx` con layer base (skin + head + eyes).
3. Sostituire emoji nel HUD con `<AvatarRenderer size=”sm” />`.
4. Aggiungere step avatar in `NewGameScreen`.
5. Implementare layer hair, beard, accessories, clothes.
6. Creare `BarberScreen` con outcome system.
7. Espandere `BeautyScreen` con piercing/tattoo.
8. Implementare `getAvatarLayersForAge()` e collegarla all'avanzamento anno.
9. QA mobile: rendering a tutte le dimensioni, dark mode, performance.

---

## Acceptance Criteria

- [ ] Avatar renderizzato correttamente su mobile a tutte le dimensioni (HUD 38px, profilo 120px).
- [ ] Nessun impatto significativo sulle performance (< 5ms render time aggiuntivo).
- [ ] Sistema compatibile con dark UI esistente — nessun colore hardcoded bianco/chiaro.
- [ ] Cambio look aggiornato in tempo reale senza reload schermata.
- [ ] Avatar coerente in tutto il gioco (HUD, NewGame, Barbiere, profilo, ecc.).
- [ ] Funzionamento corretto con safe area mobile (avatar non tagliato).
- [ ] Supporto `prefers-reduced-motion` per eventuali animazioni avatar.
- [ ] Evoluzione età funziona automaticamente senza input player.
- [ ] BarberScreen: outcome positivo/negativo/neutro funzionante.
- [ ] Avatar random disponibile come fallback in NewGame.
- [ ] Nessuna regressione su screen esistenti.

---

## Cosa NON fare

- Non creare un editor ultra-dettagliato stile RPG hardcore.
- Non usare slider facciali continui.
- Non inserire più di 6 opzioni visibili contemporaneamente per categoria.
- Non usare PNG pesanti: solo SVG inline o CSS shapes.
- Non cambiare la struttura di navigazione dell'app.
- Non rallentare il loop principale (`+1 ETÀ` deve restare istantaneo).
- Non copiare direttamente lo stile BitLife.
