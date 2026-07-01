// RomanticDynamicsEngine — emergent simulation of romantic relationships.
//
// Goal: relationships are not flat states ("partner"/"spouse") but living systems.
// Every NPC carries a psychological profile and, each year, autonomously updates
// the bond, decides whether to stray, hide or confess, applies pressure, and can
// spiral into obsession — all from numbers, with no scripted events.
//
// This engine is intentionally self-contained and side-effect free: annualTick
// takes the current relationships + state and returns new relationships plus
// messages/effects for the store to apply. All new Relationship fields are
// optional and filled in lazily, so existing saves keep working.
//
// Full design notes (formulas, state machines, probability tables, balancing and
// optimisation strategy) live in docs/ROMANTIC_DYNAMICS_DESIGN.md.

import type {
  GameState,
  Relationship,
  RomanticProfile,
  CompatibilityScores,
  RelationshipBond,
  RelationshipModel,
  SecretAffair,
  AffairKind,
  Effect,
} from '../store/types'
import { NameEngine } from './NameEngine'

export interface RomanticTickResult {
  relationships: Relationship[]
  effects: Effect
  messages: string[]
}

// ─── helpers ──────────────────────────────────────────────────────────────

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v))
const round = (v: number) => Math.round(v)

// Stable per-NPC hash → 0..1, so deterministic traits never flicker across ticks.
function hash01(str: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}
const h = (seed: string, salt: number, min = 0, max = 100) => round(min + hash01(seed, salt) * (max - min))

const ROMANTIC_TYPES = new Set(['partner', 'spouse'])
const isRomantic = (rel: Relationship) =>
  ROMANTIC_TYPES.has(rel.type) || rel.stage === 'partner' || rel.stage === 'spouse'

const firstName = (full: string) => full.split(' ')[0]

// ─── public engine ──────────────────────────────────────────────────────────

export class RomanticDynamicsEngine {
  // ── 1. Psychological profiles ──────────────────────────────────────────

  /** Deterministic romantic profile for an NPC, blending stored attributes,
   *  categorical personality traits and a stable hash. Memoised onto the rel. */
  static ensureProfile(rel: Relationship): RomanticProfile {
    if (rel.romanticProfile) return rel.romanticProfile
    const seed = rel.npcId || rel.id || rel.name
    const t = new Set(rel.personalityTraits ?? [])
    const ext = rel.extendedAttributes

    // trait nudges: +/- applied on top of a hash baseline
    const base = (salt: number, lo = 20, hi = 90) => h(seed, salt, lo, hi)

    const craziness = ext?.craziness ?? base(1)
    const intelligence = ext?.smarts ?? base(2)
    const attractiveness = ext?.looks ?? clamp(rel.attraction * 0.6 + 30)
    const religiousness = ext?.religiousness ?? base(3)

    const profile: RomanticProfile = {
      empathy: clamp(base(4) + (t.has('empatico') ? 25 : 0) + (t.has('sensibile') ? 12 : 0) - (t.has('avido') ? 15 : 0)),
      affectivity: clamp(base(5) + (t.has('sensibile') ? 18 : 0) + (t.has('generoso') ? 12 : 0) - (t.has('introverso') ? 12 : 0)),
      sexuality: clamp(base(6, 30, 85) + (rel.age < 35 ? 8 : rel.age > 55 ? -15 : 0)),
      jealousy: clamp((rel.jealousy || base(7)) + (t.has('geloso') ? 22 : 0) - (t.has('leale') ? 8 : 0)),
      fidelity: clamp(base(8) + (t.has('leale') ? 25 : 0) - (t.has('impulsivo') ? 15 : 0) - craziness * 0.15),
      selfEsteem: clamp(base(9) + (t.has('sicuro') ? 22 : 0) - (t.has('sensibile') ? 8 : 0)),
      courage: clamp(base(10) + (t.has('sicuro') ? 15 : 0) + (t.has('impulsivo') ? 12 : 0) - (t.has('introverso') ? 12 : 0)),
      ambition: clamp(base(11) + (t.has('ambizioso') ? 28 : 0)),
      honesty: clamp(base(12) + (t.has('leale') ? 20 : 0) - (t.has('avido') ? 18 : 0) - (t.has('impulsivo') ? 6 : 0)),
      emotionalMaturity: clamp(base(13) * 0.6 + clamp(rel.age * 1.4, 0, 60) * 0.4 + (t.has('leale') ? 8 : 0) - (t.has('impulsivo') ? 14 : 0)),
      freedomDrive: clamp(base(14) + (t.has('ambizioso') ? 12 : 0) + craziness * 0.2 - (t.has('leale') ? 10 : 0)),
      religiousness,
      intelligence,
      attractiveness,
      craziness,
    }
    return profile
  }

