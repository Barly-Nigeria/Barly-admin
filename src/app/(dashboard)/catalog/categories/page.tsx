import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogSubnav, FormError, PageHeader } from "@/components/catalog-chrome";
import { CategoriesInfiniteTable } from "@/components/catalog-infinite-table";
import { CATALOG_LIST_PAGE_SIZE, type CatalogCategoryList } from "@/lib/barly-api";

export default async function CategoriesPage({
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

  const res = await adminAuthed<CatalogCategoryList>(`/v1/admin/categories?${params.toString()}`);
  const page = res.body?.data ?? { items: [], page: 1, limit: CATALOG_LIST_PAGE_SIZE, total: 0 };
  const loadError = sp.error || (!res.ok ? res.message : null);

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

      <form method="get" action="/catalog/categories" className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Search categories" className="max-w-sm" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {page.total === 0 && res.ok ? (
        <EmptyState
          title={q ? "No matches" : "No categories"}
          description={
            q
              ? `Nothing matched “${q}”. Try a different name.`
              : "Add beers, mixers, souvenirs, and the rest."
          }
          action={
            q ? undefined : (
              <Button asChild>
                <Link href="/catalog/categories/new">New category</Link>
              </Button>
            )
          }
        />
      ) : page.items.length > 0 ? (
        <CategoriesInfiniteTable initial={page} q={q} />
      ) : null}
    </div>
  );
}
