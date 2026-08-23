import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { naira } from "@/lib/money";
import { occasionLabel, vendorCategoryLabel } from "@/lib/labels";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateItemForm, CreateProductForm, PriceForm } from "@/components/catalog-forms";

export default async function CatalogPage() {
  const session = await getSession();
  const isManager = session?.role === "manager";

  const [products, items, vendors] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { orders: true, items: true } } },
    }),
    prisma.item.findMany({
      orderBy: { name: "asc" },
      include: { vendor: true },
    }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
        <p className="text-sm text-muted-foreground">
          Packages guests book and the bottles, mixers, and rentals inside them.
          {isManager ? " Managers can add SKUs and change prices." : " Staff can view prices; managers change them."}
        </p>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
        </TabsList>
        <TabsContent value="packages" className="space-y-4">
          {isManager && <CreateProductForm />}
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
                    <TableHead>Items</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p className="font-medium">{product.name}</p>
                        <p className="max-w-xs text-xs text-muted-foreground">
                          {product.description}
                        </p>
                      </TableCell>
                      <TableCell>{occasionLabel(product.occasion)}</TableCell>
                      <TableCell>
                        <StatusBadge value={product.status} />
                      </TableCell>
                      <TableCell>{product._count.items}</TableCell>
                      <TableCell>{product._count.orders}</TableCell>
                      <TableCell>
                        {isManager ? (
                          <PriceForm
                            id={product.id}
                            field="price"
                            value={product.price}
                          />
                        ) : (
                          naira(product.price)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="items" className="space-y-4">
          {isManager && (
            <CreateItemForm
              vendors={vendors.map((v) => ({
                id: v.id,
                name: `${v.name} (${vendorCategoryLabel(v.category)})`,
              }))}
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
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Sell price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell>{item.vendor.name}</TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>{naira(item.cost)}</TableCell>
                      <TableCell>
                        {isManager ? (
                          <PriceForm id={item.id} field="sellPrice" value={item.sellPrice} />
                        ) : (
                          naira(item.sellPrice)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
