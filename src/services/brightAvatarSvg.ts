// Bright Avatar style — a flat, vibrant character set (200×200, coloured
// background disc, layered: clothes → skin → face → hair) built from the
// reference SVG provided by the user. Driven by the SAME modular `AvatarConfig`
// as the rest of the game, so every NPC the engine generates can be drawn in
// this style. `buildBrightAvatar()` returns a full standalone <svg> string.

import { darken, lighten } from './avatarSvg'
import { HAIR_COLORS, EYE_COLORS } from './AvatarEngine'
import type {
  AvatarConfig, SkinTone, AvatarHairStyle, EyeStyle, BrowStyle,
  BeardStyle, MouthStyle, AvatarAccessory,
} from '../store/types'

// Skin: warm flat fill + matching shadow (base tone from the reference).
const BRIGHT_SKIN: Record<SkinTone, { fill: string; shadow: string }> = {
  light:        { fill: '#FAD09E', shadow: '#E0A96D' },
  medium_light: { fill: '#F2B98A', shadow: '#D99356' },
  medium:       { fill: '#D99A6C', shadow: '#B97644' },
  medium_dark:  { fill: '#AE7748', shadow: '#8A5A33' },
  dark:         { fill: '#7A4E32', shadow: '#5E3A24' },
}

// Bright background discs (the reference uses the first one).
export const BRIGHT_BG: readonly string[] = [
  '#5F5AA2', '#E8A0BF', '#7FB7BE', '#F4A259',
  '#6FCF97', '#5B8DEF', '#BB6BD9', '#F2C94C',
]

const INK = '#2C3E50'

// ---- Hair (capelli) — back layer (behind head) ----
function hairBack(style: AvatarHairStyle, fill: string): string {
  switch (style) {
    case 'long':
      return `<path d="M58,70 C50,120 56,165 64,180 L80,180 C70,150 70,110 74,80 Z" fill="${fill}"/>`
           + `<path d="M142,70 C150,120 144,165 136,180 L120,180 C130,150 130,110 126,80 Z" fill="${fill}"/>`
    case 'afro':
      return `<circle cx="100" cy="74" r="50" fill="${fill}"/>`
    case 'bun':
      return `<circle cx="100" cy="40" r="14" fill="${fill}"/>`
    case 'ponytail':
      return `<path d="M134,58 C160,52 168,86 150,104 C146,86 140,72 130,64 Z" fill="${fill}"/>`
    case 'curly':
      return `<circle cx="64" cy="70" r="13" fill="${fill}"/><circle cx="136" cy="70" r="13" fill="${fill}"/>`
    case 'wavy':
      return `<path d="M60,72 C50,92 58,112 54,132 L66,132 C66,110 70,92 72,76 Z" fill="${fill}"/>`
           + `<path d="M140,72 C150,92 142,112 146,132 L134,132 C134,110 130,92 128,76 Z" fill="${fill}"/>`
    default:
      return ''
  }
}

