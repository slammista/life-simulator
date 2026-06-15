// Framework-agnostic avatar drawing — the single source of truth for the
// player AND every NPC, so the graphic style is *exactly* identical everywhere.
//
// `AvatarRenderer.tsx` renders the inner markup produced here (so the live app
// and the offline preview gallery cannot drift apart). The standalone
// `buildAvatarSvg()` wraps that markup in a full <svg> element for use in
// preview generation, exports, or anywhere a plain SVG string is needed.

import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTHES_COLORS, applyAgeToConfig,
} from './AvatarEngine'
import type {
  AvatarConfig, AvatarHairStyle, EyeStyle, BrowStyle, BeardStyle, MouthStyle, AvatarAccessory,
} from '../store/types'

export function darken(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const d = (ch: number) => Math.max(0, Math.floor(ch * (1 - amt))).toString(16).padStart(2, '0')
  return `#${d((n >> 16) & 255)}${d((n >> 8) & 255)}${d(n & 255)}`
}

export function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const l = (ch: number) => Math.min(255, Math.round(ch + (255 - ch) * amt)).toString(16).padStart(2, '0')
  return `#${l((n >> 16) & 255)}${l((n >> 8) & 255)}${l(n & 255)}`
}

// ---- Modular asset pieces (return SVG markup strings) ----

function hairBack(style: AvatarHairStyle, fill: string): string {
  switch (style) {
    case 'bald':
    case 'buzz':
    case 'short':
      return ''
    case 'medium':
      return `<rect x="18" y="31" width="8" height="22" rx="4" fill="${fill}"/>`
           + `<rect x="74" y="31" width="8" height="22" rx="4" fill="${fill}"/>`
    case 'long':
      return `<rect x="15" y="28" width="10" height="54" rx="5" fill="${fill}"/>`
           + `<rect x="75" y="28" width="10" height="54" rx="5" fill="${fill}"/>`
    case 'wavy':
      return `<path d="M 18 32 C 12 40 15 48 18 54 C 12 60 15 68 19 72 L 27 72 C 23 68 26 60 22 54 C 25 48 22 40 28 32 Z" fill="${fill}"/>`
           + `<path d="M 82 32 C 88 40 85 48 82 54 C 88 60 85 68 81 72 L 73 72 C 77 68 74 60 78 54 C 75 48 78 40 72 32 Z" fill="${fill}"/>`
    case 'curly':
      return `<ellipse cx="21" cy="48" rx="7" ry="18" fill="${fill}"/>`
           + `<ellipse cx="79" cy="48" rx="7" ry="18" fill="${fill}"/>`
           + `<ellipse cx="50" cy="14" rx="20" ry="10" fill="${fill}"/>`
    case 'afro':
      return `<ellipse cx="50" cy="28" rx="34" ry="26" fill="${fill}"/>`
    case 'ponytail':
      return `<path d="M 70 26 Q 86 22 90 36 Q 92 50 82 56 Q 78 44 76 36 Q 73 30 70 26 Z" fill="${fill}"/>`
    case 'bun':
      return `<ellipse cx="50" cy="11" rx="11" ry="9" fill="${fill}"/>`
    default:
      return ''
  }
}

