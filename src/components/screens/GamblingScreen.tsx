import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { GamblingGame, SportBetType } from '../../services/GamblingEngine'

type GamblingSubTab = 'casino' | 'lotteria' | 'scommesse'

const CASINO_GAMES: { id: GamblingGame; name: string; emoji: string; houseEdge: string; minBet: number; maxBet: number }[] = [
  { id: 'slots',     name: 'Slot Machine',  emoji: '🎰', houseEdge: '8%',   minBet: 1,   maxBet: 100  },
  { id: 'blackjack', name: 'Blackjack',     emoji: '🃏', houseEdge: '0.5%', minBet: 10,  maxBet: 1000 },
  { id: 'roulette',  name: 'Roulette',      emoji: '🎡', houseEdge: '2.7%', minBet: 5,   maxBet: 500  },
  { id: 'poker',     name: 'Poker',         emoji: '♠️', houseEdge: '3%',   minBet: 20,  maxBet: 5000 },
]

const SPORTS: { id: SportBetType; name: string; emoji: string }[] = [
  { id: 'calcio',   name: 'Calcio',    emoji: '⚽' },
  { id: 'tennis',   name: 'Tennis',    emoji: '🎾' },
  { id: 'basket',   name: 'Basket',    emoji: '🏀' },
  { id: 'formula1', name: 'Formula 1', emoji: '🏎️' },
  { id: 'boxe',     name: 'Boxe',      emoji: '🥊' },
]

