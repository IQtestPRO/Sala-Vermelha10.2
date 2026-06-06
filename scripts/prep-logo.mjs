import sharp from "sharp";

const SRC = "C:/Users/Arthu/Desktop/CLAUD.IA/Stat-Medic/hf_20260606_155819_ecd79249-37f6-4e44-a5b5-130c68dee37a.png";
const OUT = "C:/Users/Arthu/Projeto Medicina/public/stat-logo.png";

const meta = await sharp(SRC).metadata();
const W = meta.width, H = meta.height;

// Recorte GENEROSO (não corta nada) — o trim depois deixa justo no logo.
const left = Math.round(W * 0.06);
const top = Math.round(H * 0.24);
const cw = Math.round(W * 0.88);
const ch = Math.round(H * 0.46);

const { data: px, info } = await sharp(SRC)
  .extract({ left, top, width: cw, height: ch })
  .resize({ width: 1400 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Remove o fundo navy (chroma-key) → transparente; preserva "STAT" + linha.
const nr = px[0], ng = px[1], nb = px[2];
const t0 = 48, t1 = 104;
for (let i = 0; i < px.length; i += 4) {
  const dr = px[i] - nr, dg = px[i + 1] - ng, db = px[i + 2] - nb;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  px[i + 3] = dist <= t0 ? 0 : dist >= t1 ? 255 : Math.round(((dist - t0) / (t1 - t0)) * 255);
}

// Apara as bordas transparentes → bounding box justo do logo (sem cortar, sem sobra).
await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 12 })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

const out = await sharp(OUT).metadata();
console.log("logo final:", out.width + "x" + out.height);
