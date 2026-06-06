import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { HUD } from './components/game/HUD'
import { EventDisplay } from './components/game/EventDisplay'
import { EventLog } from './components/game/EventLog'
import { AgeButton } from './components/game/AgeButton'
import { BottomTabs, type Tab } from './components/navigation/BottomTabs'
import { CareerScreen } from './components/screens/CareerScreen'
import { RelationshipScreen } from './components/screens/RelationshipScreen'
import { GoalsScreen } from './components/screens/GoalsScreen'
import { SettingsScreen } from './components/screens/SettingsScreen'
import { NewGameScreen } from './components/screens/NewGameScreen'
import { GameOverScreen } from './components/screens/GameOverScreen'
import { EducationScreen } from './components/screens/EducationScreen'
import { HealthScreen } from './components/screens/HealthScreen'
import { HobbyScreen } from './components/screens/HobbyScreen'
import { FinanceScreen } from './components/screens/FinanceScreen'
import { CriminalScreen } from './components/screens/CriminalScreen'
import { SocialMediaScreen } from './components/screens/SocialMediaScreen'
import { SubstanceScreen } from './components/screens/SubstanceScreen'
import { PetScreen } from './components/screens/PetScreen'
import { TravelScreen } from './components/screens/TravelScreen'
import { DatingScreen } from './components/screens/DatingScreen'
import { VehicleScreen } from './components/screens/VehicleScreen'
import { ReligionScreen } from './components/screens/ReligionScreen'
import { PoliticsScreen } from './components/screens/PoliticsScreen'
import ParentingScreen from './components/screens/ParentingScreen'
import MilitaryScreen from './components/screens/MilitaryScreen'
import BodyModScreen from './components/screens/BodyModScreen'
import BeautyScreen from './components/screens/BeautyScreen'
import RetirementScreen from './components/screens/RetirementScreen'
import GamblingScreen from './components/screens/GamblingScreen'
import SexualHealthScreen from './components/screens/SexualHealthScreen'
import CosmeticSurgeryScreen from './components/screens/CosmeticSurgeryScreen'
import ChallengeScreen from './components/screens/ChallengeScreen'
import RibbonsScreen from './components/screens/RibbonsScreen'

// ---- Sub-tab types ----
type DevelopSubTab = 'career' | 'education' | 'finance' | 'social' | 'vehicle' | 'military'
type PeopleSubTab = 'relationships' | 'dating' | 'famiglia'
type WellbeingSubTab = 'health' | 'hobby' | 'criminal' | 'substances' | 'pets' | 'religion' | 'body' | 'beauty' | 'gambling' | 'sex_health' | 'cosmetic'
type ProfileSubTab = 'goals' | 'travel' | 'politics' | 'pension' | 'challenges' | 'ribbons' | 'settings'

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

function App() {
  const { isStarted, isGameOver } = useGameStore()
  const [activeTab, setActiveTab] = useState<Tab>('main')
  const [developSub, setDevelopSub] = useState<DevelopSubTab>('career')
  const [peopleSub, setPeopleSub] = useState<PeopleSubTab>('relationships')
  const [wellbeingSub, setWellbeingSub] = useState<WellbeingSubTab>('health')
  const [profileSub, setProfileSub] = useState<ProfileSubTab>('goals')

  if (!isStarted) return <NewGameScreen />
  if (isGameOver) return <GameOverScreen />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', overflow: 'hidden' }}>
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
            { id: 'settings',   label: 'Impost.',   emoji: '⚙️' },
          ]}
          active={profileSub}
          onChange={setProfileSub}
        />
      )}

      {/* Main content area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'main' && (
          <>
            <EventDisplay />
            <EventLog />
          </>
        )}

        {activeTab === 'develop' && developSub === 'career'    && <CareerScreen />}
        {activeTab === 'develop' && developSub === 'education' && <EducationScreen />}
        {activeTab === 'develop' && developSub === 'finance'   && <FinanceScreen />}
        {activeTab === 'develop' && developSub === 'social'    && <SocialMediaScreen />}
        {activeTab === 'develop' && developSub === 'vehicle'   && <VehicleScreen />}
        {activeTab === 'develop' && developSub === 'military'  && <MilitaryScreen />}

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
        {activeTab === 'profile' && profileSub === 'settings'   && <SettingsScreen />}
      </div>

      {/* Age button — above bottom tabs, only on main tab */}
      <AgeButton />

      {/* Bottom navigation */}
      <BottomTabs active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

export default App
