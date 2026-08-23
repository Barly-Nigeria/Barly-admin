import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
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

export default async function CashPage() {
  const entries = await prisma.cashEntry.findMany({
    orderBy: { createdAt: "desc" },
  });

  const inflow = entries.filter((e) => e.type === "inflow").reduce((s, e) => s + e.amount, 0);
  const outflow = entries.filter((e) => e.type === "outflow").reduce((s, e) => s + e.amount, 0);
  const net = inflow - outflow;

  const byDay = new Map<string, { in: number; out: number }>();
  for (const entry of [...entries].reverse()) {
    const key = entry.createdAt.toISOString().slice(0, 10);
    const row = byDay.get(key) ?? { in: 0, out: 0 };
    if (entry.type === "inflow") row.in += entry.amount;
    else row.out += entry.amount;
    byDay.set(key, row);
  }
  const chart = [...byDay.entries()].slice(-10);
  const max = Math.max(1, ...chart.flatMap(([, v]) => [v.in, v.out]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cash flow</h1>
        <p className="text-sm text-muted-foreground">
          Inflows from paid orders and outflows from vendor payouts and running costs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inflows</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-300">
            {naira(inflow)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outflows</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-rose-300">
            {naira(outflow)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Net position</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{naira(net)}</CardContent>
        </Card>
      </div>

      {chart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-3">
              {chart.map(([day, v]) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-32 w-full items-end justify-center gap-0.5">
                    <div
                      className="w-1/2 rounded-t bg-emerald-400/80"
                      style={{ height: `${(v.in / max) * 100}%` }}
                      title={`In ${naira(v.in)}`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-rose-400/80"
                      style={{ height: `${(v.out / max) * 100}%` }}
                      title={`Out ${naira(v.out)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{day.slice(5)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 ? (
        <EmptyState
          title="No cash movements"
          description="Paid orders and vendor payouts will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={entry.type} />
                  </TableCell>
                  <TableCell className="capitalize">
                    {entry.source.replaceAll("_", " ")}
                  </TableCell>
                  <TableCell className="max-w-sm truncate">{entry.note}</TableCell>
                  <TableCell
                    className={`text-right ${entry.type === "outflow" ? "text-rose-300" : "text-emerald-300"}`}
                  >
                    {entry.type === "outflow" ? "−" : "+"}
                    {naira(entry.amount)}
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
