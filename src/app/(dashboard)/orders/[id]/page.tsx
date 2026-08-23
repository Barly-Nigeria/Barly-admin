import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { occasionLabel } from "@/lib/labels";
import { StatusBadge } from "@/components/status-badge";
import { OrderStatusForm } from "@/components/order-status-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, product: true, lines: true },
  });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-muted-foreground hover:underline">
          ← Orders
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {order.customer.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {order.product.name} · {occasionLabel(order.product.occasion)} ·{" "}
          {formatDateTime(order.createdAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge value={order.status} />
        <span className="text-lg font-semibold">{naira(order.total)}</span>
        {order.paidAt && (
          <span className="text-sm text-muted-foreground">
            Paid {formatDateTime(order.paidAt)}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusForm orderId={order.id} status={order.status} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.lines.map((line) => (
            <div key={line.id} className="flex justify-between text-sm">
              <span>
                {line.name} × {line.quantity}
              </span>
              <span>{naira(line.unitPrice * line.quantity)}</span>
            </div>
          ))}
          {order.notes && (
            <p className="pt-2 text-sm text-muted-foreground">{order.notes}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
