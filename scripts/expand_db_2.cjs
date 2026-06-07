#!/usr/bin/env node
// Expand db.json: fix minAge (punto 2), add goals (punto 4), add jobs (punto 5)
const fs = require('fs')
const path = require('path')
const DB_PATH = path.join(__dirname, '../public/db.json')
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))

// ─── PUNTO 2: Fix minAge/maxAge/triggerCondition ───────────────────────────
const AGE_RULES = [
  // social media — visibili da 16
  { keys: ['like_pericoloso','trappola_piramidale','eco_ansia','cancel_culture','invasione_dell_ai',
    'soft_launching','dipendenza_da_schermo','estetica_tossica','il_crypto_bro','fake_news_di_famiglia',
    'fomo_del_matrimonio','storia_vista_non_risposta','gruppo_whatsapp_infinito','post_sponsorizzato_sbagliato',
    'algoritmo_crudele','voice_note_chilometrico','screenshot_traditore','challenge_imbarazzante',
    'privacy_bucata','commento_passivo_aggressivo','linkedin_tossico','follower_fantasma',
    'tag_non_autorizzato','bio_ambigua','doomscrolling_notturno','influencer_pentito',
    'commento_del_capo','filtro_generazionale','account_hackerato','recensione_vendicativa',
    'live_accidentale','appuntamento_geolocalizzato','meme_rubato','newsletter_infinita',
    'profilo_doppio','voto_pubblico','foto_con_ex','unfollow_strategico','notifica_alle_tre',
    'trend_incomprensibile','confronto_fitness','dm_del_sconosciuto','profilo_professionale',
    'sticker_sbagliato','litigio_nei_commenti','filtro_bellezza_rotto','abbonamento_dimenticato',
    'ranking_sociale','risposta_fredda','foto_generata'],
    minAge: 16, maxAge: 99, trigger: 'age >= 16' },

  // relazioni/dating — 18+
  { keys: ['situationship','la_divisione_del_conto','segreto_di_famiglia','ghosting_brutale',
    'il_terrapiattista','invasione_della_suocera','dilemma_poliamoroso','animale_conteso',
    'l_alibi','eredita_contesa','love_bombing','gaslighting_elegante','gelosia_da_password',
    'ex_ricomparso','cena_coi_suoceri','amico_geloso','app_dating_bug',
    'messaggio_al_destinatario_sbagliato','vacanza_disastro','convivenza_lampo',
    'ritorno_del_narcisista','matrimonio_pressato','figli_o_no','tradimento_digitale',
    'anniversario_dimenticato','parenti_invadenti','regalo_sbagliato','terapia_di_coppia',
    'profilo_segreto','silent_treatment','differenza_di_ambizione','amicizia_ambigua',
    'famiglia_scelta','scuse_pubbliche','differenza_politica','rimpatriata_pericolosa',
    'ultimatum','casa_dei_genitori','finanze_nascoste','compatibilita_domestica',
    'gelato_della_rottura','patto_di_amicizia','triangolo_di_lavoro','confini_violati',
    'proposal_sbagliata','rivincita_sana','ex_in_famiglia','chat_archiviata',
    'crush_sul_terapeuta','rottura_logistica'],
    minAge: 18, maxAge: 70, trigger: 'age >= 18' },

  // lavoro/burnout — 22+
  { keys: ['la_famiglia_aziendale','il_messaggio_sbagliato','furto_di_idee','disparita_salariale',
    'team_building_forzato','cliente_fuori_di_testa','promozione_avvelenata','micro_management',
    'segreto_del_direttore','quiet_quitting','riunione_senza_fine','kpi_impossibili',
    'collega_fantasma','straordinario_normalizzato','feedback_vago','colloquio_umiliante',
    'licenziamento_via_email','open_space_tossico','capo_su_linkedin','ferie_colpevolizzate',
    'badge_smarrito','formazione_obbligatoria','reperibilita_mascherata','merito_invisibile',
    'stage_eterno','ritorno_in_ufficio','software_obsoleto','sindacato_sospetto',
    'budget_tagliato','presentazione_rubata','collega_passivo_aggressivo','periodo_di_prova',
    'benefit_ridicolo','errore_in_produzione','azienda_acquisita','burnout_diagnostico',
    'curriculum_gonfiato','meeting_alle_diciotto','laptop_morente','concorrenza_interna',
    'onboarding_caotico','colloquio_segreto','nota_spese_respinta','manager_motivazionale',
    'revisione_notturna','contratto_precario','promessa_mancata','colpa_del_junior',
    'chat_aziendale_pubblica','pivot_improvviso'],
    minAge: 22, maxAge: 65, trigger: 'age >= 22' },

  // scuola/università/coabitazione — 14-35
  { keys: ['il_lavoro_di_gruppo','esame_smarrito','il_bigliettino','umiliazione_pubblica',
    'crisi_accademica','ladro_di_frigo','la_tentazione','pressione_genitoriale',
    'festa_della_vita','reclutamento_setta','coinquilino_batterista','tesi_corrotta',
    'relatore_sparito','affitto_studenti','borsa_persa','laboratorio_pieno',
    'esame_a_sorpresa','ansia_da_media','coinquilino_fidanzato','lavatrice_contesa',
    'biblioteca_rumorosa','chat_del_corso','tutor_inutile','pendolare_esausto',
    'coinquilino_chef','debito_studentesco','progetto_cancellato','compagno_competitivo',
    'study_abroad_shock','appello_saltato','plagio_ingiusto','genitore_in_aula',
    'notte_in_bianco','gruppo_fuori_tema','coinquilino_moroso','esame_orale_ostile',
    'campus_politicizzato','stage_curricolare','camera_minuscola','scadenza_portale',
    'dispensa_sbagliata','esame_da_remoto','rumori_di_casa','corso_obbligatorio',
    'tutoraggio_tossico','voto_ingiusto','cambio_piano_studi','rientro_dai_genitori',
    'coinquilino_influencer','laurea_fredda'],
    minAge: 14, maxAge: 35, trigger: 'age >= 14 && age <= 35' },

  // salute — 18+
  { keys: ['lista_d_attesa','sintomo_googolato','medico_frettoloso','assicurazione_ambigua',
    'farmaco_costoso','diagnosi_tardiva','check_up_salvifico','burnout_clinico',
    'dieta_estrema','infortunio_domestico','dentista_rimandato','app_salute_ansiosa',
    'secondo_parere','vaccino_dimenticato','pronto_soccorso_pieno','terapia_iniziata',
    'allergia_nuova','sonno_spezzato','palestra_eccessiva','referto_perso'],
    minAge: 18, maxAge: 90, trigger: 'age >= 18' },

  // famiglia — 18+
  { keys: ['fratello_favorito','genitore_manipolatore','cena_esplosiva','segreto_anagrafico',
    'cura_dei_nonni','prestito_familiare','confini_con_genitori','parenti_sui_social',
    'adozione_rivelata','compleanno_dimenticato','ricatto_affettivo','vacanza_familiare',
    'eredita_minore','nuovo_partner_del_genitore','sorella_in_crisi','foto_imbarazzante',
    'trasloco_dei_genitori','riunione_forzata','tradizione_opprimente','scuse_tardive'],
    minAge: 18, maxAge: 80, trigger: 'age >= 18' },

  // proprietà/investimenti — 23+
  { keys: ['mutuo_variabile','affitto_folle','vicino_rumoroso','casa_con_muffa',
    'investimento_meme','condominio_ostile','auto_usata','ristrutturazione_infinita',
    'bollette_shock','coinquilino_moroso_adulto','truffa_online','bonus_mancato',
    'banca_fredda','vendita_in_perdita','eredita_tassata','startup_amico',
    'assicurazione_casa','spesa_impulsiva','mercato_immobiliare','risparmio_automatico'],
    minAge: 23, maxAge: 80, trigger: 'age >= 23' },

  // crimine — 16+
  { keys: ['furto_di_identita','testimone_scomodo','multa_ingiusta','avvocato_costoso',
    'ricatto_digitale','pacco_sospetto','amico_arrestato','frode_del_capo',
    'piccolo_furto','denuncia_online','errore_giudiziario','patteggiamento',
    'truffa_romantica','sorveglianza_abusiva','rissa_al_bar','documento_falso',
    'evasione_fiscale_familiare','portafoglio_trovato','notifica_del_tribunale','reinserimento'],
    minAge: 16, maxAge: 80, trigger: 'age >= 16' },

  // viaggi — 18+
  { keys: ['volo_cancellato','bagaglio_perso','passaporto_scaduto','truffa_turistica',
    'malattia_in_viaggio','culture_shock','amore_estivo','nomade_digitale',
    'visto_negato','lingua_fraintesa','ospite_invadente','sciopero_trasporti',
    'paese_carissimo','carta_bloccata','rientro_difficile','lavoro_estero',
    'dogana_complicata','amicizia_globale','disastro_meteo','casa_lontana'],
    minAge: 18, maxAge: 80, trigger: 'age >= 18' },

  // misto (religione/tech/sport/food/wildcard) — 16+
  { keys: ['ritiro_spirituale_costoso','guru_carismatico','crisi_di_fede','comunita_accogliente',
    'digiuno_estremo','oroscopo_preciso','pellegrinaggio','famiglia_e_religione',
    'meditazione_reale','setta_digitale','assistente_ai_bug','deepfake_pubblico',
    'casa_smart_ribelle','robot_collega','backup_salvifico','password_manager',
    'auto_autonoma','algoritmo_sanitario','avatar_virtuale','corso_ai',
    'maratona_improvvisata','squadra_amatoriale','infortunio_da_ego','allenatore_tossico',
    'vittoria_locale','sport_costoso','rivalita_sana','doping_sociale',
    'partita_memorabile','sconfitta_pubblica','ristorante_stellato','intossicazione',
    'ricetta_di_famiglia','cucina_virale','dieta_di_coppia','allergia_al_matrimonio',
    'meal_prep_fallito','chef_interiore','recensione_ingiusta','ordine_sbagliato',
    'vincita_minore','blackout_di_quartiere','sosia_imbarazzante','oggetto_misterioso',
    'decisione_impulsiva','lettera_dal_passato','vicino_eroe','festival_assurdo',
    'giornata_perfetta','opportunita_improbabile'],
    minAge: 16, maxAge: 90, trigger: 'age >= 16' },
]

