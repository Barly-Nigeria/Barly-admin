"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminAuthed, requireSession } from "@/lib/auth";
import {
  CATALOG_LIST_PAGE_SIZE,
  type CatalogAddOn,
  type CatalogAddOnList,
  type CatalogCategory,
  type CatalogCategoryList,
  type CatalogOccasion,
  type CatalogPick,
  type CatalogProductDetail,
  type CatalogProductList,
  type CatalogVariant,
} from "@/lib/barly-api";

function opt(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? undefined : value;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function intOrUndef(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
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

async function loadListPage<T>(path: string): Promise<T> {
  await requireSession();
  const res = await adminAuthed<T>(path);
  if (!res.ok || !res.body?.data) {
    throw new Error(res.message || "Failed to load catalog");
  }
  return res.body.data;
}

export async function loadProductsPage(page: number) {
  return loadListPage<CatalogProductList>(`/v1/admin/products?page=${page}&limit=${CATALOG_LIST_PAGE_SIZE}`);
}

export async function loadCategoriesPage(page: number) {
  return loadListPage<CatalogCategoryList>(`/v1/admin/categories?page=${page}&limit=${CATALOG_LIST_PAGE_SIZE}`);
}

export async function loadAddOnsPage(page: number) {
  return loadListPage<CatalogAddOnList>(`/v1/admin/add-ons?page=${page}&limit=${CATALOG_LIST_PAGE_SIZE}`);
}

export type CatalogImagePresign = {
  upload_url: string;
  public_url: string;
  required_headers: Record<string, string>;
};

export async function presignCatalogImage(contentType: string): Promise<
  { ok: true; data: CatalogImagePresign } | { ok: false; message: string }
> {
  await requireSession();
  const res = await adminAuthed<CatalogImagePresign>("/v1/admin/media/presign", {
    method: "POST",
    body: { content_type: contentType },
  });
  if (!res.ok || !res.body?.data?.upload_url || !res.body.data.public_url) {
    return { ok: false, message: res.message || "Could not start image upload" };
  }
  return {
    ok: true,
    data: {
      upload_url: res.body.data.upload_url,
      public_url: res.body.data.public_url,
      required_headers: res.body.data.required_headers ?? {},
    },
  };
}

export async function createCategoryAction(formData: FormData) {
  const data = await mutate<CatalogCategory>(
    "/v1/admin/categories",
    "POST",
    {
      name: opt(formData, "name"),
      slug: opt(formData, "slug"),
      description: opt(formData, "description"),
      image_url: opt(formData, "image_url"),
      is_active: bool(formData, "is_active"),
    },
    "/catalog/categories/new",
  );
  revalidatePath("/catalog");
  revalidatePath("/catalog/categories");
  redirect(`/catalog/categories/${data?.id ?? ""}`);
}

export async function updateCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(
    `/v1/admin/categories/${id}`,
    "PATCH",
    {
      name: opt(formData, "name"),
      slug: opt(formData, "slug"),
      description: opt(formData, "description"),
      image_url: opt(formData, "image_url"),
      is_active: bool(formData, "is_active"),
    },
    `/catalog/categories/${id}/edit`,
  );
  revalidatePath("/catalog");
  revalidatePath("/catalog/categories");
  revalidatePath(`/catalog/categories/${id}`);
  redirect(`/catalog/categories/${id}`);
}

export async function archiveCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/categories/${id}`, "PATCH", { is_active: false }, `/catalog/categories/${id}`);
  revalidatePath("/catalog");
  revalidatePath("/catalog/categories");
  revalidatePath(`/catalog/categories/${id}`);
  redirect(`/catalog/categories/${id}`);
}

export async function deleteCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/categories/${id}`, "DELETE", undefined, `/catalog/categories/${id}`);
  revalidatePath("/catalog");
  revalidatePath("/catalog/categories");
  redirect("/catalog/categories");
}

export async function createProductAction(formData: FormData) {
  const data = await mutate<CatalogProductDetail>(
    "/v1/admin/products",
    "POST",
    {
      name: opt(formData, "name"),
      slug: opt(formData, "slug"),
      category_id: opt(formData, "category_id"),
      description: opt(formData, "description"),
      base_image_url: opt(formData, "base_image_url"),
      is_active: bool(formData, "is_active"),
      is_popular: bool(formData, "is_popular"),
      currency: "NGN",
    },
    "/catalog/new",
  );
  revalidatePath("/catalog");
  redirect(`/catalog/${data?.id ?? ""}`);
}

