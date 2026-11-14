import Butterflies from "@/lib/components/Butterflies";
import BracketLink from "@/lib/components/BracketLink";
import Section from "@/lib/components/Section";

const NAV = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/hrnnsx" },
  { label: "LinkedIn", href: "https://linkedin.com/in/haerunnas" },
];

const PROJECTS = [
  { title: "[ Project Two ]", desc: "idk man, it just a place holder.", href: "#" },
  { title: "[ Project One ]", desc: "idk man, it just a place holder.", href: "#" },
];

const LABEL = "font-mono text-xs uppercase tracking-widest text-white/50";

export default function Home() {
  return (
    <main>
      <Butterflies theme="dark" white={1} butterflyOpacity={1} density={0.2} />

      {/* Hero */}
      <section className="relative z-10 flex min-h-screen w-full flex-col justify-between px-6 py-8 sm:px-12 sm:py-12">
        <header className={`flex items-center justify-between ${LABEL}`}>
          <span className="select-none">[ Haerunnas ]</span>
          <nav className="flex gap-6">
            {NAV.map(({ label, href }) => (
              <BracketLink key={href} href={href}>{label}</BracketLink>
            ))}
          </nav>
        </header>

        <div className="max-w-3xl select-none">
          <p className={`mb-4 ${LABEL}`}>[ Software Developer ] . [ South Tangerang, Indonesia ]</p>
          <h1 className="font-mono text-4xl tracking-tight sm:text-6xl md:text-7xl">Haerunnas</h1>
          <p className="mt-6 max-w-xl text-base text-white/60 sm:text-lg">
            Backend-focused Computer Science student at UIN Jakarta with experience building
            RESTful APIs and backend services...
          </p>
        </div>

        <footer className="flex gap-5 self-end font-mono text-xs text-white/40 select-none">
          {SOCIALS.map(({ label, href }) => (
            <BracketLink key={href} href={href} external>{label}</BracketLink>
          ))}
        </footer>
      </section>

      <Section id="work" label="Work">
        <div className="grid gap-4 md:grid-cols-2">
          {PROJECTS.map(({ title, desc, href }) => (
            <a
              key={title}
              href={href}
              className="rounded-2xl border border-white/10 bg-white/3 p-6 hover:border-white/30 hover:bg-white/6"
            >
              <h3 className="font-mono text-lg">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{desc}</p>
            </a>
          ))}
        </div>
      </Section>

      <Section id="about" label="About">
        <div className="max-w-2xl space-y-4 text-white/70">
          <p>lorem ipsum dolor sit amet.</p>
          <p>idk man, it just a place holder.</p>
        </div>
      </Section>

      <Section id="contact" label="Contact">
        <a
          href="mailto:nassjourney@gmail.com"
          className="font-mono text-2xl underline-offset-4 hover:underline sm:text-4xl"
        >
          nassjourney@gmail.com
        </a>
      </Section>
    </main>
  );
}