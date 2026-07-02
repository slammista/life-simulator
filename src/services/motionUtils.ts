// canvas-confetti has no built-in `prefers-reduced-motion` awareness (unlike
// `motion`'s `MotionConfig`), so every confetti call site must gate on this.
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
