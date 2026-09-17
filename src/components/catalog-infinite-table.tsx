"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  BulkSelectBar,
  HeaderCheckbox,
  RowCheckbox,
  useBulkSelection,
} from "@/components/bulk-select";
import { nairaFromKobo } from "@/lib/money";
import {
  bulkArchiveAddOnsAction,
  bulkArchiveCategoriesAction,
  bulkArchiveProductsAction,
  loadAddOnsPage,
  loadCategoriesPage,
  loadProductsPage,
} from "@/app/actions/catalog";
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
  onDeactivate,
  label,
}: {
  initial: CatalogListPage<T>;
  loadPage: (page: number) => Promise<CatalogListPage<T>>;
  header: (selection: ReturnType<typeof useBulkSelection>) => ReactNode;
  renderRow: (item: T, selection: ReturnType<typeof useBulkSelection>) => ReactNode;
  colSpan: number;
  onDeactivate: (ids: string[]) => Promise<{ ok: boolean; message?: string }>;
  label: string;
}) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loading = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = items.length < initial.total;
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const selection = useBulkSelection(ids);

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
      <BulkSelectBar
        selectedIds={selection.selectedIds}
        label={label}
        onDeactivate={onDeactivate}
        onDone={(ids) => {
          const deactivated = new Set(ids);
          selection.clear();
          setItems((prev) =>
            prev.map((item) =>
              deactivated.has(item.id) ? ({ ...item, is_active: false } as T) : item,
            ),
          );
        }}
      />
      <TableShell>
        <Table>
          <TableHeader>{header(selection)}</TableHeader>
          <TableBody>
            {items.map((item) => renderRow(item, selection))}
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

type Selection = ReturnType<typeof useBulkSelection>;

export function ProductsInfiniteTable({
  initial,
  q = "",
}: {
  initial: CatalogProductList;
  q?: string;
}) {
  return (
    <InfiniteTable
      key={q}
      initial={initial}
      loadPage={(page) => loadProductsPage(page, q)}
      colSpan={5}
      label="products"
      onDeactivate={bulkArchiveProductsAction}
      header={(selection: Selection) => (
        <TableRow>
          <TableHead className="w-10">
            <HeaderCheckbox
              allSelected={selection.allSelected}
              someSelected={selection.someSelected}
              onToggleAll={selection.toggleAllLoaded}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>From</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      )}
      renderRow={(product: CatalogProduct, selection: Selection) => (
        <TableRow key={product.id}>
          <TableCell>
            <RowCheckbox
              checked={selection.selected.has(product.id)}
              onCheckedChange={(checked) => selection.toggleOne(product.id, checked)}
              ariaLabel={`Select ${product.name}`}
            />
          </TableCell>
          <TableCell>
            <Link href={`/catalog/${product.id}`} className="font-medium hover:underline">
              {product.name}
            </Link>
            <p className="text-xs text-muted-foreground">{product.slug}</p>
          </TableCell>
          <TableCell>{product.category?.name ?? "—"}</TableCell>
          <TableCell>
            {product.starting_price != null ? nairaFromKobo(product.starting_price) : "—"}
          </TableCell>
          <TableCell>
            <StatusBadge value={product.is_active ? "active" : "inactive"} />
          </TableCell>
        </TableRow>
      )}
    />
  );
}

export function CategoriesInfiniteTable({
  initial,
  q = "",
}: {
  initial: CatalogCategoryList;
  q?: string;
}) {
  return (
    <InfiniteTable
      key={q}
      initial={initial}
      loadPage={(page) => loadCategoriesPage(page, q)}
      colSpan={4}
      label="categories"
      onDeactivate={bulkArchiveCategoriesAction}
      header={(selection: Selection) => (
        <TableRow>
          <TableHead className="w-10">
            <HeaderCheckbox
              allSelected={selection.allSelected}
              someSelected={selection.someSelected}
              onToggleAll={selection.toggleAllLoaded}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      )}
      renderRow={(category: CatalogCategory, selection: Selection) => (
        <TableRow key={category.id}>
          <TableCell>
            <RowCheckbox
              checked={selection.selected.has(category.id)}
              onCheckedChange={(checked) => selection.toggleOne(category.id, checked)}
              ariaLabel={`Select ${category.name}`}
            />
          </TableCell>
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

export function AddOnsInfiniteTable({
  initial,
  q = "",
}: {
  initial: CatalogAddOnList;
  q?: string;
}) {
  return (
    <InfiniteTable
      key={q}
      initial={initial}
      loadPage={(page) => loadAddOnsPage(page, q)}
      colSpan={5}
      label="add-ons"
      onDeactivate={bulkArchiveAddOnsAction}
      header={(selection: Selection) => (
        <TableRow>
          <TableHead className="w-10">
            <HeaderCheckbox
              allSelected={selection.allSelected}
              someSelected={selection.someSelected}
              onToggleAll={selection.toggleAllLoaded}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      )}
      renderRow={(addOn: CatalogAddOn, selection: Selection) => (
        <TableRow key={addOn.id}>
          <TableCell>
            <RowCheckbox
              checked={selection.selected.has(addOn.id)}
              onCheckedChange={(checked) => selection.toggleOne(addOn.id, checked)}
              ariaLabel={`Select ${addOn.name}`}
            />
          </TableCell>
          <TableCell>
            <Link href={`/catalog/add-ons/${addOn.id}`} className="font-medium hover:underline">
              {addOn.name}
            </Link>
            <p className="text-xs text-muted-foreground">{addOn.slug}</p>
          </TableCell>
          <TableCell>{nairaFromKobo(addOn.price)}</TableCell>
          <TableCell>{addOn.stock_quantity}</TableCell>
          <TableCell>
            <StatusBadge value={addOn.is_active ? "active" : "inactive"} />
          </TableCell>
        </TableRow>
      )}
    />
  );
}
