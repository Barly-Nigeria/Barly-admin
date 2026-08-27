import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { occasionLabel } from "@/lib/labels";
import { StatusBadge } from "@/components/status-badge";
import { OrderStatusForm } from "@/components/order-status-form";
import { SendVendorSheetsForm } from "@/components/send-vendor-sheets-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  customerInvoiceLines,
  customerInvoiceTotals,
  groupByVendor,
  invoiceNumber,
  vendorFillLines,
} from "@/lib/invoice";
import { Button } from "@/components/ui/button";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      product: { include: { items: { include: { item: { include: { vendor: true } } } } } },
      lines: { include: { item: { include: { vendor: true } } } },
      dispatches: { include: { vendor: true }, orderBy: { sentAt: "desc" } },
    },
  });
  if (!order) notFound();

  const lines = customerInvoiceLines(order);
  const totals = customerInvoiceTotals(lines);
  const vendorGroups = groupByVendor(vendorFillLines(order));
  const number = invoiceNumber(order);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/orders" className="text-sm text-muted-foreground hover:underline">
            ← Orders
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {order.customer.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {number} · {order.product.name} · {occasionLabel(order.product.occasion)} ·{" "}
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/orders/${order.id}/invoice`}>Customer invoice</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/orders/${order.id}/vendor-sheet`}>Vendor sheet</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge value={order.status} />
        <span className="text-lg font-semibold">{naira(totals.calculatedTotal)}</span>
        {order.paidAt && (
          <span className="text-sm text-muted-foreground">
            Paid {formatDateTime(order.paidAt)}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusForm orderId={order.id} status={order.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order breakdown</CardTitle>
          <CardDescription>
            Calculated on Barly from package and extra lines. This is the customer invoice
            with prices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="capitalize">
                      {line.kind === "product" ? "Package" : "Extra"}
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{naira(line.unitPrice)}</TableCell>
                    <TableCell className="text-right">{naira(line.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Package</dt>
              <dd>{naira(totals.packageTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Extras</dt>
              <dd>{naira(totals.extrasTotal)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Invoice total</dt>
              <dd>{naira(totals.calculatedTotal)}</dd>
            </div>
            {totals.calculatedTotal !== order.total && (
              <div className="flex justify-between text-muted-foreground">
                <dt>Stored total</dt>
                <dd>{naira(order.total)}</dd>
              </div>
            )}
          </dl>
          {order.notes && (
            <p className="mt-3 text-sm text-muted-foreground">{order.notes}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send to vendors</CardTitle>
          <CardDescription>
            Fulfilment sheets list SKUs and quantities only. Prices never leave this screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SendVendorSheetsForm
            orderId={order.id}
            vendors={vendorGroups.map((g) => ({
              id: g.vendorId,
              name: g.vendorName,
              pieceCount: g.pieceCount,
            }))}
          />
          {order.dispatches.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sent</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Pcs</TableHead>
                    <TableHead>Contents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.dispatches.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(d.sentAt)}
                      </TableCell>
                      <TableCell>{d.vendor.name}</TableCell>
                      <TableCell>{d.itemCount}</TableCell>
                      <TableCell className="max-w-sm truncate text-muted-foreground">
                        {d.summary}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
