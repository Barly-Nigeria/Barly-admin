import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatePickForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";

export default async function NewPickPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New pick"
        description="A curated collection guests can browse."
        back={{ href: "/picks", label: "Picks" }}
      />
      <FormError message={error} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Assign products from a product’s edit screen.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePickForm />
        </CardContent>
      </Card>
    </div>
  );
}
