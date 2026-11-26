import { skills, sections } from "@/lib/data/portfolio";
import Section from "@/lib/components/layout/Section";
import Chip from "@/lib/components/ui/Chip";

export default function Skills() {
  return (
    <Section id="skills" title={sections.skills.title} intro={sections.skills.intro}>
      <div className="grid gap-8 sm:grid-cols-2">
        {skills.map((group) => (
          <div key={group.label}>
            <h3 className="mb-3 text-white">{group.label}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item}>
                  <Chip>{item}</Chip>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}