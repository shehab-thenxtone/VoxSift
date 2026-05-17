/**
 * Generates PNG icons from SVG sources for all required Chrome extension sizes.
 * Run with: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const iconsDir = join(root, 'public', 'icons')

const sizes = [16, 32, 48, 128]

// Use the master 512px SVG as source for all sizes to get best quality.
const masterSvg = readFileSync(join(iconsDir, 'icon.svg'))

async function generateIcon(size) {
  const pngPath = join(iconsDir, `icon-${size}.png`)

  await sharp(masterSvg)
    .resize(size, size)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(pngPath)

  console.log(`  icon-${size}.png`)
}

console.log('Generating PNG icons...')
await Promise.all(sizes.map(generateIcon))
console.log('Done.')
