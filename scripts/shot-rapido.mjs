import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(scriptDir, "..", ".shots");
await mkdir(SHOTS, { recursive: true });
const BASE = "http://localhost:3000";
const crm = `CRM/SP ${Math.floor(Math.random() * 90000) + 10000}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const log = [];
async function step(label, fn) {
  try { await fn(); log.push("OK  " + label); } catch (e) { log.push("ERR " + label + " :: " + (e?.message || e).toString().slice(0, 140)); }
}

await step("register + consent", async () => {
  await p.goto(BASE + "/register", { waitUntil: "networkidle" });
  await p.locator("input").nth(0).fill("Dr Recem Formado");
  await p.locator("input").nth(1).fill(crm);
  await p.locator("input[type=password]").fill("senha123");
  await p.getByRole("button", { name: /Criar conta/ }).click();
  await p.waitForFunction(() => document.body.innerText.includes("Li e concordo") || document.body.innerText.includes("Meus casos"), null, { timeout: 12000 });
  const c = p.getByRole("button", { name: /Li e concordo/ });
  if (await c.count()) await c.click();
  await sleep(600);
});

await step("rapido list", async () => {
  await p.goto(BASE + "/rapido", { waitUntil: "networkidle" });
  await sleep(700);
  await p.screenshot({ path: path.join(SHOTS, "20-rapido-list.png") });
});

await step("rapido bradicardia", async () => {
  await p.getByText(/Bradiarritmia Inst/).click();
  await sleep(700);
  await p.screenshot({ path: path.join(SHOTS, "21-rapido-bradi.png") });
});

await step("rapido PCR", async () => {
  await p.goto(BASE + "/rapido", { waitUntil: "networkidle" });
  await sleep(400);
  await p.getByText(/Parada Cardiorrespirat/).click();
  await sleep(700);
  await p.screenshot({ path: path.join(SHOTS, "22-rapido-pcr.png") });
});

await step("condutas detail shows acao no topo", async () => {
  await p.goto(BASE + "/condutas?c=anafilaxia", { waitUntil: "networkidle" });
  await sleep(800);
  await p.screenshot({ path: path.join(SHOTS, "23-conduta-anafilaxia.png") });
});

await browser.close();
console.log(log.join("\n"));
