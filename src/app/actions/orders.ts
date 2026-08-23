"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSES = ["pending", "confirmed", "fulfilled", "cancelled"] as const;

export async function updateOrderStatus(orderId: string, status: string) {
  await requireSession();
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    throw new Error("Invalid status");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const paidAt =
    status === "cancelled"
      ? order.paidAt
      : status === "confirmed" || status === "fulfilled"
        ? (order.paidAt ?? new Date())
        : order.paidAt;

  await prisma.order.update({
    where: { id: orderId },
    data: { status, paidAt },
  });

  if (
    (status === "confirmed" || status === "fulfilled") &&
    order.total > 0 &&
    !order.paidAt
  ) {
    const existing = await prisma.cashEntry.findFirst({
      where: { orderId, source: "order" },
    });
    if (!existing) {
      const product = await prisma.product.findUnique({
        where: { id: order.productId },
      });
      await prisma.cashEntry.create({
        data: {
          type: "inflow",
          source: "order",
          amount: order.total,
          note: `Payment for ${product?.name ?? "order"}`,
          orderId: order.id,
        },
      });
    }
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/cash");
  revalidatePath("/");
}
