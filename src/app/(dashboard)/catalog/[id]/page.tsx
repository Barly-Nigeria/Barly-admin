import Link from "next/link";
import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { naira } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CatalogImage,
  ChipList,
  FormError,
  MetaList,
  PageHeader,
  TableShell,
} from "@/components/catalog-chrome";
import { ArchiveButton, ConfirmDeleteButton } from "@/components/catalog-forms";
import { archiveProductAction, deleteProductAction } from "@/app/actions/catalog";
import type {
  CatalogOccasion,
  CatalogPick,
  CatalogProductDetail,
} from "@/lib/barly-api";

export default async function ProductViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [productRes, picksRes, occasionsRes] = await Promise.all([
    adminAuthed<CatalogProductDetail>(`/v1/admin/products/${id}`),
    adminAuthed<CatalogPick[]>("/v1/admin/picks"),
    adminAuthed<CatalogOccasion[]>("/v1/admin/occasions"),
  ]);

  if (productRes.status === 404) {
    notFound();
  }

  const product = productRes.body?.data;
  const picks = picksRes.body?.data ?? [];
  const occasions = occasionsRes.body?.data ?? [];
  const loadError = error || (!productRes.ok ? productRes.message : null);

  if (!product) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Product</h1>
        <FormError message={loadError ?? "Could not load this product."} />
      </div>
    );
  }

  const pickNames = picks.filter((p) => product.pick_ids?.includes(p.id)).map((p) => p.name);
  const occasionNames = occasions.filter((o) => product.occasion_ids?.includes(o.id)).map((o) => o.name);
  const addOnNames = (product.add_ons ?? []).map((a) => a.name);

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={
          <>
            {product.slug} · {product.currency} ·{" "}
            <StatusBadge value={product.is_active ? "active" : "inactive"} />
            {product.is_popular ? (
              <>
                {" "}
                · <StatusBadge value="popular" />
              </>
            ) : null}
          </>
        }
        back={{ href: "/catalog", label: "Catalog" }}
        actions={
          <>
            <Button asChild>
              <Link href={`/catalog/${product.id}/edit`}>Edit</Link>
            </Button>
            {product.is_active ? <ArchiveButton action={archiveProductAction} id={product.id} /> : null}
            <ConfirmDeleteButton
              action={deleteProductAction}
              id={product.id}
              name={product.name}
              description="Removes this product and its variants from the catalog."
            />
          </>
        }
      />
      <FormError message={loadError} />

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row">
          <CatalogImage src={product.base_image_url} alt={product.name} />
          <MetaList
            items={[
              { label: "Category", value: product.category?.name ?? "—" },
              {
                label: "From",
                value: product.starting_price != null ? naira(product.starting_price) : "—",
              },
              { label: "Description", value: product.description?.trim() || "—" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Inventory SKUs. Prices are in naira.</CardDescription>
        </CardHeader>
        <CardContent>
          {product.variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variants yet. Add them from Edit.</p>
          ) : (
            <TableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Attribute</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-medium">{variant.sku}</TableCell>
                      <TableCell>
                        {variant.attribute_name}: {variant.attribute_value}
                      </TableCell>
                      <TableCell>{naira(variant.price)}</TableCell>
                      <TableCell>{variant.stock_quantity}</TableCell>
                      <TableCell>{variant.weight_kg ? `${variant.weight_kg} kg` : "—"}</TableCell>
                      <TableCell>
                        <StatusBadge value={variant.is_active ? "active" : "inactive"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>Picks, occasions, and add-ons linked to this product.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Picks</p>
            <ChipList items={pickNames} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Occasions</p>
            <ChipList items={occasionNames} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Add-ons</p>
            <ChipList items={addOnNames} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