function babyHairTuft(fill: string): string {
  return `<path d="M 47 18 Q 45 10 44 16" stroke="${fill}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
       + `<path d="M 51 16 Q 52 8 53 14" stroke="${fill}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
       + `<path d="M 56 18 Q 58 10 57 16" stroke="${fill}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
}

function hairCap(style: AvatarHairStyle, fill: string, clipId: string): string {
  if (style === 'bald') return ''
  const inner = style === 'buzz'
    ? `<rect x="24" y="16" width="52" height="11" rx="5.5" fill="${fill}"/>`
    : `<circle cx="50" cy="18" r="28" fill="${fill}"/>`
  return `<g clip-path="url(#${clipId})">${inner}</g>`
}

function eyes(style: EyeStyle, fill: string): string {
  const positions = [40, 60]
  return positions.map(cx => {
    if (style === 'almond') return (
      `<g><ellipse cx="${cx}" cy="44" rx="4.5" ry="3" fill="white"/>`
      + `<circle cx="${cx}" cy="44" r="2" fill="${fill}"/>`
      + `<circle cx="${cx}" cy="44" r="1.1" fill="#111"/>`
      + `<circle cx="${cx + 0.9}" cy="43" r="0.55" fill="white"/></g>`
    )
    if (style === 'wide') return (
      `<g><circle cx="${cx}" cy="44" r="5" fill="white"/>`
      + `<circle cx="${cx}" cy="44" r="3" fill="${fill}"/>`
      + `<circle cx="${cx}" cy="44" r="1.6" fill="#111"/>`
      + `<circle cx="${cx + 1}" cy="43" r="0.7" fill="white"/></g>`
    )
    if (style === 'narrow') return (
      `<g><ellipse cx="${cx}" cy="44" rx="5" ry="2.5" fill="white"/>`
      + `<circle cx="${cx}" cy="44" r="1.8" fill="${fill}"/>`
      + `<circle cx="${cx}" cy="44" r="1" fill="#111"/></g>`
    )
    // round (default)
    return (
      `<g><circle cx="${cx}" cy="44" r="4" fill="white"/>`
      + `<circle cx="${cx}" cy="44" r="2.5" fill="${fill}"/>`
      + `<circle cx="${cx}" cy="44" r="1.4" fill="#111"/>`
      + `<circle cx="${cx + 0.9}" cy="43.2" r="0.65" fill="white"/></g>`
    )
  }).join('')
}

function brows(style: BrowStyle, color: string): string {
  const sw = style === 'thick' ? 2.5 : style === 'thin' ? 0.9 : 1.6
  const arch = style === 'arched'
  return `<path d="${arch ? 'M 35 38 Q 40 32 45 37' : 'M 35 37 Q 40 35 45 37'}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`
       + `<path d="${arch ? 'M 55 37 Q 60 32 65 38' : 'M 55 37 Q 60 35 65 37'}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`
}

function mouth(style: MouthStyle, skinHex: string): string {
  const lipStroke = darken(skinHex, 0.3)
  switch (style) {
    case 'neutral':
      return `<path d="M 43 59 L 57 59" stroke="${lipStroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    case 'grin':
      // Open happy mouth with a hint of teeth, same line weight as the rest.
      return `<path d="M 43 57 Q 50 67 57 57 Z" fill="${darken(skinHex, 0.55)}" stroke="${lipStroke}" stroke-width="1.2" stroke-linejoin="round"/>`
           + `<path d="M 44.5 58 Q 50 60 55.5 58 L 55 60 Q 50 61.5 45 60 Z" fill="#fff" opacity="0.92"/>`
    case 'frown':
      return `<path d="M 43 61 Q 50 56 57 61" stroke="${lipStroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    case 'smirk':
      return `<path d="M 43 59 Q 50 61 57 56" stroke="${lipStroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    case 'smile':
    default:
      return `<path d="M 43 58 Q 50 63 57 58" stroke="${lipStroke}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
  }
}

function beard(style: BeardStyle, fill: string): string {
  if (style === 'none') return ''
  if (style === 'stubble') return `<ellipse cx="50" cy="59" rx="14" ry="7" fill="${fill}" opacity="0.3"/>`
  if (style === 'short')   return `<ellipse cx="50" cy="60" rx="14" ry="8" fill="${fill}" opacity="0.65"/>`
  if (style === 'full') return `<ellipse cx="50" cy="62" rx="17" ry="10" fill="${fill}"/>`
                             + `<ellipse cx="50" cy="57" rx="12" ry="5" fill="${fill}"/>`
  if (style === 'goatee')   return `<ellipse cx="50" cy="62" rx="7" ry="7" fill="${fill}" opacity="0.85"/>`
  if (style === 'mustache') return `<ellipse cx="44" cy="56" rx="5.5" ry="2.5" fill="${fill}"/>`
                                 + `<ellipse cx="56" cy="56" rx="5.5" ry="2.5" fill="${fill}"/>`
  return ''
}

