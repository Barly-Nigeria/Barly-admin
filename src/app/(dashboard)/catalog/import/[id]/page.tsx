import { notFound } from "next/navigation";
import { adminAuthed } from "@/lib/auth";
import { CatalogImportStatus } from "@/components/catalog-import-status";
import { PageHeader } from "@/components/catalog-chrome";
import type { CatalogImport, CatalogImportErrorPage } from "@/lib/barly-api";

export default async function CatalogImportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobRes = await adminAuthed<CatalogImport>(`/v1/admin/catalog/imports/${id}`);
  if (jobRes.status === 404 || !jobRes.body?.data) {
    notFound();
  }
  const job = jobRes.body.data;

  let errors: CatalogImportErrorPage | null = null;
  if (job.status === "failed" && job.error_count > 0) {
    const errRes = await adminAuthed<CatalogImportErrorPage>(
      `/v1/admin/catalog/imports/${id}/errors?page=1&limit=20`,
    );
    errors = errRes.body?.data ?? null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalog import"
        description="Processing runs in the background. This page updates until the job finishes."
        back={{ href: "/catalog/import", label: "Imports" }}
      />
      <CatalogImportStatus initial={job} initialErrors={errors} />
    </div>
  );
}
