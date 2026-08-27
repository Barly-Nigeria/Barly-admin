"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groupByVendor, vendorFillLines } from "@/lib/invoice";

export async function sendVendorSheets(orderId: string, formData: FormData) {
  await requireSession();
  const selected = formData.getAll("vendorId").map(String);
  if (selected.length === 0) {
    throw new Error("Pick at least one vendor.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: { include: { items: { include: { item: { include: { vendor: true } } } } } },
      lines: { include: { item: { include: { vendor: true } } } },
    },
  });
  if (!order) throw new Error("Order not found");

  const groups = groupByVendor(vendorFillLines(order)).filter((g) =>
    selected.includes(g.vendorId),
  );
  if (groups.length === 0) {
    throw new Error("None of those vendors are on this order.");
  }

  await prisma.vendorDispatch.createMany({
    data: groups.map((group) => ({
      orderId,
      vendorId: group.vendorId,
      itemCount: group.pieceCount,
      summary: [
        group.vendorEmail ? `to ${group.vendorEmail}` : null,
        group.lines.map((l) => `${l.quantity}× ${l.name}`).join("; "),
      ]
        .filter(Boolean)
        .join(" · "),
    })),
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/invoices");
}
