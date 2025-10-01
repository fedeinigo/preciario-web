// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

import Navbar from "@/app/components/Navbar";
import ClientSessionBoundary from "@/app/ClientSessionBoundary";
import SessionProviderWrapper from "./SessionProviderWrapper";
import { auth } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/feature-flags";

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
      <html lang="es">
        <body>
          <SessionProviderWrapper>
            <Navbar />
            <main className="pt-[var(--nav-h)]">{children}</main>
          </SessionProviderWrapper>
        </body>
      </html>
    );
  }

  const session = await auth();

  return (
    <html lang="es">
      <body>
        <ClientSessionBoundary session={session ?? null}>
          <Navbar session={session} />
          <main className="pt-[var(--nav-h)]">{children}</main>
        </ClientSessionBoundary>
      </body>
    </html>
  );
}
