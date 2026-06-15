# Romantic Dynamics — Emergent Relationship System

Design + implementation reference for the deep, emergent romantic-relationship
simulation in the life simulator. Relationships are **living systems**, not flat
states: every NPC carries a psychological profile and, each year, autonomously
evolves the bond, decides whether to stray / hide / confess, applies social
pressure, and can spiral into obsession — entirely from numbers, with **no
scripted events**.

Implementation: `src/services/RomanticDynamicsEngine.ts` (+ types in
`src/store/types.ts`, wired into the annual tick in `src/store/gameStore.ts`,
block `7-quater`). Tests: `src/services/RomanticDynamicsEngine.test.ts`.

---

## 1. Architecture

```
                 ┌───────────────────────── annual tick (gameStore) ─────────────────────────┐
 player stats ──▶│ RelationshipEngine.annualDecay ─▶ RomanticDynamicsEngine.annualTick ─▶ NPCAgencyEngine │
 relationships ─▶│        (trust/love drift)            (bond + infidelity + obsession)     (life events) │
                 └───────────────────────────────────────────────────────────────────────────────────────┘
                                                  │ returns { relationships, effects, messages }
                                                  ▼
                                    merged into player effects + event log
```

The engine is **pure** (no store access, no globals): `annualTick(state,
relationships) → { relationships, effects, messages }`. It composes with the
existing layers instead of replacing them:

- **`RelationshipEngine`** keeps owning low-level metrics (`trust`, `love`,
  `respect`, `jealousy`, `attraction`) and player-initiated actions.
- **`ChainReactionEngine`** keeps owning short-term momentum via `historyFlags`
  (`chain_warmth`, `chain_tension`, …) which this engine **reads** as the
  "recent attention / friction" signal.
- **`RomanticDynamicsEngine`** (new) adds the psychological + bond + infidelity +
  obsession layer on top, lazily backfilling its fields so old saves stay valid.

All new `Relationship` fields are **optional** → zero-migration backward
compatibility. They are computed on first contact and memoised onto the object.

---

## 2. Variables

### NPC psychological profile — `RomanticProfile` (0–100 each)

| Field | IT | Source |
|---|---|---|
| `empathy` | empatia | hash + `empatico`/`sensibile`/`avido` traits |
| `affectivity` | affettività | hash + `sensibile`/`generoso`/`introverso` |
| `sexuality` | sessualità / libido | hash + age curve |
| `jealousy` | gelosia | `rel.jealousy` + `geloso`/`leale` |
| `fidelity` | fedeltà | hash + `leale`/`impulsivo` − craziness·0.15 |
| `selfEsteem` | autostima | hash + `sicuro`/`sensibile` |
| `courage` | coraggio | hash + `sicuro`/`impulsivo`/`introverso` |
| `ambition` | ambizione | hash + `ambizioso` |
| `honesty` | onestà | hash + `leale`/`avido`/`impulsivo` |
| `emotionalMaturity` | maturità emotiva | hash·0.6 + age·0.4 + traits |
| `freedomDrive` | volontà di libertà | hash + `ambizioso` + craziness·0.2 − `leale` |
| `religiousness` | religiosità | `extendedAttributes.religiousness` |
| `intelligence` | intelligenza | `extendedAttributes.smarts` |
| `attractiveness` | attrattiva fisica | `extendedAttributes.looks` |
| `craziness` | pazzia | `extendedAttributes.craziness` |

The player gets a symmetric profile (`playerProfile`) derived from `CoreStats`
(karma, mentalHealth, looks, reputation, intelligence…), `PlayerSkills`
(charisma, leadership, discipline) and `identity.religion`.

### Compatibility — `CompatibilityScores` (0–100)
`mental`, `affective`, `sexual`, `projectual`, `overall`.

### Bond — `RelationshipBond` (0–100, recomputed yearly)
`emotionalSat`, `sexualSat`, `passion`, `stability`, `commitment`.

### Parallel relationships — `SecretAffair[]`
`{ loverName, kind, startYear, intensity, discovered }`,
`kind ∈ {occasional, ongoing, emotional, sexual, double_life}`.

### Obsession — `ObsessionState`
`{ level, sinceYear, behaviors[] }`.

### Other
`relationshipModel ∈ {serious, casual, dating, fwb, open, poly}`,
`externalApproval` (0–100, family/social acceptance of the couple).

