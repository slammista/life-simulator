export interface PossessionDef {
  id: string
  name: string
  emoji: string
  category: 'jewelry' | 'electronics' | 'clothing' | 'art' | 'collectible'
  price: number
  prestige: number  // 0-100 social reputation bonus when purchased
}

export const POSSESSION_CATALOG: PossessionDef[] = [
  { id: 'gold_ring',         name: "Anello d'oro",             emoji: '💍',  category: 'jewelry',     price: 350,   prestige: 12 },
  { id: 'silver_bracelet',   name: 'Bracciale in argento',     emoji: '✨',  category: 'jewelry',     price: 120,   prestige: 5  },
  { id: 'luxury_watch',      name: 'Orologio di lusso',        emoji: '⌚',  category: 'jewelry',     price: 4500,  prestige: 38 },
  { id: 'diamond_necklace',  name: 'Collana con diamante',     emoji: '💎',  category: 'jewelry',     price: 9500,  prestige: 58 },
  { id: 'smartphone',        name: 'Smartphone top di gamma',  emoji: '📱',  category: 'electronics', price: 1200,  prestige: 12 },
  { id: 'gaming_console',    name: 'Console gaming',           emoji: '🎮',  category: 'electronics', price: 550,   prestige: 8  },
  { id: 'laptop_pro',        name: 'Laptop professionale',     emoji: '💻',  category: 'electronics', price: 2200,  prestige: 14 },
  { id: 'drone_pro',         name: 'Drone professionale',      emoji: '🚁',  category: 'electronics', price: 1800,  prestige: 18 },
  { id: 'designer_bag',      name: 'Borsa firmata',            emoji: '👜',  category: 'clothing',    price: 3200,  prestige: 44 },
  { id: 'luxury_coat',       name: 'Cappotto di design',       emoji: '🧥',  category: 'clothing',    price: 4200,  prestige: 38 },
  { id: 'sneakers_limited',  name: 'Sneakers limited edition', emoji: '👟',  category: 'clothing',    price: 800,   prestige: 22 },
  { id: 'painting',          name: "Quadro d'autore",          emoji: '🖼️', category: 'art',          price: 5500,  prestige: 42 },
  { id: 'sculpture',         name: 'Scultura moderna',         emoji: '🗿',  category: 'art',          price: 14000, prestige: 62 },
  { id: 'rare_card',         name: 'Carta collezionabile rara', emoji: '🃏', category: 'collectible', price: 2200,  prestige: 28 },
  { id: 'signed_vinyl',      name: 'Vinile autografato',       emoji: '📀',  category: 'collectible', price: 700,   prestige: 18 },
  { id: 'vintage_wine',      name: 'Vino vintage pregiato',    emoji: '🍷',  category: 'collectible', price: 900,   prestige: 20 },
]
