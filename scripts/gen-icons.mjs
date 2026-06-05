import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(scriptDir, "..", "public", "icons");
await mkdir(outDir, { recursive: true });

// Linha de ECG dentro do quadrado central.
const ecg = (stroke, sw) =>
  `<path d="M96 262 H180 L210 176 L246 356 L282 214 L312 262 H416" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0a0e13"/>
  <rect x="64" y="64" width="384" height="384" rx="80" fill="#ef4444"/>
  ${ecg("#ffffff", 20)}
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#ef4444"/>
  ${ecg("#ffffff", 22)}
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
console.log("Ícones gerados em", outDir);
