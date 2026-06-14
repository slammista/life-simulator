// Shared relationship action lists + label maps.
// Used by RelationshipScreen (list) and PersonDetailModal (BitLife-style detail).

import type { NPCMood, NPCPersonalityTrait, Relationship } from '../../store/types'
import type { NPCAction } from '../../services/RelationshipEngine'

export const STAGE_EMOJI: Record<string, string> = {
  stranger: '👤',
  acquaintance: '👋',
  friend: '😊',
  close_friend: '🤝',
  partner: '💑',
  spouse: '💍',
}

export const MOOD_LABELS: Record<NPCMood, { label: string; emoji: string; color: string }> = {
  neutrale: { label: 'Neutrale', emoji: '😐', color: '#94a3b8' },
  felice: { label: 'Felice', emoji: '😊', color: '#86efac' },
  triste: { label: 'Triste', emoji: '😢', color: '#93c5fd' },
  geloso: { label: 'Geloso', emoji: '😒', color: '#fbbf24' },
  arrabbiato: { label: 'Arrabbiato', emoji: '😠', color: '#fca5a5' },
  nostalgico: { label: 'Nostalgico', emoji: '🥲', color: '#c4b5fd' },
  ansioso: { label: 'Ansioso', emoji: '😰', color: '#fdba74' },
  motivato: { label: 'Motivato', emoji: '🔥', color: '#facc15' },
}

export const TRAIT_LABELS: Record<NPCPersonalityTrait, string> = {
  introverso: 'Introverso',
  ambizioso: 'Ambizioso',
  geloso: 'Geloso',
  generoso: 'Generoso',
  sensibile: 'Sensibile',
  sicuro: 'Sicuro',
  avido: 'Avido',
  leale: 'Leale',
  empatico: 'Empatico',
  impulsivo: 'Impulsivo',
}

export const REL_TYPE_LABELS: Record<string, string> = {
  parent: 'Genitore',
  sibling: 'Fratello/Sorella',
  partner: 'Partner',
  spouse: 'Coniuge',
  ex_partner: 'Ex partner',
  child: 'Figlio/a',
  friend: 'Amico/a',
  best_friend: 'Migliore amico/a',
  colleague: 'Collega',
  rival: 'Rivale',
  enemy: 'Nemico',
  acquaintance: 'Conoscente',
}

export const CHAIN_LABELS: Record<string, { label: string; color: string }> = {
  chain_warmth: { label: 'Legame caldo', color: '#86efac' },
  chain_gratitude: { label: 'Gratitudine', color: '#facc15' },
  chain_repairing: { label: 'Riparazione', color: '#93c5fd' },
  chain_trust_decay: { label: 'Ferita aperta', color: '#fca5a5' },
  chain_tension: { label: 'Tensione', color: '#fdba74' },
  chain_jealousy: { label: 'Sospetto', color: '#f0abfc' },
}