  /** Derive the player's own romantic profile from core stats / skills / identity. */
  static playerProfile(state: GameState): RomanticProfile {
    const s = state.stats
    const sk = state.skills
    const age = state.time.age
    const karmaPct = clamp(((s.karma ?? 0) + 100) / 2) // karma -100..100 → 0..100
    const religious = ['atheism', 'agnosticism'].includes(state.identity.religion) ? 25 : 65

    return {
      empathy: clamp(karmaPct * 0.5 + s.mentalHealth * 0.5),
      affectivity: clamp(s.happiness * 0.5 + s.socialReputation * 0.5),
      sexuality: clamp(55 + (sk?.charisma ?? 0) * 0.2 + (age < 35 ? 8 : age > 55 ? -15 : 0)),
      jealousy: clamp(45 + (100 - s.mentalHealth) * 0.2),
      fidelity: clamp(karmaPct * 0.7 + 20),
      selfEsteem: clamp(s.looks * 0.4 + s.reputation * 0.3 + s.mentalHealth * 0.3),
      courage: clamp(40 + (sk?.leadership ?? 0) * 0.5),
      ambition: clamp((sk?.leadership ?? 0) * 0.4 + (sk?.discipline ?? 0) * 0.3 + s.reputation * 0.3),
      honesty: clamp(karmaPct),
      emotionalMaturity: clamp(clamp(age * 1.6, 0, 70) * 0.6 + s.mentalHealth * 0.4),
      freedomDrive: clamp(50 + (100 - s.socialReputation) * 0.2),
      religiousness: religious,
      intelligence: s.intelligence,
      attractiveness: s.looks,
      craziness: clamp((100 - s.mentalHealth) * 0.4),
    }
  }

  // ── 2. Compatibility ───────────────────────────────────────────────────

  /** Four-axis compatibility (0-100) between player and NPC. */
  static computeCompatibility(player: RomanticProfile, npc: RomanticProfile, rel: Relationship, state: GameState): CompatibilityScores {
    const ageGap = Math.abs(state.time.age - rel.age)

    // Mental: shared intelligence band, value/religion alignment.
    const mental = clamp(
      100
      - Math.abs(player.intelligence - npc.intelligence) * 0.45
      - Math.abs(player.religiousness - npc.religiousness) * 0.30
      - Math.abs(player.ambition - npc.ambition) * 0.20,
    )

    // Affective: both partners' capacity for empathy + matched affective needs.
    const affective = clamp(
      ((player.empathy + npc.empathy) / 2) * 0.5
      + (100 - Math.abs(player.affectivity - npc.affectivity)) * 0.5,
    )

    // Sexual: matched libido + mutual physical attraction (rel.attraction = player→npc).
    const sexual = clamp(
      ((player.sexuality + npc.sexuality) / 2) * 0.4
      + (100 - Math.abs(player.sexuality - npc.sexuality)) * 0.3
      + ((rel.attraction + npc.attractiveness) / 2) * 0.3,
    )

    // Projectual: aligned life goals (ambition, autonomy), penalised by age gap.
    const projectual = clamp(
      100
      - Math.abs(player.ambition - npc.ambition) * 0.35
      - Math.abs(player.freedomDrive - npc.freedomDrive) * 0.35
      - Math.min(ageGap, 30) * 1.0,
    )

    const overall = clamp(mental * 0.25 + affective * 0.30 + sexual * 0.25 + projectual * 0.20)
    return { mental: round(mental), affective: round(affective), sexual: round(sexual), projectual: round(projectual), overall: round(overall) }
  }

  // ── 3. Relationship model classification (at formation) ─────────────────

  /** Decide the relationship "model" deterministically from age, values, traits
   *  and compatibility. Never random — same inputs always classify the same way. */
  static classifyModel(player: RomanticProfile, npc: RomanticProfile, compat: CompatibilityScores, rel: Relationship, state: GameState): RelationshipModel {
    const age = state.time.age
    const youth = age < 24 || rel.age < 24
    const freedom = (player.freedomDrive + npc.freedomDrive) / 2
    const jealousy = (player.jealousy + npc.jealousy) / 2
    const religious = (player.religiousness + npc.religiousness) / 2
    const maturity = (player.emotionalMaturity + npc.emotionalMaturity) / 2

    // Weighted propensity per model; pick the strongest above threshold.
    const scores: Record<RelationshipModel, number> = {
      serious: compat.overall * 0.5 + maturity * 0.3 + (100 - freedom) * 0.2 + (age >= 25 ? 12 : -10),
      dating: 50 + (youth ? 18 : 0) + (compat.overall < 60 ? 12 : 0),
      casual: (youth ? 22 : 0) + freedom * 0.3 + (compat.projectual < 45 ? 18 : 0) + (100 - maturity) * 0.2,
      fwb: compat.sexual * 0.45 + freedom * 0.3 - compat.affective * 0.25 + (100 - religious) * 0.15,
      open: freedom * 0.5 + (100 - jealousy) * 0.3 + (100 - religious) * 0.2 - 28,
      poly: freedom * 0.4 + (100 - jealousy) * 0.3 + npc.craziness * 0.2 + (100 - religious) * 0.1 - 42,
    }

    let best: RelationshipModel = 'dating'
    let bestScore = -Infinity
    for (const key of Object.keys(scores) as RelationshipModel[]) {
      if (scores[key] > bestScore) { bestScore = scores[key]; best = key }
    }
    return best
  }

