// Generates the headline NPC preview gallery — 24 diverse NPCs produced by the
// modular NpcAvatarEngine and drawn in the Bright Avatar style (the same
// renderer the game now uses for player and NPCs), with age applied.
//
// Run:  node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/generate_npc_gallery.ts
//
// Outputs into /preview/npc-gallery:
//   - npc-XX-<name>.svg / .png   (one per NPC)
//   - contact-sheet.png          (labelled grid of all NPCs)
//   - index.html                 (browsable gallery)

import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { generateNpcAvatar } from '../src/services/NpcAvatarEngine.ts'
import { buildBrightAvatar, BRIGHT_BG } from '../src/services/brightAvatarSvg.ts'
import { applyAgeToConfig } from '../src/services/AvatarEngine.ts'
import type { Gender, AvatarConfig } from '../src/store/types.ts'

const OUT_DIR = path.resolve(import.meta.dirname, '..', 'preview', 'npc-gallery')

interface NpcSpec {
  id: string
  name: string
  gender: Gender
  age: number
  looks?: number
  happiness?: number
}

// A deliberately diverse roster: genders, ages (baby → elderly), looks and
// happiness extremes, so the gallery exercises every modular asset path.
const ROSTER: NpcSpec[] = [
  { id: 'npc-aurora-conti',     name: 'Aurora Conti',     gender: 'female',     age: 24, looks: 88, happiness: 90 },
  { id: 'npc-marco-rizzi',      name: 'Marco Rizzi',      gender: 'male',       age: 31, looks: 60, happiness: 70 },
  { id: 'npc-sofia-greco',      name: 'Sofia Greco',      gender: 'female',     age: 47, looks: 55, happiness: 45 },
  { id: 'npc-luca-ferrari',     name: 'Luca Ferrari',     gender: 'male',       age: 68, looks: 40, happiness: 60 },
  { id: 'npc-noa-bianchi',      name: 'Noa Bianchi',      gender: 'non_binary', age: 22, looks: 75, happiness: 80 },
  { id: 'npc-giulia-romano',    name: 'Giulia Romano',    gender: 'female',     age: 16, looks: 65, happiness: 55 },
  { id: 'npc-davide-esposito',  name: 'Davide Esposito',  gender: 'male',       age: 9,  looks: 70, happiness: 85 },
  { id: 'npc-chiara-moretti',   name: 'Chiara Moretti',   gender: 'female',     age: 34, looks: 92, happiness: 75 },
  { id: 'npc-alessandro-galli', name: 'Alessandro Galli', gender: 'male',       age: 52, looks: 50, happiness: 30 },
  { id: 'npc-emma-fontana',     name: 'Emma Fontana',     gender: 'female',     age: 29, looks: 80, happiness: 88 },
  { id: 'npc-matteo-barbieri',  name: 'Matteo Barbieri',  gender: 'male',       age: 19, looks: 58, happiness: 65 },
  { id: 'npc-sara-de-luca',     name: 'Sara De Luca',     gender: 'female',     age: 41, looks: 68, happiness: 50 },
  { id: 'npc-kai-marino',       name: 'Kai Marino',       gender: 'non_binary', age: 27, looks: 72, happiness: 40 },
  { id: 'npc-francesco-rossi',  name: 'Francesco Rossi',  gender: 'male',       age: 73, looks: 35, happiness: 55 },
  { id: 'npc-valentina-costa',  name: 'Valentina Costa',  gender: 'female',     age: 12, looks: 60, happiness: 70 },
  { id: 'npc-tommaso-villa',    name: 'Tommaso Villa',    gender: 'male',       age: 38, looks: 64, happiness: 78 },
  { id: 'npc-martina-leone',    name: 'Martina Leone',    gender: 'female',     age: 56, looks: 52, happiness: 62 },
  { id: 'npc-pietro-gatti',     name: 'Pietro Gatti',     gender: 'male',       age: 26, looks: 84, happiness: 20 },
  { id: 'npc-alice-ferraro',    name: 'Alice Ferraro',    gender: 'female',     age: 6,  looks: 75, happiness: 90 },
  { id: 'npc-jordan-vitale',    name: 'Jordan Vitale',    gender: 'non_binary', age: 35, looks: 66, happiness: 68 },
  { id: 'npc-elena-santoro',    name: 'Elena Santoro',    gender: 'female',     age: 62, looks: 48, happiness: 58 },
  { id: 'npc-gabriele-marchetti',name:'Gabriele Marchetti',gender:'male',       age: 44, looks: 70, happiness: 72 },
  { id: 'npc-beatrice-rinaldi', name: 'Beatrice Rinaldi', gender: 'female',     age: 21, looks: 90, happiness: 95 },
  { id: 'npc-simone-caruso',    name: 'Simone Caruso',    gender: 'male',       age: 49, looks: 45, happiness: 35 },
]

