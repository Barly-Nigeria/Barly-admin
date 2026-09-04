import Link from "next/link";
import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CatalogImage, FormError, MetaList, PageHeader } from "@/components/catalog-chrome";
import { ArchiveButton, ConfirmDeleteButton } from "@/components/catalog-forms";
import { archiveOccasionAction, deleteOccasionAction } from "@/app/actions/catalog";
import type { CatalogOccasion } from "@/lib/barly-api";

export default async function OccasionViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const res = await adminAuthed<CatalogOccasion>(`/v1/admin/occasions/${id}`);

  if (res.status === 404) {
    notFound();
  }

  const occasion = res.body?.data;
  const loadError = error || (!res.ok ? res.message : null);

  if (!occasion) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Occasion</h1>
        <FormError message={loadError ?? "Could not load this occasion."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={occasion.name}
        description={<StatusBadge value={occasion.is_active ? "active" : "inactive"} />}
        back={{ href: "/occasions", label: "Occasions" }}
        actions={
          <>
            <Button asChild>
              <Link href={`/occasions/${occasion.id}/edit`}>Edit</Link>
            </Button>
            {occasion.is_active ? <ArchiveButton action={archiveOccasionAction} id={occasion.id} /> : null}
            <ConfirmDeleteButton
              action={deleteOccasionAction}
              id={occasion.id}
              name={occasion.name}
              description="Removes this occasion. Product assignments are dropped."
            />
          </>
        }
      />
      <FormError message={loadError} />
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row">
          <CatalogImage src={occasion.icon} alt={occasion.name} />
          <MetaList items={[{ label: "Icon URL", value: occasion.icon?.trim() || "—" }]} />
        </CardContent>
      </Card>
    </div>
  );
}
