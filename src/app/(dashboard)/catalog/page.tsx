import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { occasionLabel, vendorCategoryLabel } from "@/lib/labels";
import { formatPickLine } from "@/lib/catalog-picks";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreateItemForm,
  CreateProductForm,
  ItemPhotoForm,
  ItemPicksForm,
  ItemThumb,
  PriceForm,
  ProductPicksForm,
} from "@/components/catalog-forms";
import { cn } from "@/lib/utils";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const { tab } = await searchParams;
  const view = tab === "items" ? "items" : "packages";

  const [products, items, vendors] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { orders: true, items: true } },
        items: { include: { item: true }, orderBy: { item: { name: "asc" } } },
      },
    }),
    prisma.item.findMany({
      orderBy: { name: "asc" },
      include: {
        vendor: true,
        products: { include: { product: true }, orderBy: { product: { name: "asc" } } },
      },
    }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);

  const itemOptions = items.map((item) => ({ id: item.id, name: item.name, sku: item.sku }));
  const packageOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    occasion: occasionLabel(product.occasion),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
        <p className="text-sm text-muted-foreground">
          Packages guests book and the bottles, mixers, and rentals inside them.
          {isAdmin
            ? " Admins can pick SKUs into packages, add photos, and change prices."
            : " Staff can view prices; admins change them."}
        </p>
      </div>

      <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
        <Link
          href="/catalog"
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium",
            view === "packages" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Packages
        </Link>
        <Link
          href="/catalog?tab=items"
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium",
            view === "items" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Items
        </Link>
      </div>

      {view === "packages" ? (
        <div className="space-y-4">
          {isAdmin && <CreateProductForm items={itemOptions} />}
          {products.length === 0 ? (
            <EmptyState
              title="No packages yet"
              description="Create a Gold Birthday Bar or wedding toast to start selling."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Occasion</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Picks</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Price</TableHead>
                    {isAdmin ? <TableHead></TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p className="font-medium">{product.name}</p>
                        <p className="max-w-xs text-xs text-muted-foreground">{product.description}</p>
                      </TableCell>
                      <TableCell>{occasionLabel(product.occasion)}</TableCell>
                      <TableCell>
                        <StatusBadge value={product.status} />
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">
                        {product.items.length === 0
                          ? "No picks"
                          : product.items.map((row) => formatPickLine(row.quantity, row.item.name)).join(" · ")}
                      </TableCell>
                      <TableCell>{product._count.orders}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <PriceForm id={product.id} field="price" value={product.price} />
                        ) : (
                          naira(product.price)
                        )}
                      </TableCell>
                      {isAdmin ? (
                        <TableCell>
                          <ProductPicksForm
                            productId={product.id}
                            productName={product.name}
                            items={itemOptions}
                            selected={product.items.map((row) => ({
                              id: row.itemId,
                              quantity: row.quantity,
                            }))}
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {isAdmin && (
            <CreateItemForm
              vendors={vendors.map((v) => ({
                id: v.id,
                name: `${v.name} (${vendorCategoryLabel(v.category)})`,
              }))}
              packages={packageOptions}
            />
          )}
          {items.length === 0 ? (
            <EmptyState
              title="No items yet"
              description="Add spirits, mixers, ice, and glassware from your suppliers."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Picks</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Sell price</TableHead>
                    {isAdmin ? <TableHead></TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {isAdmin ? (
                          <ItemPhotoForm itemId={item.id} itemName={item.name} imageUrl={item.imageUrl} />
                        ) : (
                          <ItemThumb src={item.imageUrl} alt={item.name} />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell>{item.vendor.name}</TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">
                        {item.products.length === 0
                          ? "Unassigned"
                          : item.products
                              .map((row) => formatPickLine(row.quantity, row.product.name))
                              .join(" · ")}
                      </TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>{naira(item.cost)}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <PriceForm id={item.id} field="sellPrice" value={item.sellPrice} />
                        ) : (
                          naira(item.sellPrice)
                        )}
                      </TableCell>
                      {isAdmin ? (
                        <TableCell>
                          <ItemPicksForm
                            itemId={item.id}
                            itemName={item.name}
                            packages={packageOptions}
                            selected={item.products.map((row) => ({
                              id: row.productId,
                              quantity: row.quantity,
                            }))}
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
