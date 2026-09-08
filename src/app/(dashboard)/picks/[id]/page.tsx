import Link from "next/link";
import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { naira } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CatalogImage, ChipList, FormError, MetaList, PageHeader } from "@/components/catalog-chrome";
import { ArchiveButton, ConfirmDeleteButton } from "@/components/catalog-forms";
import { archivePickAction, deletePickAction } from "@/app/actions/catalog";
import type { CatalogPick } from "@/lib/barly-api";

export default async function PickViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const res = await adminAuthed<CatalogPick>(`/v1/admin/picks/${id}`);

  if (res.status === 404) {
    notFound();
  }

  const pick = res.body?.data;
  const loadError = error || (!res.ok ? res.message : null);

  if (!pick) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Pick</h1>
        <FormError message={loadError ?? "Could not load this pick."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick.name}
        description={<StatusBadge value={pick.is_active ? "active" : "inactive"} />}
        back={{ href: "/picks", label: "Picks" }}
        actions={
          <>
            <Button asChild>
              <Link href={`/picks/${pick.id}/edit`}>Edit</Link>
            </Button>
            {pick.is_active ? <ArchiveButton action={archivePickAction} id={pick.id} /> : null}
            <ConfirmDeleteButton
              action={deletePickAction}
              id={pick.id}
              name={pick.name}
              description="Removes this pick. Product assignments are dropped."
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
          <CatalogImage src={pick.image_url} alt={pick.name} />
          <div className="min-w-0 flex-1 space-y-4">
            <MetaList
              items={[
                { label: "Subtitle", value: pick.sub_text?.trim() || "—" },
                {
                  label: "Starting price",
                  value: pick.starting_price != null ? naira(pick.starting_price) : "—",
                },
              ]}
            />
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tags</p>
              <ChipList items={pick.tags ?? []} empty="No tags." />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
