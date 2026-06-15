import type { GameState, Effect, HiddenTalent, PlayerContract, TransferOffer, SeasonStats, PendingCareerOffer, ContractRole } from '../store/types'
import type { SpecialCareer } from './SpecialCareerEngine'

// ============================================================================
// CareerLifecycleEngine — BitLife-style full athlete career system.
// Season stats, scouting, contracts, transfers, legacy.
// ============================================================================

type TeamTier = 'elite' | 'professional' | 'amateur'

interface TeamDef {
  id: string; name: string; emoji: string; sport: string
  tier: TeamTier; strength: number; reputation: number
  ranking: number; salaryMultiplier: number
}

// --- Italian teams database ---

const CALCIO_TEAMS: TeamDef[] = [
  { id: 'juventus',   name: 'Juventus',   emoji: '⚪⚫', sport: 'calcio', tier: 'elite',        strength: 95, reputation: 98, ranking:  1, salaryMultiplier: 2.50 },
  { id: 'inter',      name: 'Inter',      emoji: '⚫🔵', sport: 'calcio', tier: 'elite',        strength: 93, reputation: 96, ranking:  2, salaryMultiplier: 2.30 },
  { id: 'milan',      name: 'Milan',      emoji: '🔴⚫', sport: 'calcio', tier: 'elite',        strength: 91, reputation: 95, ranking:  3, salaryMultiplier: 2.10 },
  { id: 'napoli',     name: 'Napoli',     emoji: '🔵⚪', sport: 'calcio', tier: 'elite',        strength: 89, reputation: 90, ranking:  4, salaryMultiplier: 1.90 },
  { id: 'roma',       name: 'Roma',       emoji: '🟡🔴', sport: 'calcio', tier: 'elite',        strength: 86, reputation: 88, ranking:  5, salaryMultiplier: 1.70 },
  { id: 'lazio',      name: 'Lazio',      emoji: '🔵',   sport: 'calcio', tier: 'elite',        strength: 82, reputation: 84, ranking:  7, salaryMultiplier: 1.50 },
  { id: 'atalanta',   name: 'Atalanta',   emoji: '🔵⚫', sport: 'calcio', tier: 'elite',        strength: 84, reputation: 82, ranking:  6, salaryMultiplier: 1.40 },
  { id: 'fiorentina', name: 'Fiorentina', emoji: '🟣',   sport: 'calcio', tier: 'elite',        strength: 78, reputation: 78, ranking:  9, salaryMultiplier: 1.20 },
  { id: 'bologna',    name: 'Bologna',    emoji: '🔴🔵', sport: 'calcio', tier: 'professional', strength: 72, reputation: 70, ranking: 10, salaryMultiplier: 0.80 },
  { id: 'torino',     name: 'Torino',     emoji: '🔴',   sport: 'calcio', tier: 'professional', strength: 68, reputation: 67, ranking: 12, salaryMultiplier: 0.70 },
  { id: 'parma',      name: 'Parma',      emoji: '🟡🔵', sport: 'calcio', tier: 'professional', strength: 62, reputation: 62, ranking: 15, salaryMultiplier: 0.60 },
  { id: 'como',       name: 'Como',       emoji: '🔵⚪', sport: 'calcio', tier: 'professional', strength: 58, reputation: 55, ranking: 17, salaryMultiplier: 0.55 },
  { id: 'palermo',    name: 'Palermo',    emoji: '🌸',   sport: 'calcio', tier: 'amateur',      strength: 45, reputation: 45, ranking: 20, salaryMultiplier: 0.30 },
  { id: 'bari',       name: 'Bari',       emoji: '🔴⚪', sport: 'calcio', tier: 'amateur',      strength: 42, reputation: 40, ranking: 22, salaryMultiplier: 0.28 },
  { id: 'modena',     name: 'Modena',     emoji: '🟡⚫', sport: 'calcio', tier: 'amateur',      strength: 38, reputation: 35, ranking: 25, salaryMultiplier: 0.22 },
  { id: 'reggiana',   name: 'Reggiana',   emoji: '🔴⚪', sport: 'calcio', tier: 'amateur',      strength: 35, reputation: 30, ranking: 28, salaryMultiplier: 0.18 },
]

