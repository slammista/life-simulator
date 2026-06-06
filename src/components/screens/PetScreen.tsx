import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { PetEngine, PET_DEFS, type PetSpecies, type AdoptMethod } from '../../services/PetEngine'

const SPECIES_LABELS: Record<PetSpecies, string> = {
  dog: '🐕 Cane', cat: '🐱 Gatto', rabbit: '🐰 Coniglio', bird: '🦜 Uccello', fish: '🐠 Pesce', horse: '🐴 Cavallo',
}

export function PetScreen() {
  const { pets, finance, time, adoptPet, careForPet, vetVisit } = useGameStore()
  const [feedback, setFeedback] = useState('')
  const [selectedDef, setSelectedDef] = useState(PET_DEFS[0].id)
  const [adoptMethod, setAdoptMethod] = useState<AdoptMethod>('adopt')

  const alivePets = pets.filter(p => p.isAlive)
  const deadPets = pets.filter(p => !p.isAlive)

  const handleAdopt = () => {
    const r = adoptPet(selectedDef, adoptMethod)
    setFeedback(r.message)
  }
  const handleCare = (petId: string) => {
    const r = careForPet(petId)
    setFeedback(r.message)
  }
  const handleVet = (petId: string) => {
    const r = vetVisit(petId)
    setFeedback(r.message)
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback && (
        <div className="card" style={{ padding: 10, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', fontSize: 13 }}>
          {feedback}
        </div>
      )}

      {/* I miei animali */}
      {alivePets.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            I Miei Animali ({alivePets.length}/5)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alivePets.map(pet => {
              const def = PET_DEFS.find(d => d.species === pet.species && d.breed === pet.breed)
              return (
                <div key={pet.id} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 20 }}>{def?.emoji ?? '🐾'}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 6 }}>{pet.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 6 }}>{pet.breed} · {pet.age} anni</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>€{pet.costMaintenance}/mese</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                    {[
                      { label: 'Salute', value: pet.health, color: pet.health > 60 ? '#22c55e' : '#ef4444' },
                      { label: 'Felicità', value: pet.happiness, color: '#60a5fa' },
                      { label: 'Legame', value: pet.bondLevel, color: '#f472b6' },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{s.label}</span>
                          <span style={{ fontSize: 10, color: s.color }}>{s.value}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" style={{ flex: 1, padding: '7px 0', fontSize: 12 }} onClick={() => handleCare(pet.id)}>
                      🐾 Cura
                    </button>
                    <button className="btn-secondary" style={{ flex: 1, padding: '7px 0', fontSize: 12 }} onClick={() => handleVet(pet.id)}>
                      🏥 Veterinario
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Adotta */}
      {alivePets.length < 5 && time.age >= 18 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Adotta / Acquista
          </p>
          <div className="card" style={{ padding: '12px 14px' }}>
            {/* Method toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {(['adopt', 'buy'] as AdoptMethod[]).map(m => (
                <button
                  key={m}
                  onClick={() => setAdoptMethod(m)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer',
                    background: adoptMethod === m ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
                    color: adoptMethod === m ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  {m === 'adopt' ? '🏠 Canile (gratis)' : '🛒 Acquista'}
                </button>
              ))}
            </div>

            {/* Pet selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto', marginBottom: 10 }}>
              {PET_DEFS.map(def => {
                const cost = adoptMethod === 'adopt' ? def.adoptionCost : def.purchaseCost
                const canAfford = finance.money >= cost + def.monthlyCost
                return (
                  <label
                    key={def.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: canAfford ? 1 : 0.4 }}
                  >
                    <input
                      type="radio" name="petdef"
                      checked={selectedDef === def.id}
                      onChange={() => setSelectedDef(def.id)}
                      disabled={!canAfford}
                    />
                    <span style={{ fontSize: 20 }}>{def.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{def.breed}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                        {SPECIES_LABELS[def.species]} · Acquisto: €{cost} · Manutenzione: €{def.monthlyCost}/mese
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '8px 0', fontSize: 13 }} onClick={handleAdopt}>
              {adoptMethod === 'adopt' ? '🐾 Adotta' : '🛒 Acquista'} {PET_DEFS.find(d => d.id === selectedDef)?.breed}
            </button>
          </div>
        </div>
      )}

      {time.age < 18 && (
        <div className="card" style={{ padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Devi avere 18 anni per adottare un animale domestico.
          </p>
        </div>
      )}

      {/* Animali deceduti */}
      {deadPets.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            In memoria 🌈
          </p>
          {deadPets.map(pet => {
            const def = PET_DEFS.find(d => d.species === pet.species && d.breed === pet.breed)
            return (
              <div key={pet.id} style={{ padding: '6px 10px', fontSize: 12, color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                {def?.emoji} {pet.name} ({pet.breed}) · vissuto {pet.age} anni
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