---

## 3. Formulas

All inputs/outputs are 0–100 unless noted; everything is clamped.

### 3.1 Compatibility
```
mental     = 100 − 0.45·|Δintelligence| − 0.30·|Δreligiousness| − 0.20·|Δambition|
affective  = 0.5·avg(empathy) + 0.5·(100 − |Δaffectivity|)
sexual     = 0.4·avg(sexuality) + 0.3·(100 − |Δsexuality|) + 0.3·avg(attraction, npc.attractiveness)
projectual = 100 − 0.35·|Δambition| − 0.35·|ΔfreedomDrive| − min(ageGap,30)·1.0
overall    = 0.25·mental + 0.30·affective + 0.25·sexual + 0.20·projectual
```

### 3.2 Relationship-model classification (deterministic argmax)
Propensity per model; the strongest wins (no RNG → stable):
```
serious = 0.5·overall + 0.3·maturity + 0.2·(100−freedom) + (age≥25 ? +12 : −10)
dating  = 50 + (youth ? +18) + (overall<60 ? +12)
casual  = (youth ? +22) + 0.3·freedom + (projectual<45 ? +18) + 0.2·(100−maturity)
fwb     = 0.45·sexual + 0.3·freedom − 0.25·affective + 0.15·(100−religious)
open    = 0.5·freedom + 0.3·(100−jealousy) + 0.2·(100−religious) − 28
poly    = 0.4·freedom + 0.3·(100−jealousy) + 0.2·craziness + 0.1·(100−religious) − 42
```
`youth = age<24 || npc.age<24`; `freedom/jealousy/religious/maturity = avg(player,npc)`.

### 3.3 Yearly bond drift
Each dimension eases 25%/yr toward a compatibility-driven target, modulated by
chain-flag momentum and life stressors:
```
warmth   = 4·warm + 3·gratitude + 2·repairing      (from historyFlags)
friction = 4·tension + 5·trust_decay + 4·jealousy
money    = money<0 ? 6 : money<500 ? 3 : 0
ease(x,t)= x + (t − x)·0.25

emotionalSat = ease(·, 0.6·affective + 0.4·love) + warmth − friction − 0.5·money
sexualSat    = ease(·, sexual) + (warmth>0?2) − ageDecline − 0.4·friction
passion      = passion − 2 − ageDecline + 0.8·warmth − 0.5·friction   (naturally cools)
stability    = ease(·, 0.5·trust + 0.3·overall + 0.2·approval) − money − 0.4·friction
commitment   = commitment + (fidelity>60?+1:−1) + (emotionalSat>70?+1)
```

### 3.4 Infidelity — P(stray), bounded [0, 0.35]
```
dissatisfaction = (200 − emotionalSat − sexualSat) / 2
pStray = 0.0022·dissatisfaction
       + 0.0016·(100 − fidelity)
       + 0.0009·freedomDrive
       + 0.0010·opportunity
       + 0.0006·craziness
       − 0.0010·religiousness
       − 0.0008·commitment
if model ∈ {open, poly}: pStray ·= 0.35     (sanctioned, rarely harmful)
```
`opportunity = clamp(20 + 6·#known-adult-non-partners, 0, 70)`.

**Affair kind** from the weakest bond axis + personality:
```
freedomDrive>70 & craziness>60 & emoGap>40 & sexGap>40 → double_life
emoGap > sexGap+15                                      → emotional
sexGap > emoGap+15                                      → sexual
fidelity<35 & overall<50                                → ongoing
else                                                    → occasional
```

**Confess vs lie vs hide:**
```
P(confess) = clamp(0.006·honesty + 0.004·courage + 0.003·emotionalMaturity − 0.25, 0, 0.85)
```
Confession → `confessed_affair` (trust −25, love −18, repairable).
Otherwise → kept secret (`cheated_secretly`).

### 3.5 Discovery — P(discover), bounded [0.03, 0.85]
```
pDiscover = 0.0020·player.jealousy      (a jealous player snoops)
          + 0.0012·player.intelligence  (connects the dots)
          − 0.0014·npc.intelligence     (clever cheater hides it)
          + 0.05·#affairs               (bigger exposure surface)
          + (cohabiting ? 0.10)
          + (hasChildren ? 0.05)
          + 0.06                         (base social-network leak)
```
On discovery: trust −35, love −30, jealousy +20, all affairs revealed,
`cheated_on_player`. If worst affair `intensity>70` or `double_life` →
relationship **ends** (`type=ex_partner`, `affair_ended_relationship`).
Because discovery is checked **every year** on undiscovered affairs, betrayals
can surface *years later* — the requested emergent outcome.

