import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { occasionLabel } from "@/lib/labels";
import { AGE_BANDS, ageGroup } from "@/lib/age-group";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { joinedAt: "desc" },
    include: {
      favoritePackage: true,
      orders: { where: { status: { not: "cancelled" } } },
    },
  });

  const withSpend = customers.map((c) => ({
    ...c,
    spend: c.orders.reduce((s, o) => s + o.total, 0),
    band: ageGroup(c.age),
  }));

  const bands = AGE_BANDS.map((band) => ({
    ...band,
    count: withSpend.filter((c) => c.band === band.label).length,
  }));
  const maxBand = Math.max(1, ...bands.map((b) => b.count));

  const occasionCounts = new Map<string, number>();
  for (const c of withSpend) {
    occasionCounts.set(c.favoriteOccasion, (occasionCounts.get(c.favoriteOccasion) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Who joined, what they spend, favourite occasions, and age mix.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Age groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bands.map((band) => (
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
            {[...occasionCounts.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([id, count]) => (
                <span
                  key={id}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  {occasionLabel(id)} · {count}
                </span>
              ))}
          </CardContent>
        </Card>
      </div>

      {withSpend.length === 0 ? (
        <EmptyState title="No customers yet" description="New sign-ups will land in this list." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Favourite occasion</TableHead>
                <TableHead>Favourite package</TableHead>
                <TableHead className="text-right">Spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withSpend.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </TableCell>
                  <TableCell>{formatDate(c.joinedAt)}</TableCell>
                  <TableCell>
                    {c.age} · {c.band}
                  </TableCell>
                  <TableCell>{occasionLabel(c.favoriteOccasion)}</TableCell>
                  <TableCell>{c.favoritePackage?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">{naira(c.spend)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
