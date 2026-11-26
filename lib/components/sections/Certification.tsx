import { certifications, sections } from "@/lib/data/portfolio";
import Section from "@/lib/components/layout/Section";
import Card from "@/lib/components/ui/Card";
import ExternalLink from "@/lib/components/ui/ExternalLink";

export default function Certifications() {
  return (
    <Section
      id="certifications"
      title={sections.certifications.title}
      intro={sections.certifications.intro}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {certifications.map((c) => (
          <Card key={`${c.name}-${c.year}`}>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-neutral-50">
                {c.href ? <ExternalLink href={c.href}>{c.name}</ExternalLink> : c.name}
              </h3>
              <span className="text-xs tabular-nums text-neutral-500">{c.year}</span>
            </div>
            <p className="mt-1 text-neutral-400">{c.issuer}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}