import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";

const dir = "C:/Users/Arthu/Projeto Medicina/.shots";
mkdirSync(dir, { recursive: true });
const base = "https://sala-vermelha10-2.vercel.app";

const b64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";
const jpg = dir + "/test-ecg.jpg";
writeFileSync(jpg, Buffer.from(b64, "base64"));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

async function shot(name) {
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  console.log("shot:", name);
}

// 1) Login (2710)
await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.fill('input[placeholder*="CRM"]', "2710");
await page.fill('input[type=password]', "admin123");
await page.click('button:has-text("Entrar")');
await page.waitForTimeout(3000);
// pular consentimento + tema claro
await page.evaluate(() => {
  try { localStorage.setItem("e10_consent", "1.0"); localStorage.setItem("stat_theme", "light"); } catch {}
});

// 2) Menu do Novo caso (urgência + tipos)
await page.goto(base + "/new-case", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await shot("nc-01-menu");

// 3) URGÊNCIA: foto -> analisar -> funil
await page.goto(base + "/new-case?mode=urgencia", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1400);
await page.setInputFiles("input[type=file]", jpg);
await page.waitForTimeout(3000);
await shot("nc-02-urgencia-foto");
try {
  await page.click('button:has-text("Analisar agora")', { timeout: 5000 });
  await page.waitForTimeout(28000);
  await shot("nc-03-urgencia-analise");
} catch (e) { console.log("urgencia analisar:", e.message); }

// 4) NORMAL: tipo -> foto -> analisar -> mensagem
await page.goto(base + "/new-case", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
try {
  await page.click("text=Interpretar ECG", { timeout: 5000 });
  await page.waitForTimeout(900);
  await page.setInputFiles("input[type=file]", jpg);
  await page.waitForTimeout(3000);
  await page.fill('input[placeholder*="FA aguda"]', "Dor torácica + sudorese, FC 110, PA 100/60");
  await page.click('button:has-text("Analisar com IA")', { timeout: 5000 });
  await page.waitForTimeout(28000);
  await shot("nc-04-normal-analise");
} catch (e) { console.log("normal:", e.message); }

await browser.close();
console.log("done");
