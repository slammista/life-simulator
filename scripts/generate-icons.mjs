// Generates PWA icons from favicon.svg using sharp
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')
const svgPath = resolve(root, 'public', 'favicon.svg')
const outDir = resolve(root, 'public', 'assets', 'icons')

mkdirSync(outDir, { recursive: true })

const svgBuf = readFileSync(svgPath)

// Generate a padded icon: place the SVG on a dark background (#1a1a2e) with 12% padding
async function makeIcon(size, file) {
  const paddedSize = Math.round(size * 0.76)  // icon occupies 76% of canvas
  const pad = Math.round((size - paddedSize) / 2)

  const resized = await sharp(svgBuf).resize(paddedSize, paddedSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 255 } },
  })
    .composite([{ input: resized, top: pad, left: pad }])
    .png()
    .toFile(resolve(outDir, file))

  console.log(`✅ ${file} (${size}×${size})`)
}

// maskable variant: icon fills full canvas with brand color bg, small padding (5%)
async function makeMaskable(size, file) {
  const paddedSize = Math.round(size * 0.60)
  const pad = Math.round((size - paddedSize) / 2)

  const resized = await sharp(svgBuf).resize(paddedSize, paddedSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 255 } },
  })
    .composite([{ input: resized, top: pad, left: pad }])
    .png()
    .toFile(resolve(outDir, file))

  console.log(`✅ ${file} maskable (${size}×${size})`)
}

await makeIcon(192, 'pwa-192x192.png')
await makeIcon(512, 'pwa-512x512.png')
await makeMaskable(512, 'pwa-512x512-maskable.png')
await makeIcon(180, 'apple-touch-icon.png')
await makeIcon(1024, 'app-store-icon-1024.png')   // Apple App Store
await makeIcon(512, 'play-store-icon-512.png')     // Google Play

console.log('\n🎉 All icons generated in public/assets/icons/')
