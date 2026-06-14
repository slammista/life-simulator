// Shared helpers for NPC extended attributes (BitLife-style profile stats).
// Guarantees every relationship exposes a full attribute set even when the
// stored object predates the field (old saves) — values are derived
// deterministically from the NPC id + existing relationship metrics so they
// stay stable across renders.

import type {
  Relationship,
  NPCExtendedAttributes,
  SexualOrientation,
  PoliticalOrientation,
  Religion,
} from '../store/types'

const SEXUALITIES: SexualOrientation[] = ['heterosexual', 'homosexual', 'bisexual', 'pansexual', 'asexual']
const POLITICS: PoliticalOrientation[] = ['sinistra', 'centro-sinistra', 'centro', 'centro-destra', 'destra', 'apolitico']
const RELIGIONS: Religion[] = ['catholicism', 'islam', 'buddhism', 'hinduism', 'judaism', 'protestantism', 'orthodoxy', 'atheism', 'agnosticism', 'other']

// Cheap stable hash from a string → 0..1
function hash01(str: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // force unsigned, normalize
  return ((h >>> 0) % 10000) / 10000
}

const pct = (str: string, salt: number, min = 0, max = 100) =>
  Math.round(min + hash01(str, salt) * (max - min))

const pick = <T,>(arr: T[], str: string, salt: number): T =>
  arr[Math.floor(hash01(str, salt) * arr.length) % arr.length]

// Returns a complete attribute set, filling any missing field deterministically.
export function ensureNpcAttributes(rel: Relationship): NPCExtendedAttributes {
  const seed = rel.npcId || rel.id || rel.name
  const existing = rel.extendedAttributes
  return {
    craziness:     existing?.craziness     ?? pct(seed, 1),
    fertility:     existing?.fertility     ?? pct(seed, 2),
    willpower:     existing?.willpower     ?? pct(seed, 3),
    smarts:        existing?.smarts        ?? pct(seed, 4),
    // Derive BitLife stats from relationship metrics when possible for coherence
    happiness:     existing?.happiness     ?? clampStat(50 + (rel.love - 40) * 0.3 + hash01(seed, 5) * 20),
    health:        existing?.health        ?? clampStat(Math.max(20, 95 - rel.age * 0.6 + hash01(seed, 6) * 20)),
    looks:         existing?.looks         ?? clampStat(rel.attraction * 0.6 + 25 + hash01(seed, 7) * 20),
    generosity:    existing?.generosity    ?? pct(seed, 8),
    religiousness: existing?.religiousness ?? pct(seed, 9),
    sexuality:     existing?.sexuality     ?? pick(SEXUALITIES, seed, 10),
    politics:      existing?.politics      ?? pick(POLITICS, seed, 11),
    religion:      existing?.religion      ?? pick(RELIGIONS, seed, 12),
  }
}

function clampStat(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

// UI metadata for the numeric attributes, in BitLife display order.
export const NPC_ATTR_META: { key: keyof NPCExtendedAttributes; label: string; emoji: string }[] = [
  { key: 'craziness',     label: 'Follia',        emoji: '🤪' },
  { key: 'generosity',    label: 'Generosità',    emoji: '🎁' },
  { key: 'happiness',     label: 'Felicità',      emoji: '😊' },
  { key: 'health',        label: 'Salute',        emoji: '❤️' },
  { key: 'looks',         label: 'Aspetto',       emoji: '✨' },
  { key: 'religiousness', label: 'Religiosità',   emoji: '🙏' },
  { key: 'smarts',        label: 'Intelligenza',  emoji: '🧠' },
  { key: 'willpower',     label: 'Volontà',       emoji: '💪' },
]

export const SEXUALITY_LABELS: Record<SexualOrientation, string> = {
  heterosexual: 'Etero',
  homosexual:   'Omosessuale',
  bisexual:     'Bisessuale',
  pansexual:    'Pansessuale',
  asexual:      'Asessuale',
}
