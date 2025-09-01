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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Proveedor de sesión para toda la app */}
        <SessionProviderWrapper>
          {/* Shell global: Navbar arriba, Footer abajo */}
          <Navbar />

          {/* Contenido de cada página */}
          <main className="min-h-screen">
            {children}
          </main>

          <Footer />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
