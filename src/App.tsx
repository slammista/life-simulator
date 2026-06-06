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

// ---- Sub-tab types ----
type DevelopSubTab = 'career' | 'education' | 'finance'
type WellbeingSubTab = 'health' | 'hobby' | 'criminal'
type ProfileSubTab = 'goals' | 'settings'

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
            { id: 'career', label: 'Carriera', emoji: '💼' },
            { id: 'education', label: 'Istruzione', emoji: '📚' },
            { id: 'finance', label: 'Finanze', emoji: '💰' },
          ]}
          active={developSub}
          onChange={setDevelopSub}
        />
      )}
      {activeTab === 'wellbeing' && (
        <SubTabBar<WellbeingSubTab>
          tabs={[
            { id: 'health', label: 'Salute', emoji: '💊' },
            { id: 'hobby', label: 'Hobby', emoji: '🎸' },
            { id: 'criminal', label: 'Crimini', emoji: '🚔' },
          ]}
          active={wellbeingSub}
          onChange={setWellbeingSub}
        />
      )}
      {activeTab === 'profile' && (
        <SubTabBar<ProfileSubTab>
          tabs={[
            { id: 'goals', label: 'Goals', emoji: '🎯' },
            { id: 'settings', label: 'Impostazioni', emoji: '⚙️' },
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
        {activeTab === 'develop' && developSub === 'education'  && <EducationScreen />}
        {activeTab === 'develop' && developSub === 'finance'    && <FinanceScreen />}

        {activeTab === 'people' && <RelationshipScreen />}

        {activeTab === 'wellbeing' && wellbeingSub === 'health'   && <HealthScreen />}
        {activeTab === 'wellbeing' && wellbeingSub === 'hobby'    && <HobbyScreen />}
        {activeTab === 'wellbeing' && wellbeingSub === 'criminal' && <CriminalScreen />}

        {activeTab === 'profile' && profileSub === 'goals'    && <GoalsScreen />}
        {activeTab === 'profile' && profileSub === 'settings' && <SettingsScreen />}
      </div>

      {/* Age button — above bottom tabs, only on main tab */}
      <AgeButton />

      {/* Bottom navigation */}
      <BottomTabs active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

export default App
