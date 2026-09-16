import { Mail, MapPin, Phone } from "lucide-react";
import { getSession } from "@/lib/auth";
import { adminAuthed } from "@/lib/auth";
import { nairaFromKobo } from "@/lib/money";
import type { AdminBank, AdminVendorList } from "@/lib/barly-api";
import { EmptyState } from "@/components/empty-state";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import {
  AddVendorForm,
  DeactivateVendorButton,
  EditVendorForm,
  PayVendorForm,
  vendorCategoryLabel,
} from "@/components/vendor-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; error?: string; notice?: string; edit?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const params = new URLSearchParams({ page: String(page), limit: "30" });
  if (q) params.set("q", q);

  const [vendorsRes, banksRes] = await Promise.all([
    adminAuthed<AdminVendorList>(`/v1/admin/vendors?${params.toString()}`),
    isAdmin ? adminAuthed<AdminBank[]>("/v1/admin/banks") : Promise.resolve({ ok: true, body: { data: [] as AdminBank[] } } as Awaited<ReturnType<typeof adminAuthed<AdminBank[]>>>),
  ]);

  if (!vendorsRes.ok || !vendorsRes.body?.data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Vendors & suppliers" description="Could not load vendors." />
        <FormError message={vendorsRes.message} />
      </div>
    );
  }

  const data = vendorsRes.body.data;
  const banks = banksRes.ok ? banksRes.body?.data ?? [] : [];
  const editId = sp.edit ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors & suppliers"
        description="Onboard suppliers, accrue cost on paid orders, and pay out via Paystack."
      />
      {sp.error ? <FormError message={sp.error} /> : null}
      {sp.notice ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {sp.notice}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Amount due</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {nairaFromKobo(data.total_balance_due ?? 0)}
        </CardContent>
      </Card>

      <form method="get" className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Search vendors" className="max-w-xs" />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Onboard a vendor</CardTitle>
            <CardDescription>
              Contact details plus bank account for Paystack transfers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddVendorForm banks={banks} />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Only admins can add or pay vendors.</p>
      )}

      {data.items.length === 0 ? (
        <EmptyState
          title={q ? "No matches" : "No vendors yet"}
          description={
            isAdmin
              ? "Use the form above to onboard the first supplier."
              : "Ask an admin to onboard a supplier."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.items.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <CardTitle>{vendor.name}</CardTitle>
                <CardDescription>
                  {vendorCategoryLabel(vendor.category)}
                  {!vendor.is_active ? " · inactive" : ""}
                </CardDescription>
                {isAdmin && vendor.is_active ? (
                  <CardAction>
                    <DeactivateVendorButton vendor={vendor} />
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Mail className="size-3.5" />
                    {vendor.email || "No email"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="size-3.5" />
                    {vendor.phone || "No phone"}
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="size-3.5" />
                    {[vendor.address, vendor.city].filter(Boolean).join(", ") || "No address"}
                  </li>
                </ul>
                <div className="flex flex-wrap justify-between gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Balance due</p>
                    <p className="text-lg font-semibold">{nairaFromKobo(vendor.balance_due)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available to pay</p>
                    <p className="text-lg font-semibold">{nairaFromKobo(vendor.available_to_pay)}</p>
                  </div>
                </div>
                {isAdmin ? <PayVendorForm vendor={vendor} /> : null}
                {isAdmin && editId === vendor.id ? (
                  <EditVendorForm vendor={vendor} banks={banks} />
                ) : isAdmin ? (
                  <form method="get">
                    {q ? <input type="hidden" name="q" value={q} /> : null}
                    <input type="hidden" name="edit" value={vendor.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Edit details
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
