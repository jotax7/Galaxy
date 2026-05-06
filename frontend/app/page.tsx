import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import MCPProtection from "@/components/sections/MCPProtection";
import Pipeline from "@/components/sections/Pipeline";
import Features from "@/components/sections/Features";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-900">
      <Nav />
      <Hero />
      <MCPProtection />
      <Pipeline />
      <Features />
      <Footer />
    </main>
  );
}
