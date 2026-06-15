import { Suspense, lazy, useState, useCallback, useEffect, useRef } from 'react'
import { useGameStore } from './store/gameStore'
import { HUD } from './components/game/HUD'
import { EventDisplay } from './components/game/EventDisplay'
import { EventLog } from './components/game/EventLog'
import { BottomTabs, type Tab } from './components/navigation/BottomTabs'
import { NewGameScreen } from './components/screens/NewGameScreen'
import { GameOverScreen } from './components/screens/GameOverScreen'
import { AgeGate } from './components/screens/AgeGate'
import { EmotionalUIEngine } from './services/EmotionalUIEngine'
import { haptic } from './services/HapticEngine'
import { AudioEngine } from './services/AudioEngine'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { TutorialOverlay } from './components/game/TutorialOverlay'
import { InstallBanner } from './components/game/InstallBanner'
import { ToastContainer } from './components/game/ToastNotification'
import { ActionResultPanel } from './components/game/ActionResultPanel'
import { NPCEventNotifications } from './components/game/NPCEventNotifications'
import { VitaWidgets } from './components/game/VitaWidgets'
import { AdBanner } from './components/game/AdBanner'
import { CookieConsent } from './components/common/CookieConsent'
import { CenterAlert } from './components/common/CenterAlert'
import { MinigameChallengeModal } from './components/minigames/MinigameChallengeModal'
import { useChallengeStore } from './store/challengeStore'
import { pickRandomChallenge } from './components/minigames/challengeRegistry'
import { OriginStoryScreen } from './components/screens/OriginStoryScreen'
import { ShareLifeButton } from './components/game/ShareLifeButton'
import { FirstPlayHint } from './components/game/FirstPlayHint'
import { ActivitiesNav, ACTIVITIES_ITEM_MAP, type ActivitiesSubTab as ActivitiesSubTabBase } from './components/game/ActivitiesNav'
import { CarreraNav, CARRERA_ITEMS, type CarreraSubTab } from './components/game/CarreraNav'
import { AssetsNav, ASSETS_ITEMS, type AssetsSubTabId } from './components/game/AssetsNav'
import { RelazioniNav, RELAZIONI_ITEMS, type RelazioniSubTabId } from './components/game/RelazioniNav'
import { AgeTransitionOverlay } from './components/game/AgeTransitionOverlay'
import { useShallow } from 'zustand/react/shallow'
import { CloudSaveService } from './services/CloudSaveService'
import { useWalletStore } from './store/walletStore'

// Auto-reload when a new SW takes control (fixes stale chunk MIME error)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

