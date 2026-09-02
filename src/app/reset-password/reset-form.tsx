"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { resetPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ error, email }: { error: boolean; email: string }) {
  return (
    <form action={resetPasswordAction} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          That reset code is invalid or expired.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={email}
          autoComplete="username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="otp">Reset code</Label>
        <Input
          id="otp"
          name="otp"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoComplete="one-time-code"
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
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="underline underline-offset-4">
          Request a new code
        </Link>
      </p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Resetting…" : "Reset password"}
    </Button>
  );
}
