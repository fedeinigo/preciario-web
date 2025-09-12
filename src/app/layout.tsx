// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import SessionProviderWrapper from "./SessionProviderWrapper";
import Navbar from "@/app/components/Navbar"; // <- existe en tu proyecto

export const metadata: Metadata = {
  title: "Wise CX — Preciario",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
