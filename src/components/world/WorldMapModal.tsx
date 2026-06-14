// WorldMapModal — interactive stylized world map for choosing a country to
// emigrate to. Countries are clickable pins; selecting one shows its key
// stats and an "emigrate here" action.

import { useState } from 'react'
import type { Nation } from '../../store/types'

interface Props {
  nations: Nation[]
  currentNationId: string | undefined
  canEmigrate: boolean
  blockReason?: string
  onEmigrate: (nationId: string) => void
  onClose: () => void
}

// Approximate pin positions on a 360×190 stylized map.
const PIN_POS: Record<string, { x: number; y: number }> = {
  usa:     { x: 72,  y: 78 },
  brazil:  { x: 112, y: 135 },
  uk:      { x: 171, y: 56 },
  france:  { x: 176, y: 66 },
  spain:   { x: 167, y: 74 },
  germany: { x: 185, y: 58 },
  sweden:  { x: 190, y: 42 },
  ukraine: { x: 206, y: 60 },
  italy:   { x: 188, y: 72 },
  japan:   { x: 305, y: 74 },
}
const FLAGS: Record<string, string> = {
  italy: '🇮🇹', usa: '🇺🇸', germany: '🇩🇪', japan: '🇯🇵', brazil: '🇧🇷',
  sweden: '🇸🇪', ukraine: '🇺🇦', france: '🇫🇷', spain: '🇪🇸', uk: '🇬🇧',
}

export function WorldMapModal({ nations, currentNationId, canEmigrate, blockReason, onEmigrate, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = nations.find(n => n.id === selectedId) ?? null

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 22 }}>🗺️</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>Mappa del mondo</h2>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>Tocca un paese per i dettagli</p>
          </div>
          <button onClick={onClose} className="icon-btn icon-btn--danger" style={{ width: 32, height: 32 }} aria-label="Chiudi">✕</button>
        </div>

        {/* Map */}
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(180deg,#0e2a4a,#0a1f38)' }}>
          <svg viewBox="0 0 360 190" width="100%" style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
            {/* Stylized landmasses */}
            <g fill="#27506e" opacity="0.9">
              {/* Americas */}
              <path d="M40 50 Q70 35 95 55 Q100 80 85 95 L100 110 Q120 135 105 160 Q90 175 80 155 Q70 130 78 110 Q55 95 50 75 Z" />
              {/* Europe + Africa */}
              <path d="M158 40 Q200 30 225 48 Q230 70 210 78 Q220 110 200 150 Q180 170 172 145 Q165 110 178 80 Q160 70 158 55 Z" />
              {/* Asia */}
              <path d="M230 42 Q300 30 330 60 Q320 90 300 88 Q280 80 250 78 Q235 65 230 50 Z" />
              {/* Oceania */}
              <path d="M300 130 Q325 120 330 140 Q322 155 305 150 Q298 142 300 132 Z" />
            </g>

            {/* Pins */}
            {nations.map(n => {
              const pos = PIN_POS[n.id]
              if (!pos) return null
              const isCurrent = n.id === currentNationId
              const isSel = n.id === selectedId
              return (
                <g key={n.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(n.id)}>
                  <circle cx={pos.x} cy={pos.y} r={isSel ? 9 : 6}
                    fill={isCurrent ? '#22c55e' : isSel ? '#a78bfa' : '#f8fafc'}
                    stroke={isCurrent ? '#16a34a' : '#1e293b'} strokeWidth="1.5" />
                  {isSel && <circle cx={pos.x} cy={pos.y} r="13" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.6" />}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--color-text-secondary)', margin: '8px 2px 0' }}>
          <span>🟢 Dove vivi</span>
          <span>🟣 Selezionato</span>
        </div>

        {/* Quick flag chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {nations.map(n => (
            <button key={n.id} onClick={() => setSelectedId(n.id)}
              style={{
                padding: '5px 9px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid', borderColor: selectedId === n.id ? '#a78bfa' : 'rgba(255,255,255,0.12)',
                background: selectedId === n.id ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)',
                color: n.id === currentNationId ? '#86efac' : 'var(--color-text)',
              }}>
              {FLAGS[n.id] ?? '🌍'} {n.name}
            </button>
          ))}
        </div>

        {/* Selected detail */}
        {selected && (
          <div className="card" style={{ marginTop: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{FLAGS[selected.id] ?? '🌍'}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>{selected.name}</span>
              {selected.id === currentNationId && (
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(34,197,94,0.18)', color: '#86efac' }}>Attuale</span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 10 }}>
              <Stat label="💰 Costo vita" value={`${selected.costOfLiving.toFixed(2)}×`} />
              <Stat label="🧾 Tasse" value={`${Math.round(selected.taxRate * 100)}%`} />
              <Stat label="💼 Stipendio medio" value={`€${selected.avgSalary.toLocaleString('it-IT')}`} />
              <Stat label="🚨 Criminalità" value={`${Math.round(selected.crimeRate * 100)}%`} />
              <Stat label="🏥 Sanità pubblica" value={selected.healthcarePublic ? 'Sì' : 'No'} />
              <Stat label="⚖️ Corruzione" value={`${Math.round(selected.corruptionIndex * 100)}%`} />
            </div>
            {selected.id !== currentNationId && (
              <>
                <button
                  className="btn-candy btn-candy--primary"
                  style={{ width: '100%', fontSize: 14, padding: '11px 0', fontWeight: 700, opacity: canEmigrate ? 1 : 0.5 }}
                  disabled={!canEmigrate}
                  onClick={() => onEmigrate(selected.id)}
                >
                  🛫 Emigra in {selected.name} (€5.000)
                </button>
                {!canEmigrate && blockReason && (
                  <p style={{ fontSize: 11, color: '#fca5a5', textAlign: 'center', marginTop: 6 }}>{blockReason}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>{value}</span>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
}
const sheet: React.CSSProperties = {
  width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto',
  background: 'linear-gradient(160deg, #2A2150 0%, #1B1733 100%)',
  borderRadius: '20px 20px 0 0', padding: '16px 16px 32px',
  boxShadow: '0 -8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.16)',
  border: '1px solid rgba(167,139,250,0.3)',
}
