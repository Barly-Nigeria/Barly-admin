"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { sendVendorSheets } from "@/app/actions/dispatch";
import { Button } from "@/components/ui/button";

export function SendVendorSheetsForm({
  orderId,
  vendors,
}: {
  orderId: string;
  vendors: { id: string; name: string; email: string; pieceCount: number }[];
}) {
  const [pending, start] = useTransition();

  if (vendors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This order has no SKUs mapped to a vendor yet.
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          try {
            await sendVendorSheets(orderId, data);
            toast.success("Vendor sheets sent (no prices included)");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not send");
          }
        });
      }}
    >
      <p className="text-sm text-muted-foreground">
        Vendors receive quantities and SKUs only. Customer prices stay on Barly.
      </p>
      <ul className="space-y-2">
        {vendors.map((vendor) => (
          <li key={vendor.id}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="vendorId"
                value={vendor.id}
                defaultChecked
                className="size-4 accent-red-500"
              />
              <span>
                {vendor.name}
                <span className="text-muted-foreground">
                  {" "}
                  · {vendor.pieceCount} pcs
                  {vendor.email ? ` · ${vendor.email}` : ""}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send sheets to vendors"}
      </Button>
    </form>
  );
}
