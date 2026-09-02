"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCatalogPicks } from "@/lib/catalog-picks";
import { asImageFile, removeItemImageFile, saveItemImage } from "@/lib/item-image";

async function requireManager() {
  const session = await requireSession();
  if (session.role !== "admin") {
    throw new Error("Only admins can change the catalog.");
  }
  return session;
}

async function assertIds(kind: "item" | "product", ids: string[]) {
  if (ids.length === 0) return;
  const count =
    kind === "item"
      ? await prisma.item.count({ where: { id: { in: ids } } })
      : await prisma.product.count({ where: { id: { in: ids } } });
  if (count !== ids.length) {
    throw new Error(kind === "item" ? "One of those items is missing." : "One of those packages is missing.");
  }
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
  const picks = parseCatalogPicks(formData, "itemId", "itemQty");
  await assertIds("item", picks.map((p) => p.id));
  await prisma.product.create({
    data: {
      name,
      occasion,
      price,
      description,
      status,
      items: {
        create: picks.map((pick) => ({ itemId: pick.id, quantity: pick.quantity })),
      },
    },
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

export async function setProductPicks(productId: string, formData: FormData) {
  await requireManager();
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw new Error("Package not found.");
  const picks = parseCatalogPicks(formData, "itemId", "itemQty");
  await assertIds("item", picks.map((p) => p.id));
  await prisma.$transaction([
    prisma.productItem.deleteMany({ where: { productId } }),
    prisma.productItem.createMany({
      data: picks.map((pick) => ({ productId, itemId: pick.id, quantity: pick.quantity })),
    }),
  ]);
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
  const picks = parseCatalogPicks(formData, "packageId", "packageQty");
  await assertIds("product", picks.map((p) => p.id));

  const image = asImageFile(formData.get("image"));
  let imageUrl = "";
  if (image) imageUrl = await saveItemImage(image);

  try {
    await prisma.item.create({
      data: {
        name,
        sku,
        cost: Number.isFinite(cost) ? cost : 0,
        sellPrice,
        stock: Number.isFinite(stock) ? stock : 0,
        vendorId,
        imageUrl,
        products: {
          create: picks.map((pick) => ({ productId: pick.id, quantity: pick.quantity })),
        },
      },
    });
  } catch (error) {
    if (imageUrl) await removeItemImageFile(imageUrl);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("That SKU is already in the catalog.");
    }
    throw error;
  }
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

export async function setItemPicks(itemId: string, formData: FormData) {
  await requireManager();
  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) throw new Error("Item not found.");
  const picks = parseCatalogPicks(formData, "packageId", "packageQty");
  await assertIds("product", picks.map((p) => p.id));
  await prisma.$transaction([
    prisma.productItem.deleteMany({ where: { itemId } }),
    prisma.productItem.createMany({
      data: picks.map((pick) => ({ itemId, productId: pick.id, quantity: pick.quantity })),
    }),
  ]);
  revalidatePath("/catalog");
}

export async function updateItemImage(itemId: string, formData: FormData) {
  await requireManager();
  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true, imageUrl: true } });
  if (!item) throw new Error("Item not found.");
  const image = asImageFile(formData.get("image"));
  if (!image) throw new Error("Choose a photo to upload.");
  const imageUrl = await saveItemImage(image);
  await prisma.item.update({ where: { id: itemId }, data: { imageUrl } });
  if (item.imageUrl) await removeItemImageFile(item.imageUrl);
  revalidatePath("/catalog");
}
