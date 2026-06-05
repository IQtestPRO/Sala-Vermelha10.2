import { chromium, request as pwrequest } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(scriptDir, "..", ".shots");
await mkdir(SHOTS, { recursive: true });

const BASE = "http://localhost:3000";
const ADMIN = "admin123";
const stamp = Date.now().toString(36);
const reqCrm = `CRM/SP ${Math.floor(Math.random() * 90000) + 10000}`;
const respCrm = `CRM/MG ${Math.floor(Math.random() * 90000) + 10000}`;

const device = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const browser = await chromium.launch();
const log = [];
async function step(label, fn) {
  try {
    await fn();
    log.push("OK  " + label);
  } catch (e) {
    log.push("ERR " + label + " :: " + (e?.message || e).toString().slice(0, 120));
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- SOLICITANTE ----------------
const ctxA = await browser.newContext(device);
const A = await ctxA.newPage();
let caseUrl = null;

await step("01 login", async () => {
  await A.goto(BASE + "/login", { waitUntil: "networkidle" });
  await sleep(400);
  await A.screenshot({ path: path.join(SHOTS, "01-login.png") });
});

await step("register solicitante", async () => {
  await A.goto(BASE + "/register", { waitUntil: "networkidle" });
  await sleep(300);
  await A.screenshot({ path: path.join(SHOTS, "02-register.png") });
  await A.locator("input").nth(0).fill("Dra Mariana Costa");
  await A.locator("input").nth(1).fill(reqCrm);
  await A.locator("input[type=password]").fill("senha123");
  await A.getByRole("button", { name: /Criar conta/ }).click();
});

await step("03 consent + feed", async () => {
  await A.waitForFunction(() => document.body.innerText.includes("Li e concordo") || document.body.innerText.includes("Meus casos"), null, { timeout: 12000 });
  await sleep(500);
  await A.screenshot({ path: path.join(SHOTS, "03-consent.png") });
  const consent = A.getByRole("button", { name: /Li e concordo/ });
  if (await consent.count()) await consent.click();
  await sleep(700);
  await A.screenshot({ path: path.join(SHOTS, "04-feed-empty.png") });
});

await step("05 new-case grid", async () => {
  await A.getByRole("link", { name: /Novo caso/ }).click();
  await A.waitForURL("**/new-case", { timeout: 8000 });
  await sleep(500);
  await A.screenshot({ path: path.join(SHOTS, "05-newcase-grid.png") });
});

await step("06 new-case step1", async () => {
  await A.getByRole("button", { name: /Cardiov/ }).first().click();
  await sleep(400);
  await A.getByPlaceholder(/FA aguda/).fill("FA aguda instável, FC 178, PA 82/50");
  await sleep(300);
  await A.screenshot({ path: path.join(SHOTS, "06-newcase-step1.png") });
});

await step("07 new-case step2", async () => {
  await A.getByText(/Adicionar idade/).click();
  await sleep(400);
  const nums = A.locator('input[inputmode="numeric"]');
  await nums.nth(0).fill("64");
  await nums.nth(1).fill("80");
  await A.getByText("Masculino", { exact: true }).click();
  const pa = A.getByText("120/80", { exact: true });
  if (await pa.count()) await pa.first().click();
  await sleep(300);
  await A.screenshot({ path: path.join(SHOTS, "07-newcase-step2.png") });
});

await step("08 case detail (owner)", async () => {
  await A.getByRole("button", { name: /Enviar caso/ }).click();
  await A.waitForURL("**/case/**", { timeout: 10000 });
  caseUrl = A.url();
  await sleep(900);
  await A.screenshot({ path: path.join(SHOTS, "08-case-owner.png") });
});

// ---------------- RESPONDEDOR ----------------
const ctxB = await browser.newContext(device);
const B = await ctxB.newPage();

await step("09 register responder -> pending", async () => {
  await B.goto(BASE + "/register", { waitUntil: "networkidle" });
  await sleep(300);
  await B.getByText("Plantonista", { exact: true }).click();
  await B.locator("input").nth(0).fill("Dr Plantão Silva");
  await B.locator("input").nth(1).fill(respCrm);
  await B.locator("input[type=password]").fill("senha123");
  await B.getByRole("button", { name: /Criar conta/ }).click();
  await B.waitForFunction(() => document.body.innerText.includes("Li e concordo") || document.body.innerText.includes("análise"), null, { timeout: 12000 });
  const consent = B.getByRole("button", { name: /Li e concordo/ });
  if (await consent.count()) await consent.click();
  await sleep(700);
  await B.screenshot({ path: path.join(SHOTS, "09-pending.png") });
});

await step("approve responder via admin api", async () => {
  const api = await pwrequest.newContext({ baseURL: BASE });
  const r = await api.get("/api/admin/users?status=pending", { headers: { "x-admin-password": ADMIN } });
  const data = await r.json();
  const u = (data.users || []).find((x) => x.crm === respCrm);
  if (u) await api.post(`/api/admin/users/${u.id}/approve`, { headers: { "x-admin-password": ADMIN } });
  await api.dispose();
});

await step("10 queue", async () => {
  await B.goto(BASE + "/queue", { waitUntil: "networkidle" });
  await sleep(1200);
  await B.screenshot({ path: path.join(SHOTS, "10-queue.png") });
});

await step("11 responder opens + claims + responds", async () => {
  await B.locator('a[href^="/case/"]').first().click();
  await B.waitForURL("**/case/**", { timeout: 8000 });
  await sleep(900);
  await B.screenshot({ path: path.join(SHOTS, "11-case-responder.png") });
  await B.getByRole("button", { name: /Assumir/ }).click();
  await sleep(1200);
  await B.screenshot({ path: path.join(SHOTS, "12-conductform.png") });
  await B.getByPlaceholder(/Cardioversão sincronizada/).fill("Cardioversão sincronizada 120–150 J. Sedação: etomidato 0,1–0,15 mg/kg. Religar SYNC antes de cada choque.");
  const conf = B.getByText("Confiança alta", { exact: true });
  if (await conf.count()) await conf.click();
  const uti = B.getByText("UTI", { exact: true });
  if (await uti.count()) await uti.first().click();
  await sleep(300);
  await B.getByRole("button", { name: /Enviar resposta/ }).click();
  await sleep(1200);
  await B.screenshot({ path: path.join(SHOTS, "13-answered.png") });
});

// ---------------- CONDUTAS ----------------
await step("14 condutas list + detail + calc", async () => {
  await B.goto(BASE + "/condutas", { waitUntil: "networkidle" });
  await sleep(700);
  await B.screenshot({ path: path.join(SHOTS, "14-condutas-list.png") });
  await B.getByText(/Sequência Rápida de Intubação/).click();
  await sleep(600);
  await B.screenshot({ path: path.join(SHOTS, "15-conduta-detail.png") });
  const peso = B.getByPlaceholder("kg");
  if (await peso.count()) {
    await peso.fill("80");
    await sleep(500);
    await B.screenshot({ path: path.join(SHOTS, "16-dose-calc.png") });
  }
});

// ---------------- OWNER vê resposta ----------------
await step("17 owner sees answer", async () => {
  if (caseUrl) {
    await A.goto(caseUrl, { waitUntil: "networkidle" });
    await sleep(1200);
    await A.screenshot({ path: path.join(SHOTS, "17-owner-answer.png") });
  }
});

// ---------------- ADMIN ----------------
await step("18 admin", async () => {
  const ctxC = await browser.newContext(device);
  const C = await ctxC.newPage();
  await C.goto(BASE + "/admin", { waitUntil: "networkidle" });
  await sleep(400);
  await C.locator("input[type=password]").fill(ADMIN);
  await C.getByRole("button", { name: /Entrar/ }).click();
  await sleep(1000);
  await C.screenshot({ path: path.join(SHOTS, "18-admin.png") });
});

await browser.close();
console.log(log.join("\n"));
console.log("\nScreenshots em:", SHOTS);
