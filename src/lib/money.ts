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

/** Convert a naira major amount typed in admin forms to kobo for the API. */
export function nairaToKobo(nairaMajor: number) {
  return Math.round(nairaMajor * 100);
}

/** Show kobo from the API as a naira major string for form inputs. */
export function koboToNairaInput(kobo: number | null | undefined) {
  return String((kobo ?? 0) / 100);
}
