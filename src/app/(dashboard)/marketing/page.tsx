import { prisma } from "@/lib/prisma";
import { daysUntilBirthday, formatDate, formatDateTime } from "@/lib/dates";
import { campaignAudienceLabel, occasionLabel, OCCASIONS } from "@/lib/labels";
import { AGE_BANDS } from "@/lib/age-group";
import { EmptyState } from "@/components/empty-state";
import { MarketingForms } from "@/components/marketing-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function MarketingPage() {
  const [customers, campaigns] = await Promise.all([
    prisma.customer.findMany({ include: { favoritePackage: true } }),
    prisma.campaign.findMany({ orderBy: { sentAt: "desc" } }),
  ]);

  const upcoming = customers
    .map((c) => ({ ...c, inDays: daysUntilBirthday(c.birthday) }))
    .filter((c) => c.inDays <= 14)
    .sort((a, b) => a.inDays - b.inDays);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Newsletters and birthday reminders are recorded here. Delivery is simulated — no
          mailbox is contacted.
        </p>
      </div>

      <MarketingForms
        occasions={[...OCCASIONS]}
        ageBands={[...AGE_BANDS]}
        birthdayCount={upcoming.length}
      />

      <Card>
        <CardHeader>
          <CardTitle>Birthdays in the next 14 days</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody in this window.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {upcoming.map((c) => (
                <li key={c.id} className="flex justify-between gap-3 rounded-lg border px-3 py-2">
                  <span>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {formatDate(c.birthday)} · {occasionLabel(c.favoriteOccasion)}
                    </span>
                  </span>
                  <span className="text-amber-200">{c.inDays === 0 ? "Today" : `${c.inDays}d`}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns sent"
          description="Send a newsletter or birthday batch to see history."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{formatDateTime(c.sentAt)}</TableCell>
                  <TableCell className="capitalize">{c.type.replaceAll("_", " ")}</TableCell>
                  <TableCell>{campaignAudienceLabel(c.audience)}</TableCell>
                  <TableCell>
                    <p>{c.subject}</p>
                    <p className="max-w-md truncate text-xs text-muted-foreground">{c.body}</p>
                  </TableCell>
                  <TableCell className="text-right">{c.recipientCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
