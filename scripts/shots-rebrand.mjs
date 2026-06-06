import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const dir = "C:/Users/Arthu/Projeto Medicina/.shots";
await mkdir(dir, { recursive: true });
const base = "http://localhost:3100";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

async function gotoReady(url) {
  for (let i = 0; i < 20; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 4000 });
      return;
    } catch {
      await page.waitForTimeout(1000);
    }
  }
  throw new Error("server nao respondeu: " + url);
}

// 1) Splash (logo + ECG) — capturado cedo
await gotoReady(base + "/login");
await page.waitForTimeout(420);
await page.screenshot({ path: dir + "/01-splash.png" });

// 2) Login claro (após o splash sumir)
await page.waitForTimeout(1500);
await page.screenshot({ path: dir + "/02-login-light.png" });

// 3) Login escuro
await page.evaluate(() => localStorage.setItem("stat_theme", "dark"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(1700);
await page.screenshot({ path: dir + "/03-login-dark.png" });

// 4) Registro (claro)
await page.evaluate(() => localStorage.setItem("stat_theme", "light"));
await gotoReady(base + "/register");
await page.waitForTimeout(1600);
await page.screenshot({ path: dir + "/04-register.png" });

await browser.close();
console.log("shots ok ->", dir);
