import "./globals.css";
import { ReactNode } from "react";
import SessionProviderWrapper from "./SessionProviderWrapper";

export const metadata = {
  title: "Wise CX - Preciario Web",
  description: "Sistema de generación de propuestas",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
