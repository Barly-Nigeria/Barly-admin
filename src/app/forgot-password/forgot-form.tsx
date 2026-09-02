"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({
  sent,
  email,
}: {
  sent: boolean;
  email: string;
}) {
  return (
    <form action={forgotPasswordAction} className="space-y-4">
      {sent && (
        <p className="rounded-lg border bg-muted px-3 py-2 text-sm">
          If an account exists with this email, a password reset code has been sent.
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
      <Submit />
      {sent ? (
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            className="underline underline-offset-4"
          >
            I have a reset code
          </Link>
        </p>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      )}
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Send reset code"}
    </Button>
  );
}