  // ── 4. Bond initialisation & yearly drift ───────────────────────────────

  static ensureBond(rel: Relationship, compat: CompatibilityScores): RelationshipBond {
    if (rel.bond) return rel.bond
    return {
      emotionalSat: clamp(compat.affective * 0.5 + rel.love * 0.5),
      sexualSat: clamp(compat.sexual * 0.6 + rel.attraction * 0.4),
      passion: clamp((rel.love + rel.attraction) / 2),
      stability: clamp(rel.trust * 0.5 + compat.overall * 0.3 + (rel.externalApproval ?? 60) * 0.2),
      commitment: COMMITMENT_BY_MODEL[rel.relationshipModel ?? 'dating'],
    }
  }

  // ── main annual tick ────────────────────────────────────────────────────

  static annualTick(state: GameState, relationships: Relationship[]): RomanticTickResult {
    const player = this.playerProfile(state)
    const year = state.time.year
    const effects: Effect = {}
    const messages: string[] = []
    const addFx = (e: Effect) => { for (const k of Object.keys(e)) effects[k] = (effects[k] ?? 0) + (e[k] ?? 0) }
    let budget = 3 // cap romantic log lines per year to avoid spam
    const spend = (): boolean => { if (budget > 0) { budget--; return true } return false }

    // Social attention allocation: read how many interactions player had with each
    // romantic partner this year (tracked in diminishingReturns by the store).
    const yearStr = String(year)
    const getPlayerInteracts = (rel: Relationship): number => {
      const key = `interact_${rel.id}_${yearStr}`
      return ((state as unknown as { diminishingReturns?: Record<string, number> }).diminishingReturns ?? {})[key] ?? 0
    }
    const romanticRels = relationships.filter(r => r.isAlive && isRomantic(r))
    const totalAttention = romanticRels.reduce((sum, r) => sum + getPlayerInteracts(r), 0)
    const hasMultiplePartners = romanticRels.length >= 2

    // Pool of "available alternatives" the NPC could stray with.
    // Excludes family and romantic partners; used both for opportunity measure and
    // as the pool from which a named affair partner is drawn.
    const FAMILY_TYPES = new Set(['parent', 'sibling', 'child'])
    const alternatives = relationships.filter(r =>
      r.isAlive && r.age >= 18 && !isRomantic(r) && !FAMILY_TYPES.has(r.type)
    )

    const out = relationships.map(rel => {
      if (!rel.isAlive) return rel

      // ── obsession ladder for exes / rejected (toxic behaviour) ──
      if (rel.type === 'ex_partner' || rel.historyFlags.includes('rejected_recently')) {
        const updated = this._obsessionStep(rel, player, state, year, messages, addFx, spend)
        if (updated) return updated
      }

      if (!isRomantic(rel)) return rel

      // lazily fill the simulation fields
      const profile = this.ensureProfile(rel)
      const compat = rel.compatibility ?? this.computeCompatibility(player, profile, rel, state)
      const model = rel.relationshipModel ?? this.classifyModel(player, profile, compat, rel, state)
      let bond = this.ensureBond({ ...rel, relationshipModel: model, compatibility: compat }, compat)

      // ── bond drift ──
      bond = this._driftBond(rel, profile, compat, bond, state)

      let next: Relationship = {
        ...rel,
        romanticProfile: profile,
        compatibility: compat,
        relationshipModel: model,
        bond,
        externalApproval: this._driftApproval(rel, player, profile, state),
      }

      // ── infidelity decision ──
      next = this._infidelityStep(next, player, profile, compat, bond, model, alternatives, state, year, messages, addFx, spend)

      // ── proposals / ultimatums ──
      next = this._proposalStep(next, profile, bond, model, state, year, messages, spend)

      // ── suspicion drift ──
      const interacts = getPlayerInteracts(rel)
      const attentionShare = romanticRels.length > 1
        ? (totalAttention > 0 ? interacts / totalAttention : 1 / romanticRels.length)
        : 1
      next = this._suspicionStep(next, profile, bond, attentionShare, hasMultiplePartners, year, messages, spend)

      // ── NPC life events (autonomous partner activities) ──
      next = this._npcLifeStep(next, profile, state, year, messages, addFx, spend)

      return next
    })

    // ── double-relationship drama ──
    if (hasMultiplePartners) {
      this._doubleDramaStep(romanticRels, state, year, messages, spend)
    }

    // ── social network gossip ──
    this._socialNetworkStep(relationships, out, year, messages, addFx, spend)

    return { relationships: out, effects, messages }
  }

