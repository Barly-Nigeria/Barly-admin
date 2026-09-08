import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { naira } from "@/lib/money";
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
        description="Curated collections. Assign products from the product editor — there is no quantity on the join."
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
          description="Create a pick, then assign products from Catalog."
          action={
            <Button asChild>
              <Link href="/picks/new">New pick</Link>
            </Button>
          }
        />
      ) : picks.length > 0 ? (
        <TableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {picks.map((pick) => (
                <TableRow key={pick.id}>
                  <TableCell>
                    <Link href={`/picks/${pick.id}`} className="font-medium hover:underline">
                      {pick.name}
                    </Link>
                    {pick.sub_text ? <p className="text-xs text-muted-foreground">{pick.sub_text}</p> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(pick.tags ?? []).join(", ") || "—"}
                  </TableCell>
                  <TableCell>{pick.starting_price != null ? naira(pick.starting_price) : "—"}</TableCell>
                  <TableCell>
                    <StatusBadge value={pick.is_active ? "active" : "inactive"} />
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
