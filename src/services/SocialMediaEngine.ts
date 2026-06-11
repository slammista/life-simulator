import type { GameState, SocialMediaProfile, Effect } from '../store/types'

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook' | 'twitch' | 'podcast' | 'onlyfans'
export type PostType = 'photo' | 'video' | 'educational' | 'comedy' | 'controversial' | 'trending'

interface PlatformDef {
  id: SocialPlatform; name: string; emoji: string; minAge: number
  viralMultiplier: number; adsensePer1k: number; baseGrowth: number
}

const PLATFORMS: PlatformDef[] = [
  { id: 'instagram', name: 'Instagram', emoji: '📸', minAge: 13, viralMultiplier: 1.2, adsensePer1k: 2,    baseGrowth: 8  },
  { id: 'tiktok',    name: 'TikTok',    emoji: '🎵', minAge: 13, viralMultiplier: 2.0, adsensePer1k: 1.5,  baseGrowth: 20 },
  { id: 'youtube',   name: 'YouTube',   emoji: '▶️', minAge: 13, viralMultiplier: 0.8, adsensePer1k: 5,    baseGrowth: 4  },
  { id: 'twitter',   name: 'Twitter/X', emoji: '🐦', minAge: 13, viralMultiplier: 1.5, adsensePer1k: 0.5,  baseGrowth: 5  },
  { id: 'facebook',  name: 'Facebook',  emoji: '📘', minAge: 13, viralMultiplier: 0.6, adsensePer1k: 1.0,  baseGrowth: 3  },
  { id: 'twitch',    name: 'Twitch',    emoji: '🟣', minAge: 16, viralMultiplier: 1.8, adsensePer1k: 3.5,  baseGrowth: 5  },
  { id: 'podcast',   name: 'Podcast',   emoji: '🎙️', minAge: 16, viralMultiplier: 0.5, adsensePer1k: 8.0,  baseGrowth: 2  },
  { id: 'onlyfans',  name: 'OnlyFans',  emoji: '🔞', minAge: 18, viralMultiplier: 3.0, adsensePer1k: 50.0, baseGrowth: 10 },
]

const POST_MULTIPLIERS: Record<PostType, number> = {
  photo: 1.0, video: 1.5, educational: 0.8, comedy: 1.8, controversial: 2.5, trending: 3.0,
}

export interface SocialActionResult {
  success: boolean; message: string; effects: Effect
  newProfile?: SocialMediaProfile
  updatedProfile?: Partial<SocialMediaProfile>
  viralEvent?: boolean
  followerGain?: number
  scandal?: boolean
}

export class SocialMediaEngine {
  static getPlatforms() { return PLATFORMS }

  static createProfile(platform: SocialPlatform, state: GameState): SocialActionResult {
    const def = PLATFORMS.find(p => p.id === platform)
    if (!def) return { success: false, message: 'Piattaforma non trovata.', effects: {} }
    if (state.time.age < def.minAge)
      return { success: false, message: `Devi avere almeno ${def.minAge} anni.`, effects: {} }
    if (state.socialMedia.some(s => s.platform === platform))
      return { success: false, message: 'Hai già un profilo su questa piattaforma.', effects: {} }

    const profile: SocialMediaProfile = {
      platform, username: `${state.identity.name.toLowerCase()}${state.identity.surname.toLowerCase()}`,
      followers: 0, viralScore: 0, stage: 'unknown', monthlyIncome: 0,
      postCount: 0, engagementRate: 0.05,
    }
    return {
      success: true,
      message: `Hai creato un profilo ${def.emoji} ${def.name}! Inizia a postare per guadagnare follower.`,
      effects: { socialReputation: 2 },
      newProfile: profile,
    }
  }

