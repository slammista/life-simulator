import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { SocialMediaEngine, type SocialPlatform, type PostType } from '../../services/SocialMediaEngine'
import { FameEngine } from '../../services/FameEngine'
import { useToastStore } from '../../store/toastStore'
import { haptic } from '../../services/HapticEngine'

const POST_TYPES: { id: PostType; label: string; emoji: string }[] = [
  { id: 'photo',         label: 'Foto',       emoji: '📸' },
  { id: 'video',         label: 'Video',      emoji: '🎬' },
  { id: 'comedy',        label: 'Comedy',     emoji: '😂' },
  { id: 'educational',   label: 'Educativo',  emoji: '🎓' },
  { id: 'trending',      label: 'Trending',   emoji: '🔥' },
  { id: 'controversial', label: 'Controverso',emoji: '💣' },
]

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M follower`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k follower`
  return `${n} follower`
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      padding: '7px 16px',
      background: 'rgba(0,0,0,0.25)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)' }}>
        {label}
      </span>
    </div>
  )
}

function ActionRow({ emoji, label, subtitle, onClick, danger }: {
  emoji: string; label: string; subtitle: string; onClick?: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="tap-scale"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'left',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: danger ? '#fca5a5' : 'var(--color-text)', marginBottom: 1 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{subtitle}</p>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 15, flexShrink: 0 }}>···</span>
    </button>
  )
}

