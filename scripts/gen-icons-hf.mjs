import { execSync } from "child_process";
import { mkdirSync } from "fs";
import sharp from "sharp";

const OUT = "C:/Users/Arthu/Projeto Medicina/public/icons";
mkdirSync(OUT, { recursive: true });

const STYLE =
  "Professional minimalist flat medical UI icon: a single centered SUBJECT. One solid deep navy-blue color (#16345f) glyph, clean geometric flat design with smooth rounded strokes, bold and legible at small sizes, generous even margins, perfectly centered, on a plain solid pure white background. App icon. No text, no letters, no words, no numbers, no shadow, no gradient, no border, no frame.";

const ICONS = [
  // bottom nav
  { key: "nav-rapida", subj: "a lightning bolt fused with a single sharp ECG heartbeat spike" },
  { key: "nav-fila", subj: "a tidy stack of patient cards inside an inbox tray" },
  { key: "nav-casos", subj: "a clinical document sheet with a small heartbeat line across it" },
  { key: "nav-novo", subj: "a bold plus sign centered inside a rounded square" },
  { key: "nav-condutas", subj: "an open medical handbook protocol book" },
  // conceitos (tiles de tipo / conduta)
  { key: "ecg", subj: "a clean ECG heartbeat trace line on a monitor" },
  { key: "arritmia", subj: "an irregular erratic heartbeat ECG waveform" },
  { key: "bolt", subj: "defibrillator paddles with a lightning bolt for cardioversion" },
  { key: "pcr", subj: "a heart with a plus cross for CPR resuscitation" },
  { key: "airway", subj: "an endotracheal intubation tube with lungs for airway" },
  { key: "fluid", subj: "an IV fluid drip bag with a single drop for shock and sepsis" },
  { key: "brain", subj: "a human brain in profile for neurology and stroke" },
  { key: "tox", subj: "a laboratory flask with a small skull for intoxication" },
  { key: "trauma", subj: "a bone with a crack and a small first-aid cross for trauma" },
  { key: "heart", subj: "an anatomical heart with a small alert flash for chest pain and infarction" },
  { key: "help", subj: "a question mark centered inside a circle" },
];

async function processIcon(key, buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const t0 = 38, t1 = 96; // remove o branco -> transparente (rampa suave)
  for (let i = 0; i < data.length; i += 4) {
    const dr = 255 - data[i], dg = 255 - data[i + 1], db = 255 - data[i + 2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    data[i + 3] = dist <= t0 ? 0 : dist >= t1 ? 255 : Math.round(((dist - t0) / (t1 - t0)) * 255);
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 12 })
    .resize(112, 112, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${key}.png`);
}

let ok = 0;
for (const ic of ICONS) {
  const prompt = STYLE.replace("SUBJECT", ic.subj);
  try {
    const raw = execSync(`hf generate create nano_banana_2 --prompt ${JSON.stringify(prompt)} --wait --wait-timeout 150s --json`, {
      encoding: "utf8",
      maxBuffer: 1e7,
    });
    const job = JSON.parse(raw)[0];
    const url = job.result_url || job.resultUrl;
    if (!url) throw new Error("sem result_url: " + raw.slice(0, 120));
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    await processIcon(ic.key, buf);
    ok++;
    console.log(`ok ${ic.key} (${ok}/${ICONS.length})`);
  } catch (e) {
    console.log(`FALHOU ${ic.key}: ${String(e.message || e).slice(0, 140)}`);
  }
}
console.log(`done ${ok}/${ICONS.length}`);
