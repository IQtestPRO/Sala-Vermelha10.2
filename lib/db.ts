import { createClient, Client } from "@libsql/client";

let cachedClient: Client | null = null;
let tableReady = false;

export function getDb(): Client {
  if (cachedClient) return cachedClient;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (url) {
    cachedClient = createClient({ url, authToken });
  } else if (process.env.NODE_ENV !== "production") {
    // Fallback local APENAS em desenvolvimento (na Vercel o FS e somente-leitura).
    cachedClient = createClient({ url: "file:local.db" });
  } else {
    throw new Error("TURSO_DATABASE_URL nao configurada em producao");
  }
  return cachedClient;
}

// Adiciona uma coluna se ela ainda nao existir (SQLite nao tem ADD COLUMN IF NOT EXISTS).
async function addColumnIfMissing(db: Client, table: string, col: string, type: string) {
  try {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  } catch {
    /* coluna ja existe — ok */
  }
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
  // Índice único de CRM é criado como PARCIAL mais abaixo (após a coluna doc_type existir),
  // p/ não colidir com acadêmicos (login por CPF, crm vazio).
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

  // Leitura preliminar da IA (anexada ao criar o caso) — idempotente.
  await addColumnIfMissing(db, "cases", "ai_analysis", "TEXT");
  await addColumnIfMissing(db, "cases", "ai_message", "TEXT");

  // Telefone do cadastro — idempotente.
  await addColumnIfMissing(db, "users", "phone", "TEXT");
  await addColumnIfMissing(db, "users", "email", "TEXT");
  await addColumnIfMissing(db, "users", "avatar_url", "TEXT");
  await addColumnIfMissing(db, "users", "perfil_medico", "TEXT");

  // ---- Login por CPF (acadêmicos) além de CRM ----
  // doc_type: 'crm' (médico → responder) | 'cpf' (acadêmico → requester, travado).
  await addColumnIfMissing(db, "users", "cpf", "TEXT");
  await addColumnIfMissing(db, "users", "doc_type", "TEXT");
  await db.execute(`UPDATE users SET doc_type = 'crm' WHERE doc_type IS NULL OR doc_type = ''`);
  await db.execute(`DROP INDEX IF EXISTS idx_users_crm`);
  // Únicos PARCIAIS: CRM só entre médicos; CPF só entre acadêmicos (vazios/nulos não colidem).
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_crm_doc ON users(crm) WHERE doc_type = 'crm'`);
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cpf_doc ON users(cpf) WHERE doc_type = 'cpf'`);

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

  // ---- CHATS (historico de conversas com a IA, por usuario) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS chats (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      title      TEXT NOT NULL,
      messages   TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id, updated_at)`);

  // ---- HANDOFFS (passagem de plantão — registro contínuo do paciente, compartilhável) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS handoffs (
      id          TEXT PRIMARY KEY,
      token       TEXT NOT NULL UNIQUE,
      paciente    TEXT NOT NULL,
      idade       TEXT,
      leito       TEXT,
      situacao    TEXT,
      status      TEXT NOT NULL DEFAULT 'ativo',
      created_by  TEXT NOT NULL,
      author_name TEXT,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_handoffs_status ON handoffs(status, updated_at DESC)`);

  // ---- HANDOFF ENTRIES (o log contínuo: o que cada médico passou/fez) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS handoff_entries (
      id          TEXT PRIMARY KEY,
      handoff_id  TEXT NOT NULL,
      author_id   TEXT NOT NULL,
      author_name TEXT,
      texto       TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_handoff_entries ON handoff_entries(handoff_id, created_at)`);

  // ---- SHIFTS (agenda de plantões + financeiro, por usuário — estilo Plantãozinho) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS shifts (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      data       TEXT NOT NULL,
      inicio     TEXT,
      fim        TEXT,
      local      TEXT,
      valor      REAL,
      pago       INTEGER NOT NULL DEFAULT 0,
      cor        TEXT,
      nota       TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_shifts_user_data ON shifts(user_id, data)`);

  // ---- PCR REPORTS (relatório do Modo PCR/ACLS, por usuário) ----
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pcr_reports (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      started_at  INTEGER NOT NULL,
      duracao_seg INTEGER,
      ciclos      INTEGER,
      choques     INTEGER,
      desfecho    TEXT,
      eventos     TEXT,
      ritmos      TEXT,
      causas      TEXT,
      relatorio   TEXT,
      created_at  INTEGER NOT NULL
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_pcr_user ON pcr_reports(user_id, created_at DESC)`);

  await maybeSeedResponder(db);
  tableReady = true;
}

// Cria um plantonista APROVADO a partir de variaveis de ambiente (opcional).
// Permite ter um login fixo em qualquer ambiente (local + Vercel) sem expor a senha no codigo.
let ownerSeeded = false;
async function maybeSeedResponder(db: Client) {
  if (ownerSeeded) return;
  ownerSeeded = true;
  const crm = process.env.SEED_RESPONDER_CRM?.trim();
  const password = process.env.SEED_RESPONDER_PASSWORD;
  if (!crm || !password) return;
  try {
    const existing = await db.execute({ sql: "SELECT id FROM users WHERE crm = ? LIMIT 1", args: [crm] });
    if (existing.rows.length > 0) return;
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash(password, 10);
    const now = Date.now();
    await db.execute({
      sql: `INSERT INTO users (id, name, crm, specialty, role, status, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'responder', 'approved', ?, ?, ?)`,
      args: [
        "u_seed_" + crm.replace(/\W/g, ""),
        process.env.SEED_RESPONDER_NAME || "Médico",
        crm,
        process.env.SEED_RESPONDER_SPECIALTY || "Emergencista",
        hash,
        now,
        now,
      ],
    });
  } catch (e) {
    console.error("[seed responder]", e);
  }
}

// ===== Tipos de linha =====
export type Role = "requester" | "responder" | "admin";
export type UserStatus = "pending" | "approved" | "rejected" | "disabled";

export type DocType = "crm" | "cpf";

export type UserRow = {
  id: string;
  name: string;
  crm: string; // "" para acadêmicos (login por CPF)
  cpf: string | null;
  doc_type: DocType | null; // null em linhas antigas = tratar como 'crm'
  specialty: string; // para acadêmicos guarda faculdade/período
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  perfil_medico: string | null;
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
  ai_analysis: string | null;
  ai_message: string | null;
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

export type HandoffRow = {
  id: string;
  token: string;
  paciente: string;
  idade: string | null;
  leito: string | null;
  situacao: string | null;
  status: "ativo" | "encerrado";
  created_by: string;
  author_name: string | null;
  created_at: number;
  updated_at: number;
};

export type HandoffEntryRow = {
  id: string;
  handoff_id: string;
  author_id: string;
  author_name: string | null;
  texto: string;
  created_at: number;
};

export type ShiftRow = {
  id: string;
  user_id: string;
  data: string;
  inicio: string | null;
  fim: string | null;
  local: string | null;
  valor: number | null;
  pago: number;
  cor: string | null;
  nota: string | null;
  created_at: number;
};
