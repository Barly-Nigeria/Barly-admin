"use client";

import { useFormStatus } from "react-dom";
import { acceptInviteAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AcceptInviteForm({ token, error }: { token: string; error: boolean }) {
  return (
    <form action={acceptInviteAction} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          This invite is invalid or expired. Ask an admin to send a new one.
        </p>
      )}
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="first_name">First name</Label>
        <Input id="first_name" name="first_name" required maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="last_name">Last name</Label>
        <Input id="last_name" name="last_name" required maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
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
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Accept invite"}
    </Button>
  );
}
