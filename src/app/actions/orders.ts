"use server";

import { revalidatePath } from "next/cache";
import { adminAuthed, requireSession } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/labels";
import type { AdminOrderDetail } from "@/lib/barly-api";

const STATUSES = ORDER_STATUSES.map((s) => s.id);

export async function updateOrderStatus(orderId: string, status: string) {
  await requireSession();
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    throw new Error("Invalid status");
  }

  const res = await adminAuthed<AdminOrderDetail>(`/v1/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: { status },
  });
  if (!res.ok) {
    throw new Error(res.message || "Could not update order status");
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/cash");
  revalidatePath("/");
}
