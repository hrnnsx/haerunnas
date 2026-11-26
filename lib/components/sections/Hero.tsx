import { profile } from "@/lib/data/portfolio";
import Button from "@/lib/components/ui/Button";
import ScrambleText from "@/lib/components/ui/ScrambleText";

export default function Hero() {
  return (
    <section id="top" className="flex min-h-[88svh] flex-col justify-center pb-10 pt-28">
      {profile.status && (
        <p className="mb-6 flex items-center gap-2 text-neutral-400">
          <span aria-hidden className="size-1.5 bg-neutral-100" />
          {profile.status}
        </p>
      )}

      <h1 className="wrap-break-word text-5xl font-medium tracking-tighter text-neutral-50 md:text-7xl">
        <ScrambleText text={profile.name} />
      </h1>

      <p className="mt-6 max-w-xl text-xl text-neutral-200 md:text-2xl">{profile.tagline}</p>
      <p className="mt-4 max-w-prose text-neutral-400">{profile.summary}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="#projects" variant="solid">
          View projects
        </Button>
        <Button href={`mailto:${profile.email}`}>Get in touch</Button>
        {profile.resumeHref && <Button href={profile.resumeHref}>Resume</Button>}
      </div>

      <dl className="mt-14 grid gap-6 border-t border-dashed border-neutral-800 pt-6 sm:grid-cols-3">
        {profile.facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs text-neutral-500">{fact.label}</dt>
            <dd className="mt-1 text-neutral-200">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}