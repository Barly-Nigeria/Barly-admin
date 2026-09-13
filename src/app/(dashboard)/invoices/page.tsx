import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { nairaFromKobo } from "@/lib/money";
import { CATALOG_LIST_PAGE_SIZE, type AdminOrderList } from "@/lib/barly-api";
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

type InvoicesQuery = {
  q?: string;
  status?: string;
  page?: string;
  error?: string;
};

function invoicesHref(opts: { page?: number; q?: string; status?: string }) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  const qs = params.toString();
  return qs ? `/invoices?${qs}` : "/invoices";
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

function sheetsLabel(count?: number) {
  const n = count ?? 0;
  return n === 0 ? "Not sent" : `${n} sent`;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<InvoicesQuery>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = FILTERS.includes(sp.status as (typeof FILTERS)[number])
    ? (sp.status as (typeof FILTERS)[number])
    : "all";
  const parsedPage = Number(sp.page);
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(CATALOG_LIST_PAGE_SIZE),
  });
  if (q) params.set("q", q);
  if (status !== "all") params.set("status", status);

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
  const hrefOpts = { q, status };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Customer invoices include prices. Vendor sheets go out without prices."
      />
      <FormError message={loadError} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={invoicesHref({ ...hrefOpts, status: value })}
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

      <form method="get" action="/invoices" className="flex flex-wrap items-end gap-2">
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        <Input name="q" defaultValue={q} placeholder="Search customer, order, payment" className="max-w-sm" />
        <Button type="submit" variant="outline">
          Apply
        </Button>
        <Button asChild variant="ghost">
          <Link href="/invoices">Clear</Link>
        </Button>
      </form>

      {total === 0 && res.ok ? (
        <EmptyState
          title="No invoices yet"
          description="Invoices appear when customers place paid orders."
        />
      ) : total > 0 || data.items.length > 0 ? (
        <div className="space-y-3">
          <TableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vendor sheets</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/orders/${order.id}`} className="font-mono text-xs font-medium hover:underline">
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
                    <TableCell>
                      <StatusBadge value={order.status} />
                    </TableCell>
                    <TableCell>{sheetsLabel(order.vendor_dispatch_count)}</TableCell>
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
                  <Link href={invoicesHref({ ...hrefOpts, page: data.page - 1 })}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
              )}
              {hasNext ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={invoicesHref({ ...hrefOpts, page: data.page + 1 })}>Next</Link>
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
