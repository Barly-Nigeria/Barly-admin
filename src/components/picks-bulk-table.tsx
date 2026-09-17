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
import { nairaFromKobo } from "@/lib/money";
import { bulkArchivePicksAction } from "@/app/actions/catalog";
import type { CatalogPick } from "@/lib/barly-api";

export function PicksBulkTable({ initial }: { initial: CatalogPick[] }) {
  const [items, setItems] = useState(initial);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const selection = useBulkSelection(ids);

  return (
    <div className="space-y-2">
      <BulkSelectBar
        selectedIds={selection.selectedIds}
        label="picks"
        onDeactivate={bulkArchivePicksAction}
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
              <TableHead className="w-14">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((pick) => (
              <TableRow key={pick.id}>
                <TableCell>
                  <RowCheckbox
                    checked={selection.selected.has(pick.id)}
                    onCheckedChange={(checked) => selection.toggleOne(pick.id, checked)}
                    ariaLabel={`Select ${pick.name}`}
                  />
                </TableCell>
                <TableCell>
                  {pick.image_url ? (
                    <CatalogImage src={pick.image_url} alt="" className="size-10" />
                  ) : (
                    <div className="size-10 rounded-lg border border-dashed" />
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/picks/${pick.id}`} className="font-medium hover:underline">
                    {pick.name}
                  </Link>
                  {pick.sub_text ? <p className="text-xs text-muted-foreground">{pick.sub_text}</p> : null}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {(pick.tags ?? []).join(", ") || "—"}
                </TableCell>
                <TableCell>
                  {pick.starting_price != null ? nairaFromKobo(pick.starting_price) : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge value={pick.is_active ? "active" : "inactive"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}
