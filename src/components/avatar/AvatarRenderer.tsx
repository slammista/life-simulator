import { useId } from 'react'
import { useGameStore } from '../../store/gameStore'
import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTHES_COLORS,
  applyAgeToConfig, getDefaultAvatar,
} from '../../services/AvatarEngine'
import type { AvatarConfig, AvatarHairStyle, EyeStyle, BrowStyle, BeardStyle, Gender } from '../../store/types'

const SIZE_PX = { sm: 38, md: 80, lg: 120 } as const

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const d = (ch: number) => Math.max(0, Math.floor(ch * (1 - amt))).toString(16).padStart(2, '0')
  return `#${d((n >> 16) & 255)}${d((n >> 8) & 255)}${d(n & 255)}`
}

function HairBack({ style, fill }: { style: AvatarHairStyle; fill: string }) {
  switch (style) {
    case 'bald':
    case 'buzz':
    case 'short':
      return null
    case 'medium':
      return (
        <>
          <rect x="18" y="31" width="8" height="22" rx="4" fill={fill} />
          <rect x="74" y="31" width="8" height="22" rx="4" fill={fill} />
        </>
      )
    case 'long':
      return (
        <>
          <rect x="15" y="28" width="10" height="54" rx="5" fill={fill} />
          <rect x="75" y="28" width="10" height="54" rx="5" fill={fill} />
        </>
      )
    case 'wavy':
      return (
        <>
          <path d="M 18 32 C 12 40 15 48 18 54 C 12 60 15 68 19 72 L 27 72 C 23 68 26 60 22 54 C 25 48 22 40 28 32 Z" fill={fill} />
          <path d="M 82 32 C 88 40 85 48 82 54 C 88 60 85 68 81 72 L 73 72 C 77 68 74 60 78 54 C 75 48 78 40 72 32 Z" fill={fill} />
        </>
      )
    case 'curly':
      return (
        <>
          <ellipse cx="21" cy="48" rx="7" ry="18" fill={fill} />
          <ellipse cx="79" cy="48" rx="7" ry="18" fill={fill} />
          <ellipse cx="50" cy="14" rx="20" ry="10" fill={fill} />
        </>
      )
    case 'afro':
      return <ellipse cx="50" cy="28" rx="34" ry="26" fill={fill} />
    case 'ponytail':
      return (
        <path d="M 70 26 Q 86 22 90 36 Q 92 50 82 56 Q 78 44 76 36 Q 73 30 70 26 Z" fill={fill} />
      )
    case 'bun':
      return <ellipse cx="50" cy="11" rx="11" ry="9" fill={fill} />
    default:
      return null
  }
}

function HairCap({ style, fill, clipId }: { style: AvatarHairStyle; fill: string; clipId: string }) {
  if (style === 'bald') return null
  const inner = style === 'buzz'
    ? <rect x="24" y="16" width="52" height="11" rx="5.5" fill={fill} />
    : <circle cx="50" cy="18" r="28" fill={fill} />
  return <g clipPath={`url(#${clipId})`}>{inner}</g>
}

function Eyes({ style, fill }: { style: EyeStyle; fill: string }) {
  const positions = [40, 60] as const
  return (
    <>
      {positions.map(cx => {
        const key = cx
        if (style === 'almond') return (
          <g key={key}>
            <ellipse cx={cx} cy={44} rx="4.5" ry="3" fill="white" />
            <circle cx={cx} cy={44} r="2" fill={fill} />
            <circle cx={cx} cy={44} r="1.1" fill="#111" />
            <circle cx={cx + 0.9} cy={43} r="0.55" fill="white" />
          </g>
        )
        if (style === 'wide') return (
          <g key={key}>
            <circle cx={cx} cy={44} r="5" fill="white" />
            <circle cx={cx} cy={44} r="3" fill={fill} />
            <circle cx={cx} cy={44} r="1.6" fill="#111" />
            <circle cx={cx + 1} cy={43} r="0.7" fill="white" />
          </g>
        )
        if (style === 'narrow') return (
          <g key={key}>
            <ellipse cx={cx} cy={44} rx="5" ry="2.5" fill="white" />
            <circle cx={cx} cy={44} r="1.8" fill={fill} />
            <circle cx={cx} cy={44} r="1" fill="#111" />
          </g>
        )
        // round (default)
        return (
          <g key={key}>
            <circle cx={cx} cy={44} r="4" fill="white" />
            <circle cx={cx} cy={44} r="2.5" fill={fill} />
            <circle cx={cx} cy={44} r="1.4" fill="#111" />
            <circle cx={cx + 0.9} cy={43.2} r="0.65" fill="white" />
          </g>
        )
      })}
    </>
  )
}

