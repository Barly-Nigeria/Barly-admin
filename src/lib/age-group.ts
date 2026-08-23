export const AGE_BANDS = [
  { id: "18-24", label: "18–24", min: 18, max: 24 },
  { id: "25-34", label: "25–34", min: 25, max: 34 },
  { id: "35-44", label: "35–44", min: 35, max: 44 },
  { id: "45+", label: "45+", min: 45, max: 200 },
] as const;

export function ageGroup(age: number) {
  const band = AGE_BANDS.find((b) => age >= b.min && age <= b.max);
  return band?.label ?? "Unknown";
}

export function ageGroupId(age: number) {
  return AGE_BANDS.find((b) => age >= b.min && age <= b.max)?.id ?? "unknown";
}
