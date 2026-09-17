"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function useBulkSelection(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = ids.some((id) => selected.has(id));

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAllLoaded = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          if (checked) next.add(id);
          else next.delete(id);
        }
        return next;
      });
    },
    [ids],
  );

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return {
    selected,
    selectedIds,
    allSelected,
    someSelected,
    toggleOne,
    toggleAllLoaded,
    clear,
  };
}

export function RowCheckbox({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <input
      type="checkbox"
      className="size-4 rounded border"
      checked={checked}
      aria-label={ariaLabel}
      onChange={(event) => onCheckedChange(event.target.checked)}
      onClick={(event) => event.stopPropagation()}
    />
  );
}

export function HeaderCheckbox({
  allSelected,
  someSelected,
  onToggleAll,
}: {
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: (checked: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      className="size-4 rounded border"
      checked={allSelected}
      ref={(el) => {
        if (el) el.indeterminate = !allSelected && someSelected;
      }}
      aria-label="Select all loaded rows"
      onChange={(event) => onToggleAll(event.target.checked)}
    />
  );
}

export function BulkSelectBar({
  selectedIds,
  label,
  onDeactivate,
  onDone,
}: {
  selectedIds: string[];
  label: string;
  onDeactivate: (ids: string[]) => Promise<{ ok: boolean; message?: string }>;
  onDone?: (ids: string[]) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const count = selectedIds.length;

  if (count === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
        <p className="text-sm">
          <span className="font-medium">{count}</span> selected
        </p>
        <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
          Delete ({count})
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Deactivate {count} {label}?
            </DialogTitle>
            <DialogDescription>
              Selected items will be set inactive and hidden from the storefront. You can still see them
              in admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                const ids = [...selectedIds];
                start(async () => {
                  const result = await onDeactivate(ids);
                  if (!result.ok) {
                    toast.error(result.message || "Could not deactivate");
                    return;
                  }
                  toast.success("Deactivated");
                  setOpen(false);
                  onDone?.(ids);
                  router.refresh();
                });
              }}
            >
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
