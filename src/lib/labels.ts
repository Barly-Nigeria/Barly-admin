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
  { id: "paid", label: "Paid" },
  { id: "payment_failed", label: "Payment failed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export const PAYMENT_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "success", label: "Success" },
  { id: "failed", label: "Failed" },
] as const;

export const DELIVERY_STATUSES = [
  { id: "none", label: "No delivery" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "picked_up", label: "Picked up" },
  { id: "in_transit", label: "In transit" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "booking_failed", label: "Booking failed" },
] as const;

export const VENDOR_CATEGORIES = [
  { id: "spirits", label: "Spirits" },
  { id: "mixers", label: "Mixers" },
  { id: "logistics", label: "Logistics" },
  { id: "glassware", label: "Glassware" },
  { id: "other", label: "Other" },
] as const;

export function vendorCategoryLabel(id: string) {
  return VENDOR_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
