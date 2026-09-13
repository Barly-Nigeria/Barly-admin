import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { ageGroup } from "@/lib/age-group";
import { formatDate, formatDateTime } from "@/lib/dates";
import { nairaFromKobo } from "@/lib/money";
import type { AdminCustomerDetail } from "@/lib/barly-api";
import { EmptyState } from "@/components/empty-state";
import { FormError, MetaList, PageHeader, TableShell } from "@/components/catalog-chrome";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

function joinedLabel(raw?: string) {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDate(date);
}

function placedLabel(raw?: string) {
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDateTime(date);
}

function dobLabel(raw?: string) {
  if (!raw) return "—";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return formatDate(date);
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const res = await adminAuthed<AdminCustomerDetail>(`/v1/admin/customers/${id}`);

  if (res.status === 404) {
    notFound();
  }

  const customer = res.body?.data;
  const loadError = error || (!res.ok ? res.message : null);

  if (!customer) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Customer</h1>
        <FormError message={loadError ?? "Could not load this customer."} />
      </div>
    );
  }

  const name = `${customer.first_name} ${customer.last_name}`.trim() || customer.email;
  const orders = customer.orders ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description={customer.email}
        back={{ href: "/customers", label: "Customers" }}
        actions={<StatusBadge value={customer.is_active ? "active" : "inactive"} />}
      />
      <FormError message={loadError} />

      <MetaList
        items={[
          { label: "Email", value: customer.email },
          { label: "Phone", value: customer.phone || "—" },
          {
            label: "Date of birth",
            value:
              customer.age != null
                ? `${dobLabel(customer.dob)} · ${customer.age} · ${ageGroup(customer.age)}`
                : dobLabel(customer.dob),
          },
          { label: "Joined", value: joinedLabel(customer.created_at) },
          { label: "Email verified", value: customer.email_verified ? "Yes" : "No" },
          { label: "Spend", value: nairaFromKobo(customer.total_spend) },
          {
            label: "Favourite occasion",
            value: customer.favourite_occasion ? (
              <Link href={`/occasions/${customer.favourite_occasion.id}`} className="hover:underline">
                {customer.favourite_occasion.name}
              </Link>
            ) : (
              "—"
            ),
          },
          {
            label: "Favourite package",
            value: customer.favourite_product ? (
              <Link href={`/catalog/${customer.favourite_product.id}`} className="hover:underline">
                {customer.favourite_product.name}
              </Link>
            ) : (
              "—"
            ),
          },
        ]}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Recent orders</h2>
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Paid and unpaid orders will show here." />
        ) : (
          <TableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <StatusBadge value={order.status} />
                    </TableCell>
                    <TableCell>{order.item_summary || "—"}</TableCell>
                    <TableCell className="text-right">{nairaFromKobo(order.total_amount)}</TableCell>
                    <TableCell>{placedLabel(order.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        )}
      </div>
    </div>
  );
}