function Brows({ style, color }: { style: BrowStyle; color: string }) {
  const sw = style === 'thick' ? 2.5 : style === 'thin' ? 0.9 : 1.6
  const arch = style === 'arched'
  return (
    <>
      <path
        d={arch ? 'M 35 38 Q 40 32 45 37' : 'M 35 37 Q 40 35 45 37'}
        stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"
      />
      <path
        d={arch ? 'M 55 37 Q 60 32 65 38' : 'M 55 37 Q 60 35 65 37'}
        stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round"
      />
    </>
  )
}

function Beard({ style, fill }: { style: BeardStyle; fill: string }) {
  if (style === 'none') return null
  if (style === 'stubble') return <ellipse cx="50" cy="59" rx="14" ry="7" fill={fill} opacity="0.3" />
  if (style === 'short')   return <ellipse cx="50" cy="60" rx="14" ry="8" fill={fill} opacity="0.65" />
  if (style === 'full') return (
    <>
      <ellipse cx="50" cy="62" rx="17" ry="10" fill={fill} />
      <ellipse cx="50" cy="57" rx="12" ry="5"  fill={fill} />
    </>
  )
  if (style === 'goatee')   return <ellipse cx="50" cy="62" rx="7" ry="7" fill={fill} opacity="0.85" />
  if (style === 'mustache') return (
    <>
      <ellipse cx="44" cy="56" rx="5.5" ry="2.5" fill={fill} />
      <ellipse cx="56" cy="56" rx="5.5" ry="2.5" fill={fill} />
    </>
  )
  return null
}

interface Props {
  size?: 'sm' | 'md' | 'lg'
  config?: AvatarConfig
  age?: number
  gender?: Gender | string
  style?: React.CSSProperties
}

