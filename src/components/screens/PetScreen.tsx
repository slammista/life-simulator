import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { PET_DEFS, type PetSpecies, type AdoptMethod } from '../../services/PetEngine'
import { PetBattleEngine, deriveBattleStats } from '../../services/PetBattleEngine'
import type { Pet } from '../../store/types'

const MIN_AGE_PET = 6

const SPECIES_LABELS: Record<PetSpecies, string> = {
  dog: '🐕 Cane', cat: '🐱 Gatto', rabbit: '🐰 Coniglio', bird: '🦜 Uccello', fish: '🐠 Pesce', horse: '🐴 Cavallo',
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af', uncommon: '#10b981', rare: '#3b82f6', legendary: '#f59e0b',
}
const RARITY_LABELS: Record<string, string> = {
  common: '⭐ Comune', uncommon: '⭐⭐ Non comune', rare: '⭐⭐⭐ Raro', legendary: '⭐⭐⭐⭐ Leggendario',
}

function PetCard({ pet, onFeedback }: { pet: Pet; onFeedback: (msg: string) => void }) {
  const [tab, setTab] = useState<'stats' | 'battle' | 'breed'>('stats')
  const [breedTarget, setBreedTarget] = useState<string>('')
  const { careForPet, vetVisit, petBattle, petBreed, pets } = useGameStore(useShallow(s => ({
    careForPet: s.careForPet,
    vetVisit: s.vetVisit,
    petBattle: s.petBattle,
    petBreed: s.petBreed,
    pets: s.pets,
  })))

  const def = PET_DEFS.find(d => d.breed === pet.breed)
  const bStats = deriveBattleStats(pet)
  const battleCheck = PetBattleEngine.canBattle(pet, useGameStore.getState())
  const compatibleMates = pets.filter(p => p.id !== pet.id && p.isAlive && p.species === pet.species && p.species !== 'fish')

  function handle(fn: () => ReturnType<typeof careForPet>) {
    const r = fn()
    onFeedback(r.message)
  }

  const rarity = pet.rarity ?? 'common'
  const wins = pet.battleWins ?? 0
  const losses = pet.battleLosses ?? 0

  return (
    <div className="card" style={{ padding: '12px 14px', marginBottom: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 22 }}>{def?.emoji ?? '🐾'}</span>
          <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 6 }}>{pet.name}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 6 }}>{pet.breed} · {pet.age} anni</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: RARITY_COLORS[rarity], fontWeight: 600 }}>{RARITY_LABELS[rarity]}</p>
          <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>€{pet.costMaintenance}/mese</p>
        </div>
      </div>

      {/* Stat bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
        {[
          { label: 'Salute',   value: pet.health,    color: pet.health > 60 ? '#22c55e' : '#ef4444' },
          { label: 'Felicità', value: pet.happiness,  color: '#60a5fa' },
          { label: 'Legame',   value: pet.bondLevel,  color: '#f472b6' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{s.label}</span>
              <span style={{ fontSize: 10, color: s.color }}>{Math.round(s.value)}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['stats', 'battle', 'breed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '4px 0', borderRadius: 16, fontSize: 11, border: 'none', cursor: 'pointer',
            background: tab === t ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
            color: tab === t ? '#fff' : 'var(--color-text-secondary)',
          }}>
            {t === 'stats' ? '🐾 Cura' : t === 'battle' ? '⚔️ Battaglia' : '🍼 Riproduzione'}
          </button>
        ))}
      </div>

      {/* Care tab */}
      {tab === 'stats' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1, padding: '7px 0', fontSize: 12 }} onClick={() => handle(() => careForPet(pet.id))}>
            🐾 Cura
          </button>
          <button className="btn-secondary" style={{ flex: 1, padding: '7px 0', fontSize: 12 }} onClick={() => handle(() => vetVisit(pet.id))}>
            🏥 Veterinario
          </button>
        </div>
      )}

      {/* Battle tab */}
      {tab === 'battle' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'ATK', val: bStats.attack, color: '#ef4444' },
              { label: 'DEF', val: bStats.defense, color: '#3b82f6' },
              { label: 'SPD', val: bStats.speed,   color: '#10b981' },
              { label: 'HP',  val: bStats.hp,      color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 4px' }}>
                <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{s.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            Record: <span style={{ color: '#10b981' }}>{wins}V</span> / <span style={{ color: '#ef4444' }}>{losses}S</span>
          </p>

          {battleCheck.ok
            ? <button onClick={() => handle(() => petBattle(pet.id))} style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: '#ef4444', color: '#fff' }}>
                ⚔️ Combatti (avversario casuale)
              </button>
            : <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>{battleCheck.reason}</p>
          }
        </div>
      )}

      {/* Breed tab */}
      {tab === 'breed' && (
        <div>
          {compatibleMates.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
              Nessun partner compatibile. Adotta un altro {pet.species}.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Scegli il partner per la riproduzione:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {compatibleMates.map(mate => {
                  const mateDef = PET_DEFS.find(d => d.breed === mate.breed)
                  return (
                    <label key={mate.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="radio" name={`breed-${pet.id}`} value={mate.id} checked={breedTarget === mate.id} onChange={() => setBreedTarget(mate.id)} />
                      <span>{mateDef?.emoji ?? '🐾'}</span>
                      <span style={{ fontSize: 12 }}>{mate.name}</span>
                      <span style={{ fontSize: 10, color: RARITY_COLORS[mate.rarity ?? 'common'] }}>
                        {RARITY_LABELS[mate.rarity ?? 'common']}
                      </span>
                    </label>
                  )
                })}
              </div>
              <button
                onClick={() => { if (breedTarget) handle(() => petBreed(pet.id, breedTarget)) }}
                disabled={!breedTarget}
                style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 13, border: 'none', cursor: breedTarget ? 'pointer' : 'not-allowed', background: breedTarget ? '#f472b6' : 'rgba(255,255,255,0.07)', color: '#fff', opacity: breedTarget ? 1 : 0.5 }}>
                🍼 Riproduci
              </button>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Il cucciolo eredita stats e rarità dai genitori. 5% di chance di rarità superiore!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function PetScreen() {
  const { pets, finance, time, relationships, adoptPet } = useGameStore(useShallow(s => ({
    pets: s.pets,
    finance: s.finance,
    time: s.time,
    relationships: s.relationships,
    adoptPet: s.adoptPet,
  })))
  const showAlert = useToastStore(s => s.showAlert)
  const [feedback, setFeedback] = useState('')
  const [selectedDef, setSelectedDef] = useState(PET_DEFS[0].id)
  const [adoptMethod, setAdoptMethod] = useState<AdoptMethod>('adopt')
  // Minors must get parental consent before adopting (asked once per visit)
  const [parentConsent, setParentConsent] = useState(false)

  const alivePets = pets.filter(p => p.isAlive)
  const deadPets = pets.filter(p => !p.isAlive)
  const isMinor = time.age < 18
  const livingParents = relationships.filter(r => r.type === 'parent' && r.isAlive)
  const canAdopt = !isMinor || parentConsent

  const handleAdopt = () => {
    const r = adoptPet(selectedDef, adoptMethod)
    setFeedback(r.message)
  }

  const handleAskParents = () => {
    if (livingParents.length === 0) {
      showAlert('Non hai genitori a cui chiedere il permesso.', false, '🐾')
      return
    }
    // Chance scales with the best parent relationship (trust + love)
    const best = Math.max(...livingParents.map(p => (p.trust + p.love) / 2))
    const chance = 0.45 + (best / 100) * 0.45
    if (Math.random() < chance) {
      setParentConsent(true)
      showAlert('I tuoi genitori sono d\'accordo! Ora puoi scegliere un animale. 🐾', true, '🥰')
    } else {
      showAlert('I tuoi genitori hanno detto di no per ora. Riprova quando crescerai o migliora il rapporto con loro.', false, '🙅')
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
      {feedback && (
        <div className="card" style={{ padding: 10, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', fontSize: 13, marginBottom: 10 }}>
          {feedback}
        </div>
      )}

      {/* Animali vivi */}
      {alivePets.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            I Miei Animali ({alivePets.length}/5)
          </p>
          {alivePets.map(pet => (
            <PetCard key={pet.id} pet={pet} onFeedback={setFeedback} />
          ))}
        </div>
      )}

      {/* Adotta */}
      {alivePets.length < 5 && time.age >= MIN_AGE_PET && canAdopt && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Adotta / Acquista{isMinor ? ' (con permesso dei genitori)' : ''}
          </p>
          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {(['adopt', 'buy'] as AdoptMethod[]).map(m => (
                <button key={m} onClick={() => setAdoptMethod(m)} style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, border: 'none', cursor: 'pointer',
                  background: adoptMethod === m ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
                  color: adoptMethod === m ? '#fff' : 'var(--color-text-secondary)',
                }}>
                  {m === 'adopt' ? '🏠 Canile (gratis)' : '🛒 Acquista'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto', marginBottom: 10 }}>
              {PET_DEFS.map(def => {
                const cost = adoptMethod === 'adopt' ? def.adoptionCost : def.purchaseCost
                const canAfford = finance.money >= cost + def.monthlyCost
                return (
                  <label key={def.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', opacity: canAfford ? 1 : 0.4 }}>
                    <input type="radio" name="petdef" checked={selectedDef === def.id} onChange={() => setSelectedDef(def.id)} disabled={!canAfford} />
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

      {/* Too young entirely */}
      {time.age < MIN_AGE_PET && alivePets.length === 0 && (
        <div className="card card-locked" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🐾</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>Sei troppo piccolo</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Potrai prenderti cura di un animale dai {MIN_AGE_PET} anni in su.
          </p>
        </div>
      )}

      {/* Minor with no consent yet: ask parents */}
      {isMinor && time.age >= MIN_AGE_PET && !parentConsent && alivePets.length < 5 && (
        <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🐶</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>Vuoi un animale?</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            Sei minorenne: devi chiedere il permesso ai tuoi genitori prima di adottare o acquistare un animale.
          </p>
          <button
            className="btn-candy btn-candy--primary"
            style={{ width: '100%', fontSize: 14, padding: '11px 0', fontWeight: 700 }}
            onClick={handleAskParents}
            disabled={livingParents.length === 0}
          >
            🙏 Chiedi ai tuoi genitori
          </button>
          {livingParents.length === 0 && (
            <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 8 }}>
              Non hai genitori a cui chiedere.
            </p>
          )}
        </div>
      )}

      {/* In memoria */}
      {deadPets.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            In memoria 🌈
          </p>
          {deadPets.map(pet => {
            const def = PET_DEFS.find(d => d.breed === pet.breed)
            const wins = pet.battleWins ?? 0
            return (
              <div key={pet.id} style={{ padding: '6px 10px', fontSize: 12, color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                {def?.emoji} {pet.name} ({pet.breed}) · vissuto {pet.age} anni{wins > 0 ? ` · ${wins} vittorie` : ''}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
