import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditCategoryForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import type { CatalogCategory } from "@/lib/barly-api";

export default async function CategoryEditPage({
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
        <h1 className="text-2xl font-semibold tracking-tight">Edit category</h1>
        <FormError message={loadError ?? "Could not load this category."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${category.name}`}
        back={{ href: `/catalog/categories/${category.id}`, label: category.name }}
      />
      <FormError message={loadError} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Archive from the view page to hide this from the guest store.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditCategoryForm category={category} />
        </CardContent>
      </Card>
    </div>
  );
}
