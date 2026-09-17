"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CatalogImage, TableShell } from "@/components/catalog-chrome";
import { StatusBadge } from "@/components/status-badge";
import {
  BulkSelectBar,
  HeaderCheckbox,
  RowCheckbox,
  useBulkSelection,
} from "@/components/bulk-select";
import { bulkArchiveOccasionsAction } from "@/app/actions/catalog";
import type { CatalogOccasion } from "@/lib/barly-api";

function imageSrc(src?: string | null) {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) return src;
  return null;
}

export function OccasionsBulkTable({ initial }: { initial: CatalogOccasion[] }) {
  const [items, setItems] = useState(initial);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const selection = useBulkSelection(ids);

  return (
    <div className="space-y-2">
      <BulkSelectBar
        selectedIds={selection.selectedIds}
        label="occasions"
        onDeactivate={bulkArchiveOccasionsAction}
        onDone={(deactivatedIds) => {
          const deactivated = new Set(deactivatedIds);
          selection.clear();
          setItems((prev) =>
            prev.map((item) => (deactivated.has(item.id) ? { ...item, is_active: false } : item)),
          );
        }}
      />
      <TableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <HeaderCheckbox
                  allSelected={selection.allSelected}
                  someSelected={selection.someSelected}
                  onToggleAll={selection.toggleAllLoaded}
                />
              </TableHead>
              <TableHead className="w-14">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((occasion) => (
              <TableRow key={occasion.id}>
                <TableCell>
                  <RowCheckbox
                    checked={selection.selected.has(occasion.id)}
                    onCheckedChange={(checked) => selection.toggleOne(occasion.id, checked)}
                    ariaLabel={`Select ${occasion.name}`}
                  />
                </TableCell>
                <TableCell>
                  {imageSrc(occasion.icon) ? (
                    <CatalogImage src={occasion.icon} alt="" className="size-10" />
                  ) : (
                    <div className="size-10 rounded-lg border border-dashed" />
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/occasions/${occasion.id}`} className="font-medium hover:underline">
                    {occasion.name}
                  </Link>
                  {occasion.description ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{occasion.description}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <StatusBadge value={occasion.is_active ? "active" : "inactive"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}
