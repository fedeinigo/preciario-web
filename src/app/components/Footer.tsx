"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer" style={{ height: "var(--footer-h)" }}>
      <div className="footer-inner">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Wise CX"
            width={110}
            height={28}
            className="h-6 w-auto object-contain"
            priority
          />
          <span>© 2025 Wise CX — Soluciones Inteligentes</span>
        </div>

        <div className="text-right">
          Desarrollado por Federico Iñigo ·{" "}
          <a
            href="mailto:federico.i@wisecx.com"
            className="underline decoration-white/40 hover:decoration-white"
          >
            federico.i@wisecx.com
          </a>
        </div>
      </div>
    </footer>
  );
}
