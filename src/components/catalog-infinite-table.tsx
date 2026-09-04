"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableShell } from "@/components/catalog-chrome";
import { StatusBadge } from "@/components/status-badge";
import { naira } from "@/lib/money";
import { loadAddOnsPage, loadCategoriesPage, loadProductsPage } from "@/app/actions/catalog";
import type {
  CatalogAddOn,
  CatalogAddOnList,
  CatalogCategory,
  CatalogCategoryList,
  CatalogListPage,
  CatalogProduct,
  CatalogProductList,
} from "@/lib/barly-api";

function InfiniteTable<T extends { id: string }>({
  initial,
  loadPage,
  header,
  renderRow,
  colSpan,
}: {
  initial: CatalogListPage<T>;
  loadPage: (page: number) => Promise<CatalogListPage<T>>;
  header: ReactNode;
  renderRow: (item: T) => ReactNode;
  colSpan: number;
}) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loading = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = items.length < initial.total;

  const loadMore = useCallback(async () => {
    if (loading.current || !hasMore) return;
    loading.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await loadPage(page + 1);
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...next.items.filter((item) => !seen.has(item.id))];
      });
      setPage(next.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more.");
    } finally {
      loading.current = false;
      setBusy(false);
    }
  }, [hasMore, loadPage, page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadMore();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-2">
      <TableShell>
        <Table>
          <TableHeader>{header}</TableHeader>
          <TableBody>
            {items.map((item) => renderRow(item))}
            {busy ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableShell>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {hasMore ? <div ref={sentinelRef} className="h-8" aria-hidden /> : null}
    </div>
  );
}

export function ProductsInfiniteTable({ initial }: { initial: CatalogProductList }) {
  return (
    <InfiniteTable
      initial={initial}
      loadPage={loadProductsPage}
      colSpan={4}
      header={
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>From</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      }
      renderRow={(product: CatalogProduct) => (
        <TableRow key={product.id}>
          <TableCell>
            <Link href={`/catalog/${product.id}`} className="font-medium hover:underline">
              {product.name}
            </Link>
            <p className="text-xs text-muted-foreground">{product.slug}</p>
          </TableCell>
          <TableCell>{product.category?.name ?? "—"}</TableCell>
          <TableCell>{product.starting_price != null ? naira(product.starting_price) : "—"}</TableCell>
          <TableCell>
            <StatusBadge value={product.is_active ? "active" : "inactive"} />
          </TableCell>
        </TableRow>
      )}
    />
  );
}

export function CategoriesInfiniteTable({ initial }: { initial: CatalogCategoryList }) {
  return (
    <InfiniteTable
      initial={initial}
      loadPage={loadCategoriesPage}
      colSpan={3}
      header={
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      }
      renderRow={(category: CatalogCategory) => (
        <TableRow key={category.id}>
          <TableCell>
            <Link href={`/catalog/categories/${category.id}`} className="font-medium hover:underline">
              {category.name}
            </Link>
          </TableCell>
          <TableCell className="text-muted-foreground">{category.slug}</TableCell>
          <TableCell>
            <StatusBadge value={category.is_active ? "active" : "inactive"} />
          </TableCell>
        </TableRow>
      )}
    />
  );
}

export function AddOnsInfiniteTable({ initial }: { initial: CatalogAddOnList }) {
  return (
    <InfiniteTable
      initial={initial}
      loadPage={loadAddOnsPage}
      colSpan={4}
      header={
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      }
      renderRow={(addOn: CatalogAddOn) => (
        <TableRow key={addOn.id}>
          <TableCell>
            <Link href={`/catalog/add-ons/${addOn.id}`} className="font-medium hover:underline">
              {addOn.name}
            </Link>
            <p className="text-xs text-muted-foreground">{addOn.slug}</p>
          </TableCell>
          <TableCell>{naira(addOn.price)}</TableCell>
          <TableCell>{addOn.stock_quantity}</TableCell>
          <TableCell>
            <StatusBadge value={addOn.is_active ? "active" : "inactive"} />
          </TableCell>
        </TableRow>
      )}
    />
  );
}
