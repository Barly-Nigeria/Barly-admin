import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { nairaFromKobo } from "@/lib/money";
import { DELIVERY_STATUSES, PAYMENT_STATUSES } from "@/lib/labels";
import {
  CATALOG_LIST_PAGE_SIZE,
  type AdminOrderList,
} from "@/lib/barly-api";
import { EmptyState } from "@/components/empty-state";
import { FormError, PageHeader, TableShell } from "@/components/catalog-chrome";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FILTERS = ["all", "paid", "completed", "cancelled"] as const;

type OrdersQuery = {
  q?: string;
  status?: string;
  payment_status?: string;
  delivery_status?: string;
  from?: string;
  to?: string;
  page?: string;
  error?: string;
};

function ordersHref(opts: {
  page?: number;
  q?: string;
  status?: string;
  payment_status?: string;
  delivery_status?: string;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.payment_status) params.set("payment_status", opts.payment_status);
  if (opts.delivery_status) params.set("delivery_status", opts.delivery_status);
  if (opts.from) params.set("from", opts.from);
  if (opts.to) params.set("to", opts.to);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return qs ? `/orders?${qs}` : "/orders";
}

function placedLabel(raw?: string) {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDateTime(date);
}

function customerName(c: { first_name: string; last_name: string; email: string }) {
  return `${c.first_name} ${c.last_name}`.trim() || c.email;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersQuery>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = FILTERS.includes(sp.status as (typeof FILTERS)[number])
    ? (sp.status as (typeof FILTERS)[number])
    : "all";
  const paymentStatus = (sp.payment_status ?? "").trim();
  const deliveryStatus = (sp.delivery_status ?? "").trim();
  const from = (sp.from ?? "").trim();
  const to = (sp.to ?? "").trim();
  const parsedPage = Number(sp.page);
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(CATALOG_LIST_PAGE_SIZE),
  });
  if (q) params.set("q", q);
  if (status !== "all") params.set("status", status);
  if (paymentStatus) params.set("payment_status", paymentStatus);
  if (deliveryStatus) params.set("delivery_status", deliveryStatus);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const res = await adminAuthed<AdminOrderList>(`/v1/admin/orders?${params.toString()}`);
  const payload = res.body?.data;
  const data = {
    items: payload?.items ?? [],
    page: payload?.page ?? page,
    limit: payload?.limit ?? CATALOG_LIST_PAGE_SIZE,
    total: payload?.total ?? 0,
  };
  const loadError = sp.error || (!res.ok ? res.message : null);
  const total = data.total;
  const fromRow = data.items.length === 0 ? 0 : (data.page - 1) * data.limit + 1;
  const toRow = data.items.length === 0 ? 0 : (data.page - 1) * data.limit + data.items.length;
  const hasPrev = data.page > 1;
  const hasNext = data.page * data.limit < total;
  const hrefOpts = {
    q,
    status,
    payment_status: paymentStatus,
    delivery_status: deliveryStatus,
    from,
    to,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track bookings, payments, and drinks.ng dispatch from the live API."
      />
      <FormError message={loadError} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={ordersHref({ ...hrefOpts, status: value })}
            className={`rounded-full border px-3 py-1 text-sm capitalize ${
              status === value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {value.replaceAll("_", " ")}
          </Link>
        ))}
      </div>

      <form method="get" action="/orders" className="flex flex-wrap items-end gap-2">
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        <Input name="q" defaultValue={q} placeholder="Search customer, order, payment, delivery" className="max-w-sm" />
        <label className="grid gap-1 text-xs text-muted-foreground">
          From
          <Input type="date" name="from" defaultValue={from} className="h-9 w-[11.5rem]" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          To
          <Input type="date" name="to" defaultValue={to} className="h-9 w-[11.5rem]" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Payment
          <select
            name="payment_status"
            defaultValue={paymentStatus}
            className="h-9 rounded-lg border bg-background px-2 text-sm text-foreground"
          >
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Delivery
          <select
            name="delivery_status"
            defaultValue={deliveryStatus}
            className="h-9 rounded-lg border bg-background px-2 text-sm text-foreground"
          >
            <option value="">All deliveries</option>
            {DELIVERY_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="outline">
          Apply
        </Button>
        <Button asChild variant="ghost">
          <Link href="/orders">Clear</Link>
        </Button>
      </form>

      {total === 0 && res.ok ? (
        <EmptyState
          title="No orders in this view"
          description="Try another search or filter. New bookings will land here."
        />
      ) : total > 0 || data.items.length > 0 ? (
        <div className="space-y-3">
          <TableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                        {order.display_ref}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {order.payment?.reference || order.id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Link href={`/customers/${order.customer.id}`} className="font-medium hover:underline">
                        {customerName(order.customer)}
                      </Link>
                      <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                    </TableCell>
                    <TableCell>{order.vendor?.name ?? "drinks.ng"}</TableCell>
                    <TableCell>
                      <StatusBadge value={order.status} />
                    </TableCell>
                    <TableCell>
                      {order.delivery ? (
                        <div>
                          <StatusBadge value={order.delivery.status} />
                          {order.delivery.provider_reference ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {order.delivery.provider_reference}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{nairaFromKobo(order.total_amount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {placedLabel(order.created_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="flex flex-wrap justify-end gap-3">
                        <Link href={`/orders/${order.id}/invoice`} className="text-sm hover:underline">
                          Invoice
                        </Link>
                        <Link href={`/orders/${order.id}/vendor-sheet`} className="text-sm hover:underline">
                          Vendor sheet
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {fromRow}–{toRow} of {total}
            </span>
            <div className="flex gap-2">
              {hasPrev ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={ordersHref({ ...hrefOpts, page: data.page - 1 })}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
              )}
              {hasNext ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={ordersHref({ ...hrefOpts, page: data.page + 1 })}>Next</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
