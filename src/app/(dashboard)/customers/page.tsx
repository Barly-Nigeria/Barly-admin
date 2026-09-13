import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { ageGroup } from "@/lib/age-group";
import { formatDate } from "@/lib/dates";
import { nairaFromKobo } from "@/lib/money";
import {
  CATALOG_LIST_PAGE_SIZE,
  type AdminCustomerList,
} from "@/lib/barly-api";
import { EmptyState } from "@/components/empty-state";
import { FormError, PageHeader, TableShell } from "@/components/catalog-chrome";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function customersHref(page: number, q: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/customers?${qs}` : "/customers";
}

function joinedLabel(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDate(date);
}

function customerName(c: { first_name: string; last_name: string; email: string }) {
  return `${c.first_name} ${c.last_name}`.trim() || c.email;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const parsedPage = Number(sp.page);
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(CATALOG_LIST_PAGE_SIZE),
  });
  if (q) params.set("q", q);

  const res = await adminAuthed<AdminCustomerList>(`/v1/admin/customers?${params.toString()}`);
  const payload = res.body?.data;
  const data = {
    items: payload?.items ?? [],
    page: payload?.page ?? page,
    limit: payload?.limit ?? CATALOG_LIST_PAGE_SIZE,
    total: payload?.total ?? 0,
    age_groups: payload?.age_groups ?? [],
    favourite_occasions: payload?.favourite_occasions ?? [],
  };
  const loadError = sp.error || (!res.ok ? res.message : null);
  const total = data.total;
  const from = data.items.length === 0 ? 0 : (data.page - 1) * data.limit + 1;
  const to = data.items.length === 0 ? 0 : (data.page - 1) * data.limit + data.items.length;
  const hasPrev = data.page > 1;
  const hasNext = data.page * data.limit < total;
  const maxBand = Math.max(1, ...data.age_groups.map((b) => b.count));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Guests who signed up for Barly. Search by name or email."
      />
      <FormError message={loadError} />

      <form method="get" action="/customers" className="flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name or email"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {total > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Age groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.age_groups.map((band) => (
                <div key={band.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{band.label}</span>
                    <span className="text-muted-foreground">{band.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(band.count / maxBand) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Favourite occasions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {data.favourite_occasions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No paid orders to infer occasions yet.</p>
              ) : (
                data.favourite_occasions.map((occ) => (
                  <Link
                    key={occ.id}
                    href={`/occasions/${occ.id}`}
                    className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                  >
                    {occ.name} · {occ.count}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {total === 0 && res.ok ? (
        <EmptyState
          title={q ? "No customers match this search" : "No customers yet"}
          description={
            q ? "Try a different name or email." : "New sign-ups will land in this list."
          }
        />
      ) : total > 0 || data.items.length > 0 ? (
        <div className="space-y-3">
          <TableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Favourite occasion</TableHead>
                  <TableHead>Favourite package</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                        {customerName(c)}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </TableCell>
                    <TableCell>{joinedLabel(c.created_at)}</TableCell>
                    <TableCell>
                      {c.age != null ? `${c.age} · ${ageGroup(c.age)}` : "—"}
                    </TableCell>
                    <TableCell>
                      {c.favourite_occasion ? (
                        <Link href={`/occasions/${c.favourite_occasion.id}`} className="hover:underline">
                          {c.favourite_occasion.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {c.favourite_product ? (
                        <Link href={`/catalog/${c.favourite_product.id}`} className="hover:underline">
                          {c.favourite_product.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{nairaFromKobo(c.total_spend ?? 0)}</TableCell>
                    <TableCell>
                      <StatusBadge value={c.is_active ? "active" : "inactive"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {from}–{to} of {total}
            </span>
            <div className="flex gap-2">
              {hasPrev ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={customersHref(data.page - 1, q)}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
              )}
              {hasNext ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={customersHref(data.page + 1, q)}>Next</Link>
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
