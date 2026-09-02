import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const { error, email = "" } = await searchParams;
  return (
    <AuthShell description="Enter the 6-digit code from your email and choose a new password.">
      <ResetPasswordForm error={error === "1"} email={email} />
    </AuthShell>
  );
}
