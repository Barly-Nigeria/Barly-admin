"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VENDOR_CATEGORIES } from "@/lib/labels";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

async function requireManager() {
  const session = await requireSession();
  if (session.role !== "manager") {
    throw new Error("Only managers can change vendors.");
  }
  return session;
}

export async function createVendor(formData: FormData) {
  await requireManager();
  const name = String(formData.get("name") ?? "").trim();
  const rawCategory = String(formData.get("category") ?? "other").trim();
  const category = VENDOR_CATEGORIES.some((c) => c.id === rawCategory) ? rawCategory : "other";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  if (!name) throw new Error("Vendor name is required.");
  if (!EMAIL_PATTERN.test(email)) throw new Error("A valid email is required.");
  if (!address) throw new Error("An address is required.");

  const duplicate = await prisma.vendor.findFirst({
    where: {
      OR: [{ name }, { email }],
    },
  });
  if (duplicate?.name === name) throw new Error("A vendor with that name already exists.");
  if (duplicate?.email === email) throw new Error("A vendor with that email already exists.");

  await prisma.vendor.create({
    data: {
      name,
      category,
      email,
      phone,
      address,
      city,
      balanceDue: 0,
    },
  });

  revalidatePath("/vendors");
  revalidatePath("/catalog");
}

export async function deleteVendor(vendorId: string) {
  await requireManager();
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: { _count: { select: { items: true } } },
  });
  if (!vendor) throw new Error("Vendor not found");
  if (vendor._count.items > 0) {
    throw new Error(
      `${vendor.name} still has ${vendor._count.items} catalog item${vendor._count.items === 1 ? "" : "s"}. Move or delete those SKUs first.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    const payments = await tx.vendorPayment.findMany({
      where: { vendorId },
      select: { id: true },
    });
    const paymentIds = payments.map((p) => p.id);
    if (paymentIds.length > 0) {
      await tx.cashEntry.updateMany({
        where: { vendorPaymentId: { in: paymentIds } },
        data: { vendorPaymentId: null },
      });
    }
    await tx.vendorDispatch.deleteMany({ where: { vendorId } });
    await tx.vendorPayment.deleteMany({ where: { vendorId } });
    await tx.vendor.delete({ where: { id: vendorId } });
  });

  revalidatePath("/vendors");
  revalidatePath("/catalog");
  revalidatePath("/");
}
