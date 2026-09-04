import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditPickForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import type { CatalogPick } from "@/lib/barly-api";

export default async function PickEditPage({
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
        <h1 className="text-2xl font-semibold tracking-tight">Edit pick</h1>
        <FormError message={loadError ?? "Could not load this pick."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${pick.name}`} back={{ href: `/picks/${pick.id}`, label: pick.name }} />
      <FormError message={loadError} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Archive from the view page to hide this from the guest store.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditPickForm pick={pick} />
        </CardContent>
      </Card>
    </div>
  );
}
