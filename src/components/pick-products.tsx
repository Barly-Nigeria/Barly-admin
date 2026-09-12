"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { replaceOccasionProductsAction, replacePickProductsAction, searchCatalogProducts } from "@/app/actions/catalog";
import { naira } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogImage } from "@/components/catalog-chrome";
import { StatusBadge } from "@/components/status-badge";
import type { CatalogPickProduct, CatalogProduct } from "@/lib/barly-api";

export function PickProductsCard({
  pickId,
  initialProducts,
}: {
  pickId: string;
  initialProducts: CatalogPickProduct[];
}) {
  return (
    <AssignedProductsCard
      initialProducts={initialProducts}
      emptyText="No products in this pick yet."
      persist={(ids) => replacePickProductsAction(pickId, ids)}
    />
  );
}

export function OccasionProductsCard({
  occasionId,
  initialProducts,
}: {
  occasionId: string;
  initialProducts: CatalogPickProduct[];
}) {
  return (
    <AssignedProductsCard
      initialProducts={initialProducts}
      emptyText="No products in this occasion yet."
      persist={(ids) => replaceOccasionProductsAction(occasionId, ids)}
    />
  );
}

function AssignedProductsCard({
  initialProducts,
  emptyText,
  persist: persistRemote,
}: {
  initialProducts: CatalogPickProduct[];
  emptyText: string;
  persist: (ids: string[]) => Promise<{ ok: true; items: CatalogPickProduct[] } | { ok: false; message: string }>;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const assigned = useMemo(() => new Set(products.map((p) => p.id)), [products]);

  function persist(next: CatalogPickProduct[], ids: string[]) {
    const previous = products;
    setProducts(next);
    startTransition(async () => {
      const res = await persistRemote(ids);
      if (!res.ok) {
        setError(res.message);
        setProducts(previous);
        return;
      }
      setError(null);
      setProducts(res.items);
    });
  }

  function addProduct(product: CatalogProduct) {
    if (assigned.has(product.id)) return;
    const next = [
      ...products,
      { ...product, sort_order: products.length },
    ];
    persist(next, next.map((p) => p.id));
    setHits((current) => current.filter((item) => item.id !== product.id));
  }

  function removeProduct(id: string) {
    const next = products.filter((p) => p.id !== id).map((p, i) => ({ ...p, sort_order: i }));
    persist(next, next.map((p) => p.id));
  }

  function move(id: string, delta: number) {
    const index = products.findIndex((p) => p.id === id);
    const nextIndex = index + delta;
    if (index < 0 || nextIndex < 0 || nextIndex >= products.length) return;
    const next = [...products];
    const [row] = next.splice(index, 1);
    next.splice(nextIndex, 0, row);
    persist(
      next.map((p, i) => ({ ...p, sort_order: i })),
      next.map((p) => p.id),
    );
  }

  function onSearch(formData: FormData) {
    const q = String(formData.get("q") ?? "");
    setQuery(q);
    startTransition(async () => {
      const res = await searchCatalogProducts(q);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setError(null);
      setHits(res.items.filter((item) => !assigned.has(item.id)));
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <form action={onSearch} className="flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search products to add"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          Search
        </Button>
      </form>

      {hits.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {hits.map((hit) => (
            <li key={hit.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{hit.name}</p>
                <p className="text-xs text-muted-foreground">
                  {hit.starting_price != null ? naira(hit.starting_price) : "No price"}
                </p>
              </div>
              <Button type="button" size="sm" disabled={pending} onClick={() => addProduct(hit)}>
                Add
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {products.map((product, index) => (
            <li key={product.id} className="flex items-center gap-3 px-3 py-2">
              {product.base_image_url ? (
                <CatalogImage src={product.base_image_url} alt="" className="size-10" />
              ) : (
                <div className="size-10 shrink-0 rounded-lg border border-dashed" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/catalog/${product.id}`} className="truncate text-sm font-medium hover:underline">
                  {product.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge value={product.is_active ? "active" : "inactive"} />
                  <span className="text-xs text-muted-foreground">
                    {product.starting_price != null ? naira(product.starting_price) : "—"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={pending || index === 0}
                  onClick={() => move(product.id, -1)}
                  aria-label="Move up"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={pending || index === products.length - 1}
                  onClick={() => move(product.id, 1)}
                  aria-label="Move down"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => removeProduct(product.id)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
