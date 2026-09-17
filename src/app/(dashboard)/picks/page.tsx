import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import { PicksBulkTable } from "@/components/picks-bulk-table";
import type { CatalogPick } from "@/lib/barly-api";

export default async function PicksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const res = await adminAuthed<CatalogPick[]>("/v1/admin/picks");
  const picks = res.body?.data ?? [];
  const loadError = error || (!res.ok ? res.message : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Picks"
        description="Curated collections guests can browse."
        actions={
          <Button asChild>
            <Link href="/picks/new">New pick</Link>
          </Button>
        }
      />
      <FormError message={loadError} />

      {picks.length === 0 && res.ok ? (
        <EmptyState
          title="No picks"
          description="Create a pick, then add products on its page."
          action={
            <Button asChild>
              <Link href="/picks/new">New pick</Link>
            </Button>
          }
        />
      ) : picks.length > 0 ? (
        <PicksBulkTable initial={picks} />
      ) : null}
    </div>
  );
}
