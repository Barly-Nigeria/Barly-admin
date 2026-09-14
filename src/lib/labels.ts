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
