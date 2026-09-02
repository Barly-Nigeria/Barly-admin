import { adminAuthed, getSession } from "@/lib/auth";
import type { TeamPayload } from "@/lib/barly-api";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeactivateButton, InviteForm, RevokeInviteButton } from "./team-forms";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string }>;
}) {
  const session = await getSession();
  const { error, invited } = await searchParams;

  if (session?.role !== "admin") {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">Only admins can manage the team.</p>
      </div>
    );
  }

  const res = await adminAuthed<TeamPayload>("/v1/admin/team");
  const members = res.body?.data?.members ?? [];
  const invites = res.body?.data?.invites ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          Invite admins and staff. Only admins can send invites.
        </p>
      </div>

      {invited ? (
        <p className="rounded-lg border bg-muted px-3 py-2 text-sm">Invite sent.</p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Invite someone</CardTitle>
          <CardDescription>They receive an email with a link to set a password.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Members</h2>
        {members.length === 0 ? (
          <EmptyState title="No members" description="Seed the first admin, then invite the rest." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const name = [member.first_name, member.last_name].filter(Boolean).join(" ") || "—";
                const isSelf = member.id === session.id;
                return (
                  <TableRow key={member.id}>
                    <TableCell>{name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell className="capitalize">{member.role}</TableCell>
                    <TableCell>
                      <StatusBadge value={member.is_active ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSelf && member.is_active ? <DeactivateButton id={member.id} /> : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Pending invites</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invites.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell className="capitalize">{invite.role}</TableCell>
                  <TableCell>{invite.expires_at ? new Date(invite.expires_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-right">
                    <RevokeInviteButton id={invite.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
