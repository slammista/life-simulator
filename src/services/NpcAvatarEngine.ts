// NpcAvatarEngine — modular, BitLife-style NPC avatar generation.
//
// Produces a full `AvatarConfig` deterministically from an NPC seed (its id),
// so every NPC gets a stable, unique face that survives reloads WITHOUT having
// to persist anything (mirrors the approach in NpcAttributes.ts). The config
// is drawn by the very same renderer used for the player, guaranteeing an
// identical graphic style.
//
// Modular asset pools (one per requested category):
//   capelli  → HAIR_STYLES / HAIR_COLORS
//   occhi    → EYE_STYLES / EYE_COLORS
//   bocche   → MOUTH_STYLES
//   barbe    → BEARD_STYLES
//   occhiali → GLASSES (subset of accessories)
//   vestiti  → CLOTHES_STYLES

import type {
  AvatarConfig, Gender, SkinTone, AvatarHairStyle, AvatarHairColor,
  EyeStyle, EyeColor, BrowStyle, BeardStyle, MouthStyle, AvatarClothesStyle, AvatarAccessory,
  Relationship,
} from '../store/types'

// ---- Deterministic hashing (stable 0..1 per seed+salt) ----

function hash01(str: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

function pick<T>(arr: readonly T[], seed: string, salt: number): T {
  return arr[Math.floor(hash01(seed, salt) * arr.length) % arr.length]
}

// Weighted pick — `weights` parallels `arr`.
function pickWeighted<T>(arr: readonly T[], weights: readonly number[], seed: string, salt: number): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = hash01(seed, salt) * total
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i]
    if (r <= 0) return arr[i]
  }
  return arr[arr.length - 1]
}

// ---- Modular asset pools ----

const SKIN_TONES: readonly SkinTone[] = ['light', 'medium_light', 'medium', 'medium_dark', 'dark']

const HAIR_MALE:   readonly AvatarHairStyle[] = ['buzz', 'short', 'short', 'medium', 'curly', 'afro', 'bald']
const HAIR_FEMALE: readonly AvatarHairStyle[] = ['medium', 'long', 'long', 'wavy', 'curly', 'bun', 'ponytail', 'afro', 'short']
const HAIR_ENBY:   readonly AvatarHairStyle[] = ['short', 'medium', 'wavy', 'curly', 'long', 'buzz', 'bun', 'afro']

const HAIR_COLORS: readonly AvatarHairColor[] = [
  'black', 'dark_brown', 'brown', 'light_brown', 'blonde', 'red', 'auburn',
]
const HAIR_COLOR_WEIGHTS: readonly number[] = [20, 22, 18, 12, 12, 5, 6]
// Rare vivid dye colours, applied for a small fraction of NPCs.
const HAIR_DYES: readonly AvatarHairColor[] = ['blue', 'pink']

const EYE_STYLES: readonly EyeStyle[] = ['round', 'almond', 'wide', 'narrow']
const EYE_COLORS: readonly EyeColor[] = ['brown', 'dark_brown', 'brown', 'hazel', 'blue', 'green', 'gray', 'amber']
const BROW_STYLES: readonly BrowStyle[] = ['thin', 'medium', 'medium', 'thick', 'arched']

const MOUTH_STYLES: readonly MouthStyle[] = ['smile', 'neutral', 'grin', 'smirk', 'frown']
const MOUTH_WEIGHTS: readonly number[] = [34, 30, 16, 14, 6]

const MALE_BEARDS: readonly BeardStyle[] = ['none', 'none', 'none', 'stubble', 'short', 'full', 'goatee', 'mustache']

const CLOTHES_STYLES: readonly AvatarClothesStyle[] = ['casual', 'casual', 'formal', 'sporty', 'elegant', 'punk', 'traditional']

const GLASSES: readonly AvatarAccessory[] = ['glasses_round', 'glasses_square', 'sunglasses']

export interface NpcAvatarOpts {
  age?: number
  looks?: number       // 0..100 — nudges grooming/expression
  happiness?: number   // 0..100 — nudges mouth expression
}

