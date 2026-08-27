"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createVendor, deleteVendor } from "@/app/actions/vendors";
import { VENDOR_CATEGORIES } from "@/lib/labels";
import { naira } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const selectClass = "h-8 rounded-lg border bg-background px-2 text-sm";

export function AddVendorForm() {
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        start(async () => {
          try {
            await createVendor(data);
            toast.success("Vendor onboarded");
            form.reset();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not add vendor");
          }
        });
      }}
    >
      <Field label="Company name" name="name" required />
      <label className="grid gap-1 text-sm">
        <Label htmlFor="category">Category</Label>
        <select id="category" name="category" required className={selectClass} defaultValue="other">
          {VENDOR_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <Field label="Email" name="email" type="email" required />
      <Field label="Phone" name="phone" type="tel" />
      <label className="grid gap-1 text-sm sm:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" rows={2} required placeholder="Street, building, landmark" />
      </label>
      <Field label="City" name="city" />
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : "Onboard vendor"}
        </Button>
      </div>
    </form>
  );
}

export function DeleteVendorButton({
  vendorId,
  name,
  itemCount,
  balanceDue,
}: {
  vendorId: string;
  name: string;
  itemCount: number;
  balanceDue: number;
}) {
  const [pending, start] = useTransition();

  if (itemCount > 0) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled
        title={`Move or delete ${itemCount} catalog item${itemCount === 1 ? "" : "s"} first`}
      >
        Remove SKUs first
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="destructive">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {name}?</DialogTitle>
          <DialogDescription>
            This removes the supplier and their payout history. Cash records stay in the ledger.
            {balanceDue > 0
              ? ` Outstanding balance of ${naira(balanceDue)} will be dropped from vendor totals.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              start(async () => {
                try {
                  await deleteVendor(vendorId);
                  toast.success(`${name} removed`);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not delete");
                }
              });
            }}
          >
            {pending ? "Removing…" : "Delete vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} autoComplete="off" />
    </label>
  );
}
