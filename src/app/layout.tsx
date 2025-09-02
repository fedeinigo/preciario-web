// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SessionProviderWrapper from "@/app/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "Wise CX — Preciario",
  description: "Generador de propuestas y gestión interna",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProviderWrapper>
          <Navbar />
          {/* el main ocupa exactamente el alto restante entre navbar y footer */}
          <main className="min-h-[calc(100vh-var(--nav-h)-var(--footer-h))]">
            {children}
          </main>
          <Footer />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
