import { AnimatePresence, motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

export type TransitionDirection = 'push' | 'pop' | 'cross'

interface Props {
  transitionKey: string
  direction: TransitionDirection
  children: ReactNode
}

// 'push' = drilling into a sub-screen (list → detail), 'pop' = going back,
// 'cross' = switching top-level tabs (no spatial relationship, so just fades).
const VARIANTS: Record<TransitionDirection, Variants> = {
  push: {
    initial: { opacity: 0, x: 26 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -18 },
  },
  pop: {
    initial: { opacity: 0, x: -26 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 18 },
  },
  cross: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
}

const TRANSITION = { duration: 0.22, ease: [0.34, 0.8, 0.36, 1] as const }

// Wraps the entire `.app-content` subtree; changing `transitionKey` remounts this
// motion.div, which AnimatePresence intercepts as an exit+enter pair instead of an
// instant swap. Everything inside `children` (the ~40 existing tab/sub-tab
// conditionals) is untouched — this component only owns the crossfade/slide.
export function PageTransition({ transitionKey, direction, children }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        variants={VARIANTS[direction]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={TRANSITION}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
