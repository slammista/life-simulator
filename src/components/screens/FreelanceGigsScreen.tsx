import { useGameStore } from '../../store/gameStore'
import { useToastStore } from '../../store/toastStore'
import { feedback } from '../../services/FeedbackEngine'

interface GigDef {
  id: string
  label: string
  location: string
  emoji: string
  earnMin: number
  earnMax: number
  energyCost: number
  minAge: number
}

const GIGS: GigDef[] = [
  { id: 'tutor_gig',       label: 'Tutor Privato',        location: 'Casa dello studente', emoji: '📖', earnMin: 40,  earnMax: 120, energyCost: 20, minAge: 15 },
  { id: 'handyman',        label: 'Tuttofare',             location: 'Quartiere',           emoji: '🔧', earnMin: 50,  earnMax: 150, energyCost: 25, minAge: 16 },
  { id: 'caretaker',       label: 'Badante Occasionale',   location: 'Famiglia',            emoji: '🧓', earnMin: 35,  earnMax: 90,  energyCost: 20, minAge: 18 },
  { id: 'lawn_mower',      label: 'Taglia Erba',           location: 'Giardini privati',    emoji: '🌿', earnMin: 25,  earnMax: 70,  energyCost: 20, minAge: 12 },
  { id: 'babysitter_gig',  label: 'Babysitter',            location: 'Famiglia',            emoji: '👶', earnMin: 30,  earnMax: 80,  energyCost: 15, minAge: 13 },
  { id: 'dog_walker',      label: 'Dog Sitter',            location: 'Quartiere',           emoji: '🐕', earnMin: 20,  earnMax: 60,  energyCost: 10, minAge: 12 },
  { id: 'pet_sitter',      label: 'Pet Sitter',            location: 'Casa cliente',        emoji: '🐈', earnMin: 25,  earnMax: 70,  energyCost: 10, minAge: 12 },
  { id: 'car_wash',        label: 'Lavaggio Auto',         location: 'Parcheggio',          emoji: '🚗', earnMin: 20,  earnMax: 50,  energyCost: 15, minAge: 14 },
  { id: 'grocery_shopper', label: 'Spesa a Domicilio',     location: 'Supermercato',        emoji: '🛒', earnMin: 15,  earnMax: 40,  energyCost: 10, minAge: 14 },
  { id: 'delivery_gig',    label: 'Consegna a Domicilio',  location: 'Pizzeria/Ristorante', emoji: '📦', earnMin: 30,  earnMax: 80,  energyCost: 15, minAge: 16 },
]

function formatEarn(min: number, max: number, mult: number): string {
  const lo = Math.round(min * mult)
  const hi = Math.round(max * mult)
  return `€${lo}–€${hi}`
}

export function FreelanceGigsScreen() {
  const age = useGameStore(s => s.time.age)
  const energy = useGameStore(s => s.stats.energy)
  const costMult = useGameStore(s => s.nation?.costOfLiving ?? 1)
  const diminishingReturns = useGameStore(s => s.diminishingReturns)
  const year = useGameStore(s => s.time.year)
  const performFreelanceGig = useGameStore(s => s.performFreelanceGig)
  const showPanel = useToastStore(s => s.showPanel)
  const closePanel = useToastStore(s => s.closePanel)

  const flash = (msg: string, ok: boolean, emoji: string, effects: Record<string, number> = {}) => {
    feedback(ok ? 'success' : 'error')
    showPanel({ title: msg, emoji: ok ? emoji : '❌', ok, effects })
    setTimeout(() => closePanel(), 3000)
  }

  const doGig = (gig: GigDef) => {
    const r = performFreelanceGig(gig.id)
    flash(r.message, r.success, gig.emoji, r.effects as Record<string, number>)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Fai un lavoretto veloce per guadagnare subito. Ogni lavoretto consuma energia ma ti dà denaro immediato.
        </p>
      </div>

      {GIGS.map(gig => {
        const available = age >= gig.minAge && energy >= gig.energyCost
        const tooYoung = age < gig.minAge
        const noEnergy = energy < gig.energyCost
        const timesThisYear = diminishingReturns[`gig_${gig.id}_${year}`] ?? 0

        return (
          <div key={gig.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            opacity: available ? 1 : 0.45,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 13, flexShrink: 0,
              background: available ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${available ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>
              {gig.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>{gig.label}</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{gig.location}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#86efac' }}>
                  {formatEarn(gig.earnMin, gig.earnMax, costMult)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>⚡ -{gig.energyCost}</span>
                {timesThisYear > 0 && (
                  <span style={{ fontSize: 10, color: '#fcd34d' }}>×{timesThisYear} oggi</span>
                )}
              </div>
              {tooYoung && <p style={{ fontSize: 10, color: '#f97316', marginTop: 3 }}>Richiede {gig.minAge}+ anni</p>}
              {noEnergy && !tooYoung && <p style={{ fontSize: 10, color: '#f97316', marginTop: 3 }}>Energia insufficiente</p>}
            </div>
            {available ? (
              <button
                onClick={() => doGig(gig)}
                className="tap-scale"
                style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 3px 10px rgba(6,182,212,0.3)',
                }}
              >
                Fai
              </button>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 15, flexShrink: 0 }}>···</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