export function AvatarRenderer({ size = 'sm', config, age, gender, style }: Props) {
  const rawId = useId()
  const clipId = 'av' + rawId.replace(/[^a-zA-Z0-9]/g, '')

  const playerAvatar  = useGameStore(s => s.identity.avatar)
  const playerAge     = useGameStore(s => s.time.age)
  const playerGender  = useGameStore(s => s.identity.gender)

  const resolvedGender  = (gender ?? playerGender) as Gender
  const resolvedConfig  = config ?? playerAvatar ?? getDefaultAvatar(resolvedGender)
  const resolvedAge     = age ?? playerAge

  const aged = applyAgeToConfig(resolvedAge, resolvedConfig)

  const skinHex    = SKIN_TONES[aged.skinTone]     ?? '#F5C18C'
  const hairHex    = HAIR_COLORS[aged.hairColor]   ?? '#3B2314'
  const eyeHex     = EYE_COLORS[aged.eyeColor]     ?? '#6B4226'
  const clothesHex = CLOTHES_COLORS[aged.clothesStyle] ?? '#4A6FA5'

  const skinDark    = darken(skinHex, 0.15)
  const clothesDark = darken(clothesHex, 0.22)
  const browColor   = darken(hairHex, 0.1)

  const px = SIZE_PX[size]

  return (
    <svg
      viewBox="0 0 100 100"
      width={px}
      height={px}
      style={{ display: 'block', flexShrink: 0, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="42" r="26" />
        </clipPath>
      </defs>

      {/* Body */}
      <rect x="18" y="76" width="64" height="28" rx="10" fill={clothesHex} />
      <rect x="18" y="76" width="64" height="10" rx="5" fill={clothesDark} />

      {/* Neck */}
      <rect x="43" y="64" width="14" height="16" rx="4" fill={skinHex} />

      {/* Hair back (rendered behind head) */}
      <HairBack style={aged.hairStyle} fill={hairHex} />

      {/* Ears */}
      <circle cx="24" cy="44" r="5.5" fill={skinHex} />
      <circle cx="76" cy="44" r="5.5" fill={skinHex} />
      <circle cx="24" cy="44" r="3.2" fill={skinDark} opacity="0.4" />
      <circle cx="76" cy="44" r="3.2" fill={skinDark} opacity="0.4" />

      {/* Head base */}
      <circle cx="50" cy="42" r="26" fill={skinHex} />

      {/* Hair cap (clipped to head) */}
      <HairCap style={aged.hairStyle} fill={hairHex} clipId={clipId} />

      {/* Eyebrows */}
      <Brows style={aged.browStyle} color={browColor} />

      {/* Eyes */}
      <Eyes style={aged.eyeStyle} fill={eyeHex} />

      {/* Nose */}
      <ellipse cx="47.5" cy="52" rx="1.6" ry="1.1" fill={skinDark} opacity="0.45" />
      <ellipse cx="52.5" cy="52" rx="1.6" ry="1.1" fill={skinDark} opacity="0.45" />

      {/* Mouth */}
      <path
        d="M 43 58 Q 50 63 57 58"
        stroke={darken(skinHex, 0.3)} strokeWidth="1.5" fill="none" strokeLinecap="round"
      />

      {/* Beard */}
      <Beard style={aged.beardStyle} fill={hairHex} />

      {/* Age: acne */}
      {aged.hasAcne && (
        <>
          <circle cx="38" cy="49" r="1.1" fill="#FF6B6B" opacity="0.7" />
          <circle cx="63" cy="51" r="1.3" fill="#FF6B6B" opacity="0.6" />
          <circle cx="42" cy="61" r="0.9" fill="#FF6B6B" opacity="0.5" />
        </>
      )}

      {/* Age: light wrinkles */}
      {aged.showLightWrinkles && (
        <>
          <path d="M 31 38 Q 35 36 39 38" stroke={skinDark} strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M 61 38 Q 65 36 69 38" stroke={skinDark} strokeWidth="0.8" fill="none" opacity="0.35" />
        </>
      )}

      {/* Age: wrinkles */}
      {aged.showWrinkles && (
        <>
          <path d="M 29 38 Q 34 35 39 38" stroke={skinDark} strokeWidth="1"   fill="none" opacity="0.5" />
          <path d="M 61 38 Q 66 35 71 38" stroke={skinDark} strokeWidth="1"   fill="none" opacity="0.5" />
          <path d="M 39 56 Q 43 58 47 56" stroke={skinDark} strokeWidth="0.8" fill="none" opacity="0.4" />
          <path d="M 53 56 Q 57 58 61 56" stroke={skinDark} strokeWidth="0.8" fill="none" opacity="0.4" />
          <path d="M 44 40 Q 46 38 48 40" stroke={skinDark} strokeWidth="0.6" fill="none" opacity="0.3" />
          <path d="M 52 40 Q 54 38 56 40" stroke={skinDark} strokeWidth="0.6" fill="none" opacity="0.3" />
        </>
      )}

      {/* Baby rosy cheeks */}
      {aged.isBaby && (
        <>
          <ellipse cx="34" cy="52" rx="5" ry="3.5" fill="#FF9A9A" opacity="0.35" />
          <ellipse cx="66" cy="52" rx="5" ry="3.5" fill="#FF9A9A" opacity="0.35" />
        </>
      )}
    </svg>
  )
}