// ---- Hair — front/cap (over the top of the head) ----
function hairFront(style: AvatarHairStyle, fill: string): string {
  const sheen = lighten(fill, 0.18)
  switch (style) {
    case 'bald':
      return ''
    case 'buzz':
      return `<path d="M66,74 C62,46 100,34 134,74 C120,60 80,60 66,74 Z" fill="${fill}" opacity="0.92"/>`
    case 'short':
      // The reference swept style.
      return `<path d="M62,75 C58,35 100,28 115,38 C132,32 142,52 138,75 C132,65 125,60 115,62 C100,55 80,60 62,75 Z" fill="${fill}"/>`
           + `<path d="M70,52 C85,42 105,42 118,48" stroke="${sheen}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>`
    case 'medium':
      return `<path d="M60,80 C54,38 100,26 124,40 C140,50 144,66 140,82 C134,66 126,58 116,58 C100,48 78,54 64,76 Z" fill="${fill}"/>`
    case 'long':
      return `<path d="M62,78 C58,36 100,26 122,40 C138,50 142,66 140,80 C132,62 120,56 110,58 C96,48 78,56 62,78 Z" fill="${fill}"/>`
    case 'wavy':
      return `<path d="M62,76 C58,38 102,28 124,42 C138,52 142,66 138,80 C130,64 120,58 110,60 C96,50 78,56 62,76 Z" fill="${fill}"/>`
    case 'curly':
      return `<path d="M64,72 a10,10 0 0 1 12,-12 a12,12 0 0 1 22,-6 a12,12 0 0 1 22,4 a10,10 0 0 1 12,14 C124,58 110,54 100,55 C84,54 72,60 64,72 Z" fill="${fill}"/>`
    case 'afro':
      return ''
    case 'ponytail':
      return `<path d="M64,74 C60,42 100,30 122,44 C134,52 138,64 134,76 C128,62 116,56 108,58 C94,50 78,56 64,74 Z" fill="${fill}"/>`
    case 'bun':
      return `<path d="M64,74 C60,44 100,32 122,46 C134,54 138,66 134,78 C128,64 116,58 108,60 C94,52 78,58 64,74 Z" fill="${fill}"/>`
    default:
      return ''
  }
}

// ---- Eyes (occhi) ----
function eyes(style: EyeStyle, iris: string): string {
  const L = 86, R = 114, CY = 80
  const eye = (cx: number) => {
    switch (style) {
      case 'almond':
        return `<ellipse cx="${cx}" cy="${CY}" rx="6" ry="4" fill="#fff"/>`
             + `<circle cx="${cx}" cy="${CY}" r="3.2" fill="${iris}"/>`
             + `<circle cx="${cx}" cy="${CY}" r="1.6" fill="${INK}"/>`
             + `<circle cx="${cx + 1.2}" cy="${CY - 1.2}" r="0.9" fill="#fff"/>`
      case 'wide':
        return `<circle cx="${cx}" cy="${CY}" r="6.5" fill="#fff"/>`
             + `<circle cx="${cx}" cy="${CY}" r="4" fill="${iris}"/>`
             + `<circle cx="${cx}" cy="${CY}" r="2" fill="${INK}"/>`
             + `<circle cx="${cx + 1.4}" cy="${CY - 1.4}" r="1.1" fill="#fff"/>`
      case 'narrow':
        return `<ellipse cx="${cx}" cy="${CY}" rx="6" ry="2.4" fill="#fff"/>`
             + `<circle cx="${cx}" cy="${CY}" r="2.3" fill="${iris}"/>`
             + `<circle cx="${cx}" cy="${CY}" r="1.1" fill="${INK}"/>`
      case 'round':
      default:
        return `<circle cx="${cx}" cy="${CY}" r="5.2" fill="#fff"/>`
             + `<circle cx="${cx}" cy="${CY}" r="3.3" fill="${iris}"/>`
             + `<circle cx="${cx}" cy="${CY}" r="1.7" fill="${INK}"/>`
             + `<circle cx="${cx + 1.2}" cy="${CY - 1.2}" r="0.95" fill="#fff"/>`
    }
  }
  return eye(L) + eye(R)
}

// ---- Brows (sopracciglia) ----
function brows(style: BrowStyle, color: string): string {
  const sw = style === 'thick' ? 3.4 : style === 'thin' ? 1.6 : 2.5
  const l = style === 'arched' ? 'M78,70 Q86,64 94,70' : style === 'thick' ? 'M78,70 Q86,67 94,70' : 'M78,71 Q86,68 93,72'
  const r = style === 'arched' ? 'M122,70 Q114,64 106,70' : style === 'thick' ? 'M122,70 Q114,67 106,70' : 'M122,71 Q114,68 107,72'
  return `<path d="${l}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`
       + `<path d="${r}" stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`
}

// ---- Nose (from the reference) ----
function nose(shadow: string): string {
  return `<path d="M100,76 L100,84 Q100,86 103,86" stroke="${shadow}" stroke-width="2" fill="none" stroke-linecap="round"/>`
}

