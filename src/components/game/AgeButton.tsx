import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'

export function AgeButton() {
  const { handleInvecchia, isGameOver, currentEvent, time } = useGameStore()
  const btnRef = useRef<HTMLButtonElement>(null)
  const disabled = isGameOver || currentEvent !== null

  useEffect(() => {
    if (!disabled && btnRef.current) {
      btnRef.current.classList.add('pulse')
    } else if (btnRef.current) {
      btnRef.current.classList.remove('pulse')
    }
  }, [disabled])

  const handleClick = useCallback(() => {
    if (disabled) return
    // Haptic feedback if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(40)
    }
    handleInvecchia()
  }, [disabled, handleInvecchia])

  return (
    <div className="age-btn-wrap">
      <button
        ref={btnRef}
        className="btn-age"
        onClick={handleClick}
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
