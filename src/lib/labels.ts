import { AGE_BANDS } from "./age-group";

export const OCCASIONS = [
  { id: "birthday", label: "Birthday" },
  { id: "wedding", label: "Wedding" },
  { id: "corporate", label: "Corporate" },
  { id: "house-party", label: "House party" },
  { id: "bridal-shower", label: "Bridal shower" },
  { id: "baby-shower", label: "Baby shower" },
] as const;

export function occasionLabel(id: string) {
  return OCCASIONS.find((o) => o.id === id)?.label ?? id;
}

export function campaignAudienceLabel(audience: string) {
  if (audience === "all") return "All customers";
  if (audience === "birthdays-14d") return "Birthdays in 14 days";
  if (audience.startsWith("occasion:")) {
    return `Occasion · ${occasionLabel(audience.slice("occasion:".length))}`;
  }
  if (audience.startsWith("age:")) {
    const band = AGE_BANDS.find((b) => b.id === audience.slice(4));
    return `Age · ${band?.label ?? audience}`;
  }
  return audience;
}

export const ORDER_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "fulfilled", label: "Fulfilled" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export function vendorCategoryLabel(id: string) {
  const map: Record<string, string> = {
    spirits: "Spirits",
    mixers: "Mixers",
    logistics: "Logistics",
    glassware: "Glassware",
  };
  return map[id] ?? id;
}
