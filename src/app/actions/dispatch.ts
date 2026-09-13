"use server";

import { revalidatePath } from "next/cache";
import { adminAuthed, requireSession } from "@/lib/auth";
import type { AdminOrderDetail } from "@/lib/barly-api";

export async function sendVendorSheets(orderId: string, formData: FormData) {
  await requireSession();
  const selected = formData.getAll("vendorId").map(String).filter(Boolean);
  if (selected.length === 0) {
    throw new Error("Pick at least one vendor.");
  }

  const res = await adminAuthed<AdminOrderDetail>(`/v1/admin/orders/${orderId}/vendor-dispatches`, {
    method: "POST",
    body: { vendor_ids: selected },
  });
  if (!res.ok) {
    throw new Error(res.message || "Could not record vendor dispatch");
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/invoices");
}
