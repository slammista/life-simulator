import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useShallow } from 'zustand/react/shallow'

function buildShareText(name: string, age: number, stats: Record<string, number>, career: { currentJob: { title: string } | null }): string {
  const h = stats.health ?? 0
  const hap = stats.happiness ?? 0
  const intel = stats.intelligence ?? 0
  const job = career.currentJob?.title ?? 'disoccupato'

  const emojis = [
    h >= 80 ? '❤️' : h >= 50 ? '🩹' : '💔',
    hap >= 80 ? '😄' : hap >= 50 ? '🙂' : '😔',
    intel >= 80 ? '🧠' : intel >= 50 ? '📚' : '😶',
  ].join('')

  return `🎮 Life Simulator 2D\n\n${name}, ${age} ${age === 1 ? 'anno' : 'anni'} ${emojis}\n💼 ${job}\n❤️ Salute: ${h} · 😊 Felicità: ${hap} · 🧠 Intel: ${intel}\n\nSimula la tua vita su life-simulator-2d.vercel.app`
}

export function ShareLifeButton() {
  const { identity, time, stats, career } = useGameStore(
    useShallow(s => ({
      identity: s.identity,
      time: s.time,
      stats: s.stats,
      career: s.career,
    }))
  )
  const [copied, setCopied] = useState(false)

  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  const handleShare = async () => {
    const text = buildShareText(identity.name, time.age, stats as unknown as Record<string, number>, career)
    if (canShare) {
      try {
        await navigator.share({ title: 'Life Simulator 2D', text })
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch { /* ignore */ }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="tap-scale"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 20,
        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.12)',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.25)'}`,
        color: copied ? '#6ee7b7' : '#a5b4fc',
        fontSize: 12, fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
      }}
    >
      <span>{copied ? '✓' : '📤'}</span>
      <span>{copied ? 'Copiato!' : 'Condividi'}</span>
    </button>
  )
}
