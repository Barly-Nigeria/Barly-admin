import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { vendorCategoryLabel } from "@/lib/labels";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { PayVendorForm } from "@/components/pay-vendor-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          Outstanding balances and payouts. Transfers are recorded locally (no live bank send).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Amount due</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{naira(outstanding)}</CardContent>
      </Card>

      {vendors.length === 0 ? (
        <EmptyState title="No vendors" description="Suppliers will show here once seeded or added." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{vendor.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {vendorCategoryLabel(vendor.category)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
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
