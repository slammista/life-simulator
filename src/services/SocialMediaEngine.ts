import type { GameState, SocialMediaProfile, Effect } from '../store/types'

export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'twitter'
export type PostType = 'photo' | 'video' | 'educational' | 'comedy' | 'controversial' | 'trending'

interface PlatformDef {
  id: SocialPlatform; name: string; emoji: string; minAge: number
  viralMultiplier: number; adsensePer1k: number; baseGrowth: number
}

const PLATFORMS: PlatformDef[] = [
  { id: 'instagram', name: 'Instagram', emoji: '📸', minAge: 13, viralMultiplier: 1.2, adsensePer1k: 2, baseGrowth: 30 },
  { id: 'tiktok',    name: 'TikTok',    emoji: '🎵', minAge: 13, viralMultiplier: 2.0, adsensePer1k: 1.5, baseGrowth: 80 },
  { id: 'youtube',   name: 'YouTube',   emoji: '▶️', minAge: 13, viralMultiplier: 0.8, adsensePer1k: 5, baseGrowth: 15 },
  { id: 'twitter',   name: 'Twitter/X', emoji: '🐦', minAge: 13, viralMultiplier: 1.5, adsensePer1k: 0.5, baseGrowth: 20 },
]

const POST_MULTIPLIERS: Record<PostType, number> = {
  photo: 1.0, video: 1.5, educational: 0.8, comedy: 1.8, controversial: 2.5, trending: 3.0,
}

export interface SocialActionResult {
  success: boolean; message: string; effects: Effect
  newProfile?: SocialMediaProfile
  updatedProfile?: Partial<SocialMediaProfile>
  viralEvent?: boolean
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
    const skillBonus = 1 + (profile.postCount / 200) // more experience = better
    const statBonus = postType === 'educational' ? intelligence * 2 : looks * 1.5
    const randomFactor = 0.5 + Math.random()

    const followerGain = Math.floor(baseGain * skillBonus * randomFactor + statBonus * 10)

    // Viral check (probability based on platform + post type)
    const viralChance = (def.viralMultiplier * POST_MULTIPLIERS[postType] * (profile.viralScore + 5)) / 1000
    const isViral = Math.random() < viralChance

    const totalGain = isViral ? followerGain * 50 : followerGain
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

    const message = cancelRisk
      ? `😡 Il tuo post controverso è stato cancellato! Perdi ${followerLoss} follower.`
      : isViral
        ? `🚀 Post VIRALE su ${def.emoji} ${def.name}! Guadagni ${totalGain.toLocaleString()} follower!`
        : `${def.emoji} Post pubblicato su ${def.name}. +${totalGain} follower.`

    return {
      success: true, message, effects, viralEvent: isViral,
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

  static annualTick(state: GameState): { updatedProfiles: SocialMediaProfile[]; effects: Effect } {
    let totalIncome = 0
    const updatedProfiles = state.socialMedia.map(profile => {
      const def = PLATFORMS.find(p => p.id === profile.platform)
      if (!def) return profile
      // Natural decay if not posting
      const decayRate = profile.postCount === 0 ? 0.1 : 0.02
      const decayedFollowers = Math.floor(profile.followers * (1 - decayRate))
      const income = this._calcIncome(decayedFollowers, def.adsensePer1k)
      totalIncome += income
      return { ...profile, followers: decayedFollowers, monthlyIncome: income, stage: this._getStage(decayedFollowers) }
    })
    return { updatedProfiles, effects: { money: totalIncome, socialReputation: totalIncome > 1000 ? 3 : 1 } }
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
