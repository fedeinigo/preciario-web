// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

import { Suspense } from "react";
import { cookies } from "next/headers";
import { SpeedInsights } from "@vercel/speed-insights/next";

import Navbar from "@/app/components/Navbar";
import ClientSessionBoundary from "@/app/ClientSessionBoundary";
import SessionProviderWrapper from "./SessionProviderWrapper";
import { LanguageProvider } from "./LanguageProvider";
import { auth } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { loadMessages } from "@/lib/i18n/messages";
import { defaultLocale, localeCookieName, normalizeLocale } from "@/lib/i18n/config";
import OnboardingTeamModal from "@/app/components/features/proposals/OnboardingTeamModal";

export const metadata: Metadata = {
  title: "Wise CX — Preciario",
  description:
    "Panel interno para generación y seguimiento de propuestas comerciales de Wise CX.",
  openGraph: {
    title: "Wise CX — Preciario",
    description:
      "Panel interno para generación y seguimiento de propuestas comerciales de Wise CX.",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wise CX — Preciario",
    description:
      "Panel interno para generación y seguimiento de propuestas comerciales de Wise CX.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get(localeCookieName)?.value ?? null);
  const initialLocale = cookieLocale ?? defaultLocale;
  const session = await auth();
  const initialMessages = await loadMessages(initialLocale);

  if (!isFeatureEnabled("appShellRsc")) {
    return (
      <html lang={initialLocale}>
        <body>
          <LanguageProvider initialLocale={initialLocale} initialMessages={initialMessages}>
            <SessionProviderWrapper session={session ?? undefined}>
              <Suspense fallback={null}>
                <Navbar session={session} />
              </Suspense>
              <OnboardingTeamModal session={session ?? null} />
              <main className="pt-[var(--nav-h)]">{children}</main>
            </SessionProviderWrapper>
          </LanguageProvider>
          <SpeedInsights />
        </body>
      </html>
    );
  }

  return (
    <html lang={initialLocale}>
      <body>
        <LanguageProvider initialLocale={initialLocale} initialMessages={initialMessages}>
          <ClientSessionBoundary session={session ?? null}>
            <Suspense fallback={null}>
              <Navbar session={session} />
            </Suspense>
            <OnboardingTeamModal session={session ?? null} />
            <main className="pt-[var(--nav-h)]">{children}</main>
          </ClientSessionBoundary>
        </LanguageProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
