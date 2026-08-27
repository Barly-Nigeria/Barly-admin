import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { BrandLogo } from "@/components/brand-logo";
import { PrintButton } from "@/components/print-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { groupByVendor, invoiceNumber, vendorFillLines } from "@/lib/invoice";

export default async function VendorSheetPage({
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
    },
  });
  if (!order) notFound();

  const groups = groupByVendor(vendorFillLines(order));
  const number = invoiceNumber(order);

  return (
    <div className="mx-auto max-w-3xl space-y-8 bg-black p-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <Link href={`/orders/${order.id}`} className="text-sm text-muted-foreground hover:underline">
          ← Order
        </Link>
        <PrintButton label="Print vendor sheets" />
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-red-700/40 pb-4">
        <BrandLogo size="lg" />
        <div className="text-right text-sm">
          <p className="font-semibold">Vendor fulfilment sheet</p>
          <p className="font-mono">{number}</p>
          <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
      </header>

      <p className="rounded-lg border border-red-700/40 bg-red-950/40 px-3 py-2 text-sm">
        Prices are withheld. Supply the SKUs and quantities below. Do not bill the guest.
      </p>

      <p className="text-sm text-muted-foreground">
        Event for {order.customer.name.split(" ")[0]} · {order.product.name}
      </p>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vendor SKUs on this order.</p>
      ) : (
        groups.map((group) => (
          <section key={group.vendorId} className="space-y-3 break-inside-avoid">
            <h2 className="text-lg font-semibold">{group.vendorName}</h2>
            <p className="text-sm text-muted-foreground">
              {[group.vendorEmail, group.vendorAddress].filter(Boolean).join(" · ") || "No contact on file"}
            </p>
            <p className="text-sm text-muted-foreground">{group.pieceCount} pieces total</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.lines.map((line) => (
                  <TableRow key={`${line.vendorId}-${line.sku}`}>
                    <TableCell className="font-mono text-xs">{line.sku}</TableCell>
                    <TableCell>{line.name}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ))
      )}
    </div>
  );
}
