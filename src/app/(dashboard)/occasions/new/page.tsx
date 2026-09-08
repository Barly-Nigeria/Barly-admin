import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOccasionForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";

export default async function NewOccasionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New occasion"
        description="A moment guests can shop for."
        back={{ href: "/occasions", label: "Occasions" }}
      />
      <FormError message={error} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Assign products from a product’s edit screen.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOccasionForm />
        </CardContent>
      </Card>
    </div>
  );
}
