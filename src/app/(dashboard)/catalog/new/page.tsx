import { adminAuthed } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProductForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import type { CatalogCategory, CatalogCategoryList } from "@/lib/barly-api";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const categoriesRes = await adminAuthed<CatalogCategoryList>("/v1/admin/categories?limit=100");
  const categories: CatalogCategory[] = categoriesRes.body?.data?.items ?? [];
  const loadError = error || (!categoriesRes.ok ? categoriesRes.message : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New product"
        description="Creates an active product. Add variants after saving."
        back={{ href: "/catalog", label: "Catalog" }}
      />
      <FormError message={loadError} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Name, slug, category, and store visibility.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateProductForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