  // ── bond drift: satisfaction dimensions regress toward compatibility,
  //    nudged by recent interaction momentum (chain flags) and life stressors. ──
  private static _driftBond(rel: Relationship, profile: RomanticProfile, compat: CompatibilityScores, bond: RelationshipBond, state: GameState): RelationshipBond {
    const flags = new Set(rel.historyFlags)
    const warmth = (flags.has('chain_warmth') ? 4 : 0) + (flags.has('chain_gratitude') ? 3 : 0) + (flags.has('chain_repairing') ? 2 : 0)
    const friction = (flags.has('chain_tension') ? 4 : 0) + (flags.has('chain_trust_decay') ? 5 : 0) + (flags.has('chain_jealousy') ? 4 : 0)

    // economic stress when the player is broke; relieved when comfortable
    const moneyStress = state.finance.money < 0 ? 6 : state.finance.money < 500 ? 3 : 0
    const ageDecline = rel.age > 50 ? 2 : 0

    // each dimension eases toward its target (compat-driven) by ~25%/yr + momentum
    const ease = (cur: number, target: number) => cur + (target - cur) * 0.25

    const emotionalSat = clamp(ease(bond.emotionalSat, compat.affective * 0.6 + rel.love * 0.4) + warmth - friction - moneyStress * 0.5)
    const sexualSat = clamp(ease(bond.sexualSat, compat.sexual) + (warmth > 0 ? 2 : 0) - ageDecline - friction * 0.4)
    const passion = clamp(bond.passion - 2 - ageDecline + warmth * 0.8 - friction * 0.5) // passion naturally cools
    const stability = clamp(ease(bond.stability, rel.trust * 0.5 + compat.overall * 0.3 + (rel.externalApproval ?? 60) * 0.2) - moneyStress - friction * 0.4)
    const commitment = clamp(bond.commitment + (profile.fidelity > 60 ? 1 : -1) + (emotionalSat > 70 ? 1 : 0))

    return { emotionalSat: round(emotionalSat), sexualSat: round(sexualSat), passion: round(passion), stability: round(stability), commitment: round(commitment) }
  }

  // ── external approval drift from social/economic/cultural/religious gaps ──
  private static _driftApproval(rel: Relationship, player: RomanticProfile, profile: RomanticProfile, state: GameState): number {
    let approval = rel.externalApproval ?? 60
    const religiousGap = Math.abs(player.religiousness - profile.religiousness)
    const culturalGap = rel.nationality !== state.identity.nationality ? 15 : 0
    const economicGap = state.finance.money < 0 ? 8 : 0
    const valueBond = (player.empathy + profile.empathy) / 2 > 65 ? 3 : 0

    approval += valueBond - religiousGap * 0.06 - culturalGap * 0.1 - economicGap * 0.2
    // approval slowly normalises toward acceptance as the couple endures
    approval += rel.historyFlags.includes('married') ? 2 : 0
    return round(clamp(approval))
  }

