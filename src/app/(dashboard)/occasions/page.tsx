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
import { CatalogImage, FormError, PageHeader, TableShell } from "@/components/catalog-chrome";
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
        <TableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {occasions.map((occasion) => (
                <TableRow key={occasion.id}>
                  <TableCell>
                    {imageSrc(occasion.icon) ? (
                      <CatalogImage src={occasion.icon} alt="" className="size-10" />
                    ) : (
                      <div className="size-10 rounded-lg border border-dashed" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/occasions/${occasion.id}`} className="font-medium hover:underline">
                      {occasion.name}
                    </Link>
                    {occasion.description ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{occasion.description}</p>
                    ) : null}
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

function imageSrc(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) return src;
  return null;
}
