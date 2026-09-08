"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  assignProductJoinsAction,
  createAddOnAction,
  createCategoryAction,
  createOccasionAction,
  createPickAction,
  createProductAction,
  createVariantAction,
  presignCatalogImage,
  updateAddOnAction,
  updateCategoryAction,
  updateOccasionAction,
  updatePickAction,
  updateProductAction,
  updateVariantAction,
} from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  CatalogAddOn,
  CatalogCategory,
  CatalogOccasion,
  CatalogPick,
  CatalogProductDetail,
  CatalogVariant,
} from "@/lib/barly-api";

function Submit({
  label,
  pendingLabel,
  variant = "default",
  size = "default",
}: {
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 rounded border" />
      {label}
    </label>
  );
}

function FormActions({
  submit,
  pending,
  cancelHref,
  span = "sm:col-span-2",
}: {
  submit: string;
  pending: string;
  cancelHref: string;
  span?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${span}`}>
      <Submit label={submit} pendingLabel={pending} />
      <Button variant="outline" asChild>
        <Link href={cancelHref}>Cancel</Link>
      </Button>
    </div>
  );
}

const PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function preventSubmitWhileUploading(e: FormEvent<HTMLFormElement>) {
  if (e.currentTarget.querySelector("[data-image-uploading]")) {
    e.preventDefault();
  }
}

function ProductImageField({ initialUrl }: { initialUrl?: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [preview, setPreview] = useState(initialUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!PRODUCT_IMAGE_TYPES.has(file.type)) {
      setError("Use a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const local = URL.createObjectURL(file);
    objectUrlRef.current = local;
    setPreview(local);
    setUploading(true);

    try {
      const signed = await presignCatalogImage(file.type);
      if (!signed.ok) {
        setError(signed.message);
        return;
      }
      const put = await fetch(signed.data.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          ...signed.data.required_headers,
        },
        body: file,
      });
      if (!put.ok) {
        setError("Upload failed. Try a different image.");
        return;
      }
      setUrl(signed.data.public_url);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2" data-image-uploading={uploading ? "" : undefined}>
      <Label htmlFor="product-image">Image</Label>
      <div className="flex items-start gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-24 rounded-lg border object-cover" />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            No image
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Input
            id="product-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <p className="text-xs text-muted-foreground">
            {uploading ? "Uploading…" : "JPEG, PNG, WebP, or GIF."}
          </p>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
      <input type="hidden" name="base_image_url" value={url} />
    </div>
  );
}

export function CreateProductForm({ categories }: { categories: CatalogCategory[] }) {
  return (
    <form action={createProductAction} onSubmit={preventSubmitWhileUploading} className="grid gap-3 sm:grid-cols-2">
      <Field name="name" label="Name" required />
      <Field name="slug" label="Slug" placeholder="auto from name" />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="category_id">Category</Label>
        <select id="category_id" name="category_id" className="h-8 w-full rounded-lg border bg-background px-2.5 text-sm">
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <ProductImageField />
      <Check name="is_active" label="Active in store" defaultChecked />
      <Check name="is_popular" label="Popular" />
      <FormActions submit="Create product" pending="Creating…" cancelHref="/catalog" />
    </form>
  );
}

export function CreateCategoryForm() {
  return (
    <form action={createCategoryAction} className="grid gap-3 sm:grid-cols-2">
      <Field name="name" label="Name" required />
      <Field name="slug" label="Slug" placeholder="auto from name" />
      <Field name="image_url" label="Image URL" className="sm:col-span-2" />
      <Check name="is_active" label="Active" defaultChecked />
      <FormActions submit="Create category" pending="Creating…" cancelHref="/catalog/categories" />
    </form>
  );
}

export function EditCategoryForm({ category }: { category: CatalogCategory }) {
  return (
    <form action={updateCategoryAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={category.id} />
      <Field name="name" label="Name" defaultValue={category.name} required />
      <Field name="slug" label="Slug" defaultValue={category.slug} />
      <Field name="image_url" label="Image URL" defaultValue={category.image_url ?? ""} className="sm:col-span-2" />
      <Check name="is_active" label="Active" defaultChecked={category.is_active} />
      <FormActions submit="Save" pending="Saving…" cancelHref={`/catalog/categories/${category.id}`} />
    </form>
  );
}

export function CreateAddOnForm() {
  return (
    <form action={createAddOnAction} className="grid gap-3 sm:grid-cols-2">
      <Field name="name" label="Name" required />
      <Field name="slug" label="Slug" placeholder="auto from name" />
      <Field name="price" label="Price (NGN)" type="number" required />
      <Field name="stock_quantity" label="Stock" type="number" />
      <Field name="image_url" label="Image URL" className="sm:col-span-2" />
      <Check name="is_active" label="Active" defaultChecked />
      <FormActions submit="Create add-on" pending="Creating…" cancelHref="/catalog/add-ons" />
    </form>
  );
}

export function EditAddOnForm({ addOn }: { addOn: CatalogAddOn }) {
  return (
    <form action={updateAddOnAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={addOn.id} />
      <Field name="name" label="Name" defaultValue={addOn.name} required />
      <Field name="slug" label="Slug" defaultValue={addOn.slug} />
      <Field name="price" label="Price (NGN)" type="number" defaultValue={String(addOn.price)} />
      <Field name="stock_quantity" label="Stock" type="number" defaultValue={String(addOn.stock_quantity)} />
      <Field name="image_url" label="Image URL" defaultValue={addOn.image_url ?? ""} className="sm:col-span-2" />
      <Check name="is_active" label="Active" defaultChecked={addOn.is_active} />
      <FormActions submit="Save" pending="Saving…" cancelHref={`/catalog/add-ons/${addOn.id}`} />
    </form>
  );
}

export function ProductEditorForm({
  product,
  categories,
}: {
  product: CatalogProductDetail;
  categories: CatalogCategory[];
}) {
  return (
    <form action={updateProductAction} onSubmit={preventSubmitWhileUploading} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={product.id} />
      <Field name="name" label="Name" defaultValue={product.name} required />
      <Field name="slug" label="Slug" defaultValue={product.slug} />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="category_id">Category</Label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={product.category?.id ?? ""}
          className="h-8 w-full rounded-lg border bg-background px-2.5 text-sm"
        >
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <ProductImageField initialUrl={product.base_image_url} />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={product.description ?? ""} rows={3} />
      </div>
      <Check name="is_active" label="Active in store" defaultChecked={product.is_active} />
      <Check name="is_popular" label="Popular" defaultChecked={product.is_popular} />
      <FormActions submit="Save product" pending="Saving…" cancelHref={`/catalog/${product.id}`} />
    </form>
  );
}

export function CreateVariantForm({ productId }: { productId: string }) {
  return (
    <form action={createVariantAction} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="product_id" value={productId} />
      <Field name="sku" label="SKU" required />
      <Field name="attribute_name" label="Attribute" placeholder="Pack Size" required />
      <Field name="attribute_value" label="Value" placeholder="6-Pack" required />
      <Field name="price" label="Price (NGN)" type="number" required />
      <Field name="stock_quantity" label="Stock" type="number" />
      <Field name="weight_kg" label="Weight (kg)" type="number" step="0.01" />
      <Check name="is_active" label="Active" defaultChecked />
      <div className="sm:col-span-3">
        <Submit label="Add variant" pendingLabel="Adding…" />
      </div>
    </form>
  );
}

export function EditVariantRow({ variant, productId }: { variant: CatalogVariant; productId: string }) {
  return (
    <form action={updateVariantAction} className="grid gap-2 sm:grid-cols-8 sm:items-end">
      <input type="hidden" name="id" value={variant.id} />
      <input type="hidden" name="product_id" value={productId} />
      <Field name="sku" label="SKU" defaultValue={variant.sku} />
      <Field name="attribute_name" label="Attribute" defaultValue={variant.attribute_name} />
      <Field name="attribute_value" label="Value" defaultValue={variant.attribute_value} />
      <Field name="price" label="Price" type="number" defaultValue={String(variant.price)} />
      <Field name="stock_quantity" label="Stock" type="number" defaultValue={String(variant.stock_quantity)} />
      <Field name="weight_kg" label="Kg" type="number" step="0.01" defaultValue={String(variant.weight_kg)} />
      <Check name="is_active" label="Active" defaultChecked={variant.is_active} />
      <Submit label="Save" pendingLabel="Saving…" size="sm" variant="outline" />
    </form>
  );
}

export function AssignJoinsForm({
  product,
  picks,
  occasions,
  addOns,
}: {
  product: CatalogProductDetail;
  picks: CatalogPick[];
  occasions: CatalogOccasion[];
  addOns: CatalogAddOn[];
}) {
  const pickSet = new Set(product.pick_ids ?? []);
  const occasionSet = new Set(product.occasion_ids ?? []);
  const addOnSet = new Set(product.add_on_ids ?? []);
  return (
    <form action={assignProductJoinsAction} className="space-y-4">
      <input type="hidden" name="id" value={product.id} />
      <JoinGroup title="Picks" name="pick_ids" items={picks} selected={pickSet} />
      <JoinGroup title="Occasions" name="occasion_ids" items={occasions} selected={occasionSet} />
      <JoinGroup title="Add-ons" name="add_on_ids" items={addOns} selected={addOnSet} />
      <Submit label="Save assignments" pendingLabel="Saving…" />
    </form>
  );
}

function JoinGroup({
  title,
  name,
  items,
  selected,
}: {
  title: string;
  name: string;
  items: { id: string; name: string }[];
  selected: Set<string>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None yet.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={name}
                value={item.id}
                defaultChecked={selected.has(item.id)}
                className="size-4 rounded border"
              />
              {item.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function ArchiveButton({ action, id }: { action: (formData: FormData) => Promise<void>; id: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Submit label="Archive" pendingLabel="Hiding…" variant="outline" />
    </form>
  );
}

export function ConfirmDeleteButton({
  action,
  id,
  extra,
  name,
  description,
  size = "default",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  extra?: Record<string, string>;
  name: string;
  description?: string;
  size?: "default" | "sm";
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size={size}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>{description ?? "This cannot be undone."}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            {extra
              ? Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
              : null}
            <Submit label="Delete" pendingLabel="Deleting…" variant="destructive" />
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CreatePickForm() {
  return (
    <form action={createPickAction} className="grid gap-3 sm:grid-cols-2">
      <Field name="name" label="Name" required />
      <Field name="sub_text" label="Subtitle" />
      <Field name="image_url" label="Image URL" className="sm:col-span-2" />
      <Field name="starting_price" label="Starting price (NGN)" type="number" />
      <Field name="tags" label="Tags" placeholder="birthday, featured" />
      <Check name="is_active" label="Active" defaultChecked />
      <FormActions submit="Create pick" pending="Creating…" cancelHref="/picks" />
    </form>
  );
}

export function EditPickForm({ pick }: { pick: CatalogPick }) {
  return (
    <form action={updatePickAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={pick.id} />
      <Field name="name" label="Name" defaultValue={pick.name} required />
      <Field name="sub_text" label="Subtitle" defaultValue={pick.sub_text ?? ""} />
      <Field name="image_url" label="Image URL" defaultValue={pick.image_url ?? ""} className="sm:col-span-2" />
      <Field
        name="starting_price"
        label="Starting price (NGN)"
        type="number"
        defaultValue={pick.starting_price != null ? String(pick.starting_price) : ""}
      />
      <Field name="tags" label="Tags" defaultValue={(pick.tags ?? []).join(", ")} />
      <Check name="is_active" label="Active" defaultChecked={pick.is_active} />
      <FormActions submit="Save" pending="Saving…" cancelHref={`/picks/${pick.id}`} />
    </form>
  );
}

export function CreateOccasionForm() {
  return (
    <form action={createOccasionAction} className="grid gap-3 sm:grid-cols-2">
      <Field name="name" label="Name" required />
      <Field name="icon" label="Icon URL" />
      <Check name="is_active" label="Active" defaultChecked />
      <FormActions submit="Create occasion" pending="Creating…" cancelHref="/occasions" />
    </form>
  );
}

export function EditOccasionForm({ occasion }: { occasion: CatalogOccasion }) {
  return (
    <form action={updateOccasionAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={occasion.id} />
      <Field name="name" label="Name" defaultValue={occasion.name} required />
      <Field name="icon" label="Icon URL" defaultValue={occasion.icon ?? ""} />
      <Check name="is_active" label="Active" defaultChecked={occasion.is_active} />
      <FormActions submit="Save" pending="Saving…" cancelHref={`/occasions/${occasion.id}`} />
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
  placeholder,
  className,
  step,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  step?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={step}
      />
    </div>
  );
}
