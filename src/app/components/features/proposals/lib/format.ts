const USD_FORMATTER = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatUSD = (n: number) => USD_FORMATTER.format(n);

export function formatDateTime(dateLike: string | number | Date): string {
  const d = new Date(dateLike);
  return DATE_TIME_FORMATTER.format(d);
}
