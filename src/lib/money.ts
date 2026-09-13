export function naira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format API money fields stored in kobo (minor units). */
export function nairaFromKobo(kobo: number) {
  return naira((kobo ?? 0) / 100);
}
