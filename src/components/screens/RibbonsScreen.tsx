import { useGameStore } from '../../store/gameStore'
import { RIBBON_DEFINITIONS } from '../../services/AchievementsEngine'
import { CreditScoreEngine } from '../../services/CreditScoreEngine'
import { useState } from 'react'

type FilterCat = 'all' | 'career' | 'financial' | 'relational' | 'educational' | 'health' | 'criminal' | 'travel' | 'special'

const TIER_COLORS = {
  bronze:   '#cd7f32',
  silver:   '#c0c0c0',
  gold:     '#ffd700',
  platinum: '#e5e4e2',
  diamond:  '#b9f2ff',
}

const CAT_LABELS: Record<FilterCat, string> = {
  all:          'Tutti',
  career:       '💼 Carriera',
  financial:    '💰 Finanze',
  relational:   '❤️ Relazioni',
  educational:  '🎓 Istruzione',
  health:       '💊 Salute',
  criminal:     '🚔 Crimini',
  travel:       '✈️ Viaggi',
  special:      '⭐ Speciali',
}

export default function RibbonsScreen() {
  const state = useGameStore(s => s)
  const unlockedSet = new Set(state.ribbons.filter(r => r.unlocked).map(r => r.id))
  const [filter, setFilter] = useState<FilterCat>('all')
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false)

  const creditReport = CreditScoreEngine.getReport(state)

  const filtered = RIBBON_DEFINITIONS.filter(def => {
    if (filter !== 'all' && def.category !== filter) return false
    if (showOnlyUnlocked && !unlockedSet.has(def.id)) return false
    return true
  })

  const totalUnlocked = RIBBON_DEFINITIONS.filter(d => unlockedSet.has(d.id)).length
  const totalRibbons = RIBBON_DEFINITIONS.length

  const tierCount = (['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const).reduce((acc, tier) => {
    acc[tier] = RIBBON_DEFINITIONS.filter(d => d.tier === tier && unlockedSet.has(d.id)).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ padding: '12px', maxWidth: 620, margin: '0 auto' }}>
      <h2 style={{ color: '#fbbf24', marginBottom: 8 }}>🏅 Medaglie & Profilo</h2>

      {/* Credit Score Card */}
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14,
        marginBottom: 14, border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>📊 Credit Score</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 32, fontWeight: 800,
            color: creditReport.score >= 740 ? '#4ade80' : creditReport.score >= 670 ? '#fbbf24' : '#f87171',
          }}>
            {creditReport.score}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{creditReport.tierLabel}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Tasso interesse: {(creditReport.interestRate * 100).toFixed(1)}% · Limite carta: €{creditReport.cardLimit.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Max prestito: €{creditReport.maxLoan.toLocaleString()}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden', marginTop: 6,
            }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${((creditReport.score - 300) / 550) * 100}%`,
                background: creditReport.score >= 740 ? '#4ade80' : creditReport.score >= 670 ? '#fbbf24' : '#f87171',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 2 }}>
              <span>300</span><span>850</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Mode indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <StatBadge label="Modalità" value={state.settings.mode.toUpperCase()} color={state.settings.mode === 'hard' ? '#f87171' : '#60a5fa'} />
        {state.settings.ironMan && <StatBadge label="Iron Man" value="☠️ ON" color="#f87171" />}
        <StatBadge label="Medaglie" value={`${totalUnlocked}/${totalRibbons}`} color="#fbbf24" />
        <StatBadge label="Challenge pts" value={state.challengeEngine.totalPoints.toLocaleString()} color="#a855f7" />
      </div>

      {/* Tier breakdown */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const).map(tier => (
          <div key={tier} style={{
            padding: '3px 10px', borderRadius: 20,
            background: `${TIER_COLORS[tier]}20`, border: `1px solid ${TIER_COLORS[tier]}60`,
            color: TIER_COLORS[tier], fontSize: 12, fontWeight: 600,
          }}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}: {tierCount[tier]}
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {(Object.keys(CAT_LABELS) as FilterCat[]).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === cat ? '#d97706' : 'rgba(255,255,255,0.08)',
              color: '#e2e8f0', fontSize: 11,
            }}
          >
            {CAT_LABELS[cat]}
          </button>
        ))}
        <button
          onClick={() => setShowOnlyUnlocked(v => !v)}
          style={{
            padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: showOnlyUnlocked ? '#4ade80' : 'rgba(255,255,255,0.08)',
            color: showOnlyUnlocked ? '#000' : '#e2e8f0', fontSize: 11,
          }}
        >
          Solo sbloccate
        </button>
      </div>

      {/* Ribbon grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
        {filtered.map(def => {
          const isUnlocked = unlockedSet.has(def.id)
          const ribbonData = state.ribbons.find(r => r.id === def.id)
          return (
            <div
              key={def.id}
              style={{
                background: isUnlocked ? `${TIER_COLORS[def.tier]}15` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isUnlocked ? TIER_COLORS[def.tier] + '60' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                opacity: isUnlocked ? 1 : 0.45,
                transition: 'opacity 0.2s',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4, filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
                {def.emoji}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: isUnlocked ? TIER_COLORS[def.tier] : '#64748b',
                marginBottom: 2,
              }}>
                {def.name}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.3 }}>
                {isUnlocked ? def.description : '???'}
              </div>
              {isUnlocked && ribbonData?.unlockedYear && (
                <div style={{ fontSize: 9, color: '#4ade80', marginTop: 4 }}>
                  ✅ Anno {ribbonData.unlockedYear}
                </div>
              )}
              <div style={{
                marginTop: 4, fontSize: 9, fontWeight: 600,
                color: TIER_COLORS[def.tier], textTransform: 'uppercase' as const,
              }}>
                {def.tier}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
          Nessuna medaglia trovata.
        </p>
      )}
    </div>
  )
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: '4px 10px', borderRadius: 20,
      background: `${color}20`, border: `1px solid ${color}50`,
      fontSize: 12,
    }}>
      <span style={{ color: '#94a3b8' }}>{label}: </span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  )
}