// ---- Lazy screens ----
const CareerScreen        = lazy(() => import('./components/screens/CareerScreen').then(m => ({ default: m.CareerScreen })))
const RelationshipScreen  = lazy(() => import('./components/screens/RelationshipScreen').then(m => ({ default: m.RelationshipScreen })))
const GoalsScreen         = lazy(() => import('./components/screens/GoalsScreen').then(m => ({ default: m.GoalsScreen })))
const SettingsScreen      = lazy(() => import('./components/screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })))
const EducationScreen     = lazy(() => import('./components/screens/EducationScreen').then(m => ({ default: m.EducationScreen })))
const HealthScreen        = lazy(() => import('./components/screens/HealthScreen').then(m => ({ default: m.HealthScreen })))
const HobbyScreen         = lazy(() => import('./components/screens/HobbyScreen').then(m => ({ default: m.HobbyScreen })))
const SportScreen         = lazy(() => import('./components/screens/SportScreen').then(m => ({ default: m.SportScreen })))
const FinanceScreen       = lazy(() => import('./components/screens/FinanceScreen').then(m => ({ default: m.FinanceScreen })))
const CriminalScreen      = lazy(() => import('./components/screens/CriminalScreen').then(m => ({ default: m.CriminalScreen })))
const SocialMediaScreen   = lazy(() => import('./components/screens/SocialMediaScreen').then(m => ({ default: m.SocialMediaScreen })))
const SubstanceScreen     = lazy(() => import('./components/screens/SubstanceScreen').then(m => ({ default: m.SubstanceScreen })))
const PetScreen           = lazy(() => import('./components/screens/PetScreen').then(m => ({ default: m.PetScreen })))
const TravelScreen        = lazy(() => import('./components/screens/TravelScreen').then(m => ({ default: m.TravelScreen })))
const DatingScreen        = lazy(() => import('./components/screens/DatingScreen').then(m => ({ default: m.DatingScreen })))
const VehicleScreen       = lazy(() => import('./components/screens/VehicleScreen').then(m => ({ default: m.VehicleScreen })))
const ReligionScreen      = lazy(() => import('./components/screens/ReligionScreen').then(m => ({ default: m.ReligionScreen })))
const PoliticsScreen      = lazy(() => import('./components/screens/PoliticsScreen').then(m => ({ default: m.PoliticsScreen })))
const ParentingScreen     = lazy(() => import('./components/screens/ParentingScreen'))
const MilitaryScreen      = lazy(() => import('./components/screens/MilitaryScreen'))
const BodyModScreen       = lazy(() => import('./components/screens/BodyModScreen'))
const BeautyScreen        = lazy(() => import('./components/screens/BeautyScreen'))
const BarberScreen        = lazy(() => import('./components/screens/BarberScreen').then(m => ({ default: m.BarberScreen })))
const RetirementScreen    = lazy(() => import('./components/screens/RetirementScreen'))
const BusinessScreen      = lazy(() => import('./components/screens/BusinessScreen').then(m => ({ default: m.BusinessScreen })))
const GamblingScreen      = lazy(() => import('./components/screens/GamblingScreen'))
const SexualHealthScreen  = lazy(() => import('./components/screens/SexualHealthScreen'))
const CosmeticSurgeryScreen = lazy(() => import('./components/screens/CosmeticSurgeryScreen'))
const ChallengeScreen     = lazy(() => import('./components/screens/ChallengeScreen'))
const RibbonsScreen       = lazy(() => import('./components/screens/RibbonsScreen'))
const LivingScreen        = lazy(() => import('./components/screens/LivingScreen'))
const CausalityTimelineScreen = lazy(() => import('./components/screens/CausalityTimelineScreen'))
const MinigamesScreen     = lazy(() => import('./components/screens/MinigamesScreen').then(m => ({ default: m.MinigamesScreen })))
const PrivacyPolicyScreen = lazy(() => import('./components/screens/PrivacyPolicyScreen').then(m => ({ default: m.PrivacyPolicyScreen })))
const LeaderboardScreen   = lazy(() => import('./components/screens/LeaderboardScreen').then(m => ({ default: m.LeaderboardScreen })))
const SocializeScreen     = lazy(() => import('./components/screens/SocializeScreen').then(m => ({ default: m.SocializeScreen })))
const SpecialCareerScreen = lazy(() => import('./components/screens/SpecialCareerScreen').then(m => ({ default: m.SpecialCareerScreen })))

// ---- Vita Hub Panels (lazy-loaded) ----
const VitaShopPanel    = lazy(() => import('./components/game/VitaShopPanel').then(m => ({ default: m.VitaShopPanel })))
const VitaAccountPanel = lazy(() => import('./components/game/VitaAccountPanel').then(m => ({ default: m.VitaAccountPanel })))
const VitaRewardsPanel = lazy(() => import('./components/game/VitaRewardsPanel').then(m => ({ default: m.VitaRewardsPanel })))

// ---- Sub-tab types ----
type VitaSection     = 'home' | 'shop' | 'account' | 'rewards'
type LavoroSubTab    = 'home' | CarreraSubTab
type AssetsSubTab    = 'home' | AssetsSubTabId
type RelazioniSubTab = 'home' | RelazioniSubTabId
type ActivitiesSubTab = ActivitiesSubTabBase | 'home'

function SubTabBar<T extends string>({
  tabs, active, onChange,
}: { tabs: { id: T; label: string; emoji: string }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '8px 12px',
      background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)',
      overflowX: 'auto', flexShrink: 0,
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: active === t.id ? 'var(--color-cta)' : 'rgba(255,255,255,0.07)',
            color: active === t.id ? '#fff' : 'var(--color-text-secondary)',
          }}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  )
}