export async function updateProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(
    `/v1/admin/products/${id}`,
    "PATCH",
    {
      name: opt(formData, "name"),
      slug: opt(formData, "slug"),
      category_id: opt(formData, "category_id"),
      description: opt(formData, "description"),
      base_image_url: opt(formData, "base_image_url"),
      is_active: bool(formData, "is_active"),
      is_popular: bool(formData, "is_popular"),
      currency: "NGN",
    },
    `/catalog/${id}/edit`,
  );
  revalidatePath("/catalog");
  revalidatePath(`/catalog/${id}`);
  redirect(`/catalog/${id}`);
}

export async function archiveProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/products/${id}`, "PATCH", { is_active: false }, `/catalog/${id}`);
  revalidatePath("/catalog");
  revalidatePath(`/catalog/${id}`);
  redirect(`/catalog/${id}`);
}

export async function deleteProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/products/${id}`, "DELETE", undefined, `/catalog/${id}`);
  revalidatePath("/catalog");
  redirect("/catalog");
}

export async function createVariantAction(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  await mutate<CatalogVariant>(
    `/v1/admin/products/${productId}/variants`,
    "POST",
    {
      sku: opt(formData, "sku"),
      attribute_name: opt(formData, "attribute_name"),
      attribute_value: opt(formData, "attribute_value"),
      price: intOrUndef(formData, "price"),
      stock_quantity: intOrUndef(formData, "stock_quantity"),
      weight_kg: intOrUndef(formData, "weight_kg"),
      is_active: bool(formData, "is_active"),
      currency: "NGN",
    },
    `/catalog/${productId}/edit`,
  );
  revalidatePath(`/catalog/${productId}`);
  revalidatePath(`/catalog/${productId}/edit`);
  redirect(`/catalog/${productId}/edit`);
}

export async function updateVariantAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  await mutate(
    `/v1/admin/variants/${id}`,
    "PATCH",
    {
      sku: opt(formData, "sku"),
      attribute_name: opt(formData, "attribute_name"),
      attribute_value: opt(formData, "attribute_value"),
      price: intOrUndef(formData, "price"),
      stock_quantity: intOrUndef(formData, "stock_quantity"),
      weight_kg: intOrUndef(formData, "weight_kg"),
      is_active: bool(formData, "is_active"),
    },
    `/catalog/${productId}/edit`,
  );
  revalidatePath(`/catalog/${productId}`);
  revalidatePath(`/catalog/${productId}/edit`);
  redirect(`/catalog/${productId}/edit`);
}

export async function deleteVariantAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  await mutate(`/v1/admin/variants/${id}`, "DELETE", undefined, `/catalog/${productId}/edit`);
  revalidatePath(`/catalog/${productId}`);
  revalidatePath(`/catalog/${productId}/edit`);
  redirect(`/catalog/${productId}/edit`);
}

export async function assignProductJoinsAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const pickIds = formData.getAll("pick_ids").map(String);
  const occasionIds = formData.getAll("occasion_ids").map(String);
  const addOnIds = formData.getAll("add_on_ids").map(String);
  await mutate(`/v1/admin/products/${id}/picks`, "PUT", { pick_ids: pickIds }, `/catalog/${id}/edit`);
  await mutate(`/v1/admin/products/${id}/occasions`, "PUT", { occasion_ids: occasionIds }, `/catalog/${id}/edit`);
  await mutate(`/v1/admin/products/${id}/add-ons`, "PUT", { add_on_ids: addOnIds }, `/catalog/${id}/edit`);
  revalidatePath(`/catalog/${id}`);
  revalidatePath(`/catalog/${id}/edit`);
  redirect(`/catalog/${id}`);
}

export async function createAddOnAction(formData: FormData) {
  const data = await mutate<CatalogAddOn>(
    "/v1/admin/add-ons",
    "POST",
    {
      name: opt(formData, "name"),
      slug: opt(formData, "slug"),
      description: opt(formData, "description"),
      image_url: opt(formData, "image_url"),
      price: intOrUndef(formData, "price"),
      stock_quantity: intOrUndef(formData, "stock_quantity"),
      is_active: bool(formData, "is_active"),
      currency: "NGN",
    },
    "/catalog/add-ons/new",
  );
  revalidatePath("/catalog");
  revalidatePath("/catalog/add-ons");
  redirect(`/catalog/add-ons/${data?.id ?? ""}`);
}

