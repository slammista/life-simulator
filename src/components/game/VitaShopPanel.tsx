import { useState, useEffect } from 'react'
import { CloudSaveService } from '../../services/CloudSaveService'
import { useWalletStore } from '../../store/walletStore'
import { useGameStore } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { AudioEngine } from '../../services/AudioEngine'

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
  { id: 'accessory_crown',   name: 'Corona Reale',          cost: 100, emoji: '👑', category: 'Accessori' },
  { id: 'outfit_knight',     name: 'Armatura da Cavaliere', cost: 150, emoji: '⚔️', category: 'Vestiti' },
  { id: 'vehicle_ferrari',   name: 'Ferrari Rossa',         cost: 250, emoji: '🚗', category: 'Veicoli' },
  { id: 'home_villa',        name: 'Villa sul Mare',        cost: 500, emoji: '🏰', category: 'Abitazioni' },
  { id: 'divine_wings',      name: 'Ali Divine',            cost: 800, emoji: '🪽', category: 'Divini' },
  // Vita Scenarios (unlock at new game creation)
  { id: 'scenario_rich',      name: 'Nato Privilegiato',    cost: 150, emoji: '💰', category: 'Scenari' },
  { id: 'scenario_poor',      name: 'Vita Difficile',       cost: 50,  emoji: '🏚️', category: 'Scenari' },
  { id: 'scenario_prodigy',   name: 'Prodigio',             cost: 200, emoji: '🎓', category: 'Scenari' },
  { id: 'scenario_celebrity', name: 'Figlio di Famosi',     cost: 300, emoji: '🎬', category: 'Scenari' },
  { id: 'scenario_athlete',   name: 'Atleta Nato',          cost: 200, emoji: '🏆', category: 'Scenari' },
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
  const showAlert = useToastStore(s => s.showAlert)
  const setMessage = (m: { text: string; ok: boolean }) => showAlert(m.text, m.ok)
  const isConfigured = CloudSaveService.isConfigured()

  const gems = useWalletStore(s => s.gems)
  const owns = useWalletStore(s => s.owns)
  const isEquipped = useWalletStore(s => s.isEquipped)
  const buyCosmetic = useWalletStore(s => s.buyCosmetic)
  const toggleEquip = useWalletStore(s => s.toggleEquip)
  const syncWithServer = useWalletStore(s => s.syncWithServer)
  const godModeUnlocked = useGameStore(s => s.settings.godModeUnlocked)
  const unlockGodMode = useGameStore(s => s.unlockGodMode)
  const hasGodMode = useWalletStore(s => s.hasGodMode)

  // Hydrate authoritative wallet/entitlements on open
  useEffect(() => { syncWithServer() }, [syncWithServer])

  // Mirror the server-side God Mode entitlement into in-game settings
  useEffect(() => {
    if (hasGodMode && !godModeUnlocked) unlockGodMode()
  }, [hasGodMode, godModeUnlocked, unlockGodMode])

  const tabs: { id: ShopTab; label: string; emoji: string }[] = [
    { id: 'gems',    label: 'Gemme',    emoji: '💎' },
    { id: 'items',   label: 'Oggetti',  emoji: '🎭' },
    { id: 'bundles', label: 'Bundle',   emoji: '🎁' },
    { id: 'godmode', label: 'God Mode', emoji: '⚡' },
  ]

  // Spend gems on a cosmetic (client optimistic; server validates on sync)
  function handleGemPurchase(id: string, cost: number) {
    const res = buyCosmetic(id, cost)
    if (res.ok) {
      AudioEngine.playSFX('purchase')
      setMessage({ text: 'Oggetto sbloccato! Equipaggialo quando vuoi.', ok: true })
    } else {
      setMessage({ text: res.error ?? 'Acquisto non riuscito', ok: false })
    }
  }

  async function handleBuy(productId: string) {
    if (!isConfigured) {
      setMessage({ text: 'Servizio non disponibile. Controlla le variabili d\'ambiente Vercel (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).', ok: false })
      return
    }
    const user = await CloudSaveService.getCurrentUser()
    if (!user) {
      setMessage({ text: '🔐 Devi accedere al tuo account per acquistare. Vai su Account (in alto a destra).', ok: false })
      return
    }
    setPurchasing(productId)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
      const res = await fetch(`${supabaseUrl}/functions/v1/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20,
          background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)' }}>
          <span style={{ fontSize: 15 }}>💎</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>{gems.toLocaleString('it-IT')}</span>
        </div>
      </div>

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
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <div style={{ fontSize: 16 }}>{t.emoji}</div>
            <div>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Gem Packs */}
      {tab === 'gems' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GEM_PACKS.map(pack => (
            <div key={pack.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{pack.emoji}</div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 14, whiteSpace: 'nowrap' }}>{pack.label}</span>
                {pack.badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap',
                    background: pack.badge === 'Popolare' ? 'rgba(251,191,36,0.2)' : 'rgba(16,185,129,0.2)',
                    color: pack.badge === 'Popolare' ? '#fbbf24' : '#6ee7b7',
                  }}>{pack.badge}</span>
                )}
              </div>
              <button
                onClick={() => handleBuyGems(pack.id)}
                disabled={purchasing === pack.id}
                className="btn-candy btn-candy--primary"
                style={{ fontSize: 14, padding: '8px 16px', width: 'auto', flexShrink: 0 }}
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

      {/* Rare Items — purchased with gems */}
      {tab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RARE_ITEMS.map(item => {
            const owned = owns(item.id)
            const equipped = isEquipped(item.id)
            return (
              <div key={item.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28, lineHeight: 1 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{item.category}</div>
                </div>
                {owned ? (
                  <button
                    onClick={() => toggleEquip(item.id)}
                    className={`btn-candy ${equipped ? 'btn-candy--positive' : 'btn-candy--neutral'}`}
                    style={{ fontSize: 13, padding: '7px 14px' }}
                  >
                    {equipped ? '✓ Equipaggiato' : 'Equipaggia'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: gems >= item.cost ? '#a78bfa' : '#64748b' }}>💎 {item.cost}</span>
                    <button
                      onClick={() => handleGemPurchase(item.id, item.cost)}
                      disabled={gems < item.cost}
                      className="btn-candy btn-candy--primary"
                      style={{ fontSize: 13, padding: '7px 14px', opacity: gems < item.cost ? 0.5 : 1 }}
                    >
                      Acquista
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 4 }}>
            Gli oggetti cosmetici si pagano in gemme e non influenzano il gameplay. Guadagna gemme nei Rewards 🎁
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
            {godModeUnlocked ? (
              <div style={{
                textAlign: 'center', padding: '12px 0', fontSize: 15, fontWeight: 700,
                color: '#6ee7b7',
              }}>
                ✓ God Mode attivo — apri l'editor in Nuova Partita
              </div>
            ) : (
              <button
                onClick={() => handleBuyGems('god_mode')}
                disabled={purchasing === 'god_mode'}
                className="btn-candy btn-candy--primary"
                style={{ width: '100%', fontSize: 16, padding: '12px 0', fontWeight: 800 }}
              >
                {purchasing === 'god_mode' ? 'Apertura checkout…' : '⚡ Acquista God Mode — €5.99'}
              </button>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            Acquisto una-tantum, valido su tutti i dispositivi con lo stesso account.
          </p>
        </div>
      )}
    </div>
  )
}
