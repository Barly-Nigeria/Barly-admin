import { notFound } from "next/navigation";
import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { nairaFromKobo } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import type { AdminOrderDetail } from "@/lib/barly-api";
import { StatusBadge } from "@/components/status-badge";
import { OrderStatusForm } from "@/components/order-status-form";
import { SendVendorSheetsForm } from "@/components/send-vendor-sheets-form";
import { EmptyState } from "@/components/empty-state";
import { FormError, MetaList, PageHeader, TableShell } from "@/components/catalog-chrome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function placedLabel(raw?: string) {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDateTime(date);
}

function customerName(c: { first_name: string; last_name: string; email: string }) {
  return `${c.first_name} ${c.last_name}`.trim() || c.email;
}

function dash(value?: string | null) {
  return value?.trim() ? value : "—";
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const res = await adminAuthed<AdminOrderDetail>(`/v1/admin/orders/${id}`);

  if (res.status === 404) {
    notFound();
  }

  const order = res.body?.data;
  const loadError = error || (!res.ok ? res.message : null);

  if (!order) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
        <FormError message={loadError ?? "Could not load this order."} />
      </div>
    );
  }

  const name = customerName(order.customer);
  const items = order.items ?? [];
  const payments = order.payments ?? [];
  const dispatches = order.vendor_dispatches ?? [];
  const pieceCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const delivery = order.delivery;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${name} · ${order.display_ref}`}
        description={`${order.id}${order.payment?.reference ? ` · ${order.payment.reference}` : ""} · ${placedLabel(order.created_at)}`}
        back={{ href: "/orders", label: "Orders" }}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/orders/${order.id}/invoice`} className="text-sm hover:underline">
              Invoice
            </Link>
            <Link href={`/orders/${order.id}/vendor-sheet`} className="text-sm hover:underline">
              Vendor sheet
            </Link>
            <StatusBadge value={order.status} />
          </div>
        }
      />
      <FormError message={loadError} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-lg font-semibold">{nairaFromKobo(order.total_amount)}</span>
        {order.payment?.paid_at ? (
          <span className="text-sm text-muted-foreground">
            Paid {placedLabel(order.payment.paid_at)}
          </span>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update status</CardTitle>
          <CardDescription>Admin override of the backend order status.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderStatusForm orderId={order.id} status={order.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery</CardTitle>
          <CardDescription>Recipient, booking, and courier details for this order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MetaList
            items={[
              { label: "Recipient", value: dash(delivery?.recipient_name || order.delivery_recipient_name) },
              { label: "Phone", value: dash(delivery?.recipient_phone || order.delivery_recipient_phone) },
              {
                label: "Address",
                value: dash(
                  delivery?.address_line ||
                    order.delivery_address_line ||
                    order.delivery_address,
                ),
              },
              {
                label: "City / state",
                value: dash(
                  [delivery?.city || order.delivery_city, delivery?.state || order.delivery_state]
                    .filter(Boolean)
                    .join(", "),
                ),
              },
              { label: "Quote reference", value: dash(delivery?.quote_reference || order.delivery_quote_reference) },
              { label: "Courier", value: dash(delivery?.courier) },
              {
                label: "Tracking URL",
                value: delivery?.tracking_url ? (
                  <Link href={delivery.tracking_url} className="hover:underline" target="_blank">
                    {delivery.tracking_url}
                  </Link>
                ) : (
                  "—"
                ),
              },
              { label: "Provider reference", value: dash(delivery?.provider_reference) },
              { label: "Booking error", value: dash(delivery?.booking_error) },
              {
                label: "Delivery status",
                value: delivery ? <StatusBadge value={delivery.status} /> : "—",
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order breakdown</CardTitle>
          <CardDescription>Line items and totals from barly-api. Amounts are stored in kobo.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState title="No line items" description="This order has no recorded SKUs." />
          ) : (
            <TableShell>
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
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.name}
                        {item.sku ? (
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="capitalize">{item.item_type}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{nairaFromKobo(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{nairaFromKobo(item.total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          )}
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{nairaFromKobo(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery fee</dt>
              <dd>{nairaFromKobo(order.delivery_fee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>{nairaFromKobo(order.tax_amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>{nairaFromKobo(order.discount_amount)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd>{nairaFromKobo(order.total_amount)}</dd>
            </div>
          </dl>
          {order.notes ? <p className="mt-3 text-sm text-muted-foreground">{order.notes}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <TableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.reference}
                        <p className="text-xs text-muted-foreground">{payment.provider}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={payment.status} />
                      </TableCell>
                      <TableCell className="text-right">{nairaFromKobo(payment.amount)}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {placedLabel(payment.paid_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send to drinks.ng</CardTitle>
          <CardDescription>
            Emails the customer invoice PDF to drinks.ng and records the dispatch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SendVendorSheetsForm
            orderId={order.id}
            vendors={[
              {
                id: "drinks-ng",
                name: "drinks.ng",
                email: "orders@drinks.ng",
                pieceCount,
              },
            ]}
          />
          {dispatches.length > 0 ? (
            <TableShell>
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
                  {dispatches.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap">{placedLabel(d.sent_at)}</TableCell>
                      <TableCell>
                        {d.vendor_name}
                        {d.vendor_email ? (
                          <p className="text-xs text-muted-foreground">{d.vendor_email}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{d.item_count}</TableCell>
                      <TableCell className="max-w-sm truncate text-muted-foreground">{d.summary}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
