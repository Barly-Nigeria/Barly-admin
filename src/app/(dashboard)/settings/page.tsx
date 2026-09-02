import { getSession } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const session = await getSession();
  const { error, updated } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          {session?.email} · {session?.role}
        </p>
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Change password</h2>
        <ChangePasswordForm error={error === "1"} updated={updated === "1"} />
      </div>
    </div>
  );
}