// ---- Mouth (bocche) ----
function mouth(style: MouthStyle): string {
  switch (style) {
    case 'neutral':
      return `<path d="M91,94 L109,94" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    case 'grin':
      return `<path d="M90,91 Q100,104 110,91 Z" fill="${INK}"/>`
           + `<path d="M92,92.5 Q100,95 108,92.5 L107,95 Q100,96.5 93,95 Z" fill="#fff"/>`
    case 'frown':
      return `<path d="M91,97 Q100,89 109,97" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    case 'smirk':
      return `<path d="M91,95 Q100,98 109,89" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    case 'smile':
    default:
      return `<path d="M92,92 Q100,101 108,92" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  }
}

// ---- Beard (barbe) ----
function beard(style: BeardStyle, fill: string): string {
  switch (style) {
    case 'stubble':
      return `<path d="M68,84 Q70,116 100,120 Q130,116 132,84 Q120,106 100,108 Q80,106 68,84 Z" fill="${fill}" opacity="0.28"/>`
    case 'short':
      return `<path d="M68,84 Q70,116 100,120 Q130,116 132,84 Q120,106 100,108 Q80,106 68,84 Z" fill="${fill}" opacity="0.62"/>`
    case 'full':
      return `<path d="M66,82 Q66,122 100,126 Q134,122 134,82 Q122,108 100,110 Q78,108 66,82 Z" fill="${fill}"/>`
           + `<path d="M88,98 Q100,104 112,98 L112,103 Q100,109 88,103 Z" fill="${darken(fill, 0.2)}"/>`
    case 'goatee':
      return `<ellipse cx="100" cy="112" rx="8" ry="10" fill="${fill}" opacity="0.9"/>`
    case 'mustache':
      return `<path d="M88,89 Q94,87 99,89 Q94,92 88,91 Z" fill="${fill}"/>`
           + `<path d="M112,89 Q106,87 101,89 Q106,92 112,91 Z" fill="${fill}"/>`
    case 'none':
    default:
      return ''
  }
}

// ---- Glasses (occhiali) ----
function glasses(type: AvatarAccessory): string {
  const L = 86, R = 114, CY = 80
  if (type === 'glasses_square') {
    const f = '#1E293B'
    return `<rect x="${L - 9}" y="${CY - 8}" width="18" height="16" rx="3" fill="rgba(186,224,255,0.22)" stroke="${f}" stroke-width="2.4"/>`
         + `<rect x="${R - 9}" y="${CY - 8}" width="18" height="16" rx="3" fill="rgba(186,224,255,0.22)" stroke="${f}" stroke-width="2.4"/>`
         + `<line x1="${L + 9}" y1="${CY}" x2="${R - 9}" y2="${CY}" stroke="${f}" stroke-width="2.4"/>`
  }
  if (type === 'sunglasses') {
    const f = '#111827'
    return `<circle cx="${L}" cy="${CY}" r="10" fill="rgba(10,12,20,0.82)" stroke="${f}" stroke-width="2.4"/>`
         + `<circle cx="${R}" cy="${CY}" r="10" fill="rgba(10,12,20,0.82)" stroke="${f}" stroke-width="2.4"/>`
         + `<line x1="${L + 10}" y1="${CY}" x2="${R - 10}" y2="${CY}" stroke="${f}" stroke-width="2.4"/>`
  }
  // glasses_round
  const f = '#1E293B'
  return `<circle cx="${L}" cy="${CY}" r="9.5" fill="rgba(186,224,255,0.18)" stroke="${f}" stroke-width="2.4"/>`
       + `<circle cx="${R}" cy="${CY}" r="9.5" fill="rgba(186,224,255,0.18)" stroke="${f}" stroke-width="2.4"/>`
       + `<line x1="${L + 9.5}" y1="${CY}" x2="${R - 9.5}" y2="${CY}" stroke="${f}" stroke-width="2.4"/>`
}

