"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { sendBirthdayReminders, sendNewsletter } from "@/app/actions/marketing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MarketingForms({
  occasions,
  ageBands,
  birthdayCount,
}: {
  occasions: { id: string; label: string }[];
  ageBands: { id: string; label: string }[];
  birthdayCount: number;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Send newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              start(async () => {
                try {
                  await sendNewsletter(data);
                  toast.success("Newsletter recorded as sent");
                  event.currentTarget.reset();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not send");
                }
              });
            }}
          >
            <label className="grid gap-1 text-sm">
              Audience
              <select name="audience" className="h-8 rounded-lg border bg-background px-2 text-sm">
                <option value="all">All customers</option>
                {occasions.map((o) => (
                  <option key={o.id} value={`occasion:${o.id}`}>
                    Favourite: {o.label}
                  </option>
                ))}
                {ageBands.map((b) => (
                  <option key={b.id} value={`age:${b.id}`}>
                    Age {b.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Subject
              <Input name="subject" required placeholder="Weekend slots in Lekki are filling" />
            </label>
            <label className="grid gap-1 text-sm">
              Body
              <Textarea
                name="body"
                required
                rows={5}
                placeholder="Tell guests about a package, a tasting, or a seasonal menu."
              />
            </label>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send newsletter"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Birthday reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {birthdayCount === 0
              ? "No guests have a birthday in the next 14 days."
              : `${birthdayCount} guest${birthdayCount === 1 ? "" : "s"} have a birthday in the next 14 days.`}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={pending || birthdayCount === 0}
            onClick={() => {
              start(async () => {
                try {
                  await sendBirthdayReminders();
                  toast.success("Birthday reminders recorded");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not send");
                }
              });
            }}
          >
            Send birthday batch
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