export const ACTIONS_BY_STAGE: Record<string, Array<{ action: NPCAction; label: string; emoji: string }>> = {
  stranger: [
    { action: 'greet', label: 'Saluta', emoji: '👋' },
  ],
  acquaintance: [
    { action: 'greet', label: 'Saluta', emoji: '👋' },
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'compliment', label: 'Complimento', emoji: '😊' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'confess_feelings', label: 'Confessa', emoji: '💕' },
  ],
  friend: [
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'do_activity', label: 'Attività insieme', emoji: '🎳' },
    { action: 'spend_time', label: 'Tempo insieme', emoji: '🕰️' },
    { action: 'compliment', label: 'Complimento', emoji: '😊' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'lend_money', label: 'Presta soldi', emoji: '💸' },
    { action: 'ask_money', label: 'Chiedi soldi', emoji: '💶' },
    { action: 'ask_date', label: 'Appuntamento', emoji: '💑' },
    { action: 'confess_feelings', label: 'Confessa', emoji: '💕' },
    { action: 'make_peace', label: 'Fai pace', emoji: '🕊️' },
    { action: 'fight', label: 'Litigate', emoji: '😠' },
  ],
  close_friend: [
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'do_activity', label: 'Attività insieme', emoji: '🎳' },
    { action: 'spend_time', label: 'Tempo insieme', emoji: '🕰️' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'lend_money', label: 'Presta soldi', emoji: '💸' },
    { action: 'ask_money', label: 'Chiedi soldi', emoji: '💶' },
    { action: 'ask_date', label: 'Appuntamento', emoji: '💑' },
    { action: 'kiss', label: 'Bacio', emoji: '😘' },
    { action: 'confess_feelings', label: 'Confessa', emoji: '💕' },
    { action: 'make_peace', label: 'Fai pace', emoji: '🕊️' },
    { action: 'fight', label: 'Litigate', emoji: '😠' },
    { action: 'apologize', label: 'Chiedi scusa', emoji: '🙏' },
  ],
  partner: [
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'romantic_outing', label: 'Uscita romantica', emoji: '🌹' },
    { action: 'surprise', label: 'Sorpresa', emoji: '🎉' },
    { action: 'vacation_together', label: 'Vacanza insieme', emoji: '✈️' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'kiss', label: 'Bacio', emoji: '😘' },
    { action: 'propose_cohabitation', label: 'Convivenza', emoji: '🏠' },
    { action: 'propose', label: 'Proposta', emoji: '💍' },
    { action: 'cheat', label: 'Tradisci', emoji: '😈' },
    { action: 'fight', label: 'Litigate', emoji: '😠' },
    { action: 'apologize', label: 'Chiedi scusa', emoji: '🙏' },
    { action: 'break_up', label: 'Lascia', emoji: '💔' },
  ],
  spouse: [
    { action: 'hang_out', label: 'Esci insieme', emoji: '☕' },
    { action: 'romantic_outing', label: 'Uscita romantica', emoji: '🌹' },
    { action: 'surprise', label: 'Sorpresa', emoji: '🎉' },
    { action: 'vacation_together', label: 'Vacanza insieme', emoji: '✈️' },
    { action: 'gift', label: 'Regalo', emoji: '🎁' },
    { action: 'kiss', label: 'Bacio', emoji: '😘' },
    { action: 'cheat', label: 'Tradisci', emoji: '😈' },
    { action: 'fight', label: 'Litigate', emoji: '😠' },
    { action: 'apologize', label: 'Chiedi scusa', emoji: '🙏' },
    { action: 'divorce', label: 'Divorzia', emoji: '📜' },
  ],
}

// Family members get a dedicated action list, independent of relationship stage.
export const FAMILY_ACTIONS: Array<{ action: NPCAction; label: string; emoji: string }> = [
  { action: 'spend_time', label: 'Tempo insieme', emoji: '🕰️' },
  { action: 'gift', label: 'Regalo', emoji: '🎁' },
  { action: 'ask_money', label: 'Chiedi soldi', emoji: '💶' },
  { action: 'thank', label: 'Ringrazia', emoji: '🙏' },
  { action: 'surprise', label: 'Sorpresa', emoji: '🎉' },
  { action: 'make_peace', label: 'Fai pace', emoji: '🕊️' },
  { action: 'fight', label: 'Litiga', emoji: '😠' },
]

export const ROMANTIC_ACTIONS: NPCAction[] = ['confess_feelings', 'ask_date', 'kiss', 'propose', 'cheat', 'break_up', 'divorce', 'romantic_outing', 'propose_cohabitation']
export const FAMILY_TYPES = ['parent', 'sibling', 'child']

export function getAllowedActions(
  rel: Relationship,
  playerAge: number,
): Array<{ action: NPCAction; label: string; emoji: string }> {
  const base = FAMILY_TYPES.includes(rel.type)
    ? FAMILY_ACTIONS
    : ACTIONS_BY_STAGE[rel.stage] ?? ACTIONS_BY_STAGE.stranger
  return base.filter(({ action }) => {
    if (FAMILY_TYPES.includes(rel.type) && ROMANTIC_ACTIONS.includes(action)) return false
    if (rel.age < 18 && ROMANTIC_ACTIONS.includes(action)) return false
    if (playerAge < 18 && (action === 'cheat' || action === 'divorce')) return false
    if (playerAge < 16 && ROMANTIC_ACTIONS.includes(action)) return false
    return true
  })
}
