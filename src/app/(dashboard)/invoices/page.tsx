import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customerInvoiceLines, customerInvoiceTotals, invoiceNumber } from "@/lib/invoice";

export default async function InvoicesPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      product: { include: { items: { include: { item: { include: { vendor: true } } } } } },
      lines: { include: { item: { include: { vendor: true } } } },
      dispatches: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Calculated customer invoices live here. Vendor sheets go out without prices.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Invoices appear when customers place orders."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vendor sheets</TableHead>
                <TableHead className="text-right">Calculated total</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const totals = customerInvoiceTotals(customerInvoiceLines(order));
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        {invoiceNumber(order)}
                      </Link>
                    </TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>
                      <StatusBadge value={order.status} />
                    </TableCell>
                    <TableCell>
                      {order.dispatches.length === 0
                        ? "Not sent"
                        : `${order.dispatches.length} sent`}
                    </TableCell>
                    <TableCell className="text-right">{naira(totals.calculatedTotal)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
