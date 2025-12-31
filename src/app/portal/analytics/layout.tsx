import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalThemeProvider } from "@/app/components/theme/PortalThemeProvider";

export default async function AnalyticsPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const isAdmin = session.user.role === "admin";
  const hasAnalyticsAccess = session.user.portals?.includes("analytics");

  if (!isAdmin && !hasAnalyticsAccess) {
    redirect("/home");
  }

  return (
    <PortalThemeProvider portal="directo">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        {children}
      </div>
    </PortalThemeProvider>
  );
}
