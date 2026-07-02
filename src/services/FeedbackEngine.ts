// Thin composition of haptic + audio feedback for the common action outcomes.
// Does not replace HapticEngine's `haptic()` — existing call sites keep working unchanged.

import { haptic } from './HapticEngine'
import { AudioEngine, type SFXType } from './AudioEngine'

type FeedbackType = 'tap' | 'success' | 'error' | 'heavy'

// 'heavy' has no default SFX: its only current use (age-up) already plays 'ageUp'
// explicitly, and giving it a generic chime risks a semantically wrong sound for
// future non-age-up "heavy" actions.
const SFX_MAP: Partial<Record<FeedbackType, SFXType>> = {
  tap: 'click',
  success: 'success',
  error: 'fail',
}

export function feedback(type: FeedbackType) {
  haptic(type)
  const sfx = SFX_MAP[type]
  if (sfx) AudioEngine.playSFX(sfx)
}
