import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'
import { TRAIT_DEFS } from '../../services/NarrativeEngine'

export function OriginStoryScreen() {
  const { narrative, markOriginStorySeen } = useGameStore(useShallow(s => ({
    narrative: s.narrative,
    markOriginStorySeen: s.markOriginStorySeen,
  })))

  const originStory = narrative?.originStory
  const traits = narrative?.traits ?? []

  const paragraphs = (originStory?.text ?? '').split('\n\n').filter(Boolean)
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (visibleCount >= paragraphs.length) return
    const t = setTimeout(() => setVisibleCount(v => v + 1), visibleCount === 0 ? 400 : 900)
    return () => clearTimeout(t)
  }, [visibleCount, paragraphs.length])

  const allVisible = visibleCount >= paragraphs.length

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(160deg, #0a0a1a 0%, #111827 50%, #0a0a1a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, zIndex: 9999, overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Scenario emoji + title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🌱</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f9fafb', margin: 0, letterSpacing: -0.5 }}>
            La tua storia inizia
          </h1>
        </div>

        {/* Story paragraphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          {paragraphs.slice(0, visibleCount).map((p, i) => (
            <p key={i} style={{
              fontSize: 14, lineHeight: 1.7, color: '#e5e7eb', margin: 0,
              opacity: 1, animation: 'fadeIn 0.6s ease',
            }}>
              {p}
            </p>
          ))}
        </div>

        {/* Trait reveal badges */}
        {allVisible && traits.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px 18px',
            marginBottom: 24, border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              ✨ Tratti della tua vita
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {traits.map(traitId => {
                const def = TRAIT_DEFS[traitId]
                if (!def) return null
                return (
                  <div key={traitId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${def.color}22`, border: `2px solid ${def.color}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}>
                      {def.emoji}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: def.color }}>{def.label}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.4 }}>{def.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        {allVisible && (
          <button
            className="btn-candy btn-candy--primary"
            onClick={markOriginStorySeen}
            style={{ fontSize: 16, padding: '15px 0' }}
          >
            Inizia la tua vita →
          </button>
        )}

        {/* Skip */}
        {!allVisible && (
          <button
            onClick={() => setVisibleCount(paragraphs.length)}
            style={{
              background: 'none', border: 'none', color: '#6b7280',
              fontSize: 12, cursor: 'pointer', padding: '8px 0', alignSelf: 'center',
            }}
          >
            Salta introduzione
          </button>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  )
}
