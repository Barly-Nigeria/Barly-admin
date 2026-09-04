import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormError, PageHeader, TableShell } from "@/components/catalog-chrome";
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
        description="Birthday, thank-you, and other moments. Assign products from the product editor."
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
          description="Create an occasion, then assign products from Catalog."
          action={
            <Button asChild>
              <Link href="/occasions/new">New occasion</Link>
            </Button>
          }
        />
      ) : occasions.length > 0 ? (
        <TableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {occasions.map((occasion) => (
                <TableRow key={occasion.id}>
                  <TableCell>
                    <Link href={`/occasions/${occasion.id}`} className="font-medium hover:underline">
                      {occasion.name}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {occasion.icon || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={occasion.is_active ? "active" : "inactive"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      ) : null}
    </div>
  );
}
