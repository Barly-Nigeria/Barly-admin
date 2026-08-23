"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireManager() {
  const session = await requireSession();
  if (session.role !== "manager") {
    throw new Error("Only managers can change the catalog.");
  }
  return session;
}

export async function createProduct(formData: FormData) {
  await requireManager();
  const name = String(formData.get("name") ?? "").trim();
  const occasion = String(formData.get("occasion") ?? "").trim();
  const price = Number(formData.get("price"));
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active");
  if (!name || !occasion || !Number.isFinite(price) || price <= 0) {
    throw new Error("Name, occasion, and a positive price are required.");
  }
  await prisma.product.create({
    data: { name, occasion, price, description, status },
  });
  revalidatePath("/catalog");
}

export async function updateProductPrice(productId: string, formData: FormData) {
  await requireManager();
  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Enter a valid price.");
  }
  await prisma.product.update({ where: { id: productId }, data: { price } });
  revalidatePath("/catalog");
}

export async function createItem(formData: FormData) {
  await requireManager();
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const cost = Number(formData.get("cost"));
  const sellPrice = Number(formData.get("sellPrice"));
  const stock = Number(formData.get("stock"));
  const vendorId = String(formData.get("vendorId") ?? "");
  if (!name || !sku || !vendorId || !Number.isFinite(sellPrice)) {
    throw new Error("Name, SKU, vendor, and sell price are required.");
  }
  await prisma.item.create({
    data: {
      name,
      sku,
      cost: Number.isFinite(cost) ? cost : 0,
      sellPrice,
      stock: Number.isFinite(stock) ? stock : 0,
      vendorId,
    },
  });
  revalidatePath("/catalog");
}

export async function updateItemPrice(itemId: string, formData: FormData) {
  await requireManager();
  const sellPrice = Number(formData.get("sellPrice"));
  if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
    throw new Error("Enter a valid sell price.");
  }
  await prisma.item.update({ where: { id: itemId }, data: { sellPrice } });
  revalidatePath("/catalog");
}
