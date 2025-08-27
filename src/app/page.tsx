import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProposalSystem from "./components/ProposalSystem";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-0">
          <ProposalSystem />
        </Card>
      </main>
      <Footer />
    </>
  );
}
