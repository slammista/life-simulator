import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { SECTOR_DEFS } from '../../services/BusinessEngine'
import type { BusinessSector } from '../../store/types'

export function BusinessScreen() {
  const { career, time, finance, foundBusiness, hireBizEmployee, fireBizEmployee, sellBusiness } = useGameStore()
  const [feedback, setFeedback] = useState('')
  const [selectedSector, setSelectedSector] = useState<BusinessSector | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [showSellConfirm, setShowSellConfirm] = useState(false)
  const biz = career.businessOwned

  const fb = (fn: () => import('../../store/types').ActionResult) => {
    const r = fn()
    setFeedback(r.message)
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback && (
        <div className="card" style={{ padding: 10, background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)', fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* Active business dashboard */}
      {biz?.isActive ? (
        <>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>{SECTOR_DEFS.find(d => d.id === biz.sector)?.emoji ?? '🏢'}</span>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{biz.name}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{SECTOR_DEFS.find(d => d.id === biz.sector)?.label ?? biz.type} · Fondata nel {biz.founded}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Valutazione', value: `€${(biz.valuation ?? 0).toLocaleString('it-IT')}`, emoji: '💰' },
                { label: 'Profitto anno', value: `€${(biz.annualProfit ?? 0).toLocaleString('it-IT')}`, emoji: '📈' },
                { label: 'Dipendenti', value: `${biz.employees} / 20`, emoji: '👥' },
                { label: 'Reputazione', value: `${biz.reputation}%`, emoji: '⭐' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{item.emoji} {item.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{item.value}</p>
                </div>
              ))}
            </div>
            {/* Reputation bar */}
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6, marginBottom: 10 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 4, background: biz.reputation > 60 ? '#4ade80' : biz.reputation > 30 ? '#f59e0b' : '#ef4444', transform: `scaleX(${biz.reputation / 100})`, transformOrigin: 'left', transition: 'transform 0.3s' }} />
            </div>
            {/* Employee management */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" style={{ flex: 1, fontSize: 11, padding: '6px 4px' }}
                onClick={() => fb(() => hireBizEmployee())}>
                ➕ Assumi (€18k/anno)
              </button>
              <button className="btn-secondary" style={{ flex: 1, fontSize: 11, padding: '6px 4px' }}
                disabled={biz.employees === 0}
                onClick={() => fb(() => fireBizEmployee())}>
                ➖ Licenzia
              </button>
            </div>
          </div>

          {/* Sell */}
          {!showSellConfirm ? (
            <button className="btn-secondary" style={{ width: '100%', padding: '8px 0', fontSize: 12 }}
              onClick={() => setShowSellConfirm(true)}>
              💰 Vendi l'azienda (€{(biz.valuation ?? 0).toLocaleString('it-IT')})
            </button>
          ) : (
            <div className="card" style={{ padding: 12, borderColor: 'rgba(239,68,68,0.3)' }}>
              <p style={{ fontSize: 13, marginBottom: 10 }}>Sei sicuro/a di voler vendere <b>{biz.name}</b> per <b>€{(biz.valuation ?? 0).toLocaleString('it-IT')}</b>?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={() => { fb(() => sellBusiness()); setShowSellConfirm(false) }}>Sì, vendi</button>
                <button className="btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={() => setShowSellConfirm(false)}>Annulla</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="card" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🚀 Fonda la tua Azienda</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Scegli un settore e dai il nome alla tua impresa. Il successo dipenderà dalle tue competenze!</p>
          </div>

          {/* Sector picker */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SECTOR_DEFS.map(def => (
              <button key={def.id} onClick={() => { setSelectedSector(def.id); setCompanyName(`${time.age > 0 ? '' : ''}${def.label} S.r.l.`) }}
                style={{
                  padding: '10px 12px', borderRadius: 12, border: `1px solid ${selectedSector === def.id ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedSector === def.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{def.emoji}</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{def.label}</p>
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Capitale: €{def.startupCost.toLocaleString('it-IT')}</p>
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Skill: {def.skillKey}</p>
              </button>
            ))}
          </div>

          {selectedSector && (
            <div className="card" style={{ padding: '12px 14px' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Nome dell'azienda</p>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Es. Mario Rossi S.r.l."
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--color-text)', marginBottom: 10, boxSizing: 'border-box',
                }}
              />
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '8px 0', fontSize: 12 }}
                disabled={!companyName.trim() || finance.money < (SECTOR_DEFS.find(d => d.id === selectedSector)?.startupCost ?? 0)}
                onClick={() => fb(() => foundBusiness(selectedSector!, companyName.trim() || 'La mia azienda'))}
              >
                🚀 Fonda (€{(SECTOR_DEFS.find(d => d.id === selectedSector)?.startupCost ?? 0).toLocaleString('it-IT')})
              </button>
            </div>
          )}
        </>
      )}

      {/* Past businesses */}
      {biz && !biz.isActive && (
        <div className="card" style={{ padding: '10px 12px' }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>📁 Azienda precedente</p>
          <p style={{ fontSize: 13 }}>{biz.name} · {biz.lossYears && biz.lossYears >= 3 ? '💸 Fallita' : '💰 Venduta'}</p>
        </div>
      )}
    </div>
  )
}
