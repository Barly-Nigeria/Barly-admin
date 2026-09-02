import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "./forgot-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string }>;
}) {
  const { sent, email = "" } = await searchParams;
  return (
    <AuthShell description="We’ll email a 6-digit code if this address has an admin account.">
      <ForgotPasswordForm sent={sent === "1"} email={email} />
    </AuthShell>
  );
}
