import { chromium } from "playwright";
import { mkdirSync } from "fs";

// Uso: node scripts/shot-auth.mjs <baseUrl> <crm> <senha> <rota1:nome1> <rota2:nome2> ...
const [, , base = "https://statanalysis.vercel.app", crm = "2710", senha = "admin123", ...pairs] = process.argv;
const dir = "C:/Users/Arthu/Projeto Medicina/.shots";
mkdirSync(dir, { recursive: true });

const targets = (pairs.length ? pairs : ["/rapido:rapido", "/feed:feed", "/condutas:condutas"]).map((p) => {
  const i = p.lastIndexOf(":");
  return { route: p.slice(0, i), name: p.slice(i + 1) };
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
await page.waitForSelector("input.auth-field", { timeout: 20000 });
await page.waitForTimeout(1500); // splash cobre a tela ~1.1s; espera sumir antes de clicar
const inputs = await page.$$("input.auth-field");
await inputs[0].fill(crm);
await inputs[1].fill(senha);
await page.click("button.auth-btn");
await page.waitForTimeout(4500);
await page.evaluate(() => {
  try { localStorage.setItem("e10_consent", "1.0"); localStorage.setItem("stat_theme", "light"); } catch {}
});

for (const t of targets) {
  try {
    await page.goto(base + t.route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${dir}/${t.name}.png`, fullPage: true });
    console.log("shot:", t.name, "->", page.url());
  } catch (e) {
    console.log("ERRO", t.name, e.message);
  }
}
await browser.close();
console.log("done");
