import { memo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'

function useHUDData() {
  const stats = useGameStore(useShallow(s => s.stats))
  const money = useGameStore(s => s.finance.money)
  const bankBalance = useGameStore(s => s.finance.bankBalance)
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
  return { stats, money, bankBalance, age, year, emoji, name, surname, fame, currentJob, eduLevel, inPrison, isRetired }
}

function getStatusBadge(data: ReturnType<typeof useHUDData>) {
  const { fame, currentJob, eduLevel, inPrison, isRetired, age } = data
  if (inPrison)  return { label: '🔒 In Carcere', color: '#FF4D6D' }
  if (isRetired) return { label: '🎗️ Pensionato',  color: '#a78bfa' }
  if (fame >= 55) return { label: '⭐ Famoso',       color: '#FFB020' }
  if (fame >= 30) return { label: '📈 In ascesa',    color: '#f97316' }
  if (currentJob) return { label: `💼 ${currentJob.title}`, color: '#18D39E' }
  if (eduLevel && eduLevel !== 'none') return { label: '📚 Studente', color: '#60a5fa' }
  if (age < 6)   return { label: '👶 Bambino',       color: '#f472b6' }
  return { label: '🔍 Disoccupato', color: '#687087' }
}

const BASE_STATS = [
  { key: 'happiness',    label: 'Felicità',    emoji: '😊', color: '#FFB020' },
  { key: 'health',       label: 'Salute',       emoji: '❤️', color: '#FF4D6D' },
  { key: 'intelligence', label: 'Intel.',        emoji: '🧠', color: '#7C5CFF' },
  { key: 'looks',        label: 'Look',          emoji: '✨', color: '#ec4899' },
]

function formatMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000)     return `€${(n / 1_000).toFixed(0)}k`
  return `€${n.toLocaleString('it-IT')}`
}

export const HUD = memo(function HUD() {
  const data = useHUDData()
  const { stats, money, bankBalance, age, year, emoji, name, surname, fame } = data
  const status = getStatusBadge(data)
  const showFame = fame >= 30

  const statList = showFame
    ? [...BASE_STATS, { key: '_fame', label: 'Fama', emoji: '⭐', color: '#FFB020' }]
    : BASE_STATS

  // Avatar ring color based on overall wellbeing
  const wellbeing = (stats.health + stats.happiness) / 2
  const ringColor = wellbeing >= 70 ? '#18D39E'
    : wellbeing >= 40 ? '#FFB020'
    : '#FF4D6D'

  const totalWealth = money + bankBalance

  return (
    <div className="hud flex-col gap-1" style={{ padding: '10px 14px 8px' }}>
      {/* Row 1: avatar + identity + wallet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        {/* Avatar with ring */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${ringColor}22`,
          border: `2px solid ${ringColor}66`,
          boxShadow: `0 0 12px ${ringColor}44`,
          fontSize: 20, lineHeight: 1,
        }}>
          {emoji}
        </div>

        {/* Name + age + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name} {surname}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>
              {age}a · {year}
            </span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', marginTop: 2,
            padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: 10, fontWeight: 600,
            background: `${status.color}1A`, color: status.color,
            border: `1px solid ${status.color}44`,
          }}>
            {status.label}
          </div>
        </div>

        {/* Wallet pill */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0,
          padding: '4px 10px', borderRadius: 'var(--radius-pill)',
          background: 'rgba(24,211,158,0.1)', border: '1px solid rgba(24,211,158,0.22)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#18D39E', lineHeight: 1 }}>
            {formatMoney(money)}
          </span>
          {bankBalance > 0 && (
            <span style={{ fontSize: 9, color: '#687087', marginTop: 1 }}>
              🏦 {formatMoney(bankBalance)}
            </span>
          )}
        </div>
      </div>

      {/* Stat bars */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statList.length}, 1fr)`, gap: 6 }}>
        {statList.map(({ key, emoji: statEmoji, label, color }) => {
          const val = key === '_fame' ? fame : (stats as unknown as Record<string, number>)[key] ?? 0
          const displayVal = Math.round(val)
          const isLow = displayVal < 30
          const barColor = isLow ? 'var(--red)' : color
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-secondary)' }}>
                <span>{statEmoji} {label}</span>
                <span style={{ color: isLow ? 'var(--red)' : displayVal > 70 ? barColor : 'var(--color-text-secondary)', fontWeight: isLow ? 700 : 400 }}>
                  {displayVal}
                </span>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${val}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
