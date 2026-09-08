"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCatalogImport, getCatalogImportErrors } from "@/app/actions/catalog";
import { FormError, MetaList, TableShell } from "@/components/catalog-chrome";
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
import type { CatalogImport, CatalogImportErrorPage } from "@/lib/barly-api";

const TERMINAL = new Set(["completed", "failed"]);

export function CatalogImportStatus({
  initial,
  initialErrors,
}: {
  initial: CatalogImport;
  initialErrors: CatalogImportErrorPage | null;
}) {
  const [job, setJob] = useState(initial);
  const [errors, setErrors] = useState(initialErrors);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(initialErrors?.page ?? 1);

  useEffect(() => {
    if (TERMINAL.has(job.status)) return;

    let cancelled = false;
    const tick = async () => {
      const next = await getCatalogImport(job.id);
      if (cancelled) return;
      if (!next.ok) {
        setLoadError(next.message);
        return;
      }
      setJob(next.data);
      setLoadError(null);
      if (next.data.status === "failed" && next.data.error_count > 0) {
        const pageData = await getCatalogImportErrors(job.id, 1);
        if (!cancelled && pageData.ok) {
          setErrors(pageData.data);
          setPage(1);
        }
      }
    };

    const id = window.setInterval(() => {
      void tick();
    }, 2000);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [job.id, job.status]);

  async function loadErrorPage(nextPage: number) {
    const pageData = await getCatalogImportErrors(job.id, nextPage);
    if (!pageData.ok) {
      setLoadError(pageData.message);
      return;
    }
    setErrors(pageData.data);
    setPage(nextPage);
  }

  const totalPages = errors ? Math.max(1, Math.ceil(errors.total / errors.limit)) : 1;

  return (
    <div className="space-y-6">
      <FormError message={loadError} />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge value={job.status} />
        <span className="text-sm text-muted-foreground">{job.filename}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Progress</span>
          <span>{job.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${job.progress}%` }} />
        </div>
      </div>

      <MetaList
        items={[
          { label: "Rows staged", value: job.row_count },
          { label: "Categories created", value: job.created_categories },
          { label: "Products created", value: job.created_products },
          { label: "Products updated", value: job.updated_products },
          { label: "Variants created", value: job.created_variants },
          { label: "Variants updated", value: job.updated_variants },
          { label: "Row errors", value: job.error_count },
        ]}
      />

      {job.status === "failed" ? (
        <p className="text-sm text-destructive">
          {job.failure_message || "Import failed."} Live catalog rows from this file were not published.
          Fix the CSV and upload again from the import page.
        </p>
      ) : null}

      {job.status === "completed" ? (
        <p className="text-sm text-muted-foreground">
          Import finished. Existing products were updated by slug and SKU; nothing was duplicated.
        </p>
      ) : null}

      {job.status === "failed" && errors && errors.total > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Row errors</h2>
          <TableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.items.map((item) => (
                  <TableRow key={`${item.row}-${item.field}-${item.message}`}>
                    <TableCell>{item.row}</TableCell>
                    <TableCell>{item.field}</TableCell>
                    <TableCell>{item.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {page} of {totalPages} · {errors.total} errors
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => void loadErrorPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => void loadErrorPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/catalog/import">New import</Link>
        </Button>
        <Button asChild>
          <Link href="/catalog">Back to catalog</Link>
        </Button>
      </div>
    </div>
  );
}
