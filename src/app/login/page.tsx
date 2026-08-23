import { redirect } from "next/navigation";
import { Wine } from "lucide-react";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
            <Wine className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Barly Admin</h1>
          <p className="text-sm text-muted-foreground">
            Employee login for orders, catalog, cash, and guest insights.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <LoginForm error={error === "1"} />
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