function hat(type: 'cap' | 'beanie' | 'fedora'): string {
  if (type === 'cap') {
    return `<path d="M 24 40 Q 24 10 50 10 Q 76 10 76 40 Z" fill="#2563EB"/>`
         + `<path d="M 74 40 Q 86 38 88 46 Q 84 48 76 46 Z" fill="#1D4ED8"/>`
         + `<line x1="50" y1="10" x2="50" y2="40" stroke="#1D4ED8" stroke-width="1" opacity="0.5"/>`
         + `<circle cx="50" cy="10" r="2.5" fill="#1D4ED8"/>`
  }
  if (type === 'beanie') {
    return `<path d="M 22 40 Q 21 8 50 6 Q 79 8 78 40 Z" fill="#7C3AED"/>`
         + `<path d="M 22 40 Q 50 46 78 40 Q 76 47 50 50 Q 24 47 22 40 Z" fill="#6D28D9"/>`
         + `<circle cx="50" cy="6" r="5" fill="#A78BFA"/>`
  }
  // fedora
  return `<ellipse cx="50" cy="20" rx="22" ry="14" fill="#374151"/>`
       + `<ellipse cx="50" cy="32" rx="36" ry="7" fill="#374151"/>`
       + `<path d="M 50 8 Q 46 14 50 20 Q 54 14 50 8 Z" fill="#1F2937"/>`
       + `<ellipse cx="50" cy="32" rx="22" ry="3.5" fill="#1F2937"/>`
}

function glasses(type: 'round' | 'square' | 'sun'): string {
  const frameColor = type === 'sun' ? '#111827' : '#1E293B'
  const lensFill   = type === 'sun' ? 'rgba(0,0,0,0.55)' : 'rgba(186,224,255,0.25)'
  const sw = 1.6
  if (type === 'square') {
    return `<rect x="32" y="39" width="15" height="11" rx="2" fill="${lensFill}" stroke="${frameColor}" stroke-width="${sw}"/>`
         + `<rect x="53" y="39" width="15" height="11" rx="2" fill="${lensFill}" stroke="${frameColor}" stroke-width="${sw}"/>`
         + `<line x1="47" y1="44" x2="53" y2="44" stroke="${frameColor}" stroke-width="${sw}"/>`
         + `<line x1="32" y1="44" x2="26" y2="43" stroke="${frameColor}" stroke-width="${sw - 0.4}"/>`
         + `<line x1="68" y1="44" x2="74" y2="43" stroke="${frameColor}" stroke-width="${sw - 0.4}"/>`
  }
  return `<circle cx="40" cy="44" r="6" fill="${lensFill}" stroke="${frameColor}" stroke-width="${sw}"/>`
       + `<circle cx="60" cy="44" r="6" fill="${lensFill}" stroke="${frameColor}" stroke-width="${sw}"/>`
       + `<line x1="46" y1="44" x2="54" y2="44" stroke="${frameColor}" stroke-width="${sw}"/>`
       + `<line x1="34" y1="43" x2="28" y2="42" stroke="${frameColor}" stroke-width="${sw - 0.4}"/>`
       + `<line x1="66" y1="43" x2="72" y2="42" stroke="${frameColor}" stroke-width="${sw - 0.4}"/>`
}