  // ── infidelity: probability, type selection, secrecy, discovery ──
  private static _infidelityStep(
    rel: Relationship,
    player: RomanticProfile,
    profile: RomanticProfile,
    compat: CompatibilityScores,
    bond: RelationshipBond,
    model: RelationshipModel,
    alternatives: Relationship[],
    state: GameState,
    year: number,
    messages: string[],
    addFx: (e: Effect) => void,
    spend: () => boolean,
  ): Relationship {
    const affairs = rel.secretAffairs ?? []
    const exclusive = model === 'serious' || model === 'dating' || rel.stage === 'spouse'
    const name = firstName(rel.name)

    // ── P(stray) — bounded 0..~0.35 ──
    const opportunity = clamp(20 + alternatives.length * 6, 0, 70)
    const dissatisfaction = (200 - bond.emotionalSat - bond.sexualSat) / 2 // 0..100
    let pStray =
        dissatisfaction * 0.0022
      + (100 - profile.fidelity) * 0.0016
      + profile.freedomDrive * 0.0009
      + opportunity * 0.0010
      + profile.craziness * 0.0006
      - profile.religiousness * 0.0010
      - bond.commitment * 0.0008
    if (model === 'open' || model === 'poly') pStray *= 0.35
    pStray = clamp(pStray, 0, 0.35)

    let next = rel
    if (Math.random() < pStray) {
      const kind = this._affairKind(profile, bond, compat)
      const existing = affairs.find(a => a.kind === kind && !a.discovered)
      const intensity = clamp((kind === 'emotional' ? 100 - bond.emotionalSat : 100 - bond.sexualSat) * 0.5 + 30)

      // Pick a named, persistent affair partner from the known NPC pool.
      // Prefer NPCs already in the alternatives list; fall back to a generated name.
      const loverNpc = alternatives.length > 0
        ? alternatives[Math.floor(Math.random() * alternatives.length)]
        : null
      const loverGender = rel.gender === 'male' ? 'female' : rel.gender === 'female' ? 'male' : 'male'
      const loverName = loverNpc?.name ?? NameEngine.fullName(loverGender)
      const loverId = loverNpc?.id

      const updatedAffairs: SecretAffair[] = existing
        ? affairs.map(a => a === existing ? { ...a, intensity: clamp(a.intensity + 15) } : a)
        : [...affairs, { loverName, loverId, kind, startYear: year, intensity, discovered: false }]

      // ── open/poly: transparent, the NPC simply tells the player ──
      if (model === 'open' || model === 'poly') {
        next = { ...rel, secretAffairs: updatedAffairs, historyFlags: uniq([...rel.historyFlags, 'open_partner_active']) }
        if (spend()) messages.push(`💞 ${name} ha visto un'altra persona — coerente con la vostra relazione ${model === 'poly' ? 'poliamorosa' : 'aperta'}.`)
        return next
      }

      // ── confess vs lie vs hide (personality-driven) ──
      const confessProb = clamp(profile.honesty * 0.006 + profile.courage * 0.004 + profile.emotionalMaturity * 0.003 - 0.25, 0, 0.85)
      if (Math.random() < confessProb) {
        // honest confession — painful but preserves a chance to repair
        next = {
          ...rel,
          trust: clamp(rel.trust - 25), love: clamp(rel.love - 18),
          secretAffairs: updatedAffairs.map(a => ({ ...a, discovered: true })),
          historyFlags: uniq([...rel.historyFlags, 'confessed_affair']),
          mood: 'triste',
        }
        addFx({ happiness: -12, mentalHealth: -8 })
        if (spend()) messages.push(`💔 ${name} ti ha confessato un tradimento (${AFFAIR_LABEL[kind]}). La sincerità non rende il colpo meno duro.`)
        return next
      }

      // ── kept secret — may be discovered now or in a future year ──
      next = { ...rel, secretAffairs: updatedAffairs, historyFlags: uniq([...rel.historyFlags, 'cheated_secretly']) }
    }

    // ── discovery check on any undiscovered, harmful affair ──
    if (exclusive) {
      const active = (next.secretAffairs ?? []).filter(a => !a.discovered)
      if (active.length > 0) {
        const pDiscover = this._discoveryProb(next, player, profile, active.length, state)
        if (Math.random() < pDiscover) {
          const worst = active.reduce((a, b) => (a.intensity >= b.intensity ? a : b))
          const ended = worst.intensity > 70 || worst.kind === 'double_life'
          next = {
            ...next,
            trust: clamp(next.trust - 35), love: clamp(next.love - 30), jealousy: clamp(next.jealousy + 20),
            secretAffairs: (next.secretAffairs ?? []).map(a => ({ ...a, discovered: true })),
            historyFlags: uniq([...next.historyFlags, 'cheated_on_player', ...(ended ? ['affair_ended_relationship'] : [])]),
            ...(ended ? { type: 'ex_partner' as const, stage: 'acquaintance' as const } : {}),
            mood: 'arrabbiato',
          }
          addFx({ happiness: -16, mentalHealth: -12, ...(ended ? { reputation: -4 } : {}) })
          if (spend()) {
            const since = year - worst.startYear
            messages.push(
              since >= 2
                ? `🕵️ Hai scoperto che ${name} ti tradiva da ${since} anni (${AFFAIR_LABEL[worst.kind]}). ${ended ? 'È finita.' : 'La relazione è in crisi.'}`
                : `🕵️ Hai scoperto un tradimento di ${name} (${AFFAIR_LABEL[worst.kind]}). ${ended ? 'È finita.' : 'La fiducia è a pezzi.'}`,
            )
          }
        }
      }
    }
    return next
  }

  /** Choose the kind of affair from where the bond is weakest + personality. */
  private static _affairKind(profile: RomanticProfile, bond: RelationshipBond, compat: CompatibilityScores): AffairKind {
    const emotionalGap = 100 - bond.emotionalSat
    const sexualGap = 100 - bond.sexualSat
    if (profile.freedomDrive > 70 && profile.craziness > 60 && emotionalGap > 40 && sexualGap > 40) return 'double_life'
    if (emotionalGap > sexualGap + 15) return 'emotional'
    if (sexualGap > emotionalGap + 15) return 'sexual'
    if (profile.fidelity < 35 && compat.overall < 50) return 'ongoing'
    return 'occasional'
  }

  /** P(discovery) — partner vigilance, deceiver prudence, exposure surface. */
  private static _discoveryProb(rel: Relationship, player: RomanticProfile, profile: RomanticProfile, affairCount: number, state: GameState): number {
    const cohabiting = rel.historyFlags.includes('cohabiting') || rel.stage === 'spouse'
    const hasChildren = (state.children?.length ?? 0) > 0
    const p =
        player.jealousy * 0.0020         // a jealous player snoops
      + player.intelligence * 0.0012     // a sharp player connects dots
      - profile.intelligence * 0.0014    // a clever cheater covers tracks
      + affairCount * 0.05               // more affairs → bigger surface
      + (cohabiting ? 0.10 : 0)
      + (hasChildren ? 0.05 : 0)
      + 0.06                             // base rumour/social-network leak
    return clamp(p, 0.03, 0.85)
  }

