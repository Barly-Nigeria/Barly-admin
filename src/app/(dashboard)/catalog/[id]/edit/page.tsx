import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { naira } from "@/lib/money";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AssignJoinsForm,
  ConfirmDeleteButton,
  CreateVariantForm,
  EditVariantRow,
  ProductEditorForm,
} from "@/components/catalog-forms";
import { FormError, PageHeader } from "@/components/catalog-chrome";
import { deleteVariantAction } from "@/app/actions/catalog";
import type {
  CatalogAddOnList,
  CatalogCategoryList,
  CatalogOccasion,
  CatalogPick,
  CatalogProductDetail,
} from "@/lib/barly-api";

export default async function ProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [productRes, categoriesRes, picksRes, occasionsRes, addOnsRes] = await Promise.all([
    adminAuthed<CatalogProductDetail>(`/v1/admin/products/${id}`),
    adminAuthed<CatalogCategoryList>("/v1/admin/categories?limit=100"),
    adminAuthed<CatalogPick[]>("/v1/admin/picks"),
    adminAuthed<CatalogOccasion[]>("/v1/admin/occasions"),
    adminAuthed<CatalogAddOnList>("/v1/admin/add-ons?limit=100"),
  ]);

  if (productRes.status === 404) {
    notFound();
  }

  const product = productRes.body?.data;
  const categories = categoriesRes.body?.data?.items ?? [];
  const picks = picksRes.body?.data ?? [];
  const occasions = occasionsRes.body?.data ?? [];
  const addOns = addOnsRes.body?.data?.items ?? [];
  const loadError = error || (!productRes.ok ? productRes.message : null);

  if (!product) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
        <FormError message={loadError ?? "Could not load this product."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${product.name}`}
        description="Update product fields, variants, and assignments."
        back={{ href: `/catalog/${product.id}`, label: product.name }}
      />
      <FormError message={loadError} />

      <Card>
        <CardHeader>
          <CardTitle>Product</CardTitle>
          <CardDescription>Archive from the view page to hide this from the guest store.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductEditorForm product={product} categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Inventory SKUs. Prices are in naira (same integer the API stores).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CreateVariantForm productId={product.id} />
          {product.variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variants yet.</p>
          ) : (
            <div className="space-y-4">
              {product.variants.map((variant) => (
                <div key={variant.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{naira(variant.price)}</span>
                    <ConfirmDeleteButton
                      action={deleteVariantAction}
                      id={variant.id}
                      extra={{ product_id: product.id }}
                      name={variant.sku}
                      description="Removes this SKU from the product."
                      size="sm"
                    />
                  </div>
                  <EditVariantRow variant={variant} productId={product.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Picks, occasions, add-ons</CardTitle>
          <CardDescription>Assign this product without quantities.</CardDescription>
        </CardHeader>
        <CardContent>
          <AssignJoinsForm product={product} picks={picks} occasions={occasions} addOns={addOns} />
        </CardContent>
      </Card>
    </div>
  );
}
