import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { VEHICLE_DEFS, type VehicleCategory } from '../../services/VehicleEngine'

const CAT_LABELS: Record<VehicleCategory, string> = {
  economy: '🚗 Economy',
  medium:  '🚙 Media',
  luxury:  '🚘 Lusso',
  supercar:'🏎️ Supercar',
  moto:    '🏍️ Moto',
}

const CAT_COLORS: Record<VehicleCategory, string> = {
  economy:  '#60a5fa',
  medium:   '#a78bfa',
  luxury:   '#fbbf24',
  supercar: '#ef4444',
  moto:     '#34d399',
}

export function VehicleScreen() {
  const {
    vehicle, finance, time, stats,
    studyDrivingTheory, takeTheoryExam, takePracticalExam, buyVehicle,
  } = useGameStore()

  const [feedback, setFeedback] = useState('')
  const [tab, setTab] = useState<'license' | 'vehicles' | 'owned'>('license')

  const act = (fn: () => { success: boolean; message: string }) => {
    const r = fn()
    setFeedback(r.message)
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback && (
        <div className="card" style={{ padding: 10, fontSize: 13, background: 'rgba(14,165,233,0.1)', borderColor: 'rgba(14,165,233,0.3)' }}>
          {feedback}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {([['license', '🪪 Patente'], ['vehicles', '🚗 Acquista'], ['owned', '🔑 Tuoi Veicoli']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 11, border: 'none', cursor: 'pointer',
            background: tab === id ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
            color: tab === id ? '#fff' : 'var(--color-text-secondary)',
          }}>{label}</button>
        ))}
      </div>

      {/* PATENTE */}
      {tab === 'license' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card" style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>🪪 Percorso Patente B</p>

            {/* Step 1: studio teoria */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500 }}>1. Studio Codice della Strada</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{vehicle.studyHours}/30 ore · €100 / sessione</p>
              </div>
              <button
                className={vehicle.hasLicenseB || vehicle.theoryPassed || vehicle.studyHours >= 30 || time.age < 16 ? 'btn-secondary' : 'btn-primary'}
                style={{ fontSize: 11, padding: '5px 10px' }}
                disabled={vehicle.hasLicenseB || vehicle.theoryPassed || vehicle.studyHours >= 30 || time.age < 16}
                onClick={() => act(studyDrivingTheory)}
              >
                {vehicle.hasLicenseB ? '✓ Patente' : vehicle.theoryPassed ? '✓ Passata' : vehicle.studyHours >= 30 ? 'Pronto!' : 'Studia'}
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ margin: '6px 0 10px', background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${(vehicle.studyHours / 30) * 100}%`, height: '100%', background: 'var(--color-positive)', borderRadius: 4 }} />
            </div>

            {/* Step 2: esame teoria */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500 }}>2. Esame di Teoria</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>€120 · Pass rate ~65%</p>
              </div>
              <button
                className={vehicle.hasLicenseB || vehicle.theoryPassed || time.age < 16 ? 'btn-secondary' : 'btn-primary'}
                style={{ fontSize: 11, padding: '5px 10px' }}
                disabled={vehicle.hasLicenseB || vehicle.theoryPassed || time.age < 16}
                onClick={() => act(takeTheoryExam)}
              >
                {vehicle.theoryPassed ? '✓ Passato' : 'Sostieni'}
              </button>
            </div>

            {/* Step 3: esame pratico */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500 }}>3. Esame Pratico</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>€250 · Pass rate ~55% · Min 18 anni</p>
              </div>
              <button
                className={!vehicle.theoryPassed || vehicle.hasLicenseB || time.age < 18 ? 'btn-secondary' : 'btn-primary'}
                style={{ fontSize: 11, padding: '5px 10px' }}
                disabled={!vehicle.theoryPassed || vehicle.hasLicenseB || time.age < 18}
                onClick={() => act(takePracticalExam)}
              >
                {vehicle.hasLicenseB ? '✓ Patente' : 'Sostieni'}
              </button>
            </div>
          </div>

          {vehicle.hasLicenseB && (
            <div className="card" style={{ padding: 12, background: 'rgba(15,155,88,0.1)', borderColor: 'rgba(15,155,88,0.3)', textAlign: 'center' }}>
              <p style={{ fontSize: 20 }}>🪪</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>Patente B Ottenuta!</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Punti: {vehicle.licensePoints}/20</p>
            </div>
          )}

          {/* Violations */}
          {vehicle.violations.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Infrazioni ({vehicle.violations.length})
              </p>
              {vehicle.violations.slice(-5).reverse().map((v, i) => (
                <div key={i} style={{ padding: '6px 8px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🚨 {v.type} ({v.year})</span>
                  <span style={{ color: '#ef4444' }}>-€{v.fine} {v.pointsLost > 0 && `/ -${v.pointsLost}pt`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACQUISTA VEICOLO */}
      {tab === 'vehicles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!vehicle.hasLicenseB && (
            <div className="card" style={{ padding: 10, background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)', fontSize: 12, textAlign: 'center' }}>
              ⚠️ Ottieni prima la Patente B per acquistare veicoli.
            </div>
          )}
          {VEHICLE_DEFS.map(def => {
            const canAfford = finance.money >= def.price
            const hasLicense = vehicle.hasLicenseB
            const ageOk = time.age >= def.minAge
            const disabled = !canAfford || !hasLicense || !ageOk

            return (
              <div key={def.id} className="card" style={{ padding: '12px 14px', opacity: disabled ? 0.55 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 22 }}>{def.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 8 }}>{def.name}</span>
                    <span style={{ fontSize: 10, marginLeft: 8, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: CAT_COLORS[def.category] }}>
                      {CAT_LABELS[def.category]}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: canAfford ? '#4ade80' : '#ef4444' }}>
                    €{def.price.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 10, color: 'var(--color-text-secondary)' }}>
                    🛡️ Ass. €{def.annualInsurance.toLocaleString()}/anno
                  </span>
                  <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 10, color: 'var(--color-text-secondary)' }}>
                    🔧 Man. €{def.annualMaintenance.toLocaleString()}/anno
                  </span>
                  {def.minAge > 18 && (
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 10, color: '#fbbf24' }}>
                      Min {def.minAge} anni
                    </span>
                  )}
                </div>
                <button
                  className={disabled ? 'btn-secondary' : 'btn-primary'}
                  style={{ width: '100%', padding: '7px 0', fontSize: 12 }}
                  disabled={disabled}
                  onClick={() => act(() => buyVehicle(def.id))}
                >
                  {!hasLicense ? 'Serve Patente B' : !ageOk ? `Min ${def.minAge} anni` : !canAfford ? `Servono €${def.price.toLocaleString()}` : `Acquista ${def.emoji}`}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* VEICOLI POSSEDUTI */}
      {tab === 'owned' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vehicle.ownedVehicles.length === 0 ? (
            <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
              🚗 Non possiedi ancora nessun veicolo.
            </div>
          ) : (
            vehicle.ownedVehicles.map(v => {
              const depreciation = Math.round((1 - v.currentValue / v.purchasePrice) * 100)
              return (
                <div key={v.id} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }}>{v.emoji}</span>
                    <div style={{ flex: 1, marginLeft: 10 }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{v.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Acquistato nel {v.purchaseYear}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>€{v.currentValue.toLocaleString()}</p>
                      <p style={{ fontSize: 10, color: '#ef4444' }}>-{depreciation}% valore</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    <span>🛡️ €{v.annualInsurance}/anno</span>
                    <span>🔧 €{v.annualMaintenance}/anno</span>
                    <span>💸 Tot. €{(v.annualInsurance + v.annualMaintenance).toLocaleString()}/anno</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
