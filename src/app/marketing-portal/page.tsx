import { redirect } from "next/navigation";

export default function LegacyMarketingPortalPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const view = searchParams?.view === "history" ? "history" : "generator";
  const target = view === "history" ? "/portal/marketing/history" : "/portal/marketing/generator";
  redirect(target);
}
