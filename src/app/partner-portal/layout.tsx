import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/react";

const navLinks = [
  { href: "/partner-portal/learning/fundamentals", label: "Learning" },
  { href: "/partner-portal/resources/documentation", label: "Resources" },
  { href: "/partner-portal/certification", label: "Certification" },
];

export default function PartnerPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="-mt-[var(--nav-h)] flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4">
          <Link href="/partner-portal" className="flex items-center gap-3">
            <Image
              src="/wcx_logo_negro.png"
              alt="WCX logo"
              width={180}
              height={32}
              className="h-8 w-auto"
              priority
            />
            
          </Link>
          <nav
            aria-label="Partner portal primary"
            className="flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="#"
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sign In
            </Link>
            <Link
              href="#"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Analytics />
    </div>
  );
}
