import type { AvatarConfig, AvatarHairStyle, AvatarHairColor, SkinTone, EyeColor, EyeStyle, BrowStyle, BeardStyle, Gender } from '../store/types'

export const SKIN_TONES: Record<SkinTone, string> = {
  light:        '#FDDBB4',
  medium_light: '#F5C18C',
  medium:       '#D4956A',
  medium_dark:  '#A56B3C',
  dark:         '#5C3317',
}

export const HAIR_COLORS: Record<AvatarHairColor, string> = {
  black:       '#1A1A1A',
  dark_brown:  '#3B2314',
  brown:       '#6B3D2E',
  light_brown: '#9E6C4A',
  blonde:      '#E8C97A',
  red:         '#C44B1D',
  auburn:      '#8B3A2C',
  gray:        '#9E9E9E',
  white:       '#E8E8E8',
  blue:        '#4A90D9',
  pink:        '#E879A0',
}

export const EYE_COLORS: Record<EyeColor, string> = {
  brown:      '#6B4226',
  dark_brown: '#3B1E08',
  blue:       '#4A90D9',
  green:      '#3A8A5A',
  hazel:      '#8B6914',
  gray:       '#7A8592',
  amber:      '#C07A1A',
}

export const CLOTHES_COLORS: Record<string, string> = {
  casual:      '#4A6FA5',
  formal:      '#2D3748',
  sporty:      '#2D8B4A',
  elegant:     '#7B2D6B',
  punk:        '#3A3A3A',
  traditional: '#7B4E2D',
}

export interface BarberService {
  id: string
  name: string
  emoji: string
  cost: number
  looksBonus: number
  description: string
  changesStyle?: AvatarHairStyle
  changesColor?: AvatarHairColor
}

export interface AgeAppliedConfig extends AvatarConfig {
  hasAcne: boolean
  grayStreak: boolean
  showLightWrinkles: boolean
  showWrinkles: boolean
  isBaby: boolean
}

export function getDefaultAvatar(gender: Gender): AvatarConfig {
  return {
    skinTone:     'medium_light',
    hairStyle:    gender === 'female' ? 'medium' : 'short',
    hairColor:    'dark_brown',
    eyeStyle:     'round',
    eyeColor:     'brown',
    browStyle:    'medium',
    beardStyle:   'none',
    clothesStyle: 'casual',
  }
}

export function getRandomAvatar(gender: Gender): AvatarConfig {
  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const hairStyles: AvatarHairStyle[] = gender === 'female'
    ? ['medium', 'long', 'wavy', 'curly', 'bun', 'ponytail']
    : ['buzz', 'short', 'medium']
  const hairColors: AvatarHairColor[] = ['black', 'dark_brown', 'brown', 'light_brown', 'blonde', 'red', 'auburn']
  const skinTones: SkinTone[] = ['light', 'medium_light', 'medium', 'medium_dark', 'dark']
  const eyeColors: EyeColor[] = ['brown', 'dark_brown', 'blue', 'green', 'hazel']
  const browStyles: BrowStyle[] = ['thin', 'medium', 'thick', 'arched']
  return {
    skinTone:     pick(skinTones),
    hairStyle:    pick(hairStyles),
    hairColor:    pick(hairColors),
    eyeStyle:     'round',
    eyeColor:     pick(eyeColors),
    browStyle:    pick(browStyles),
    beardStyle:   'none',
    clothesStyle: 'casual',
  }
}

export function applyAgeToConfig(age: number, config: AvatarConfig): AgeAppliedConfig {
  const isDyed = config.hairColor === 'blue' || config.hairColor === 'pink'
  let hairColor = config.hairColor
  if (!isDyed) {
    if (age >= 66) hairColor = 'white'
    else if (age >= 40) hairColor = 'gray'
  }
  const hairStyle: AvatarHairStyle = age < 2 ? 'bald' : config.hairStyle
  return {
    ...config,
    hairColor,
    hairStyle,
    hasAcne:            age >= 13 && age <= 18,
    grayStreak:         age >= 40 && age <= 55 && !isDyed,
    showLightWrinkles:  age >= 51 && age <= 65,
    showWrinkles:       age >= 66,
    isBaby:             age < 6,
  }
}

export function getBarberServices(): BarberService[] {
  return [
    { id: 'trim',        name: 'Spuntatina',        emoji: '✂️', cost: 15,  looksBonus: 2, description: 'Una ripassata per tenere in ordine.' },
    { id: 'buzz',        name: 'Rasatura corta',     emoji: '💈', cost: 20,  looksBonus: 3, description: 'Taglio corto e ordinato.', changesStyle: 'buzz' },
    { id: 'short',       name: 'Taglio corto',       emoji: '✂️', cost: 25,  looksBonus: 4, description: 'Classico corto e pulito.', changesStyle: 'short' },
    { id: 'medium',      name: 'Taglio medio',       emoji: '✂️', cost: 30,  looksBonus: 4, description: 'Lunghezza media, look casual.', changesStyle: 'medium' },
    { id: 'long',        name: 'Styling lungo',      emoji: '🌿', cost: 25,  looksBonus: 3, description: 'Styling per capelli lunghi.', changesStyle: 'long' },
    { id: 'wavy',        name: 'Permanente mosso',   emoji: '🌊', cost: 45,  looksBonus: 5, description: 'Trattamento per onde naturali.', changesStyle: 'wavy' },
    { id: 'curly',       name: 'Ricci perfetti',     emoji: '🌀', cost: 50,  looksBonus: 5, description: 'Definizione ricci professionale.', changesStyle: 'curly' },
    { id: 'dye_blonde',  name: 'Tinta bionda',       emoji: '🟡', cost: 60,  looksBonus: 4, description: 'Colore biondo luminoso.', changesColor: 'blonde' },
    { id: 'dye_red',     name: 'Tinta rossa',        emoji: '🔴', cost: 60,  looksBonus: 4, description: 'Colore rosso vivace.', changesColor: 'red' },
    { id: 'dye_blue',    name: 'Tinta azzurra',      emoji: '🔵', cost: 70,  looksBonus: 3, description: 'Colore azzurro audace.', changesColor: 'blue' },
    { id: 'dye_pink',    name: 'Tinta rosa',         emoji: '🩷', cost: 70,  looksBonus: 3, description: 'Colore rosa vistoso.', changesColor: 'pink' },
    { id: 'shave_beard', name: 'Rasatura barba',     emoji: '🪒', cost: 15,  looksBonus: 2, description: 'Viso pulito e fresco.' },
    { id: 'beard_trim',  name: 'Sistemare barba',    emoji: '🧔', cost: 20,  looksBonus: 3, description: 'Barba curata e ordinata.' },
    { id: 'luxury',      name: 'Trattamento VIP',    emoji: '👑', cost: 120, looksBonus: 8, description: 'Completo: taglio, colore, maschera.' },
  ]
}