const GENDER_LABEL: Record<Gender, string> = { male: '♂ Uomo', female: '♀ Donna', non_binary: '⚧ Non-binary' }

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function describe(cfg: AvatarConfig): string {
  const parts = [
    `pelle ${cfg.skinTone}`,
    `capelli ${cfg.hairStyle}/${cfg.hairColor}`,
    `occhi ${cfg.eyeStyle}/${cfg.eyeColor}`,
    `bocca ${cfg.mouthStyle ?? 'smile'}`,
  ]
  if (cfg.beardStyle && cfg.beardStyle !== 'none') parts.push(`barba ${cfg.beardStyle}`)
  if (cfg.accessory && cfg.accessory !== 'none') parts.push(`acc. ${cfg.accessory}`)
  parts.push(`vestiti ${cfg.clothesStyle}`)
  return parts.join(' · ')
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Place an avatar as a nested <svg> at (x,y) sized w.
function place(cfg: AvatarConfig, x: number, y: number, w: number, bg: string): string {
  return buildBrightAvatar(cfg, { size: w, background: bg })
    .replace('<svg xmlns="http://www.w3.org/2000/svg"', `<svg x="${x}" y="${y}"`)
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const generated = ROSTER.map((spec, i) => {
    const cfg = generateNpcAvatar(spec.id, spec.gender, {
      age: spec.age, looks: spec.looks, happiness: spec.happiness,
    })
    const aged = applyAgeToConfig(spec.age, cfg)
    const bg = BRIGHT_BG[i % BRIGHT_BG.length]
    return { spec, cfg, aged, bg, index: i }
  })

  // --- Per-NPC SVG + PNG ---
  for (const { spec, aged, bg, index } of generated) {
    const fileBase = `npc-${String(index + 1).padStart(2, '0')}-${slug(spec.name)}`
    const svg = buildBrightAvatar(aged, { size: 256, background: bg })
    await writeFile(path.join(OUT_DIR, `${fileBase}.svg`), svg, 'utf8')
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT_DIR, `${fileBase}.png`))
  }

  // --- Labelled contact sheet ---
  const COLS = 6, CW = 210, CH = 250, HEADER = 96, AV = 150
  const rows = Math.ceil(generated.length / COLS)
  const W = COLS * CW, H = HEADER + rows * CH
  let sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
  sheet += `<rect width="${W}" height="${H}" fill="#0f0c1d"/>`
  sheet += `<text x="${W / 2}" y="44" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800">NPC Avatar System — anteprima (${generated.length} NPC)</text>`
  sheet += `<text x="${W / 2}" y="74" text-anchor="middle" fill="#a78bfa" font-family="Inter, Arial, sans-serif" font-size="15">Generati deterministicamente · stile Bright Avatar · stesso renderer del protagonista</text>`

  for (const { spec, cfg, aged, bg, index } of generated) {
    const col = index % COLS, row = Math.floor(index / COLS)
    const x0 = col * CW, y0 = HEADER + row * CH
    const ax = x0 + (CW - AV) / 2, ay = y0 + 16
    sheet += place(aged, ax, ay, AV, bg)
    const cy = ay + AV + 18
    sheet += `<text x="${x0 + CW / 2}" y="${cy}" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700">${esc(spec.name)}</text>`
    sheet += `<text x="${x0 + CW / 2}" y="${cy + 18}" text-anchor="middle" fill="#c4b5fd" font-family="Inter, Arial, sans-serif" font-size="12">${esc(GENDER_LABEL[spec.gender])} · ${spec.age} anni</text>`
    sheet += `<text x="${x0 + CW / 2}" y="${cy + 34}" text-anchor="middle" fill="#8b8499" font-family="Inter, Arial, sans-serif" font-size="9.5">${esc(cfg.hairStyle)}/${esc(cfg.hairColor)} · ${esc(cfg.mouthStyle ?? 'smile')}${cfg.accessory && cfg.accessory !== 'none' ? ' · ' + esc(cfg.accessory) : ''}</text>`
  }
  sheet += `</svg>`
  await writeFile(path.join(OUT_DIR, 'contact-sheet.svg'), sheet, 'utf8')
  await sharp(Buffer.from(sheet)).png().toFile(path.join(OUT_DIR, 'contact-sheet.png'))

  // --- index.html ---
  const cards = generated.map(({ spec, cfg, aged, bg }) => {
    const svg = buildBrightAvatar(aged, { size: 150, background: bg })
    return `<figure class="card">
      <div class="av">${svg}</div>
      <figcaption>
        <strong>${esc(spec.name)}</strong>
        <span class="meta">${esc(GENDER_LABEL[spec.gender])} · ${spec.age} anni</span>
        <span class="cfg">${esc(describe(cfg))}</span>
      </figcaption>
    </figure>`
  }).join('\n')

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>NPC Avatar System — Anteprima</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 32px; background: #0f0c1d; color: #fff; font-family: Inter, system-ui, Arial, sans-serif; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  p.sub { color: #a78bfa; margin: 0 0 28px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; }
  .card { margin: 0; background: #16122a; border: 1px solid rgba(167,139,250,0.2); border-radius: 16px; padding: 16px; text-align: center; }
  .av { display: flex; justify-content: center; }
  .av svg { border-radius: 16px; }
  figcaption { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
  figcaption strong { font-size: 15px; }
  .meta { color: #c4b5fd; font-size: 12px; }
  .cfg { color: #8b8499; font-size: 10.5px; line-height: 1.35; }
</style></head>
<body>
  <h1>NPC Avatar System — Anteprima</h1>
  <p class="sub">${generated.length} NPC generati deterministicamente · stile Bright Avatar · stesso renderer SVG del protagonista.</p>
  <div class="grid">
${cards}
  </div>
</body></html>`
  await writeFile(path.join(OUT_DIR, 'index.html'), html, 'utf8')

  console.log(`Generati ${generated.length} NPC in ${OUT_DIR}`)
  for (const { spec, cfg } of generated) {
    console.log(`  • ${spec.name.padEnd(22)} ${GENDER_LABEL[spec.gender].padEnd(14)} ${String(spec.age).padStart(2)}y  ${describe(cfg)}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
