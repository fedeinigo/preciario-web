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
      {/* padding-top = alto del navbar fijo */}
      <body className="pt-[var(--nav-h)]">
        <SessionProviderWrapper>
          <Navbar />
          {/* ahora el main sólo descuenta el footer */}
          <main className="min-h-[calc(100vh-var(--footer-h))]">
            {children}
          </main>

          {/* Contenedor global para los toasts */}
          <div
            id="toast-root"
            aria-live="polite"
            aria-atomic="true"
            className="fixed z-[9999] top-[calc(var(--nav-h)+12px)] right-4 flex flex-col gap-2"
          />

          <Footer />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
