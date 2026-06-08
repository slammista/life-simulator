import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { TRAVEL_DESTS, type TravelClass, type TravelCategory } from '../../services/TravelEngine'

const CLASS_LABELS: Record<TravelClass, string> = {
  economy: '✈️ Economica', business: '💺 Business', luxury: '🛫 Prima Classe',
}
const CLASS_MULT: Record<TravelClass, number> = { economy: 1, business: 2.5, luxury: 6 }

const CATEGORY_LABELS: Record<TravelCategory, string> = {
  national: '🇮🇹 Italia', europe: '🇪🇺 Europa', asia: '🌏 Asia',
  americas: '🌎 Americhe', africa: '🌍 Africa', exotic: '🏝️ Esotiche',
}

export function TravelScreen() {
  const { finance, travelHistory, time, criminal, bookTrip } = useGameStore()
  const [feedback, setFeedback] = useState('')
  const [travelClass, setTravelClass] = useState<TravelClass>('economy')
  const [filter, setFilter] = useState<TravelCategory | 'all'>('all')

  const handleBook = (destId: string) => {
    const r = bookTrip(destId, travelClass)
    setFeedback(r.message)
  }

  const categories = ['all', ...new Set(TRAVEL_DESTS.map(d => d.category))] as (TravelCategory | 'all')[]
  const filtered = filter === 'all' ? TRAVEL_DESTS : TRAVEL_DESTS.filter(d => d.category === filter)

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback && (
        <div className="card" style={{ padding: 10, background: 'rgba(14,165,233,0.1)', borderColor: 'rgba(14,165,233,0.3)', fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {criminal.inPrison && (
        <div className="card" style={{ padding: 10, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', textAlign: 'center', fontSize: 13 }}>
          🔒 Non puoi viaggiare mentre sei in prigione.
        </div>
      )}

      {/* Class selection */}
      <div className="card" style={{ padding: '10px 12px' }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Classe di viaggio</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['economy', 'business', 'luxury'] as TravelClass[]).map(c => (
            <button
              key={c}
              onClick={() => setTravelClass(c)}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, border: 'none', cursor: 'pointer',
                background: travelClass === c ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
                color: travelClass === c ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {CLASS_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              background: filter === cat ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
              color: filter === cat ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {cat === 'all' ? '🌍 Tutte' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Destinations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(dest => {
          const cost = Math.floor(dest.economyCost * CLASS_MULT[travelClass])
          const canAfford = finance.money >= cost
          const alreadyVisited = travelHistory.some(t => t.destination === dest.name)
          const ageOk = time.age >= dest.minAge
          const disabled = !canAfford || criminal.inPrison || !ageOk

          return (
            <div key={dest.id} className="card" style={{ padding: '12px 14px', opacity: disabled ? 0.5 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 20 }}>{dest.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 6 }}>{dest.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 6 }}>{dest.country}</span>
                  {alreadyVisited && (
                    <span style={{ fontSize: 10, color: '#4ade80', marginLeft: 6 }}>✓ Visitata</span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: canAfford ? '#4ade80' : '#ef4444' }}>
                  €{cost.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 10, color: 'var(--color-text-secondary)' }}>
                  {dest.durationDays} giorni
                </span>
                <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 10, color: 'var(--color-text-secondary)' }}>
                  ⚠️ Rischio {dest.riskLevel}/5
                </span>
                <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 10, color: '#60a5fa' }}>
                  +{dest.effects.happiness ?? 0}😊 {dest.effects.mentalHealth ? `+${dest.effects.mentalHealth}🧠` : ''}
                </span>
              </div>
              <button
                className={canAfford && !disabled ? 'btn-primary' : 'btn-secondary'}
                style={{ width: '100%', padding: '7px 0', fontSize: 12 }}
                onClick={() => handleBook(dest.id)}
                disabled={disabled}
              >
                {!ageOk ? `Min ${dest.minAge} anni` : !canAfford ? `Servono €${cost.toLocaleString()}` : `Prenota (${CLASS_LABELS[travelClass]})`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Travel history */}
      {travelHistory.length === 0 && (
        <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            Nessun viaggio ancora.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Il mondo ti aspetta. Prenota il tuo primo viaggio e accumula esperienze!
          </p>
        </div>
      )}
      {travelHistory.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Viaggi passati ({travelHistory.length})
          </p>
          {travelHistory.slice(0, 10).map((t, i) => (
            <div key={i} style={{ padding: '5px 8px', fontSize: 12, color: 'var(--color-text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              🗺️ {t.destination} · Anno {t.year} · €{t.cost.toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
