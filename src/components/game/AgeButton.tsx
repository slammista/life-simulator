import { useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

export function AgeButton() {
  const { handleInvecchia, isGameOver, currentEvent, time } = useGameStore()
  const btnRef = useRef<HTMLButtonElement>(null)
  const disabled = isGameOver || currentEvent !== null

  useEffect(() => {
    // Simple Phaser-like pulse animation via CSS when enabled
    if (!disabled && btnRef.current) {
      btnRef.current.classList.add('pulse')
    } else if (btnRef.current) {
      btnRef.current.classList.remove('pulse')
    }
  }, [disabled])

  return (
    <div style={{ padding: '8px 12px' }}>
      <button
        ref={btnRef}
        className="btn-age"
        onClick={handleInvecchia}
        disabled={disabled}
        style={{
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {isGameOver
          ? '💀 GAME OVER'
          : currentEvent
          ? '⏳ Risolvi l\'evento...'
          : `👴 INVECCHIA +1 ANNO  (${time.age}→${time.age + 1})`}
      </button>
    </div>
  )
}