export default function GamblingScreen() {
  const store = useGameStore()
  const { gambling, finance, playCasinoGame, buyLotteryTicket, buyScratchCard, placeSportsBet } = store
  const [sub, setSub] = useState<GamblingSubTab>('casino')
  const [lastMsg, setLastMsg] = useState('')
  const [betAmount, setBetAmount] = useState<Record<string, number>>({})
  const [sportBet, setSportBet] = useState<Record<SportBetType, number>>({} as Record<SportBetType, number>)

  const addictionColor = gambling.addictionLevel >= 70 ? '#ef4444' : gambling.addictionLevel >= 40 ? '#f59e0b' : '#10b981'
  const netBalance = gambling.totalWon - gambling.totalLost

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      <h2 style={{ fontSize: 16, marginBottom: 8, color: 'var(--color-text)' }}>🎲 Gioco d'Azzardo</h2>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {([['casino', '🎰', 'Casinò'], ['lotteria', '🎟️', 'Lotteria'], ['scommesse', '⚽', 'Scommesse']] as [GamblingSubTab, string, string][]).map(([id, emoji, label]) => (
          <button key={id} onClick={() => setSub(id)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, border: 'none', cursor: 'pointer',
              background: sub === id ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
              color: sub === id ? '#fff' : 'var(--color-text-secondary)' }}>
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Addiction warning */}
      {gambling.addictionLevel >= 50 && (
        <div style={{ borderRadius: 12, padding: '10px 14px', marginBottom: 12, background: gambling.addictionLevel >= 70 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)', border: `1px solid ${gambling.addictionLevel >= 70 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}` }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: gambling.addictionLevel >= 70 ? '#fca5a5' : '#fcd34d' }}>
            {gambling.addictionLevel >= 70 ? '🚨 Dipendenza grave — il gioco controlla la tua vita.' : '⚠️ Stai sviluppando una dipendenza dal gioco.'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>
            {gambling.addictionLevel >= 70 ? 'Ogni anno c\'è il rischio di perdere soldi involontariamente. Considera la terapia.' : 'Limitati e valuta l\'aiuto di un professionista.'}
          </p>
        </div>
      )}

      {/* Stats card */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Vinto</p>
            <p style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>+€{gambling.totalWon.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Perso</p>
            <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>-€{gambling.totalLost.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Bilancio</p>
            <p style={{ fontSize: 13, color: netBalance >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {netBalance >= 0 ? '+' : ''}€{netBalance.toLocaleString()}
            </p>
          </div>
        </div>
        {gambling.addictionLevel > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 10, color: addictionColor }}>Dipendenza</p>
              <p style={{ fontSize: 10, color: addictionColor }}>{gambling.addictionLevel.toFixed(0)}/100</p>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginTop: 2 }}>
              <div style={{ width: `${gambling.addictionLevel}%`, height: '100%', borderRadius: 2, background: addictionColor, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}
        {gambling.jackpotWon && <p style={{ fontSize: 11, color: '#fbbf24', marginTop: 4 }}>🏆 Jackpot vinto nella tua vita!</p>}
      </div>

      {lastMsg && (
        <div className="card" style={{ marginBottom: 12, borderLeft: '3px solid var(--color-cta)' }}>
          <p style={{ fontSize: 13 }}>{lastMsg}</p>
        </div>
      )}

      {/* Casino games */}
      {sub === 'casino' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {gambling.casinoBlacklisted && (
            <div className="card" style={{ borderLeft: '3px solid #ef4444' }}>
              <p style={{ fontSize: 13, color: '#ef4444' }}>🚫 Sei nella blacklist del casinò.</p>
            </div>
          )}
          {CASINO_GAMES.map(game => {
            const bet = betAmount[game.id] ?? game.minBet
            return (
              <div key={game.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{game.emoji} {game.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      House edge: {game.houseEdge} · Min: €{game.minBet} · Max: €{game.maxBet.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number" min={game.minBet} max={Math.min(game.maxBet, finance.money)}
                    value={bet}
                    onChange={e => setBetAmount(prev => ({ ...prev, [game.id]: Math.max(game.minBet, Math.min(game.maxBet, Number(e.target.value))) }))}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)', fontSize: 13 }}
                  />
                  <button
                    className="tap-scale"
                    onClick={() => {
                      const r = playCasinoGame(game.id, bet)
                      setLastMsg(r.message)
                    }}
                    disabled={finance.money < game.minBet || gambling.casinoBlacklisted}
                    style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer',
                      background: 'var(--color-cta)', color: '#fff', opacity: finance.money < game.minBet ? 0.5 : 1 }}>
                    Gioca
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lottery */}
      {sub === 'lotteria' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card">
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🎟️ Lotteria Nazionale</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Costo: €5 · Jackpot: €10M–€100M · Probabilità: 1:14.000.000
            </p>
            <button onClick={() => { const r = buyLotteryTicket(); setLastMsg(r.message) }}
              disabled={finance.money < 5}
              style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 14, border: 'none', cursor: 'pointer', background: 'var(--color-cta)', color: '#fff' }}>
              Compra Biglietto €5
            </button>
          </div>

          <div className="card">
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>📄 Gratta e Vinci</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Costo: €5 o €10 · Vincita immediata · 25% di probabilità
            </p>
            <button onClick={() => { const r = buyScratchCard(); setLastMsg(r.message) }}
              disabled={finance.money < 5}
              style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 14, border: 'none', cursor: 'pointer', background: '#7c3aed', color: '#fff' }}>
              Compra Gratta e Vinci
            </button>
          </div>
        </div>
      )}

      {/* Sports betting */}
      {sub === 'scommesse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Puntate: €5–€5.000 · Quote random 1.5x–4x · 45% win rate
          </p>
          {SPORTS.map(sport => {
            const bet = sportBet[sport.id] ?? 10
            return (
              <div key={sport.id} className="card">
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{sport.emoji} {sport.name}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number" min={5} max={Math.min(5000, finance.money)}
                    value={bet}
                    onChange={e => setSportBet(prev => ({ ...prev, [sport.id]: Math.max(5, Math.min(5000, Number(e.target.value))) }))}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)', fontSize: 13 }}
                  />
                  <button
                    className="tap-scale"
                    onClick={() => { const r = placeSportsBet(sport.id, bet); setLastMsg(r.message) }}
                    disabled={finance.money < 5}
                    style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#059669', color: '#fff', opacity: finance.money < 5 ? 0.5 : 1 }}>
                    Scommetti
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
