/**
 * Convert SVG branding images in assets/branding to JPEG versions.
 * Uses sharp for rasterization. Outputs .jpg alongside originals.
 * Skips if target exists and source unchanged (simple mtime compare).
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.resolve(__dirname, '..', 'assets', 'branding');
const TARGET_BG = '#ffffff'; // white background for jpg (no alpha)

async function convertFile(svgPath) {
  const base = path.basename(svgPath, '.svg');
  const jpgPath = path.join(SRC_DIR, base + '.jpg');
  try {
    const [srcStat, dstStat] = [fs.statSync(svgPath), fs.existsSync(jpgPath) ? fs.statSync(jpgPath) : null];
    if (dstStat && dstStat.mtimeMs >= srcStat.mtimeMs) {
      console.log(`[SKIP] Up-to-date: ${path.basename(jpgPath)}`);
      return;
    }
    const svgBuffer = fs.readFileSync(svgPath);
    // Heuristic size: if favicon keep small else 1024px box
    const size = /favicon/i.test(base) ? 128 : 1024;
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: TARGET_BG })
      .flatten({ background: TARGET_BG })
      .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
      .toFile(jpgPath);
    console.log(`[OK] Generated ${path.basename(jpgPath)}`);
  } catch (err) {
    console.error(`[ERROR] Failed converting ${svgPath}:`, err.message);
  }
}

async function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('Branding directory not found:', SRC_DIR);
    process.exit(1);
  }
  const entries = fs.readdirSync(SRC_DIR).filter(f => f.toLowerCase().endsWith('.svg'));
  if (!entries.length) {
    console.log('No SVG files found to convert.');
    return;
  }
  console.log(`Converting ${entries.length} SVG file(s) to JPG...`);
  for (const f of entries) {
    await convertFile(path.join(SRC_DIR, f));
  }
  console.log('Conversion complete.');
}
run();
