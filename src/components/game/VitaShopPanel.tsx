import { useState } from 'react'
import { CloudSaveService } from '../../services/CloudSaveService'

interface Props {
  onBack: () => void
}

type ShopTab = 'gems' | 'items' | 'bundles' | 'godmode'

const GEM_PACKS = [
  { id: 'gem_pack_100',  gems: 100,  price: '€0.99',  emoji: '💎',  label: '100 Gemme',  badge: null },
  { id: 'gem_pack_350',  gems: 350,  price: '€2.99',  emoji: '💎💎', label: '350 Gemme',  badge: '+17%' },
  { id: 'gem_pack_500',  gems: 500,  price: '€3.99',  emoji: '💎💎💎', label: '500 Gemme', badge: 'Popolare' },
  { id: 'gem_pack_1000', gems: 1000, price: '€6.99',  emoji: '🏆',  label: '1000 Gemme', badge: '+43%' },
  { id: 'no_ads',        gems: 0,    price: '€2.99',  emoji: '🚫',  label: 'No Pubblicità', badge: null },
] as const

const RARE_ITEMS = [
  { id: 'accessory_crown',   name: 'Corona Reale',     cost: 100, emoji: '👑', category: 'Accessori' },
  { id: 'outfit_knight',     name: 'Armatura da Cavaliere', cost: 150, emoji: '⚔️', category: 'Vestiti' },
  { id: 'vehicle_ferrari',   name: 'Ferrari Rossa',    cost: 250, emoji: '🚗', category: 'Veicoli' },
  { id: 'home_villa',        name: 'Villa sul Mare',   cost: 500, emoji: '🏰', category: 'Abitazioni' },
  { id: 'divine_wings',      name: 'Ali Divine',       cost: 800, emoji: '🪽', category: 'Divini' },
] as const

const BUNDLES = [
  {
    id: 'bundle_starter',
    name: 'Bundle Principiante',
    description: '100 gemme + Corona Reale',
    price: '€1.49',
    emoji: '🎒',
    items: ['💎 100', '👑 Corona'],
  },
  {
    id: 'bundle_premium',
    name: 'Bundle Premium',
    description: '500 gemme + 3 oggetti rari',
    price: '€5.99',
    emoji: '🎁',
    items: ['💎 500', '⚔️ Armatura', '🚗 Ferrari', '🏰 Villa'],
    badge: 'Più Venduto',
  },
] as const

