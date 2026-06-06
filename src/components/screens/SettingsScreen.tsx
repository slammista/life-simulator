import { useGameStore } from '../../store/gameStore'
import db from '../../../public/db.json'

export function SettingsScreen() {
  const { settings, nation, identity, stats, finance, time } = useGameStore()

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

      {/* Version info */}
      <div className="card">
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 600 }}>App</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Life Simulator 2D v0.1.0</p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          Stack: React 18 + TypeScript + Zustand + Vite + Tailwind CSS v4
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          Nazioni disponibili: {db.nations.length} · Eventi: {db.events.length}
        </p>
      </div>
    </div>
  )
}
