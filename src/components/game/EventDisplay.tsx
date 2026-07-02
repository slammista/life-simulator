import { memo, useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { feedback } from '../../services/FeedbackEngine'
import { AudioEngine } from '../../services/AudioEngine'

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
  family:      '#fb923c',
  famiglia:    '#fb923c',
  relationship:'#f472b6',
  relazione:   '#f472b6',
}

function deriveCategory(id: string): string {
  const l = id.toLowerCase()
  if (l.includes('school') || l.includes('edu') || l.includes('univ') || l.includes('grade') || l.includes('study') || l.includes('gpa') || l.includes('teacher') || l.includes('lesson')) return 'education'
  if (l.includes('job') || l.includes('career') || l.includes('work') || l.includes('boss') || l.includes('salary') || l.includes('promo') || l.includes('fired') || l.includes('hire') || l.includes('office')) return 'career'
  if (l.includes('health') || l.includes('disease') || l.includes('hospital') || l.includes('injury') || l.includes('accident') || l.includes('sick') || l.includes('doctor') || l.includes('medical')) return 'health'
  if (l.includes('crime') || l.includes('prison') || l.includes('arrest') || l.includes('police') || l.includes('thief') || l.includes('rob') || l.includes('steal') || l.includes('drug_') || l.includes('illegal')) return 'criminal'
  if (l.includes('money') || l.includes('finance') || l.includes('invest') || l.includes('bank') || l.includes('debt') || l.includes('loan') || l.includes('stock') || l.includes('budget') || l.includes('tax')) return 'finance'
  if (l.includes('love') || l.includes('romance') || l.includes('wedding') || l.includes('divorce') || l.includes('crush') || l.includes('breakup') || l.includes('relation') || l.includes('date') || l.includes('kiss')) return 'relationship'
  if (l.includes('family') || l.includes('parent') || l.includes('child') || l.includes('sibling') || l.includes('birth') || l.includes('baby') || l.includes('mom') || l.includes('dad') || l.includes('brother') || l.includes('sister')) return 'family'
  return 'life'
}

