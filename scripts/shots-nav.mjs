import { chromium } from "playwright";
import { mkdirSync } from "fs";

const dir = "C:/Users/Arthu/Projeto Medicina/.shots";
mkdirSync(dir, { recursive: true });
const base = "https://sala-vermelha10-2.vercel.app";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.fill('input[placeholder*="CRM"]', "2710");
await page.fill('input[type=password]', "admin123");
await page.click('button:has-text("Entrar")');
await page.waitForTimeout(3000);
await page.evaluate(() => { try { localStorage.setItem("e10_consent", "1.0"); localStorage.setItem("stat_theme", "light"); } catch {} });

for (const [path, name] of [["/rapido", "tab-rapida"], ["/feed", "tab-casos"], ["/condutas", "tab-condutas"]]) {
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${dir}/${name}.png` });
  console.log("shot:", name);
}
await browser.close();
console.log("done");
