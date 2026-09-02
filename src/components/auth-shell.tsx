import { BrandLogo } from "@/components/brand-logo";

export function AuthShell({
  children,
  description,
}: {
  children: React.ReactNode;
  description: string;
}) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <BrandLogo size="lg" />
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
