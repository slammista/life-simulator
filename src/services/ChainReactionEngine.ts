import type { Relationship } from '../store/types'

export type RelationshipChainAction =
  | 'greet'
  | 'hang_out'
  | 'compliment'
  | 'confess_feelings'
  | 'ask_date'
  | 'kiss'
  | 'propose'
  | 'break_up'
  | 'divorce'
  | 'cheat'
  | 'fight'
  | 'apologize'
  | 'gift'
  | 'insult'

export interface ChainReactionTick {
  relationship: Relationship
  message: string | null
}

const POSITIVE_FLAGS = new Set(['chain_gratitude', 'chain_warmth', 'chain_repairing'])
const NEGATIVE_FLAGS = new Set(['chain_trust_decay', 'chain_tension', 'chain_jealousy'])

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function uniqueFlags(flags: string[]) {
  return [...new Set(flags)]
}

function withoutFlags(flags: string[], remove: Set<string>) {
  return flags.filter(flag => !remove.has(flag))
}

export class ChainReactionEngine {
  static applyAction(
    rel: Relationship,
    action: RelationshipChainAction,
    updatedRel: Partial<Relationship>,
  ): Partial<Relationship> {
    let flags = uniqueFlags(updatedRel.historyFlags ?? rel.historyFlags)

    switch (action) {
      case 'hang_out':
      case 'compliment':
      case 'kiss':
        flags = uniqueFlags([...withoutFlags(flags, NEGATIVE_FLAGS), 'chain_warmth'])
        break
      case 'gift':
        flags = uniqueFlags([...withoutFlags(flags, new Set(['chain_tension'])), 'chain_gratitude'])
        break
      case 'apologize':
        flags = uniqueFlags([...withoutFlags(flags, new Set(['chain_trust_decay', 'chain_tension'])), 'chain_repairing'])
        break
      case 'fight':
        flags = uniqueFlags([...withoutFlags(flags, POSITIVE_FLAGS), 'chain_tension'])
        break
      case 'insult':
        flags = uniqueFlags([...withoutFlags(flags, POSITIVE_FLAGS), 'chain_trust_decay'])
        break
      case 'cheat':
        flags = uniqueFlags([...withoutFlags(flags, POSITIVE_FLAGS), 'chain_jealousy'])
        break
      case 'break_up':
      case 'divorce':
        flags = uniqueFlags([...withoutFlags(flags, POSITIVE_FLAGS), 'chain_trust_decay', 'chain_tension'])
        break
      default:
        break
    }

    return { ...updatedRel, historyFlags: flags }
  }

  static annualTick(rel: Relationship): ChainReactionTick {
    const flags = new Set(rel.historyFlags)
    let trust = rel.trust
    let love = rel.love
    let jealousy = rel.jealousy
    let respect = rel.respect
    const messages: string[] = []

    if (flags.has('chain_warmth')) {
      trust = clamp(trust + 1)
      love = rel.stage === 'partner' || rel.stage === 'spouse' ? clamp(love + 1) : love
    }

    if (flags.has('chain_gratitude')) {
      trust = clamp(trust + 2)
      respect = clamp(respect + 1)
    }

    if (flags.has('chain_repairing')) {
      trust = clamp(trust + 1)
      jealousy = clamp(jealousy - 2)
    }

    if (flags.has('chain_trust_decay')) {
      trust = clamp(trust - 4)
      respect = clamp(respect - 2)
      if (trust <= 25) messages.push(`${rel.name} si sta allontanando per vecchie ferite.`)
    }

    if (flags.has('chain_tension')) {
      trust = clamp(trust - 2)
      jealousy = clamp(jealousy + 2)
    }

    if (flags.has('chain_jealousy')) {
      jealousy = clamp(jealousy + 5)
      love = rel.stage === 'partner' || rel.stage === 'spouse' ? clamp(love - 2) : love
      if (jealousy >= 75) messages.push(`${rel.name} continua a sospettare di te.`)
    }

    return {
      relationship: {
        ...rel,
        trust,
        love,
        jealousy,
        respect,
      },
      message: messages.length > 0 ? messages.join(' ') : null,
    }
  }
}
