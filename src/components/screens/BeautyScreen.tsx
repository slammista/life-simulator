import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LUXURY_ITEMS, BeautyEngine } from '../../services/BeautyEngine'
import type { HairStyle, NailsStyle, WardrobeTier, SkincareLevel } from '../../services/BeautyEngine'
import { getAccessoryShop } from '../../services/AvatarEngine'
import { AvatarRenderer } from '../avatar/AvatarRenderer'

type BeautyTab = 'capelli' | 'unghie' | 'guardaroba' | 'skincare' | 'lusso' | 'accessori'

export default function BeautyScreen() {
  const store = useGameStore()
  const { beauty, finance, time, getHaircut, doNails, upgradeWardrobe, doSkincare, getBotox, getLaserHairRemoval, buyLuxuryItem, buyAccessory, removeAccessory } = store
  const [tab, setTab] = useState<BeautyTab>('capelli')
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  const act = (fn: () => { success: boolean; message: string }) => {
    const r = fn()
    setFeedback({ msg: r.message, ok: r.success })
    setTimeout(() => setFeedback(null), 3500)
  }

  const totalLooks = BeautyEngine.getTotalLooksBonus(store)
  const accessories = getAccessoryShop()
  const currentAccessory = store.identity.avatar?.accessory ?? 'none'

  const hairStyles: Array<{ id: HairStyle; name: string; emoji: string; cost: number }> = [
    { id: 'basic',   name: 'Taglio base',       emoji: '✂️', cost: 45  },
    { id: 'styled',  name: 'Taglio + styling',  emoji: '💈', cost: 80  },
    { id: 'colored', name: 'Colorazione',       emoji: '🎨', cost: 200 },
    { id: 'premium', name: 'Balayage/Premium',  emoji: '✨', cost: 450 },
  ]

  const nailStyles: Array<{ id: NailsStyle; name: string; emoji: string; cost: number }> = [
    { id: 'basic',    name: 'Manicure base',  emoji: '💅', cost: 35  },
    { id: 'gel',      name: 'Gel nails',      emoji: '💎', cost: 60  },
    { id: 'acrylic',  name: 'Acrylic nails',  emoji: '💅', cost: 75  },
    { id: 'nail_art', name: 'Nail art',       emoji: '🌸', cost: 100 },
  ]

  const wardrobeTiers: Array<{ id: WardrobeTier; name: string; emoji: string; cost: number; looks: number; rep: number }> = [
    { id: 'economy',      name: 'Economy (Zara/H&M)',   emoji: '🛍️', cost: 1000,   looks: 5,  rep: 2  },
    { id: 'medium',       name: 'Medium (Gap/COS)',     emoji: '👔', cost: 4000,   looks: 10, rep: 5  },
    { id: 'luxury',       name: 'Lusso (Gucci/Prada)',  emoji: '👑', cost: 20000,  looks: 18, rep: 12 },
    { id: 'ultra_luxury', name: 'Ultra Lusso (Hermès)', emoji: '💎', cost: 100000, looks: 25, rep: 20 },
  ]

  const skincareOptions: Array<{ id: SkincareLevel; name: string; emoji: string; cost: number }> = [
    { id: 'basic',    name: 'Routine base',                             emoji: '🧴', cost: 200  },
    { id: 'advanced', name: 'Advanced skincare',                        emoji: '✨', cost: 600  },
    { id: 'clinical', name: 'Trattamenti clinici (botox, peeling)',     emoji: '💉', cost: 2000 },
  ]

  const TABS: { id: BeautyTab; label: string }[] = [
    { id: 'capelli',    label: '✂️ Capelli' },
    { id: 'unghie',     label: '💅 Unghie' },
    { id: 'guardaroba', label: '👗 Guardaroba' },
    { id: 'skincare',   label: '🧴 Skincare' },
    { id: 'accessori',  label: '🕶️ Accessori' },
    { id: 'lusso',      label: '💎 Lusso' },
  ]

  const cardStyle = {
    borderRadius: 14, padding: 12, marginBottom: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  }

  const btnStyle = (active: boolean, disabled = false) => ({
    flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 500,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    background: active ? 'rgba(124,92,255,0.25)' : disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
    color: active ? '#a78bfa' : disabled ? 'var(--color-text-secondary)' : 'var(--color-text)',
    outline: active ? '1px solid rgba(124,92,255,0.5)' : 'none',
    opacity: disabled ? 0.6 : 1,
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 14, paddingBottom: 96 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>💄 Beauty & Cura Personale</h2>

      {/* Avatar preview strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...cardStyle, marginBottom: 12 }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(124,92,255,0.3)' }}>
          <AvatarRenderer size="md" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Il tuo look</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            ✨ Bonus aspetto beauty: <strong style={{ color: '#FFB020' }}>+{totalLooks}</strong>
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            👗 Guardaroba: <strong>{beauty.wardrobeTier === 'none' ? '—' : beauty.wardrobeTier}</strong>
          </p>
          {currentAccessory !== 'none' && (
            <p style={{ fontSize: 11, color: '#a78bfa' }}>
              🕶️ {accessories.find(a => a.id === currentAccessory)?.name ?? currentAccessory}
            </p>
          )}
        </div>
      </div>

      {feedback && (
        <div style={{
          borderRadius: 12, padding: '10px 14px', marginBottom: 10, fontSize: 13, fontWeight: 500,
          background: feedback.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: feedback.ok ? '#86efac' : '#fca5a5',
          border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 12 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500,
              whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0,
              background: tab === t.id ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
              color: tab === t.id ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Capelli ── */}
      {tab === 'capelli' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...cardStyle, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Stile attuale: <strong style={{ color: 'var(--color-text)' }}>{beauty.hairStyle === 'none' ? '—' : beauty.hairStyle}</strong>
            {' · '}Aggiornato: {beauty.hairLastUpdatedYear > 0 ? `Anno ${beauty.hairLastUpdatedYear}` : 'mai'}
          </div>
          {hairStyles.map(h => {
            const canAfford = finance.money >= h.cost
            const isCurrent = beauty.hairStyle === h.id
            return (
              <div key={h.id} style={{ ...cardStyle, opacity: canAfford || isCurrent ? 1 : 0.65 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{h.emoji} {h.name}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: canAfford ? '#4ade80' : '#ef4444' }}>€{h.cost}</span>
                </div>
                {isCurrent
                  ? <div style={{ textAlign: 'center', fontSize: 12, color: '#86efac' }}>✅ Stile attuale</div>
                  : <button className="tap-scale" style={btnStyle(false, !canAfford)} disabled={!canAfford} onClick={() => act(() => getHaircut(h.id))}>
                      {canAfford ? 'Scegli' : `Servono €${h.cost}`}
                    </button>
                }
              </div>
            )
          })}
          <div style={cardStyle}>
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>⚡ Depilazione Laser (Permanente)</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Costo: €2.500 · ciclo completo</p>
            {beauty.hasLaserHairRemoval
              ? <div style={{ textAlign: 'center', fontSize: 12, color: '#86efac' }}>✅ Già effettuata</div>
              : <button className="tap-scale" style={btnStyle(false, finance.money < 2500)} disabled={finance.money < 2500} onClick={() => act(getLaserHairRemoval)}>Prenota</button>
            }
          </div>
        </div>
      )}

      {/* ── Unghie ── */}
      {tab === 'unghie' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...cardStyle, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Stile attuale: <strong style={{ color: 'var(--color-text)' }}>{beauty.nailsStyle === 'none' ? '—' : beauty.nailsStyle}</strong>
          </div>
          {nailStyles.map(n => {
            const canAfford = finance.money >= n.cost
            const isCurrent = beauty.nailsStyle === n.id
            return (
              <div key={n.id} style={{ ...cardStyle, opacity: canAfford || isCurrent ? 1 : 0.65 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{n.emoji} {n.name}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: canAfford ? '#4ade80' : '#ef4444' }}>€{n.cost}</span>
                </div>
                {isCurrent
                  ? <div style={{ textAlign: 'center', fontSize: 12, color: '#86efac' }}>✅ Stile attuale</div>
                  : <button className="tap-scale" style={btnStyle(false, !canAfford)} disabled={!canAfford} onClick={() => act(() => doNails(n.id))}>
                      {canAfford ? 'Scegli' : `Servono €${n.cost}`}
                    </button>
                }
              </div>
            )
          })}
        </div>
      )}

      {/* ── Guardaroba ── */}
      {tab === 'guardaroba' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...cardStyle, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Tier attuale: <strong style={{ color: 'var(--color-text)' }}>{beauty.wardrobeTier === 'none' ? '—' : beauty.wardrobeTier}</strong>
            {' · '}L&apos;outfit si aggiorna automaticamente sull&apos;avatar.
          </div>
          {wardrobeTiers.map(w => {
            const tiers: WardrobeTier[] = ['none', 'economy', 'medium', 'luxury', 'ultra_luxury']
            const isOwned = tiers.indexOf(beauty.wardrobeTier) >= tiers.indexOf(w.id)
            const canAfford = finance.money >= w.cost
            return (
              <div key={w.id} style={{ ...cardStyle, opacity: isOwned || canAfford ? 1 : 0.65 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{w.emoji} {w.name}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: canAfford || isOwned ? '#4ade80' : '#ef4444' }}>
                    €{w.cost.toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                  👁️ +{w.looks} aspetto · +{w.rep} reputazione
                </p>
                {isOwned
                  ? <div style={{ textAlign: 'center', fontSize: 12, color: '#86efac' }}>✅ Posseduto</div>
                  : <button className="tap-scale" style={btnStyle(false, !canAfford)} disabled={!canAfford} onClick={() => act(() => upgradeWardrobe(w.id))}>
                      {canAfford ? 'Acquista' : `Servono €${w.cost.toLocaleString()}`}
                    </button>
                }
              </div>
            )
          })}
        </div>
      )}

      {/* ── Skincare ── */}
      {tab === 'skincare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...cardStyle, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Routine attuale: <strong style={{ color: 'var(--color-text)' }}>{beauty.skincareLevel === 'none' ? '—' : beauty.skincareLevel}</strong>
          </div>
          {skincareOptions.map(s => {
            const canAfford = finance.money >= s.cost
            const isCurrent = beauty.skincareLevel === s.id
            return (
              <div key={s.id} style={{ ...cardStyle, opacity: canAfford || isCurrent ? 1 : 0.65 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{s.emoji} {s.name}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: canAfford ? '#4ade80' : '#ef4444' }}>€{s.cost.toLocaleString()}/anno</span>
                </div>
                {isCurrent
                  ? <div style={{ textAlign: 'center', fontSize: 12, color: '#86efac' }}>✅ Attiva</div>
                  : <button className="tap-scale" style={btnStyle(false, !canAfford)} disabled={!canAfford} onClick={() => act(() => doSkincare(s.id))}>
                      {canAfford ? 'Attiva' : `Servono €${s.cost.toLocaleString()}`}
                    </button>
                }
              </div>
            )
          })}
          <div style={cardStyle}>
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>💉 Botox (Età 30+)</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              €450/sessione · {beauty.botoxSessions}/10 sessioni
            </p>
            <button
              className="tap-scale"
              style={btnStyle(false, time.age < 30 || finance.money < 450 || beauty.botoxSessions >= 10)}
              disabled={time.age < 30 || finance.money < 450 || beauty.botoxSessions >= 10}
              onClick={() => act(getBotox)}
            >
              {time.age < 30 ? 'Disponibile dai 30 anni' : beauty.botoxSessions >= 10 ? 'Max sessioni raggiunte' : 'Prenota sessione'}
            </button>
          </div>
        </div>
      )}

      {/* ── Accessori ── */}
      {tab === 'accessori' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...cardStyle, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Accessorio attivo: <strong style={{ color: currentAccessory !== 'none' ? '#a78bfa' : 'var(--color-text)' }}>
              {currentAccessory !== 'none' ? (accessories.find(a => a.id === currentAccessory)?.name ?? currentAccessory) : 'Nessuno'}
            </strong>
          </div>
          {currentAccessory !== 'none' && (
            <button
              className="tap-scale"
              onClick={() => { removeAccessory(); setFeedback({ msg: 'Accessorio rimosso.', ok: true }) }}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 500,
                background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer',
              }}
            >
              🗑️ Rimuovi accessorio attuale
            </button>
          )}
          {accessories.map(item => {
            const canAfford = finance.money >= item.cost
            const isActive = currentAccessory === item.id
            return (
              <div key={item.id} style={{ ...cardStyle, opacity: isActive || canAfford ? 1 : 0.65 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{item.emoji} {item.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{item.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: canAfford || isActive ? '#4ade80' : '#ef4444' }}>€{item.cost}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>+{item.looksBonus} 😍</p>
                  </div>
                </div>
                {isActive
                  ? <div style={{ textAlign: 'center', fontSize: 12, color: '#86efac' }}>✅ Indossato</div>
                  : <button className="tap-scale" style={btnStyle(false, !canAfford)} disabled={!canAfford} onClick={() => act(() => buyAccessory(item.id))}>
                      {canAfford ? `Acquista e indossa (€${item.cost})` : `Servono €${item.cost}`}
                    </button>
                }
              </div>
            )
          })}
        </div>
      )}

      {/* ── Lusso ── */}
      {tab === 'lusso' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...cardStyle, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Accessori posseduti: {beauty.luxuryItems.length}
          </div>
          {LUXURY_ITEMS.map(item => {
            const owned = beauty.luxuryItems.some(i => i.id === item.id)
            const canAfford = finance.money >= item.value
            return (
              <div key={item.id} style={{ ...cardStyle, opacity: owned || canAfford ? 1 : 0.65 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{item.emoji} {item.name}</p>
                    <p style={{ fontSize: 11, color: '#a78bfa', marginTop: 1 }}>{item.brand}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: canAfford || owned ? '#4ade80' : '#ef4444' }}>€{item.value.toLocaleString()}</p>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                  👁️ +{item.looksBonus} aspetto · 🌟 +{item.reputationBonus} rep
                </p>
                {owned
                  ? <div style={{ textAlign: 'center', fontSize: 12, color: '#86efac' }}>✅ Posseduto</div>
                  : <button className="tap-scale" style={btnStyle(false, !canAfford)} disabled={!canAfford} onClick={() => act(() => buyLuxuryItem(item.id))}>
                      {canAfford ? 'Acquista' : `Servono €${item.value.toLocaleString()}`}
                    </button>
                }
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
