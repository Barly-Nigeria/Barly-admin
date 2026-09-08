import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { CatalogSubnav, FormError, PageHeader } from "@/components/catalog-chrome";
import { CategoriesInfiniteTable } from "@/components/catalog-infinite-table";
import { CATALOG_LIST_PAGE_SIZE, type CatalogCategoryList } from "@/lib/barly-api";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const res = await adminAuthed<CatalogCategoryList>(
    `/v1/admin/categories?page=1&limit=${CATALOG_LIST_PAGE_SIZE}`,
  );
  const page = res.body?.data ?? { items: [], page: 1, limit: CATALOG_LIST_PAGE_SIZE, total: 0 };
  const loadError = error || (!res.ok ? res.message : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog"
        description="Products, categories, and add-ons. Archive hides a row from the guest store."
        actions={
          <Button asChild>
            <Link href="/catalog/categories/new">New category</Link>
          </Button>
        }
      />
      <CatalogSubnav active="categories" />
      <FormError message={loadError} />

      {page.total === 0 && res.ok ? (
        <EmptyState
          title="No categories"
          description="Add beers, mixers, souvenirs, and the rest."
          action={
            <Button asChild>
              <Link href="/catalog/categories/new">New category</Link>
            </Button>
          }
        />
      ) : page.items.length > 0 ? (
        <CategoriesInfiniteTable initial={page} />
      ) : null}
    </div>
  );
}
