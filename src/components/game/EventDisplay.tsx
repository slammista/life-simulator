import { memo, useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

// Category → header color mapping (BitLife-style)
const CATEGORY_COLORS: Record<string, string> = {
  career:      '#f59e0b',
  lavoro:      '#f59e0b',
  health:      '#22c55e',
  salute:      '#22c55e',
  criminal:    '#ef4444',
  crimine:     '#ef4444',
  social:      '#f472b6',
  education:   '#60a5fa',
  istruzione:  '#60a5fa',
  finance:     '#10b981',
  finanze:     '#10b981',
  life:        '#a78bfa',
  vita:        '#a78bfa',
}

function getCategoryColor(category?: string): string {
  if (!category) return '#6366f1'
  return CATEGORY_COLORS[category.toLowerCase()] ?? '#6366f1'
}

function getCategoryLabel(category?: string): string {
  if (!category) return 'EVENTO'
  const labels: Record<string, string> = {
    career: 'CARRIERA', lavoro: 'CARRIERA',
    health: 'SALUTE', salute: 'SALUTE',
    criminal: 'CRIMINE', crimine: 'CRIMINE',
    social: 'SOCIALE',
    education: 'ISTRUZIONE', istruzione: 'ISTRUZIONE',
    finance: 'FINANZE', finanze: 'FINANZE',
    life: 'VITA', vita: 'VITA',
  }
  return labels[category.toLowerCase()] ?? category.toUpperCase()
}

const rarityGlow: Record<string, string> = {
  epic:      '0 0 0 2px #ec489944, 0 0 32px rgba(236,72,153,0.35)',
  legendary: '0 0 0 2px #FFB02044, 0 0 40px rgba(255,176,32,0.4)',
}

export const EventDisplay = memo(function EventDisplay() {
  const currentEvent = useGameStore(s => s.currentEvent)
  const availableChoices = useGameStore(s => s.availableChoices)
  const handleChoice = useGameStore(s => s.handleChoice)
  const [cinematic, setCinematic] = useState(false)

  useEffect(() => {
    if (currentEvent && (currentEvent.rarity === 'epic' || currentEvent.rarity === 'legendary')) {
      setCinematic(true)
      const t = setTimeout(() => setCinematic(false), 2200)
      return () => clearTimeout(t)
    }
  }, [currentEvent?.id])

  if (!currentEvent) {
    return (
      <div style={{ margin: '12px', textAlign: 'center', padding: '20px 16px' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎮</div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
          Premi <strong style={{ color: 'var(--primary)', fontWeight: 700 }}>+1 ETÀ</strong> per avanzare di un anno e far succedere qualcosa.
        </p>
      </div>
    )
  }

  const isEpicPlus = currentEvent.rarity === 'epic' || currentEvent.rarity === 'legendary'

  // Determine category from packId or other field
  const category = (currentEvent as unknown as { category?: string }).category
  const headerColor = getCategoryColor(category)
  const categoryLabel = getCategoryLabel(category)
  const npcName = (currentEvent as unknown as { npcName?: string }).npcName

  const rarityConfig = {
    common:    { label: 'COMUNE',      bg: 'rgba(255,255,255,0.06)',   color: '#9DA6BA' },
    uncommon:  { label: 'NON COMUNE',  bg: 'rgba(24,211,158,0.12)',    color: '#18D39E' },
    rare:      { label: 'RARO',        bg: 'rgba(124,92,255,0.14)',    color: '#7C5CFF' },
    epic:      { label: 'EPICO',       bg: 'rgba(236,72,153,0.14)',    color: '#ec4899' },
    legendary: { label: 'LEGGENDARIO', bg: 'rgba(255,176,32,0.14)',    color: '#FFB020' },
  }
  const rarity = rarityConfig[currentEvent.rarity as keyof typeof rarityConfig] ?? rarityConfig.common

  return (
    <>
      {/* Cinematic entrance overlay for epic/legendary */}
      {cinematic && isEpicPlus && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: currentEvent.rarity === 'legendary'
            ? 'radial-gradient(ellipse at center, rgba(255,176,32,0.25) 0%, rgba(0,0,0,0.92) 70%)'
            : 'radial-gradient(ellipse at center, rgba(236,72,153,0.2) 0%, rgba(0,0,0,0.92) 70%)',
          animation: 'fadeInOut 2.2s ease',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: 72,
            animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            filter: `drop-shadow(0 0 30px ${rarity.color})`,
            marginBottom: 20,
          }}>
            {currentEvent.emoji}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 3,
            color: rarity.color, textTransform: 'uppercase',
            padding: '5px 16px', borderRadius: 20,
            background: rarity.bg, border: `1px solid ${rarity.color}44`,
            marginBottom: 12,
          }}>
            ✦ {rarity.label} ✦
          </div>
          <p style={{
            fontSize: 18, fontWeight: 700, color: '#fff',
            textAlign: 'center', maxWidth: 280,
            textShadow: `0 0 20px ${rarity.color}`,
          }}>
            {currentEvent.title}
          </p>
        </div>
      )}

      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}>
        {/* Modal card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 380,
          overflow: 'hidden',
          boxShadow: isEpicPlus
            ? rarityGlow[currentEvent.rarity] ?? '0 8px 40px rgba(0,0,0,0.4)'
            : '0 8px 40px rgba(0,0,0,0.4)',
          animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        }}>
          {/* Colored header banner */}
          <div style={{
            background: headerColor,
            padding: '14px 16px 12px',
            position: 'relative',
          }}>
            {/* Category pill top-right */}
            <span style={{
              position: 'absolute', top: 10, right: 12,
              fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
              padding: '3px 8px', borderRadius: 99,
              background: 'rgba(255,255,255,0.25)', color: '#fff',
            }}>
              {categoryLabel}
            </span>

            {/* Epic/legendary rarity pill */}
            {isEpicPlus && (
              <span style={{
                position: 'absolute', top: 10, left: 12,
                fontSize: 9, fontWeight: 800, letterSpacing: 0.5,
                padding: '3px 8px', borderRadius: 99,
                background: rarity.bg, color: rarity.color,
                border: `1px solid ${rarity.color}44`,
              }}>
                ✦ {rarity.label}
              </span>
            )}

            {/* Event emoji (large) */}
            <div style={{
              fontSize: 48, textAlign: 'center',
              marginTop: isEpicPlus ? 18 : 8,
              marginBottom: 4,
              filter: isEpicPlus ? `drop-shadow(0 0 12px ${rarity.color})` : undefined,
            }}>
              {currentEvent.emoji}
            </div>

            {/* NPC avatar below emoji if applicable */}
            {npcName && (
              <div style={{
                textAlign: 'center', fontSize: 11,
                color: 'rgba(255,255,255,0.85)', fontWeight: 600,
              }}>
                👤 {npcName}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '16px 16px 20px' }}>
            {/* Title */}
            <p style={{
              fontWeight: 700, fontSize: 16,
              color: '#1a1a2e',
              textAlign: 'center', marginBottom: 8,
            }}>
              {currentEvent.title}
            </p>

            {/* Description */}
            <p style={{
              fontSize: 13, color: '#4a5568',
              lineHeight: 1.55, textAlign: 'center',
              marginBottom: 16,
            }}>
              {currentEvent.description}
            </p>

            {/* Choice buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableChoices.length > 0 ? (
                availableChoices.map(choice => (
                  <button
                    key={choice.id}
                    className="tap-scale"
                    onClick={() => handleChoice(choice.id)}
                    style={{
                      width: '100%', padding: '12px 14px',
                      borderRadius: 10,
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      textAlign: 'center', lineHeight: 1.4,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span style={{ flex: 1 }}>{choice.text}</span>
                    <EffectPreview effects={choice.effects} />
                  </button>
                ))
              ) : (
                <button
                  className="tap-scale"
                  onClick={() => handleChoice('')}
                  style={{
                    width: '100%', padding: '12px 0',
                    borderRadius: 10,
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: 14, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes slideUpModal {
          0%   { transform: translateY(24px) scale(0.97); opacity: 0; }
          100% { transform: translateY(0) scale(1);       opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
})

function EffectPreview({ effects }: { effects: Record<string, number> }) {
  const entries = Object.entries(effects).filter(([k]) =>
    ['health', 'happiness', 'money', 'intelligence', 'karma'].includes(k)
  )
  if (!entries.length) return null

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
      {entries.slice(0, 3).map(([key, val]) => (
        <span
          key={key}
          style={{
            fontSize: 10, fontWeight: 700,
            color: val > 0 ? '#16a34a' : '#dc2626',
            background: val > 0 ? '#dcfce7' : '#fee2e2',
            padding: '2px 6px', borderRadius: 99,
          }}
        >
          {key === 'money' ? '€' : ''}{val > 0 ? '+' : ''}{val}
        </span>
      ))}
    </div>
  )
}
