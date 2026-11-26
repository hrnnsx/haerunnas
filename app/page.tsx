import Butterflies from "@/lib/components/Butterflies";
import Header from "@/lib/components/layout/Header";
import Footer from "@/lib/components/layout/Footer";
import Hero from "@/lib/components/sections/Hero";
import Projects from "@/lib/components/sections/Projects";
import Experience from "@/lib/components/sections/Experience";
import Skills from "@/lib/components/sections/Skills";
import Education from "@/lib/components/sections/Education";
import Certifications from "@/lib/components/sections/Certification";

export default function Home() {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <Butterflies theme="dark" white={1} butterflyOpacity={0.7} density={0.23} />
      </div>

      <div className="relative z-10 select-none">
        <Header />
        <main className="mx-auto max-w-5xl px-6">
          <Hero />
          <Projects />
          <Experience />
          <Skills />
          <Education />
          <Certifications />
        </main>
        <Footer />
      </div>
    </>
  );
}