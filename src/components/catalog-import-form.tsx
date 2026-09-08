"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createCatalogImport, startCatalogImport } from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_BYTES = 100 * 1024 * 1024;

export function CatalogImportForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Use a .csv file.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      setError("File must be between 1 byte and 100 MB.");
      return;
    }

    start(async () => {
      try {
        const created = await createCatalogImport({
          filename: file.name,
          content_type: file.type || "text/csv",
          byte_size: file.size,
        });
        if (!created.ok) {
          setError(created.message);
          toast.error(created.message);
          return;
        }

        const put = await fetch(created.data.upload_url ?? "", {
          method: "PUT",
          headers: {
            "Content-Type": "text/csv",
            ...(created.data.required_headers ?? {}),
          },
          body: file,
        });
        if (!put.ok) {
          const message = "Upload to storage failed. Try again.";
          setError(message);
          toast.error(message);
          return;
        }

        const started = await startCatalogImport(created.data.id);
        if (!started.ok) {
          setError(started.message);
          toast.error(started.message);
          return;
        }

        toast.success("Import queued");
        router.push(`/catalog/import/${created.data.id}`);
      } catch {
        const message = "Import failed. Try again.";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="catalog-csv">CSV file</Label>
        <Input
          id="catalog-csv"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">UTF-8 CSV, up to 100 MB / 100,000 rows. The file uploads directly to storage.</p>
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload and import"}
      </Button>
    </form>
  );
}