export async function updateAddOnAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(
    `/v1/admin/add-ons/${id}`,
    "PATCH",
    {
      name: opt(formData, "name"),
      slug: opt(formData, "slug"),
      description: opt(formData, "description"),
      image_url: opt(formData, "image_url"),
      price: intOrUndef(formData, "price"),
      stock_quantity: intOrUndef(formData, "stock_quantity"),
      is_active: bool(formData, "is_active"),
    },
    `/catalog/add-ons/${id}/edit`,
  );
  revalidatePath("/catalog");
  revalidatePath("/catalog/add-ons");
  revalidatePath(`/catalog/add-ons/${id}`);
  redirect(`/catalog/add-ons/${id}`);
}

export async function archiveAddOnAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/add-ons/${id}`, "PATCH", { is_active: false }, `/catalog/add-ons/${id}`);
  revalidatePath("/catalog");
  revalidatePath("/catalog/add-ons");
  revalidatePath(`/catalog/add-ons/${id}`);
  redirect(`/catalog/add-ons/${id}`);
}

export async function deleteAddOnAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/add-ons/${id}`, "DELETE", undefined, `/catalog/add-ons/${id}`);
  revalidatePath("/catalog");
  revalidatePath("/catalog/add-ons");
  redirect("/catalog/add-ons");
}

export async function createPickAction(formData: FormData) {
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const data = await mutate<CatalogPick>(
    "/v1/admin/picks",
    "POST",
    {
      name: opt(formData, "name"),
      sub_text: opt(formData, "sub_text"),
      image_url: opt(formData, "image_url"),
      starting_price: intOrUndef(formData, "starting_price"),
      tags,
      is_active: bool(formData, "is_active"),
    },
    "/picks/new",
  );
  revalidatePath("/picks");
  revalidatePath("/catalog");
  redirect(`/picks/${data?.id ?? ""}`);
}

export async function updatePickAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  await mutate(
    `/v1/admin/picks/${id}`,
    "PATCH",
    {
      name: opt(formData, "name"),
      sub_text: opt(formData, "sub_text"),
      image_url: opt(formData, "image_url"),
      starting_price: intOrUndef(formData, "starting_price"),
      tags,
      is_active: bool(formData, "is_active"),
    },
    `/picks/${id}/edit`,
  );
  revalidatePath("/picks");
  revalidatePath(`/picks/${id}`);
  redirect(`/picks/${id}`);
}

export async function archivePickAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/picks/${id}`, "PATCH", { is_active: false }, `/picks/${id}`);
  revalidatePath("/picks");
  revalidatePath(`/picks/${id}`);
  redirect(`/picks/${id}`);
}

export async function deletePickAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/picks/${id}`, "DELETE", undefined, `/picks/${id}`);
  revalidatePath("/picks");
  redirect("/picks");
}

export async function createOccasionAction(formData: FormData) {
  const data = await mutate<CatalogOccasion>(
    "/v1/admin/occasions",
    "POST",
    {
      name: opt(formData, "name"),
      icon: opt(formData, "icon"),
      is_active: bool(formData, "is_active"),
    },
    "/occasions/new",
  );
  revalidatePath("/occasions");
  revalidatePath("/catalog");
  redirect(`/occasions/${data?.id ?? ""}`);
}

export async function updateOccasionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(
    `/v1/admin/occasions/${id}`,
    "PATCH",
    {
      name: opt(formData, "name"),
      icon: opt(formData, "icon"),
      is_active: bool(formData, "is_active"),
    },
    `/occasions/${id}/edit`,
  );
  revalidatePath("/occasions");
  revalidatePath(`/occasions/${id}`);
  redirect(`/occasions/${id}`);
}

export async function archiveOccasionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/occasions/${id}`, "PATCH", { is_active: false }, `/occasions/${id}`);
  revalidatePath("/occasions");
  revalidatePath(`/occasions/${id}`);
  redirect(`/occasions/${id}`);
}

export async function deleteOccasionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await mutate(`/v1/admin/occasions/${id}`, "DELETE", undefined, `/occasions/${id}`);
  revalidatePath("/occasions");
  redirect("/occasions");
}
