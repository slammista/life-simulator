import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ReligionEngine } from '../../services/ReligionEngine'
import type { Religion } from '../../store/types'

const ALL_RELIGIONS: Religion[] = [
  'catholicism', 'islam', 'buddhism', 'hinduism', 'judaism',
  'protestantism', 'orthodoxy', 'atheism', 'agnosticism', 'other',
]

export function ReligionScreen() {
  const { identity, religion, time, practiceReligion, convertReligion, diminishingReturns } = useGameStore()
  const [feedback, setFeedback] = useState('')
  const [showConvert, setShowConvert] = useState(false)

  const practicesThisYear = diminishingReturns[`religion_${time.year}`] ?? 0
  const canPractice = practicesThisYear < 4
  const currentInfo = ReligionEngine.getInfo(identity.religion)

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

      {/* Current religion card */}
      <div className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>{currentInfo.emoji}</div>
        <p style={{ fontSize: 16, fontWeight: 700 }}>{currentInfo.name}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>{currentInfo.practice}</p>

        {/* Practice level bar */}
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
          Devozione: {religion.practiceLevel}/100
        </p>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 6, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${religion.practiceLevel}%`, height: '100%', background: 'var(--color-positive)', borderRadius: 4 }} />
        </div>

        {/* Effects preview */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {Object.entries(currentInfo.effects).map(([k, v]) => (
            <span key={k} style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: 'rgba(15,155,88,0.15)', color: '#4ade80' }}>
              +{v} {k === 'happiness' ? '😊' : k === 'mentalHealth' ? '🧠' : k === 'karma' ? '⚡' : k === 'health' ? '❤️' : k === 'intelligence' ? '🎓' : k}
            </span>
          ))}
        </div>

        <button
          className={canPractice ? 'btn-primary' : 'btn-secondary'}
          style={{ width: '100%', padding: '9px 0', fontSize: 13 }}
          disabled={!canPractice}
          onClick={() => act(practiceReligion)}
        >
          {canPractice ? `${currentInfo.emoji} Pratica la Fede (${4 - practicesThisYear} rimaste)` : '🙏 Già praticato abbastanza quest\'anno'}
        </button>
      </div>

      {/* Karma & spiritual info */}
      <div className="card" style={{ padding: '10px 14px' }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>📿 Karma Spirituale</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Pratiche quest'anno: <strong style={{ color: 'var(--color-text)' }}>{practicesThisYear}/4</strong>
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Ultima pratica: <strong style={{ color: 'var(--color-text)' }}>{religion.lastPracticeYear > 0 ? `Anno ${religion.lastPracticeYear}` : 'Mai'}</strong>
        </p>
      </div>

      {/* Conversion section */}
      <div className="card" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showConvert ? 12 : 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>✨ Cambia Religione</p>
          <button
            onClick={() => setShowConvert(v => !v)}
            style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'var(--color-text-secondary)' }}
          >
            {showConvert ? 'Chiudi' : 'Esplora'}
          </button>
        </div>

        {showConvert && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {time.age < 16 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                ⚠️ La conversione richiede almeno 16 anni (hai {time.age}).
              </p>
            )}
            {ALL_RELIGIONS.map(rel => {
              const info = ReligionEngine.getInfo(rel)
              const isCurrent = identity.religion === rel
              return (
                <div key={rel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{info.emoji}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600 }}>{info.name}</p>
                      <p style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{info.practice}</p>
                    </div>
                  </div>
                  {isCurrent ? (
                    <span style={{ fontSize: 11, color: '#4ade80', padding: '3px 10px', background: 'rgba(15,155,88,0.15)', borderRadius: 10 }}>
                      Attuale
                    </span>
                  ) : (
                    <button
                      className={time.age >= 16 ? 'btn-primary' : 'btn-secondary'}
                      style={{ fontSize: 11, padding: '5px 10px' }}
                      disabled={time.age < 16}
                      onClick={() => { act(() => convertReligion(rel)); setShowConvert(false) }}
                    >
                      Converti
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
