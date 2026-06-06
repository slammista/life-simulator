import { useGameStore } from '../../store/gameStore'

const deathMessages: Record<string, { emoji: string; title: string; text: string }> = {
  natural: { emoji: '🕊️', title: 'Morte Naturale', text: 'Hai vissuto una vita piena. Hai raggiunto la fine del tuo cammino in pace.' },
  disease: { emoji: '🏥', title: 'Malattia', text: 'La tua salute si è deteriorata oltre il punto di non ritorno.' },
  suicide: { emoji: '😔', title: 'Crisi Mentale', text: 'Il peso della mente è diventato insostenibile.' },
  accident: { emoji: '🚗', title: 'Incidente', text: 'Un tragico incidente ha messo fine alla tua storia.' },
  overdose: { emoji: '💊', title: 'Overdose', text: 'La dipendenza ti ha consumato.' },
}

export function GameOverScreen() {
  const { deathType, time, stats, finance, completedGoals, goals, eventLog, newGame, identity } = useGameStore()

  const death = deathMessages[deathType ?? 'natural'] ?? deathMessages.natural
  const goalsCount = completedGoals.length
  const totalGoals = goals.length

  const handleNewGame = () => {
    // Start a fresh game with same identity for now
    newGame({ ...identity, emoji: '👶' }, 'italy')
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      overflowY: 'auto',
    }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>{death.emoji}</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>
        {death.title}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: 20 }}>
        {death.text}
      </p>

      <div className="card" style={{ width: '100%', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          Statistiche di Vita
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Anni vissuti', val: `${time.age}`, emoji: '🎂' },
            { label: 'Anno morte', val: `${time.year}`, emoji: '📅' },
            { label: 'Denaro finale', val: `€${finance.money.toLocaleString('it-IT')}`, emoji: '💰' },
            { label: 'Goals completati', val: `${goalsCount}/${totalGoals}`, emoji: '🎯' },
            { label: 'Salute finale', val: `${Math.round(stats.health)}/100`, emoji: '❤️' },
            { label: 'Felicità finale', val: `${Math.round(stats.happiness)}/100`, emoji: '😊' },
          ].map(({ label, val, emoji }) => (
            <div key={label} style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{emoji} {label}</p>
              <p style={{ fontWeight: 700, fontSize: 15 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        className="btn-age"
        onClick={handleNewGame}
        style={{ width: '100%' }}
      >
        🔄 Nuova Vita
      </button>
    </div>
  )
}