  // ── proposals / ultimatums the NPC can initiate ──
  private static _proposalStep(
    rel: Relationship,
    profile: RomanticProfile,
    bond: RelationshipBond,
    model: RelationshipModel,
    state: GameState,
    _year: number,
    messages: string[],
    spend: () => boolean,
  ): Relationship {
    const name = firstName(rel.name)
    const flags = new Set(rel.historyFlags)

    // Ask for exclusivity (casual/dating/fwb → serious) when emotionally invested.
    if ((model === 'dating' || model === 'casual' || model === 'fwb') && !flags.has('asked_exclusivity')
        && bond.emotionalSat > 65 && profile.jealousy > 55 && Math.random() < 0.10) {
      if (spend()) messages.push(`💬 ${name} ti ha chiesto di rendere ufficiale ed esclusiva la relazione.`)
      return { ...rel, relationshipModel: 'serious', bond: { ...bond, commitment: clamp(bond.commitment + 12) }, historyFlags: uniq([...rel.historyFlags, 'asked_exclusivity']) }
    }

    // Propose opening the relationship when autonomy is high and sex is unsatisfying.
    if (model === 'serious' && !flags.has('proposed_open')
        && profile.freedomDrive > 72 && bond.sexualSat < 45 && profile.religiousness < 40 && Math.random() < 0.06) {
      if (spend()) messages.push(`🔓 ${name} ti ha proposto di trasformarla in una relazione aperta.`)
      return { ...rel, historyFlags: uniq([...rel.historyFlags, 'proposed_open']) }
    }

    // Push toward cohabitation, then marriage, as a serious bond matures.
    if (model === 'serious' && rel.stage === 'partner' && !flags.has('cohabiting') && !flags.has('npc_proposed_cohab')
        && bond.stability > 68 && bond.commitment > 60 && Math.random() < 0.08) {
      if (spend()) messages.push(`🏠 ${name} vorrebbe andare a vivere con te.`)
      return { ...rel, historyFlags: uniq([...rel.historyFlags, 'npc_proposed_cohab']) }
    }
    if (model === 'serious' && rel.stage === 'partner' && state.time.age >= 20 && !flags.has('npc_proposed_marriage')
        && bond.stability > 72 && bond.commitment > 70 && (rel.externalApproval ?? 60) > 50 && Math.random() < 0.05) {
      if (spend()) messages.push(`💍 ${name} ha lasciato intendere di voler fare il grande passo: il matrimonio.`)
      return { ...rel, historyFlags: uniq([...rel.historyFlags, 'npc_proposed_marriage']) }
    }
    return rel
  }

  // ── suspicion drift and threshold events ──────────────────────────────────
  private static _suspicionStep(
    rel: Relationship,
    profile: RomanticProfile,
    bond: RelationshipBond,
    attentionShare: number,
    hasMultiplePartners: boolean,
    year: number,
    messages: string[],
    spend: () => boolean,
  ): Relationship {
    const prevSusp = rel.suspicion ?? 0
    const name = firstName(rel.name)

    // Build suspicion delta
    let delta = 0

    // Neglect: too little attention compared to other partners
    if (attentionShare < 0.20) delta += 14
    else if (attentionShare < 0.40) delta += 7
    else if (attentionShare > 0.70) delta -= 5   // lots of attention → reassured

    // Multiple partners: NPC senses reduced availability
    if (hasMultiplePartners) delta += 8

    // Bond signals
    if (bond.emotionalSat < 35) delta += 7
    if (bond.sexualSat < 30) delta += 5
    if (bond.passion < 25) delta += 4

    // Undiscovered active affairs visible to this NPC (cohabiting = more exposure)
    const activeAffairs = (rel.secretAffairs ?? []).filter(a => !a.discovered)
    const cohabiting = rel.historyFlags.includes('cohabiting') || rel.stage === 'spouse'
    if (activeAffairs.length > 0 && cohabiting) delta += 12
    else if (activeAffairs.length > 0) delta += 5

    // Warmth and trust cool suspicion
    if (rel.historyFlags.includes('chain_warmth')) delta -= 10
    delta -= rel.trust * 0.04
    delta -= rel.love * 0.02

    const suspicion = clamp(round(prevSusp + delta))

    // Threshold crossing events (fire once per crossing)
    const crossed = (t: number) => prevSusp < t && suspicion >= t
    if (crossed(80) && spend()) {
      messages.push(`😤 ${name} ti affronta direttamente: "Credo che tu mi stia tradendo."`)
    } else if (crossed(60) && spend()) {
      messages.push(`📱 ${name} chiede di vedere il tuo telefono. "Non hai nulla da nascondere, vero?"`)
    } else if (crossed(40) && spend()) {
      messages.push(`👀 ${name}: "Chi è quella persona che continua a mettere like alle tue foto?"`)
    } else if (crossed(20) && spend()) {
      messages.push(`💭 ${name} dice sottovoce: "Mi sembri distante ultimamente..."`)
    }

    // At 80+ suspicion, trust and love erode autonomously
    const trustPenalty = suspicion >= 80 ? -6 : suspicion >= 60 ? -2 : 0
    const lovePenalty = suspicion >= 80 ? -4 : 0

    void profile  // used for future extensions (e.g. personality-based suspicion scaling)
    void year     // available for time-based logic if needed in the future

    return {
      ...rel,
      suspicion,
      trust: clamp(round(rel.trust + trustPenalty)),
      love: clamp(round(rel.love + lovePenalty)),
    }
  }

