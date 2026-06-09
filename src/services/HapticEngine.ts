export function haptic(type: 'tap' | 'success' | 'error' | 'heavy' = 'tap') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  const patterns: Record<string, number | number[]> = {
    tap:     10,
    success: [10, 40, 10],
    error:   [40, 25, 40],
    heavy:   40,
  }
  navigator.vibrate(patterns[type])
}
