import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN");
  process.exit(1);
}
const db = createClient({ url, authToken });

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, crm TEXT NOT NULL, specialty TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'requester', status TEXT NOT NULL DEFAULT 'pending',
    password_hash TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_crm ON users(crm)`,
  `CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status)`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL, auth TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id)`,
  `CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY, requester_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'critical', clinical_summary TEXT NOT NULL,
    question_type TEXT NOT NULL, question_text TEXT NOT NULL, patient_ref TEXT,
    patient_age INTEGER, patient_sex TEXT, patient_weight_kg REAL, vitals TEXT,
    created_at INTEGER NOT NULL, sla_expires_at INTEGER NOT NULL, claimed_by TEXT,
    claimed_at INTEGER, answered_at INTEGER, closed_at INTEGER)`,
  `CREATE INDEX IF NOT EXISTS idx_cases_status_created ON cases(status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_cases_requester ON cases(requester_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_cases_sla ON cases(status, sla_expires_at)`,
  `CREATE TABLE IF NOT EXISTS case_images (
    id TEXT PRIMARY KEY, case_id TEXT NOT NULL, blob_url TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'ecg', created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_case_images_case ON case_images(case_id)`,
  `CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY, case_id TEXT NOT NULL, responder_id TEXT NOT NULL,
    body TEXT NOT NULL, structured_conduct TEXT, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_responses_case ON responses(case_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, case_id TEXT NOT NULL, sender_id TEXT NOT NULL,
    body TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_case ON messages(case_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS case_events (
    id TEXT PRIMARY KEY, case_id TEXT NOT NULL, actor_id TEXT, event_type TEXT NOT NULL,
    payload TEXT, created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_case_events_case ON case_events(case_id, created_at)`,
];

for (const sql of statements) {
  await db.execute(sql);
}
console.log("Tabelas criadas/conferidas:", statements.filter((s) => s.startsWith("CREATE TABLE")).length, "tabelas");

// Seed do login fixo
const crm = "2710";
const ex = await db.execute({ sql: "SELECT id FROM users WHERE crm = ? LIMIT 1", args: [crm] });
if (ex.rows.length === 0) {
  const hash = await bcrypt.hash("admin123", 10);
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO users (id, name, crm, specialty, role, status, password_hash, created_at, updated_at)
          VALUES (?, ?, ?, 'Emergencista', 'responder', 'approved', ?, ?, ?)`,
    args: ["u_seed_2710", "Dr. Arthur", crm, hash, now, now],
  });
  console.log("Login semeado: CRM 2710 / admin123 (plantonista aprovado)");
} else {
  console.log("Login CRM 2710 ja existia.");
}

const check = await db.execute("SELECT crm, name, role, status FROM users ORDER BY created_at DESC LIMIT 5");
console.log("Usuarios no banco:", JSON.stringify(check.rows));
console.log("OK — banco de producao pronto.");
