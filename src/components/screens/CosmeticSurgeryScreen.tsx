import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { CosmeticSurgeryEngine } from '../../services/CosmeticSurgeryEngine'
import type { CosmeticProcedure } from '../../services/CosmeticSurgeryEngine'
import { feedback } from '../../services/FeedbackEngine'

type FilterCategory = 'all' | 'face' | 'body' | 'filler' | 'non_invasive'

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  all: 'Tutti',
  face: '👤 Viso',
  body: '💪 Corpo',
  filler: '💉 Filler',
  non_invasive: '✨ Non Invasivo',
}

export default function CosmeticSurgeryScreen() {
  const state = useGameStore(s => s)
  const performSurgery = useGameStore(s => s.performSurgery)
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [lastMsg, setLastMsg] = useState('')
  const [lastSuccess, setLastSuccess] = useState(true)

  const available = CosmeticSurgeryEngine.getAvailableProcedures(state)
  const surgeryState = state.cosmeticSurgery

  const filtered = available.filter(
    a => filter === 'all' || a.procedure.category === filter
  )

  function handleSurgery(proc: CosmeticProcedure) {
    const result = performSurgery(proc.id)
    feedback(result.success ? 'success' : 'error')
    setLastMsg(result.message)
    setLastSuccess(result.success)
  }

  const tierColor = (canDo: boolean) =>
    canDo ? '#4ade80' : '#6b7280'

  return (
    <div style={{ padding: '12px', maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ color: '#f0abfc', marginBottom: 8 }}>💉 Chirurgia Estetica</h2>

      {/* Stats summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8, marginBottom: 12,
      }}>
        <StatBox label="Interventi totali" value={surgeryState.totalSurgeries} />
        <StatBox label="Bonus aspetto" value={`+${surgeryState.totalLooksBonus}`} />
        <StatBox
          label="Complicazione"
          value={surgeryState.hasActiveComplication ? '⚠️ Sì' : '✅ No'}
          valueColor={surgeryState.hasActiveComplication ? '#f87171' : '#4ade80'}
        />
      </div>

      {/* Last message */}
      {lastMsg && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 12,
          background: lastSuccess ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${lastSuccess ? '#4ade80' : '#f87171'}`,
          color: lastSuccess ? '#4ade80' : '#f87171',
          fontSize: 13,
        }}>
          {lastMsg}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {(Object.keys(CATEGORY_LABELS) as FilterCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === cat ? '#a855f7' : 'rgba(255,255,255,0.08)',
              color: '#e2e8f0', fontSize: 12,
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Procedure cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(({ procedure: proc, usesCount, canDo, reason }) => (
          <div
            key={proc.id}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${canDo ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, padding: '12px',
              opacity: canDo ? 1 : 0.65,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>
                  {proc.emoji} {proc.name}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                  {proc.description}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12 }}>
                  <Chip label={`€${proc.minCost.toLocaleString()}–€${proc.maxCost.toLocaleString()}`} color="#60a5fa" />
                  <Chip label={`+${proc.looksBonus} aspetto`} color="#f0abfc" />
                  {proc.recoveryWeeks > 0 && <Chip label={`${proc.recoveryWeeks}w recovery`} color="#fbbf24" />}
                  <Chip label={`Rischio: ${Math.round(proc.complicationBase * 100)}%`} color="#f87171" />
                  {!proc.isRepeatable && (
                    <Chip label={`${usesCount}/${proc.maxUses} usi`} color={usesCount >= proc.maxUses ? '#f87171' : '#94a3b8'} />
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSurgery(proc)}
                disabled={!canDo}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: canDo ? '#a855f7' : 'rgba(255,255,255,0.08)',
                  color: tierColor(canDo), cursor: canDo ? 'pointer' : 'not-allowed',
                  fontSize: 12, fontWeight: 600, marginLeft: 8, whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                Prenota
              </button>
            </div>
            {!canDo && reason && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#f87171' }}>⛔ {reason}</div>
            )}
          </div>
        ))}
      </div>

      {/* Surgery history */}
      {surgeryState.surgeries.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h3 style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>📋 Storico interventi</h3>
          {[...surgeryState.surgeries].reverse().map(s => (
            <div
              key={s.id}
              style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                background: s.hadComplication ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${s.hadComplication ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.06)'}`,
                fontSize: 12, color: '#cbd5e1',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {s.name} — Anno {s.year} — €{s.cost.toLocaleString()}
              </div>
              <div style={{ color: '#94a3b8' }}>
                Aspetto +{s.looksBonus}
                {s.hadComplication && (
                  <span style={{ color: '#f87171', marginLeft: 8 }}>
                    ⚠️ {s.complicationDescription}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: valueColor ?? '#f0abfc' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 12,
      background: `${color}20`, border: `1px solid ${color}60`,
      color, fontSize: 11,
    }}>
      {label}
    </span>
  )
}
