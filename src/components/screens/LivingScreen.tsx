import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LivingEngine, LIVING_OPTIONS, HOUSE_PRICES } from '../../services/LivingEngine'
import type { LivingType } from '../../store/types'

const LIVING_ORDER: LivingType[] = ['parents', 'dormitory', 'roommate', 'renting', 'owning']

export default function LivingScreen() {
  const state = useGameStore(s => s)
  const upgradeLiving = useGameStore(s => s.upgradeLiving)
  const buyHouseWithMortgage = useGameStore(s => s.buyHouseWithMortgage)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'status' | 'upgrade' | 'buy'>('status')
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null)

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleUpgrade = (type: LivingType) => {
    const r = upgradeLiving(type)
    flash(r.message, r.success)
  }

  const handleBuyHouse = () => {
    if (!selectedHouse) { flash('Seleziona una casa prima.', false); return }
    const r = buyHouseWithMortgage(selectedHouse)
    flash(r.message, r.success)
    if (r.success) setSelectedHouse(null)
  }

  const living = state.living
  const currentIdx = LIVING_ORDER.indexOf(living.type)

  return (
    <div style={{ padding: 12, maxWidth: 620, margin: '0 auto' }}>
      <h2 style={{ color: '#60a5fa', marginBottom: 8 }}>🏠 Abitazione</h2>

      {feedback && (
        <div style={{
          borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13,
          background: feedback.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: feedback.ok ? '#86efac' : '#fca5a5',
          border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['status', 'upgrade', 'buy'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {t === 'status' ? '📍 Situazione' : t === 'upgrade' ? '📦 Sposta' : '🏡 Acquista'}
          </button>
        ))}
      </div>

      {/* STATUS TAB */}
      {tab === 'status' && (
        <div>
          {/* Current living card */}
          <div style={{
            background: 'rgba(96,165,250,0.1)', borderRadius: 12, padding: 16,
            border: '1px solid rgba(96,165,250,0.3)', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36 }}>{LivingEngine.getLivingEmoji(living.type)}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#60a5fa' }}>
                  {LivingEngine.getLivingStatusLabel(living.type)}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {living.location || 'Italia'}
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <StatCard label="Costo mensile" value={`€${living.monthlyCost.toLocaleString()}/mese`} emoji="💸" />
            {living.type === 'owning' && (
              <StatCard label="Valore proprietà" value={`€${living.propertyValue.toLocaleString()}`} emoji="🏡" />
            )}
            {living.mortgageRemaining > 0 && (
              <StatCard label="Mutuo residuo" value={`€${living.mortgageRemaining.toLocaleString()}`} emoji="🏦" />
            )}
            {living.roommates.length > 0 && (
              <StatCard label="Coinquilini" value={`${living.roommates.length}`} emoji="👥" />
            )}
            <StatCard label="Credit Score" value={`${state.finance.creditScore}`} emoji="📊" />
            <StatCard label="Reddito mensile" value={`€${state.finance.monthlyIncome.toLocaleString()}`} emoji="💰" />
          </div>

          {/* Progress timeline */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>PERCORSO ABITATIVO</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto' }}>
              {LIVING_ORDER.map((type, idx) => {
                const opt = LIVING_OPTIONS.find(o => o.type === type) ?? { emoji: '🏠', label: type }
                const isCurrent = type === living.type
                const isPast = idx < currentIdx
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '6px 8px', borderRadius: 8, minWidth: 54,
                      background: isCurrent ? 'rgba(96,165,250,0.15)' : 'transparent',
                      border: isCurrent ? '1px solid rgba(96,165,250,0.4)' : '1px solid transparent',
                      opacity: isPast ? 0.5 : 1,
                    }}>
                      <div style={{ fontSize: 18 }}>{opt.emoji}</div>
                      <div style={{ fontSize: 9, color: isCurrent ? '#60a5fa' : '#64748b', textAlign: 'center', lineHeight: 1.2 }}>
                        {opt.label?.split(' ').slice(0, 2).join(' ')}
                      </div>
                      {isCurrent && <div style={{ fontSize: 8, color: '#60a5fa', marginTop: 2 }}>← ora</div>}
                    </div>
                    {idx < LIVING_ORDER.length - 1 && (
                      <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE TAB */}
      {tab === 'upgrade' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LIVING_OPTIONS.map(opt => {
            const isCurrent = opt.type === living.type
            const { canUpgrade, reason } = LivingEngine.canUpgrade(opt.type, state)
            return (
              <div
                key={opt.type}
                style={{
                  background: isCurrent ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isCurrent ? 'rgba(96,165,250,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10, padding: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                    <div style={{ fontSize: 28 }}>{opt.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isCurrent ? '#60a5fa' : '#e2e8f0' }}>
                        {opt.label} {isCurrent && <span style={{ fontSize: 10, color: '#60a5fa' }}>← attuale</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{opt.description}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#fbbf24' }}>💸 €{opt.monthlyCost}/mese</span>
                        {opt.upfrontCost > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>Anticipo: €{opt.upfrontCost}</span>}
                        {opt.minIncome > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>Reddito: €{opt.minIncome}+</span>}
                      </div>
                      {!canUpgrade && !isCurrent && (
                        <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>⛔ {reason}</div>
                      )}
                    </div>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => handleUpgrade(opt.type)}
                      disabled={!canUpgrade}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: 'none', cursor: canUpgrade ? 'pointer' : 'not-allowed',
                        background: canUpgrade ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.05)',
                        color: canUpgrade ? '#60a5fa' : '#475569',
                        flexShrink: 0, marginLeft: 8,
                      }}
                    >
                      Scegli
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* BUY HOUSE TAB */}
      {tab === 'buy' && (
        <div>
          {living.type === 'owning' ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏡</div>
              <div>Sei già proprietario di casa!</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Valore: €{living.propertyValue.toLocaleString()}</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                Per acquistare casa serve un anticipo del 20% e credit score ≥ 580. Mutuo a 25 anni.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {HOUSE_PRICES.map(house => {
                  const { canBuy, reason, monthlyPayment, interestRate } = LivingEngine.canBuyHouse(house.id, state)
                  const downPayment = Math.round(house.price * 0.20)
                  const isSelected = selectedHouse === house.id
                  return (
                    <div
                      key={house.id}
                      onClick={() => setSelectedHouse(isSelected ? null : house.id)}
                      style={{
                        background: isSelected ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 10, padding: 12, cursor: 'pointer',
                        opacity: canBuy || isSelected ? 1 : 0.6,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ fontSize: 28 }}>{house.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{house.label}</div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: '#fbbf24' }}>Prezzo: €{house.price.toLocaleString()}</span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Anticipo: €{downPayment.toLocaleString()}</span>
                          </div>
                          {canBuy ? (
                            <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>
                              Rata: €{monthlyPayment.toLocaleString()}/mese · Tasso {(interestRate * 100).toFixed(1)}%
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>⛔ {reason}</div>
                          )}
                        </div>
                        {isSelected && <div style={{ color: '#60a5fa', fontSize: 18 }}>✓</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={handleBuyHouse}
                disabled={!selectedHouse}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 14,
                  fontWeight: 700, border: 'none', cursor: selectedHouse ? 'pointer' : 'not-allowed',
                  background: selectedHouse ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'rgba(255,255,255,0.05)',
                  color: selectedHouse ? '#fff' : '#475569',
                }}
              >
                🏡 Acquista Casa
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ fontSize: 10, color: '#64748b' }}>{emoji} {label}</div>
      <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{value}</div>
    </div>
  )
}
