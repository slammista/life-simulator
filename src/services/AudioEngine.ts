// Web Audio API synthesizer — no binary files required

type SFXType = 'ageUp' | 'success' | 'fail' | 'click' | 'event' | 'levelUp' | 'death'

class AudioEngineClass {
  private ctx: AudioContext | null = null
  private enabled = true

  private getCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null
    if (!this.ctx) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        this.ctx = new Ctx()
      } catch { return null }
    }
    // Resume if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.25, delay = 0) {
    const ctx = this.getCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
    gain.gain.setValueAtTime(0.001, ctx.currentTime + delay)
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + duration + 0.02)
  }

  setEnabled(on: boolean) {
    this.enabled = on
    if (!on && this.ctx) {
      this.ctx.suspend().catch(() => {})
    } else if (on && this.ctx) {
      this.ctx.resume().catch(() => {})
    }
  }

  playSFX(type: SFXType) {
    switch (type) {
      case 'ageUp':
        // Happy ascending ding-ding-ding
        this.tone(440, 0.12, 'sine', 0.3, 0.00)
        this.tone(550, 0.12, 'sine', 0.3, 0.10)
        this.tone(660, 0.20, 'sine', 0.4, 0.20)
        break
      case 'success':
        // Soft chime up
        this.tone(523, 0.10, 'sine', 0.28, 0.00)
        this.tone(659, 0.18, 'sine', 0.32, 0.08)
        break
      case 'fail':
        // Descending buzzy
        this.tone(330, 0.12, 'sawtooth', 0.18, 0.00)
        this.tone(220, 0.22, 'sawtooth', 0.14, 0.10)
        break
      case 'click':
        // Tiny tap
        this.tone(900, 0.035, 'sine', 0.18, 0.00)
        break
      case 'event':
        // Bright notification
        this.tone(880, 0.07, 'sine', 0.22, 0.00)
        this.tone(1100, 0.12, 'sine', 0.18, 0.07)
        break
      case 'levelUp':
        // Four-note ascend
        ;[523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'sine', 0.35, i * 0.13))
        break
      case 'death':
        // Solemn descending tone
        this.tone(220, 0.40, 'sine', 0.30, 0.00)
        this.tone(165, 0.50, 'sine', 0.22, 0.35)
        this.tone(110, 0.70, 'sine', 0.15, 0.75)
        break
    }
  }
}

export const AudioEngine = new AudioEngineClass()