  static post(platform: SocialPlatform, postType: PostType, state: GameState): SocialActionResult {
    const def = PLATFORMS.find(p => p.id === platform)
    const profile = state.socialMedia.find(s => s.platform === platform)
    if (!def || !profile)
      return { success: false, message: 'Profilo non trovato. Crea prima un account.', effects: {} }

    const looks = state.stats.looks / 100
    const intelligence = state.stats.intelligence / 100
    const baseGain = def.baseGrowth * POST_MULTIPLIERS[postType]
    const skillBonus = 1 + (profile.postCount / 300) // more experience = better, but slowly
    const statBonus = postType === 'educational' ? intelligence * 2 : looks * 1.5
    const randomFactor = 0.5 + Math.random()

    let followerGain = Math.floor(baseGain * skillBonus * randomFactor + statBonus * 5)
    // Organic growth is proportional to current audience: small accounts grow slowly.
    // Cap non-viral growth at ~8% of current followers (min 25 so new accounts aren't stuck at 0).
    followerGain = Math.min(followerGain, Math.max(25, Math.floor(profile.followers * 0.08)))

    // Viral check (probability based on platform + post type) — rarer than before
    const viralChance = (def.viralMultiplier * POST_MULTIPLIERS[postType] * (profile.viralScore + 5)) / 2000
    const isViral = Math.random() < viralChance

    // Viral spikes scale with the audience you already have, not a flat x50
    const viralGain = Math.min(followerGain * 10 + Math.floor(profile.followers * 0.5), 50000)
    const totalGain = isViral ? Math.max(500, viralGain) : followerGain
    const newFollowers = profile.followers + totalGain
    const newStage = this._getStage(newFollowers)
    const monthlyIncome = this._calcIncome(newFollowers, def.adsensePer1k)
    const viralScoreGain = isViral ? 15 : Math.min(2, 0.5)
    const newViralScore = Math.min(100, profile.viralScore + viralScoreGain)

    // Controversial posts risk cancel
    const cancelRisk = postType === 'controversial' && Math.random() < 0.1
    const followerLoss = cancelRisk ? Math.floor(newFollowers * 0.3) : 0

    const effects: Effect = {
      happiness: isViral ? 15 : 5,
      socialReputation: isViral ? 10 : 2,
      energy: -5,
    }
    if (monthlyIncome > 0) effects.money = Math.floor(monthlyIncome / 12)

    // OnlyFans special consequences
    const isOnlyFans = platform === 'onlyfans'
    if (isOnlyFans) {
      effects.reputation = -5
      effects.socialReputation = (effects.socialReputation ?? 0) - 3
    }

    const onlyFansNote = isOnlyFans ? ' ⚠️ Questo influenza le tue relazioni e reputazione.' : ''
    const message = cancelRisk
      ? `😡 Il tuo post controverso è stato cancellato! Perdi ${followerLoss} follower.`
      : isViral
        ? `🚀 Post VIRALE su ${def.emoji} ${def.name}! Guadagni ${totalGain.toLocaleString()} follower!${onlyFansNote}`
        : `${def.emoji} Post pubblicato su ${def.name}. +${totalGain} follower.${onlyFansNote}`

    return {
      success: true, message, effects, viralEvent: isViral, followerGain: totalGain, scandal: cancelRisk || isOnlyFans,
      updatedProfile: {
        followers: Math.max(0, newFollowers - followerLoss),
        viralScore: newViralScore,
        stage: newStage,
        monthlyIncome,
        postCount: profile.postCount + 1,
        engagementRate: Math.max(0.01, profile.engagementRate - 0.001 + (isViral ? 0.02 : 0)),
      },
    }
  }

  static annualTick(state: GameState): { updatedProfiles: SocialMediaProfile[]; effects: Effect; sponsorMessages: string[] } {
    let totalIncome = 0
    const sponsorMessages: string[] = []
    const updatedProfiles = state.socialMedia.map(profile => {
      const def = PLATFORMS.find(p => p.id === profile.platform)
      if (!def) return profile
      const decayRate = profile.postCount === 0 ? 0.1 : 0.02
      const decayedFollowers = Math.floor(profile.followers * (1 - decayRate))
      const adsenseIncome = this._calcIncome(decayedFollowers, def.adsensePer1k)
      const sponsorIncome = this._calcSponsorIncome(decayedFollowers, def.emoji, def.name, sponsorMessages)
      const income = adsenseIncome + Math.floor(sponsorIncome / 12)
      totalIncome += income
      return { ...profile, followers: decayedFollowers, monthlyIncome: income, stage: this._getStage(decayedFollowers) }
    })
    return { updatedProfiles, effects: { money: totalIncome, socialReputation: totalIncome > 1000 ? 3 : 1 }, sponsorMessages }
  }

  private static _calcSponsorIncome(followers: number, emoji: string, platformName: string, messages: string[]): number {
    if (followers >= 10_000_000) {
      const deal = Math.floor(200000 + Math.random() * 800000)
      messages.push(`🤝 ${emoji} Accordo MEGA su ${platformName}! Un brand internazionale ti offre €${deal.toLocaleString('it-IT')}/anno.`)
      return deal
    }
    if (followers >= 1_000_000) {
      if (Math.random() < 0.6) {
        const deal = Math.floor(50000 + Math.random() * 150000)
        messages.push(`💼 ${emoji} Brand deal su ${platformName}: €${deal.toLocaleString('it-IT')}/anno da un'azienda nazionale.`)
        return deal
      }
    } else if (followers >= 100_000) {
      if (Math.random() < 0.45) {
        const deal = Math.floor(5000 + Math.random() * 15000)
        messages.push(`📦 ${emoji} Hai ricevuto una proposta di sponsorizzazione su ${platformName}: €${deal.toLocaleString('it-IT')}/anno.`)
        return deal
      }
    } else if (followers >= 10_000) {
      if (Math.random() < 0.25) {
        const deal = Math.floor(500 + Math.random() * 1500)
        messages.push(`🎁 ${emoji} Un piccolo brand ti contatta su ${platformName} per una collaborazione: €${deal.toLocaleString('it-IT')}.`)
        return deal
      }
    }
    return 0
  }

  private static _getStage(followers: number): SocialMediaProfile['stage'] {
    if (followers >= 10_000_000) return 'mega'
    if (followers >= 1_000_000) return 'macro'
    if (followers >= 100_000) return 'influencer'
    if (followers >= 10_000) return 'rising'
    if (followers >= 1_000) return 'micro'
    return 'unknown'
  }

  private static _calcIncome(followers: number, adsensePer1k: number): number {
    return Math.floor((followers / 1000) * adsensePer1k)
  }
}