### 3.6 External approval drift
```
approval += valueBond(+3 if avg empathy>65)
          − 0.06·|Δreligiousness|
          − 0.10·culturalGap(15 if different nationality)
          − 0.20·economicGap(8 if money<0)
          + (married ? +2)
```
Low approval lowers `stability` (feeds 3.3).

### 3.7 Obsession drive (post-rejection / ex)
```
drive = 0.35·craziness + 0.30·jealousy + 0.20·(100−selfEsteem) + 0.15·(100−emotionalMaturity)
if drive < 55: no obsession
level += recent ? (drive−50)·0.4 : −12        (decays when not recent)
stage  = floor(level / 25) → ladder rung
```

---

## 4. Relationship state machines

### 4.1 Model lifecycle
```
            ┌────────┐  exclusivity ask (emoSat>65, jealousy>55)
   dating ──┤ casual ├──────────────────────────────────────────▶ serious
      │     │  fwb   │                                              │  │
      │     └────────┘                                  cohabitation│  │marriage
      │                                                  proposal   ▼  ▼
      │  open-relationship proposal (freedom>72,                cohabiting → married
      └─ sexSat<45, religiousness<40) ───────────────▶ open ⇄ poly
```

### 4.2 Infidelity sub-machine (per year, exclusive models)
```
 faithful ──P(stray)──▶ tempted ──┬─P(confess)─▶ confessed (repairable)
     ▲                            └─────────────▶ secret_affair
     │                                                │
     │                                  ┌─────────────┴───────── every year ──────────┐
     │                                  ▼                                              │
     └───────── repaired ◀── reconcile  discovered ──intensity>70/double_life──▶ ended │
                                                                                       │
                                          (open/poly: stray → transparent, no penalty)─┘
```

### 4.3 Obsession ladder (each +25 level)
`monitoring → following → blackmail → threats` (one rung per band, never skipped,
decays −12/yr once the breakup is no longer "recent").

---

## 5. Events (emergent, surfaced to the event log)

| Trigger | Message (IT) | Effect |
|---|---|---|
| open/poly partner sees someone | "ha visto un'altra persona — coerente con la vostra relazione aperta" | — |
| confession | "ti ha confessato un tradimento (…)" | happiness −12, mental −8 |
| discovery (recent) | "Hai scoperto un tradimento di … (…)" | happiness −16, mental −12 |
| discovery (years later) | "ti tradiva da N anni (…). È finita." | + reputation −4 if ended |
| exclusivity ask | "ti ha chiesto di rendere ufficiale ed esclusiva la relazione" | → serious |
| open-relationship proposal | "ti ha proposto di trasformarla in una relazione aperta" | flag |
| cohabitation push | "vorrebbe andare a vivere con te" | flag |
| marriage hint | "ha lasciato intendere di voler fare il grande passo" | flag |
| obsession: monitoring | "continua a controllare ogni tua mossa sui social" | mental −3 |
| obsession: following | "è stato/a visto/a aggirarsi vicino a casa tua" | mental −6, happiness −3 |
| obsession: blackmail | "ha minacciato di rivelare cose private su di te" | mental −10, reputation −4 |
| obsession: threats | "è diventato/a apertamente minaccioso/a" | mental −14, happiness −8 |

Messages are **capped at 3/year** (`spend()` budget) to avoid log spam.

---

## 6. Probability tables (representative)

P(stray) per year, by satisfaction & fidelity (commitment 50, opportunity 40,
religiousness 40, freedom 50, craziness 40), serious model:

| emoSat / sexSat | fidelity 30 | fidelity 55 | fidelity 80 |
|---|---|---|---|
| 30 / 30 | ~0.21 | ~0.17 | ~0.13 |
| 55 / 55 | ~0.14 | ~0.10 | ~0.06 |
| 80 / 80 | ~0.07 | ~0.04 | ~0.01 |

P(discover) per year on a single hidden affair:

