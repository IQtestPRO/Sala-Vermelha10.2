import sharp from "sharp";

const SRC = "C:/Users/Arthu/Desktop/CLAUD.IA/Stat-Medic/hf_20260606_155819_ecd79249-37f6-4e44-a5b5-130c68dee37a.png";
const OUT = "C:/Users/Arthu/Projeto Medicina/public/stat-logo.png";

const meta = await sharp(SRC).metadata();
const W = meta.width, H = meta.height;

// Cor de fundo (canto) — navy do logo, p/ casar com o hero.
const { data } = await sharp(SRC).extract({ left: 12, top: 12, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
const hex = "#" + [data[0], data[1], data[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
console.log("bg navy =", hex, " (", W, "x", H, ")");

// Recorta a faixa do logo (STAT + linha).
const left = Math.round(W * 0.12);
const top = Math.round(H * 0.31);
const cw = Math.round(W * 0.76);
const ch = Math.round(H * 0.30);

// Remove o fundo navy (chroma-key) -> transparente, preservando "STAT" + linha exatos.
const { data: px, info } = await sharp(SRC)
  .extract({ left, top, width: cw, height: ch })
  .resize({ width: 1100 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const nr = px[0], ng = px[1], nb = px[2]; // canto = navy de fundo
const t0 = 48, t1 = 104; // rampa suave de alpha (borda anti-serrilhada)
for (let i = 0; i < px.length; i += 4) {
  const dr = px[i] - nr, dg = px[i + 1] - ng, db = px[i + 2] - nb;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  px[i + 3] = dist <= t0 ? 0 : dist >= t1 ? 255 : Math.round(((dist - t0) / (t1 - t0)) * 255);
}
await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);
console.log("logo transparente:", OUT, info.width + "x" + info.height);
