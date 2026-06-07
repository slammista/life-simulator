import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'lifesim2d_install_dismissed'

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOS, setShowIOS] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }
    if (localStorage.getItem(DISMISSED_KEY)) return

    // iOS detection (no beforeinstallprompt on Safari)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream
    if (ios) {
      setIsIOS(true)
      setShowIOS(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setPrompt(null)
    setShowIOS(false)
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    dismiss()
  }

  if (installed || (!prompt && !showIOS)) return null

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 8px)',
      left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 24px)', maxWidth: 406,
      background: 'linear-gradient(135deg, #1e1e3f, #16213e)',
      border: '1px solid rgba(99,102,241,0.4)',
      borderRadius: 14, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      zIndex: 8000,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: 28, flexShrink: 0 }}>📲</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Installa Life Simulator 2D</p>
        {isIOS ? (
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            Tocca <strong>□↑</strong> poi <strong>"Aggiungi a schermata Home"</strong>
          </p>
        ) : (
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
            Gioca offline, notifiche native, avvio istantaneo
          </p>
        )}
      </div>
      {!isIOS && prompt && (
        <button
          onClick={install}
          style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: 'var(--color-cta, #6366f1)', color: '#fff', flexShrink: 0,
          }}
        >
          Installa
        </button>
      )}
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-secondary)', fontSize: 18, padding: 4, flexShrink: 0,
        }}
        aria-label="Chiudi"
      >
        ×
      </button>
    </div>
  )
}
