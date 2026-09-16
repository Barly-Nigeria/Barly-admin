"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminAuthed, requireSession } from "@/lib/auth";
import type {
  AdminBank,
  AdminVendor,
  AdminVendorLedgerEntry,
  AdminVendorList,
  AdminVendorPayout,
  CatalogListPage,
} from "@/lib/barly-api";

function opt(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? undefined : value;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function fail(path: string, message: string): never {
  const joiner = path.includes("?") ? "&" : "?";
  redirect(`${path}${joiner}error=${encodeURIComponent(message)}`);
}

async function mutate<T>(path: string, method: string, body: unknown, back: string) {
  await requireSession();
  const res = await adminAuthed<T>(path, body === undefined ? { method } : { method, body });
  if (!res.ok) fail(back, res.message);
  return res.body?.data;
}

function vendorBody(formData: FormData) {
  return {
    name: opt(formData, "name"),
    category: opt(formData, "category") ?? "other",
    email: opt(formData, "email"),
    phone: opt(formData, "phone") ?? "",
    address: opt(formData, "address") ?? "",
    city: opt(formData, "city") ?? "",
    bank_code: opt(formData, "bank_code"),
    account_number: opt(formData, "account_number"),
    account_name: opt(formData, "account_name"),
    is_active: formData.has("is_active") ? bool(formData, "is_active") : undefined,
  };
}

export async function createVendorAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin") fail("/vendors", "Only admins can onboard vendors");
  await mutate<AdminVendor>("/v1/admin/vendors", "POST", vendorBody(formData), "/vendors");
  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function updateVendorAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin") fail("/vendors", "Only admins can update vendors");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) fail("/vendors", "Missing vendor id");
  const body = vendorBody(formData);
  await mutate<AdminVendor>(`/v1/admin/vendors/${id}`, "PATCH", {
    ...body,
    is_active: bool(formData, "is_active"),
  }, `/vendors?edit=${id}`);
  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function deactivateVendorAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin") fail("/vendors", "Only admins can deactivate vendors");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) fail("/vendors", "Missing vendor id");
  await mutate<AdminVendor>(`/v1/admin/vendors/${id}`, "PATCH", { is_active: false }, "/vendors");
  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function payVendorAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin") fail("/vendors", "Only admins can pay vendors");
  const id = String(formData.get("id") ?? "").trim();
  const nairaRaw = String(formData.get("amount_naira") ?? "").trim();
  const naira = Number(nairaRaw);
  if (!id) fail("/vendors", "Missing vendor id");
  if (!Number.isFinite(naira) || naira <= 0) fail("/vendors", "Enter a valid amount");
  const amount = Math.round(naira * 100);
  const payout = await mutate<AdminVendorPayout>(`/v1/admin/vendors/${id}/payouts`, "POST", { amount }, "/vendors");
  revalidatePath("/vendors");
  if (payout?.status === "pending" || payout?.status === "otp") {
    redirect(`/vendors?notice=${encodeURIComponent(`Payout ${payout.status}: ${payout.reference}`)}`);
  }
  if (payout?.status === "failed") {
    fail("/vendors", payout.failure_reason || "Payout failed");
  }
  redirect(`/vendors?notice=${encodeURIComponent(`Paid ${payout?.reference ?? "vendor"}`)}`);
}

export async function resolveVendorAccountAction(formData: FormData) {
  await requireSession();
  const account_number = opt(formData, "account_number");
  const bank_code = opt(formData, "bank_code");
  if (!account_number || !bank_code) {
    return { ok: false as const, message: "Bank code and account number are required" };
  }
  const res = await adminAuthed<{ account_number: string; account_name: string; bank_id: number }>(
    "/v1/admin/vendors/resolve-account",
    { method: "POST", body: { account_number, bank_code } },
  );
  if (!res.ok || !res.body?.data) {
    return { ok: false as const, message: res.message || "Could not resolve account" };
  }
  return { ok: true as const, data: res.body.data };
}

export async function loadVendorsPage(page: number, q = "") {
  await requireSession();
  const params = new URLSearchParams({ page: String(page), limit: "30" });
  if (q.trim()) params.set("q", q.trim());
  const res = await adminAuthed<AdminVendorList>(`/v1/admin/vendors?${params.toString()}`);
  if (!res.ok || !res.body?.data) throw new Error(res.message || "Failed to load vendors");
  return res.body.data;
}

export async function loadBanks(): Promise<AdminBank[]> {
  await requireSession();
  const res = await adminAuthed<AdminBank[]>("/v1/admin/banks");
  if (!res.ok || !res.body?.data) return [];
  return res.body.data;
}

export async function loadVendorPayouts(vendorId: string) {
  await requireSession();
  const res = await adminAuthed<CatalogListPage<AdminVendorPayout>>(
    `/v1/admin/vendors/${vendorId}/payouts?limit=5`,
  );
  return res.body?.data?.items ?? [];
}

export async function loadVendorLedger(vendorId: string) {
  await requireSession();
  const res = await adminAuthed<CatalogListPage<AdminVendorLedgerEntry>>(
    `/v1/admin/vendors/${vendorId}/ledger?limit=5`,
  );
  return res.body?.data?.items ?? [];
}
