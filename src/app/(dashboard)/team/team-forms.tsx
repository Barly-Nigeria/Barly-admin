"use client";

import { useFormStatus } from "react-dom";
import {
  deactivateMemberAction,
  inviteMemberAction,
  revokeInviteAction,
} from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteForm() {
  return (
    <form action={inviteMemberAction} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue="staff"
          className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <InviteSubmit />
    </form>
  );
}

function InviteSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send invite"}
    </Button>
  );
}

export function RevokeInviteButton({ id }: { id: string }) {
  return (
    <form action={revokeInviteAction}>
      <input type="hidden" name="id" value={id} />
      <RevokeSubmit />
    </form>
  );
}

function RevokeSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? "Revoking…" : "Revoke"}
    </Button>
  );
}

export function DeactivateButton({ id }: { id: string }) {
  return (
    <form action={deactivateMemberAction}>
      <input type="hidden" name="id" value={id} />
      <DeactivateSubmit />
    </form>
  );
}

function DeactivateSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? "Deactivating…" : "Deactivate"}
    </Button>
  );
}
