import type { GameState, Effect, Relationship } from '../store/types'

// =============================================================================
// MinorEconomyEngine — centralized economic logic for under-age characters.
//
// Real children/teenagers do not freely spend their own money on hobbies,
// sports memberships or equipment. Every discretionary expense by a minor must
// be submitted to the parents, who can approve (and pay) or refuse it.
//
// This engine is the SINGLE source of truth for that rule. Any action that
// charges a minor money should route the expense through `evaluateExpense`
// (or the `resolveMinorExpense` helper in the store) so the behaviour stays
// uniform across the whole game and cannot be bypassed.
// =============================================================================

export const MINOR_AGE = 18

export interface MinorApprovalResult {
  /** Whether the character is currently a minor. */
  isMinor: boolean
  /** Whether the expense may proceed. */
  approved: boolean
  /** True when the parents covered the cost (the minor's own money is untouched). */
  paidByParents: boolean
  /** User-facing message (Italian) describing the outcome. */
  message: string
  /** The reason for a refusal, when applicable. */
  reason?: 'no_parents' | 'too_expensive' | 'low_trust' | 'mood' | 'insufficient_parent_funds'
}

export class MinorEconomyEngine {
  static readonly MINOR_AGE = MINOR_AGE

  static isMinor(state: Pick<GameState, 'time'>): boolean {
    return state.time.age < MINOR_AGE
  }

  /** Living parents of the player. */
  private static livingParents(relationships: Relationship[]): Relationship[] {
    return relationships.filter(r => r.type === 'parent' && r.isAlive)
  }

  /**
   * Evaluate whether a discretionary expense of `amount` (positive number, in €)
   * is allowed for the current character.
   *
   * - Adults: always approved, they pay themselves (paidByParents = false).
   * - Minors with a free action (amount <= 0): approved, no payment needed.
   * - Minors: parents decide. If approved, the parents pay.
   */
  static evaluateExpense(state: GameState, amount: number, label: string): MinorApprovalResult {
    // Adults handle their own finances.
    if (!this.isMinor(state)) {
      return { isMinor: false, approved: true, paidByParents: false, message: '' }
    }

    // Free actions never need approval.
    if (amount <= 0) {
      return { isMinor: true, approved: true, paidByParents: false, message: '' }
    }

    const parents = this.livingParents(state.relationships)

    // No parents → no one to approve or pay. The minor cannot fund it alone.
    if (parents.length === 0) {
      return {
        isMinor: true,
        approved: false,
        paidByParents: false,
        reason: 'no_parents',
        message: `Sei minorenne e non hai un genitore che possa autorizzare e pagare "${label}".`,
      }
    }

    // Parents must be able to afford it. We model an implicit household budget so
    // very expensive requests are realistically out of reach.
    const householdBudget = this.householdBudget(state)
    if (amount > householdBudget) {
      return {
        isMinor: true,
        approved: false,
        paidByParents: false,
        reason: 'insufficient_parent_funds',
        message: `I tuoi genitori non possono permettersi "${label}" (€${Math.round(amount).toLocaleString('it-IT')}) in questo momento.`,
      }
    }

    const chance = this.approvalChance(state, parents, amount)
    const approved = Math.random() < chance

    const parentName = parents[Math.floor(Math.random() * parents.length)].name

    if (approved) {
      return {
        isMinor: true,
        approved: true,
        paidByParents: true,
        message: `${parentName} approva e paga "${label}" (€${Math.round(amount).toLocaleString('it-IT')}).`,
      }
    }

    // Pick a refusal reason that reflects why it most likely failed.
    const avgTrust = this.avgParentTrust(parents)
    const reason: MinorApprovalResult['reason'] =
      amount > 400 ? 'too_expensive' : avgTrust < 40 ? 'low_trust' : 'mood'

    const refusalMessage =
      reason === 'too_expensive'
        ? `${parentName} dice che "${label}" è troppo costoso per ora. Richiesta respinta.`
        : reason === 'low_trust'
          ? `${parentName} non se la sente di pagarti "${label}". Migliora il vostro rapporto e riprova.`
          : `${parentName} non è dell'umore giusto e rifiuta "${label}". Riprova più avanti.`

    return { isMinor: true, approved: false, paidByParents: false, reason, message: refusalMessage }
  }

  // --- internal heuristics (kept small and tunable) ---

  private static avgParentTrust(parents: Relationship[]): number {
    if (parents.length === 0) return 0
    return parents.reduce((sum, p) => sum + (p.trust ?? 50), 0) / parents.length
  }

  /** A rough ceiling for what the parents can pay for a single request. */
  private static householdBudget(state: GameState): number {
    const tier = state.family?.familyWealthTier ?? 'middle'
    const byTier: Record<string, number> = {
      poor: 400,
      lower_middle: 900,
      middle: 2000,
      upper_middle: 6000,
      rich: 25000,
      elite: 100000,
    }
    return byTier[tier] ?? 2000
  }

  /** Probability (0.05–0.97) that the parents approve the request. */
  private static approvalChance(state: GameState, parents: Relationship[], amount: number): number {
    let chance = 0.85

    // Cost tiers reduce the chance progressively.
    if (amount > 100) chance -= 0.10
    if (amount > 300) chance -= 0.15
    if (amount > 600) chance -= 0.20
    if (amount > 1000) chance -= 0.20

    // Relationship with the parents matters a lot.
    const avgTrust = this.avgParentTrust(parents)
    chance += (avgTrust - 50) / 200 // ±0.25

    // Wealth tier nudges generosity.
    const tier = state.family?.familyWealthTier ?? 'middle'
    if (tier === 'rich' || tier === 'elite') chance += 0.10
    else if (tier === 'poor' || tier === 'lower_middle') chance -= 0.10

    // Well-behaved kids (good karma) get a small boost.
    if ((state.stats.karma ?? 0) > 20) chance += 0.05
    else if ((state.stats.karma ?? 0) < -20) chance -= 0.05

    return Math.max(0.05, Math.min(0.97, chance))
  }

  /**
   * Adjust an effect bundle for a minor expense outcome.
   * When the parents pay, the negative `money` cost is removed from the minor's
   * own balance (the parents covered it). All other effects are preserved.
   */
  static adjustEffects(effects: Effect, paidByParents: boolean): Effect {
    if (!paidByParents) return effects
    const adjusted: Effect = { ...effects }
    if ((adjusted.money ?? 0) < 0) delete adjusted.money
    return adjusted
  }
}