function ScreenFallback() {
  return <div className="screen-loading">Caricamento...</div>
}

function SectionBackBar({ label, itemLabel, onBack }: { label: string; itemLabel?: string; onBack: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 8px',
      background: 'rgba(0,0,0,0.22)', borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 15, fontWeight: 600, color: 'var(--primary)',
          border: '1px solid rgba(124,92,255,0.3)',
          background: 'rgba(124,92,255,0.12)', cursor: 'pointer',
          padding: '5px 12px', borderRadius: 20,
        }}
      >
        ‹ {label}
      </button>
      {itemLabel && (
        <>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{itemLabel}</span>
        </>
      )}
    </div>
  )
}

function App() {
  const isStarted  = useGameStore(s => s.isStarted)
  const isGameOver = useGameStore(s => s.isGameOver)
  const narrative  = useGameStore(s => s.narrative)
  const { handleInvecchia, currentEvent, time } = useGameStore(
    useShallow(s => ({ handleInvecchia: s.handleInvecchia, currentEvent: s.currentEvent, time: s.time }))
  )
  const emotionalUI = useGameStore(useShallow(s => EmotionalUIEngine.derive(s)))

  const [ageConfirmed, setAgeConfirmed] = useState(() => !!localStorage.getItem('age_confirmed'))
  const [activeTab, _setActiveTab] = useState<Tab>('vita')
  const [vitaSection, setVitaSection] = useState<VitaSection>('home')
  const [lavoroSub,    setLavoroSubRaw]    = useState<LavoroSubTab>('home')
  const [assetsSub,    setAssetsSub]    = useState<AssetsSubTab>('home')
  const [relazioniSub, setRelazioniSubRaw] = useState<RelazioniSubTab>('home')
  const [activitiesSub, setActivitiesSubRaw] = useState<ActivitiesSubTab>('home')

  // Cast-safe wrappers used by VitaWidgets (which receives (sub: string) => void)
  const setLavoroSub    = (s: string) => setLavoroSubRaw(s as LavoroSubTab)
  const setRelazioniSub = (s: string) => setRelazioniSubRaw(s as RelazioniSubTab)
  const setActivitiesSub = (s: string) => setActivitiesSubRaw(s as ActivitiesSubTab)

  // Reset sub-tabs to home when switching top-level tabs
  const setActiveTab = (tab: Tab) => {
    _setActiveTab(tab)
    if (tab === 'lavoro')     setLavoroSubRaw('home')
    if (tab === 'assets')     setAssetsSub('home')
    if (tab === 'relazioni')  setRelazioniSubRaw('home')
    if (tab === 'activities') setActivitiesSubRaw('home')
  }

  const ageDisabled = isGameOver || currentEvent !== null

  const soundEnabled = useGameStore(s => s.settings.soundEnabled)

  useEffect(() => {
    AudioEngine.setEnabled(soundEnabled)
  }, [soundEnabled])

  // BGM: load once and play when game is active; stop on game over
  useEffect(() => {
    if (isStarted && !isGameOver && soundEnabled) {
      AudioEngine.loadBGM('/sounds/horacio1.mp3').then(() => {
        if (!AudioEngine.isBGMPlaying()) AudioEngine.playBGM()
      })
    } else if (isGameOver) {
      AudioEngine.fadeBGM(0, 2.0)
      setTimeout(() => AudioEngine.stopBGM(), 2100)
    }
  }, [isStarted, isGameOver, soundEnabled])

  const [checkoutToast, setCheckoutToast] = useState<{ text: string; ok: boolean } | null>(null)
  const checkoutHandled = useRef(false)

  // Handle return from Stripe checkout: verify payment and credit gems
  useEffect(() => {
    if (checkoutHandled.current) return
    const params = new URLSearchParams(window.location.search)
    const checkoutStatus = params.get('checkout')
    const sessionId = params.get('session_id')
    if (checkoutStatus !== 'success' || !sessionId) return
    checkoutHandled.current = true
    // Clean URL immediately
    window.history.replaceState({}, '', window.location.pathname)
    const run = async () => {
      try {
        const user = await CloudSaveService.getCurrentUser()
        if (!user) {
          setCheckoutToast({ text: 'Pagamento ricevuto! Accedi per ricevere le gemme.', ok: true })
          return
        }
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
        const res = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
          body: JSON.stringify({ session_id: sessionId, user_id: user.id }),
        })
        const data = await res.json() as { status: string; gems_granted?: number; product_type?: string; error?: string }
        if (data.status === 'completed' && data.gems_granted && data.gems_granted > 0) {
          useWalletStore.getState().addGems(data.gems_granted)
          setCheckoutToast({ text: `+${data.gems_granted} 💎 accreditate! Grazie per l'acquisto.`, ok: true })
        } else if (data.status === 'completed') {
          setCheckoutToast({ text: 'Acquisto completato! Controlla il tuo account.', ok: true })
        } else if (data.status === 'already_processed') {
          setCheckoutToast({ text: 'Acquisto già elaborato.', ok: true })
        } else {
          setCheckoutToast({ text: data.error ?? 'Errore nella verifica del pagamento.', ok: false })
        }
        // Sync authoritative balance from server
        useWalletStore.getState().syncWithServer()
      } catch {
        setCheckoutToast({ text: 'Pagamento ricevuto! Le gemme saranno accreditate a breve.', ok: true })
      }
    }
    run()
  }, [])

  const [ageOverlay, setAgeOverlay] = useState<{ visible: boolean; age: number; year: number }>({
    visible: false, age: 0, year: 2000,
  })

  // Hide age-transition overlay whenever a new game starts
  useEffect(() => {
    if (isStarted && !isGameOver) {
      setAgeOverlay({ visible: false, age: 0, year: 0 })
    }
  }, [isStarted])

  const handleAge = useCallback(() => {
    setActiveTab('vita')
    setVitaSection('home')
    if (!ageDisabled) {
      haptic('heavy')
      AudioEngine.playSFX('ageUp')
      setAgeOverlay({ visible: true, age: time.age + 1, year: time.year + 1 })
      handleInvecchia()
      // The game may "pose" a mini-game challenge as an event — only when no
      // normal event popped up this year, to avoid stacking modals.
      const fresh = useGameStore.getState()
      if (!fresh.currentEvent && !fresh.isGameOver && Math.random() < 0.2) {
        const challenge = pickRandomChallenge(fresh)
        if (challenge) useChallengeStore.getState().open(challenge.id, 'event')
      }
    }
  }, [ageDisabled, handleInvecchia, time.age, time.year])

  if (!ageConfirmed) return <AgeGate onConfirm={() => setAgeConfirmed(true)} />
  if (!isStarted)    return <NewGameScreen />
  if (isGameOver)    return <GameOverScreen />
  if (narrative?.originStory && !narrative.originStory.seen) return <OriginStoryScreen />

  return (
    <div className={`app-shell ${emotionalUI.className}`} data-emotion={emotionalUI.state} data-section={activeTab}>
      <TutorialOverlay />

      {/* Checkout success toast */}
      {checkoutToast && (
        <div style={{
          position: 'fixed', top: 60, left: 12, right: 12, zIndex: 9998,
          background: checkoutToast.ok ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{checkoutToast.text}</span>
          <button onClick={() => setCheckoutToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, marginLeft: 12 }}>✕</button>
        </div>
      )}

      <HUD />

      {/* Sub-section back bars (Activities-style) */}
      {activeTab === 'lavoro' && lavoroSub !== 'home' && (
        <SectionBackBar
          label="Carriera"
          itemLabel={CARRERA_ITEMS.find(i => i.id === lavoroSub)?.emoji + ' ' + CARRERA_ITEMS.find(i => i.id === lavoroSub)?.label}
          onBack={() => setLavoroSubRaw('home')}
        />
      )}
      {activeTab === 'assets' && assetsSub !== 'home' && (
        <SectionBackBar
          label="Assets"
          itemLabel={ASSETS_ITEMS.find(i => i.id === assetsSub)?.emoji + ' ' + ASSETS_ITEMS.find(i => i.id === assetsSub)?.label}
          onBack={() => setAssetsSub('home')}
        />
      )}
      {activeTab === 'relazioni' && relazioniSub !== 'home' && (
        <SectionBackBar
          label="Relazioni"
          itemLabel={RELAZIONI_ITEMS.find(i => i.id === relazioniSub)?.emoji + ' ' + RELAZIONI_ITEMS.find(i => i.id === relazioniSub)?.label}
          onBack={() => setRelazioniSubRaw('home')}
        />
      )}
      {activeTab === 'activities' && activitiesSub !== 'home' && (
        <SectionBackBar
          label="Attività"
          itemLabel={ACTIVITIES_ITEM_MAP[activitiesSub as ActivitiesSubTabBase]?.emoji + ' ' + ACTIVITIES_ITEM_MAP[activitiesSub as ActivitiesSubTabBase]?.label}
          onBack={() => setActivitiesSubRaw('home')}
        />
      )}

      {/* Main content */}
      <div className="app-content">
        {/* Home nav screens — BitLife-style list */}
        {activeTab === 'activities' && activitiesSub === 'home' && (
          <ActivitiesNav onChange={sub => setActivitiesSubRaw(sub as ActivitiesSubTab)} />
        )}
        {activeTab === 'lavoro' && lavoroSub === 'home' && (
          <CarreraNav onChange={sub => setLavoroSubRaw(sub as LavoroSubTab)} />
        )}
        {activeTab === 'assets' && assetsSub === 'home' && (
          <AssetsNav onChange={sub => setAssetsSub(sub as AssetsSubTab)} />
        )}
        {activeTab === 'relazioni' && relazioniSub === 'home' && (
          <RelazioniNav onChange={sub => setRelazioniSubRaw(sub as RelazioniSubTab)} />
        )}

        {activeTab === 'vita' && vitaSection === 'home' && (
          <div className="main-dashboard">
            <div className="event-panel">
              <div style={{ padding: '8px 12px 0' }}>
                <VitaWidgets
                  setActiveTab={setActiveTab}
                  setVitaSection={setVitaSection}
                  setActivitiesSub={setActivitiesSub}
                  setLavoroSub={setLavoroSub}
                  setRelazioniSub={setRelazioniSub}
                />
              </div>
              <EventDisplay />
            </div>
            <div className="event-log-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '6px 12px 0' }}>
                <ShareLifeButton />
              </div>
              <EventLog />
            </div>
          </div>
        )}

        <ErrorBoundary>
          <Suspense fallback={<ScreenFallback />}>
            {/* VITA HUB PANELS */}
            {activeTab === 'vita' && vitaSection === 'shop'    && <VitaShopPanel onBack={() => setVitaSection('home')} />}
            {activeTab === 'vita' && vitaSection === 'account' && <VitaAccountPanel onBack={() => setVitaSection('home')} />}
            {activeTab === 'vita' && vitaSection === 'rewards' && <VitaRewardsPanel onBack={() => setVitaSection('home')} />}

            {/* LAVORO */}
            {activeTab === 'lavoro' && lavoroSub === 'career'         && <CareerScreen />}
            {activeTab === 'lavoro' && lavoroSub === 'education'      && <EducationScreen />}
            {activeTab === 'lavoro' && lavoroSub === 'military'       && <MilitaryScreen />}
            {activeTab === 'lavoro' && lavoroSub === 'pension'        && <RetirementScreen />}
            {activeTab === 'lavoro' && lavoroSub === 'business'       && <BusinessScreen />}
            {activeTab === 'lavoro' && lavoroSub === 'special_career' && <SpecialCareerScreen />}

            {/* ASSETS */}
            {activeTab === 'assets' && assetsSub === 'finance'  && <FinanceScreen />}
            {activeTab === 'assets' && assetsSub === 'vehicle'  && <VehicleScreen />}
            {activeTab === 'assets' && assetsSub === 'living'   && <LivingScreen />}
            {activeTab === 'assets' && assetsSub === 'social'   && <SocialMediaScreen />}

            {/* RELAZIONI */}
            {activeTab === 'relazioni' && relazioniSub === 'relationships' && <RelationshipScreen />}
            {activeTab === 'relazioni' && relazioniSub === 'dating'        && <DatingScreen />}
            {activeTab === 'relazioni' && relazioniSub === 'famiglia'      && <ParentingScreen />}
            {activeTab === 'relazioni' && relazioniSub === 'pets'          && <PetScreen />}

            {/* ACTIVITIES */}
            {activeTab === 'activities' && activitiesSub === 'health'      && <HealthScreen />}
            {activeTab === 'activities' && activitiesSub === 'hobby'       && <HobbyScreen />}
            {activeTab === 'activities' && activitiesSub === 'sport'       && <SportScreen />}
            {activeTab === 'activities' && activitiesSub === 'substances'  && <SubstanceScreen />}
            {activeTab === 'activities' && activitiesSub === 'criminal'    && <CriminalScreen />}
            {activeTab === 'activities' && activitiesSub === 'religion'    && <ReligionScreen />}
            {activeTab === 'activities' && activitiesSub === 'body'        && <BodyModScreen />}
            {activeTab === 'activities' && activitiesSub === 'beauty'      && <BeautyScreen />}
            {activeTab === 'activities' && activitiesSub === 'barber'      && <BarberScreen />}
            {activeTab === 'activities' && activitiesSub === 'gambling'    && <GamblingScreen />}
            {activeTab === 'activities' && activitiesSub === 'sex_health'  && <SexualHealthScreen />}
            {activeTab === 'activities' && activitiesSub === 'cosmetic'    && <CosmeticSurgeryScreen />}
            {activeTab === 'activities' && activitiesSub === 'travel'      && <TravelScreen />}
            {activeTab === 'activities' && activitiesSub === 'politics'    && <PoliticsScreen />}
            {activeTab === 'activities' && activitiesSub === 'goals'       && <GoalsScreen />}
            {activeTab === 'activities' && activitiesSub === 'challenges'  && <ChallengeScreen />}
            {activeTab === 'activities' && activitiesSub === 'ribbons'     && <RibbonsScreen />}
            {activeTab === 'activities' && activitiesSub === 'timeline'    && <CausalityTimelineScreen />}
            {activeTab === 'activities' && activitiesSub === 'minigames'   && <MinigamesScreen />}
            {activeTab === 'activities' && activitiesSub === 'leaderboard' && <LeaderboardScreen />}
            {activeTab === 'activities' && activitiesSub === 'settings'    && <SettingsScreen />}
            {activeTab === 'activities' && activitiesSub === 'privacy'     && <PrivacyPolicyScreen />}
            {activeTab === 'activities' && activitiesSub === 'socialize'   && <SocializeScreen />}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Bottom navigation — Age button at center */}
      <BottomTabs
        active={activeTab}
        onChange={setActiveTab}
        onAge={handleAge}
        ageDisabled={ageDisabled}
        hasEvent={currentEvent !== null}
        currentAge={time.age}
      />

      <AgeTransitionOverlay
        age={ageOverlay.age}
        year={ageOverlay.year}
        visible={ageOverlay.visible}
        onDone={() => setAgeOverlay(s => ({ ...s, visible: false }))}
      />
      <FirstPlayHint hasEvent={currentEvent !== null} age={time.age} />
      <AdBanner visible={activeTab === 'vita' && vitaSection === 'home'} />
      <NPCEventNotifications />
      <ActionResultPanel />
      <ToastContainer />
      <CenterAlert />
      <MinigameChallengeModal />
      <InstallBanner />
      <CookieConsent />
    </div>
  )
}

export default App
