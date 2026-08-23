"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, destroySession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const employee = await authenticate(email, password);
  if (!employee) {
    redirect("/login?error=1");
  }
  await createSession(employee);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