function getCategoryColor(category?: string): string {
  if (!category) return '#6366f1'
  const derived = (!category || category === 'none') ? 'life' : category.toLowerCase()
  return CATEGORY_COLORS[derived] ?? '#6366f1'
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
    family: 'FAMIGLIA', famiglia: 'FAMIGLIA',
    relationship: 'AMORE', relazione: 'AMORE',
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

  // Cinematic flash + SFX triggered by the incoming event's rarity — a
  // genuine effect (plays audio, schedules a timed flash), not derivable
  // synchronously at render.
  useEffect(() => {
    if (currentEvent) {
      AudioEngine.playSFX(
        currentEvent.rarity === 'legendary' ? 'levelUp'
        : currentEvent.rarity === 'epic' ? 'event'
        : 'event'
      )
      if (currentEvent.rarity === 'epic' || currentEvent.rarity === 'legendary') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCinematic(true)
        const t = setTimeout(() => setCinematic(false), 2200)
        return () => clearTimeout(t)
      }
    }
    // currentEvent?.id (not the object) is intentional: it identifies which
    // event is showing without re-triggering the SFX/cinematic flash if the
    // store ever re-creates the same event object on an unrelated update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent?.id])

  if (!currentEvent) {
    return (
      <div style={{
        margin: '4px 12px 16px',
        padding: '28px 20px 24px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(160deg, rgba(124,92,255,0.10) 0%, rgba(124,92,255,0.04) 100%)',
        border: '1px solid rgba(124,92,255,0.18)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle glow behind the emoji */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 120, height: 60,
          background: 'radial-gradient(ellipse, rgba(124,92,255,0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(12px)',
        }} />
        <div style={{
          fontSize: 44, marginBottom: 12,
          animation: 'idle-pulse 3.2s ease-in-out infinite',
          display: 'inline-block',
          position: 'relative',
        }}>
          ⏳
        </div>
        <p style={{
          color: 'var(--color-text)', fontSize: 16, fontWeight: 700,
          lineHeight: 1.4, marginBottom: 6, letterSpacing: '-0.01em',
        }}>
          La vita aspetta.
        </p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, lineHeight: 1.55, marginBottom: 20 }}>
          Ogni anno porta nuovi eventi, scelte e conseguenze.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 24px', borderRadius: 'var(--radius-pill)',
          background: 'linear-gradient(135deg, #7C5CFF, #9B5CFF)',
          boxShadow: '0 0 24px rgba(124,92,255,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
          animation: 'idle-cta-pulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>+1 ETÀ</span>
          <span style={{ fontSize: 13 }}>›</span>
        </div>
        <style>{`
          @keyframes idle-pulse {
            0%, 100% { transform: scale(1);    opacity: 0.8; }
            50%       { transform: scale(1.1);  opacity: 1;   }
          }
          @keyframes idle-cta-pulse {
            0%, 100% { box-shadow: 0 0 24px rgba(124,92,255,0.45), inset 0 1px 0 rgba(255,255,255,0.2); }
            50%       { box-shadow: 0 0 36px rgba(124,92,255,0.65), inset 0 1px 0 rgba(255,255,255,0.2); }
          }
          @media (prefers-reduced-motion: reduce) {
            @keyframes idle-pulse { 0%, 100% { transform: none; opacity: 1; } }
            @keyframes idle-cta-pulse { 0%, 100% { box-shadow: 0 0 24px rgba(124,92,255,0.45); } }
          }
        `}</style>
      </div>
    )
  }

  const isEpicPlus = currentEvent.rarity === 'epic' || currentEvent.rarity === 'legendary'

  // Determine category — derive from event ID if JSON has "none"
  const rawCategory = (currentEvent as unknown as { category?: string }).category
  const category = (!rawCategory || rawCategory === 'none') ? deriveCategory(currentEvent.id) : rawCategory
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
          background: 'linear-gradient(160deg, #2A2150 0%, #1B1733 100%)',
          borderRadius: 22,
          width: '100%',
          maxWidth: 380,
          overflow: 'hidden',
          border: `1px solid ${headerColor}55`,
          boxShadow: isEpicPlus
            ? `${rarityGlow[currentEvent.rarity] ?? '0 8px 40px rgba(0,0,0,0.5)'}, inset 0 1px 0 rgba(255,255,255,0.16)`
            : '0 18px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.16)',
          animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        }}>
          {/* Colored header banner */}
          <div style={{
            background: `linear-gradient(180deg, ${headerColor} 0%, ${headerColor}33 100%)`,
            padding: '14px 16px 14px',
            position: 'relative',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
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
              color: '#F4F7FB',
              textAlign: 'center', marginBottom: 8,
            }}>
              {currentEvent.title}
            </p>

            {/* Description */}
            <p style={{
              fontSize: 13, color: '#B6BFD4',
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
                    className="btn-candy btn-candy--primary"
                    onClick={() => { feedback('tap'); handleChoice(choice.id) }}
                    style={{
                      fontSize: 13,
                      textAlign: 'left', lineHeight: 1.4,
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ flex: 1 }}>{choice.text}</span>
                    <EffectPreview effects={choice.effects} />
                  </button>
                ))
              ) : (
                <button
                  className="btn-candy btn-candy--primary"
                  onClick={() => { feedback('tap'); handleChoice('') }}
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
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
      {entries.slice(0, 3).map(([key, val]) => (
        <span
          key={key}
          style={{
            fontSize: 11, fontWeight: 800,
            color: val > 0 ? '#4ade80' : '#f87171',
            textShadow: val > 0
              ? '0 0 10px rgba(74,222,128,0.55)'
              : '0 0 10px rgba(248,113,113,0.55)',
          }}
        >
          {key === 'money' ? '€' : ''}{val > 0 ? '+' : ''}{val}
        </span>
      ))}
    </div>
  )
}
