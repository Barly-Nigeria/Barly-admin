import Link from "next/link";
import { adminAuthed } from "@/lib/auth";
import { CatalogImportForm } from "@/components/catalog-import-form";
import { CatalogSubnav, FormError, PageHeader, TableShell } from "@/components/catalog-chrome";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CatalogImport } from "@/lib/barly-api";

export default async function CatalogImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const res = await adminAuthed<CatalogImport[]>("/v1/admin/catalog/imports");
  const jobs = res.body?.data ?? [];
  const loadError = error || (!res.ok ? res.message : null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import catalog CSV"
        description="Upload a UTF-8 CSV with one row per variant. Invalid files never change live products."
        back={{ href: "/catalog", label: "Catalog" }}
        actions={
          <Button variant="outline" asChild>
            <a href="/catalog-import-template.csv" download>
              Download template
            </a>
          </Button>
        }
      />
      <CatalogSubnav active="products" />
      <FormError message={loadError} />

      <div className="max-w-xl space-y-3 rounded-xl border p-4">
        <h2 className="text-sm font-medium">File format</h2>
        <p className="text-sm text-muted-foreground">
          Required columns: <code>product_slug</code>, <code>product_name</code>, <code>variant_sku</code>,{" "}
          <code>attribute_name</code>, <code>attribute_value</code>, <code>price</code>. Repeat product fields
          for extra variants. Categories are created from <code>category_slug</code> + <code>category_name</code>{" "}
          when missing. Image cells are URLs only.
        </p>
        <CatalogImportForm />
      </div>

      {jobs.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Recent imports</h2>
          <TableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.filename}</TableCell>
                    <TableCell>
                      <StatusBadge value={job.status} />
                    </TableCell>
                    <TableCell>{job.row_count}</TableCell>
                    <TableCell>{job.error_count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/catalog/import/${job.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </div>
      ) : null}
    </div>
  );
}
