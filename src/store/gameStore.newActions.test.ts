import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import type { SocialMediaProfile } from './types'

function makeProfile(overrides: Partial<SocialMediaProfile> = {}): SocialMediaProfile {
  return {
    platform: 'instagram',
    username: 'test',
    followers: 500,
    viralScore: 10,
    stage: 'unknown',
    monthlyIncome: 0,
    postCount: 0,
    engagementRate: 0,
    ...overrides,
  }
}

const initialSnapshot = useGameStore.getState()

beforeEach(() => {
  useGameStore.setState(initialSnapshot, true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('performFreelanceGig', () => {
  it('rejects when energy is below 10', () => {
    useGameStore.setState({ stats: { ...useGameStore.getState().stats, energy: 5 } })
    const r = useGameStore.getState().performFreelanceGig('tutor_gig')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/troppo stanco/i)
  })

  it('rejects an unknown gig id', () => {
    useGameStore.setState({ stats: { ...useGameStore.getState().stats, energy: 100 } })
    const r = useGameStore.getState().performFreelanceGig('not_a_real_gig')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/non trovato/i)
  })

  it('rejects when below the gig minimum age', () => {
    useGameStore.setState({
      stats: { ...useGameStore.getState().stats, energy: 100 },
      time: { ...useGameStore.getState().time, age: 10 },
    })
    // handyman requires 16+
    const r = useGameStore.getState().performFreelanceGig('handyman')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/almeno 16 anni/)
  })

  it('pays out money and deducts energy on success', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    useGameStore.setState({
      stats: { ...useGameStore.getState().stats, energy: 100 },
      time: { ...useGameStore.getState().time, age: 20, year: 2024 },
      finance: { ...useGameStore.getState().finance, money: 1000 },
    })
    const r = useGameStore.getState().performFreelanceGig('dog_walker')
    expect(r.success).toBe(true)
    // earnMin 20, earnMax 60 -> midpoint 40 at random()=0.5, costMult defaults to 1
    expect(r.effects.money).toBe(40)
    expect(r.effects.energy).toBe(-10)
    const state = useGameStore.getState()
    expect(state.finance.money).toBe(1040)
    expect(state.stats.energy).toBe(90)
  })

  it('scales earnings by the nation cost-of-living multiplier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    useGameStore.setState({
      stats: { ...useGameStore.getState().stats, energy: 100 },
      time: { ...useGameStore.getState().time, age: 20, year: 2024 },
      finance: { ...useGameStore.getState().finance, money: 0 },
      nation: { id: 'us', name: 'USA', flag: '🇺🇸', taxRate: 0.2, healthRecoveryBonus: 0, costOfLiving: 2, minWage: 0, avgSalary: 0 } as never,
    })
    // dog_walker earnMin 20 at random()=0 -> base 20, ×2 cost multiplier = 40
    const r = useGameStore.getState().performFreelanceGig('dog_walker')
    expect(r.effects.money).toBe(40)
  })

  it('tracks how many times a gig was done this year via diminishingReturns', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    useGameStore.setState({
      stats: { ...useGameStore.getState().stats, energy: 100 },
      time: { ...useGameStore.getState().time, age: 20, year: 2024 },
    })
    useGameStore.getState().performFreelanceGig('dog_walker')
    useGameStore.getState().performFreelanceGig('dog_walker')
    expect(useGameStore.getState().diminishingReturns['gig_dog_walker_2024']).toBe(2)
  })
})

describe('trollSocialMedia', () => {
  beforeEach(() => {
    useGameStore.setState({ socialMedia: [makeProfile({ followers: 1000 })] })
  })

  it('rejects when the platform has no active profile', () => {
    const r = useGameStore.getState().trollSocialMedia('tiktok')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/non trovato/i)
  })

  it('bans the player and docks happiness on the low roll branch', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    useGameStore.setState({ stats: { ...useGameStore.getState().stats, happiness: 50 } })
    const r = useGameStore.getState().trollSocialMedia('instagram')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/bannato/i)
    expect(useGameStore.getState().stats.happiness).toBe(40)
  })

  it('loses ~5% of followers on the mid roll branch', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4)
    const r = useGameStore.getState().trollSocialMedia('instagram')
    expect(r.success).toBe(false)
    const profile = useGameStore.getState().socialMedia.find(p => p.platform === 'instagram')!
    expect(profile.followers).toBe(950) // 1000 - floor(1000*0.05)
  })

  it('goes viral and gains followers on the high roll branch', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const r = useGameStore.getState().trollSocialMedia('instagram')
    expect(r.success).toBe(true)
    const profile = useGameStore.getState().socialMedia.find(p => p.platform === 'instagram')!
    expect(profile.followers).toBeGreaterThan(1000)
  })
})

