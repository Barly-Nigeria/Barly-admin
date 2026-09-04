import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCategoryForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New category"
        description="Group products for the guest store."
        back={{ href: "/catalog/categories", label: "Categories" }}
      />
      <FormError message={error} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Name, slug, and store visibility.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}
