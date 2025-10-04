import { fetchWonProposalsTotal } from "@/app/components/features/proposals/lib/proposals-response";

export type NavbarProgressRange = { from: string; to: string };

export type FetchWonTotalFn = (
  params: { userEmail: string; from: string; to: string },
  init?: RequestInit,
) => Promise<number>;

export async function loadNavbarProgress(
  args: { userEmail: string; range: NavbarProgressRange },
  fetchTotal: FetchWonTotalFn = fetchWonProposalsTotal,
): Promise<number> {
  return fetchTotal({
    userEmail: args.userEmail,
    from: args.range.from,
    to: args.range.to,
  });
}
