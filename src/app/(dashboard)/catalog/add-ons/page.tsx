import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogSubnav, FormError, PageHeader } from "@/components/catalog-chrome";
import { AddOnsInfiniteTable } from "@/components/catalog-infinite-table";
import { CATALOG_LIST_PAGE_SIZE, type CatalogAddOnList } from "@/lib/barly-api";

export default async function AddOnsPage({
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

  const res = await adminAuthed<CatalogAddOnList>(`/v1/admin/add-ons?${params.toString()}`);
  const page = res.body?.data ?? { items: [], page: 1, limit: CATALOG_LIST_PAGE_SIZE, total: 0 };
  const loadError = sp.error || (!res.ok ? res.message : null);

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

      <form method="get" action="/catalog/add-ons" className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Search add-ons" className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {page.total === 0 && res.ok ? (
        <EmptyState
          title={q ? "No matches" : "No add-ons"}
          description={
            q
              ? `Nothing matched “${q}”. Try a different name.`
              : "Create extras, then assign them from a product."
          }
          action={
            q ? undefined : (
              <Button asChild>
                <Link href="/catalog/add-ons/new">New add-on</Link>
              </Button>
            )
          }
        />
      ) : page.items.length > 0 ? (
        <AddOnsInfiniteTable initial={page} q={q} />
      ) : null}
    </div>
  );
}
