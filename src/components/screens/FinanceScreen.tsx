import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getAllInvestmentDefs, FinanceEngine } from '../../services/FinanceEngine'

export function FinanceScreen() {
  const finance = useGameStore(s => s.finance)
  const market = useGameStore(s => s.market)
  const state = useGameStore(s => s)
  const investMoney = useGameStore(s => s.investMoney)
  const sellInvestment = useGameStore(s => s.sellInvestment)
  const takeLoan = useGameStore(s => s.takeLoan)

  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'overview' | 'invest' | 'assets'>('overview')
  const [investAmount, setInvestAmount] = useState('')
  const [selectedDef, setSelectedDef] = useState<string | null>(null)
  const [loanAmount, setLoanAmount] = useState('')

  const flash = (msg: string, ok: boolean) => {
    setFeedback({ msg, ok })
    setTimeout(() => setFeedback(null), 3500)
  }

  const handleInvest = () => {
    if (!selectedDef) return
    const amt = parseInt(investAmount)
    if (isNaN(amt) || amt <= 0) { flash('Inserisci un importo valido.', false); return }
    const r = investMoney(selectedDef, amt)
    flash(r.message, r.success)
    if (r.success) { setInvestAmount(''); setSelectedDef(null) }
  }

  const handleSell = (id: string) => {
    const r = sellInvestment(id)
    flash(r.message, r.success)
  }

  const handleLoan = () => {
    const amt = parseInt(loanAmount)
    if (isNaN(amt) || amt <= 0) { flash('Inserisci un importo valido.', false); return }
    const r = takeLoan(amt)
    flash(r.message, r.success)
    if (r.success) setLoanAmount('')
  }

  const creditScore = FinanceEngine.calculateCreditScore(state)
  const creditLabel = creditScore >= 800 ? 'Eccellente' : creditScore >= 740 ? 'Molto buono' : creditScore >= 670 ? 'Buono' : creditScore >= 580 ? 'Discreto' : 'Scarso'
  const creditColor = creditScore >= 740 ? '#10b981' : creditScore >= 670 ? '#f59e0b' : creditScore >= 580 ? '#f97316' : '#ef4444'

  const totalInvested = finance.investments.reduce((s, i) => s + i.amount, 0)
  const totalValue = finance.investments.reduce((s, i) => s + i.currentValue, 0)
  const totalGain = totalValue - totalInvested
  const totalAssets = finance.assets.reduce((s, a) => s + a.value, 0)

  const defs = getAllInvestmentDefs()
  const marketState = FinanceEngine.ensureMarket(market)
  const sentimentLabel = {
    crash: 'Crash',
    bear: 'Ribassista',
    neutral: 'Neutro',
    bull: 'Rialzista',
    mania: 'Euforia',
  }[marketState.sentiment]
  const sentimentColor = marketState.sentiment === 'crash' || marketState.sentiment === 'bear'
    ? '#ef4444'
    : marketState.sentiment === 'bull' || marketState.sentiment === 'mania'
      ? '#10b981'
      : '#f59e0b'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>💰 Finanze</h2>

      {feedback && (
        <div style={{
          borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 500,
          background: feedback.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: feedback.ok ? '#86efac' : '#fca5a5',
          border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['overview', 'invest', 'assets'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--color-cta)' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#fff' : 'var(--color-text-secondary)' }}
          >
            {t === 'overview' ? '📊 Panoramica' : t === 'invest' ? '📈 Investi' : '🏠 Asset'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Net worth */}
          <div className="card" style={{ padding: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Patrimonio netto</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
              €{(finance.money + finance.bankBalance + totalValue + totalAssets - finance.debt).toLocaleString('it-IT')}
            </p>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Liquidità', val: `€${finance.money.toLocaleString('it-IT')}`, emoji: '💵', color: '#10b981' },
              { label: 'Banca', val: `€${finance.bankBalance.toLocaleString('it-IT')}`, emoji: '🏦', color: '#6366f1' },
              { label: 'Investimenti', val: `€${totalValue.toLocaleString('it-IT')}`, emoji: '📈', color: totalGain >= 0 ? '#10b981' : '#ef4444' },
              { label: 'Debiti', val: `€${finance.debt.toLocaleString('it-IT')}`, emoji: '💳', color: finance.debt > 0 ? '#ef4444' : '#10b981' },
            ].map(({ label, val, emoji, color }) => (
              <div key={label} className="card" style={{ padding: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{emoji} {label}</p>
                <p style={{ fontWeight: 700, fontSize: 14, color, marginTop: 4 }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Credit score */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Credit Score</p>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 800, fontSize: 20, color: creditColor }}>{creditScore}</p>
                <p style={{ fontSize: 11, color: creditColor }}>{creditLabel}</p>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((creditScore - 300) / 550) * 100}%`, background: creditColor, borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              <span>300</span><span>580</span><span>670</span><span>740</span><span>850</span>
            </div>
          </div>

          {/* Loan section */}
          <div className="card" style={{ padding: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Richiedi prestito</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                placeholder="Importo €"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)', fontSize: 13 }}
              />
              <button onClick={handleLoan}
                style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(233,69,96,0.2)', color: 'var(--color-cta)', fontSize: 13, fontWeight: 500, border: '1px solid rgba(233,69,96,0.3)', cursor: 'pointer' }}>
                Richiedi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invest tab */}
      {tab === 'invest' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Active investments */}
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700 }}>📈 Mercato</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  Sentiment: <span style={{ color: sentimentColor }}>{sentimentLabel}</span>
                </p>
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                {marketState.events[0] ? `${marketState.events[0].emoji} ${marketState.events[0].title}` : 'Nessun evento macro'}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {marketState.assets.map(asset => {
                const move = ((asset.price / Math.max(1, asset.previousPrice) - 1) * 100)
                return (
                  <div key={asset.symbol} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, gap: 6 }}>
                      <span>{asset.emoji} {asset.symbol}</span>
                      <span style={{ color: move >= 0 ? '#86efac' : '#fca5a5' }}>{move >= 0 ? '+' : ''}{move.toFixed(1)}%</span>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>€{asset.price.toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {finance.investments.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Portafoglio attivo
              </p>
              {finance.investments.map(inv => {
                const gain = inv.currentValue - inv.amount
                const pct = ((inv.currentValue / inv.amount - 1) * 100).toFixed(1)
                return (
                  <div key={inv.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{inv.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Investito: €{inv.amount.toLocaleString('it-IT')}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: gain >= 0 ? '#10b981' : '#ef4444' }}>€{inv.currentValue.toLocaleString('it-IT')}</p>
                        <p style={{ fontSize: 11, color: gain >= 0 ? '#86efac' : '#fca5a5' }}>{gain >= 0 ? '+' : ''}{pct}%</p>
                      </div>
                    </div>
                    <button onClick={() => handleSell(inv.id)}
                      style={{ width: '100%', marginTop: 8, padding: '7px 0', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: 12, fontWeight: 500, border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                      Vendi
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* New investment */}
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Nuovi investimenti
          </p>
          {defs.map(def => (
            <div key={def.id} className="card" style={{ padding: 12, border: selectedDef === def.id ? '1px solid rgba(233,69,96,0.4)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{def.emoji} {def.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    Min €{def.minAmount.toLocaleString('it-IT')} · Rischio {def.risk} · Prezzo €{(marketState.assets.find(a => a.symbol === def.id)?.price ?? 100).toFixed(2)}
                  </p>
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#10b981' }}>~{(def.expectedReturn * 100).toFixed(0)}%/anno</p>
              </div>
              <button onClick={() => setSelectedDef(selectedDef === def.id ? null : def.id)}
                style={{ width: '100%', padding: '7px 0', borderRadius: 10, background: selectedDef === def.id ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)', color: selectedDef === def.id ? '#fff' : 'var(--color-text)', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                {selectedDef === def.id ? 'Selezionato ✓' : 'Seleziona'}
              </button>
            </div>
          ))}

          {selectedDef && (
            <div className="card" style={{ padding: 14, border: '1px solid rgba(233,69,96,0.3)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                Importo da investire (disponibile: €{finance.money.toLocaleString('it-IT')})
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={investAmount} onChange={e => setInvestAmount(e.target.value)}
                  placeholder="€" style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text)', fontSize: 13 }} />
                <button onClick={handleInvest}
                  style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--color-cta)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  Investi
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assets tab */}
      {tab === 'assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {finance.assets.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 22, marginBottom: 6 }}>🏠</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Nessun asset posseduto.</p>
            </div>
          ) : (
            finance.assets.map(asset => (
              <div key={asset.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{asset.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      Acquistato {asset.purchaseYear} · Manutenzione €{asset.maintenanceCost.toLocaleString('it-IT')}/anno
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#10b981' }}>€{asset.value.toLocaleString('it-IT')}</p>
                    <p style={{ fontSize: 11, color: asset.value >= asset.purchaseValue ? '#86efac' : '#fca5a5' }}>
                      {asset.value >= asset.purchaseValue ? '+' : ''}{(((asset.value / asset.purchaseValue) - 1) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
