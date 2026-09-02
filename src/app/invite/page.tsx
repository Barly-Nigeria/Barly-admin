import { AuthShell } from "@/components/auth-shell";
import { AcceptInviteForm } from "./invite-form";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token = "", error } = await searchParams;
  return (
    <AuthShell description="Set your name and password to join the Barly admin team.">
      {token ? (
        <AcceptInviteForm token={token} error={error === "1"} />
      ) : (
        <p className="text-sm text-muted-foreground">
          This invite link is missing a token. Open the link from your email.
        </p>
      )}
    </AuthShell>
  );
}