export function SocialMediaScreen() {
  const socialMedia        = useGameStore(s => s.socialMedia)
  const age                = useGameStore(s => s.time.age)
  const rawFame            = useGameStore(s => s.fame)
  const createSocialProfile = useGameStore(s => s.createSocialProfile)
  const postContent        = useGameStore(s => s.postContent)
  const trollSocialMedia   = useGameStore(s => s.trollSocialMedia)
  const promoteSocialMedia = useGameStore(s => s.promoteSocialMedia)
  const requestVerification = useGameStore(s => s.requestVerification)
  const replyCelebrity     = useGameStore(s => s.replyCelebrity)
  const deleteSocialProfile = useGameStore(s => s.deleteSocialProfile)

  const showPanel  = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const [activePlatform, setActivePlatform] = useState<SocialPlatform | null>(null)
  const [signupModal, setSignupModal]       = useState<SocialPlatform | null>(null)
  const [postModal, setPostModal]           = useState(false)
  const [selectedPost, setSelectedPost]     = useState<PostType>('photo')

  const platforms = SocialMediaEngine.getPlatforms()
  const fame      = FameEngine.ensure(rawFame)

  const flash = (msg: string, ok: boolean, emoji: string, effects: Record<string, number> = {}) => {
    haptic(ok ? 'success' : 'error')
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => closePanel(), 3000)
  }

  // ── Platform detail view ──
  if (activePlatform) {
    const platform = platforms.find(p => p.id === activePlatform)
    const profile  = socialMedia.find(p => p.platform === activePlatform)
    if (!platform || !profile) { setActivePlatform(null); return null }

    return (
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
        {/* Account card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>
            {platform.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 1 }}>
              {platform.name} Account{fame.verified ? ' ✅' : ''}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{formatFollowers(profile.followers)}</p>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Viral {profile.viralScore.toFixed(0)}/100 · €{profile.monthlyIncome.toLocaleString('it-IT')}/mese
            </p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 15, flexShrink: 0 }}>···</span>
        </div>

        <SectionLabel label="Attività" />

        <ActionRow
          emoji="⭐" label="Celebrity" subtitle="Rispondi a una celebrity"
          onClick={() => {
            const r = replyCelebrity(activePlatform)
            flash(r.message, r.success, '⭐', r.effects as Record<string, number>)
          }}
        />
        <ActionRow
          emoji="🗑️" label="Elimina" subtitle="Elimina il tuo account" danger
          onClick={() => {
            const r = deleteSocialProfile(activePlatform)
            flash(r.message, r.success, '🗑️', r.effects as Record<string, number>)
            if (r.success) setActivePlatform(null)
          }}
        />
        <ActionRow
          emoji="✏️" label="Post" subtitle="Pubblica un contenuto"
          onClick={() => setPostModal(true)}
        />
        <ActionRow
          emoji="📈" label="Promuovi" subtitle="Promuovi un prodotto"
          onClick={() => {
            const r = promoteSocialMedia(activePlatform)
            flash(r.message, r.success, '📈', r.effects as Record<string, number>)
          }}
        />
        <ActionRow
          emoji="👹" label="Troll" subtitle="Trolla qualcuno"
          onClick={() => {
            const r = trollSocialMedia(activePlatform)
            flash(r.message, r.success, '👹', r.effects as Record<string, number>)
          }}
        />
        <ActionRow
          emoji="✅" label="Verifica" subtitle="Richiedi la verifica"
          onClick={() => {
            const r = requestVerification(activePlatform)
            flash(r.message, r.success, '✅', r.effects as Record<string, number>)
          }}
        />

        {/* Post type selection modal */}
        {postModal && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'flex-end',
            }}
            onClick={() => setPostModal(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', background: 'var(--bg-card)',
                borderRadius: '20px 20px 0 0', padding: '20px 16px 48px',
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--color-text)' }}>
                {platform.emoji} Cosa vuoi pubblicare?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {POST_TYPES.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedPost(pt.id)}
                    style={{
                      padding: '10px 0', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      border: 'none', cursor: 'pointer', lineHeight: 1.6,
                      background: selectedPost === pt.id ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
                      color: selectedPost === pt.id ? '#fff' : 'var(--color-text-secondary)',
                    }}
                  >
                    {pt.emoji}<br />{pt.label}
                  </button>
                ))}
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 700 }}
                onClick={() => {
                  const r = postContent(activePlatform, selectedPost)
                  flash(r.message, r.success, platform.emoji, r.effects as Record<string, number>)
                  setPostModal(false)
                }}
              >
                📤 Pubblica {POST_TYPES.find(p => p.id === selectedPost)?.label}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Main list view ──
  const inactivePlatforms = platforms.filter(p => !socialMedia.some(s => s.platform === p.id))
  const signupDef = signupModal ? platforms.find(p => p.id === signupModal) : null

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>

      {/* Active accounts */}
      {socialMedia.length === 0 && age < 13 && (
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📱</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>Social media bloccati</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>I social media si sbloccano a 13 anni. Goditi la tua infanzia!</p>
        </div>
      )}

      {socialMedia.map(profile => {
        const def = platforms.find(p => p.id === profile.platform)!
        return (
          <button
            key={profile.platform}
            onClick={() => setActivePlatform(profile.platform as SocialPlatform)}
            className="tap-scale"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>
              {def.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 1 }}>
                {def.name}{fame.verified ? ' ✅' : ''}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{formatFollowers(profile.followers)}</p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 20, flexShrink: 0 }}>›</span>
          </button>
        )
      })}

      {/* Inactive channels */}
      {inactivePlatforms.length > 0 && (
        <>
          <SectionLabel label="Canali Inattivi" />
          {inactivePlatforms.map(plat => {
            const tooYoung = age < plat.minAge
            return (
              <div
                key={plat.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  opacity: tooYoung ? 0.38 : 1,
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {plat.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 1 }}>{plat.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {tooYoung ? `Richiede ${plat.minAge}+ anni` : `Iscriviti a ${plat.name}`}
                  </p>
                </div>
                {!tooYoung && (
                  <button
                    onClick={() => setSignupModal(plat.id as SocialPlatform)}
                    className="tap-scale"
                    style={{
                      color: 'rgba(255,255,255,0.4)', fontSize: 16, flexShrink: 0,
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                    }}
                  >
                    ···
                  </button>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* Signup modal */}
      {signupModal && signupDef && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px',
        }}>
          <div style={{
            width: '100%', maxWidth: 420,
            background: 'var(--bg-card)', borderRadius: 20,
            overflow: 'hidden', position: 'relative',
            border: '2px solid rgba(239,68,68,0.55)',
            boxShadow: '0 0 0 4px rgba(239,68,68,0.12), 0 20px 60px rgba(0,0,0,0.5)',
          }}>
            {/* X close */}
            <button
              onClick={() => setSignupModal(null)}
              style={{
                position: 'absolute', top: 10, left: 10, zIndex: 10,
                width: 34, height: 34, borderRadius: '50%',
                background: '#ef4444', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#fff', fontWeight: 800,
              }}
            >
              ✕
            </button>
            {/* Category strip */}
            <div style={{
              padding: '10px 16px', textAlign: 'right',
              background: 'linear-gradient(90deg, transparent 30%, rgba(220,38,38,0.85) 100%)',
              minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, fontStyle: 'italic', color: '#fff' }}>Social</span>
            </div>
            {/* Body */}
            <div style={{ padding: '20px 24px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>{signupDef.emoji}</div>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 10 }}>{signupDef.name}</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 22 }}>
                Iscriviti a {signupDef.name} oggi!
              </p>
              <button
                onClick={() => {
                  const r = createSocialProfile(signupModal)
                  flash(r.message, r.success, signupDef.emoji)
                  if (r.success) {
                    setSignupModal(null)
                    setActivePlatform(signupModal)
                  }
                }}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12,
                  fontSize: 15, fontWeight: 700,
                  background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer',
                }}
              >
                Iscriviti a {signupDef.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
