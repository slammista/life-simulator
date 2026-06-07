#!/usr/bin/env node
// Expand random_events using Kaggle dataset patterns
// Sources: emdat disasters 1970-2021, global_inflation_data, World-Stock-Prices
const fs = require('fs')
const path = require('path')
const DB_PATH = path.join(__dirname, '../public/db.json')
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))

// ─── Real probabilities derived from EMDAT dataset (per country per year) ───
// Scaled down: game runs per-year, but player notices only notable events.
// Using ~20% of raw frequency to avoid event spam. Min 0.02, max 0.20.

const newRandomEvents = [

  // ─── DISASTRI NATURALI (da EMDAT 1970-2021) ─────────────────────────────
  {
    id: 'rev_flood',
    title: 'Alluvione',
    description: 'Forti piogge causano allagamenti nella tua zona. Strade chiuse, danni alle abitazioni.',
    emoji: '🌊',
    probability: 0.12, // emdat global avg ~0.9/yr, scaled 0.12 per salience
    effects: { money: -800, happiness: -8, health: -3 },
    nations: ['italy', 'france', 'germany', 'brazil', 'ukraine', 'uk'], // più frequente in questi
    packId: 'base'
  },
  {
    id: 'rev_storm',
    title: 'Tempesta Violenta',
    description: 'Un temporale eccezionale colpisce la regione. Danni al tetto, blackout diffusi.',
    emoji: '⛈️',
    probability: 0.10,
    effects: { money: -500, happiness: -6, energy: -5 },
    nations: ['japan', 'france', 'germany', 'brazil', 'spain', 'uk'],
    packId: 'base'
  },
  {
    id: 'rev_earthquake',
    title: 'Terremoto',
    description: 'La terra trema. Una scossa significativa colpisce la zona. Edifici danneggiati.',
    emoji: '🏚️',
    probability: 0.04, // 0.18/yr globale, raro per singolo player
    effects: { money: -2000, health: -10, happiness: -15, mentalHealth: -10 },
    nations: ['italy', 'japan'],
    packId: 'base'
  },
  {
    id: 'rev_heatwave',
    title: 'Ondata di Caldo Estremo',
    description: 'Temperature record per settimane. La città è in ginocchio, ospedali sotto stress.',
    emoji: '🌡️',
    probability: 0.08, // 0.26/yr globale
    effects: { health: -8, energy: -12, happiness: -6 },
    nations: ['italy', 'france', 'germany', 'spain', 'japan', 'ukraine'],
    packId: 'base'
  },
  {
    id: 'rev_wildfire',
    title: 'Incendi Boschivi',
    description: 'Incendi fuori controllo distruggono zone boschive vicino alla tua città. Aria irrespirabile.',
    emoji: '🔥',
    probability: 0.05,
    effects: { health: -6, happiness: -8, money: -200 },
    nations: ['italy', 'spain', 'france', 'brazil'],
    packId: 'base'
  },
  {
    id: 'rev_epidemic_scare',
    title: 'Allarme Epidemico',
    description: 'Un focolaio di malattia infettiva si diffonde nella regione. Misure di contenimento.',
    emoji: '🦠',
    probability: 0.05, // 0.09/yr globale
    effects: { health: -8, happiness: -10, money: -300, mentalHealth: -5 },
    packId: 'base'
  },
  {
    id: 'rev_landslide',
    title: 'Frana',
    description: 'Piogge intense provocano una frana che isola alcuni quartieri.',
    emoji: '⛰️',
    probability: 0.03,
    effects: { money: -600, happiness: -7, health: -4 },
    nations: ['italy', 'japan', 'brazil'],
    packId: 'base'
  },

  // ─── ECONOMIA (da global_inflation_data + World-Stock-Prices) ────────────
  {
    id: 'rev_inflation_crisis',
    title: 'Crisi di Inflazione',
    description: 'I prezzi schizzano verso l\'alto. Spesa alimentare, energia, affitti: tutto costa di più.',
    emoji: '📈',
    probability: 0.10,
    // Italia 2022: 8.7%, Ucraina 2022: 20.2%, Germania 2022: 8.7%
    effects: { money: -600, happiness: -8 },
    packId: 'base'
  },
  {
    id: 'rev_recession',
    title: 'Recessione Economica',
    description: 'L\'economia entra in recessione. Licenziamenti, consumi crollati, incertezza generale.',
    emoji: '📉',
    probability: 0.06,
    effects: { money: -1000, happiness: -10, mentalHealth: -8 },
    packId: 'base'
  },
  {
    id: 'rev_economic_boom',
    title: 'Boom Economico',
    description: 'L\'economia cresce oltre le aspettative. Opportunità di lavoro, investimenti in rialzo.',
    emoji: '🚀',
    probability: 0.05,
    effects: { money: 800, happiness: 8, reputation: 2 },
    packId: 'base'
  },
  {
    id: 'rev_stock_crash',
    title: 'Crollo delle Borse',
    description: 'Crash finanziario globale. I mercati perdono il 30% in pochi giorni.',
    emoji: '🏦',
    probability: 0.04,
    effects: { money: -2000, happiness: -10, mentalHealth: -5 },
    packId: 'base'
  },
  {
    id: 'rev_stock_rally',
    title: 'Rally di Borsa',
    description: 'I mercati azionari segnano rialzi storici. Chi ha investito festeggia.',
    emoji: '💹',
    probability: 0.04,
    effects: { money: 1500, happiness: 8 },
    packId: 'base'
  },
  {
    id: 'rev_tax_increase',
    title: 'Aumento delle Tasse',
    description: 'Il governo introduce nuove aliquote fiscali. La busta paga si assottiglia.',
    emoji: '🧾',
    probability: 0.10,
    effects: { money: -400, happiness: -5 },
    packId: 'base'
  },
  {
    id: 'rev_energy_crisis',
    title: 'Crisi Energetica',
    description: 'Il costo dell\'energia esplode. Riscaldamento, benzina, bollette: tutto a +60%.',
    emoji: '⚡',
    probability: 0.07,
    effects: { money: -500, happiness: -6, energy: -5 },
    packId: 'base'
  },

  // ─── VITA QUOTIDIANA ─────────────────────────────────────────────────────
  {
    id: 'rev_unexpected_bill',
    title: 'Spesa Imprevista',
    description: 'Una riparazione urgente, una multa, un guasto: il conto arriva sempre nel momento sbagliato.',
    emoji: '🔧',
    probability: 0.15,
    effects: { money: -350, happiness: -5 },
    packId: 'base'
  },
  {
    id: 'rev_car_breakdown',
    title: 'Auto in Panne',
    description: 'L\'auto si ferma nel mezzo del traffico. Carro attrezzi e meccanico: conto salato.',
    emoji: '🚗',
    probability: 0.10,
    effects: { money: -600, happiness: -8, energy: -6 },
    packId: 'base'
  },
  {
    id: 'rev_house_damage',
    title: 'Danno in Casa',
    description: 'Perdita d\'acqua, cortocircuito o infestazione: la casa richiede intervento urgente.',
    emoji: '🏠',
    probability: 0.08,
    effects: { money: -700, happiness: -6, energy: -5 },
    packId: 'base'
  },
  {
    id: 'rev_flu',
    title: 'Influenza Stagionale',
    description: 'Ti ammali. Una settimana a letto tra febbre, tosse e serie TV.',
    emoji: '🤒',
    probability: 0.20,
    effects: { health: -6, energy: -10, happiness: -4 },
    packId: 'base'
  },
  {
    id: 'rev_identity_theft',
    title: 'Furto di Identità',
    description: 'Qualcuno usa i tuoi dati per aprire conti o fare acquisti. Scoperto solo mesi dopo.',
    emoji: '🪪',
    probability: 0.03,
    effects: { money: -1200, happiness: -12, mentalHealth: -8 },
    packId: 'base'
  },
  {
    id: 'rev_burglary',
    title: 'Furto in Casa',
    description: 'Entrano in casa mentre sei fuori. Portano via laptop, contanti, oggetti di valore.',
    emoji: '🔓',
    probability: 0.04,
    effects: { money: -1500, happiness: -15, mentalHealth: -10 },
    packId: 'base'
  },
  {
    id: 'rev_medical_expense',
    title: 'Spesa Medica Imprevista',
    description: 'Un esame urgente, un intervento minore: il sistema sanitario chiede il conto.',
    emoji: '🏥',
    probability: 0.12,
    effects: { money: -500, happiness: -5, health: 5 },
    packId: 'base'
  },
  {
    id: 'rev_power_outage',
    title: 'Blackout Prolungato',
    description: 'La corrente salta per 24 ore. Frigo fermo, telefono scarico, tutto si ferma.',
    emoji: '🕯️',
    probability: 0.08,
    effects: { happiness: -6, energy: -8, money: -100 },
    packId: 'base'
  },

  // ─── POSITIVI / SOCIALI ──────────────────────────────────────────────────
  {
    id: 'rev_salary_raise',
    title: 'Aumento di Stipendio',
    description: 'Arriva una busta paga più pesante del previsto. Qualcuno ha notato il tuo lavoro.',
    emoji: '💵',
    probability: 0.08,
    effects: { money: 800, happiness: 12, reputation: 3 },
    packId: 'base'
  },
  {
    id: 'rev_tax_refund',
    title: 'Rimborso Fiscale',
    description: 'Il conguaglio IRPEF è positivo. Arriva un bonifico inaspettato dall\'Agenzia delle Entrate.',
    emoji: '💸',
    probability: 0.10,
    effects: { money: 600, happiness: 8 },
    packId: 'base'
  },
  {
    id: 'rev_old_friend',
    title: 'Ritorna un Vecchio Amico',
    description: 'Qualcuno che non vedevi da anni ti contatta. Una cena, vecchi ricordi, nuova energia.',
    emoji: '🤝',
    probability: 0.08,
    effects: { happiness: 10, mentalHealth: 8, socialReputation: 2 },
    packId: 'base'
  },
  {
    id: 'rev_viral_moment',
    title: 'Momento Virale',
    description: 'Un post, un video, una foto: qualcosa che hai condiviso raccoglie attenzione inaspettata.',
    emoji: '🌐',
    probability: 0.04,
    effects: { happiness: 12, socialReputation: 5, reputation: 2 },
    packId: 'base'
  },
  {
    id: 'rev_inspiration',
    title: 'Momento di Ispirazione',
    description: 'Un libro, un discorso, un incontro casuale ti cambia prospettiva. Vuoi fare di più.',
    emoji: '💡',
    probability: 0.12,
    effects: { happiness: 8, intelligence: 3, mentalHealth: 5 },
    packId: 'base'
  },
  {
    id: 'rev_community_support',
    title: 'Supporto della Comunità',
    description: 'Il quartiere si organizza per aiutarti in un momento difficile. Cibo, tempo, solidarietà.',
    emoji: '🤲',
    probability: 0.06,
    effects: { happiness: 12, karma: 5, mentalHealth: 8 },
    packId: 'base'
  },
  {
    id: 'rev_lucky_investment',
    title: 'Investimento Fortunato',
    description: 'Un piccolo acquisto fatto mesi fa — azioni, crypto, oggetto — vale ora il triplo.',
    emoji: '📊',
    probability: 0.03,
    effects: { money: 3000, happiness: 15 },
    packId: 'base'
  },
  {
    id: 'rev_award',
    title: 'Riconoscimento Inaspettato',
    description: 'Ricevi un premio, una menzione, un certificato che non ti aspettavi. Qualcuno ti ha notato.',
    emoji: '🏅',
    probability: 0.05,
    effects: { happiness: 14, reputation: 5, socialReputation: 3 },
    packId: 'base'
  },
]

// Filter out any already existing
const existingIds = new Set(db.random_events.map(e => e.id))
const toAdd = newRandomEvents.filter(e => !existingIds.has(e.id))
db.random_events = [...db.random_events, ...toAdd]

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
console.log(`✓ Added ${toAdd.length} random_events (total: ${db.random_events.length})`)
console.log('  Sources: EMDAT disasters 1970-2021, global_inflation_data, World-Stock-Prices')
console.log('\nNew events:')
toAdd.forEach(e => console.log(`  ${e.emoji} ${e.id} (p=${e.probability})`))
