import type { GameState } from '../store/types'

export type EmotionalUIState = 'stable' | 'happy' | 'depressed' | 'stressed' | 'sick' | 'wealthy' | 'danger'

export interface EmotionalUIResult {
  state: EmotionalUIState
  className: string
  label: string
  intensity: number
}

export class EmotionalUIEngine {
  static derive(state: GameState): EmotionalUIResult {
    const { stats, finance, health, fame } = state
    const debtPressure = finance.debt > Math.max(5000, finance.money * 2)
    const traumaPressure = (health.traumas ?? []).some(trauma => !trauma.resolved && trauma.intensity >= 70)
    const diseases = health.diseases ?? []
    const fameScore = fame?.fame ?? 0

    if (stats.health < 25 || diseases.some(d => d.severity >= 4 && !d.isTreated)) {
      return { state: 'sick', className: 'emotion-sick', label: 'Malato', intensity: Math.round(100 - stats.health) }
    }
    if (stats.mentalHealth < 25 || traumaPressure) {
      return { state: 'depressed', className: 'emotion-depressed', label: 'Depresso', intensity: Math.round(100 - stats.mentalHealth) }
    }
    if (stats.energy < 20 || debtPressure || state.career.burnoutLevel > 70) {
      return { state: 'stressed', className: 'emotion-stressed', label: 'Stressato', intensity: Math.round(Math.max(100 - stats.energy, state.career.burnoutLevel, debtPressure ? 70 : 0)) }
    }
    if (stats.health < 8 || stats.mentalHealth < 8 || finance.money < -50000) {
      return { state: 'danger', className: 'emotion-danger', label: 'Pericolo', intensity: 95 }
    }
    if (finance.money + finance.investments.reduce((sum, inv) => sum + inv.currentValue, 0) > 500000 || fameScore >= 75) {
      return { state: 'wealthy', className: 'emotion-wealthy', label: 'Status alto', intensity: Math.min(100, Math.round((finance.money / 10000) + fameScore)) }
    }
    if (stats.happiness >= 75 && stats.mentalHealth >= 65) {
      return { state: 'happy', className: 'emotion-happy', label: 'Felice', intensity: Math.round(stats.happiness) }
    }
    return { state: 'stable', className: 'emotion-stable', label: 'Stabile', intensity: 50 }
  }
}
