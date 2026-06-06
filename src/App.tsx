import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import { HUD } from './components/game/HUD'
import { EventDisplay } from './components/game/EventDisplay'
import { EventLog } from './components/game/EventLog'
import { AgeButton } from './components/game/AgeButton'
import { BottomTabs } from './components/navigation/BottomTabs'
import { CareerScreen } from './components/screens/CareerScreen'
import { RelationshipScreen } from './components/screens/RelationshipScreen'
import { GoalsScreen } from './components/screens/GoalsScreen'
import { SettingsScreen } from './components/screens/SettingsScreen'
import { NewGameScreen } from './components/screens/NewGameScreen'
import { GameOverScreen } from './components/screens/GameOverScreen'

type Tab = 'main' | 'career' | 'relations' | 'goals' | 'settings'

function App() {
  const { isStarted, isGameOver } = useGameStore()
  const [activeTab, setActiveTab] = useState<Tab>('main')

  if (!isStarted) {
    return <NewGameScreen />
  }

  if (isGameOver) {
    return <GameOverScreen />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', overflow: 'hidden' }}>
      {/* HUD — sticky top */}
      <HUD />

      {/* Main content area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'main' && (
          <>
            <EventDisplay />
            <EventLog />
          </>
        )}
        {activeTab === 'career' && <CareerScreen />}
        {activeTab === 'relations' && <RelationshipScreen />}
        {activeTab === 'goals' && <GoalsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </div>

      {/* Age button — above bottom tabs */}
      <AgeButton />

      {/* Bottom navigation */}
      <BottomTabs active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

export default App