export function VitaShopPanel({ onBack }: Props) {
  const [tab, setTab] = useState<ShopTab>('gems')
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const isConfigured = CloudSaveService.isConfigured()

  const tabs: { id: ShopTab; label: string; emoji: string }[] = [
    { id: 'gems',    label: 'Gemme',    emoji: '💎' },
    { id: 'items',   label: 'Oggetti',  emoji: '🎭' },
    { id: 'bundles', label: 'Bundle',   emoji: '🎁' },
    { id: 'godmode', label: 'God Mode', emoji: '⚡' },
  ]

  async function handleBuy(productId: string) {
    if (!isConfigured) {
      setMessage({ text: 'Servizio non configurato. Connettiti prima.', ok: false })
      return
    }
    const user = await CloudSaveService.getCurrentUser()
    if (!user) {
      setMessage({ text: 'Accedi al tuo account per acquistare.', ok: false })
      return
    }
    setPurchasing(productId)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${supabaseUrl}/functions/v1/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, product_type: productId }),
      })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      } else {
        setMessage({ text: data.error ?? 'Errore checkout', ok: false })
      }
    } catch {
      setMessage({ text: 'Errore di connessione. Riprova.', ok: false })
    } finally {
      setPurchasing(null)
    }
  }

  function handleBuyGems(id: string) { handleBuy(id) }

  return (
    <div style={{ padding: '16px 12px', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={onBack}
          className="icon-btn"
          style={{ width: 36, height: 36, flexShrink: 0 }}
          aria-label="Torna indietro"
        >
          ‹
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#fff' }}>🛒 Shop</h2>
      </div>

      {/* Message */}
      {message && (
        <div
          className="card"
          style={{
            padding: '10px 14px', marginBottom: 12,
            background: message.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: message.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, color: message.ok ? '#6ee7b7' : '#fca5a5' }}>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}
          >✕</button>
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16,
        background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
              borderRadius: 10, fontSize: 11, fontWeight: 600,
              background: tab === t.id ? 'var(--section-accent)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 16 }}>{t.emoji}</div>
            <div>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Gem Packs */}
      {tab === 'gems' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GEM_PACKS.map(pack => (
            <div key={pack.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{pack.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{pack.label}</span>
                  {pack.badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                      background: pack.badge === 'Popolare' ? 'rgba(251,191,36,0.2)' : 'rgba(16,185,129,0.2)',
                      color: pack.badge === 'Popolare' ? '#fbbf24' : '#6ee7b7',
                    }}>{pack.badge}</span>
                  )}
                </div>
                {pack.gems > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {pack.gems} gemme da usare nello shop
                  </div>
                )}
              </div>
              <button
                onClick={() => handleBuyGems(pack.id)}
                disabled={purchasing === pack.id}
                className="btn-candy btn-candy--primary"
                style={{ fontSize: 14, padding: '8px 16px', flexShrink: 0 }}
              >
                {purchasing === pack.id ? '…' : pack.price}
              </button>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 4 }}>
            Acquisti sicuri via Stripe. Non necessitano di account.
          </p>
        </div>
      )}

      {/* Rare Items */}
      {tab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RARE_ITEMS.map(item => (
            <div key={item.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>{item.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{item.category}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>💎 {item.cost}</span>
                <button
                  onClick={() => handleBuyGems(item.id)}
                  disabled={purchasing === item.id}
                  className="btn-candy btn-candy--primary"
                  style={{ fontSize: 13, padding: '7px 14px' }}
                >
                  {purchasing === item.id ? '…' : 'Acquista'}
                </button>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 4 }}>
            Gli oggetti cosmetici non influenzano il gameplay.
          </p>
        </div>
      )}

      {/* Bundles */}
      {tab === 'bundles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BUNDLES.map(bundle => (
            <div key={bundle.id} className="card" style={{ padding: '16px 16px', position: 'relative', overflow: 'hidden' }}>
              {'badge' in bundle && bundle.badge && (
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '4px 12px 4px 8px', borderBottomLeftRadius: 10,
                }}>{bundle.badge}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 32, lineHeight: 1 }}>{bundle.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 4 }}>{bundle.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{bundle.description}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {bundle.items.map((item, i) => (
                      <span key={i} style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 20,
                        background: 'rgba(167,139,250,0.15)', color: '#c4b5fd',
                      }}>{item}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleBuyGems(bundle.id)}
                  disabled={purchasing === bundle.id}
                  className="btn-candy btn-candy--primary"
                  style={{ fontSize: 15, padding: '10px 28px' }}
                >
                  {purchasing === bundle.id ? '…' : bundle.price}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* God Mode */}
      {tab === 'godmode' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{
            padding: '20px 18px',
            background: 'linear-gradient(160deg, rgba(124,58,237,0.3) 0%, rgba(16,185,129,0.1) 100%)',
            borderColor: 'rgba(167,139,250,0.4)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#c4b5fd', margin: 0 }}>God Mode</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Il controllo totale sulla tua vita
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { emoji: '🧬', text: 'Editor NPC — modifica relazioni e personalità' },
                { emoji: '✏️', text: 'Character Editor — attributi iniziali liberi' },
                { emoji: '📊', text: 'Stats illimitate — override immediato' },
                { emoji: '🛡️', text: 'Vestito da Dio — gli NPC non ti attaccano' },
                { emoji: '✨', text: 'Effetti particellari esclusivi' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{f.emoji}</span>
                  <span style={{ fontSize: 13, color: '#e2e8f0' }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleBuyGems('god_mode')}
              disabled={purchasing === 'god_mode'}
              className="btn-candy btn-candy--primary"
              style={{ width: '100%', fontSize: 16, padding: '12px 0', fontWeight: 800 }}
            >
              {purchasing === 'god_mode' ? 'Apertura checkout…' : '⚡ Acquista God Mode — €5.99'}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            Acquisto una-tantum, valido su tutti i dispositivi con lo stesso account.
          </p>
        </div>
      )}
    </div>
  )
}
