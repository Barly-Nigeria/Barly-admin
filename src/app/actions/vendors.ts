"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function payVendor(vendorId: string, formData: FormData) {
  const session = await requireSession();
  if (session.role !== "manager") {
    throw new Error("Only managers can pay vendors.");
  }

  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method") ?? "transfer");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new Error("Vendor not found");
  if (amount > vendor.balanceDue) {
    throw new Error("Amount is higher than the balance due.");
  }

  const payment = await prisma.vendorPayment.create({
    data: {
      vendorId,
      amount,
      method,
      status: "paid",
    },
  });

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { balanceDue: { decrement: amount } },
  });

  await prisma.cashEntry.create({
    data: {
      type: "outflow",
      source: "vendor_payout",
      amount,
      note: `${method} to ${vendor.name}`,
      vendorPaymentId: payment.id,
    },
  });

  revalidatePath("/vendors");
  revalidatePath("/cash");
  revalidatePath("/");
}
