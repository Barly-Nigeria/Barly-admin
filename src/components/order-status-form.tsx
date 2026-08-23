"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/actions/orders";
import { ORDER_STATUSES } from "@/lib/labels";
import { Button } from "@/components/ui/button";

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const next = String(form.get("status"));
        start(async () => {
          try {
            await updateOrderStatus(orderId, next);
            toast.success("Order status updated");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not update");
          }
        });
      }}
    >
      <label className="grid gap-1 text-sm">
        Status
        <select
          name="status"
          defaultValue={status}
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
