import { Suspense, lazy, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from './store/gameStore'
import { HUD } from './components/game/HUD'
import { EventDisplay } from './components/game/EventDisplay'
import { EventLog } from './components/game/EventLog'
import { AgeButton } from './components/game/AgeButton'
import { BottomTabs, type Tab } from './components/navigation/BottomTabs'
import { NewGameScreen } from './components/screens/NewGameScreen'
import { GameOverScreen } from './components/screens/GameOverScreen'
import { AgeGate } from './components/screens/AgeGate'
import { EmotionalUIEngine } from './services/EmotionalUIEngine'
import { ErrorBoundary } from './components/common/ErrorBoundary'

const CareerScreen = lazy(() => import('./components/screens/CareerScreen').then(module => ({ default: module.CareerScreen })))
const RelationshipScreen = lazy(() => import('./components/screens/RelationshipScreen').then(module => ({ default: module.RelationshipScreen })))
const GoalsScreen = lazy(() => import('./components/screens/GoalsScreen').then(module => ({ default: module.GoalsScreen })))
const SettingsScreen = lazy(() => import('./components/screens/SettingsScreen').then(module => ({ default: module.SettingsScreen })))
const EducationScreen = lazy(() => import('./components/screens/EducationScreen').then(module => ({ default: module.EducationScreen })))
const HealthScreen = lazy(() => import('./components/screens/HealthScreen').then(module => ({ default: module.HealthScreen })))
const HobbyScreen = lazy(() => import('./components/screens/HobbyScreen').then(module => ({ default: module.HobbyScreen })))
const FinanceScreen = lazy(() => import('./components/screens/FinanceScreen').then(module => ({ default: module.FinanceScreen })))
const CriminalScreen = lazy(() => import('./components/screens/CriminalScreen').then(module => ({ default: module.CriminalScreen })))
const SocialMediaScreen = lazy(() => import('./components/screens/SocialMediaScreen').then(module => ({ default: module.SocialMediaScreen })))
const SubstanceScreen = lazy(() => import('./components/screens/SubstanceScreen').then(module => ({ default: module.SubstanceScreen })))
const PetScreen = lazy(() => import('./components/screens/PetScreen').then(module => ({ default: module.PetScreen })))
const TravelScreen = lazy(() => import('./components/screens/TravelScreen').then(module => ({ default: module.TravelScreen })))
const DatingScreen = lazy(() => import('./components/screens/DatingScreen').then(module => ({ default: module.DatingScreen })))
const VehicleScreen = lazy(() => import('./components/screens/VehicleScreen').then(module => ({ default: module.VehicleScreen })))
const ReligionScreen = lazy(() => import('./components/screens/ReligionScreen').then(module => ({ default: module.ReligionScreen })))
const PoliticsScreen = lazy(() => import('./components/screens/PoliticsScreen').then(module => ({ default: module.PoliticsScreen })))
const ParentingScreen = lazy(() => import('./components/screens/ParentingScreen'))
const MilitaryScreen = lazy(() => import('./components/screens/MilitaryScreen'))
const BodyModScreen = lazy(() => import('./components/screens/BodyModScreen'))
const BeautyScreen = lazy(() => import('./components/screens/BeautyScreen'))
const RetirementScreen = lazy(() => import('./components/screens/RetirementScreen'))
const GamblingScreen = lazy(() => import('./components/screens/GamblingScreen'))
const SexualHealthScreen = lazy(() => import('./components/screens/SexualHealthScreen'))
const CosmeticSurgeryScreen = lazy(() => import('./components/screens/CosmeticSurgeryScreen'))
const ChallengeScreen = lazy(() => import('./components/screens/ChallengeScreen'))
const RibbonsScreen = lazy(() => import('./components/screens/RibbonsScreen'))
const LivingScreen = lazy(() => import('./components/screens/LivingScreen'))
const CausalityTimelineScreen = lazy(() => import('./components/screens/CausalityTimelineScreen'))

// ---- Sub-tab types ----
type DevelopSubTab = 'career' | 'education' | 'finance' | 'social' | 'vehicle' | 'military' | 'living'
type PeopleSubTab = 'relationships' | 'dating' | 'famiglia'
type WellbeingSubTab = 'health' | 'hobby' | 'criminal' | 'substances' | 'pets' | 'religion' | 'body' | 'beauty' | 'gambling' | 'sex_health' | 'cosmetic'
type ProfileSubTab = 'goals' | 'travel' | 'politics' | 'pension' | 'challenges' | 'ribbons' | 'timeline' | 'settings'

function SubTabBar<T extends string>({
  tabs, active, onChange,
}: { tabs: { id: T; label: string; emoji: string }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', flexShrink: 0 }}>
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

function App() {
  // Granular selectors — prevents full re-render on every state change
  const isStarted = useGameStore(s => s.isStarted)
  const isGameOver = useGameStore(s => s.isGameOver)
  const emotionalUI = useGameStore(useShallow(s => EmotionalUIEngine.derive(s)))

  const [ageConfirmed, setAgeConfirmed] = useState(() => !!localStorage.getItem('age_confirmed'))
  const [activeTab, setActiveTab] = useState<Tab>('main')
  const [developSub, setDevelopSub] = useState<DevelopSubTab>('career')
  const [peopleSub, setPeopleSub] = useState<PeopleSubTab>('relationships')
  const [wellbeingSub, setWellbeingSub] = useState<WellbeingSubTab>('health')
  const [profileSub, setProfileSub] = useState<ProfileSubTab>('goals')

  if (!ageConfirmed) return <AgeGate onConfirm={() => setAgeConfirmed(true)} />
  if (!isStarted) return <NewGameScreen />
  if (isGameOver) return <GameOverScreen />

  return (
    <div className={`app-shell ${emotionalUI.className}`} data-emotion={emotionalUI.state}>
      {/* HUD — sticky top */}
      <HUD />

      {/* Sub-tab bars for compound tabs */}
      {activeTab === 'develop' && (
        <SubTabBar<DevelopSubTab>
          tabs={[
            { id: 'career',    label: 'Carriera',  emoji: '💼' },
            { id: 'education', label: 'Istruzione', emoji: '📚' },
            { id: 'finance',   label: 'Finanze',    emoji: '💰' },
            { id: 'social',    label: 'Social',     emoji: '📱' },
            { id: 'vehicle',   label: 'Veicoli',    emoji: '🚗' },
            { id: 'military',  label: 'Militare',   emoji: '🪖' },
            { id: 'living',    label: 'Abitazione', emoji: '🏠' },
          ]}
          active={developSub}
          onChange={setDevelopSub}
        />
      )}
      {activeTab === 'people' && (
        <SubTabBar<PeopleSubTab>
          tabs={[
            { id: 'relationships', label: 'Relazioni', emoji: '👥' },
            { id: 'dating',        label: 'Dating',    emoji: '💘' },
            { id: 'famiglia',      label: 'Famiglia',  emoji: '👨‍👩‍👧‍👦' },
          ]}
          active={peopleSub}
          onChange={setPeopleSub}
        />
      )}
      {activeTab === 'wellbeing' && (
        <SubTabBar<WellbeingSubTab>
          tabs={[
            { id: 'health',     label: 'Salute',    emoji: '💊' },
            { id: 'hobby',      label: 'Hobby',     emoji: '🎸' },
            { id: 'substances', label: 'Sostanze',  emoji: '🍺' },
            { id: 'pets',       label: 'Animali',   emoji: '🐾' },
            { id: 'criminal',   label: 'Crimini',   emoji: '🚔' },
            { id: 'religion',   label: 'Fede',      emoji: '🙏' },
            { id: 'body',        label: 'Body Mod',  emoji: '🎨' },
            { id: 'beauty',      label: 'Beauty',    emoji: '💄' },
            { id: 'gambling',    label: 'Azzardo',   emoji: '🎲' },
            { id: 'sex_health',  label: 'Sess.',     emoji: '❤️' },
            { id: 'cosmetic',    label: 'Estetica',  emoji: '💉' },
          ]}
          active={wellbeingSub}
          onChange={setWellbeingSub}
        />
      )}
      {activeTab === 'profile' && (
        <SubTabBar<ProfileSubTab>
          tabs={[
            { id: 'goals',      label: 'Goals',     emoji: '🎯' },
            { id: 'travel',     label: 'Viaggi',    emoji: '✈️' },
            { id: 'politics',   label: 'Politica',  emoji: '🏛️' },
            { id: 'pension',    label: 'Pensione',  emoji: '🎗️' },
            { id: 'challenges', label: 'Sfide',     emoji: '🏆' },
            { id: 'ribbons',    label: 'Medaglie',  emoji: '🏅' },
            { id: 'timeline',   label: 'Timeline',  emoji: '🧠' },
            { id: 'settings',   label: 'Impost.',   emoji: '⚙️' },
          ]}
          active={profileSub}
          onChange={setProfileSub}
        />
      )}

      {/* Main content area */}
      <div className="app-content">
        {activeTab === 'main' && (
          <div className="main-dashboard">
            <div className="event-panel">
              <EventDisplay />
            </div>
            <div className="event-log-panel">
              <EventLog />
            </div>
          </div>
        )}

        <ErrorBoundary>
          <Suspense fallback={<ScreenFallback />}>
            {activeTab === 'develop' && developSub === 'career'    && <CareerScreen />}
            {activeTab === 'develop' && developSub === 'education' && <EducationScreen />}
            {activeTab === 'develop' && developSub === 'finance'   && <FinanceScreen />}
            {activeTab === 'develop' && developSub === 'social'    && <SocialMediaScreen />}
            {activeTab === 'develop' && developSub === 'vehicle'   && <VehicleScreen />}
            {activeTab === 'develop' && developSub === 'military'  && <MilitaryScreen />}
            {activeTab === 'develop' && developSub === 'living'    && <LivingScreen />}

            {activeTab === 'people' && peopleSub === 'relationships' && <RelationshipScreen />}
            {activeTab === 'people' && peopleSub === 'dating'        && <DatingScreen />}
            {activeTab === 'people' && peopleSub === 'famiglia'      && <ParentingScreen />}

            {activeTab === 'wellbeing' && wellbeingSub === 'health'     && <HealthScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'hobby'      && <HobbyScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'substances' && <SubstanceScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'pets'       && <PetScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'criminal'   && <CriminalScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'religion'   && <ReligionScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'body'       && <BodyModScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'beauty'     && <BeautyScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'gambling'   && <GamblingScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'sex_health' && <SexualHealthScreen />}
            {activeTab === 'wellbeing' && wellbeingSub === 'cosmetic'   && <CosmeticSurgeryScreen />}

            {activeTab === 'profile' && profileSub === 'goals'      && <GoalsScreen />}
            {activeTab === 'profile' && profileSub === 'travel'     && <TravelScreen />}
            {activeTab === 'profile' && profileSub === 'politics'   && <PoliticsScreen />}
            {activeTab === 'profile' && profileSub === 'pension'    && <RetirementScreen />}
            {activeTab === 'profile' && profileSub === 'challenges' && <ChallengeScreen />}
            {activeTab === 'profile' && profileSub === 'ribbons'    && <RibbonsScreen />}
            {activeTab === 'profile' && profileSub === 'timeline'   && <CausalityTimelineScreen />}
            {activeTab === 'profile' && profileSub === 'settings'   && <SettingsScreen />}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Age button — above bottom tabs, only on main tab */}
      <AgeButton />

      {/* Bottom navigation */}
      <BottomTabs active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

export default App
