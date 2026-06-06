import { useGameStore } from '../../store/gameStore'
import { LegacyEngine } from '../../services/LegacyEngine'

const deathMessages: Record<string, { emoji: string; title: string; text: string }> = {
  natural:   { emoji: '🕊️',  title: 'Morte Naturale',       text: 'Hai vissuto una vita piena. Hai raggiunto la fine del tuo cammino in pace.' },
  disease:   { emoji: '🏥',  title: 'Malattia',             text: 'La tua salute si è deteriorata oltre il punto di non ritorno.' },
  suicide:   { emoji: '😔',  title: 'Crisi Mentale',        text: 'Il peso della mente è diventato insostenibile.' },
  accident:  { emoji: '🚗',  title: 'Incidente Stradale',   text: 'Un tragico incidente ha messo fine alla tua storia.' },
  overdose:  { emoji: '💊',  title: 'Overdose',             text: 'La dipendenza ti ha consumato.' },
  murder:    { emoji: '🔫',  title: 'Omicidio',             text: 'I tuoi nemici hanno avuto la meglio.' },
  execution: { emoji: '⚖️',  title: 'Esecuzione',           text: 'La giustizia ha pronunciato la sua sentenza finale.' },
  war:       { emoji: '⚔️',  title: 'Morte in Guerra',      text: 'Hai sacrificato la vita per il tuo paese. Onore al tuo servizio.' },
  disaster:  { emoji: '🌊',  title: 'Disastro Naturale',    text: 'Un evento catastrofico ha spezzato la tua storia.' },
}

const LEGACY_TIER_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  poor:      { label: 'Povera',     emoji: '⚫', color: '#666' },
  fair:      { label: 'Discreta',   emoji: '🥉', color: '#cd7f32' },
  good:      { label: 'Buona',      emoji: '🥈', color: '#aaa' },
  great:     { label: 'Grande',     emoji: '🥇', color: '#ffd700' },
  legendary: { label: 'Leggendaria', emoji: '💎', color: '#00e5ff' },
}

export function GameOverScreen() {
  const store = useGameStore()
  const { deathType, time, stats, finance, completedGoals, goals, newGame, identity, children, continueAsChild, legacy } = store

  const death = deathMessages[deathType ?? 'natural'] ?? deathMessages.natural
  const goalsCount = completedGoals.length
  const totalGoals = goals.length

  // Compute legacy score from current state (store may have it in legacy already)
  const legacyScore = legacy?.legacyScore != null
    ? { total: legacy.legacyScore, tier: LegacyEngine.calculateLegacyScore(store).tier, breakdown: LegacyEngine.calculateLegacyScore(store).breakdown }
    : LegacyEngine.calculateLegacyScore(store)
  const tierInfo = LEGACY_TIER_INFO[legacyScore.tier]

  const bestChild = LegacyEngine.getBestChild(store)

  const handleNewGame = () => {
    newGame({ ...identity, emoji: '👶' }, 'italy')
  }

  const handleContinue = () => {
    if (bestChild) continueAsChild(bestChild.id)
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: 24, overflowY: 'auto',
    }}>
      {/* Death info */}
      <div style={{ fontSize: 64, marginBottom: 12 }}>{death.emoji}</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>{death.title}</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: 20 }}>{death.text}</p>

      {/* Life stats */}
      <div className="card" style={{ width: '100%', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Statistiche di Vita
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Anni vissuti',      val: `${time.age}`,                                  emoji: '🎂' },
            { label: 'Anno morte',        val: `${time.year}`,                                  emoji: '📅' },
            { label: 'Denaro finale',     val: `€${finance.money.toLocaleString('it-IT')}`,      emoji: '💰' },
            { label: 'Goals completati',  val: `${goalsCount}/${totalGoals}`,                    emoji: '🎯' },
            { label: 'Salute finale',     val: `${Math.round(stats.health)}/100`,                emoji: '❤️' },
            { label: 'Felicità finale',   val: `${Math.round(stats.happiness)}/100`,             emoji: '😊' },
          ].map(({ label, val, emoji }) => (
            <div key={label} style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{emoji} {label}</p>
              <p style={{ fontWeight: 700, fontSize: 15 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Legacy score */}
      <div className="card" style={{ width: '100%', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Eredità Lasciata
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 32 }}>{tierInfo.emoji}</span>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: tierInfo.color }}>{legacyScore.total}/1000</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Legacy {tierInfo.label}</p>
          </div>
        </div>
        {/* Breakdown bars */}
        {Object.entries(legacyScore.breakdown).map(([key, val]) => {
          const maxes: Record<string, number> = { wealth: 200, family: 200, career: 150, achievements: 150, character: 150, adventure: 150 }
          const labels: Record<string, string> = {
            wealth: '💰 Ricchezza', family: '👨‍👩‍👧 Famiglia', career: '💼 Carriera',
            achievements: '🎯 Traguardi', character: '⭐ Carattere', adventure: '✈️ Avventura',
          }
          return (
            <div key={key} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{labels[key]}</span>
                <span style={{ fontWeight: 600 }}>{val}/{maxes[key]}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <div style={{ height: '100%', borderRadius: 2, background: tierInfo.color, width: `${(val / maxes[key]) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Continue as child */}
      {bestChild && (
        <div className="card" style={{ width: '100%', marginBottom: 16, border: `1px solid ${tierInfo.color}` }}>
          <p style={{ fontSize: 12, color: tierInfo.color, marginBottom: 8, fontWeight: 700 }}>
            👶 CONTINUA LA STORIA
          </p>
          <p style={{ fontSize: 14, marginBottom: 4 }}>
            Vuoi continuare come <strong>{bestChild.name}</strong>?
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            {bestChild.age} anni · Legame con te: {Math.round(bestChild.bondWithPlayer)}% ·
            Eredità: €{Math.round(finance.money * LegacyEngine.calculateBonuses(legacyScore).moneyMultiplier).toLocaleString()}
          </p>
          <button
            className="btn-age"
            onClick={handleContinue}
            style={{ width: '100%', marginBottom: 8, background: tierInfo.color, color: '#000' }}
          >
            ▶️ Continua come {bestChild.name}
          </button>
        </div>
      )}

      {/* New game */}
      <button className="btn-age" onClick={handleNewGame} style={{ width: '100%', opacity: 0.7 }}>
        🔄 Nuova Vita (Ricomincia)
      </button>
    </div>
  )
}
