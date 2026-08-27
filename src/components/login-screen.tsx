import { LoginForm } from "@/app/login/login-form";
import { BrandLogo } from "@/components/brand-logo";

export function LoginScreen({ error = false }: { error?: boolean }) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <BrandLogo size="lg" />
          </div>
          <p className="text-sm text-muted-foreground">
            Employee login for orders, invoices, vendors, and guest insights.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <LoginForm error={error} />
        </div>
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Demo accounts</p>
          <p className="mt-2">
            Manager: <code>olivia@barly.admin</code> / <code>barly-admin</code>
          </p>
          <p>
            Staff: <code>tunde@barly.ops</code> / <code>barly-ops</code>
          </p>
        </div>
      </div>
    </main>
  );
}
