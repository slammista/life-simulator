// Web Audio API engine — SFX synthesis + BGM file playback

export type SFXType = 'ageUp' | 'success' | 'fail' | 'click' | 'event' | 'levelUp' | 'death' | 'achievement' | 'purchase'

// ─── BGM loop config ──────────────────────────────────────────────────────────
// After the first full playthrough the track loops back to this timestamp.
// Set to 0 to loop the entire track. Adjust once you know the intro length.
// horacio1.mp3 is 174s total; change this to the exact second the main loop begins.
const BGM_LOOP_START_SECONDS = 0   // ← adjust to skip intro on repeat (e.g. 8.0)
const BGM_VOLUME = 0.35
// ─────────────────────────────────────────────────────────────────────────────

class AudioEngineClass {
  private ctx: AudioContext | null = null
  private enabled = true

  // BGM state
  private bgBuffer: AudioBuffer | null = null
  private bgSource: AudioBufferSourceNode | null = null
  private bgGain: GainNode | null = null
  private bgLoaded = false
  private bgLoading = false
  private bgPaused = false

  // ── Context ──────────────────────────────────────────────────────────────
  private getCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null
    if (!this.ctx) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        this.ctx = new Ctx()
      } catch { return null }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
    return this.ctx
  }

  // ── SFX synthesis ────────────────────────────────────────────────────────
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
    if (!on) {
      this.stopBGM()
      this.ctx?.suspend().catch(() => {})
    } else {
      this.ctx?.resume().catch(() => {})
    }
  }

  playSFX(type: SFXType) {
    if (!this.enabled) return
    switch (type) {
      case 'ageUp':
        this.tone(440, 0.12, 'sine', 0.3, 0.00)
        this.tone(550, 0.12, 'sine', 0.3, 0.10)
        this.tone(660, 0.20, 'sine', 0.4, 0.20)
        break
      case 'success':
        this.tone(523, 0.10, 'sine', 0.28, 0.00)
        this.tone(659, 0.18, 'sine', 0.32, 0.08)
        break
      case 'fail':
        this.tone(330, 0.12, 'sawtooth', 0.18, 0.00)
        this.tone(220, 0.22, 'sawtooth', 0.14, 0.10)
        break
      case 'click':
        this.tone(900, 0.035, 'sine', 0.18, 0.00)
        break
      case 'event':
        this.tone(880, 0.07, 'sine', 0.22, 0.00)
        this.tone(1100, 0.12, 'sine', 0.18, 0.07)
        break
      case 'levelUp':
        ;[523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'sine', 0.35, i * 0.13))
        break
      case 'death':
        this.tone(220, 0.40, 'sine', 0.30, 0.00)
        this.tone(165, 0.50, 'sine', 0.22, 0.35)
        this.tone(110, 0.70, 'sine', 0.15, 0.75)
        break
      case 'achievement':
        // 5-note ascending arpeggio — richer/longer than 'levelUp' so a ribbon/goal
        // unlock never sounds identical to a legendary random event.
        ;[523, 659, 784, 988, 1319].forEach((f, i) => this.tone(f, 0.18, 'sine', 0.32, i * 0.09))
        break
      case 'purchase':
        this.tone(784, 0.08, 'sine', 0.22, 0.00)
        this.tone(587, 0.14, 'sine', 0.20, 0.07)
        break
    }
  }

  // ── BGM ──────────────────────────────────────────────────────────────────

  async loadBGM(url: string): Promise<void> {
    if (this.bgLoaded || this.bgLoading) return
    const ctx = this.getCtx()
    if (!ctx) return
    this.bgLoading = true
    try {
      const res = await fetch(url)
      const buf = await res.arrayBuffer()
      this.bgBuffer = await ctx.decodeAudioData(buf)
      this.bgLoaded = true
    } catch (e) {
      console.warn('[AudioEngine] BGM load failed', e)
    } finally {
      this.bgLoading = false
    }
  }

  playBGM() {
    if (!this.enabled || !this.bgBuffer) return
    const ctx = this.getCtx()
    if (!ctx) return
    this._startBGMSource()
  }

  private _startBGMSource(offset = 0) {
    const ctx = this.getCtx()
    if (!ctx || !this.bgBuffer) return
    this.stopBGM(false)

    const gain = ctx.createGain()
    gain.gain.value = BGM_VOLUME
    gain.connect(ctx.destination)

    const src = ctx.createBufferSource()
    src.buffer = this.bgBuffer
    src.loop = true
    // After the first complete playthrough, loop back to BGM_LOOP_START_SECONDS.
    // This gives: intro once → seamless main loop on every repeat.
    src.loopStart = BGM_LOOP_START_SECONDS
    src.loopEnd = this.bgBuffer.duration
    src.connect(gain)
    src.start(0, offset)

    this.bgSource = src
    this.bgGain = gain
    this.bgPaused = false
  }

  stopBGM(clearBuffer = false) {
    if (this.bgSource) {
      try { this.bgSource.stop() } catch { /* already stopped */ }
      this.bgSource = null
    }
    if (clearBuffer) {
      this.bgBuffer = null
      this.bgLoaded = false
    }
  }

  fadeBGM(targetVol: number, durationSec = 1.5) {
    const ctx = this.getCtx()
    if (!ctx || !this.bgGain) return
    this.bgGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + durationSec)
  }

  isBGMPlaying(): boolean {
    return this.bgSource !== null && !this.bgPaused
  }
}

export const AudioEngine = new AudioEngineClass()
