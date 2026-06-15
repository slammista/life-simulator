import { useGameStore } from '../../store/gameStore'
import { getDefaultAvatar, applyAgeToConfig } from '../../services/AvatarEngine'
import { buildBrightAvatarInner } from '../../services/brightAvatarSvg'
import type { AvatarConfig, Gender } from '../../store/types'

const SIZE_PX = { sm: 38, md: 80, lg: 120 } as const

interface Props {
  size?: 'sm' | 'md' | 'lg'
  config?: AvatarConfig
  age?: number
  gender?: Gender | string
  style?: React.CSSProperties
  // Subtle idle breathing. Defaults on for md/lg, off for sm.
  animated?: boolean
}

export function AvatarRenderer({ size = 'sm', config, age, gender, style, animated }: Props) {
  const isAnimated = animated ?? size !== 'sm'

  const playerAvatar  = useGameStore(s => s.identity.avatar)
  const playerAge     = useGameStore(s => s.time.age)
  const playerGender  = useGameStore(s => s.identity.gender)

  const resolvedGender  = (gender ?? playerGender) as Gender
  const resolvedConfig  = config ?? playerAvatar ?? getDefaultAvatar(resolvedGender)
  const resolvedAge     = age ?? playerAge

  // Age the config (gray/white hair, child beard suppression, …) then draw it
  // in the shared Bright Avatar style — the same renderer for player and NPCs.
  const aged  = applyAgeToConfig(resolvedAge, resolvedConfig)
  const inner = buildBrightAvatarInner(aged, { background: null })

  const px = SIZE_PX[size]

  return (
    <svg
      viewBox="0 0 200 200"
      width={px}
      height={px}
      className={isAnimated ? 'avatar-animated' : undefined}
      style={{ display: 'block', flexShrink: 0, ...style }}
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
}