// Generate a complete, deterministic avatar for an NPC seed.
export function generateNpcAvatar(seed: string, gender: Gender, opts: NpcAvatarOpts = {}): AvatarConfig {
  const looks = opts.looks
  const happiness = opts.happiness

  // Hair style by gender.
  const hairPool = gender === 'female' ? HAIR_FEMALE : gender === 'non_binary' ? HAIR_ENBY : HAIR_MALE
  const hairStyle = pick(hairPool, seed, 21)

  // Hair colour — mostly natural, rare vivid dye (~6%), never on young children.
  const ageForHair = opts.age ?? 25
  const hairColor: AvatarHairColor = (ageForHair >= 12 && hash01(seed, 22) < 0.06)
    ? pick(HAIR_DYES, seed, 23)
    : pickWeighted(HAIR_COLORS, HAIR_COLOR_WEIGHTS, seed, 24)

  // Beard only for masculine presentation, and never on children.
  const age = opts.age ?? 25
  let beardStyle: BeardStyle = 'none'
  if (age >= 16) {
    if (gender === 'male') beardStyle = pick(MALE_BEARDS, seed, 25)
    else if (gender === 'non_binary' && hash01(seed, 25) < 0.18) beardStyle = pick(['stubble', 'short', 'goatee'] as const, seed, 26)
  }

  // Mouth — base distribution, biased happier when happiness is known.
  let mouthStyle = pickWeighted(MOUTH_STYLES, MOUTH_WEIGHTS, seed, 27)
  if (typeof happiness === 'number') {
    if (happiness >= 70 && mouthStyle === 'frown') mouthStyle = 'smile'
    if (happiness <= 25 && (mouthStyle === 'grin' || mouthStyle === 'smile') && hash01(seed, 28) < 0.6) mouthStyle = 'neutral'
  }

  // Accessory — usually none. Glasses ~16%, hats ~8%, scaled a touch by looks.
  let accessory: AvatarAccessory = 'none'
  const accRoll = hash01(seed, 29)
  if (accRoll < 0.16) accessory = pick(GLASSES, seed, 30)
  else if (accRoll < 0.24) accessory = pick(['hat_cap', 'hat_beanie', 'hat_fedora'] as const, seed, 31)
  // High-looks NPCs lean a bit more toward sunglasses for flair.
  if (typeof looks === 'number' && looks >= 80 && accessory === 'none' && hash01(seed, 32) < 0.25) {
    accessory = 'sunglasses'
  }

  // Brow — tidier/arched a bit more often for high-looks NPCs.
  let browStyle = pick(BROW_STYLES, seed, 33)
  if (typeof looks === 'number' && looks >= 75 && hash01(seed, 34) < 0.4) browStyle = 'arched'

  return {
    skinTone:     pick(SKIN_TONES, seed, 35),
    hairStyle,
    hairColor,
    eyeStyle:     pick(EYE_STYLES, seed, 36),
    eyeColor:     pick(EYE_COLORS, seed, 37),
    browStyle,
    beardStyle,
    clothesStyle: pick(CLOTHES_STYLES, seed, 38),
    accessory,
    mouthStyle,
  }
}

// Return an NPC's avatar: an explicit (God Mode) avatar wins, otherwise a
// deterministic one generated from the NPC's stable identity + stats.
export function ensureNpcAvatar(rel: Relationship): AvatarConfig {
  if (rel.avatar) return rel.avatar
  const seed = rel.npcId || rel.id || rel.name
  return generateNpcAvatar(seed, rel.gender, {
    age:       rel.age,
    looks:     rel.extendedAttributes?.looks,
    happiness: rel.extendedAttributes?.happiness,
  })
}

// Lightweight variant for NPCs that aren't full Relationships (Work/School).
export function ensureNpcAvatarById(id: string, gender: Gender, opts: NpcAvatarOpts = {}): AvatarConfig {
  return generateNpcAvatar(id, gender, opts)
}
