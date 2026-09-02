"use server";

import { redirect } from "next/navigation";
import { adminApi, type AdminProfile, type TokenPair } from "@/lib/barly-api";
import { adminAuthed, destroySession, setAuthCookies } from "@/lib/auth";

async function establishSession(tokens?: TokenPair) {
  if (!tokens) return false;
  await setAuthCookies(tokens);
  return true;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const res = await adminApi<{ admin: AdminProfile; tokens: TokenPair }>("/v1/admin/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!res.ok || !(await establishSession(res.body?.data?.tokens))) {
    redirect("/login?error=1");
  }
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const res = await adminApi<{ admin: AdminProfile; tokens: TokenPair }>(
    "/v1/admin/auth/accept-invite",
    {
      method: "POST",
      body: { token, first_name: firstName, last_name: lastName, password },
    },
  );
  if (!res.ok || !(await establishSession(res.body?.data?.tokens))) {
    redirect(`/invite?token=${encodeURIComponent(token)}&error=1`);
  }
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  await adminApi("/v1/admin/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
  redirect(`/forgot-password?sent=1&email=${encodeURIComponent(email)}`);
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const otp = String(formData.get("otp") ?? "").trim();
  const password = String(formData.get("new_password") ?? "");
  const res = await adminApi<{ admin: AdminProfile; tokens: TokenPair }>(
    "/v1/admin/auth/reset-password",
    {
      method: "POST",
      body: { email, otp, new_password: password },
    },
  );
  if (!res.ok || !(await establishSession(res.body?.data?.tokens))) {
    redirect(`/reset-password?error=1&email=${encodeURIComponent(email)}`);
  }
  redirect("/");
}

export async function changePasswordAction(formData: FormData) {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const res = await adminAuthed("/v1/admin/auth/change-password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
  });
  if (!res.ok) {
    redirect("/settings?error=1");
  }
  redirect("/settings?updated=1");
}
