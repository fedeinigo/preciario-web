// src/app/portal/marketing/page.tsx
import { redirect } from "next/navigation";

export default function MarketingPortalRedirect() {
  redirect("/portal/marketing/generator");
}
