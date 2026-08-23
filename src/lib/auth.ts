import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { SESSION_COOKIE, SESSION_SECRET } from "./session-constants";

export { SESSION_COOKIE };

const secret = new TextEncoder().encode(SESSION_SECRET);

export type SessionEmployee = {
  id: string;
  email: string;
  name: string;
  role: "manager" | "staff";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(employee: SessionEmployee) {
  const token = await new SignJWT(employee)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

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
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role === "manager" ? "manager" : "staff",
    };
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
