import type { GameState } from '../store/types'

export interface RibbonDefinition {
  id: string
  name: string
  description: string
  emoji: string
  category: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  check: (state: GameState) => boolean
}

export const RIBBON_DEFINITIONS: RibbonDefinition[] = [
  // Career
  { id: 'first_job',      name: 'Primo Stipendio',    emoji: '💼', category: 'career', tier: 'bronze',   description: 'Trovato il primo lavoro.',          check: s => s.career.jobHistory.length > 0 || s.career.currentJob !== null },
  { id: 'promotion',      name: 'Promosso!',           emoji: '📈', category: 'career', tier: 'bronze',   description: 'Ottenuto la prima promozione.',      check: s => s.career.promotions >= 1 },
  { id: 'business_owner', name: 'Imprenditore',        emoji: '🏢', category: 'career', tier: 'silver',   description: 'Aperta la propria azienda.',         check: s => s.career.businessOwned !== null },
  { id: 'ceo_early',      name: 'CEO a 35',            emoji: '👔', category: 'career', tier: 'gold',     description: 'CEO prima dei 35 anni.',             check: s => s.time.age <= 35 && s.career.businessOwned !== null },
  { id: 'influencer_100k',name: 'Influencer',          emoji: '📱', category: 'career', tier: 'gold',     description: '100k follower su social.',           check: s => s.socialMedia.some(p => p.followers >= 100000) },
  { id: 'mega_influencer', name: 'Mega Influencer',    emoji: '⭐', category: 'career', tier: 'platinum', description: '1M follower su social.',             check: s => s.socialMedia.some(p => p.followers >= 1000000) },

  // Financial
  { id: 'first_100k',     name: 'Risparmiatore',       emoji: '💵', category: 'financial', tier: 'bronze', description: '€100.000 in banca.',               check: s => s.finance.money >= 100000 },
  { id: 'millionaire',    name: 'Milionario',           emoji: '💰', category: 'financial', tier: 'silver', description: '€1.000.000 accumulati.',           check: s => s.finance.money >= 1000000 },
  { id: 'millionaire_30', name: 'Milionario a 30',      emoji: '🚀', category: 'financial', tier: 'gold',   description: '€1M prima dei 30 anni.',           check: s => s.time.age <= 30 && s.finance.money >= 1000000 },
  { id: 'billionaire',    name: 'Miliardario',          emoji: '💎', category: 'financial', tier: 'diamond','description': '€1 miliardo.',                   check: s => s.finance.money >= 1000000000 },
  { id: 'debt_free',      name: 'Zero Debiti',          emoji: '🆓', category: 'financial', tier: 'silver', description: 'Nessun debito a 40 anni.',         check: s => s.time.age >= 40 && s.finance.debt === 0 },
  { id: 'jackpot',        name: 'Jackpot!',             emoji: '🎰', category: 'financial', tier: 'diamond','description': 'Vinto il jackpot.',               check: s => s.gambling.jackpotWon },

  // Relational
  { id: 'first_love',     name: 'Primo Amore',          emoji: '❤️', category: 'relational', tier: 'bronze', description: 'Prima relazione seria.',          check: s => s.relationships.some(r => r.stage === 'partner' || r.stage === 'spouse') },
  { id: 'married',        name: 'Sposato',              emoji: '💍', category: 'relational', tier: 'bronze', description: 'Matrimonio celebrato.',            check: s => s.relationships.some(r => r.stage === 'spouse') },
  { id: 'big_family',     name: 'Grande Famiglia',      emoji: '👨‍👩‍👧‍👦', category: 'relational', tier: 'silver', description: 'Almeno 3 figli.',               check: s => s.children.length >= 3 },
  { id: 'long_marriage',  name: 'Matrimonio 20 anni',   emoji: '🥂', category: 'relational', tier: 'gold',   description: '20 anni di matrimonio.',          check: s => { const sp = s.relationships.find(r => r.stage === 'spouse' && r.isAlive); return !!sp && s.time.age >= 40 && sp.trust > 50 } },
  { id: 'divorce',        name: 'Divorziato',           emoji: '💔', category: 'relational', tier: 'bronze', description: 'Primo divorzio.',                 check: s => s.relationships.some(r => (r.stage as string) === 'ex_partner' && r.historyFlags.includes('divorced')) },

  // Educational
  { id: 'graduate',       name: 'Laureato',             emoji: '🎓', category: 'educational', tier: 'bronze', description: 'Laurea triennale.',              check: s => s.education.completedLevels.includes('bachelor') },
  { id: 'phd_achieved',   name: 'Dottorato',            emoji: '🔬', category: 'educational', tier: 'gold',   description: 'PhD conseguito.',                check: s => s.education.completedLevels.includes('phd') },
  { id: 'perfect_gpa',    name: 'GPA Perfetto',         emoji: '📚', category: 'educational', tier: 'silver', description: 'GPA 4.0.',                       check: s => s.education.gpa >= 3.9 },

  // Health
  { id: 'fitness_guru',   name: 'Guru del Fitness',     emoji: '🏋️', category: 'health', tier: 'silver', description: 'Fitness level > 80.',               check: s => s.health.fitnessLevel > 80 },
  { id: 'healthy_60',     name: 'Sano a 60',            emoji: '💪', category: 'health', tier: 'gold',   description: 'Salute > 70 a 60 anni.',             check: s => s.time.age >= 60 && s.stats.health > 70 },
  { id: 'centenarian',    name: 'Centenario',           emoji: '🎂', category: 'health', tier: 'diamond','description': 'Raggiunto 100 anni.',              check: s => s.time.age >= 100 },
  { id: 'clean_mind',     name: 'Mente Libera',         emoji: '🧠', category: 'health', tier: 'silver', description: 'Nessuna dipendenza a 50 anni.',     check: s => s.time.age >= 50 && s.health.addictions.length === 0 && s.gambling.addictionLevel < 20 },

  // Criminal
  { id: 'clean_life',     name: 'Vita Pulita',          emoji: '⚖️', category: 'criminal', tier: 'silver', description: 'Nessun crimine a 40 anni.',       check: s => s.time.age >= 40 && !s.criminal.hasRecord },
  { id: 'first_arrest',   name: 'Prima Volta',          emoji: '🚔', category: 'criminal', tier: 'bronze', description: 'Primo arresto.',                  check: s => s.criminal.crimes.length > 0 },
  { id: 'prison_break',   name: 'Ex Carcerato',         emoji: '🔓', category: 'criminal', tier: 'silver', description: 'Uscito di prigione.',              check: s => s.criminal.prisonServed > 0 && !s.criminal.inPrison },
  { id: 'mob_boss',       name: 'Capo della Banda',     emoji: '🕶️', category: 'criminal', tier: 'gold',   description: '10+ crimini senza condanna.',     check: s => s.criminal.crimes.filter(c => !c.convicted).length >= 10 },

  // Travel
  { id: 'first_trip',     name: 'Primo Viaggio',        emoji: '✈️', category: 'travel', tier: 'bronze', description: 'Primo viaggio internazionale.',     check: s => s.travelHistory.length > 0 },
  { id: 'world_traveler', name: 'Esploratore',          emoji: '🌍', category: 'travel', tier: 'silver', description: 'Visitato 10+ destinazioni.',        check: s => new Set(s.travelHistory.map(t => t.destination)).size >= 10 },
  { id: 'globetrotter',   name: 'Globetrotter',         emoji: '🌏', category: 'travel', tier: 'gold',   description: 'Visitato 25+ destinazioni.',        check: s => new Set(s.travelHistory.map(t => t.destination)).size >= 25 },

  // Special
  { id: 'military_hero',  name: 'Eroe Militare',        emoji: '🎖️', category: 'special', tier: 'gold',   description: '10 missioni + 2 decorazioni.',    check: s => s.military.missions >= 10 && s.military.decorations.length >= 2 },
  { id: 'self_made',      name: 'Self-Made',            emoji: '🚀', category: 'special', tier: 'diamond','description': 'Da povero a €500k.',              check: s => s.identity.familyBackground === 'poor' && s.finance.money >= 500000 },
  { id: 'politician',     name: 'Politico',             emoji: '🏛️', category: 'special', tier: 'gold',   description: 'Ruolo politico alto.',             check: s => ['premier', 'presidente', 'senatore', 'deputato'].includes(s.politics.currentRole ?? '') },
  { id: 'plastic_king',   name: 'Re della Chirurgia',   emoji: '✨', category: 'special', tier: 'silver', description: '5 interventi di chirurgia estetica.', check: s => s.cosmeticSurgery.totalSurgeries >= 5 },
  { id: 'sex_health_clean',name: 'Salute Sessuale Perfetta', emoji: '❤️‍🩹', category: 'health', tier: 'silver', description: 'Arriva a 40 anni senza MST.', check: s => s.time.age >= 40 && s.sexualHealth.activeSTIs.length === 0 },
  { id: 'casino_blacklist',name: 'Cacciato dal Casinò', emoji: '🚫', category: 'special', tier: 'bronze', description: 'Bannato dal casinò.',               check: s => s.gambling.casinoBlacklisted },
  { id: 'jackpot_winner',  name: 'Fortuna Sfacciata',   emoji: '🍀', category: 'special', tier: 'platinum','description': 'Jackpot vinto.',                 check: s => s.gambling.jackpotWon },
  { id: 'pregnant_ivf',   name: 'Miracolo Moderno',     emoji: '🌸', category: 'special', tier: 'silver', description: 'Gravidanza tramite FIV.',           check: s => s.sexualHealth.ivfAttempts > 0 && (s.children.length > 0) },
  { id: 'legacy_continue', name: 'La Dinastia Continua',emoji: '🔄', category: 'special', tier: 'gold',   description: 'Continuato come figlio.',           check: s => s.legacy !== null && s.time.age < 20 },
]

export class AchievementsEngine {
  static checkAndUnlock(state: GameState): { newRibbons: RibbonDefinition[]; messages: string[] } {
    const unlockedIds = new Set(state.ribbons.filter(r => r.unlocked).map(r => r.id))
    const newRibbons: RibbonDefinition[] = []
    const messages: string[] = []

    for (const def of RIBBON_DEFINITIONS) {
      if (unlockedIds.has(def.id)) continue
      try {
        if (def.check(state)) {
          newRibbons.push(def)
          messages.push(`🏅 Achievement sbloccato: ${def.emoji} ${def.name} (${def.tier.toUpperCase()})`)
        }
      } catch {
        // silently skip if check fails due to state mismatch
      }
    }

    return { newRibbons, messages }
  }

  static buildRibbonRecord(def: RibbonDefinition, year: number) {
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      tier: def.tier,
      unlocked: true,
      unlockedYear: year,
      icon: def.emoji,
    }
  }
}