// ---- Hats (cappelli, accessory subset) ----
function hat(type: AvatarAccessory): string {
  if (type === 'hat_cap') {
    return `<path d="M62,58 Q62,30 100,30 Q138,30 138,58 Z" fill="#2563EB"/>`
         + `<path d="M134,58 Q160,54 164,66 Q156,70 138,66 Z" fill="#1D4ED8"/>`
         + `<circle cx="100" cy="30" r="3.4" fill="#1D4ED8"/>`
  }
  if (type === 'hat_beanie') {
    return `<path d="M60,58 Q58,26 100,24 Q142,26 140,58 Z" fill="#7C3AED"/>`
         + `<path d="M60,58 Q100,66 140,58 Q137,68 100,72 Q63,68 60,58 Z" fill="#6D28D9"/>`
         + `<circle cx="100" cy="24" r="6" fill="#A78BFA"/>`
  }
  // hat_fedora
  return `<ellipse cx="100" cy="44" rx="30" ry="18" fill="#374151"/>`
       + `<ellipse cx="100" cy="60" rx="50" ry="9" fill="#374151"/>`
       + `<ellipse cx="100" cy="60" rx="30" ry="4.5" fill="#1F2937"/>`
}

// ---- Clothes (vestiti) — distinct shapes per style ----
function clothes(style: string, hex: string): string {
  const dark  = darken(hex, 0.24)
  const light = lighten(hex, 0.4)
  // Shared shoulders/torso silhouette (from the reference).
  const torso = `<path d="M52,155 C52,130 70,120 100,120 C130,120 148,130 148,155 L140,200 L60,200 Z" fill="${hex}"/>`
              + `<path d="M52,158 C52,150 60,146 70,146 L130,146 C140,146 148,150 148,158 L148,150 L52,150 Z" fill="${dark}" opacity="0.35"/>`
  switch (style) {
    case 'formal':
      return torso
        + `<path d="M84,121 L100,150 L116,121 Z" fill="#F4F4F6"/>`
        + `<path d="M80,120 L100,148 L90,121 Z" fill="${dark}"/>`
        + `<path d="M120,120 L100,148 L110,121 Z" fill="${dark}"/>`
        + `<path d="M96,128 L104,128 L102,158 L98,158 Z" fill="#B23A48"/>`
        + `<path d="M96,128 L104,128 L100,134 Z" fill="#8E2C38"/>`
    case 'sporty':
      return torso
        + `<path d="M80,120 Q100,140 120,120 Q114,116 100,116 Q86,116 80,120 Z" fill="${dark}"/>`
        + `<line x1="94" y1="128" x2="92" y2="150" stroke="${light}" stroke-width="2.4" stroke-linecap="round"/>`
        + `<line x1="106" y1="128" x2="108" y2="150" stroke="${light}" stroke-width="2.4" stroke-linecap="round"/>`
        + `<circle cx="92" cy="151" r="1.8" fill="${light}"/><circle cx="108" cy="151" r="1.8" fill="${light}"/>`
        + `<path d="M76,168 Q100,176 124,168" stroke="${dark}" stroke-width="2.2" fill="none"/>`
    case 'elegant':
      return torso
        + `<path d="M86,121 L100,152 L114,121 Z" fill="${lighten(hex, 0.6)}"/>`
        + `<path d="M82,120 L100,150 L92,121 Z" fill="${dark}"/>`
        + `<path d="M118,120 L100,150 L108,121 Z" fill="${dark}"/>`
        + `<circle cx="100" cy="146" r="3" fill="#FFD66B"/><circle cx="100" cy="146" r="1.4" fill="#E0A93B"/>`
    case 'punk':
      return torso
        + `<path d="M80,122 L96,122 L86,138 Z" fill="${dark}"/>`
        + `<path d="M120,122 L104,122 L114,138 Z" fill="${dark}"/>`
        + `<line x1="100" y1="124" x2="100" y2="196" stroke="${light}" stroke-width="2" stroke-dasharray="3 3"/>`
        + `<circle cx="84" cy="128" r="1.6" fill="${light}"/><circle cx="116" cy="128" r="1.6" fill="${light}"/>`
        + `<circle cx="78" cy="160" r="1.6" fill="${light}"/><circle cx="122" cy="160" r="1.6" fill="${light}"/>`
    case 'traditional':
      return torso
        + `<path d="M84,120 Q100,130 116,120 L116,127 Q100,137 84,127 Z" fill="${dark}"/>`
        + `<line x1="100" y1="128" x2="100" y2="196" stroke="${light}" stroke-width="2.6"/>`
        + `<circle cx="100" cy="140" r="1.8" fill="${light}"/><circle cx="100" cy="154" r="1.8" fill="${light}"/>`
        + `<path d="M60,192 Q100,200 140,192" stroke="${light}" stroke-width="2.2" fill="none" opacity="0.6"/>`
    case 'casual':
    default:
      // Reference crew-neck collar.
      return torso
        + `<path d="M85,123 C90,135 110,135 115,123 Z" fill="${dark}"/>`
  }
}

