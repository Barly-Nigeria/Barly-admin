import { adminAuthed } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAddOnForm } from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import type { AdminVendorList } from "@/lib/barly-api";

export default async function NewAddOnPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const vendorsRes = await adminAuthed<AdminVendorList>("/v1/admin/vendors?limit=100&active=true");
  const vendors = vendorsRes.body?.data?.items ?? [];

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
          <CreateAddOnForm vendors={vendors} />
        </CardContent>
      </Card>
    </div>
  );
}