  // ── NPC autonomous life events (partner has their own social life) ──────────
  private static _npcLifeStep(
    rel: Relationship,
    profile: RomanticProfile,
    state: GameState,
    year: number,
    messages: string[],
    addFx: (e: Effect) => void,
    spend: () => boolean,
  ): Relationship {
    // Rate-limit: one autonomous event per NPC per year
    if ((rel.npcLifeYear ?? 0) >= year) return rel
    if (Math.random() > 0.28) return rel  // 28% chance any event fires at all

    const name = firstName(rel.name)
    type LifeEvent = { msg: string; jealousyHit?: number; trustDelta?: number }
    const pool: LifeEvent[] = []

    // Social outings (more likely for high freedom)
    if (profile.freedomDrive > 35) {
      pool.push({ msg: `🎉 ${name} è uscita/o con gli amici sabato sera.`, jealousyHit: profile.freedomDrive > 65 ? 5 : 0 })
    }
    // New hobby
    {
      const hobbies = ['la palestra', 'la pittura', 'la danza', 'lo yoga', 'la fotografia', 'il teatro']
      const h = hobbies[Math.floor(Math.random() * hobbies.length)]
      pool.push({ msg: `🎨 ${name} ha iniziato ${h}. Sembra entusiasta.` })
    }
    // Provocative social media (young + high freedom)
    if (rel.age < 38 && profile.freedomDrive > 55) {
      pool.push({ msg: `📸 ${name} ha pubblicato una foto molto provocante. Riceve molti commenti.`, jealousyHit: 8 })
    }
    // Colleague/friend social proximity
    if (Math.random() < 0.4) {
      pool.push({ msg: `🚗 Un collega di ${name} la/lo accompagna spesso a casa. ${name} dice che sono solo amici.`, jealousyHit: 6 })
    }
    // Career change / travel (independence signal)
    if (profile.ambition > 60 && Math.random() < 0.3) {
      pool.push({ msg: `💼 ${name} sta considerando un cambiamento di carriera. Ultimamente è spesso fuori.`, jealousyHit: 0 })
    }

    if (pool.length === 0) return rel

    const ev = pool[Math.floor(Math.random() * pool.length)]
    if (!spend()) return rel

    messages.push(ev.msg)
    if ((ev.jealousyHit ?? 0) > 0) {
      addFx({ happiness: -Math.round((ev.jealousyHit!) / 3) })
    }

    void state  // used for future extensions (e.g. checking player traits)
    return { ...rel, npcLifeYear: year }
  }

  // ── double-relationship drama (when player has 2+ romantic partners) ────────
  private static _doubleDramaStep(
    romanticRels: Relationship[],
    _state: GameState,
    _year: number,
    messages: string[],
    spend: () => boolean,
  ): void {
    if (!spend()) return
    const [r1, r2] = romanticRels
    const n1 = firstName(r1.name)
    const n2 = firstName(r2.name)

    const roll = Math.random()
    if (roll < 0.25) {
      messages.push(`📅 Sia ${n1} che ${n2} vogliono uscire con te lo stesso weekend. Dovrai trovare una scusa.`)
    } else if (roll < 0.50) {
      messages.push(`📱 ${n2} ti chiama mentre sei con ${n1}. Momento di tensione.`)
    } else if (roll < 0.68) {
      messages.push(`💌 Hai inviato per errore un messaggio romantico a ${n1} che era destinato a ${n2}. Panico.`)
    } else if (roll < 0.82) {
      messages.push(`👥 ${n1} e ${n2} si trovano casualmente nello stesso posto. L'aria è glaciale.`)
    } else if (roll < 0.92) {
      messages.push(`🎂 Hai dimenticato il compleanno di ${n1} — stavi festeggiando con ${n2}.`)
    } else {
      messages.push(`🏷️ ${n2} ha pubblicato una vostra foto insieme. ${n1} l'ha vista.`)
    }
  }

