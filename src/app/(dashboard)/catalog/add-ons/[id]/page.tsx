import Link from "next/link";
import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { naira } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CatalogImage, FormError, MetaList, PageHeader } from "@/components/catalog-chrome";
import { ArchiveButton, ConfirmDeleteButton } from "@/components/catalog-forms";
import { archiveAddOnAction, deleteAddOnAction } from "@/app/actions/catalog";
import type { CatalogAddOn } from "@/lib/barly-api";

export default async function AddOnViewPage({
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
        <h1 className="text-2xl font-semibold tracking-tight">Add-on</h1>
        <FormError message={loadError ?? "Could not load this add-on."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={addOn.name}
        description={
          <>
            {addOn.slug} · <StatusBadge value={addOn.is_active ? "active" : "inactive"} />
          </>
        }
        back={{ href: "/catalog/add-ons", label: "Add-ons" }}
        actions={
          <>
            <Button asChild>
              <Link href={`/catalog/add-ons/${addOn.id}/edit`}>Edit</Link>
            </Button>
            {addOn.is_active ? <ArchiveButton action={archiveAddOnAction} id={addOn.id} /> : null}
            <ConfirmDeleteButton
              action={deleteAddOnAction}
              id={addOn.id}
              name={addOn.name}
              description="Removes this add-on from the catalog."
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
          <CatalogImage src={addOn.image_url} alt={addOn.name} />
          <MetaList
            items={[
              { label: "Price", value: naira(addOn.price) },
              { label: "Stock", value: String(addOn.stock_quantity) },
              { label: "Description", value: addOn.description?.trim() || "—" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
