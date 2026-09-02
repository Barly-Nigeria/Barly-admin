"use client";

import { useFormStatus } from "react-dom";
import { changePasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm({
  error,
  updated,
}: {
  error: boolean;
  updated: boolean;
}) {
  return (
    <form action={changePasswordAction} className="max-w-md space-y-4">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Current password is incorrect, or the new password is invalid.
        </p>
      )}
      {updated && (
        <p className="rounded-lg border bg-muted px-3 py-2 text-sm">
          Password updated.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="current_password">Current password</Label>
        <Input
          id="current_password"
          name="current_password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new_password">New password</Label>
        <Input
          id="new_password"
          name="new_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Change password"}
    </Button>
  );
}
