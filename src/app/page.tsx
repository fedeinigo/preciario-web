// src/app/page.tsx

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { Card } from "@/app/components/ui/card";

// 👇 importamos el feature (tiene default export)
import ProposalsFeature from "@/app/components/features/proposals";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-0">
          <ProposalsFeature />
        </Card>
      </main>
      <Footer />
    </>
  );
}
