import { experience, sections } from "@/lib/data/portfolio";
import Section from "@/lib/components/layout/Section";
import Chip from "@/lib/components/ui/Chip";
import { Timeline, TimelineItem } from "@/lib/components/ui/Timeline";

export default function Experience() {
  return (
    <Section id="experience" title={sections.experience.title} intro={sections.experience.intro}>
      <Timeline>
        {experience.map((job) => (
          <TimelineItem
            key={`${job.company}-${job.period}`}
            title={job.role}
            subtitle={job.company}
            meta={job.period}
          >
            <ul className="space-y-1.5">
              {job.points.map((point) => (
                <li key={point} className="flex gap-3">
                  <span aria-hidden className="text-neutral-600">-</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            {job.stack && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {job.stack.map((tech) => (
                  <li key={tech}>
                    <Chip>{tech}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </TimelineItem>
        ))}
      </Timeline>
    </Section>
  );
}