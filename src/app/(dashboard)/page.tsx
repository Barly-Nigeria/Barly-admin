import Link from "next/link";
import { Cake, ShoppingBag, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/catalog-chrome";
import { adminAuthed } from "@/lib/auth";
import { nairaFromKobo } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import type { AdminOverview } from "@/lib/barly-api";

function customerName(c: { first_name: string; last_name: string; email: string }) {
  return `${c.first_name} ${c.last_name}`.trim() || c.email;
}

function birthdayDate(dob: string) {
  const date = new Date(`${dob}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dob;
  return formatDate(date);
}

export default async function OverviewPage() {
  const overviewRes = await adminAuthed<AdminOverview>("/v1/admin/overview");
  const overview = overviewRes.body?.data;
  const loadError = !overviewRes.ok ? overviewRes.message : null;
  const todaysOrders = overview?.orders_today ?? 0;
  const newSignups = overview?.new_guests_14d ?? 0;
  const recentOrders = overview?.recent_orders ?? [];
  const upcomingBirthdays = overview?.upcoming_birthdays ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today at Barly</h1>
        <p className="text-sm text-muted-foreground">
          Orders, new guests, and birthdays that need a reminder.
        </p>
      </div>

      <FormError message={loadError} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat
          title="Orders today"
          value={String(todaysOrders)}
          hint="Paid bookings since midnight (Lagos)"
          icon={<ShoppingBag className="size-4" />}
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
                    <p className="truncate text-sm font-medium">{customerName(order.customer)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.item_summary || order.display_ref}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge value={order.status} />
                    <span className="text-xs">{nairaFromKobo(order.total_amount)}</span>
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
            <CardDescription>Guests whose birthday is coming up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming birthdays in the next two weeks.
              </p>
            ) : (
              upcomingBirthdays.map((c) => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {customerName({ first_name: c.first_name, last_name: c.last_name, email: c.email })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {birthdayDate(c.dob)}
                      {c.favourite_occasion?.name ? ` · ${c.favourite_occasion.name}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-amber-200">
                    {c.in_days === 0 ? "Today" : `${c.in_days}d`}
                  </span>
                </Link>
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
