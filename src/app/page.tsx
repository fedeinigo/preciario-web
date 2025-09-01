// src/app/page.tsx
import ProposalApp from "@/app/components/features/proposals";

export default function HomePage() {
  // Ancho completo; solo un padding lateral mínimo para respiración
  return (
    <div className="w-full px-2 md:px-4">
      <ProposalApp />
    </div>
  );
}
