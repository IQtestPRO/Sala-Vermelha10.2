import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(scriptDir, "..", "public", "icons");
await mkdir(outDir, { recursive: true });

const NAVY = "#15294C";
const RED = "#E11D2A";

// Linha de ECG da marca STAT: base reta com um QRS no centro.
const ecg = (stroke, sw) =>
  `<path d="M72 272 H198 L224 198 L260 350 L296 214 L320 272 H440" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
// Base reta branca "de monitor" sob a linha vermelha.
const baseline = `<line x1="72" y1="272" x2="440" y2="272" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.85"/>`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${NAVY}"/>
  ${baseline}
  ${ecg(RED, 26)}
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${NAVY}"/>
  ${baseline}
  ${ecg(RED, 26)}
</svg>`;

const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${ecg("#ffffff", 34)}
</svg>`;

async function png(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(outDir, file));
  console.log("ok:", file);
}

await png(iconSvg, 192, "icon-192.png");
await png(iconSvg, 512, "icon-512.png");
await png(maskableSvg, 192, "maskable-192.png");
await png(maskableSvg, 512, "maskable-512.png");
await png(iconSvg, 180, "apple-touch-icon.png");
await png(badgeSvg, 72, "badge-72.png");
await png(iconSvg, 32, "favicon.png");
console.log("Ícones STAT gerados em", outDir);
