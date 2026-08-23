import Link from "next/link";
import { Cake, ShoppingBag, TrendingDown, TrendingUp, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { daysUntilBirthday, formatDate, startOfDay } from "@/lib/dates";
import { occasionLabel } from "@/lib/labels";
import { StatusBadge } from "@/components/status-badge";

export default async function OverviewPage() {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todaysOrders,
    monthIn,
    monthOut,
    newSignups,
    recentOrders,
    customers,
    cashPosition,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.cashEntry.aggregate({
      _sum: { amount: true },
      where: {
        type: "inflow",
        createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
      },
    }),
    prisma.cashEntry.aggregate({
      _sum: { amount: true },
      where: {
        type: "outflow",
        createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
      },
    }),
    prisma.customer.count({
      where: { joinedAt: { gte: new Date(today.getTime() - 14 * 86_400_000) } },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { customer: true, product: true },
    }),
    prisma.customer.findMany(),
    prisma.cashEntry.groupBy({
      by: ["type"],
      _sum: { amount: true },
    }),
  ]);

  const inflows = cashPosition.find((c) => c.type === "inflow")?._sum.amount ?? 0;
  const outflows = cashPosition.find((c) => c.type === "outflow")?._sum.amount ?? 0;
  const position = inflows - outflows;

  const upcomingBirthdays = customers
    .map((c) => ({ ...c, inDays: daysUntilBirthday(c.birthday) }))
    .filter((c) => c.inDays <= 14)
    .sort((a, b) => a.inDays - b.inDays);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today at Barly</h1>
        <p className="text-sm text-muted-foreground">
          Orders, cash, new guests, and birthdays that need a reminder.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Orders today"
          value={String(todaysOrders)}
          hint="Created since midnight"
          icon={<ShoppingBag className="size-4" />}
        />
        <Stat
          title="Cash position"
          value={naira(position)}
          hint={`${naira(monthIn._sum.amount ?? 0)} in this month`}
          icon={<TrendingUp className="size-4" />}
        />
        <Stat
          title="Month outflows"
          value={naira(monthOut._sum.amount ?? 0)}
          hint="Vendor payouts and other costs"
          icon={<TrendingDown className="size-4" />}
        />
        <Stat
          title="New guests"
          value={String(newSignups)}
          hint="Joined in the last 14 days"
          icon={<UserPlus className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest bookings across packages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{order.customer.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.product.name} · {occasionLabel(order.product.occasion)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge value={order.status} />
                    <span className="text-xs">{naira(order.total)}</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="size-4 text-amber-300" />
              Birthdays in 14 days
            </CardTitle>
            <CardDescription>
              Send reminders from Marketing so they book a package.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming birthdays in the next two weeks.
              </p>
            ) : (
              upcomingBirthdays.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(c.birthday)} · {occasionLabel(c.favoriteOccasion)}
                    </p>
                  </div>
                  <span className="text-xs text-amber-200">
                    {c.inDays === 0 ? "Today" : `${c.inDays}d`}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
