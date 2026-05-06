import Hero from "@/components/sections/Hero";
import StatsBar from "@/components/sections/StatsBar";
import ScrutinizerPipeline from "@/components/sections/ScrutinizerPipeline";
import ProblemSolution from "@/components/sections/ProblemSolution";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-900">
      <Hero />
      <StatsBar />
      <ScrutinizerPipeline />
      <ProblemSolution />
      <Footer />
    </main>
  );
}
