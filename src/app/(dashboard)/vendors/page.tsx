import type { ReactNode } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { vendorCategoryLabel } from "@/lib/labels";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { PayVendorForm } from "@/components/pay-vendor-form";
import { AddVendorForm, DeleteVendorButton } from "@/components/vendor-forms";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function VendorsPage() {
  const session = await getSession();
  const isManager = session?.role === "manager";

  const vendors = await prisma.vendor.findMany({
    orderBy: { name: "asc" },
    include: {
      payments: { orderBy: { paidAt: "desc" }, take: 3 },
      _count: { select: { items: true } },
    },
  });

  const outstanding = vendors.reduce((s, v) => s + v.balanceDue, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendors & suppliers</h1>
        <p className="text-sm text-muted-foreground">
          Onboard suppliers with a contact address and email, then record payouts locally (no live bank send).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Amount due</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{naira(outstanding)}</CardContent>
      </Card>

      {isManager ? (
        <Card>
          <CardHeader>
            <CardTitle>Onboard a vendor</CardTitle>
            <CardDescription>
              Add the company name, delivery address, and the inbox we send fulfilment sheets to.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddVendorForm />
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Only managers can add or remove vendors.</p>
      )}

      {vendors.length === 0 ? (
        <EmptyState
          title="No vendors yet"
          description={
            isManager
              ? "Use the form above to onboard the first supplier."
              : "Ask a manager to onboard a supplier."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <CardTitle>{vendor.name}</CardTitle>
                <CardDescription>{vendorCategoryLabel(vendor.category)}</CardDescription>
                {isManager ? (
                  <CardAction>
                    <DeleteVendorButton
                      vendorId={vendor.id}
                      name={vendor.name}
                      itemCount={vendor._count.items}
                      balanceDue={vendor.balanceDue}
                    />
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <ContactRow
                    icon={<Mail className="size-3.5" />}
                    href={vendor.email ? `mailto:${vendor.email}` : undefined}
                    value={vendor.email || "No email on file"}
                  />
                  <ContactRow
                    icon={<Phone className="size-3.5" />}
                    href={vendor.phone ? `tel:${vendor.phone.replace(/\s+/g, "")}` : undefined}
                    value={vendor.phone || "No phone on file"}
                  />
                  <ContactRow
                    icon={<MapPin className="size-3.5" />}
                    value={formatAddress(vendor.address, vendor.city) || "No address on file"}
                  />
                </ul>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Balance due</p>
                    <p className="text-xl font-semibold">{naira(vendor.balanceDue)}</p>
                    <p className="text-xs text-muted-foreground">{vendor._count.items} catalog items</p>
                  </div>
                  {isManager ? (
                    <PayVendorForm vendorId={vendor.id} max={vendor.balanceDue} />
                  ) : (
                    <p className="text-xs text-muted-foreground">Manager payouts only</p>
                  )}
                </div>
                {vendor.payments.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paid</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDateTime(p.paidAt)}</TableCell>
                          <TableCell className="capitalize">{p.method}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <StatusBadge value={p.status} />
                              {naira(p.amount)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatAddress(address: string, city: string) {
  return [address, city].filter(Boolean).join(", ");
}

function ContactRow({
  icon,
  value,
  href,
}: {
  icon: ReactNode;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className={href ? "break-all underline-offset-2 hover:underline" : "break-words"}>{value}</span>
    </>
  );

  if (href) {
    return (
      <li>
        <a href={href} className="flex items-start gap-2">
          {body}
        </a>
      </li>
    );
  }

  return <li className="flex items-start gap-2">{body}</li>;
}
