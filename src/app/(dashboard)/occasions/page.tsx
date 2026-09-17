import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import { OccasionsBulkTable } from "@/components/occasions-bulk-table";
import type { CatalogOccasion } from "@/lib/barly-api";

export default async function OccasionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const res = await adminAuthed<CatalogOccasion[]>("/v1/admin/occasions");
  const occasions = res.body?.data ?? [];
  const loadError = error || (!res.ok ? res.message : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Occasions"
        description="Birthday, thank-you, and other moments guests can shop for."
        actions={
          <Button asChild>
            <Link href="/occasions/new">New occasion</Link>
          </Button>
        }
      />
      <FormError message={loadError} />

      {occasions.length === 0 && res.ok ? (
        <EmptyState
          title="No occasions"
          description="Create an occasion, then add products on its page."
          action={
            <Button asChild>
              <Link href="/occasions/new">New occasion</Link>
            </Button>
          }
        />
      ) : occasions.length > 0 ? (
        <OccasionsBulkTable initial={occasions} />
      ) : null}
    </div>
  );
}
