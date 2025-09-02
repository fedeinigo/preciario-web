// src/app/page.tsx
"use client";

import ProposalApp from "@/app/components/features/proposals";

export default function HomePage() {
  // ESTA página NO monta Navbar ni Footer.
  // Navbar y Footer ya vienen desde layout.tsx.
  return <ProposalApp />;
}
