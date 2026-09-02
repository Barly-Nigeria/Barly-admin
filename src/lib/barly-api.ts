export const BARLY_API_BASE_URL =
  process.env.BARLY_API_BASE_URL ?? "http://localhost:4000";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type AdminProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type AdminInvite = {
  id: string;
  email: string;
  role: "admin" | "staff";
  expires_at: string;
  created_at: string;
};

export type TeamPayload = {
  members: AdminProfile[];
  invites: AdminInvite[];
};

export async function adminApi<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string;
  } = {},
): Promise<{ status: number; ok: boolean; body: ApiEnvelope<T> | null; message: string }> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(`${BARLY_API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  return {
    status: res.status,
    ok: res.ok,
    body,
    message: body?.message ?? "Request failed",
  };
}
