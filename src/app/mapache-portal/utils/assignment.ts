import type { AssignmentRatios } from "../assignment-types";
import type { MapacheUser } from "../user-types";

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = roundToTwoDecimals(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function ratioToPercentageInput(ratio: number): string {
  return formatPercentage(ratio * 100);
}

export function parsePercentageInput(value: string): number | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export type AssignmentWeight = { userId: string; weight: number };

export function normalizeAssignmentWeights(
  ratios: AssignmentRatios,
  users: MapacheUser[],
): AssignmentWeight[] {
  if (users.length === 0) return [];
  const entries = users.map((user) => ({
    userId: user.id,
    weight:
      typeof ratios[user.id] === "number" && Number.isFinite(ratios[user.id])
        ? ratios[user.id]
        : 0,
  }));

  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    const fallback = 1 / users.length;
    return entries.map((entry) => ({ userId: entry.userId, weight: fallback }));
  }

  return entries.map((entry) => ({
    userId: entry.userId,
    weight: entry.weight > 0 ? entry.weight / totalWeight : 0,
  }));
}
