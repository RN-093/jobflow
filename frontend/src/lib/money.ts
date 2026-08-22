import type { SalaryPeriod } from "@/types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
};

function compact(amount: number): string {
  if (amount >= 1000) {
    const thousands = amount / 1000;
    const rounded = Number.isInteger(thousands) ? thousands.toString() : thousands.toFixed(1);
    return `${rounded}k`;
  }
  return amount.toString();
}

const PERIOD_SUFFIX: Record<SalaryPeriod, string> = {
  annual: "/yr",
  monthly: "/mo",
  weekly: "/wk",
  daily: "/day",
  hourly: "/hr",
};

export function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null,
  period: SalaryPeriod | null
): string | null {
  if (min == null && max == null) return null;
  const symbol = currency ? CURRENCY_SYMBOLS[currency] ?? `${currency} ` : "$";
  const suffix = period ? PERIOD_SUFFIX[period] : "";

  if (min != null && max != null) {
    return `${symbol}${compact(min)} – ${symbol}${compact(max)}${suffix}`;
  }
  const only = min ?? max;
  return `${symbol}${compact(only as number)}${suffix}`;
}
