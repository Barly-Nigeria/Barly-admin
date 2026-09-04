import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { CatalogSubnav, FormError, PageHeader } from "@/components/catalog-chrome";
import { ProductsInfiniteTable } from "@/components/catalog-infinite-table";
import { CATALOG_LIST_PAGE_SIZE, type CatalogProductList } from "@/lib/barly-api";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const productsRes = await adminAuthed<CatalogProductList>(
    `/v1/admin/products?page=1&limit=${CATALOG_LIST_PAGE_SIZE}`,
  );
  const page = productsRes.body?.data ?? { items: [], page: 1, limit: CATALOG_LIST_PAGE_SIZE, total: 0 };
  const loadError = error || (!productsRes.ok ? productsRes.message : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog"
        description="Products, categories, and add-ons. Archive hides a row from the guest store."
        actions={
          <Button asChild>
            <Link href="/catalog/new">New product</Link>
          </Button>
        }
      />
      <CatalogSubnav active="products" />
      <FormError message={loadError} />

      {page.total === 0 && productsRes.ok ? (
        <EmptyState
          title="No products"
          description="Create a product, then add SKUs (variants) and assignments."
          action={
            <Button asChild>
              <Link href="/catalog/new">New product</Link>
            </Button>
          }
        />
      ) : page.items.length > 0 ? (
        <ProductsInfiniteTable initial={page} />
      ) : null}
    </div>
  );
}
