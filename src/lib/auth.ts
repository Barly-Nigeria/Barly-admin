import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { SESSION_COOKIE, SESSION_SECRET } from "./session-constants";

export { SESSION_COOKIE };

export type SessionEmployee = {
  id: string;
  email: string;
  name: string;
  role: "manager" | "staff";
};

const encoder = new TextEncoder();

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of buf) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function signToken(employee: SessionEmployee) {
  const payload = {
    ...employee,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${toBase64Url(signature)}`;
}

async function verifyToken(token: string): Promise<SessionEmployee | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const key = await hmacKey();
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(sig),
    encoder.encode(body),
  );
  if (!ok) return null;
  const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionEmployee & {
    exp?: number;
  };
  if (payload.exp && payload.exp < Date.now()) return null;
  if (!payload.id || !payload.email || !payload.name) return null;
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role === "manager" ? "manager" : "staff",
  };
}

export async function createSession(employee: SessionEmployee) {
  const token = await signToken(employee);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionEmployee | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function authenticate(email: string, password: string) {
  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) return null;
  const ok = await verifyPassword(password, employee.passwordHash);
  if (!ok) return null;
  return {
    id: employee.id,
    email: employee.email,
    name: employee.name,
    role: employee.role as "manager" | "staff",
  };
}
