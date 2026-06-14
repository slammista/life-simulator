// Money exchange (give / ask loan / repay) between player and an NPC.
// Shared by the relationship detail views.

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import type { Relationship } from '../../store/types'

export function MoneyExchange({ rel }: { rel: Relationship }) {
  const giveMoneyToNpc = useGameStore(s => s.giveMoneyToNpc)
  const askMoneyFromNpc = useGameStore(s => s.askMoneyFromNpc)
  const repayNpcLoan = useGameStore(s => s.repayNpcLoan)
  const npcLoans = useGameStore(s => s.npcLoans)
  const playerAge = useGameStore(s => s.time.age)
  const money = useGameStore(s => s.finance.money)
  const pushToast = useToastStore(s => s.push)
  const [mode, setMode] = useState<'none' | 'give' | 'ask'>('none')

  if (playerAge < 12 || !rel.isAlive) return null

  const unpaidLoan = (npcLoans ?? []).find(l => l.npcId === rel.id && !l.repaid)
  const amounts = mode === 'give' ? [20, 100, 500, 1000] : [100, 500, 1000, 2000]

  const run = (amount: number) => {
    const res = mode === 'give' ? giveMoneyToNpc(rel.id, amount) : askMoneyFromNpc(rel.id, amount)
    pushToast(res.message, mode === 'give' ? '💝' : '💶', res.success)
    setMode('none')
  }

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        💰 Denaro
      </div>

      {unpaidLoan && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: '6px 10px', borderRadius: 8, marginBottom: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
        }}>
          <span style={{ fontSize: 11, color: '#fca5a5' }}>
            💸 Devi €{unpaidLoan.amount.toLocaleString('it-IT')} (entro {unpaidLoan.dueYear})
          </span>
          <button
            className="tap-scale"
            disabled={money < unpaidLoan.amount}
            onClick={() => { const r = repayNpcLoan(unpaidLoan.id); pushToast(r.message, '🤝', r.success) }}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.12)',
              color: money < unpaidLoan.amount ? '#475569' : '#6ee7b7',
              opacity: money < unpaidLoan.amount ? 0.5 : 1,
            }}
          >
            Restituisci
          </button>
        </div>
      )}

      {mode === 'none' ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="tap-scale" onClick={() => setMode('give')} style={{
            padding: '6px 11px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.1)', color: '#6ee7b7',
          }}>
            💝 Dai soldi
          </button>
          {!unpaidLoan && (
            <button className="tap-scale" onClick={() => setMode('ask')} style={{
              padding: '6px 11px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.1)', color: '#fcd34d',
            }}>
              💶 Chiedi prestito
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {mode === 'give' ? 'Quanto dai?' : 'Quanto chiedi?'}
          </span>
          {amounts.map(a => (
            <button key={a} className="tap-scale" onClick={() => run(a)}
              disabled={mode === 'give' && money < a}
              style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
                color: mode === 'give' && money < a ? '#475569' : 'var(--color-text)',
                opacity: mode === 'give' && money < a ? 0.5 : 1,
              }}>
              €{a.toLocaleString('it-IT')}
            </button>
          ))}
          <button onClick={() => setMode('none')} style={{
            padding: '5px 8px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
            border: 'none', background: 'none', color: '#64748b',
          }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
