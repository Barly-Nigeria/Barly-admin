import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAddOnForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";

export default async function NewAddOnPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New add-on"
        description="Ice, cups, and extras guests can attach to an order."
        back={{ href: "/catalog/add-ons", label: "Add-ons" }}
      />
      <FormError message={error} />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Price is in naira (same integer the API stores).</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAddOnForm />
        </CardContent>
      </Card>
    </div>
  );
}
