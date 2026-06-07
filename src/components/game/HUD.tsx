import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'

function useHUDData() {
  const stats = useGameStore(useShallow(s => s.stats))
  const money = useGameStore(s => s.finance.money)
  const age = useGameStore(s => s.time.age)
  const year = useGameStore(s => s.time.year)
  const emoji = useGameStore(s => s.identity.emoji)
  const name = useGameStore(s => s.identity.name)
  const surname = useGameStore(s => s.identity.surname)
  const fame = useGameStore(s => s.fame?.fame ?? 0)
  const currentJob = useGameStore(s => s.career.currentJob)
  const eduLevel = useGameStore(s => s.education.currentLevel)
  const inPrison = useGameStore(s => s.criminal.inPrison)
  const isRetired = useGameStore(s => s.retirement.isRetired)
  return { stats, money, age, year, emoji, name, surname, fame, currentJob, eduLevel, inPrison, isRetired }
}

function getStatusBadge(data: ReturnType<typeof useHUDData>) {
  const { fame, currentJob, eduLevel, inPrison, isRetired, age } = data
  if (inPrison) return { label: '🔒 In Carcere', color: '#ef4444' }
  if (isRetired) return { label: '🎗️ Pensionato', color: '#a78bfa' }
  if (fame >= 55) return { label: '⭐ Famoso', color: '#fbbf24' }
  if (fame >= 30) return { label: '📈 In ascesa', color: '#f97316' }
  if (currentJob) return { label: `💼 ${currentJob.title}`, color: '#10b981' }
  if (eduLevel && eduLevel !== 'none') return { label: '📚 Studente', color: '#60a5fa' }
  if (age < 6) return { label: '👶 Bambino', color: '#f472b6' }
  return { label: '🔍 Disoccupato', color: '#94a3b8' }
}

const BASE_STATS = [
  { key: 'happiness',    label: 'Felicità',      emoji: '😊', color: '#f59e0b' },
  { key: 'health',       label: 'Salute',         emoji: '❤️', color: '#e94560' },
  { key: 'intelligence', label: 'Intelligenza',   emoji: '🧠', color: '#8b5cf6' },
  { key: 'looks',        label: 'Look',           emoji: '✨', color: '#ec4899' },
]

export const HUD = memo(function HUD() {
  const data = useHUDData()
  const { stats, money, age, year, emoji, name, surname, fame } = data
  const status = getStatusBadge(data)
  const showFame = fame >= 30

  const statList = showFame
    ? [...BASE_STATS, { key: '_fame', label: 'Fama', emoji: '⭐', color: '#fbbf24' }]
    : BASE_STATS

  return (
    <div className="hud flex-col gap-1" style={{ height: 'auto', padding: '8px 12px 6px' }}>
      {/* Row 1: avatar + name/age/year + money */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name} {surname}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
              {age}a · {year}
            </span>
          </div>
          <div style={{
            display: 'inline-block', marginTop: 2,
            padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600,
            background: `${status.color}22`, color: status.color, border: `1px solid ${status.color}44`,
          }}>
            {status.label}
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981', flexShrink: 0 }}>
          €{money.toLocaleString('it-IT')}
        </span>
      </div>

      {/* Stat bars */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statList.length}, 1fr)`, gap: 6 }}>
        {statList.map(({ key, emoji: statEmoji, label, color }) => {
          const val = key === '_fame' ? fame : (stats as unknown as Record<string, number>)[key] ?? 0
          const displayVal = Math.round(val)
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-secondary)' }}>
                <span>{statEmoji} {label}</span>
                <span style={{ color: displayVal < 30 ? 'var(--color-negative)' : displayVal > 70 ? 'var(--color-positive)' : 'var(--color-text)' }}>
                  {displayVal}
                </span>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${val}%`, backgroundColor: displayVal < 30 ? '#e94560' : color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
