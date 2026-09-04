import Link from "next/link";
import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CatalogImage, FormError, MetaList, PageHeader } from "@/components/catalog-chrome";
import { ArchiveButton, ConfirmDeleteButton } from "@/components/catalog-forms";
import { archiveCategoryAction, deleteCategoryAction } from "@/app/actions/catalog";
import type { CatalogCategory } from "@/lib/barly-api";

export default async function CategoryViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const res = await adminAuthed<CatalogCategory>(`/v1/admin/categories/${id}`);

  if (res.status === 404) {
    notFound();
  }

  const category = res.body?.data;
  const loadError = error || (!res.ok ? res.message : null);

  if (!category) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Category</h1>
        <FormError message={loadError ?? "Could not load this category."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={category.name}
        description={
          <>
            {category.slug} · <StatusBadge value={category.is_active ? "active" : "inactive"} />
          </>
        }
        back={{ href: "/catalog/categories", label: "Categories" }}
        actions={
          <>
            <Button asChild>
              <Link href={`/catalog/categories/${category.id}/edit`}>Edit</Link>
            </Button>
            {category.is_active ? <ArchiveButton action={archiveCategoryAction} id={category.id} /> : null}
            <ConfirmDeleteButton
              action={deleteCategoryAction}
              id={category.id}
              name={category.name}
              description="Removes this category. Products keep their other fields."
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
          <CatalogImage src={category.image_url} alt={category.name} />
          <MetaList
            items={[
              { label: "Slug", value: category.slug },
              { label: "Description", value: category.description?.trim() || "—" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