function getRule(eventId) {
  const bare = eventId.replace('ev_modern_', '')
  for (const rule of AGE_RULES) {
    if (rule.keys.includes(bare)) return rule
  }
  return null
}

let fixedCount = 0
db.events = db.events.map(ev => {
  if (!ev.id.startsWith('ev_modern_')) return ev
  const rule = getRule(ev.id)
  if (!rule) return ev
  const changed = ev.minAge !== rule.minAge || ev.maxAge !== rule.maxAge || ev.triggerCondition !== rule.trigger
  if (changed) {
    fixedCount++
    return { ...ev, minAge: rule.minAge, maxAge: rule.maxAge, triggerCondition: rule.trigger }
  }
  return ev
})
console.log(`✓ Fixed minAge/maxAge on ${fixedCount} events`)

// ─── PUNTO 4: New goals (da 12 a 25) ──────────────────────────────────────
const newGoals = [
  {
    id: 'goal_influencer',
    name: 'Influencer',
    description: 'Raggiungi 90 di reputazione sociale',
    category: 'social',
    triggerCondition: 'socialReputation >= 90',
    reward: { happiness: 20, money: 5000, socialReputation: 5 },
    ribbonId: 'ribbon_influencer'
  },
  {
    id: 'goal_entrepreneur',
    name: 'Imprenditore',
    description: 'Accumula €500.000 prima dei 45 anni',
    category: 'financial',
    triggerCondition: 'money >= 500000 && age <= 45',
    reward: { happiness: 25, reputation: 15, money: 10000 },
    ribbonId: 'ribbon_entrepreneur'
  },
  {
    id: 'goal_parent',
    name: 'Genitore',
    description: 'Avere almeno un figlio',
    category: 'family',
    triggerCondition: 'age >= 25',
    reward: { happiness: 20, karma: 10 },
    ribbonId: 'ribbon_parent'
  },
  {
    id: 'goal_early_retirement',
    name: 'Pensione Anticipata',
    description: 'Vai in pensione prima dei 55 anni con €300.000',
    category: 'financial',
    triggerCondition: 'money >= 300000 && age <= 55',
    reward: { happiness: 30, energy: 20 },
    ribbonId: 'ribbon_early_retire'
  },
  {
    id: 'goal_globetrotter',
    name: 'Giramondo',
    description: 'Visita almeno 8 nazioni diverse',
    category: 'travel',
    triggerCondition: 'age >= 30',
    reward: { happiness: 20, intelligence: 8, socialReputation: 10 },
    ribbonId: 'ribbon_globetrotter'
  },
  {
    id: 'goal_karma_master',
    name: 'Anima Pura',
    description: 'Mantieni karma sopra 75 fino ai 60 anni',
    category: 'character',
    triggerCondition: 'karma >= 75 && age >= 60',
    reward: { happiness: 20, reputation: 10, karma: 10 },
    ribbonId: 'ribbon_karma'
  },
  {
    id: 'goal_addiction_survivor',
    name: 'Rinato',
    description: 'Supera una dipendenza da sostanze',
    category: 'health',
    triggerCondition: 'age >= 25',
    reward: { mentalHealth: 20, karma: 15, happiness: 15 },
    ribbonId: 'ribbon_survivor_addiction'
  },
  {
    id: 'goal_philanthropist',
    name: 'Filantropo',
    description: 'Raggiungi karma 80 donando e aiutando gli altri',
    category: 'character',
    triggerCondition: 'karma >= 80',
    reward: { happiness: 15, reputation: 20, karma: 5 },
    ribbonId: 'ribbon_philanthropist'
  },
  {
    id: 'goal_health_champion',
    name: 'Corpo d\'Acciaio',
    description: 'Mantieni salute sopra 85 fino ai 65 anni',
    category: 'health',
    triggerCondition: 'health >= 85 && age >= 65',
    reward: { health: 10, energy: 15, happiness: 15 },
    ribbonId: 'ribbon_health_champ'
  },
  {
    id: 'goal_celebrity',
    name: 'Celebrità',
    description: 'Raggiungi 95 di reputazione sociale e 80 di reputazione',
    category: 'social',
    triggerCondition: 'socialReputation >= 95 && reputation >= 80',
    reward: { happiness: 30, money: 20000, socialReputation: 5 },
    ribbonId: 'ribbon_celebrity'
  },
  {
    id: 'goal_wise_elder',
    name: 'Saggio',
    description: 'Raggiungi 80 anni con intelligenza sopra 80',
    category: 'education',
    triggerCondition: 'age >= 80 && intelligence >= 80',
    reward: { happiness: 20, reputation: 15 },
    ribbonId: 'ribbon_wise'
  },
  {
    id: 'goal_dark_horse',
    name: 'Cavallo Nero',
    description: 'Accumula €1M partendo da meno di €100 a 30 anni',
    category: 'financial',
    triggerCondition: 'money >= 1000000 && age >= 40',
    reward: { happiness: 30, reputation: 20, money: 25000 },
    ribbonId: 'ribbon_dark_horse'
  },
  {
    id: 'goal_iron_mind',
    name: 'Mente di Ferro',
    description: 'Mantieni salute mentale sopra 80 fino ai 70 anni',
    category: 'health',
    triggerCondition: 'mentalHealth >= 80 && age >= 70',
    reward: { mentalHealth: 10, happiness: 20, karma: 5 },
    ribbonId: 'ribbon_iron_mind'
  },
]