| | not cohabiting | cohabiting | cohabiting + kids |
|---|---|---|---|
| low-jealousy player (30) | ~0.10 | ~0.20 | ~0.25 |
| high-jealousy player (80) | ~0.20 | ~0.30 | ~0.35 |

Over a 5-year affair, cumulative discovery ≈ 1 − Π(1 − pᵢ) → typically 50–90%,
so long betrayals are *usually* found eventually but not guaranteed.

---

## 7. Balancing

- **All probabilities are hard-capped** (`pStray ≤ 0.35`, `pDiscover ∈ [0.03,
  0.85]`) so no death-spirals or certainties.
- **Bond dimensions ease (25%/yr)** rather than jump → no whiplash year-to-year.
- **Passion always cools** (−2/yr) creating natural long-term drift that the
  player must actively counter (the engine reads `chain_warmth` from player
  actions), rewarding maintenance without scripting.
- **open/poly** scale infidelity harm by ×0.35 so those models play differently
  rather than just being "free cheating".
- **Message budget (3/yr)** keeps the log readable even with many relationships.
- Obsession is gated behind `drive ≥ 55` (rare combination of high craziness +
  jealousy + low self-esteem + low maturity) so most exes simply fade.

Tuning knobs live as inline coefficients; `RomanticDynamicsEngine.test.ts`
asserts invariants (bounds, determinism, message cap, open-model safety) so
re-balancing can't silently break them.

---

## 8. Pseudocode (annual tick)

```
function annualTick(state, relationships):
    player = playerProfile(state)
    opportunity = clamp(20 + 6 * count(known adult non-partners), 0, 70)
    budget = 3
    for rel in relationships:
        if not rel.isAlive: continue
        if rel is ex or rejected: obsessionStep(rel)          # toxic ladder
        if rel not romantic: continue

        profile = ensureProfile(rel)                          # lazy, deterministic
        compat  = rel.compatibility  or computeCompatibility(player, profile, rel)
        model   = rel.relationshipModel or classifyModel(...)
        bond    = driftBond(rel, profile, compat, ensureBond(rel, compat))
        rel.externalApproval = driftApproval(rel, player, profile)

        # infidelity
        if random() < pStray(profile, bond, model, opportunity):
            kind = affairKind(profile, bond, compat)
            if model in {open, poly}: announce(); continue
            if random() < pConfess(profile): confess(); continue
            rel.secretAffairs += {kind, intensity, hidden}
        for affair in rel.undiscoveredAffairs (exclusive models):
            if random() < pDiscover(rel, player, profile): reveal(); maybe end()

        # proposals / ultimatums
        proposalStep(rel, profile, bond, model)
    return { relationships, effects, messages }
```

---

## 9. Data structures

See `src/store/types.ts`:
`RelationshipModel`, `RomanticProfile`, `CompatibilityScores`,
`RelationshipBond`, `AffairKind`, `SecretAffair`, `ObsessionState`, and the
optional fields appended to `Relationship`
(`romanticProfile`, `relationshipModel`, `compatibility`, `bond`,
`secretAffairs`, `obsession`, `externalApproval`).

All are plain JSON-serialisable objects (no classes/closures) → persist cleanly
in the existing localStorage / cloud save.

---

## 10. Optimising for thousands of NPCs

The current game tracks tens of relationships, but the engine is designed to
scale:

1. **Lazy + memoised derivation** — `romanticProfile` / `compatibility` /
   `relationshipModel` are computed **once** and stored; subsequent ticks read
   them. Cost amortises to O(1)/NPC after year one.
2. **Pure deterministic hashing** — profiles come from a cheap FNV-1a hash of the
   NPC id, so no per-NPC RNG state to store and results are reproducible.
3. **O(N) tick, no pairwise scan** — each NPC is processed against the single
   player profile + a precomputed `opportunity` scalar; no N² interactions.
4. **Active-set filtering** — only `isAlive` romantic NPCs (and exes with live
   obsession) run the heavy path; everyone else is skipped in O(1).
5. **Tiered simulation (future)** — for very large casts, run the full model only
   on "on-screen / close" NPCs each year and a cheap statistical approximation
   (expected-value bond drift, batched infidelity draw) for the long tail,
   promoting an NPC to full simulation when the player interacts.
6. **Flat, serialisable state** — enables structural sharing and, if needed,
   moving the tick to a Web Worker without serialising class instances.
```
