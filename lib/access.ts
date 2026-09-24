import { createHmac, timingSafeEqual } from "crypto";

export const ACCESS_COOKIE = "commande_atelier_access";
export type AccessRole = "admin";

type AccessSession = { role: AccessRole; expiresAt: number };

function config() {
  return {
    sessionSecret: process.env.ACCESS_SESSION_SECRET,
    adminCode: process.env.ADMIN_ACCESS_CODE,
  };
}

export function accessIsConfigured() {
  const { sessionSecret, adminCode } = config();
  return Boolean(sessionSecret && adminCode);
}

function signature(payload: string) {
  const { sessionSecret } = config();
  if (!sessionSecret) return "";
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

function safelyMatches(left: string, right?: string) {
  if (!right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function roleForCode(code: string): AccessRole | null {
  const { adminCode } = config();
  if (safelyMatches(code, adminCode)) return "admin";
  return null;
}

export function createAccessSession(role: AccessRole) {
  const payload = Buffer.from(JSON.stringify({ role, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30 } satisfies AccessSession)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function readAccessSession(value?: string): AccessSession | null {
  if (!value || !accessIsConfigured()) return null;
  const [payload, receivedSignature] = value.split(".");
  const expectedSignature = signature(payload);
  if (!payload || !receivedSignature || !safelyMatches(receivedSignature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AccessSession;
    return session.role === "admin" && Number.isFinite(session.expiresAt) && session.expiresAt > Date.now()
      ? session
      : null;
  } catch {
    return null;
  }
}
