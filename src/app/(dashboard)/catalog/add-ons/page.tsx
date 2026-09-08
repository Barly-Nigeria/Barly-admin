import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { CatalogSubnav, FormError, PageHeader } from "@/components/catalog-chrome";
import { AddOnsInfiniteTable } from "@/components/catalog-infinite-table";
import { CATALOG_LIST_PAGE_SIZE, type CatalogAddOnList } from "@/lib/barly-api";

export default async function AddOnsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const res = await adminAuthed<CatalogAddOnList>(`/v1/admin/add-ons?page=1&limit=${CATALOG_LIST_PAGE_SIZE}`);
  const page = res.body?.data ?? { items: [], page: 1, limit: CATALOG_LIST_PAGE_SIZE, total: 0 };
  const loadError = error || (!res.ok ? res.message : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog"
        description="Products, categories, and add-ons. Archive hides a row from the guest store."
        actions={
          <Button asChild>
            <Link href="/catalog/add-ons/new">New add-on</Link>
          </Button>
        }
      />
      <CatalogSubnav active="add-ons" />
      <FormError message={loadError} />

      {page.total === 0 && res.ok ? (
        <EmptyState
          title="No add-ons"
          description="Create extras, then assign them from a product."
          action={
            <Button asChild>
              <Link href="/catalog/add-ons/new">New add-on</Link>
            </Button>
          }
        />
      ) : page.items.length > 0 ? (
        <AddOnsInfiniteTable initial={page} />
      ) : null}
    </div>
  );
}
