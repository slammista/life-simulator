interface Props {
  onBack: () => void
}

export function VitaShopPanel({ onBack }: Props) {
  return (
    <div style={{ padding: '16px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600,
          }}
        >
          ‹
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#fff' }}>🛒 Shop</h2>
      </div>

      <div className="card" style={{ padding: '16px 14px', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text)' }}>
          Welcome to the Shop! Here you can purchase gems, unlock premium features, and get cosmetic items.
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
          (Coming soon: Gem packs, rare items, bundles, no-ads, and God Mode)
        </p>
      </div>
    </div>
  )
}
