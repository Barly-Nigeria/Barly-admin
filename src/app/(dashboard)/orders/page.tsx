import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { occasionLabel } from "@/lib/labels";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FILTERS = ["all", "pending", "confirmed", "fulfilled", "cancelled"] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = FILTERS.includes(status as (typeof FILTERS)[number])
    ? status
    : "all";

  const orders = await prisma.order.findMany({
    where: filter === "all" ? undefined : { status: filter },
    orderBy: { createdAt: "desc" },
    include: { customer: true, product: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Track bookings and move them from pending through fulfilment.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={value === "all" ? "/orders" : `/orders?status=${value}`}
            className={`rounded-full border px-3 py-1 text-sm capitalize ${
              filter === value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {value}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders in this view"
          description="New bookings will show here. Try another status filter."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Occasion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                      {order.customer.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                  </TableCell>
                  <TableCell>{order.product.name}</TableCell>
                  <TableCell>{occasionLabel(order.product.occasion)}</TableCell>
                  <TableCell>
                    <StatusBadge value={order.status} />
                  </TableCell>
                  <TableCell className="text-right">{naira(order.total)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Link href={`/orders/${order.id}/invoice`} className="text-sm hover:underline">
                      Invoice
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
