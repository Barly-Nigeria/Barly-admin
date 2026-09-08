import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {back ? (
          <Link href={back.href} className="text-sm text-muted-foreground hover:underline">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className={cn("text-2xl font-semibold tracking-tight", back && "mt-2")}>{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

const CATALOG_NAV = [
  { id: "products", href: "/catalog", label: "Products" },
  { id: "categories", href: "/catalog/categories", label: "Categories" },
  { id: "add-ons", href: "/catalog/add-ons", label: "Add-ons" },
] as const;

export function CatalogSubnav({ active }: { active: (typeof CATALOG_NAV)[number]["id"] }) {
  return (
    <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
      {CATALOG_NAV.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium",
            active === item.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border">{children}</div>;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}

export function MetaList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{item.label}</dt>
          <dd className="mt-1 text-sm break-words">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ChipList({ items, empty = "None assigned." }: { items: string[]; empty?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full border px-2.5 py-0.5 text-xs">
          {item}
        </span>
      ))}
    </div>
  );
}

export function CatalogImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex size-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
        No image
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="size-24 rounded-lg border object-cover" />
  );
}