const BASKET_TEAMS: TeamDef[] = [
  { id: 'olimpia',    name: 'Olimpia Milano',  emoji: '🔴⚫', sport: 'basket', tier: 'elite',        strength: 92, reputation: 90, ranking: 1, salaryMultiplier: 2.00 },
  { id: 'virtus',     name: 'Virtus Bologna',  emoji: '⚫🔴', sport: 'basket', tier: 'elite',        strength: 88, reputation: 86, ranking: 2, salaryMultiplier: 1.80 },
  { id: 'brescia_bk', name: 'Brescia Basket',  emoji: '🔵⚪', sport: 'basket', tier: 'professional', strength: 74, reputation: 70, ranking: 4, salaryMultiplier: 1.00 },
  { id: 'sassari_bk', name: 'Dinamo Sassari',  emoji: '🔵',   sport: 'basket', tier: 'professional', strength: 70, reputation: 68, ranking: 5, salaryMultiplier: 0.90 },
  { id: 'trento_bk',  name: 'Dolomiti Trento', emoji: '🔵🟡', sport: 'basket', tier: 'professional', strength: 65, reputation: 62, ranking: 7, salaryMultiplier: 0.70 },
  { id: 'brindisi',   name: 'Brindisi Basket', emoji: '🔴⚪', sport: 'basket', tier: 'amateur',      strength: 48, reputation: 44, ranking: 10, salaryMultiplier: 0.35 },
]

const COMBAT_TEAMS: TeamDef[] = [
  { id: 'ufc',        name: 'UFC',         emoji: '🥊🌍', sport: 'mma',    tier: 'elite',        strength: 95, reputation: 98, ranking: 1, salaryMultiplier: 2.50 },
  { id: 'bellator',   name: 'Bellator',    emoji: '🥊',   sport: 'mma',    tier: 'elite',        strength: 88, reputation: 85, ranking: 2, salaryMultiplier: 1.80 },
  { id: 'pfl',        name: 'PFL',         emoji: '🥋',   sport: 'mma',    tier: 'professional', strength: 65, reputation: 60, ranking: 3, salaryMultiplier: 0.60 },
  { id: 'wbc',        name: 'WBC',         emoji: '🥊🏆', sport: 'boxe',   tier: 'elite',        strength: 90, reputation: 92, ranking: 1, salaryMultiplier: 2.00 },
  { id: 'wba',        name: 'WBA',         emoji: '🥊',   sport: 'boxe',   tier: 'elite',        strength: 88, reputation: 88, ranking: 2, salaryMultiplier: 1.80 },
  { id: 'fpi',        name: 'FPI',         emoji: '🥊',   sport: 'boxe',   tier: 'professional', strength: 70, reputation: 65, ranking: 3, salaryMultiplier: 0.70 },
  { id: 'fijlkam_j',  name: 'FIJLKAM',     emoji: '🥋',   sport: 'judo',   tier: 'professional', strength: 75, reputation: 72, ranking: 1, salaryMultiplier: 0.80 },
  { id: 'fijlkam_k',  name: 'FIK',         emoji: '🥋',   sport: 'karate', tier: 'professional', strength: 72, reputation: 70, ranking: 1, salaryMultiplier: 0.75 },
]

const TENNIS_CIRCUITS: TeamDef[] = [
  { id: 'atp',        name: 'ATP Tour',    emoji: '🎾🌍', sport: 'tennis',   tier: 'elite',        strength: 98, reputation: 98, ranking: 1, salaryMultiplier: 3.00 },
  { id: 'wta',        name: 'WTA Tour',    emoji: '🎾🌸', sport: 'tennis',   tier: 'elite',        strength: 96, reputation: 96, ranking: 1, salaryMultiplier: 2.50 },
  { id: 'challenger', name: 'Challenger',  emoji: '🎾',   sport: 'tennis',   tier: 'professional', strength: 70, reputation: 65, ranking: 2, salaryMultiplier: 0.80 },
  { id: 'itf',        name: 'ITF Circuit', emoji: '🎾',   sport: 'tennis',   tier: 'amateur',      strength: 45, reputation: 40, ranking: 3, salaryMultiplier: 0.20 },
]

const GENERIC_TEAMS: TeamDef[] = [
  { id: 'nat_elite',  name: 'Squadra Nazionale', emoji: '🏆', sport: 'default', tier: 'elite',        strength: 88, reputation: 85, ranking: 1, salaryMultiplier: 1.50 },
  { id: 'pro_club',   name: 'Club Pro',          emoji: '🏅', sport: 'default', tier: 'professional', strength: 65, reputation: 60, ranking: 2, salaryMultiplier: 0.70 },
  { id: 'reg_club',   name: 'Club Regionale',    emoji: '⭐', sport: 'default', tier: 'amateur',      strength: 40, reputation: 35, ranking: 3, salaryMultiplier: 0.20 },
]

