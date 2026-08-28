import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";

import * as db from "./db";
import { ENV } from "./_core/env";

const scrypt = promisify(scryptCallback);
const usernamePattern = /^[\p{L}\p{N}_]{3,32}$/u;

function sessionKey() {
  if (!ENV.cookieSecret) throw new Error("مفتاح جلسات الخادم غير متاح.");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export function normalizeUsername(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase("ar");
}

export function validateUsername(value: string) {
  return usernamePattern.test(value);
}

function readBootstrapAdminConfig() {
  const username = normalizeUsername(process.env.LOCAL_ADMIN_USERNAME ?? "");
  const password = process.env.LOCAL_ADMIN_PASSWORD ?? "";
  return { configured: validateUsername(username) && password.length >= 8, username, password };
}

export function getBootstrapAdminConfig() {
  const { configured, username } = readBootstrapAdminConfig();
  return { configured, username };
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;
  const [salt, expected] = storedHash.split(":");
  if (!salt || !expected) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  const expectedBuffer = Buffer.from(expected, "base64url");
  return expectedBuffer.length === actual.length && timingSafeEqual(expectedBuffer, actual);
}

export async function ensureBootstrapAdmin() {
  const config = readBootstrapAdminConfig();
  if (!config.configured) throw new Error("بيانات المدير الأول غير مكتملة.");
  return db.ensureBootstrapAdmin({ username: config.username, name: config.username, passwordHash: await hashPassword(config.password) });
}

export async function createLocalSession(user: { id: number; role: "user" | "admin" | "agent" }) {
  return new SignJWT({ role: user.role, kind: "local" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionKey());
}

export async function authenticateLocalRequest(req: { headers?: { authorization?: string | string[] } }) {
  const rawHeader = req.headers?.authorization;
  const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey());
    if (payload.kind !== "local" || !payload.sub) return null;
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;
    return await db.getActiveUserById(userId);
  } catch {
    return null;
  }
}
