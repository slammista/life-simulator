import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LUXURY_ITEMS, BeautyEngine } from '../../services/BeautyEngine'
import type { HairStyle, NailsStyle, WardrobeTier, SkincareLevel } from '../../services/BeautyEngine'

export default function BeautyScreen() {
  const store = useGameStore()
  const { beauty, finance, time, getHaircut, doNails, upgradeWardrobe, doSkincare, getBotox, getLaserHairRemoval, buyLuxuryItem } = store
  const [tab, setTab] = useState<'capelli' | 'unghie' | 'guardaroba' | 'skincare' | 'lusso'>('capelli')
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const act = (fn: () => { success: boolean; message: string }) => {
    const r = fn()
    setFeedback({ msg: r.message, ok: r.success })
    setTimeout(() => setFeedback(null), 3500)
  }

  const totalLooks = BeautyEngine.getTotalLooksBonus(store)

  const hairStyles: Array<{ id: HairStyle; name: string; emoji: string; cost: number }> = [
    { id: 'basic',   name: 'Taglio base',       emoji: '✂️', cost: 45  },
    { id: 'styled',  name: 'Taglio + styling',  emoji: '💈', cost: 80  },
    { id: 'colored', name: 'Colorazione',       emoji: '🎨', cost: 200 },
    { id: 'premium', name: 'Balayage/Premium',  emoji: '✨', cost: 450 },
  ]

  const nailStyles: Array<{ id: NailsStyle; name: string; emoji: string; cost: number }> = [
    { id: 'basic',    name: 'Manicure base', emoji: '💅', cost: 35  },
    { id: 'gel',      name: 'Gel nails',    emoji: '💎', cost: 60  },
    { id: 'acrylic',  name: 'Acrylic nails', emoji: '💅', cost: 75  },
    { id: 'nail_art', name: 'Nail art',     emoji: '🌸', cost: 100 },
  ]

  const wardrobeTiers: Array<{ id: WardrobeTier; name: string; emoji: string; cost: number; looks: number; rep: number }> = [
    { id: 'economy',      name: 'Economy (Zara/H&M)',    emoji: '🛍️', cost: 1000,   looks: 5,  rep: 2  },
    { id: 'medium',       name: 'Medium (Gap/COS)',      emoji: '👔', cost: 4000,   looks: 10, rep: 5  },
    { id: 'luxury',       name: 'Lusso (Gucci/Prada)',   emoji: '👑', cost: 20000,  looks: 18, rep: 12 },
    { id: 'ultra_luxury', name: 'Ultra Lusso (Hermès)',  emoji: '💎', cost: 100000, looks: 25, rep: 20 },
  ]

  const skincareOptions: Array<{ id: SkincareLevel; name: string; emoji: string; cost: number }> = [
    { id: 'basic',    name: 'Routine base',      emoji: '🧴', cost: 200  },
    { id: 'advanced', name: 'Advanced skincare', emoji: '✨', cost: 600  },
    { id: 'clinical', name: 'Trattamenti clinici (botox, peeling)', emoji: '💉', cost: 2000 },
  ]

  return (
    <div className="screen-content">
      <h2 className="section-title">💄 Beauty & Cura Personale</h2>

      {feedback && (
        <div className={`feedback-banner ${feedback.ok ? 'success' : 'error'}`}>
          {feedback.msg}
        </div>
      )}

      {/* Stats summary */}
      <div className="card">
        <div className="stats-row">
          <div className="stat-badge">✨ +Aspetto beauty: <strong>+{totalLooks}</strong></div>
          <div className="stat-badge">👗 Guardaroba: <strong>{beauty.wardrobeTier === 'none' ? 'Nessuno' : beauty.wardrobeTier}</strong></div>
          <div className="stat-badge">💰 Saldo: <strong>€{finance.money.toLocaleString()}</strong></div>
        </div>
      </div>

      <div className="sub-tabs">
        {(['capelli', 'unghie', 'guardaroba', 'skincare', 'lusso'] as const).map(t => (
          <button key={t} className={`sub-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'capelli' ? '✂️ Capelli' : t === 'unghie' ? '💅 Unghie' : t === 'guardaroba' ? '👗 Guardaroba' : t === 'skincare' ? '🧴 Skincare' : '💎 Lusso'}
          </button>
        ))}
      </div>

      {tab === 'capelli' && (
        <div>
          <div className="card info-card">
            <p>Stile attuale: <strong>{beauty.hairStyle === 'none' ? 'Nessuno' : beauty.hairStyle}</strong></p>
            <p>Ultimo aggiornamento: {beauty.hairLastUpdatedYear > 0 ? `Anno ${beauty.hairLastUpdatedYear}` : 'Mai'}</p>
          </div>
          <div className="mods-grid">
            {hairStyles.map(h => (
              <div key={h.id} className={`card mod-catalog-card ${beauty.hairStyle === h.id ? 'owned' : ''}`}>
                <div className="mod-catalog-header">
                  <span className="mod-emoji">{h.emoji}</span>
                  <h3 className="mod-catalog-name">{h.name}</h3>
                </div>
                <p>💰 €{h.cost}</p>
                {beauty.hairStyle === h.id
                  ? <div className="owned-badge">✅ Stile attuale</div>
                  : <button className="action-btn" disabled={finance.money < h.cost} onClick={() => act(() => getHaircut(h.id))}>Scegli</button>
                }
              </div>
            ))}
          </div>
          {/* Laser hair removal */}
          <div className="card">
            <h3 className="card-title">⚡ Depilazione Laser (Permanente)</h3>
            <p className="card-subtitle">Costo: €2.500 totale (ciclo completo)</p>
            {beauty.hasLaserHairRemoval
              ? <div className="owned-badge">✅ Già effettuata</div>
              : <button className="action-btn" disabled={finance.money < 2500} onClick={() => act(getLaserHairRemoval)}>Prenota</button>
            }
          </div>
        </div>
      )}

      {tab === 'unghie' && (
        <div>
          <div className="card info-card">
            <p>Stile attuale: <strong>{beauty.nailsStyle === 'none' ? 'Nessuno' : beauty.nailsStyle}</strong></p>
          </div>
          <div className="mods-grid">
            {nailStyles.map(n => (
              <div key={n.id} className={`card mod-catalog-card ${beauty.nailsStyle === n.id ? 'owned' : ''}`}>
                <div className="mod-catalog-header">
                  <span className="mod-emoji">{n.emoji}</span>
                  <h3 className="mod-catalog-name">{n.name}</h3>
                </div>
                <p>💰 €{n.cost}</p>
                {beauty.nailsStyle === n.id
                  ? <div className="owned-badge">✅ Stile attuale</div>
                  : <button className="action-btn" disabled={finance.money < n.cost} onClick={() => act(() => doNails(n.id))}>Scegli</button>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'guardaroba' && (
        <div>
          <div className="card info-card">
            <p>Tier attuale: <strong>{beauty.wardrobeTier === 'none' ? 'Nessuno' : beauty.wardrobeTier}</strong></p>
          </div>
          <div className="mods-grid">
            {wardrobeTiers.map(w => {
              const tiers: WardrobeTier[] = ['none', 'economy', 'medium', 'luxury', 'ultra_luxury']
              const isOwned = tiers.indexOf(beauty.wardrobeTier) >= tiers.indexOf(w.id)
              return (
                <div key={w.id} className={`card mod-catalog-card ${isOwned ? 'owned' : ''}`}>
                  <div className="mod-catalog-header">
                    <span className="mod-emoji">{w.emoji}</span>
                    <h3 className="mod-catalog-name">{w.name}</h3>
                  </div>
                  <p>💰 €{w.cost.toLocaleString()}</p>
                  <p>👁️ +{w.looks} aspetto · +{w.rep} reputazione</p>
                  {isOwned
                    ? <div className="owned-badge">✅ Posseduto</div>
                    : <button className="action-btn" disabled={finance.money < w.cost} onClick={() => act(() => upgradeWardrobe(w.id))}>Acquista</button>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'skincare' && (
        <div>
          <div className="card info-card">
            <p>Routine attuale: <strong>{beauty.skincareLevel === 'none' ? 'Nessuna' : beauty.skincareLevel}</strong></p>
          </div>
          <div className="mods-grid">
            {skincareOptions.map(s => (
              <div key={s.id} className={`card mod-catalog-card ${beauty.skincareLevel === s.id ? 'owned' : ''}`}>
                <div className="mod-catalog-header">
                  <span className="mod-emoji">{s.emoji}</span>
                  <h3 className="mod-catalog-name">{s.name}</h3>
                </div>
                <p>💰 €{s.cost.toLocaleString()}/anno</p>
                {beauty.skincareLevel === s.id
                  ? <div className="owned-badge">✅ Attiva</div>
                  : <button className="action-btn" disabled={finance.money < s.cost} onClick={() => act(() => doSkincare(s.id))}>Attiva</button>
                }
              </div>
            ))}
          </div>
          {/* Botox */}
          <div className="card">
            <h3 className="card-title">💉 Botox (Età 30+)</h3>
            <p className="card-subtitle">€450/sessione · Max 10 sessioni · Sessioni: {beauty.botoxSessions}/10</p>
            <button
              className="action-btn"
              disabled={time.age < 30 || finance.money < 450 || beauty.botoxSessions >= 10}
              onClick={() => act(getBotox)}
            >
              Prenota sessione
            </button>
          </div>
        </div>
      )}

      {tab === 'lusso' && (
        <div>
          <div className="card info-card">
            <p>Accessori posseduti: {beauty.luxuryItems.length}</p>
          </div>
          <div className="mods-grid">
            {LUXURY_ITEMS.map(item => {
              const owned = beauty.luxuryItems.some(i => i.id === item.id)
              return (
                <div key={item.id} className={`card mod-catalog-card ${owned ? 'owned' : ''}`}>
                  <div className="mod-catalog-header">
                    <span className="mod-emoji">{item.emoji}</span>
                    <h3 className="mod-catalog-name">{item.name}</h3>
                  </div>
                  <p className="brand-tag">{item.brand}</p>
                  <p>💰 €{item.value.toLocaleString()}</p>
                  <p>👁️ +{item.looksBonus} aspetto · 🌟 +{item.reputationBonus} rep</p>
                  {owned
                    ? <div className="owned-badge">✅ Posseduto</div>
                    : <button className="action-btn" disabled={finance.money < item.value} onClick={() => act(() => buyLuxuryItem(item.id))}>Acquista</button>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
