import { LoginForm } from "@/app/login/login-form";
import { AuthShell } from "@/components/auth-shell";

export function LoginScreen({ error = false }: { error?: boolean }) {
  return (
    <AuthShell description="Employee login for orders, invoices, vendors, and guest insights.">
      <LoginForm error={error} />
    </AuthShell>
  );
}
