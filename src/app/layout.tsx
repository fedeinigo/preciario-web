// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

import Navbar from "@/app/components/Navbar";
import ClientSessionBoundary from "@/app/ClientSessionBoundary";
import SessionProviderWrapper from "./SessionProviderWrapper";
import { LanguageProvider } from "./LanguageProvider";
import { auth } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { defaultLocale } from "@/lib/i18n/config";

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
  if (!isFeatureEnabled("appShellRsc")) {
    return (
      <html lang={defaultLocale}>
        <body>
          <LanguageProvider>
            <SessionProviderWrapper>
              <Navbar />
              <main className="pt-[var(--nav-h)]">{children}</main>
            </SessionProviderWrapper>
          </LanguageProvider>
        </body>
      </html>
    );
  }

  const session = await auth();

  return (
    <html lang={defaultLocale}>
      <body>
        <LanguageProvider>
          <ClientSessionBoundary session={session ?? null}>
            <Navbar session={session} />
            <main className="pt-[var(--nav-h)]">{children}</main>
          </ClientSessionBoundary>
        </LanguageProvider>
      </body>
    </html>
  );
}