// Modular clothing — distinct *shapes* per style (not just colour), drawn in
// the same flat-vector idiom as the rest of the avatar. Every garment shares
// the base torso silhouette so the avatar stays recognisably "the same style",
// then layers style-specific details (collars, lapels, hoods, studs…).
function clothes(style: string, hex: string, skinHex: string): string {
  const dark  = darken(hex, 0.22)
  const light = lighten(hex, 0.35)
  // Shared torso + shoulder shade.
  const base = `<rect x="18" y="76" width="64" height="28" rx="10" fill="${hex}"/>`
             + `<rect x="18" y="76" width="64" height="10" rx="5" fill="${dark}"/>`

  switch (style) {
    case 'formal': {
      // Suit jacket + white shirt wedge + tie.
      return base
        + `<path d="M 44 76 L 50 92 L 56 76 Z" fill="#F4F4F6"/>`
        + `<path d="M 40 76 L 50 91 L 44 76 Z" fill="${dark}"/>`
        + `<path d="M 60 76 L 50 91 L 56 76 Z" fill="${dark}"/>`
        + `<path d="M 48.5 80 L 51.5 80 L 50.8 93 L 49.2 93 Z" fill="#B23A48"/>`
        + `<path d="M 48.5 80 L 51.5 80 L 50 83 Z" fill="#8E2C38"/>`
    }
    case 'sporty': {
      // Hoodie: collar band, drawstrings, kangaroo pocket.
      return base
        + `<path d="M 39 75 Q 50 87 61 75 Q 58 73 50 73 Q 42 73 39 75 Z" fill="${dark}"/>`
        + `<line x1="47" y1="80" x2="46" y2="90" stroke="${light}" stroke-width="1.4" stroke-linecap="round"/>`
        + `<line x1="53" y1="80" x2="54" y2="90" stroke="${light}" stroke-width="1.4" stroke-linecap="round"/>`
        + `<circle cx="46" cy="90.5" r="1.1" fill="${light}"/><circle cx="54" cy="90.5" r="1.1" fill="${light}"/>`
        + `<path d="M 37 95 Q 50 100 63 95" stroke="${dark}" stroke-width="1.4" fill="none"/>`
    }
    case 'elegant': {
      // Blazer with a deep V neckline (inner blouse) + pendant.
      return base
        + `<path d="M 43 76 L 50 93 L 57 76 Z" fill="${lighten(hex, 0.55)}"/>`
        + `<path d="M 40 76 L 50 92 L 45 76 Z" fill="${dark}"/>`
        + `<path d="M 60 76 L 50 92 L 55 76 Z" fill="${dark}"/>`
        + `<line x1="50" y1="80" x2="50" y2="88" stroke="${darken(skinHex, 0.05)}" stroke-width="0.8" opacity="0.5"/>`
        + `<circle cx="50" cy="88" r="1.7" fill="#FFD66B"/><circle cx="50" cy="88" r="0.8" fill="#E0A93B"/>`
    }
    case 'punk': {
      // Studded jacket: pointed collar flaps, dashed zipper, studs.
      return base
        + `<path d="M 40 77 L 49 77 L 44 85 Z" fill="${dark}"/>`
        + `<path d="M 60 77 L 51 77 L 56 85 Z" fill="${dark}"/>`
        + `<line x1="50" y1="78" x2="50" y2="103" stroke="${light}" stroke-width="1.2" stroke-dasharray="1.6 1.6"/>`
        + `<circle cx="43" cy="80" r="0.9" fill="${light}"/><circle cx="57" cy="80" r="0.9" fill="${light}"/>`
        + `<circle cx="40" cy="95" r="0.9" fill="${light}"/><circle cx="60" cy="95" r="0.9" fill="${light}"/>`
    }
    case 'traditional': {
      // Tunic: mandarin collar, centre placket with trim + buttons.
      return base
        + `<path d="M 43 75 Q 50 80 57 75 L 57 79 Q 50 84 43 79 Z" fill="${dark}"/>`
        + `<line x1="50" y1="80" x2="50" y2="103" stroke="${light}" stroke-width="1.6"/>`
        + `<circle cx="50" cy="86" r="1" fill="${light}"/><circle cx="50" cy="93" r="1" fill="${light}"/>`
        + `<path d="M 18 100 Q 50 104 82 100" stroke="${light}" stroke-width="1.2" fill="none" opacity="0.6"/>`
    }
    case 'casual':
    default: {
      // Crew-neck tee: simple rounded neckline.
      return base
        + `<path d="M 42 76 Q 50 83 58 76" stroke="${dark}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    }
  }
}

export interface AvatarInnerOpts {
  age: number
  clipId: string
  animated?: boolean
}

// Inner SVG markup (everything inside the <svg> element). Used by the React
// renderer via dangerouslySetInnerHTML and by the standalone builder below.
export function buildAvatarInner(config: AvatarConfig, opts: AvatarInnerOpts): string {
  const { age, clipId, animated = false } = opts
  const aged = applyAgeToConfig(age, config)

  const skinHex    = SKIN_TONES[aged.skinTone]         ?? '#F5C18C'
  const hairHex    = HAIR_COLORS[aged.hairColor]       ?? '#3B2314'
  const eyeHex     = EYE_COLORS[aged.eyeColor]         ?? '#6B4226'
  const clothesHex = CLOTHES_COLORS[aged.clothesStyle] ?? '#4A6FA5'

  const skinDark    = darken(skinHex, 0.15)
  const browColor   = darken(hairHex, 0.1)

  const acc: AvatarAccessory = aged.accessory

  let s = ''
  // defs / clip path
  s += `<defs><clipPath id="${clipId}"><circle cx="50" cy="42" r="26"/></clipPath></defs>`
  // Body (modular garment — distinct shape per clothes style)
  s += clothes(aged.clothesStyle, clothesHex, skinHex)
  // Neck
  s += `<rect x="43" y="64" width="14" height="16" rx="4" fill="${skinHex}"/>`
  // Hair back
  s += hairBack(aged.hairStyle, hairHex)
  // Ears
  s += `<circle cx="24" cy="44" r="5.5" fill="${skinHex}"/><circle cx="76" cy="44" r="5.5" fill="${skinHex}"/>`
  s += `<circle cx="24" cy="44" r="3.2" fill="${skinDark}" opacity="0.4"/><circle cx="76" cy="44" r="3.2" fill="${skinDark}" opacity="0.4"/>`
  // Head base
  s += `<circle cx="50" cy="42" r="26" fill="${skinHex}"/>`
  // Hair cap
  s += hairCap(aged.hairStyle, hairHex, clipId)
  // Baby tuft
  if (aged.isBaby && aged.hairStyle === 'bald' && config.hairStyle !== 'bald') {
    s += babyHairTuft(hairHex)
  }
  // Hat
  if (acc === 'hat_cap')    s += hat('cap')
  if (acc === 'hat_beanie') s += hat('beanie')
  if (acc === 'hat_fedora') s += hat('fedora')
  // Brows
  s += brows(aged.browStyle, browColor)
  // Eyes (blink group)
  s += `<g class="${animated ? 'avatar-blink' : ''}">${eyes(aged.eyeStyle, eyeHex)}</g>`
  // Nose
  s += `<ellipse cx="47.5" cy="52" rx="1.6" ry="1.1" fill="${skinDark}" opacity="0.45"/>`
  s += `<ellipse cx="52.5" cy="52" rx="1.6" ry="1.1" fill="${skinDark}" opacity="0.45"/>`
  // Mouth (modular expression)
  s += mouth(aged.mouthStyle, skinHex)
  // Beard
  s += beard(aged.beardStyle, hairHex)
  // Acne
  if (aged.hasAcne) {
    s += `<circle cx="38" cy="49" r="1.1" fill="#FF6B6B" opacity="0.7"/>`
       + `<circle cx="63" cy="51" r="1.3" fill="#FF6B6B" opacity="0.6"/>`
       + `<circle cx="42" cy="61" r="0.9" fill="#FF6B6B" opacity="0.5"/>`
  }
  // Light wrinkles
  if (aged.showLightWrinkles) {
    s += `<path d="M 31 38 Q 35 36 39 38" stroke="${skinDark}" stroke-width="0.8" fill="none" opacity="0.35"/>`
       + `<path d="M 61 38 Q 65 36 69 38" stroke="${skinDark}" stroke-width="0.8" fill="none" opacity="0.35"/>`
  }
  // Wrinkles
  if (aged.showWrinkles) {
    s += `<path d="M 29 38 Q 34 35 39 38" stroke="${skinDark}" stroke-width="1" fill="none" opacity="0.5"/>`
       + `<path d="M 61 38 Q 66 35 71 38" stroke="${skinDark}" stroke-width="1" fill="none" opacity="0.5"/>`
       + `<path d="M 39 56 Q 43 58 47 56" stroke="${skinDark}" stroke-width="0.8" fill="none" opacity="0.4"/>`
       + `<path d="M 53 56 Q 57 58 61 56" stroke="${skinDark}" stroke-width="0.8" fill="none" opacity="0.4"/>`
       + `<path d="M 44 40 Q 46 38 48 40" stroke="${skinDark}" stroke-width="0.6" fill="none" opacity="0.3"/>`
       + `<path d="M 52 40 Q 54 38 56 40" stroke="${skinDark}" stroke-width="0.6" fill="none" opacity="0.3"/>`
  }
  // Baby cheeks
  if (aged.isBaby) {
    s += `<ellipse cx="34" cy="52" rx="5" ry="3.5" fill="#FF9A9A" opacity="0.35"/>`
       + `<ellipse cx="66" cy="52" rx="5" ry="3.5" fill="#FF9A9A" opacity="0.35"/>`
  }
  // Glasses (last, over eyes)
  if (acc === 'glasses_round')  s += glasses('round')
  if (acc === 'glasses_square') s += glasses('square')
  if (acc === 'sunglasses')     s += glasses('sun')

  return s
}

export interface AvatarSvgOpts {
  age?: number
  size?: number
  clipId?: string
  background?: string | null
}

// Full standalone <svg> string. Used by the preview gallery generator.
export function buildAvatarSvg(config: AvatarConfig, opts: AvatarSvgOpts = {}): string {
  const { age = 25, size = 200, clipId = 'avclip', background = null } = opts
  const inner = buildAvatarInner(config, { age, clipId, animated: false })
  const bg = background
    ? `<rect x="0" y="0" width="100" height="100" rx="14" fill="${background}"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${bg}${inner}</svg>`
}
