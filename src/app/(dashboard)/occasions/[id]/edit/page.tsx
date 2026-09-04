import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditOccasionForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import type { CatalogOccasion } from "@/lib/barly-api";

export default async function OccasionEditPage({
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
        <h1 className="text-2xl font-semibold tracking-tight">Edit occasion</h1>
        <FormError message={loadError ?? "Could not load this occasion."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${occasion.name}`}
        back={{ href: `/occasions/${occasion.id}`, label: occasion.name }}
      />
      <FormError message={loadError} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Archive from the view page to hide this from the guest store.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditOccasionForm occasion={occasion} />
        </CardContent>
      </Card>
    </div>
  );
}
