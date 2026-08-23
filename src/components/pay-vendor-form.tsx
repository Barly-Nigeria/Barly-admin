"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { payVendor } from "@/app/actions/vendors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PayVendorForm({ vendorId, max }: { vendorId: string; max: number }) {
  const [pending, start] = useTransition();
  if (max <= 0) {
    return <p className="text-xs text-muted-foreground">Settled</p>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Pay</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payout</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            start(async () => {
              try {
                await payVendor(vendorId, data);
                toast.success("Payout recorded");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not pay");
              }
            });
          }}
        >
          <label className="grid gap-1 text-sm">
            Amount (₦)
            <Input name="amount" type="number" min={1} max={max} defaultValue={max} required />
          </label>
          <label className="grid gap-1 text-sm">
            Method
            <select name="method" className="h-8 rounded-lg border bg-background px-2 text-sm">
              <option value="transfer">Transfer</option>
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
            </select>
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? "Paying…" : "Confirm payout"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