// Only add goals not already present
const existingGoalIds = new Set(db.goals.map(g => g.id))
const goalsToAdd = newGoals.filter(g => !existingGoalIds.has(g.id))
db.goals = [...db.goals, ...goalsToAdd]
console.log(`✓ Added ${goalsToAdd.length} new goals (total: ${db.goals.length})`)

// ─── PUNTO 5: New jobs (da 22 a ~40) ──────────────────────────────────────
const newJobs = [
  {
    id: 'electrician',
    title: 'Elettricista',
    category: 'technical',
    contractType: 'full_time',
    salaryMin: 1600, salaryMax: 3200,
    stressLevel: 45,
    promotionChance: 0.06,
    requirements: { education: 'vocational', minAge: 18, maxAge: 99, minReputation: 0, cleanRecord: false, licenses: [] },
    effects: { energy: -7, health: -2 },
    packId: 'base'
  },
  {
    id: 'plumber',
    title: 'Idraulico',
    category: 'technical',
    contractType: 'freelance',
    salaryMin: 1500, salaryMax: 3500,
    stressLevel: 40,
    promotionChance: 0.05,
    requirements: { education: 'vocational', minAge: 18, maxAge: 99, minReputation: 0, cleanRecord: false, licenses: [] },
    effects: { energy: -7, health: -2 },
    packId: 'base'
  },
  {
    id: 'firefighter',
    title: 'Vigile del Fuoco',
    category: 'public',
    contractType: 'full_time',
    salaryMin: 1800, salaryMax: 3000,
    stressLevel: 75,
    promotionChance: 0.05,
    requirements: { education: 'highschool', minAge: 20, maxAge: 50, minReputation: 30, cleanRecord: true, licenses: [] },
    effects: { health: -5, karma: 5, reputation: 3 },
    packId: 'base'
  },
  {
    id: 'paramedic',
    title: 'Paramedico',
    category: 'medical',
    contractType: 'full_time',
    salaryMin: 1800, salaryMax: 3200,
    stressLevel: 70,
    promotionChance: 0.06,
    requirements: { education: 'vocational', minAge: 20, maxAge: 60, minReputation: 10, cleanRecord: true, licenses: [] },
    effects: { energy: -9, karma: 3, reputation: 2 },
    packId: 'base'
  },
  {
    id: 'pilot',
    title: 'Pilota',
    category: 'technical',
    contractType: 'full_time',
    salaryMin: 4000, salaryMax: 12000,
    stressLevel: 60,
    promotionChance: 0.04,
    requirements: { education: 'bachelor', minAge: 24, maxAge: 65, minReputation: 30, cleanRecord: true, licenses: ['pilot_license'] },
    effects: { energy: -8, reputation: 3, socialReputation: 2 },
    packId: 'base'
  },
  {
    id: 'pharmacist',
    title: 'Farmacista',
    category: 'medical',
    contractType: 'full_time',
    salaryMin: 2500, salaryMax: 5500,
    stressLevel: 45,
    promotionChance: 0.06,
    requirements: { education: 'master', minAge: 25, maxAge: 70, minReputation: 20, cleanRecord: true, licenses: [] },
    effects: { intelligence: 1, reputation: 2 },
    packId: 'base'
  },
  {
    id: 'veterinarian',
    title: 'Veterinario',
    category: 'medical',
    contractType: 'full_time',
    salaryMin: 2500, salaryMax: 6000,
    stressLevel: 50,
    promotionChance: 0.06,
    requirements: { education: 'medical', minAge: 26, maxAge: 70, minReputation: 25, cleanRecord: true, licenses: [] },
    effects: { happiness: 3, karma: 2, reputation: 2 },
    packId: 'base'
  },
  {
    id: 'personal_trainer',
    title: 'Personal Trainer',
    category: 'care',
    contractType: 'freelance',
    salaryMin: 1200, salaryMax: 4000,
    stressLevel: 30,
    promotionChance: 0.08,
    requirements: { education: 'vocational', minAge: 20, maxAge: 55, minReputation: 0, cleanRecord: false, licenses: [] },
    effects: { health: 5, energy: -5, socialReputation: 1 },
    packId: 'base'
  },
  {
    id: 'real_estate_agent',
    title: 'Agente Immobiliare',
    category: 'finance',
    contractType: 'freelance',
    salaryMin: 1500, salaryMax: 9000,
    stressLevel: 55,
    promotionChance: 0.10,
    requirements: { education: 'highschool', minAge: 22, maxAge: 70, minReputation: 20, cleanRecord: false, licenses: [] },
    effects: { socialReputation: 2, reputation: 1 },
    packId: 'base'
  },
  {
    id: 'influencer',
    title: 'Influencer',
    category: 'creative',
    contractType: 'freelance',
    salaryMin: 500, salaryMax: 15000,
    stressLevel: 35,
    promotionChance: 0.15,
    requirements: { education: 'none', minAge: 16, maxAge: 40, minReputation: 0, cleanRecord: false, licenses: [] },
    effects: { socialReputation: 4, looks: 1, happiness: 2 },
    packId: 'base'
  },
  {
    id: 'game_developer',
    title: 'Game Developer',
    category: 'tech',
    contractType: 'full_time',
    salaryMin: 2800, salaryMax: 8000,
    stressLevel: 55,
    promotionChance: 0.12,
    requirements: { education: 'bachelor', minAge: 22, maxAge: 99, minReputation: 0, cleanRecord: false, licenses: [] },
    effects: { intelligence: 2, happiness: 3, energy: -6 },
    packId: 'base'
  },
  {
    id: 'data_scientist',
    title: 'Data Scientist',
    category: 'tech',
    contractType: 'full_time',
    salaryMin: 3500, salaryMax: 9000,
    stressLevel: 50,
    promotionChance: 0.12,
    requirements: { education: 'master', minAge: 24, maxAge: 99, minReputation: 0, cleanRecord: false, licenses: [] },
    effects: { intelligence: 3, energy: -6 },
    packId: 'base'
  },
  {
    id: 'entrepreneur',
    title: 'Imprenditore',
    category: 'business',
    contractType: 'freelance',
    salaryMin: 0, salaryMax: 30000,
    stressLevel: 85,
    promotionChance: 0.20,
    requirements: { education: 'none', minAge: 22, maxAge: 70, minReputation: 30, cleanRecord: false, licenses: [] },
    effects: { energy: -10, reputation: 3, intelligence: 1 },
    packId: 'base'
  },
  {
    id: 'event_planner',
    title: 'Event Planner',
    category: 'creative',
    contractType: 'freelance',
    salaryMin: 1500, salaryMax: 5000,
    stressLevel: 60,
    promotionChance: 0.08,
    requirements: { education: 'bachelor', minAge: 22, maxAge: 60, minReputation: 15, cleanRecord: false, licenses: [] },
    effects: { socialReputation: 2, energy: -8, happiness: 2 },
    packId: 'base'
  },
  {
    id: 'security_guard',
    title: 'Guardia di Sicurezza',
    category: 'public',
    contractType: 'full_time',
    salaryMin: 1100, salaryMax: 2000,
    stressLevel: 50,
    promotionChance: 0.04,
    requirements: { education: 'highschool', minAge: 20, maxAge: 60, minReputation: 0, cleanRecord: true, licenses: [] },
    effects: { energy: -8, health: -1 },
    packId: 'base'
  },
  {
    id: 'translator',
    title: 'Traduttore/Interprete',
    category: 'creative',
    contractType: 'freelance',
    salaryMin: 1400, salaryMax: 4500,
    stressLevel: 35,
    promotionChance: 0.07,
    requirements: { education: 'bachelor', minAge: 22, maxAge: 70, minReputation: 0, cleanRecord: false, licenses: [] },
    effects: { intelligence: 2, energy: -4 },
    packId: 'base'
  },
  {
    id: 'tattoo_artist',
    title: 'Tatuatore',
    category: 'creative',
    contractType: 'freelance',
    salaryMin: 1000, salaryMax: 5000,
    stressLevel: 30,
    promotionChance: 0.10,
    requirements: { education: 'none', minAge: 18, maxAge: 60, minReputation: 10, cleanRecord: false, licenses: [] },
    effects: { happiness: 4, socialReputation: 2 },
    packId: 'base'
  },
  {
    id: 'life_coach',
    title: 'Life Coach',
    category: 'care',
    contractType: 'freelance',
    salaryMin: 1500, salaryMax: 6000,
    stressLevel: 30,
    promotionChance: 0.09,
    requirements: { education: 'bachelor', minAge: 28, maxAge: 70, minReputation: 20, cleanRecord: false, licenses: [] },
    effects: { mentalHealth: 3, karma: 2, reputation: 2 },
    packId: 'base'
  },
]

const existingJobIds = new Set(db.jobs.map(j => j.id))
const jobsToAdd = newJobs.filter(j => !existingJobIds.has(j.id))
db.jobs = [...db.jobs, ...jobsToAdd]
console.log(`✓ Added ${jobsToAdd.length} new jobs (total: ${db.jobs.length})`)

// ─── Write ─────────────────────────────────────────────────────────────────
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
console.log('\n✅ db.json updated successfully')
console.log(`   Events: ${db.events.length} | Jobs: ${db.jobs.length} | Goals: ${db.goals.length} | Random events: ${db.random_events.length}`)
