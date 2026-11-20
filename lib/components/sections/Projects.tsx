import { projects, sections } from "@/lib/data/portfolio";
import Section from "@/lib/components/layout/Section";
import Card from "@/lib/components/ui/Card";
import Chip from "@/lib/components/ui/Chip";
import ExternalLink from "@/lib/components/ui/ExternalLink";

export default function Projects() {
  return (
    <Section id="projects" title={sections.projects.title} intro={sections.projects.intro}>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <Card key={p.title} className={p.featured ? "md:col-span-2" : ""}>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className={`text-neutral-50 ${p.featured ? "text-xl" : "text-base"}`}>
                {p.title}
              </h3>
              <span className="text-xs tabular-nums text-neutral-500">{p.year}</span>
            </div>
            <p className="mt-2 max-w-prose text-neutral-400">{p.description}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {p.stack.map((tech) => (
                <li key={tech}>
                  <Chip>{tech}</Chip>
                </li>
              ))}
            </ul>
            {(p.repo || p.demo) && (
              <div className="mt-4 flex gap-5 text-xs">
                {p.repo && <ExternalLink href={p.repo}>code</ExternalLink>}
                {p.demo && <ExternalLink href={p.demo}>live demo</ExternalLink>}
              </div>
            )}
          </Card>
        ))}
      </div>
    </Section>
  );
}