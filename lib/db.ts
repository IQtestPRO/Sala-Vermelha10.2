import { createClient, Client } from "@libsql/client";

let cachedClient: Client | null = null;
let tableReady = false;

export function getDb(): Client {
  if (cachedClient) return cachedClient;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (url) {
    cachedClient = createClient({ url, authToken });
  } else {
    // Fallback local para desenvolvimento (sem Turso na nuvem): arquivo SQLite no projeto.
    cachedClient = createClient({ url: "file:local.db" });
  }
  return cachedClient;
}

// Cria todas as tabelas de forma idempotente. Chamado no inicio de cada rota.
export async function ensureTables() {
  if (tableReady) return;
  const db = getDb();

  // ---- USERS ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      crm           TEXT NOT NULL,
      specialty     TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'requester',
      status        TEXT NOT NULL DEFAULT 'pending',
      password_hash TEXT NOT NULL,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_crm ON users(crm)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status)`);

  // ---- PUSH SUBSCRIPTIONS (multi-dispositivo) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      endpoint   TEXT NOT NULL UNIQUE,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id)`);

  // ---- CASES ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cases (
      id                TEXT PRIMARY KEY,
      requester_id      TEXT NOT NULL,
      status            TEXT NOT NULL DEFAULT 'open',
      priority          TEXT NOT NULL DEFAULT 'critical',
      clinical_summary  TEXT NOT NULL,
      question_type     TEXT NOT NULL,
      question_text     TEXT NOT NULL,
      patient_ref       TEXT,
      patient_age       INTEGER,
      patient_sex       TEXT,
      patient_weight_kg REAL,
      vitals            TEXT,
      created_at        INTEGER NOT NULL,
      sla_expires_at    INTEGER NOT NULL,
      claimed_by        TEXT,
      claimed_at        INTEGER,
      answered_at       INTEGER,
      closed_at         INTEGER
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_cases_status_created ON cases(status, created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_cases_requester ON cases(requester_id, created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_cases_sla ON cases(status, sla_expires_at)`);

  // ---- CASE IMAGES (ECG etc.) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS case_images (
      id         TEXT PRIMARY KEY,
      case_id    TEXT NOT NULL,
      blob_url   TEXT NOT NULL,
      kind       TEXT NOT NULL DEFAULT 'ecg',
      created_at INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_case_images_case ON case_images(case_id)`);

  // ---- RESPONSES (conduta do especialista) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS responses (
      id                 TEXT PRIMARY KEY,
      case_id            TEXT NOT NULL,
      responder_id       TEXT NOT NULL,
      body               TEXT NOT NULL,
      structured_conduct TEXT,
      created_at         INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_responses_case ON responses(case_id, created_at)`);

  // ---- MESSAGES (chat de esclarecimento) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id         TEXT PRIMARY KEY,
      case_id    TEXT NOT NULL,
      sender_id  TEXT NOT NULL,
      body       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_messages_case ON messages(case_id, created_at)`);

  // ---- CASE EVENTS (auditoria imutavel) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS case_events (
      id         TEXT PRIMARY KEY,
      case_id    TEXT NOT NULL,
      actor_id   TEXT,
      event_type TEXT NOT NULL,
      payload    TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_case_events_case ON case_events(case_id, created_at)`);

  tableReady = true;
}

// ===== Tipos de linha =====
export type Role = "requester" | "responder" | "admin";
export type UserStatus = "pending" | "approved" | "rejected" | "disabled";

export type UserRow = {
  id: string;
  name: string;
  crm: string;
  specialty: string;
  role: Role;
  status: UserStatus;
  password_hash: string;
  created_at: number;
  updated_at: number;
};

export type CaseStatus = "open" | "claimed" | "answered" | "closed" | "expired";

export type CaseRow = {
  id: string;
  requester_id: string;
  status: CaseStatus;
  priority: string;
  clinical_summary: string;
  question_type: string;
  question_text: string;
  patient_ref: string | null;
  patient_age: number | null;
  patient_sex: string | null;
  patient_weight_kg: number | null;
  vitals: string | null;
  created_at: number;
  sla_expires_at: number;
  claimed_by: string | null;
  claimed_at: number | null;
  answered_at: number | null;
  closed_at: number | null;
};

export type CaseImageRow = {
  id: string;
  case_id: string;
  blob_url: string;
  kind: string;
  created_at: number;
};

export type ResponseRow = {
  id: string;
  case_id: string;
  responder_id: string;
  body: string;
  structured_conduct: string | null;
  created_at: number;
};

export type MessageRow = {
  id: string;
  case_id: string;
  sender_id: string;
  body: string;
  created_at: number;
};

export type CaseEventRow = {
  id: string;
  case_id: string;
  actor_id: string | null;
  event_type: string;
  payload: string | null;
  created_at: number;
};
