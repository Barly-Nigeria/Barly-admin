import { notFound } from "next/navigation";
import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
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

function customerFirstName(c: { first_name: string; last_name: string; email: string }) {
  return c.first_name.trim() || `${c.first_name} ${c.last_name}`.trim() || c.email;
}

function sheetDate(raw?: string) {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDate(date);
}

export default async function VendorSheetPage({
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
  const pieceCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const vendorName = order.vendor?.name || "drinks.ng";
  const vendorEmail = "orders@drinks.ng";
  const summary =
    order.item_summary?.trim() || items.map((item) => item.name).filter(Boolean).join(", ");

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
          <p className="font-mono">{order.display_ref}</p>
          {order.payment?.reference ? (
            <p className="font-mono text-muted-foreground">{order.payment.reference}</p>
          ) : null}
          <p className="text-muted-foreground">{sheetDate(order.created_at)}</p>
        </div>
      </header>

      <p className="rounded-lg border border-red-700/40 bg-red-950/40 px-3 py-2 text-sm">
        Prices are withheld. Supply the SKUs and quantities below. Do not bill the guest.
      </p>

      <p className="text-sm text-muted-foreground">
        Event for {customerFirstName(order.customer)}
        {summary ? ` · ${summary}` : ""}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vendor SKUs on this order.</p>
      ) : (
        <section className="space-y-3 break-inside-avoid">
          <h2 className="text-lg font-semibold">{vendorName}</h2>
          <p className="text-sm text-muted-foreground">{vendorEmail}</p>
          <p className="text-sm text-muted-foreground">{pieceCount} pieces total</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.sku || "—"}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
