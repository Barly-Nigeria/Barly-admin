import { notFound } from "next/navigation";
import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { nairaFromKobo } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { BrandLogo } from "@/components/brand-logo";
import { PrintButton } from "@/components/print-button";
import type { AdminOrderDetail } from "@/lib/barly-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function customerName(c: { first_name: string; last_name: string; email: string }) {
  return `${c.first_name} ${c.last_name}`.trim() || c.email;
}

function invoiceDate(raw?: string) {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDate(date);
}

function deliveryAddress(order: AdminOrderDetail) {
  const fromDelivery = [
    order.delivery?.address_line,
    [order.delivery?.city, order.delivery?.state].filter(Boolean).join(", "),
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  if (fromDelivery) return fromDelivery;
  const fromOrder = [
    order.delivery_address_line || order.delivery_address,
    [order.delivery_city, order.delivery_state].filter(Boolean).join(", "),
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  return fromOrder || "";
}

export default async function CustomerInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await adminAuthed<AdminOrderDetail>(`/v1/admin/orders/${id}`);

  if (res.status === 404) {
    notFound();
  }

  const order = res.body?.data;
  if (!order) {
    notFound();
  }

  const items = order.items ?? [];
  const name = customerName(order.customer);
  const address = deliveryAddress(order);
  const summary = order.item_summary?.trim() || items.map((item) => item.name).filter(Boolean).join(", ");

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
          <p className="font-mono">{order.display_ref}</p>
          {order.payment?.reference ? (
            <p className="font-mono text-muted-foreground">{order.payment.reference}</p>
          ) : null}
          <p className="text-muted-foreground">{invoiceDate(order.created_at)}</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bill to</p>
          <p className="font-medium">{name}</p>
          <p>{order.customer.email}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {address ? "Deliver to" : "Order"}
          </p>
          {address ? <p className="font-medium">{address}</p> : null}
          {summary ? <p className="text-muted-foreground">{summary}</p> : null}
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
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                No line items
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p>{item.name}</p>
                  {item.sku ? <p className="text-xs text-muted-foreground">{item.sku}</p> : null}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">{nairaFromKobo(item.unit_price)}</TableCell>
                <TableCell className="text-right">{nairaFromKobo(item.total_price)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{nairaFromKobo(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Delivery fee</dt>
          <dd>{nairaFromKobo(order.delivery_fee)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Tax</dt>
          <dd>{nairaFromKobo(order.tax_amount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Discount</dt>
          <dd>{nairaFromKobo(order.discount_amount)}</dd>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>Total due</dt>
          <dd>{nairaFromKobo(order.total_amount)}</dd>
        </div>
      </dl>
    </div>
  );
}
