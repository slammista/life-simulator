import { useState, useEffect } from 'react'

// Exported so other first-launch overlays (e.g. TutorialOverlay) can wait for consent
// to be resolved before showing themselves, instead of racing it at the same z-index.
export const STORAGE_KEY = 'lifesim2d-cookie-consent'

type ConsentChoice = 'accepted' | 'declined' | null

export function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(() => localStorage.getItem(STORAGE_KEY) as ConsentChoice)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (choice) {
      if (choice === 'accepted') enableAds()
      return
    }
    // Show banner after 1 second
    const t = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(t)
  }, [choice])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setChoice('accepted')
    setVisible(false)
    enableAds()
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setChoice('declined')
    setVisible(false)
  }

  if (!visible || choice !== null) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 70, // above BottomTabs
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '0 12px',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(26,22,56,0.97)',
        border: '1px solid rgba(167,139,250,0.3)',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
        pointerEvents: 'all',
      }}>
        <p style={{ fontSize: 13, color: '#e2e8f0', margin: '0 0 12px', lineHeight: 1.5 }}>
          🍪 Utilizziamo cookie e annunci pubblicitari per supportare il gioco gratuito.
          Accettando ci aiuti a mantenerlo gratis per tutti.
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#a78bfa', marginLeft: 4 }}
          >
            Privacy Policy
          </a>
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={accept}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: 'linear-gradient(135deg, #7c5cff, #a78bfa)',
              color: '#fff',
            }}
          >
            Accetta
          </button>
          <button
            onClick={decline}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
            }}
          >
            Rifiuta
          </button>
        </div>
      </div>
    </div>
  )
}

function enableAds() {
  // Signal Google Consent Mode v2 that consent was granted
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).gtag) {
    const gtag = (window as unknown as Record<string, (...args: unknown[]) => void>).gtag
    gtag('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    })
  }
}
