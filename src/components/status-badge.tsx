import { Badge } from "@/components/ui/badge";

const styles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  confirmed: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  fulfilled: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  active: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  archived: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  paid: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  inflow: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  outflow: "bg-rose-500/15 text-rose-200 border-rose-500/30",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={`capitalize ${styles[value] ?? ""}`}>
      {value.replaceAll("_", " ")}
    </Badge>
  );
}
