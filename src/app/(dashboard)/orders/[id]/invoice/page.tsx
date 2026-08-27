import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { occasionLabel } from "@/lib/labels";
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
import {
  customerInvoiceLines,
  customerInvoiceTotals,
  invoiceNumber,
} from "@/lib/invoice";

export default async function CustomerInvoicePage({
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

  const lines = customerInvoiceLines(order);
  const totals = customerInvoiceTotals(lines);
  const number = invoiceNumber(order);

  return (
    <div className="mx-auto max-w-3xl space-y-6 bg-black p-6 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <Link href={`/orders/${order.id}`} className="text-sm text-muted-foreground hover:underline">
          ← Order
        </Link>
        <PrintButton label="Print invoice" />
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-red-700/40 pb-4">
        <BrandLogo size="lg" />
        <div className="text-right text-sm">
          <p className="font-semibold">Customer invoice</p>
          <p className="font-mono">{number}</p>
          <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bill to</p>
          <p className="font-medium">{order.customer.name}</p>
          <p>{order.customer.email}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Occasion</p>
          <p className="font-medium">{occasionLabel(order.product.occasion)}</p>
          <p>{order.product.name}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>
                <p>{line.description}</p>
                <p className="text-xs text-muted-foreground">
                  {line.kind === "product" ? "Package" : "Extra item"}
                </p>
              </TableCell>
              <TableCell className="text-right">{line.quantity}</TableCell>
              <TableCell className="text-right">{naira(line.unitPrice)}</TableCell>
              <TableCell className="text-right">{naira(line.lineTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <dt>Package</dt>
          <dd>{naira(totals.packageTotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Extras</dt>
          <dd>{naira(totals.extrasTotal)}</dd>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>Total due</dt>
          <dd>{naira(totals.calculatedTotal)}</dd>
        </div>
      </dl>
    </div>
  );
}
