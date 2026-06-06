import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { ensureTables, getDb, Role, UserRow } from "./db";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };
const SESSION_MAX_AGE = 60 * 60 * 12; // 12h

export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
  iat?: number;
  exp?: number;
};

// Erro de autorizacao com status HTTP associado.
export class AuthError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

// Resposta padrao: mapeia AuthError para o status certo, senao 500.
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.code }, { status: err.status });
  }
  console.error("[route error]", err);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 16) {
    // Fail-closed: nunca assinar/validar sessao com segredo fraco em producao.
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET ausente ou fraco (>=16 chars) em producao");
    }
    return new TextEncoder().encode("dev-insecure-secret-troque-em-producao");
  }
  return new TextEncoder().encode(secret);
}

// ===== Senha =====
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ===== JWT de sessao (jose) =====
export async function signSession(p: { sub: string; role: Role; name: string }): Promise<string> {
  return new SignJWT({ role: p.role, name: p.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      sub: String(payload.sub),
      role: payload.role as Role,
      name: String(payload.name ?? ""),
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

// ===== Cookie =====
export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

// ===== Guards (re-consultam o banco para refletir aprovacao/revogacao em tempo real) =====
export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireUser(req: NextRequest): Promise<UserRow> {
  const session = await getSession(req);
  if (!session) throw new AuthError(401, "unauthorized");
  await ensureTables();
  const db = getDb();
  const r = await db.execute({ sql: "SELECT * FROM users WHERE id = ? LIMIT 1", args: [session.sub] });
  if (r.rows.length === 0) throw new AuthError(401, "unauthorized");
  const user = r.rows[0] as unknown as UserRow;
  if (user.status === "disabled") throw new AuthError(403, "disabled");
  return user;
}

export async function requireRole(req: NextRequest, role: Role): Promise<UserRow> {
  const user = await requireUser(req);
  if (user.role !== role) throw new AuthError(403, "forbidden");
  return user;
}

export async function requireApprovedResponder(req: NextRequest): Promise<UserRow> {
  const user = await requireUser(req);
  if (user.role !== "responder" || user.status !== "approved") {
    throw new AuthError(403, "not_approved");
  }
  return user;
}

// Admin via senha de header (mesmo padrao dos outros projetos) — sem conta/sessao.
export function isAdminRequest(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return req.headers.get("x-admin-password") === adminPassword;
}
export function requireAdmin(req: NextRequest): void {
  if (!isAdminRequest(req)) throw new AuthError(401, "unauthorized");
}

// Cron da Vercel — Bearer CRON_SECRET, fail-closed (sem secret => nega).
export function requireCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
