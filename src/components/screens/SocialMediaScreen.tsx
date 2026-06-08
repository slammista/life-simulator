import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { SocialMediaEngine, type SocialPlatform, type PostType } from '../../services/SocialMediaEngine'
import { FameEngine } from '../../services/FameEngine'
import type { FameTier } from '../../store/types'

const POST_TYPES: { id: PostType; label: string; emoji: string }[] = [
  { id: 'photo', label: 'Foto', emoji: '📸' },
  { id: 'video', label: 'Video', emoji: '🎬' },
  { id: 'comedy', label: 'Comedy', emoji: '😂' },
  { id: 'educational', label: 'Educativo', emoji: '🎓' },
  { id: 'trending', label: 'Trending', emoji: '🔥' },
  { id: 'controversial', label: 'Controverso', emoji: '💣' },
]

const STAGE_LABELS: Record<string, string> = {
  unknown: 'Sconosciuto', micro: 'Micro (1k+)', rising: 'In crescita (10k+)',
  influencer: 'Influencer (100k+)', macro: 'Macro (1M+)', mega: 'Mega (10M+)',
}

const FAME_LABELS: Record<FameTier, string> = {
  unknown: 'Sconosciuto',
  local: 'Volto locale',
  rising: 'In ascesa',
  famous: 'Famoso',
  celebrity: 'Celebrity',
  icon: 'Icona',
}

export function SocialMediaScreen() {
  const { socialMedia, stats, time, fame: rawFame, createSocialProfile, postContent } = useGameStore()
  const [feedback, setFeedback] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('instagram')
  const [selectedPost, setSelectedPost] = useState<PostType>('photo')

  const platforms = SocialMediaEngine.getPlatforms()
  const fame = FameEngine.ensure(rawFame)

  const handleCreate = () => {
    const res = createSocialProfile(selectedPlatform)
    setFeedback(res.message)
  }

  const handlePost = (platform: SocialPlatform) => {
    const res = postContent(platform, selectedPost)
    setFeedback(res.message)
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback && (
        <div className="card" style={{ padding: 10, background: 'rgba(147,51,234,0.15)', borderColor: 'rgba(147,51,234,0.4)', fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* Fame overview */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700 }}>🌟 Fama pubblica</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {FAME_LABELS[fame.tier]}{fame.verified ? ' · verificato' : ''} · {fame.scandals} scandali
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: fame.publicImage < 30 ? '#fca5a5' : '#fbbf24' }}>{fame.fame}/100</p>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>fame score</p>
          </div>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${fame.fame}%`, background: fame.publicImage < 30 ? '#ef4444' : '#f59e0b', borderRadius: 4 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Fanbase', value: fame.fanbase >= 1000000 ? `${(fame.fanbase / 1000000).toFixed(1)}M` : fame.fanbase >= 1000 ? `${(fame.fanbase / 1000).toFixed(1)}k` : String(fame.fanbase) },
            { label: 'Immagine', value: `${fame.publicImage}/100` },
            { label: 'Sponsor', value: String(fame.sponsorships) },
          ].map(item => (
            <div key={item.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* My profiles */}
      {socialMedia.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            I Miei Profili
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {socialMedia.map(profile => {
              const def = platforms.find(p => p.id === profile.platform)
              return (
                <div key={profile.platform} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 18 }}>{def?.emoji}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 6 }}>{def?.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 6 }}>@{profile.username}</span>
                    </div>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 20,
                      background: profile.stage === 'mega' ? 'rgba(250,204,21,0.2)' :
                        profile.stage === 'influencer' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.07)',
                      color: profile.stage === 'mega' ? '#fbbf24' : profile.stage === 'influencer' ? '#a855f7' : 'var(--color-text-secondary)',
                    }}>
                      {STAGE_LABELS[profile.stage] ?? profile.stage}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {[
                      { label: 'Follower', value: profile.followers >= 1000000 ? `${(profile.followers / 1000000).toFixed(1)}M` : profile.followers >= 1000 ? `${(profile.followers / 1000).toFixed(1)}k` : String(profile.followers) },
                      { label: 'Viral Score', value: `${profile.viralScore.toFixed(0)}/100` },
                      { label: 'Income/anno', value: `€${profile.monthlyIncome.toLocaleString()}` },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Post section */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {POST_TYPES.map(pt => (
                      <button
                        key={pt.id}
                        onClick={() => setSelectedPost(pt.id)}
                        style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: 11, border: 'none', cursor: 'pointer',
                          background: selectedPost === pt.id ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
                          color: selectedPost === pt.id ? '#fff' : 'var(--color-text-secondary)',
                        }}
                      >
                        {pt.emoji} {pt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', padding: '8px 0', fontSize: 13 }}
                    onClick={() => handlePost(profile.platform as SocialPlatform)}
                  >
                    📤 Pubblica {POST_TYPES.find(p => p.id === selectedPost)?.label}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create profile */}
      {socialMedia.length < platforms.length && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Nuova Piattaforma
          </p>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {platforms
                .filter(p => !socialMedia.some(s => s.platform === p.id) && time.age >= p.minAge)
                .map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="radio" name="platform"
                      checked={selectedPlatform === p.id}
                      onChange={() => setSelectedPlatform(p.id as SocialPlatform)}
                    />
                    <span style={{ fontSize: 16 }}>{p.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        Base: +{p.baseGrowth} follower/post · €{p.adsensePer1k}/1k views
                      </div>
                    </div>
                  </label>
                ))}
            </div>
            {time.age < 13 ? (
              <div className="card card-locked" style={{ padding: '20px 16px', textAlign: 'center', marginTop: 10 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>📱</div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>Non ancora disponibile</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  I social media si sbloccano a 13 anni. Goditi la tua infanzia!
                </p>
              </div>
            ) : (
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '8px 0', fontSize: 13, marginTop: 10 }}
                onClick={handleCreate}
              >
                Crea Profilo Social
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
            💡 Aspetto: {stats.looks}/100 · Rep. Sociale: {stats.socialReputation}/100 influenzano il match rate
          </p>
        </div>
      )}
    </div>
  )
}
