"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import {
  createItem,
  createProduct,
  setItemPicks,
  setProductPicks,
  updateItemImage,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ItemOption = { id: string; name: string; sku: string };
type PackageOption = { id: string; name: string; occasion: string };
type SelectedPick = { id: string; quantity: number };

const selectClass = "h-8 rounded-lg border bg-background px-2 text-sm";
const dialogClass = "max-h-[85vh] overflow-y-auto sm:max-w-lg";

export function CreateProductForm({ items }: { items: ItemOption[] }) {
  const [pending, start] = useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New package</Button>
      </DialogTrigger>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle>Create package</DialogTitle>
          <DialogDescription>Set the price, then pick the bottles and rentals inside it.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            start(async () => {
              try {
                await createProduct(data);
                toast.success("Package created");
                form.reset();
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
          <CatalogPickList
            legend="Item picks"
            empty="Add SKUs on the Items tab first, then pick them here."
            idField="itemId"
            qtyPrefix="itemQty"
            options={items.map((item) => ({
              id: item.id,
              label: item.name,
              hint: item.sku,
            }))}
          />
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
  packages,
}: {
  vendors: { id: string; name: string }[];
  packages: PackageOption[];
}) {
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New item</Button>
      </DialogTrigger>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle>Create item</DialogTitle>
          <DialogDescription>Add a photo, then pick which packages should include this SKU.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            start(async () => {
              try {
                await createItem(data);
                toast.success("Item created");
                form.reset();
                setPreview(null);
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
          <ImageField preview={preview} onPreview={setPreview} />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Cost" name="cost" type="number" />
            <Field label="Sell" name="sellPrice" type="number" required />
            <Field label="Stock" name="stock" type="number" />
          </div>
          <CatalogPickList
            legend="Package picks"
            empty="No packages yet. Create a package, then attach this SKU."
            idField="packageId"
            qtyPrefix="packageQty"
            options={packages.map((pkg) => ({
              id: pkg.id,
              label: pkg.name,
              hint: pkg.occasion,
            }))}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProductPicksForm({
  productId,
  productName,
  items,
  selected,
}: {
  productId: string;
  productName: string;
  items: ItemOption[];
  selected: SelectedPick[];
}) {
  return (
    <PicksDialog
      title={`Picks · ${productName}`}
      description="Tick the SKUs in this package and set how many of each."
      triggerLabel="Picks"
      successMessage="Package picks saved"
      onSave={(data) => setProductPicks(productId, data)}
    >
      <CatalogPickList
        legend="Item picks"
        empty="Add SKUs on the Items tab first."
        idField="itemId"
        qtyPrefix="itemQty"
        options={items.map((item) => {
          const current = selected.find((s) => s.id === item.id);
          return {
            id: item.id,
            label: item.name,
            hint: item.sku,
            defaultChecked: Boolean(current),
            defaultQty: current?.quantity ?? 1,
          };
        })}
      />
    </PicksDialog>
  );
}

export function ItemPicksForm({
  itemId,
  itemName,
  packages,
  selected,
}: {
  itemId: string;
  itemName: string;
  packages: PackageOption[];
  selected: SelectedPick[];
}) {
  return (
    <PicksDialog
      title={`Picks · ${itemName}`}
      description="Tick packages that should include this SKU."
      triggerLabel="Picks"
      successMessage="Item picks saved"
      onSave={(data) => setItemPicks(itemId, data)}
    >
      <CatalogPickList
        legend="Package picks"
        empty="No packages yet."
        idField="packageId"
        qtyPrefix="packageQty"
        options={packages.map((pkg) => {
          const current = selected.find((s) => s.id === pkg.id);
          return {
            id: pkg.id,
            label: pkg.name,
            hint: pkg.occasion,
            defaultChecked: Boolean(current),
            defaultQty: current?.quantity ?? 1,
          };
        })}
      />
    </PicksDialog>
  );
}

export function ItemPhotoForm({
  itemId,
  itemName,
  imageUrl,
}: {
  itemId: string;
  itemName: string;
  imageUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPreview(null);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="block rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={imageUrl ? `Replace photo for ${itemName}` : `Add photo for ${itemName}`}
        >
          <ItemThumb src={imageUrl} alt={itemName} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{imageUrl ? "Replace photo" : "Add photo"}</DialogTitle>
          <DialogDescription>{itemName}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            start(async () => {
              try {
                await updateItemImage(itemId, data);
                toast.success("Photo saved");
                setOpen(false);
                setPreview(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not save photo");
              }
            });
          }}
        >
          <ImageField preview={preview ?? (imageUrl || null)} onPreview={setPreview} required />
          <Button type="submit" disabled={pending}>
            {pending ? "Uploading…" : "Save photo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ItemThumb({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <span className="flex size-12 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
        No photo
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="size-12 rounded-md object-cover ring-1 ring-foreground/10"
    />
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

function PicksDialog({
  title,
  description,
  triggerLabel,
  successMessage,
  onSave,
  children,
}: {
  title: string;
  description: string;
  triggerLabel: string;
  successMessage: string;
  onSave: (data: FormData) => Promise<void>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            start(async () => {
              try {
                await onSave(data);
                toast.success(successMessage);
                setOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not save picks");
              }
            });
          }}
        >
          {children}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save picks"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CatalogPickList({
  legend,
  empty,
  idField,
  qtyPrefix,
  options,
}: {
  legend: string;
  empty: string;
  idField: string;
  qtyPrefix: string;
  options: {
    id: string;
    label: string;
    hint?: string;
    defaultChecked?: boolean;
    defaultQty?: number;
  }[];
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
          {options.map((option) => (
            <li key={option.id} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={idField}
                  value={option.id}
                  defaultChecked={option.defaultChecked}
                  className="size-4 accent-red-500"
                />
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="block truncate text-xs text-muted-foreground">{option.hint}</span>
                  ) : null}
                </span>
              </label>
              <Input
                name={`${qtyPrefix}-${option.id}`}
                type="number"
                min={1}
                defaultValue={option.defaultQty ?? 1}
                aria-label={`Quantity for ${option.label}`}
                className="h-8 w-16 shrink-0"
              />
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

function ImageField({
  preview,
  onPreview,
  required,
}: {
  preview: string | null;
  onPreview: (url: string | null) => void;
  required?: boolean;
}) {
  const inputId = useId();
  return (
    <label className="grid gap-1 text-sm">
      <Label htmlFor={inputId}>Photo</Label>
      {preview ? (
        <img src={preview} alt="" className="h-28 w-full rounded-lg object-cover ring-1 ring-foreground/10" />
      ) : null}
      <Input
        id={inputId}
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        required={required}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            onPreview(null);
            return;
          }
          onPreview(URL.createObjectURL(file));
        }}
      />
      <span className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF · up to 3 MB</span>
    </label>
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
