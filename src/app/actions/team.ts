"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminAuthed, requireAdmin } from "@/lib/auth";
import type { AdminInvite } from "@/lib/barly-api";

export async function inviteMemberAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "staff");
  const res = await adminAuthed<AdminInvite>("/v1/admin/team/invites", {
    method: "POST",
    body: { email, role },
  });
  if (!res.ok) {
    redirect(`/team?error=${encodeURIComponent(res.message)}`);
  }
  revalidatePath("/team");
  redirect("/team?invited=1");
}

export async function revokeInviteAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const res = await adminAuthed(`/v1/admin/team/invites/${id}/revoke`, { method: "POST" });
  if (!res.ok) {
    redirect(`/team?error=${encodeURIComponent(res.message)}`);
  }
  revalidatePath("/team");
  redirect("/team");
}

export async function deactivateMemberAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const res = await adminAuthed(`/v1/admin/team/${id}/deactivate`, { method: "POST" });
  if (!res.ok) {
    redirect(`/team?error=${encodeURIComponent(res.message)}`);
  }
  revalidatePath("/team");
  redirect("/team");
}