  // ── social network gossip (friends/colleagues can expose affairs) ───────────
  private static _socialNetworkStep(
    allRelationships: Relationship[],
    out: Relationship[],
    _year: number,
    messages: string[],
    addFx: (e: Effect) => void,
    spend: () => boolean,
  ): void {
    // For each romantic NPC with undiscovered affairs, check if the social
    // network is likely to leak the information.
    const socialContacts = allRelationships.filter(r =>
      r.isAlive && ['friend', 'best_friend', 'colleague', 'acquaintance'].includes(r.type)
    )
    if (socialContacts.length === 0) return

    for (let i = 0; i < out.length; i++) {
      const rel = out[i]
      if (!isRomantic(rel)) continue
      const activeAffairs = (rel.secretAffairs ?? []).filter(a => !a.discovered)
      if (activeAffairs.length === 0) continue

      // Probability proportional to social exposure
      const pGossip = Math.min(0.18, 0.03 + socialContacts.length * 0.025)
      if (Math.random() < pGossip && spend()) {
        const affair = activeAffairs[Math.floor(Math.random() * activeAffairs.length)]
        const gossiper = socialContacts[Math.floor(Math.random() * socialContacts.length)]
        messages.push(`🗣️ ${gossiper.name} ha sentito pettegolezzi su te e ${affair.loverName}. Le voci si diffondono.`)
        addFx({ reputation: -4, socialReputation: -3 })
        // Escalate suspicion on the cheated-on partner
        out[i] = { ...out[i], suspicion: clamp((out[i].suspicion ?? 0) + 22) }
      }
    }
  }

  // ── obsession escalation ladder (post-rejection / post-breakup) ──
  private static _obsessionStep(
    rel: Relationship,
    player: RomanticProfile,
    state: GameState,
    year: number,
    messages: string[],
    addFx: (e: Effect) => void,
    spend: () => boolean,
  ): Relationship | null {
    const profile = this.ensureProfile(rel)
    // propensity for obsessive fixation
    const drive = clamp(profile.craziness * 0.35 + profile.jealousy * 0.30 + (100 - profile.selfEsteem) * 0.20 + (100 - profile.emotionalMaturity) * 0.15)
    if (drive < 55) return null

    const obsession = rel.obsession ?? { level: 0, sinceYear: year, behaviors: [] }
    // escalate when the breakup is recent; decay otherwise
    const recent = rel.historyFlags.includes('rejected_recently') || (year - obsession.sinceYear) < 3
    const delta = recent ? (drive - 50) * 0.4 : -12
    const level = clamp(obsession.level + delta)
    if (level <= 0 && obsession.behaviors.length === 0) return { ...rel, obsession: { ...obsession, level: 0 } }

    const ladder = OBSESSION_LADDER
    const stageIdx = Math.min(ladder.length - 1, Math.floor(level / 25))
    const behavior = ladder[stageIdx]
    const known = new Set(obsession.behaviors)
    const name = firstName(rel.name)

    let result: Relationship = { ...rel, obsession: { level: round(level), sinceYear: obsession.sinceYear, behaviors: obsession.behaviors } }
    if (level >= 25 && !known.has(behavior.key)) {
      result = { ...result, obsession: { ...result.obsession!, behaviors: [...obsession.behaviors, behavior.key] } }
      addFx(behavior.effect)
      // a sharp/brave player can defuse milder stages; severe ones always sting
      if (spend()) messages.push(`${behavior.emoji} ${name} ${behavior.text}`)
    }
    return result
  }
}

// ─── lookup tables ──────────────────────────────────────────────────────────

function uniq(arr: string[]): string[] { return [...new Set(arr)] }

const COMMITMENT_BY_MODEL: Record<RelationshipModel, number> = {
  serious: 75, dating: 45, casual: 25, fwb: 20, open: 50, poly: 55,
}

const AFFAIR_LABEL: Record<AffairKind, string> = {
  occasional: 'scappatella occasionale',
  ongoing: 'relazione continuativa',
  emotional: 'tradimento emotivo',
  sexual: 'tradimento sessuale',
  double_life: 'doppia vita',
}

// Toxic behaviour escalation: each 25 levels unlocks the next rung.
const OBSESSION_LADDER: { key: string; emoji: string; text: string; effect: Effect }[] = [
  { key: 'monitoring', emoji: '👀', text: 'continua a controllare ogni tua mossa sui social.', effect: { mentalHealth: -3 } },
  { key: 'following',  emoji: '🚶', text: 'è stato/a visto/a aggirarsi vicino a casa tua.', effect: { mentalHealth: -6, happiness: -3 } },
  { key: 'blackmail',  emoji: '✉️', text: 'ha minacciato di rivelare cose private su di te.', effect: { mentalHealth: -10, reputation: -4 } },
  { key: 'threats',    emoji: '⚠️', text: 'è diventato/a apertamente minaccioso/a. Valuta di proteggerti.', effect: { mentalHealth: -14, happiness: -8 } },
]
