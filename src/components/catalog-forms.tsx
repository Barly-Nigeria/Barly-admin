"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  createItem,
  createProduct,
  updateItemPrice,
  updateProductPrice,
} from "@/app/actions/catalog";
import { OCCASIONS } from "@/lib/labels";
import { naira } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateProductForm() {
  const [pending, start] = useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New package</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create package</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            start(async () => {
              try {
                await createProduct(data);
                toast.success("Package created");
                event.currentTarget.reset();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not create");
              }
            });
          }}
        >
          <Field label="Name" name="name" required />
          <label className="grid gap-1 text-sm">
            Occasion
            <select name="occasion" required className={selectClass}>
              {OCCASIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <Field label="Price (₦)" name="price" type="number" required />
          <label className="grid gap-1 text-sm">
            Description
            <Textarea name="description" rows={3} />
          </label>
          <input type="hidden" name="status" value="active" />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save package"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateItemForm({
  vendors,
}: {
  vendors: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New item</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create item</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            start(async () => {
              try {
                await createItem(data);
                toast.success("Item created");
                event.currentTarget.reset();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not create");
              }
            });
          }}
        >
          <Field label="Name" name="name" required />
          <Field label="SKU" name="sku" required />
          <label className="grid gap-1 text-sm">
            Vendor
            <select name="vendorId" required className={selectClass}>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Cost" name="cost" type="number" />
            <Field label="Sell" name="sellPrice" type="number" required />
            <Field label="Stock" name="stock" type="number" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PriceForm({
  id,
  field,
  value,
}: {
  id: string;
  field: "price" | "sellPrice";
  value: number;
}) {
  const [pending, start] = useTransition();
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          try {
            if (field === "price") await updateProductPrice(id, data);
            else await updateItemPrice(id, data);
            toast.success("Price updated");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not update");
          }
        });
      }}
    >
      <span className="sr-only">{naira(value)}</span>
      <Input
        name={field}
        type="number"
        defaultValue={value}
        className="h-8 w-28"
        min={1}
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Set"}
      </Button>
    </form>
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
      <Input id={name} name={name} type={type} required={required} min={type === "number" ? 0 : undefined} />
    </label>
  );
}

const selectClass = "h-8 rounded-lg border bg-background px-2 text-sm";
