import { execSync } from "child_process";
import sharp from "sharp";

const OUT = "C:/Users/Arthu/Projeto Medicina/public";

const STYLE =
  "Cinematic ultra-wide banner, deep navy-blue dark gradient, premium minimal editorial, soft volumetric haze, lots of clean empty negative space, moody low-key lighting, a crimson-red ECG accent. SUBJECT. NO text, no words, no letters, no logo, no UI.";

const BANNERS = [
  { key: "hero-novocaso", subj: "A smartphone held up capturing a glowing red ECG line on a hospital cardiac monitor in a dark navy room" },
  { key: "hero-rapida", subj: "An urgent fast crimson lightning bolt fused with an accelerating ECG heartbeat streaking across deep navy darkness, intense and energetic" },
  { key: "hero-condutas", subj: "A softly glowing open medical protocol book with a faint red ECG line flowing from its pages, calm and authoritative" },
  { key: "hero-fila", subj: "A row of dim cardiac monitors with faint red ECG traces receding into a dark navy intensive care unit, depth and stillness" },
];

let ok = 0;
for (const b of BANNERS) {
  const prompt = STYLE.replace("SUBJECT.", b.subj + ".");
  try {
    const raw = execSync(
      `hf generate create flux_2 --prompt ${JSON.stringify(prompt)} --aspect_ratio 16:9 --wait --wait-timeout 200s --json`,
      { encoding: "utf8", maxBuffer: 1e7 }
    );
    const url = JSON.parse(raw)[0].result_url;
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const out = await sharp(buf).resize({ width: 1400 }).jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/${b.key}.jpg`);
    ok++;
    console.log(`ok ${b.key} ${Math.round(out.size / 1024)}KB (${ok}/${BANNERS.length})`);
  } catch (e) {
    console.log(`FALHOU ${b.key}: ${String(e.message || e).slice(0, 140)}`);
  }
}
console.log(`done ${ok}/${BANNERS.length}`);
