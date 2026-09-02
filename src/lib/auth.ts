import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./session-constants";
import { adminApi, type AdminProfile, type TokenPair } from "./barly-api";

export type SessionEmployee = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: "admin" | "staff";
};

export function profileToSession(admin: AdminProfile): SessionEmployee {
  const name =
    [admin.first_name, admin.last_name].filter(Boolean).join(" ").trim() || admin.email;
  return {
    id: admin.id,
    email: admin.email,
    name,
    firstName: admin.first_name,
    lastName: admin.last_name,
    role: admin.role === "admin" ? "admin" : "staff",
  };
}

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function setAuthCookies(tokens: TokenPair) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, tokens.access_token, {
    ...cookieBase(),
    maxAge: 60 * 60 * 6,
  });
  jar.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...cookieBase(),
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken() {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

async function fetchMe(accessToken: string) {
  const res = await adminApi<AdminProfile>("/v1/admin/auth/me", { accessToken });
  if (!res.ok || !res.body?.data) return null;
  return profileToSession(res.body.data);
}

export async function refreshSession(refreshToken: string): Promise<TokenPair | null> {
  const res = await adminApi<{ tokens: TokenPair }>("/v1/admin/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
  if (!res.ok || !res.body?.data?.tokens) return null;
  return res.body.data.tokens;
}

export async function getSession(): Promise<SessionEmployee | null> {
  const access = await getAccessToken();
  const refresh = await getRefreshToken();
  if (!access && !refresh) return null;

  if (access) {
    const me = await fetchMe(access);
    if (me) return me;
  }
  if (!refresh) return null;

  const tokens = await refreshSession(refresh);
  if (!tokens) return null;
  return fetchMe(tokens.access_token);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "admin") {
    throw new Error("Only admins can do this.");
  }
  return session;
}

export async function adminAuthed<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
) {
  let access = await getAccessToken();
  const refresh = await getRefreshToken();

  if (!access && refresh) {
    const tokens = await refreshSession(refresh);
    if (tokens) {
      try {
        await setAuthCookies(tokens);
      } catch {
        // cookies() is read-only in Server Components
      }
      access = tokens.access_token;
    }
  }
  if (!access) {
    throw new Error("Unauthorized");
  }

  let res = await adminApi<T>(path, { ...options, accessToken: access });
  if (res.status === 401 && refresh) {
    const tokens = await refreshSession(refresh);
    if (tokens) {
      try {
        await setAuthCookies(tokens);
      } catch {
        // cookies() is read-only in Server Components
      }
      res = await adminApi<T>(path, { ...options, accessToken: tokens.access_token });
    }
  }
  return res;
}
