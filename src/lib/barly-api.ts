export const BARLY_API_BASE_URL =
  process.env.BARLY_API_BASE_URL ?? "http://localhost:4000";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type AdminProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type AdminInvite = {
  id: string;
  email: string;
  role: "admin" | "staff";
  expires_at: string;
  created_at: string;
};

export type TeamPayload = {
  members: AdminProfile[];
  invites: AdminInvite[];
};

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  base_image_url?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  starting_price?: number | null;
  currency: string;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogVariant = {
  id: string;
  sku: string;
  attribute_name: string;
  attribute_value: string;
  price: number;
  currency: string;
  stock_quantity: number;
  sort_order: number;
  weight_kg: number;
  is_active: boolean;
};

export type CatalogAddOn = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  is_active: boolean;
  product_id?: string | null;
  variant_id?: string | null;
};

export type CatalogProductDetail = CatalogProduct & {
  variants: CatalogVariant[];
  add_ons: CatalogAddOn[];
  pick_ids: string[];
  occasion_ids: string[];
  add_on_ids: string[];
};

export const CATALOG_LIST_PAGE_SIZE = 30;

export type CatalogListPage<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type CatalogProductList = CatalogListPage<CatalogProduct>;
export type CatalogCategoryList = CatalogListPage<CatalogCategory>;
export type CatalogAddOnList = CatalogListPage<CatalogAddOn>;

export type CatalogPick = {
  id: string;
  name: string;
  sub_text?: string | null;
  image_url?: string | null;
  starting_price?: number | null;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type CatalogOccasion = {
  id: string;
  name: string;
  icon?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function adminApi<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string;
  } = {},
): Promise<{ status: number; ok: boolean; body: ApiEnvelope<T> | null; message: string }> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(`${BARLY_API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  return {
    status: res.status,
    ok: res.ok,
    body,
    message: body?.message ?? "Request failed",
  };
}
