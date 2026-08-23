export function daysUntilBirthday(birthday: Date, from = new Date()) {
  const next = new Date(from.getFullYear(), birthday.getMonth(), birthday.getDate());
  if (next < startOfDay(from)) {
    next.setFullYear(from.getFullYear() + 1);
  }
  const ms = startOfDay(next).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