const ALL_SPORT_TEAMS: Record<string, TeamDef[]> = {
  calcio: CALCIO_TEAMS,
  basket: BASKET_TEAMS,
  mma:    COMBAT_TEAMS.filter(t => t.sport === 'mma'),
  boxe:   COMBAT_TEAMS.filter(t => t.sport === 'boxe'),
  judo:   COMBAT_TEAMS.filter(t => t.sport === 'judo'),
  karate: COMBAT_TEAMS.filter(t => t.sport === 'karate'),
  tennis: TENNIS_CIRCUITS,
}

// Base salaries by role (€/month before team multiplier)
const BASE_SALARY: Record<ContractRole, number> = {
  riserva:  1_500,
  titolare: 6_000,
  stella:   25_000,
  capitano: 80_000,
}

const CONTRACT_MONTHS: Record<ContractRole, number> = {
  riserva: 1, titolare: 2, stella: 4, capitano: 6,
}

const CONTRACT_DURATION: Record<ContractRole, [number, number]> = {
  riserva: [1, 2], titolare: [2, 3], stella: [3, 4], capitano: [4, 5],
}

const TROPHIES: Record<string, [string, string, string]> = {
  calcio: ['🏆 Scudetto', '🏅 Coppa Italia', '🥇 Supercoppa'],
  basket: ['🏆 Scudetto LBA', '🏅 Coppa Italia Basket', '🥇 Supercoppa LBA'],
  tennis: ['🏆 Grande Slam', '🏅 Masters 1000', '🥇 ATP Finals'],
  mma:    ['🏆 Cintura UFC', '🏅 Title Defense', '🥇 Fighter of the Year'],
  boxe:   ['🏆 Cintura Mondiale', '🏅 Titolo Regionale', '🥇 IBF Champion'],
  default:['🏆 Campionato Nazionale', '🏅 Coppa Nazionale', '🥇 Supercoppa'],
}

const PERSONAL_AWARDS: Record<string, string[]> = {
  calcio: ["Pallone d'Oro 🌟", 'Capocannoniere ⚽', 'Miglior Portiere 🧤', 'MVP Stagione 🏆'],
  basket: ['MVP LBA 🌟', 'Capocannoniere LBA 🏀', 'Miglior Difensore 🛡️'],
  tennis: ['World No.1 🌟', 'Year-End Champion 🏆'],
  mma:    ['Fighter of the Year 🌟', 'KO of the Year 💥'],
  boxe:   ['Pugile dell\'Anno 🌟', 'KO of the Year 💥'],
  default:['MVP Stagione 🌟', 'Miglior Atleta 🏅'],
}

// --- Utilities ---

function fnv1a(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0 }
  return h
}