export interface BrightAvatarOpts {
  size?: number
  background?: string | null   // disc colour; null = transparent
}

// Bright clothing colour per style.
const CLOTHES_BRIGHT: Record<string, string> = {
  casual:      '#FF6B6B',
  formal:      '#34495E',
  sporty:      '#27AE60',
  elegant:     '#8E44AD',
  punk:        '#2D2D34',
  traditional: '#C97A40',
}

// Inner SVG markup (everything inside the <svg> element). Shared by the React
// renderer (transparent, no disc) and the standalone builder (with disc).
export function buildBrightAvatarInner(config: AvatarConfig, opts: { background?: string | null } = {}): string {
  const { background = null } = opts

  const skin = BRIGHT_SKIN[config.skinTone] ?? BRIGHT_SKIN.light
  const hairHex = HAIR_COLORS[config.hairColor] ?? '#2C3E50'
  const irisHex = EYE_COLORS[config.eyeColor] ?? '#2C3E50'
  const browHex = darken(hairHex, 0.1)
  const acc = config.accessory ?? 'none'
  const mouthStyle = config.mouthStyle ?? 'smile'

  let s = ''
  // Background disc (clips everything to a circle look) — only when requested.
  if (background) {
    s += `<defs><clipPath id="bgclip"><circle cx="100" cy="100" r="95"/></clipPath></defs>`
    s += `<circle cx="100" cy="100" r="95" fill="${background}"/>`
    s += `<g clip-path="url(#bgclip)">`
  } else {
    s += `<g>`
  }

  // clothes (behind the head)
  s += clothes(config.clothesStyle, CLOTHES_BRIGHT[config.clothesStyle] ?? '#FF6B6B')
  // hair back
  s += hairBack(config.hairStyle, hairHex)
  // neck + shadow
  s += `<rect x="88" y="102" width="24" height="25" rx="4" fill="${skin.fill}"/>`
  s += `<path d="M88,107 C95,115 105,115 112,107 L112,112 C105,120 95,120 88,112 Z" fill="${skin.shadow}" opacity="0.4"/>`
  // face
  s += `<circle cx="100" cy="80" r="35" fill="${skin.fill}"/>`
  // hair front (over forehead), plus hat over it when present
  s += hairFront(config.hairStyle, hairHex)
  if (acc === 'hat_cap' || acc === 'hat_beanie' || acc === 'hat_fedora') {
    s += hat(acc)
  }
  // face details
  s += brows(config.browStyle, browHex)
  s += nose(skin.shadow)
  s += beard(config.beardStyle, hairHex)
  s += mouth(mouthStyle)
  s += eyes(config.eyeStyle, irisHex)
  // glasses last
  if (acc === 'glasses_round' || acc === 'glasses_square' || acc === 'sunglasses') {
    s += glasses(acc)
  }

  s += `</g>`
  return s
}

export function buildBrightAvatar(config: AvatarConfig, opts: BrightAvatarOpts = {}): string {
  const { size = 200, background = BRIGHT_BG[0] } = opts
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">`
       + buildBrightAvatarInner(config, { background })
       + `</svg>`
}
