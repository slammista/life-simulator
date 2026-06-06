import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { TATTOO_DEFS, PIERCING_DEFS, BodyModEngine } from '../../services/BodyModEngine'

export default function BodyModScreen() {
  const { bodyMods, finance, time, getTattoo, getPiercing, removeTattoo } = useGameStore()
  const state = useGameStore()
  const [tab, setTab] = useState<'tuoi' | 'tatuaggi' | 'piercing'>('tuoi')
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const act = (fn: () => { success: boolean; message: string }) => {
    const r = fn()
    setFeedback({ msg: r.message, ok: r.success })
    setTimeout(() => setFeedback(null), 4000)
  }

  const reputationMod = BodyModEngine.getReputationModifier(state)

  const stigmaBar = (val: number) => '🔴'.repeat(val) + '⚪'.repeat(5 - val)
  const painBar = (val: number) => '💢'.repeat(Math.round(val / 2)) + '⚪'.repeat(5 - Math.round(val / 2))

  return (
    <div className="screen-content">
      <h2 className="section-title">🎨 Body Mods</h2>

      {feedback && (
        <div className={`feedback-banner ${feedback.ok ? 'success' : 'error'}`}>
          {feedback.msg}
        </div>
      )}

      {/* Impatto reputazione */}
      {reputationMod !== 0 && (
        <div className="card warning-card">
          <p>⚠️ I tuoi body mod riducono la reputazione professionale: <strong>{reputationMod}</strong></p>
        </div>
      )}

      <div className="sub-tabs">
        {(['tuoi', 'tatuaggi', 'piercing'] as const).map(t => (
          <button key={t} className={`sub-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'tuoi' ? `🧍 I miei (${bodyMods.items.length})` : t === 'tatuaggi' ? '🎨 Tatuaggi' : '💎 Piercing'}
          </button>
        ))}
      </div>

      {tab === 'tuoi' && (
        <div>
          {bodyMods.items.length === 0 ? (
            <div className="card empty-state">
              <p>Non hai ancora body mod. Esplora i tatuaggi e i piercing!</p>
            </div>
          ) : (
            bodyMods.items.map(item => (
              <div key={item.id} className="card body-mod-card">
                <div className="mod-header">
                  <span className="mod-emoji">{item.emoji}</span>
                  <div>
                    <h3 className="mod-name">{item.name}</h3>
                    <p className="mod-location">📍 {item.location} · Anno {item.yearDone}</p>
                  </div>
                  <span className={`visibility-badge ${item.visibility}`}>
                    {item.visibility === 'hidden' ? '🙈 Nascosto' : item.visibility === 'partial' ? '👀 Parziale' : '👁️ Visibile'}
                  </span>
                </div>
                <div className="mod-meta">
                  <span>Stigma: {stigmaBar(item.professionalStigma)}</span>
                  <span>Dolore: {painBar(item.painLevel)}</span>
                  <span>Costo: €{item.cost.toLocaleString()}</span>
                </div>
                {item.type === 'tattoo' && (
                  <button
                    className="action-btn small danger"
                    onClick={() => act(() => removeTattoo(item.id))}
                    disabled={finance.money < item.cost * 1.5}
                    title={`Rimozione laser: €${Math.round(item.cost * 1.5).toLocaleString()}`}
                  >
                    🔬 Rimuovi laser (€{Math.round(item.cost * 1.5).toLocaleString()})
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'tatuaggi' && (
        <div>
          <div className="card info-card">
            <p>💰 Saldo: €{finance.money.toLocaleString()} · Età min: 18 anni</p>
          </div>
          <div className="mods-grid">
            {TATTOO_DEFS.map(def => {
              const owned = bodyMods.items.some(m => m.type === 'tattoo' && m.name === def.name)
              return (
                <div key={def.id} className={`card mod-catalog-card ${owned ? 'owned' : ''}`}>
                  <div className="mod-catalog-header">
                    <span className="mod-emoji">{def.emoji}</span>
                    <h3 className="mod-catalog-name">{def.name}</h3>
                  </div>
                  <div className="mod-catalog-meta">
                    <p>📍 {def.location}</p>
                    <p>💰 €{def.cost.toLocaleString()}</p>
                    <p>Stigma: {stigmaBar(def.professionalStigma)}</p>
                    <p>Dolore: {painBar(def.painLevel)}</p>
                    <p>{def.visibility === 'hidden' ? '🙈 Nascosto' : def.visibility === 'partial' ? '👀 Parziale' : '👁️ Visibile'}</p>
                  </div>
                  {owned ? (
                    <div className="owned-badge">✅ Già tatuato</div>
                  ) : (
                    <button
                      className="action-btn"
                      onClick={() => act(() => getTattoo(def.id))}
                      disabled={time.age < 18 || finance.money < def.cost}
                    >
                      Tatuati
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'piercing' && (
        <div>
          <div className="card info-card">
            <p>💰 Saldo: €{finance.money.toLocaleString()} · Età min: 16 anni</p>
          </div>
          <div className="mods-grid">
            {PIERCING_DEFS.map(def => {
              const count = bodyMods.items.filter(m => m.type === 'piercing' && m.name === def.name).length
              const maxed = count >= 2
              return (
                <div key={def.id} className={`card mod-catalog-card ${maxed ? 'owned' : ''}`}>
                  <div className="mod-catalog-header">
                    <span className="mod-emoji">{def.emoji}</span>
                    <h3 className="mod-catalog-name">{def.name}</h3>
                  </div>
                  <div className="mod-catalog-meta">
                    <p>📍 {def.area}</p>
                    <p>💰 €{def.cost}</p>
                    <p>Guarigione: {def.healingWeeks}w</p>
                    <p>Dolore: {painBar(def.painLevel)}</p>
                    {count > 0 && <p>Hai: {count}/2</p>}
                  </div>
                  {maxed ? (
                    <div className="owned-badge">✅ Max raggiunto</div>
                  ) : (
                    <button
                      className="action-btn"
                      onClick={() => act(() => getPiercing(def.id))}
                      disabled={time.age < 16 || finance.money < def.cost}
                    >
                      Fallo
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
