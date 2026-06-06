import type { Effect, FameState, FameTier, GameState } from '../store/types'

export interface FameTickResult {
  fame: FameState
  effects: Effect
  messages: string[]
}

export interface FamePostResult {
  fame: FameState
  effects: Effect
  message: string | null
}

const INITIAL_FAME: FameState = {
  fame: 0,
  tier: 'unknown',
  fanbase: 0,
  publicImage: 50,
  scandals: 0,
  verified: false,
  sponsorships: 0,
  lastInterviewYear: -99,
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function getTier(fame: number): FameTier {
  if (fame >= 90) return 'icon'
  if (fame >= 75) return 'celebrity'
  if (fame >= 55) return 'famous'
  if (fame >= 30) return 'rising'
  if (fame >= 12) return 'local'
  return 'unknown'
}

function normalizeFame(fame: FameState): FameState {
  const score = clamp(Math.round(fame.fame))
  return {
    ...fame,
    fame: score,
    tier: getTier(score),
    fanbase: Math.max(0, Math.floor(fame.fanbase)),
    publicImage: clamp(Math.round(fame.publicImage)),
    scandals: Math.max(0, Math.floor(fame.scandals)),
    sponsorships: Math.max(0, Math.floor(fame.sponsorships)),
  }
}

export class FameEngine {
  static initialState(): FameState {
    return { ...INITIAL_FAME }
  }

  static getTier(fame: number): FameTier {
    return getTier(fame)
  }

  static ensure(state: Partial<FameState> | undefined): FameState {
    return normalizeFame({ ...INITIAL_FAME, ...(state ?? {}) })
  }

  static annualTick(state: GameState): FameTickResult {
    const current = FameEngine.ensure(state.fame)
    const totalFollowers = state.socialMedia.reduce((sum, profile) => sum + profile.followers, 0)
    const socialFame = Math.min(55, Math.floor(Math.log10(totalFollowers + 1) * 9))
    const careerFame = state.career.currentJob && ['Actor', 'Singer', 'Politician', 'Influencer', 'Athlete', 'Streamer'].some(role =>
      state.career.currentJob?.title.toLowerCase().includes(role.toLowerCase()),
    ) ? 10 + state.career.promotions * 2 : 0
    const politicalFame = state.politics.currentRole ? 8 + state.politics.mandatesWon * 4 : 0
    const criminalFame = state.criminal.hasRecord && state.criminal.crimes.length >= 3 ? 8 : 0
    const targetFame = clamp(socialFame + careerFame + politicalFame + criminalFame)
    const drift = Math.round((targetFame - current.fame) * 0.25)
    const imageDecay = current.scandals > 0 ? current.scandals * 2 : current.fame >= 30 ? 1 : 0
    const sponsorIncome = current.sponsorships * Math.max(250, current.fame * 90)
    const nextPublicImage = clamp(current.publicImage - imageDecay + (state.stats.karma > 20 ? 1 : 0))
    const nextFame = normalizeFame({
      ...current,
      fame: current.fame + drift - (nextPublicImage < 25 ? 2 : 0),
      fanbase: Math.max(current.fanbase, Math.floor(totalFollowers * 0.35 + current.fame * 120)),
      publicImage: nextPublicImage,
      verified: current.verified || targetFame >= 35 || totalFollowers >= 100_000,
      sponsorships: current.fame >= 70 ? 3 : current.fame >= 50 ? 2 : current.fame >= 30 ? 1 : 0,
    })

    const messages: string[] = []
    if (nextFame.tier !== current.tier) {
      messages.push(`🌟 La tua fama ora è: ${nextFame.tier}.`)
    }
    if (!current.verified && nextFame.verified) {
      messages.push('✅ Ottieni lo status verificato.')
    }
    if (current.scandals > 0 && nextPublicImage < current.publicImage) {
      messages.push('📰 I vecchi scandali continuano a pesare sulla tua immagine pubblica.')
    }

    return {
      fame: nextFame,
      effects: {
        money: Math.floor(sponsorIncome),
        socialReputation: nextFame.fame >= 30 ? 2 : 0,
        reputation: nextFame.publicImage < 30 ? -2 : nextFame.fame >= 50 ? 1 : 0,
      },
      messages,
    }
  }

  static fromSocialPost(params: {
    state: GameState
    followerGain: number
    viralEvent?: boolean
    scandal?: boolean
  }): FamePostResult {
    const current = FameEngine.ensure(params.state.fame)
    const fameGain = params.viralEvent ? 8 : params.followerGain >= 10_000 ? 3 : params.followerGain >= 1_000 ? 1 : 0
    const scandalPenalty = params.scandal ? 14 : 0
    const next = normalizeFame({
      ...current,
      fame: current.fame + fameGain + (params.scandal ? 2 : 0),
      fanbase: current.fanbase + Math.floor(params.followerGain * 0.4),
      publicImage: current.publicImage - scandalPenalty + (params.viralEvent && !params.scandal ? 3 : 0),
      scandals: current.scandals + (params.scandal ? 1 : 0),
      verified: current.verified || params.viralEvent || current.fame + fameGain >= 35,
    })

    return {
      fame: next,
      effects: {
        reputation: params.scandal ? -5 : 0,
        socialReputation: fameGain,
        happiness: params.viralEvent ? 4 : 0,
      },
      message: params.scandal
        ? 'Lo scandalo aumenta la notorietà, ma danneggia la tua immagine pubblica.'
        : fameGain > 0
          ? 'La tua presenza pubblica inizia a farsi notare.'
          : null,
    }
  }
}
