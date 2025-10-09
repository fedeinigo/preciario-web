import { getQuarterFromDate } from "@/lib/quarter";

export type NavbarProgressRange = { from: string; to: string };

export type FetchWonProgressFn = (
  params: { year: number; quarter: number; email: string },
  init?: RequestInit,
) => Promise<number>;

async function defaultFetchWonProgress(
  params: { year: number; quarter: number; email: string },
  init?: RequestInit,
): Promise<number> {
  const searchParams = new URLSearchParams({
    year: String(params.year),
    quarter: String(params.quarter),
    email: params.email,
  });

  const response = await fetch(`/api/goals/wins?${searchParams.toString()}`, {
    cache: "no-store",
    ...(init ?? {}),
  });
  if (!response.ok) return 0;

  const payload = (await response.json()) as { progress?: number };
  const progress = Number(payload.progress ?? 0);
  return Number.isFinite(progress) ? progress : 0;
}

export async function loadNavbarProgress(
  args: { userEmail: string; range: NavbarProgressRange },
  fetchTotal: FetchWonProgressFn = defaultFetchWonProgress,
): Promise<number> {
  const fromDate = new Date(args.range.from);
  if (Number.isNaN(fromDate.getTime())) return 0;
  const year = fromDate.getUTCFullYear();
  const quarter = getQuarterFromDate(fromDate);

  try {
    return await fetchTotal({ year, quarter, email: args.userEmail });
  } catch {
    return 0;
  }
}
