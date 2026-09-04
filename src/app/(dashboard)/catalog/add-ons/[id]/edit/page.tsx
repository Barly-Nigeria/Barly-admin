import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditAddOnForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import type { CatalogAddOn } from "@/lib/barly-api";

export default async function AddOnEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const res = await adminAuthed<CatalogAddOn>(`/v1/admin/add-ons/${id}`);

  if (res.status === 404) {
    notFound();
  }

  const addOn = res.body?.data;
  const loadError = error || (!res.ok ? res.message : null);

  if (!addOn) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Edit add-on</h1>
        <FormError message={loadError ?? "Could not load this add-on."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${addOn.name}`}
        back={{ href: `/catalog/add-ons/${addOn.id}`, label: addOn.name }}
      />
      <FormError message={loadError} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Archive from the view page to hide this from the guest store.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditAddOnForm addOn={addOn} />
        </CardContent>
      </Card>
    </div>
  );
}