function seededRange(seed: number, lo: number, hi: number): number {
  return lo + ((seed ^ (seed >>> 16)) * 0x45d9f3b >>> 0) % (hi - lo + 1)
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function randNormal(mean: number, std: number): number {
  let u = 0, v = 0
  while (!u) u = Math.random()
  while (!v) v = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ============================================================================

export class CareerLifecycleEngine {

  // ---- Talent generation (deterministic from player identity) ----

  static generateHiddenTalent(firstName: string, lastName: string, birthYear: number): HiddenTalent {
    const s = fnv1a(`${firstName}${lastName}${birthYear}`)
    return {
      sports:   seededRange(s ^ 0x01, 10, 90),
      music:    seededRange(s ^ 0x02, 10, 90),
      acting:   seededRange(s ^ 0x03, 10, 90),
      business: seededRange(s ^ 0x04, 10, 90),
      politics: seededRange(s ^ 0x05, 10, 90),
      crime:    seededRange(s ^ 0x06, 10, 90),
    }
  }

  // ---- Team lookups ----

  static getTeamsForSport(sportId: string): TeamDef[] {
    return ALL_SPORT_TEAMS[sportId] ?? GENERIC_TEAMS
  }

  static getRandomTeamByTier(sportId: string, tier: TeamTier, excludeId?: string): TeamDef | null {
    const pool = this.getTeamsForSport(sportId).filter(t => t.tier === tier && t.id !== excludeId)
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
  }

  // ---- Salary & contract helpers ----

  static computeSalary(role: ContractRole, mult: number): number {
    return Math.round(BASE_SALARY[role] * mult)
  }

  static computeContractDuration(role: ContractRole): number {
    const [lo, hi] = CONTRACT_DURATION[role]
    return lo + Math.floor(Math.random() * (hi - lo + 1))
  }

  static determineRole(talent: number, skill: number, age: number, tier: TeamTier): ContractRole {
    const score = talent * 0.4 + skill * 0.6
    if (tier === 'elite') {
      if (score >= 85 && age >= 22) return 'stella'
      if (score >= 68) return 'titolare'
      return 'riserva'
    }
    if (tier === 'professional') {
      if (score >= 80 && age >= 24) return 'stella'
      if (score >= 58) return 'titolare'
      return 'riserva'
    }
    // amateur
    return score >= 60 && age >= 18 ? 'titolare' : 'riserva'
  }

  static contractFromOffer(offer: TransferOffer): PlayerContract {
    const salary = offer.monthlySalary
    return {
      teamId: offer.fromTeamId,
      teamName: offer.fromTeamName,
      teamEmoji: offer.fromTeamEmoji,
      monthlySalary: salary,
      durationYears: offer.durationYears,
      yearsRemaining: offer.durationYears,
      signingBonus: salary * CONTRACT_MONTHS[offer.role],
      role: offer.role,
      bonusPerGoal: Math.round(salary * 0.02),
    }
  }

  static buildOffer(team: TeamDef, talent: number, skill: number, age: number, year: number): TransferOffer {
    const role = this.determineRole(talent, skill, age, team.tier)
    const salary = this.computeSalary(role, team.salaryMultiplier)
    return {
      fromTeamId:    team.id,
      fromTeamName:  team.name,
      fromTeamEmoji: team.emoji,
      monthlySalary: salary,
      durationYears: this.computeContractDuration(role),
      role,
      offerYear:    year,
      expiresYear:  year + 1,
    }
  }

  // ---- Pre-pro scouting (age 15-22) ----

  static checkScouting(state: GameState): PendingCareerOffer | null {
    const age = state.time.age
    if (age < 15 || age > 22 || state.specialCareer || state.pendingCareerOffer) return null
    const talent = state.hiddenTalent
    if (!talent) return null

    const sports = (state.sports ?? []).filter(s => {
      const key = `sport_${s.id}_${state.time.year}`
      return (state.diminishingReturns[key] ?? 0) > 0
    })
    if (!sports.length) return null

    const best = sports.sort((a, b) =>
      (b.skillLevel * 0.6 + talent.sports * 0.4) - (a.skillLevel * 0.6 + talent.sports * 0.4)
    )[0]

    const ageFactor = age <= 19 ? 1.0 : Math.max(0.3, 1 - (age - 19) * 0.15)
    const scoutChance = (talent.sports / 100 * 0.4 + best.skillLevel / 100 * 0.4) * ageFactor
    if (Math.random() > scoutChance) return null

    const combined = talent.sports * 0.45 + best.skillLevel * 0.55
    const tier: TeamTier = combined >= 72 ? 'elite' : combined >= 52 ? 'professional' : 'amateur'
    const team = this.getRandomTeamByTier(best.id, tier)
    if (!team) return null

    const offer = this.buildOffer(team, talent.sports, best.skillLevel, age, state.time.year)
    return { type: 'scout', offer, sportId: best.id }
  }

  // ---- Season stats generation ----

  static generateSeasonStats(career: SpecialCareer, state: GameState): SeasonStats {
    const contract = career.contract
    const teamId    = contract?.teamId    ?? 'senza_squadra'
    const teamName  = contract?.teamName  ?? 'Senza Squadra'
    const teamEmoji = contract?.teamEmoji ?? '⚽'

    const talent    = state.hiddenTalent?.sports ?? 50
    const sportId   = typeof career.flags.linkedSportId === 'string' ? career.flags.linkedSportId : ''
    const sport     = (state.sports ?? []).find(s => s.id === sportId)
    const skill     = sport?.skillLevel ?? 50
    const health    = state.stats.health
    const age       = state.time.age

    // Simplified performance multiplier (mirrors SpecialCareerEngine curve)
    const perfMult = age <= 31 ? 1.0
      : age <= 35 ? Math.max(0.60, 1.0 - (age - 31) * 0.08)
      : Math.max(0.30, 1.0 - (age - 31) * 0.12)

    const injured = !!(sport?.currentInjury)
    const healthFactor = health / 100 * 0.3 + 0.7
    const availFactor  = injured ? 0.45 + Math.random() * 0.25 : 0.82 + Math.random() * 0.18
    const matches = Math.max(2, Math.round(32 * availFactor * healthFactor))

    const goalRate = (skill * 0.35 + talent * 0.25) / 100 * perfMult * 0.55
    const goals    = Math.max(0, Math.round(goalRate * matches + randNormal(0, 2)))
    const assists  = Math.max(0, Math.round(goals * 0.65 + randNormal(0, 1.5)))

    let avgRating = 4.0 + (skill / 100) * 2.8 + (talent / 100) * 1.8 + perfMult * 0.9
    if (injured) avgRating -= 0.8
    avgRating = clamp(avgRating + randNormal(0, 0.5), 4.0, 10.0)
    avgRating = Math.round(avgRating * 10) / 10

    const teamDef    = this.getTeamsForSport(sportId).find(t => t.id === teamId)
    const teamStr    = teamDef?.strength ?? 50
    const trophyPool = TROPHIES[sportId] ?? TROPHIES.default
    const trophies: string[] = []
    if (avgRating >= 7.0 && teamStr >= 72 && Math.random() < 0.28) trophies.push(trophyPool[0])
    if (avgRating >= 6.5 && teamStr >= 55 && Math.random() < 0.22) trophies.push(trophyPool[1])
    if (trophies.length > 0 && Math.random() < 0.18) trophies.push(trophyPool[2])

    const awards = PERSONAL_AWARDS[sportId] ?? PERSONAL_AWARDS.default
    let personalAward: string | undefined
    if (avgRating >= 8.0 && Math.random() < 0.35) {
      personalAward = awards[Math.floor(Math.random() * awards.length)]
    }

    return {
      year: state.time.year,
      teamId, teamName, teamEmoji,
      matches, goals, assists, averageRating: avgRating,
      injuries: injured ? 1 : 0,
      trophies, personalAward,
      monthlySalary: contract?.monthlySalary ?? 0,
    }
  }

  // ---- Transfer market ----

  static checkTransferOffer(career: SpecialCareer, state: GameState): TransferOffer | null {
    if (career.pendingOffer || career.phase === 'retired') return null
    const profFame  = career.professionalFame ?? career.fame
    const lastSeason = career.seasonHistory?.at(-1)
    const lastRating = lastSeason?.averageRating ?? 5.5

    const chance = clamp((profFame / 100) * 0.40 + (lastRating / 10) * 0.25 - 0.20, 0, 0.80)
    if (Math.random() > chance) return null

    const sportId = typeof career.flags.linkedSportId === 'string' ? career.flags.linkedSportId : ''
    const currentTeam = this.getTeamsForSport(sportId).find(t => t.id === career.contract?.teamId)
    const currentStr  = currentTeam?.strength ?? 0
    const currentTier = currentTeam?.tier ?? 'amateur'

    // Aim for a better team
    const targetTier: TeamTier =
      profFame >= 75 && currentTier === 'professional' ? 'elite' :
      profFame >= 55 && currentTier === 'amateur' ? 'professional' :
      currentTier

    const betterTeams = this.getTeamsForSport(sportId)
      .filter(t => t.tier === targetTier && t.strength > currentStr && t.id !== career.contract?.teamId)
      .sort((a, b) => b.strength - a.strength)
    if (!betterTeams.length) return null

    const team = betterTeams[0]
    const talent = state.hiddenTalent?.sports ?? 50
    const sport  = (state.sports ?? []).find(s => s.id === sportId)
    const offer  = this.buildOffer(team, talent, sport?.skillLevel ?? 50, state.time.age, state.time.year)
    // Add 10-30% salary premium over base
    return { ...offer, monthlySalary: Math.round(offer.monthlySalary * (1.10 + Math.random() * 0.25)) }
  }

  // ---- Accept / negotiate transfer ----

  static acceptTransfer(career: SpecialCareer, offer: TransferOffer): SpecialCareer {
    const contract = this.contractFromOffer(offer)
    const profFame = clamp((career.professionalFame ?? career.fame) + 8, 0, 100)
    const pubFame  = clamp((career.publicFame ?? career.fame) + 5, 0, 100)
    return {
      ...career,
      contract,
      pendingOffer: undefined,
      income: offer.monthlySalary,
      professionalFame: profFame,
      publicFame: pubFame,
      fame: clamp(profFame * 0.5 + pubFame * 0.5, 0, 100),
    }
  }

  static negotiateTransfer(offer: TransferOffer): { success: boolean; offer: TransferOffer; message: string } {
    const r = Math.random()
    if (r < 0.25) return { success: false, offer, message: 'La squadra ha ritirato l\'offerta. Trattativa chiusa. 📵' }
    if (r < 0.60) {
      const better = { ...offer, monthlySalary: Math.round(offer.monthlySalary * 1.15) }
      return { success: true, offer: better, message: `Contratto migliorato: €${better.monthlySalary.toLocaleString()}/mese! 🤝` }
    }
    return { success: true, offer, message: 'La squadra mantiene i termini originali. Prendere o lasciare. 📋' }
  }

  // ---- Legacy / Hall of Fame ----

  static computeLegacy(career: SpecialCareer): SpecialCareer['careerLegacy'] {
    const seasons     = career.seasonHistory ?? []
    const trophies    = seasons.reduce((n, s) => n + s.trophies.length, 0)
    const awards      = seasons.filter(s => s.personalAward).length
    const avgRating   = seasons.length
      ? seasons.reduce((sum, s) => sum + s.averageRating, 0) / seasons.length
      : 5.0
    const fame = Math.max(career.professionalFame ?? 0, career.publicFame ?? 0, career.fame)
    const score = fame * 0.35 + (avgRating / 10) * 100 * 0.25 + trophies * 8 + awards * 12
    if (score >= 120) return 'leggenda_mondiale'
    if (score >= 70)  return 'leggenda_nazionale'
    if (score >= 30)  return 'professionista'
    return 'dimenticato'
  }

  static legacyLabel(legacy: NonNullable<SpecialCareer['careerLegacy']>): string {
    return {
      dimenticato:         '🌫️ Dimenticato',
      professionista:      '👔 Buon Professionista',
      leggenda_nazionale:  '🌟 Leggenda Nazionale',
      leggenda_mondiale:   '🌍 Leggenda Mondiale',
    }[legacy]
  }

  // ---- Main annual tick for pro_athlete ----

  static athleteAnnualTick(
    career: SpecialCareer,
    state: GameState,
  ): { updatedCareer: SpecialCareer; effects: Effect; messages: string[] } {
    const effects: Effect = {}
    const messages: string[] = []
    let updated = { ...career, flags: { ...career.flags } }

    const sportId = typeof career.flags.linkedSportId === 'string' ? career.flags.linkedSportId : ''
    const sportName = (state.sports ?? []).find(s => s.id === sportId)?.name ?? 'sport'

    // ---- Season stats ----
    const season = this.generateSeasonStats(updated, state)
    updated = { ...updated, seasonHistory: [...(updated.seasonHistory ?? []), season].slice(-10) }

    // Contract income (salary × 12 + goal bonuses)
    if (career.contract) {
      effects.money = (effects.money ?? 0) + career.contract.monthlySalary * 12
        + season.goals * (career.contract.bonusPerGoal ?? 0)
      effects.happiness = (effects.happiness ?? 0) + Math.round((season.averageRating - 6.0) * 3)
    }

    // Contract countdown
    if (updated.contract) {
      const left = (updated.contract.yearsRemaining ?? 1) - 1
      updated.contract = { ...updated.contract, yearsRemaining: left }
      if (left === 0) {
        messages.push(`📋 Contratto con ${updated.contract.teamName} scaduto! Sei svincolato — valuta le proposte.`)
      } else if (left === 1) {
        messages.push(`⏰ Manca un anno alla scadenza del contratto con ${updated.contract.teamName}.`)
      }
    }

    // Fame evolution
    const fameDelta = Math.round((season.averageRating - 6.0) * 3 + season.trophies.length * 6)
    updated.professionalFame = clamp((updated.professionalFame ?? updated.fame) + fameDelta, 0, 100)
    updated.publicFame       = clamp((updated.publicFame ?? updated.fame) + Math.round(fameDelta * 0.55 + (season.personalAward ? 8 : 0)), 0, 100)
    updated.fame             = clamp(updated.professionalFame * 0.5 + updated.publicFame * 0.5, 0, 100)

    // Season narrative
    const r = season.averageRating
    if (r >= 8.0)      messages.push(`⭐ Stagione eccezionale in ${sportName}! ${season.goals}G/${season.assists}A — Voto: ${r}/10`)
    else if (r >= 7.0) messages.push(`👍 Buona stagione in ${sportName}. ${season.goals}G/${season.assists}A — Voto: ${r}/10`)
    else if (r >= 6.0) messages.push(`📊 Stagione nella media in ${sportName}. ${season.goals}G — Voto: ${r}/10`)
    else               messages.push(`📉 Stagione difficile in ${sportName}. Solo ${season.goals}G — Voto: ${r}/10.`)

    if (season.trophies.length > 0) {
      messages.push(`🏆 TROFEI: ${season.trophies.join(' · ')}!`)
      effects.happiness = (effects.happiness ?? 0) + 12
    }
    if (season.personalAward) {
      messages.push(`🌟 PREMIO INDIVIDUALE: ${season.personalAward}!`)
      effects.happiness = (effects.happiness ?? 0) + 18
      updated.projectsCompleted = (updated.projectsCompleted ?? 0) + 1
    }

    // Guaranteed events
    if (!updated.flags.event_debut) {
      updated.flags.event_debut = true
      messages.push(`⚽ Esordio nel professionismo in ${sportName}: adrenalina alle stelle. Il pubblico ti aspetta!`)
      effects.happiness = (effects.happiness ?? 0) + 15
    }

    if (!updated.flags.event_first_trophy && season.trophies.length > 0) {
      updated.flags.event_first_trophy = true
      messages.push('🏆 PRIMO TROFEO DA PROFESSIONISTA! Un momento che ricorderai per sempre.')
      effects.happiness = (effects.happiness ?? 0) + 20
    }

    const seasons = updated.seasonHistory?.length ?? 0
    if (!updated.flags.event_final && seasons >= 3 && Math.random() < 0.28) {
      updated.flags.event_final = true
      messages.push(`⚔️ FINALE DECISIVA in ${sportName}! Il risultato di una stagione si decide in novanta minuti.`)
      if (Math.random() < 0.45 + r / 25) {
        messages.push('🥇 Vittoria! La squadra esplode. Sei un eroe.')
        updated.professionalFame = clamp(updated.professionalFame + 10, 0, 100)
        effects.money = (effects.money ?? 0) + 40_000
      } else {
        messages.push('💔 Sconfitta amara. Ci vuole tempo per dimenticare.')
      }
    }

    // Retirement arc (age 35+)
    const age = state.time.age
    if (age >= 35 && !updated.flags.retire_warned && career.phase === 'declining') {
      updated.flags.retire_warned = true
      messages.push(`🕰️ A ${age} anni, le voci sul tuo ritiro si intensificano. Ogni stagione potrebbe essere l'ultima.`)
    }
    if (age >= 38 && !updated.flags.farewell_match && (updated.publicFame ?? 0) >= 55) {
      updated.flags.farewell_match = true
      messages.push(`👑 PARTITA D'ADDIO! Lo stadio gremito ti omaggia con una standing ovation. La tua carriera in ${sportName} è storia.`)
      effects.happiness = (effects.happiness ?? 0) + 25
    }

    // Hall of Fame at declining phase (36+)
    if (age >= 36 && career.phase === 'declining' && !updated.flags.hof_computed) {
      updated.flags.hof_computed = true
      updated.careerLegacy = this.computeLegacy(updated)
      messages.push(`📖 Eredità sportiva: ${this.legacyLabel(updated.careerLegacy!)}`)
    }

    // Good seasons advance career phase
    if (r >= 7.0) updated.projectsCompleted = (updated.projectsCompleted ?? 0) + 1
    if (r >= 8.5) updated.projectsCompleted = (updated.projectsCompleted ?? 0) + 1

    // Transfer offer check (once per year if not declining)
    if (!updated.pendingOffer && career.phase !== 'declining' && career.phase !== 'retired') {
      const offer = this.checkTransferOffer(updated, state)
      if (offer) {
        updated.pendingOffer = offer
        messages.push(`🤝 OFFERTA DI TRASFERIMENTO: ${offer.fromTeamEmoji} ${offer.fromTeamName} ti vuole! €${offer.monthlySalary.toLocaleString()}/mese come ${offer.role}.`)
      }
    }

    return { updatedCareer: updated, effects, messages }
  }
}
