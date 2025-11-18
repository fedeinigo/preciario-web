import { redirect } from "next/navigation";

type LegacyMarketingSearchParams = {
  view?: string;
};

export default async function LegacyMarketingPortalPage({
  searchParams,
}: {
  searchParams?: Promise<LegacyMarketingSearchParams>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const view = resolvedParams.view === "history" ? "history" : "generator";
  const target = view === "history" ? "/portal/marketing/history" : "/portal/marketing/generator";
  redirect(target);
}