describe('promoteSocialMedia', () => {
  it('rejects when the platform has no active profile', () => {
    const r = useGameStore.getState().promoteSocialMedia('instagram')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/non trovato/i)
  })

  it('rejects below the 1000-follower threshold', () => {
    useGameStore.setState({ socialMedia: [makeProfile({ followers: 500 })] })
    const r = useGameStore.getState().promoteSocialMedia('instagram')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/1\.000 follower/)
  })

  it('pays out proportional income above the threshold', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // -> multiplier 0.75
    useGameStore.setState({
      socialMedia: [makeProfile({ followers: 10000 })],
      finance: { ...useGameStore.getState().finance, money: 0 },
    })
    const r = useGameStore.getState().promoteSocialMedia('instagram')
    expect(r.success).toBe(true)
    expect(r.effects.money).toBe(75) // round(10000 * 0.01 * 0.75)
    expect(useGameStore.getState().finance.money).toBe(75)
  })
})

describe('requestVerification', () => {
  it('rejects when the platform has no active profile', () => {
    const r = useGameStore.getState().requestVerification('instagram')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/non trovato/i)
  })

  it('rejects below the 10,000-follower threshold', () => {
    useGameStore.setState({ socialMedia: [makeProfile({ followers: 5000 })] })
    const r = useGameStore.getState().requestVerification('instagram')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/10\.000 follower/)
  })

  it('rejects when already verified', () => {
    useGameStore.setState({
      socialMedia: [makeProfile({ followers: 20000 })],
      fame: { ...useGameStore.getState().fame, verified: true } as never,
    })
    const r = useGameStore.getState().requestVerification('instagram')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/già verificato/i)
  })

  it('grants verification and a happiness boost on a successful roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    useGameStore.setState({
      socialMedia: [makeProfile({ followers: 20000 })],
      fame: { ...useGameStore.getState().fame, verified: false } as never,
    })
    const r = useGameStore.getState().requestVerification('instagram')
    expect(r.success).toBe(true)
    expect(r.effects.happiness).toBe(10)
    expect(useGameStore.getState().fame?.verified).toBe(true)
  })

  it('rejects the request on a failed roll without granting verification', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    useGameStore.setState({
      socialMedia: [makeProfile({ followers: 20000 })],
      fame: { ...useGameStore.getState().fame, verified: false } as never,
    })
    const r = useGameStore.getState().requestVerification('instagram')
    expect(r.success).toBe(false)
    expect(useGameStore.getState().fame?.verified).toBe(false)
  })
})

describe('replyCelebrity', () => {
  beforeEach(() => {
    useGameStore.setState({ socialMedia: [makeProfile({ followers: 100 })] })
  })

  it('rejects when the platform has no active profile', () => {
    const r = useGameStore.getState().replyCelebrity('tiktok')
    expect(r.success).toBe(false)
  })

  it('goes viral on the rare high roll branch', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const r = useGameStore.getState().replyCelebrity('instagram')
    expect(r.success).toBe(true)
    expect(r.message).toMatch(/virale/i)
  })

  it('gains a modest follower bump on the mid branch', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2)
    const r = useGameStore.getState().replyCelebrity('instagram')
    expect(r.success).toBe(true)
    expect(r.message).toMatch(/fan della celebrity/i)
  })

  it('is ignored on the low-probability tail', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const r = useGameStore.getState().replyCelebrity('instagram')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/ignorato/i)
  })
})

describe('deleteSocialProfile', () => {
  it('rejects when the platform has no active profile', () => {
    const r = useGameStore.getState().deleteSocialProfile('instagram')
    expect(r.success).toBe(false)
    expect(r.message).toMatch(/non trovato/i)
  })

  it('removes the profile from socialMedia on success', () => {
    useGameStore.setState({ socialMedia: [makeProfile({ platform: 'instagram' }), makeProfile({ platform: 'tiktok' })] })
    const r = useGameStore.getState().deleteSocialProfile('instagram')
    expect(r.success).toBe(true)
    const platforms = useGameStore.getState().socialMedia.map(p => p.platform)
    expect(platforms).not.toContain('instagram')
    expect(platforms).toContain('tiktok')
  })
})
