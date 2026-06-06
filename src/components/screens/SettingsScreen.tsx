import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import db from '../../../public/db.json'

export function SettingsScreen() {
  const { settings, nation, identity, finance, time, cheatAddMoney, cheatSetMaxStats, cheatSetImmortal, cheatSkipToAge } = useGameStore()
  const [cheatMoneyAmt, setCheatMoneyAmt] = useState(10000)
  const [cheatAge, setCheatAge] = useState(time.age + 10)
  const [cheatMsg, setCheatMsg] = useState('')
  const [showCheatWarning, setShowCheatWarning] = useState(false)

  const runCheat = (fn: () => void, msg: string) => {
    fn()
    setCheatMsg(msg)
    setTimeout(() => setCheatMsg(''), 3000)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12, color: 'var(--color-text)' }}>⚙️ Info & Impostazioni</h2>

      {/* Nation info */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>Nazione</p>
        {nation && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16 }}>{nation.flag} {nation.name}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Tasse: {(nation.taxRate * 100).toFixed(0)}%</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Salario medio</p>
              <p style={{ fontSize: 14, color: '#10b981', fontWeight: 600 }}>€{nation.avgSalary.toLocaleString('it-IT')}/m</p>
            </div>
          </div>
        )}
      </div>

      {/* Character info */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 600 }}>Personaggio</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { label: 'Nome', val: `${identity.name} ${identity.surname}` },
            { label: 'Genere', val: identity.gender },
            { label: 'Nazionalità', val: identity.nationality },
            { label: 'Background', val: identity.familyBackground },
            { label: 'Religione', val: identity.religion },
            { label: 'Orientamento', val: identity.sexualOrientation },
          ].map(({ label, val }) => (
            <div key={label}>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 500 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Game mode */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 600 }}>Modalità di gioco</p>
        <p style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>
          {settings.mode === 'god' ? '⚡ Modalità Dio' :
           settings.mode === 'hard' ? '💀 Difficile' :
           settings.ironMan ? '🔒 Iron Man' :
           '🎮 Normale'}
        </p>
        {settings.ironMan && (
          <p style={{ fontSize: 12, color: 'var(--color-negative)', marginTop: 4 }}>
            ⚠️ Iron Man attivo — nessun salvataggio multiplo
          </p>
        )}
      </div>

      {/* Cheat system */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>⚡ Cheat System</p>
          <button onClick={() => setShowCheatWarning(!showCheatWarning)}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
            {showCheatWarning ? 'Nascondi' : 'Mostra'}
          </button>
        </div>

        {showCheatWarning && (
          <>
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#ef4444' }}>
                ⚠️ L'uso di cheat attiva la <strong>Modalità Dio</strong> e disabilita gli achievement. Non compatibile con la classifica globale.
              </p>
            </div>

            {cheatMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#818cf8' }}>{cheatMsg}</p>
              </div>
            )}

            {/* Add money */}
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Aggiungi denaro</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" min={1000} max={999999999} value={cheatMoneyAmt}
                  onChange={e => setCheatMoneyAmt(Number(e.target.value))}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)', fontSize: 13 }} />
                <button onClick={() => runCheat(() => cheatAddMoney(cheatMoneyAmt), `💰 +€${cheatMoneyAmt.toLocaleString()} aggiunti!`)}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#10b981', color: '#fff' }}>
                  +€
                </button>
              </div>
            </div>

            {/* Quick money amounts */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {[10000, 100000, 1000000].map(amt => (
                <button key={amt} onClick={() => runCheat(() => cheatAddMoney(amt), `💰 +€${amt.toLocaleString()} aggiunti!`)}
                  style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                  +€{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Max stats */}
            <button onClick={() => runCheat(cheatSetMaxStats, '⚡ Tutte le statistiche al massimo!')}
              style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#6366f1', color: '#fff', marginBottom: 8 }}>
              ⚡ Max Statistiche
            </button>

            {/* Immortal */}
            <button onClick={() => runCheat(cheatSetImmortal, '☠️ Salute al 100%!')}
              style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#7c3aed', color: '#fff', marginBottom: 8 }}>
              ☠️ Ripristina Salute
            </button>

            {/* Skip to age */}
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Salta all'età</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" min={time.age + 1} max={100} value={cheatAge}
                  onChange={e => setCheatAge(Number(e.target.value))}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text)', fontSize: 13 }} />
                <button onClick={() => {
                  if (cheatAge > time.age) {
                    runCheat(() => cheatSkipToAge(cheatAge), `⏩ Saltato a ${cheatAge} anni!`)
                  }
                }}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#f59e0b', color: '#fff' }}>
                  Salta
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {[18, 25, 40, 65].map(age => age > time.age && (
                  <button key={age} onClick={() => runCheat(() => cheatSkipToAge(age), `⏩ Saltato a ${age} anni!`)}
                    style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, border: 'none', cursor: 'pointer', background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                    {age} anni
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Version info */}
      <div className="card">
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 600 }}>App</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Life Simulator 2D v0.8.0</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          Stack: React 18 + TypeScript + Zustand + Vite
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          Nazioni: {db.nations.length} · Eventi: {db.events.length} · Engine attivi: 22
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          Saldo attuale: €{finance.money.toLocaleString()} · Anno: {time.year} · Età: {time.age}
        </p>
      </div>
    </div>
  )
}
