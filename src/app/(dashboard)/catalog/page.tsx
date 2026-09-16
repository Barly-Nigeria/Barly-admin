import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogSubnav, FormError, PageHeader } from "@/components/catalog-chrome";
import { ProductsInfiniteTable } from "@/components/catalog-infinite-table";
import { CATALOG_LIST_PAGE_SIZE, type CatalogProductList } from "@/lib/barly-api";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const params = new URLSearchParams({
    page: "1",
    limit: String(CATALOG_LIST_PAGE_SIZE),
  });
  if (q) params.set("q", q);

  const productsRes = await adminAuthed<CatalogProductList>(`/v1/admin/products?${params.toString()}`);
  const page = productsRes.body?.data ?? { items: [], page: 1, limit: CATALOG_LIST_PAGE_SIZE, total: 0 };
  const loadError = sp.error || (!productsRes.ok ? productsRes.message : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog"
        description="Products, categories, and add-ons. Archive hides a row from the guest store."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/catalog/import">Import CSV</Link>
            </Button>
            <Button asChild>
              <Link href="/catalog/new">New product</Link>
            </Button>
          </>
        }
      />
      <CatalogSubnav active="products" />
      <FormError message={loadError} />

      <form method="get" action="/catalog" className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Search products" className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {page.total === 0 && productsRes.ok ? (
        <EmptyState
          title={q ? "No matches" : "No products"}
          description={
            q
              ? `Nothing matched “${q}”. Try a different name.`
              : "Create a product, then add SKUs (variants) and assignments."
          }
          action={
            q ? undefined : (
              <Button asChild>
                <Link href="/catalog/new">New product</Link>
              </Button>
            )
          }
        />
      ) : page.items.length > 0 ? (
        <ProductsInfiniteTable initial={page} q={q} />
      ) : null}
    </div>
  );
}
